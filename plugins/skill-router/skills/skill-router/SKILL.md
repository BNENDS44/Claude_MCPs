---
name: skill-router
description: The master router that picks and launches the best available skills for a task, and detects the skills Claude wishes it had. Use at the START of essentially any non-trivial, multi-step, or specialized request — coding, research, data wrangling, document/slide generation, automation, recruiting, refactors, reviews, anything — to match the work to the optimal skill(s), slash commands, subagents, or MCP tools and invoke them instead of hand-rolling what a skill already does well. Also use whenever the user mentions skills, routing, "which skill", "best tool for", automation, or wishes Claude "just knew" what to run, and whenever you sense a capability gap (a specialized or recurring task with no matching skill). This makes skill selection automatic so the user never has to remember or name a skill. Invoke it proactively — do not wait to be asked.
---

# Skill Router

You are the dispatcher. Before you do real work, your job is to make sure the
work is done by the *best available tool*, not by improvising something a
purpose-built skill already does better — and to notice when no such tool exists
yet so the library can grow to fill the gap.

This matters because skills, slash commands, subagents, and MCP tools are only
valuable if they actually get used. The default failure mode is silent: Claude
quietly hand-rolls a task that a dedicated skill would have nailed, because
nobody remembered the skill existed. Routing removes that dependency on memory.

## The ROUTE protocol

Run this at the start of any non-trivial task. It takes seconds.

**R — Read the request.** Decompose it into the distinct *capabilities* it
needs. "Build a dashboard from this CSV and email it to the team" is three
capabilities: data shaping, dashboard/chart generation, email sending — not one.

**O — Options.** For each capability, scan what's available and pick the best
fit. Look across all four kinds of tools, in this rough order of specificity:
1. **Skills** — the session catalog the skill-router hook injected at startup,
   plus the `available_skills` already in your context. If you suspect a skill
   exists that wasn't surfaced, scan the filesystem (see *Discovering skills*).
2. **Slash commands** — project/plugin commands under `commands/`.
3. **Subagents** — specialized agents for open-ended or parallelizable work.
4. **MCP tools** — connected servers (e.g. a database, an ATS, a deploy target).

Prefer a specialized tool over general ability whenever the task is non-trivial.
A skill encodes hard-won workflow, edge cases, and house style you will not
reconstruct on the fly.

**U — Use it.** Invoke the chosen skill(s) via the Skill tool, in dependency
order (a setup/parse skill before the skill that consumes its output). Chain
them — routing is not "pick one"; a single request often flows through several.
If two skills both fit a capability, pick the more specific one and say which and
why in one short line.

**T — Track gaps.** Whenever a capability has *no* good tool and you are about to
hand-roll something specialized, recurring, or error-prone, that is a "skill I
wish I had." Append it to the wishlist (see *The wishlist*). Then proceed with
your best effort for now — tracking the gap never blocks the task.

**E — Evolve.** If a logged gap is high-value or has recurred, offer to close it:
hand the gap to **super-skill-architect** to design a spec, then to
**master-skill-forge** to build it. The new skill is live for next time. This is
the self-improving loop — the router doesn't just spend the skill library, it
grows it.

## When NOT to route

Routing must never become a tax on simple work. Skip the protocol for trivial,
single-step asks you can answer directly ("what's this regex doing?", "rename
this var", "what time is it in Tokyo?"). The cost of routing should always be
smaller than the value it adds. If you find yourself invoking the router to
decide that no skill is needed, you routed something too small — just answer.

A good rule of thumb: route when the task is multi-step, specialized, repeated,
or when getting it wrong is expensive. Otherwise, just do it.

## Discovering skills

The hook injects a catalog at session start, but it can go stale mid-session
(a skill gets installed, or you're in a repo whose skills weren't scanned). When
you suspect more exists than you can see, scan directly:

```bash
find "${CLAUDE_PROJECT_DIR:-.}/.claude/skills" "$HOME/.claude/skills" \
     "${CLAUDE_PROJECT_DIR:-.}/plugins" "$HOME/.claude/plugins" \
     -name SKILL.md 2>/dev/null
```

Read the `name`/`description` frontmatter of anything promising. Don't load whole
skill bodies while routing — descriptions are enough to choose; the body loads
when you actually invoke the skill.

## Gap detection — what counts as "wished I had"

Not every missing tool is worth a skill. Log a gap when the hand-rolled work is:
- **Specialized** — needs domain knowledge, a specific format, or a fiddly API
  you had to reverse-engineer in the moment.
- **Recurring** — the same shape of task has come up before, or obviously will.
- **Error-prone** — easy to get subtly wrong (auth flows, money math, schema
  migrations, anything with a "gotcha" you just discovered).
- **High-leverage** — slow or repetitive enough that a bundled script would save
  real time on every future run.

Do *not* log: genuine one-offs, trivial tasks, or things an existing skill
already covers. A wishlist full of noise is worse than no wishlist — it trains
everyone to ignore it. Quality over quantity.

## The wishlist

The wishlist is the memory that turns scattered one-off gaps into a ranked list
of skills worth building. Maintain it at
`${CLAUDE_PROJECT_DIR}/.claude/skill-wishlist.md` (or `~/.claude/skill-wishlist.md`
when there's no project). The SessionStart hook surfaces its top entries so
recurring gaps resurface on their own.

When you hit a gap worth logging, check whether an entry already exists. If so,
bump its `seen` count and update `last`. If not, append a new one. Use this
shape so entries stay scannable and machine-countable:

```markdown
## <short-capability-name>
- need: <the capability that was missing>
- context: <the task where it surfaced>
- workaround: <what you did instead, this time>
- seen: <N>            # bump each recurrence
- value: low | med | high
- status: open         # open | forging | created:<skill-name> | wontfix
- last: <YYYY-MM-DD>
```

When an entry reaches `seen: 3` or is marked `value: high`, proactively tell the
user: "This has come up N times — want me to build a `<name>` skill so it's
one step next time?" If they say yes, route to **super-skill-architect** then
**master-skill-forge**, and update `status` to `created:<skill-name>`.

If the file doesn't exist yet and you have a gap worth recording, create it with
a one-line header comment explaining what it is, then add your entry.

## Worked examples

See `references/examples.md` for concrete routing decisions — including a
multi-skill chain, a near-miss where the obvious-keyword skill was the wrong
choice, a gap that should be logged, and a trivial ask that should NOT be routed.
Read it when you want a feel for the judgment calls; it isn't needed every time.

## The one-line version

For every real task: **match it to the best skill/command/subagent/tool and
invoke that instead of winging it; log what you wished you had; build the
high-value gaps.** That's the whole job.
