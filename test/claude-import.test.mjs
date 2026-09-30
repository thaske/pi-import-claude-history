import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const extensionUrl = new URL("../src/claude-import.ts", import.meta.url).href;
const commandRunner = `
	const { default: registerExtension } = await import(process.argv[1]);
	let command;
	registerExtension({ registerCommand(name, definition) {
		if (name === "import-claude") command = definition;
	} });
	const suggestions = command.getArgumentCompletions("");
	const notifications = [];
	await command.handler(process.argv[2], {
		ui: { notify(message, level) { notifications.push({ message, level }); } },
	});
	console.log(JSON.stringify({ suggestions, notifications }));
`;

function createSandbox(t) {
	const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "claude-import-test-")));
	t.after(() => fs.rmSync(home, { recursive: true, force: true }));
	const cwd = path.join(home, "workspace", "project");
	fs.mkdirSync(cwd, { recursive: true });
	return { home, cwd };
}

function writeClaudeSession(configDir, id, text) {
	const source = path.join(configDir, "projects", "-example-project", `${id}.jsonl`);
	fs.mkdirSync(path.dirname(source), { recursive: true });
	fs.writeFileSync(source, JSON.stringify({
		type: "user",
		timestamp: "2026-01-01T00:00:00Z",
		message: { content: text },
	}) + "\n");
	return source;
}

function runImport(sandbox, args, overrides = {}) {
	const env = { ...process.env, HOME: sandbox.home, USERPROFILE: sandbox.home };
	delete env.PI_CODING_AGENT_DIR;
	delete env.CLAUDE_CONFIG_DIR;
	Object.assign(env, overrides);
	const result = spawnSync(process.execPath, ["--input-type=module", "-e", commandRunner, extensionUrl, args], {
		cwd: sandbox.cwd,
		env,
		encoding: "utf8",
	});
	assert.equal(result.status, 0, result.stderr);
	return JSON.parse(result.stdout);
}

function readImportedSession(agentDir, cwd, notifications) {
	assert.deepEqual(notifications.filter(({ level }) => level === "error"), []);
	const projectKey = `--${cwd.split(/[\\/]/).filter(Boolean).join("-")}--`;
	const sessionDir = path.join(agentDir, "sessions", projectKey);
	const files = fs.readdirSync(sessionDir);
	assert.equal(files.length, 1);
	const sessionPath = path.join(sessionDir, files[0]);
	assert.ok(notifications.some(({ message }) => message.includes(sessionPath)));
	const records = fs.readFileSync(sessionPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
	assert.equal(records[0].type, "session");
	assert.equal(records[0].cwd, cwd);
	return records;
}

const configCases = [
	{ name: "unset variables", pi: null, claude: null },
	{ name: "empty variables", pi: "", claude: "" },
	{ name: "only PI_CODING_AGENT_DIR", pi: "absolute", claude: null },
	{ name: "only CLAUDE_CONFIG_DIR", pi: null, claude: "absolute" },
	{ name: "both custom directories", pi: "absolute", claude: "absolute" },
	{ name: "home-relative directories", pi: "tilde", claude: "tilde" },
	{ name: "cwd-relative directories", pi: "relative", claude: "relative" },
];

for (const { name, pi, claude } of configCases) {
	test(`imports and autocompletes session IDs with ${name}`, (t) => {
		const sandbox = createSandbox(t);
		const defaultPiDir = path.join(sandbox.home, ".pi", "agent");
		const defaultClaudeDir = path.join(sandbox.home, ".claude");
		const customPiDir = path.join(pi === "relative" ? sandbox.cwd : sandbox.home, "pi-work");
		const customClaudeDir = path.join(claude === "relative" ? sandbox.cwd : sandbox.home, "claude-work");
		const agentDir = pi ? customPiDir : defaultPiDir;
		const claudeDir = claude ? customClaudeDir : defaultClaudeDir;
		const id = "example-session";
		const source = writeClaudeSession(claudeDir, id, "Continue my imported task");
		if (claude) {
			writeClaudeSession(defaultClaudeDir, id, "Do not import this default-directory session");
			writeClaudeSession(defaultClaudeDir, "default-only-session", "Do not suggest this session");
		}
		const env = {};
		if (pi !== null) env.PI_CODING_AGENT_DIR = pi === "tilde" ? "~/pi-work" : pi === "relative" ? "pi-work" : pi ? customPiDir : "";
		if (claude !== null) env.CLAUDE_CONFIG_DIR = claude === "tilde" ? "~/claude-work" : claude === "relative" ? "claude-work" : claude ? customClaudeDir : "";

		const { suggestions, notifications } = runImport(sandbox, id, env);

		assert.deepEqual(suggestions.map(({ value }) => value), [id]);
		assert.match(suggestions[0].label, /Continue my imported task/);
		const records = readImportedSession(agentDir, sandbox.cwd, notifications);
		const messages = records.filter(({ type }) => type === "message").map(({ message }) => message);
		assert.ok(messages[0].content[0].text.includes(source));
		assert.equal(messages.at(-1).role, "user");
		assert.equal(messages.at(-1).content[0].text, "Continue my imported task");
		if (pi) assert.equal(fs.existsSync(path.join(defaultPiDir, "sessions")), false);
	});
}

test("explicit JSONL paths still work when the configured Claude projects directory is absent", (t) => {
	const sandbox = createSandbox(t);
	const source = writeClaudeSession(path.join(sandbox.home, "elsewhere"), "explicit-session", "Import this explicit file");
	const agentDir = path.join(sandbox.home, "pi-work");

	const { suggestions, notifications } = runImport(sandbox, source, {
		PI_CODING_AGENT_DIR: agentDir,
		CLAUDE_CONFIG_DIR: path.join(sandbox.home, "missing-claude-dir"),
	});

	assert.equal(suggestions, null);
	const records = readImportedSession(agentDir, sandbox.cwd, notifications);
	assert.equal(records.at(-1).message.content[0].text, "Import this explicit file");
});
