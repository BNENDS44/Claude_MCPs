# Routing — worked examples

Concrete judgment calls for the ROUTE protocol. The point isn't to memorize
these; it's to calibrate the instinct for *when* a skill beats hand-rolling,
*which* skill wins a close call, and *what* is worth logging as a gap.

---

## Example 1 — A multi-skill chain (route, don't improvise)

**Request:** "Take this candidate's resume PDF, add them to our ATS, then draft a
short intro email to the hiring manager."

**R — capabilities:** (1) read/parse a resume PDF, (2) create an ATS record from
the parsed data, (3) draft an email.

**O — options:**
- Capability 2 maps cleanly to the `candidate-intake` skill — it already does
  parse → dedupe-check → create → note. Use it.
- Capability 1 is subsumed by `candidate-intake` (it handles resume text), so
  don't separately route it.
- Capability 3 has no dedicated skill here, but it's a simple drafting task and
  an MCP email tool may exist. Check the catalog; if a Gmail/Slack MCP is
  connected, use it to create a *draft* (never send without confirmation).

**U — use:** invoke `candidate-intake` first; once the record exists, draft the
email referencing the new record.

**Lesson:** one sentence from the user was three capabilities. Routing turned a
vague ask into a clean, skill-backed chain — and avoided re-implementing the
dedupe logic the intake skill already encodes.

---

## Example 2 — The near-miss (keyword match ≠ right skill)

**Request:** "Can you find me everyone in the pipeline who's gone quiet for 2+
weeks and summarize where each one stalled?"

The word "find" and "pipeline" might pull you toward a generic search skill. But
this is an open-ended, multi-record *analysis* across several candidates — the
kind of task a **subagent** handles better than a single skill invocation,
because it'll fan out across records and synthesize. Route to the recruiter
subagent (or `candidate-search` only if the task were a simple lookup).

**Lesson:** match on the *shape* of the work (open-ended, multi-record, needs
synthesis), not on surface keywords. The most specific tool for the actual shape
wins, even when a flashier keyword points elsewhere.

---

## Example 3 — A gap worth logging

**Request:** "Generate a branded one-pager PDF summarizing this candidate for the
client, using our colors and logo."

There's an intake skill and a search skill, but nothing that produces a
*branded client-facing PDF*. You can hand-roll it this time with an HTML→PDF
approach, but it's specialized (brand assets, layout), will obviously recur
(every client submission), and is easy to get visually wrong.

**T — track:** append to the wishlist:

```markdown
## branded-candidate-onepager
- need: render a candidate summary as a branded, client-ready PDF (logo, colors, layout)
- context: "make a one-pager PDF for the client" — client submissions
- workaround: hand-built HTML then converted to PDF, eyeballed the styling
- seen: 1
- value: high
- status: open
- last: 2026-06-23
```

**E — evolve:** because `value: high` and it'll recur, tell the user: "Want me
to build a `branded-candidate-onepager` skill so this is one step next time?" If
yes → super-skill-architect → master-skill-forge.

**Lesson:** do the task now *and* capture the gap. The wishlist is how a
one-off becomes a ranked candidate for the next skill you forge.

---

## Example 4 — Do NOT route

**Request:** "what's the difference between `git reset --soft` and `--mixed`?"

Single-step, no specialized tool needed, cheaper to answer than to route. Just
answer. Invoking the router here would be pure overhead — and training yourself
to route trivia is how routing becomes an annoying tax instead of a quiet
multiplier.

**Lesson:** the protocol earns its keep on multi-step, specialized, recurring, or
expensive-to-botch work. For everything else, the right routing decision is "just
do it."

---

## Tie-breakers for close calls

- **More specific beats more general.** A `candidate-intake` skill beats a
  generic "create a record" approach for resumes.
- **Skill beats subagent for a fixed workflow; subagent beats skill for
  open-ended fan-out.** Match the tool's nature to the task's nature.
- **Existing-and-good beats new-and-speculative.** Don't forge a skill mid-task
  to avoid five minutes of work — log the gap and keep moving. Forge later, when
  the value is proven by recurrence.
- **When genuinely unsure between two fits,** state the choice and the reason in
  one line and proceed. Don't stall the task on a routing micro-decision.
