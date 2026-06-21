---
description: Translate a natural-language sourcing query into a ranked CATS candidate shortlist
argument-hint: <full natural-language query>
---

You are sourcing candidates from CATS for a recruiter. The user's request:

**$ARGUMENTS**

Follow the `candidate-search` skill end-to-end:

1. Decompose the request into structured criteria (school, degree, grad-year window, employer/industry, tenure, location, must-haves vs. nice-to-haves).
2. Use `search_candidates` with a quoted boolean query against indexed resume text to produce a shortlist (target 10–40 hits).
3. For each shortlisted candidate, verify the criteria against structured CATS fields first, then `get_resume_text` only for criteria that aren't in structured data (school, degree, graduation year).
4. Rank candidates by how many criteria they meet, separating confirmed vs. inferred evidence. Drop anyone who clearly fails a hard criterion.
5. Return a markdown table — top 10 — with name, CATS ID, location, current employer, key matched criteria, and a 1-line "why" with the evidence source (work history, recruiter note, resume page).
6. Below the table, list any candidates that look promising but are missing data (e.g., no resume on file) so the recruiter can choose to investigate manually.

This is a read-only workflow. Do not create, update, or delete records.
