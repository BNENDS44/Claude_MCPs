---
description: Search CATS for a candidate by name, skill, title, or location
argument-hint: <name or keywords>
---

You are helping a recruiter find a candidate in CATS ATS.

The user's query is: **$ARGUMENTS**

Use the `search_candidates` tool from the `cats-ats` MCP server. It runs a full-text query across candidate records and the indexed text of their resume PDFs, so it handles every kind of lookup — name, email, phone, school, employer, skill.

Two practical rules for the query string:

- **Quote multi-word values** (`"Jane Doe"`, `"foo@bar.com"`, `"Goldman Sachs"`). Bare multi-word queries default to OR and over-match.
- **Use AND to combine criteria** (`"Jane Doe" AND "Chicago"`). Use OR inside a parenthesized synonym group (`("Goldman" OR "Morgan Stanley")`).

Don't ask for clarification unless the query is truly ambiguous.

When you have results, show a short table with:

- Candidate name
- Current title / most recent role
- Location
- Email (if available)
- CATS candidate ID (so the user can reference it in follow-ups)

If there are more than ~10 matches, show the first 10 and tell the user how many more exist. If there are zero, say so and suggest a broader query.

Do not create, update, or delete anything — this command is read-only.
