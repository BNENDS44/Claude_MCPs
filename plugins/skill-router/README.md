# skill-router — the ultimate skill router for Claude Code

Make Claude Code launch the **best available skill for every task, automatically** —
so you never have to remember which skill to run, or even know one exists. When no
skill fits, the router notices the gap (the "skill it wished it had"), logs it, and
can build it on the spot.

## Why this exists

Skills, slash commands, subagents, and MCP tools are only worth having if they
actually get used. By default they're surfaced by description and Claude picks one
*if it happens to notice* — which is exactly why people forget to run the right
skill. This plugin removes the dependency on memory:

- A **`SessionStart` hook** scans every place a skill can live, injects a fresh
  capability catalog, and primes the session with a standing routing directive.
- A **`UserPromptSubmit` hook** keeps a one-line routing reminder alive on every
  turn, so routing never quietly fades over a long conversation.
- Three skills do the thinking.

## What's inside

| Component | Role |
|---|---|
| **`skill-router`** skill | The brain. Runs the **ROUTE** protocol: match every task to the best available skill/command/subagent/MCP tool and invoke it instead of hand-rolling; track capability gaps; grow the library. |
| **`super-skill-architect`** skill | Design layer. Decides whether a gap deserves a skill at all, and if so writes the spec (scope, trigger surface, structure). |
| **`master-skill-forge`** skill | Builder. Turns a spec into real, validated skill files and places them where they'll load. Hands off to `skill-creator` for rigorous evals when it matters. |
| **`hooks/`** + **`scripts/`** | The automation that makes all of the above fire without you asking. |

### The ROUTE protocol

- **R**ead the request → list the capabilities it needs.
- **O**ptions → find the best available skill / command / subagent / MCP tool for each.
- **U**se it → invoke the best fit instead of improvising.
- **T**rack gaps → log specialized/recurring/error-prone work that has no tool.
- **E**volve → forge high-value or recurring gaps into new skills (architect → forge).

### The self-improving loop

```
task ──▶ skill-router (ROUTE) ──▶ best existing skill runs
              │
              └─ gap found ──▶ wishlist ──(recurs / high value)──▶
                     super-skill-architect (spec) ──▶ master-skill-forge (build)
                                                              │
                                                              ▼
                                              new skill is live for next time
```

Gaps accumulate in `.claude/skill-wishlist.md` (or `~/.claude/skill-wishlist.md`).
The `SessionStart` hook resurfaces the top entries each session, so recurring needs
rise to the top on their own.

## Install

This plugin ships in the `cats-ats` marketplace in this repo:

```bash
claude
> /plugin marketplace add BNENDS44/Claude_MCPs   # if not already added
> /plugin install skill-router@cats-ats
```

Skills load automatically once installed. The hooks activate on your next session.

## Tuning

- **Too chatty?** The per-turn reminder is the `UserPromptSubmit` block in
  `hooks/hooks.json`. Delete that block to keep only the once-per-session priming —
  routing still works, just less insistently.
- **Want measured quality on a forged skill?** `master-skill-forge` hands off to the
  `skill-creator` skill for eval runs, benchmarks, and automated description
  optimization. Use it for high-traffic or high-stakes skills.
- **The catalog scan** (`scripts/session-start.sh`) looks in `.claude/skills/`,
  `~/.claude/skills/`, `./plugins/`, and `~/.claude/plugins/`. It needs `bash`,
  `find`, and `sed` (standard on macOS/Linux).

## Safety

The forge refuses to build deceptive, malware, or access-evading skills, and every
forged skill is validated to do exactly what its description claims. Routing only
ever *invokes existing* tools — it never sends data anywhere on its own.
