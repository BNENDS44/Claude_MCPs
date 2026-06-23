# Skill anatomy — the ground rules for building a skill

The structural reference for master-skill-forge. Distilled from the skill-creator
methodology. Read this when shaping a skill; for the full eval/benchmark/optimizer
loop, use the skill-creator skill itself.

## Contents
1. Directory layout
2. Progressive disclosure (the loading model)
3. Frontmatter
4. Writing the description (the trigger surface)
5. Writing the body
6. When to add scripts / references / assets
7. Validation checklist

---

## 1. Directory layout

```
skill-name/
├── SKILL.md            (required)
│   ├── YAML frontmatter (name, description — required)
│   └── Markdown body (the instructions)
└── (optional bundled resources)
    ├── scripts/        executable code for deterministic, repeated work
    ├── references/     docs loaded into context only when needed
    └── assets/         files used in the skill's output (templates, fonts, icons)
```

The directory name should match the `name` in frontmatter: lowercase, hyphenated.

## 2. Progressive disclosure — the loading model

Skills load in three levels. Designing to this is what keeps a skill cheap to
have and powerful to use:

1. **Metadata** (name + description) — *always* in context (~100 words). This is
   the budget you spend on every skill just by it existing, so the description
   must earn its place.
2. **SKILL.md body** — loaded *when the skill triggers* (aim < 500 lines).
3. **Bundled resources** — loaded *on demand* (references read when pointed to;
   scripts can execute without their source ever entering context). Effectively
   unlimited.

Implications:
- Keep SKILL.md lean. When it grows past ~500 lines, add a layer: move depth into
  `references/` and leave a clear pointer ("read `references/x.md` when …").
- Put per-variant depth in separate reference files so only the relevant one
  loads:
  ```
  cloud-deploy/
  ├── SKILL.md          (workflow + which-variant selection)
  └── references/
      ├── aws.md
      ├── gcp.md
      └── azure.md
  ```
- For reference files over ~300 lines, add a short table of contents at the top.

## 3. Frontmatter

```yaml
---
name: skill-name
description: <see section 4>
---
```

`name` and `description` are required. `name` matches the directory. Other fields
(e.g. compatibility/dependencies) are optional and rarely needed.

## 4. Writing the description — the trigger surface

This is the highest-leverage text in the whole skill. It is the *only* signal
that decides whether the skill fires. Skills appear to Claude as name +
description, and Claude consults one when the description matches a task it can't
trivially handle alone.

Rules that matter:
- **State both *what* and *when*.** What the skill does, AND the concrete
  contexts/phrasings that should invoke it. All "when to use" lives here, never
  in the body.
- **Be a little pushy.** Skills tend to *under*-trigger — Claude forgets to use
  them. Counter it. Instead of "How to build a dashboard for internal data,"
  write "How to build a fast dashboard for internal data. Use this whenever the
  user mentions dashboards, data visualization, internal metrics, or wants to
  display company data — even if they don't say 'dashboard.'"
- **Include the implicit cases.** Users describe the symptom, not the skill.
  Cover the phrasings where they never name the tool or the file type.
- **Don't over-reach.** A description that fires on unrelated work is as harmful
  as one that never fires. Pushy *and* honest.
- Note: very simple one-step tasks ("read this file") may not trigger any skill
  regardless of wording, because Claude handles them directly. Descriptions earn
  their keep on substantive, multi-step, or specialized work — design for that.

After building, the skill-creator's description optimizer can tune this against
trigger evals. Worth it for high-traffic skills.

## 5. Writing the body

- **Imperative voice.** "Parse the input into the fields below," not "You might
  want to consider parsing."
- **Explain the *why*.** Today's models follow reasoning better than bare
  commands and generalize past your specific examples. A wall of ALL-CAPS MUSTs is
  a yellow flag — reframe as "do X *because* Y." Reserve hard rules for genuine
  safety/correctness constraints.
- **Define fixed output formats explicitly:**
  ```markdown
  ## Report structure
  Always use this template:
  # [Title]
  ## Summary
  ## Findings
  ## Recommendations
  ```
- **Show 1–3 concrete examples.** They calibrate judgment better than abstract
  rules. Input → Output pairs work well.
- **Keep it general, not overfit.** You're writing something used across many
  future prompts, not just the example in front of you. Avoid fiddly rules that
  only fix one case.

## 6. When to add scripts / references / assets

- **scripts/** — when an operation is deterministic and repeated, code beats
  re-deriving it in prose every run. Strong signal: you can predict every
  invocation would otherwise write the same helper. Write it once, bundle it, and
  call it from the skill. Keep scripts dependency-light and robust; `chmod +x`.
- **references/** — depth that shouldn't sit in context until needed: per-
  framework guides, long specs, schemas, extended examples.
- **assets/** — templates, fonts, icons, boilerplate that appear in the skill's
  *output* (as opposed to instructions about producing output).

## 7. Validation checklist

- [ ] `SKILL.md` present; valid YAML frontmatter delimited by `---`.
- [ ] `name` is lowercase-hyphenated and matches the directory name.
- [ ] `description` states *what* + *when*, names concrete triggers, is pushy but
      honest, and includes implicit phrasings.
- [ ] Body is imperative, < ~500 lines, explains its reasoning, contains no
      "when to use" content, and isn't overfit to one example.
- [ ] Depth beyond ~500 lines is pushed into `references/` with clear pointers;
      large references have a table of contents.
- [ ] Every referenced file/script exists; scripts are executable and actually run.
- [ ] Safe and non-surprising: does exactly what the description claims, no
      malware, no covert or access-evading behavior.
- [ ] Loads correctly: project/personal skills under `.claude/skills/`; plugin
      skills under `plugins/<name>/skills/` with the plugin installed/reloaded.
