---
description: Translate a natural-language sourcing query into a ranked CATS candidate shortlist with 1–10 quality scores
argument-hint: <full natural-language query>
---

You are sourcing candidates from CATS for a recruiter. The user's request:

**$ARGUMENTS**

Follow the `candidate-search` skill end-to-end:

1. Decompose the request into structured criteria (school, degree, grad-year window, employer/industry, tenure, location, must-haves vs. nice-to-haves).
2. Use `search_candidates` with a quoted boolean query against indexed resume text to produce a shortlist (target 10–40 hits).
3. For each shortlisted candidate, verify criteria against structured CATS fields first, then `get_resume_text` only for criteria that aren't in structured data (school, degree, graduation year).
4. **Score each survivor 1–10** per the rubric in the skill (query-match + soft-criteria + candidate-quality components). Sort descending.
5. Return a markdown table — top 10 — with the score, name (**as a clickable link** to their CATS profile via the `profile_url` field), CATS ID, location, current employer, criteria status, and a 1-line "why this score" with evidence sources (work history, recruiter note, resume page).
6. Below the table, list **Strong-but-incomplete** (promising but missing data — e.g. no resume on file) and **Rejected at verification** (matched keywords but failed a hard check, with the reason).

This is a read-only workflow. Do not create, update, or delete records.
