# pi-import-claude-history

[![npm version](https://img.shields.io/npm/v/pi-import-claude-history)](https://www.npmjs.com/package/pi-import-claude-history)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-KShivendu%2Fpi--import--claude--history-181717?logo=github)](https://github.com/KShivendu/pi-import-claude-history)

<p align="center">
  <img src="demo/demo.gif" alt="Terminal demo: repo tour and install commands" width="920">
</p>

Import **Claude Code** session logs (NDJSON / `.jsonl`) into **[Pi](https://github.com/mariozechner/pi-coding-agent)** so you can continue the same thread inside Pi’s agent UI.

This repo publishes a single Pi extension: **`claude-import.ts`**, which registers the slash command **`/import-claude`**.

## Features

- **`/import-claude`** — reads a Claude session from disk and writes a new Pi session file under your Pi config directory's `sessions/` folder.
- **Autocomplete** — when you type the command, Pi can suggest Claude session IDs discovered under your Claude config directory's `projects/` folder.
- **Custom config directories** — respects `PI_CODING_AGENT_DIR` and `CLAUDE_CONFIG_DIR`, with the standard home-directory defaults.
- **Modes** — `compact` (default, readable) vs `strict` (includes tool_use / tool_result as text).
- **Turn limit** — import only the last *N* turns to keep context bounded.

## Requirements

- [Pi coding agent](https://github.com/mariozechner/pi-coding-agent) with extension support.
- Claude Code stores sessions under `~/.claude/projects/<encoded-path>/<session-id>.jsonl`.

## Install

### With the Pi CLI (recommended)

**From npm** (adds the package to Pi settings; global by default under `~/.pi/agent/settings.json`):

```bash
pi install npm:pi-import-claude-history
# pin a version:  pi install npm:pi-import-claude-history@1.0.1
```

**This fork from GitHub** (clones to your Pi config directory's `git/` folder):

```bash
# Remove the upstream npm package first if already installed, to avoid duplicate commands.
pi remove npm:pi-import-claude-history
pi install git:github.com/thaske/pi-import-claude-history
```

The environment-variable support in this fork is not included in the upstream npm release.

Project-local install (writes `.pi/settings.json`, good for teams):

```bash
pi install npm:pi-import-claude-history -l
# or:  pi install https://github.com/KShivendu/pi-import-claude-history -l
```

Then start Pi (or run **`/reload`** in the TUI) so the package loads.

### Manual copy

Copy (or symlink) the extension file:

```bash
cp src/claude-import.ts ~/.pi/agent/extensions/
# optional: project-local — mkdir -p .pi/extensions && cp src/claude-import.ts .pi/extensions/
```

In Pi: **`/reload`**

## Usage

```text
/import-claude <session-id|path.jsonl> [--mode compact|strict] [--turns N]
```

| Argument | Meaning |
|----------|---------|
| `session-id` | Looks up `<claude-config-dir>/projects/*/<session-id>.jsonl` (see below). |
| `path.jsonl` | Absolute or relative path to a Claude `.jsonl` file. |
| `--mode compact` | Default: user + assistant **text** turns; collapses noisy repeats. |
| `--mode strict` | Also surfaces **tool_use** / **tool_result** lines as assistant text. |
| `--turns N` | Keep only the last **N** turns (default `60`, max `400`). |

After import, Pi writes a new JSONL session file and notifies you. Open the **session picker** in Pi and load that session to continue.

### Try with the bundled sample

```bash
# From repo root; in Pi, cwd should be this repo (or use absolute path):
/import-claude examples/sample-claude-session.jsonl
```

See `examples/sample-claude-session.jsonl` for the minimal Claude NDJSON shape this importer expects.

## Where files go

| Environment variable | Default | Used for |
|----------------------|---------|----------|
| `PI_CODING_AGENT_DIR` | `~/.pi/agent` | Imported Pi session storage. |
| `CLAUDE_CONFIG_DIR` | `~/.claude` | Claude session-ID lookup and autocomplete. |

Unset or empty variables use the defaults. A leading `~` expands to your home directory; relative directories resolve from Pi's working directory. Explicit `.jsonl` input paths are independent of `CLAUDE_CONFIG_DIR`.

Imported Pi sessions are written to:

```text
<pi-config-dir>/sessions/--<cwd-encoded>--/<iso-timestamp>_<pi-session-id>.jsonl
```

For example:

```bash
export PI_CODING_AGENT_DIR="$HOME/.pi/agent-work"
export CLAUDE_CONFIG_DIR="$HOME/.claude-work"
pi
# /import-claude <session-id>
# Reads ~/.claude-work/projects/*/<session-id>.jsonl
# Writes ~/.pi/agent-work/sessions/--<cwd-encoded>--/...
```

The first assistant message is a **bootstrap** summary (source path, mode, turn counts, tool counts, objective snippet).

## Tests

With Node.js 22.18 or newer (native TypeScript support):

```bash
npm test
```

Tests run the command and autocomplete in isolated home/project directories without reading or writing your real session history.

## Demo

A short terminal walkthrough is in **`demo/`** (recorded with [asciinema](https://asciinema.org/) + [agg](https://github.com/asciinema/agg) + `ffmpeg`):

- `demo/demo.mp4` — H.264 video (~11s), easy to upload or attach to a post.
- `demo/demo.gif` — same session as a GIF (embedded at the top of this README).

Regenerate locally (requires [`asciinema`](https://asciinema.org/) and [`agg`](https://github.com/asciinema/agg)):

```bash
./demo/record-demo.sh
```

## Project layout

```text
.
├── LICENSE
├── README.md
├── package.json          # metadata + peerDependency on @mariozechner/pi-coding-agent
├── src/
│   └── claude-import.ts  # Pi extension (default export)
├── examples/
│   └── sample-claude-session.jsonl
└── demo/
    ├── README.md
    ├── record-demo.sh
    ├── demo.cast         # optional; generated
    ├── demo.gif          # generated / committed for sharing
    └── demo.mp4          # generated / committed for sharing
```

## License

MIT — see [LICENSE](./LICENSE).
