---
name: super-skill-architect
description: The design layer for new skills. Use when a capability gap has been identified (often by skill-router) and you need to decide whether it warrants a skill at all, and if so, design its spec — scope, boundaries, trigger surface (the description), structure (single skill vs. split, what scripts/references/assets it needs), and success criteria — BEFORE any files are written. Also use when the user says "design a skill for…", "should this be a skill?", "plan out a skill", or wants to architect a capability without yet building it. Produces a skill spec that master-skill-forge then builds. Invoke before forging anything non-trivial so the build starts from a clear, deliberate design rather than a guess.
---

# Super Skill Architect

Building a skill is cheap; building the *wrong* skill is expensive — it adds
noise to everyone's catalog, mis-triggers, and erodes trust in skills generally.
Your job is to think before the forge fires: decide whether this should be a
skill at all, and if so, design it deliberately so the forge has a clear target.

You are the design layer. You do not write final files — you produce a **spec**.
Hand that spec to **master-skill-forge** to build.

## Step 1 — Should this even be a skill?

Resist the urge to skill everything. A skill is the right container only when the
capability is **reusable**, **non-trivial**, and benefits from **encoded
workflow** (steps, edge cases, house style, bundled scripts). Check the
alternatives first:

| If the need is… | The right home is usually… |
|---|---|
| A one-off task, done once | Just do it. No skill. |
| A short fixed command sequence the user will type | A **slash command** (`commands/*.md`) |
| Open-ended, multi-step, fan-out work | A **subagent** (`agents/*.md`) |
| Access to an external system (API/DB/SaaS) | An **MCP server/tool**, possibly wrapped by a skill |
| Reusable workflow + judgment + maybe scripts | A **skill** ✅ |
| A fact or preference to remember | Memory / CLAUDE.md, not a skill |

If a skill isn't the answer, say so and recommend the right container. That's a
successful outcome — the architect's value is partly in *not* building.

## Step 2 — Capture intent

Pin down, from the gap and any conversation history:
1. **What should the skill enable Claude to do?** One crisp sentence.
2. **When should it trigger?** The real phrasings and contexts a user would use —
   including the implicit ones where they don't name the skill or the file type.
3. **What's the output?** Format, shape, where it lands.
4. **What's the boundary?** What this skill explicitly does *not* do (so it
   doesn't bloat or collide with neighbors).
5. **Dependencies?** Tools, MCP servers, scripts, assets it needs.

If the gap came from the wishlist, mine the `need` / `context` / `workaround`
fields — they're a ready-made intent capture. Fill remaining holes by asking the
user, but come with a proposed answer rather than an open question when you can.

## Step 3 — Scope and structure

**Scope it to one coherent job.** The most common design mistake is a skill that
tries to do three loosely related things; it triggers unpredictably and is hard
to maintain. If the need spans clearly separable jobs, design *separate* skills,
or one skill with a clean primary job and references for variants.

**Decide the structure** using progressive disclosure (details in
master-skill-forge's `references/skill-anatomy.md`):
- **Single SKILL.md** — most skills. One job, under ~500 lines.
- **SKILL.md + references/** — when there's depth (multiple frameworks, long
  specs, worked examples) that shouldn't sit in context until needed.
- **SKILL.md + scripts/** — when the work involves a deterministic, repeated
  operation better done by code than re-derived prose each run. If you can
  already predict every invocation will write the same helper, design it in.
- **SKILL.md + assets/** — when output uses templates, fonts, icons, boilerplate.

## Step 4 — Design the trigger surface (the description)

The `description` is the single most important design decision — it's the only
thing that determines whether the skill ever fires. Design it to state **what the
skill does AND the concrete contexts/phrasings for when to use it**, and to be a
little *pushy*, because skills tend to under-trigger. Include the implicit cases
(user describes the symptom, not the skill). Keep it honest — over-broad triggers
that fire on unrelated work are as harmful as under-triggering.

Draft the description here, in the spec. The forge will build to it, and it can
later be hardened with skill-creator's description optimizer.

## Step 5 — Define success

State how you'll know the skill works: 2–3 realistic trigger prompts it *should*
fire on, 1–2 near-miss prompts it should *not* fire on, and what a good output
looks like. This gives the forge (and any later eval loop) a target.

## Output: the skill spec

Produce the spec in this exact shape and hand it to master-skill-forge:

```markdown
# Skill Spec: <skill-name>

- **verdict**: build-skill | use-command | use-subagent | use-mcp | no-tool-needed
  (if not build-skill, stop here and explain the recommendation)
- **one-liner**: <what it enables, one sentence>
- **description (draft)**: <the full triggering description, pushy + specific>
- **scope (does)**: <the one coherent job>
- **boundary (does NOT)**: <explicit exclusions>
- **structure**: single | +references | +scripts | +assets  (+ what each holds)
- **dependencies**: <tools / MCP / scripts / assets needed, or "none">
- **placement**: project (.claude/skills/) | plugin (<which>) | personal (~/.claude/skills/)
- **should-trigger**: <2–3 realistic prompts>
- **should-NOT-trigger**: <1–2 near-misses>
- **good output looks like**: <success criteria>
- **open questions**: <anything needing the user before building, or "none">
```

If there are open questions that change the design, ask the user before handing
off. Otherwise pass the spec straight to **master-skill-forge** and let it build.

## Placement guidance

- **Project** (`<project>/.claude/skills/`) — specific to one codebase/repo;
  travels with it and gets committed.
- **Plugin** (`plugins/<name>/skills/`) — meant to be shared/installed across
  machines or a team via a marketplace. The most reusable home.
- **Personal** (`~/.claude/skills/`) — just for this user, everywhere they work,
  not tied to a repo. Note: in an ephemeral/remote session this won't persist
  unless committed somewhere, so prefer project or plugin when the work must last.
