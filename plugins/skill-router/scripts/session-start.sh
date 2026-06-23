#!/usr/bin/env bash
# skill-router :: SessionStart hook
#
# Why this exists: a skill is only consulted if Claude *notices* its description
# matches — the same fragile mechanism that makes people forget to run the right
# skill. This hook removes the guesswork. It scans every place a skill can live,
# prints a fresh capability catalog, and injects the standing ROUTE directive so
# the whole session is primed to route to the best available skill automatically.
#
# For SessionStart hooks, anything written to stdout is added to Claude's context.
set -uo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
HOME_DIR="${HOME:-/root}"

emit() { printf '%s\n' "$1"; }

emit "===== skill-router :: ACTIVE for this session ====="
emit ""
emit "For every NON-TRIVIAL task this session, silently run the ROUTE protocol"
emit "BEFORE hand-rolling a solution:"
emit "  R - Read the request; list the distinct capabilities it needs."
emit "  O - Options: for each capability, find the best available skill / slash"
emit "      command / subagent / MCP tool in the catalog below."
emit "  U - Use it: invoke the best-fit skill(s) via the Skill tool in dependency"
emit "      order, instead of improvising what a skill already does well."
emit "  T - Track gaps: any specialized / recurring / error-prone capability with"
emit "      no good tool -> append it to the skill wishlist."
emit "  E - Evolve: if a gap is high-value or recurring, offer to forge a new skill"
emit "      now (super-skill-architect designs the spec -> master-skill-forge builds)."
emit ""
emit "Skip routing for trivial one-liners — it should never become a tax on simple"
emit "asks. For the full method and gap heuristics, invoke the 'skill-router' skill."
emit ""
emit "----- Skills detected this session -----"

count=0
seen_file="$(mktemp 2>/dev/null || echo "/tmp/skill-router-seen.$$")"
: > "$seen_file"

# Search the standard skill locations. Missing roots are silently skipped.
while IFS= read -r f; do
  [ -f "$f" ] || continue
  if grep -qxF "$f" "$seen_file" 2>/dev/null; then continue; fi
  printf '%s\n' "$f" >> "$seen_file"

  name="$(sed -n 's/^name:[[:space:]]*//p' "$f" 2>/dev/null | head -n1)"
  desc="$(sed -n 's/^description:[[:space:]]*//p' "$f" 2>/dev/null | head -n1)"
  [ -z "$name" ] && name="$(basename "$(dirname "$f")")"
  desc="$(printf '%s' "$desc" | tr -d '\r' | cut -c1-240)"

  emit "  • ${name} — ${desc}"
  count=$((count + 1))
  [ "$count" -ge 80 ] && break
done < <(find \
  "$PROJECT_DIR/.claude/skills" \
  "$HOME_DIR/.claude/skills" \
  "$PROJECT_DIR/plugins" \
  "$HOME_DIR/.claude/plugins" \
  -type f -name SKILL.md 2>/dev/null)

rm -f "$seen_file" 2>/dev/null

if [ "$count" -eq 0 ]; then
  emit "  (No SKILL.md files found in the standard locations. The ROUTE protocol"
  emit "   still applies — weigh slash commands, subagents, and MCP tools, and log"
  emit "   any capability gaps to the wishlist so they can be forged later.)"
fi

# Surface the running wishlist of "skills Claude wished it had", if one exists.
for wl in "$PROJECT_DIR/.claude/skill-wishlist.md" "$HOME_DIR/.claude/skill-wishlist.md"; do
  if [ -f "$wl" ]; then
    emit ""
    emit "----- Capability gaps logged so far (${wl}) -----"
    sed -n '1,40p' "$wl" 2>/dev/null
    break
  fi
done

emit ""
emit "===== end skill-router ====="
exit 0
