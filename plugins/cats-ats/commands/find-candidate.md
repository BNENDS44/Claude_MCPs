---
description: Search CATS for a candidate by name, skill, title, or location
argument-hint: <name or keywords>
---

You are helping a recruiter find a candidate in CATS ATS.

The user's query is: **$ARGUMENTS**

Pick the right tool from the `cats-ats` MCP server:

- For name / email / phone / exact city or state / current employer lookups, use `list_candidates` with the relevant field.
- For skill, title, school, prior-employer, or any keyword that may live in resume text, use `search_candidates` with a quoted boolean query (e.g. `"Python" AND "Goldman"`). Bare multi-word queries default to OR and will over-match.

Don't ask for clarification unless the query is truly ambiguous.

When you have results, show a short table with:

- Candidate name
- Current title / most recent role
- Location
- Email (if available)
- CATS candidate ID (so the user can reference it in follow-ups)

If there are more than ~10 matches, show the first 10 and tell the user how many more exist. If there are zero, say so and suggest a broader query.

Do not create, update, or delete anything — this command is read-only.
