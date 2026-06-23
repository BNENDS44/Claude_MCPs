---
name: master-skill-forge
description: |-
  Use this skill whenever someone wants to turn a repeatable task, process, or set of commands into a reusable Claude skill — and then actually build it on disk. Trigger on natural phrasings like "make a skill out of this," "build me a skill that knows how to <do our X>," "turn this workflow into a skill," "I keep walking Claude through these same steps," or "I run these exact commands every time and want to stop pasting them." Also fires on "create/forge/scaffold a skill" or building from a spec (often from super-skill-architect). The job: capture the user's described steps, scaffold the directory, write SKILL.md with a strong triggering description, add any scripts/references/assets, validate, and place it (project, plugin, or personal). Do NOT use for ordinary coding tasks that merely start with "create" or "build" — a React component, CLI tool, GitHub Action, MCP server, or DB migration is not a skill. The output must be an installed Claude skill.
---

# Master Skill Forge

This is where designs become real. Given a spec (ideally from
**super-skill-architect**) or a clear request, you build the skill: scaffold it,
write it well, validate it, and place it where it'll actually load. A skill that
doesn't trigger or doesn't load is worse than none — so the forge cares as much
about the description and the placement as about the body.

## Before you build

Make sure you have a target. If a spec exists, build to it. If not, you need at
minimum: the skill's **one job**, its **trigger contexts**, its **output**, and
its **placement**. If those are fuzzy, route back through super-skill-architect
first (or ask the user) — don't forge blind. Two minutes of design saves a skill
that mis-triggers forever.

Read `references/skill-anatomy.md` for the structural rules (progressive
disclosure, frontmatter, file layout, description-writing). It's the ground truth
for *how* a skill should be shaped; this file is the *process* for building one.

## Build steps

### 1. Choose placement and scaffold

Decide where it lives (the spec's `placement`), then create the directory:

```bash
# project skill
mkdir -p "<project>/.claude/skills/<skill-name>"
# plugin skill
mkdir -p "<repo>/plugins/<plugin>/skills/<skill-name>"
# personal skill
mkdir -p "$HOME/.claude/skills/<skill-name>"
```

Add `references/`, `scripts/`, or `assets/` subdirectories only if the design
calls for them — don't scaffold empty folders.

### 2. Write SKILL.md

Frontmatter (required: `name`, `description`):

```yaml
---
name: <skill-name>          # matches the directory name; lowercase, hyphenated
description: <what it does AND when to use it — specific, pushy, includes the
  implicit trigger phrasings; this is the ONLY thing that makes the skill fire>
---
```

Then the body. Write it the way good skills are written — see
`references/skill-anatomy.md`, but the essentials:
- **Imperative voice**, lean prose, under ~500 lines. If you're approaching that,
  push depth into `references/` and point to it.
- **Explain the *why*** behind instructions instead of stacking rigid MUSTs.
  Modern Claude follows reasoning better than commands, and a skill that explains
  itself generalizes beyond the examples you happened to write.
- **Define output formats explicitly** when the skill produces a fixed shape.
- **Include a couple of concrete examples** — they calibrate judgment.
- Don't put "when to use" info in the body; it belongs in the description.

### 3. Add scripts / references / assets

- **scripts/** — for deterministic, repeated operations. If the design predicts
  every invocation would otherwise re-write the same helper, write it once here
  and have the skill call it. Make scripts robust and dependency-light; `chmod +x`
  anything executable.
- **references/** — depth loaded on demand (per-framework guides, long specs,
  worked examples). For files over ~300 lines, add a short table of contents.
- **assets/** — templates, icons, fonts, boilerplate used in the skill's output.

### 4. Validate

Run the checklist in `references/skill-anatomy.md` (the "Validation" section).
At minimum confirm:
- [ ] `SKILL.md` exists with valid YAML frontmatter; `name` matches the directory.
- [ ] `description` says both *what* and *when*, names concrete triggers, and is
      pushy enough to actually fire — but not so broad it triggers on unrelated work.
- [ ] Body is imperative, under ~500 lines, explains its reasoning, and contains
      no "when to use" content (that lives in the description).
- [ ] Every referenced file/script actually exists; scripts are executable and run.
- [ ] Nothing surprising or unsafe: no malware, no covert behavior, the skill does
      exactly what its description claims. Refuse to build deceptive or
      access-evading skills.

Quick structural check you can run:

```bash
test -f "<dir>/SKILL.md" && \
  head -1 "<dir>/SKILL.md" | grep -qx -- '---' && \
  grep -q '^name:' "<dir>/SKILL.md" && \
  grep -q '^description:' "<dir>/SKILL.md" && echo "frontmatter OK" || echo "FIX frontmatter"
```

### 5. Make it discoverable, then confirm

- **Project/personal skills** load automatically from `.claude/skills/`.
- **Plugin skills** load automatically once the plugin is installed/enabled —
  remind the user to install or reload the plugin if it's new.
- Tell the skill-router it now exists so future routing can use it. If this skill
  closed a wishlist gap, update that entry's `status` to `created:<skill-name>`.

Then report to the user: the skill's name, where it lives, what triggers it, and
one example prompt that should now fire it.

## Rigor: hand off to skill-creator when it matters

The forge gets a correct, well-shaped skill onto disk fast. When a skill is
high-stakes or high-traffic and you want *measured* quality — eval runs against
test prompts, benchmark comparisons, automated description optimization for
triggering accuracy — don't reinvent that machinery. Hand off to the
**skill-creator** skill, which has the full eval/benchmark/optimizer loop. If
it's available at `/mnt/skills/examples/skill-creator/SKILL.md`, point there.

Use that loop when: the skill will run often, mis-triggering is costly, or the
user explicitly wants it benchmarked. Skip it for simple, low-stakes skills where
a clean build and a couple of sanity prompts are enough — over-process is its own
kind of waste.

## A note on updating existing skills

If asked to improve a skill rather than create one: **preserve its name and
directory**, edit in place (copy to a writeable location first if the install
path is read-only), and re-run the validation checklist. Don't fork it into
`<name>-v2` — that fractures triggering and confuses the router.
