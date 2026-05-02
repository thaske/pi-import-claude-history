#!/usr/bin/env bash
# Scripted tour for asciinema (non-interactive).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

slow_print() {
	printf '%s\n' "$1"
	sleep "${2:-0.35}"
}

slow_print "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
slow_print "  pi-import-claude-history — Pi extension: /import-claude"
slow_print "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 0.6

slow_print "" 0.2
slow_print "$ tree -L 2 -I node_modules 2>/dev/null || find . -maxdepth 2 | sort"
sleep 0.4
if command -v tree >/dev/null 2>&1; then
	tree -L 2 -I node_modules .
else
	find . -maxdepth 2 ! -path './.git*' | sort
fi
sleep 0.6

slow_print ""
slow_print "$ sed -n '1,24p' README.md"
sleep 0.3
sed -n '1,24p' README.md
sleep 0.7

slow_print ""
slow_print "$ head -2 examples/sample-claude-session.jsonl | fold -s -w 92"
sleep 0.3
head -2 examples/sample-claude-session.jsonl | fold -s -w 92
sleep 0.6

slow_print ""
slow_print "Install:"
slow_print "  cp src/claude-import.ts ~/.pi/agent/extensions/"
slow_print "In Pi:"
slow_print "  /reload"
slow_print "  /import-claude examples/sample-claude-session.jsonl"
slow_print "  # or: /import-claude <claude-session-id> [--mode strict] [--turns 80]"
sleep 0.8

slow_print ""
slow_print "Done."
