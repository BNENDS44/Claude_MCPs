# Using CATS in Claude — the one-pager

*For the recruiting team. No technical knowledge needed. You talk, Claude does the CATS clicking.*

---

## What this is

Claude is connected directly to our CATS database. Anything you'd normally do by clicking around CATS — searching candidates, checking a pipeline, adding notes — you can now do by asking Claude in plain English. It reads real, live data: every candidate, job, company, contact, note, and resume PDF in our system.

**Where it works:** Claude Desktop, Claude.ai (browser), and Claude Code. Ask whoever set you up if you don't see "CATS ATS" in your connectors.

---

## The golden rule

**Just describe what you want like you're asking a colleague.** You don't need special commands or syntax. These all work:

| You want to... | Just say... |
|---|---|
| Find someone | *"Find candidates who worked at Two Sigma with Python experience"* |
| Check a candidate | *"Pull up everything we have on Caitlin Pearson — notes, history, resume"* |
| Review a pipeline | *"Show me the pipeline for the AI Engineer role, grouped by stage"* |
| Add a note | *"Add a note to John Smith: left voicemail, following up Thursday"* |
| Intake a candidate | *"Add this person to CATS:"* (then paste their resume or LinkedIn text) |
| Get a briefing | *"What happened in CATS today? New candidates, notes, stalled jobs?"* |
| Source against a job | *"Find me 5 candidates in our database who'd fit the Quant Researcher role, and score each 1–10"* |

---

## Five tips that make it 10× better

1. **Claude can read resume PDFs.** Schools, past employers, and skills that only appear inside a resume are searchable — ask *"who has 'Goldman Sachs' anywhere in their resume?"*
2. **Quote exact names.** Searching `"Jane Doe"` (with quotes) beats `Jane Doe` — unquoted multi-word searches over-match.
3. **Ask for the CATS ID.** Every answer can include the candidate/job ID. Say *"candidate 402308844"* in your next message and Claude knows exactly who you mean — no ambiguity.
4. **Chain your asks.** After a search: *"read #2's resume and tell me if they've done futures data work"* → *"great, add a note that I'm reaching out today."* Claude keeps the context.
5. **Combine criteria with AND.** *"Harvard AND 'machine learning' AND (Citadel OR 'Two Sigma')"* — Claude understands boolean logic and will build the query for you if you just describe it.

---

## What's safe (and what to know)

- **Claude confirms before changing anything.** It searches and reads freely, but tells you before it creates or updates a record — and it checks for duplicates before adding a candidate.
- **It never deletes unless you explicitly say "delete."**
- **Everything is real.** A note you add through Claude is instantly in CATS for everyone. Treat it like typing into CATS directly, because it is.
- **Claude won't email candidates.** It only works inside CATS records.

---

## If something breaks

- **"I don't have access to CATS"** → the connector is disconnected. Settings → Connectors → check "CATS ATS" is listed and enabled, then start a new chat.
- **"Unauthorized"** → the connector URL/token is wrong — ask whoever manages the setup for the current URL.
- Anything else → screenshot the error and send it to the team admin.

---

*Server details, deployment, and security notes live in the [main README](../README.md).*
