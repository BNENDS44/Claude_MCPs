---
name: candidate-search
description: Use when a recruiter describes the candidate they want in natural language — combinations of school, degree, employer/industry, tenure, location, or skills. Triggers on phrases like "find me candidates who…", "who do we have that worked at…", "any Harvard grads…", "look up engineers in our database who…", or any sourcing question that mixes resume content with structured filters. This skill turns one sentence into a ranked, evidence-backed shortlist.
---

# Candidate sourcing in CATS ATS

CATS holds ~9,000+ candidates. The resume PDF text is **indexed and searchable** via the full-text endpoint — that's the only way to filter on things like school, degree, or grad year, which never live in structured fields. Structured fields (`address.state`, `work_history`, `current_employer`, recruiter `activities` notes) are reliable for location and tenure once you have a shortlist.

The job of this skill is to translate one English sentence into:
**boolean keyword shortlist → structural verification → resume verification → ranked report**.

## Step 1 — Decompose the request

Pull every criterion you can. Mark each as:

- **Hard** — must be true; failure rejects the candidate.
- **Soft** — boosts the rank, but missing data doesn't disqualify.

Typical buckets:

| Bucket            | Where it lives in CATS                                          |
|-------------------|------------------------------------------------------------------|
| School / degree / grad year | Resume PDF text only (no structured field)               |
| Industry / company tenure   | `_embedded.work_history` (employer name, start/end YYYY-MM) and `current_employer`. Recruiter `activities` notes also mention companies. |
| Location          | `address.state` / `address.city` (canonical), often blank — fall back to most recent work_history location. |
| Skills / titles   | `title`, work_history `summary` bullets, and resume text         |
| Recency           | `date_created` / `date_modified` on the candidate                |

Show the recruiter your decomposition in one short list before searching, so they can correct it cheaply.

## Step 2 — Build a precise full-text query

`search_candidates` uses CATS' indexed full-text engine. Two non-obvious rules:

- **Bare multi-word queries default to OR / relevance ranking** (e.g. `Harvard computer science` returned *more* hits than `Harvard` alone — 6,091 vs. 178). Always quote phrases.
- **Boolean operators work:** `AND`, `OR`, `NOT`, and parentheses. `"Harvard" AND "Computer Science"` collapsed those 6,091 to 77.

Construct a query that AND-s the hard textual criteria and OR-s synonyms inside each:

```
"Harvard" AND "Computer Science" AND (
  "hedge fund" OR "Citadel" OR "Millennium" OR "Point72" OR "Two Sigma"
  OR "Schonfeld" OR "Balyasny" OR "Jane Street" OR "D.E. Shaw"
  OR "Jain Global" OR "ExodusPoint" OR "Bridgewater"
)
```

Target shortlist size **10–40**. If the search returns 0–5, loosen one OR group. If it returns >100, tighten (more phrases, drop low-precision synonyms, or restrict to `is_active=true` via the field-filter tool).

For location-heavy queries (e.g. "tri-state area"), don't put state names in the full-text query — state is often blank in the indexed text. Apply location as a structural filter in Step 3.

## Step 3 — Verify each shortlisted candidate against structured fields

The full-text search returns each candidate already populated with `_embedded.work_history`, `address`, `activities`, `attachments`, and `current_employer`. **Use that data first, before fetching anything else.**

For each candidate:

1. **Location filter.** Compute their location from `address.state` if present, else from the most recent `work_history[].employer.location.state`. Drop if it fails a hard geographic criterion. ("Tri-state" = NY, NJ, CT.)
2. **Tenure math.** Sum (`end_date` or today − `start_date`) across employers that match the industry criterion. Drop if total < hard minimum.
3. **Recruiter notes.** Scan the bullet-style `activities[].notes` for context the structured fields miss — citizenship, comp, willingness to relocate. Don't reject on these; record them.

## Step 4 — Verify resume-only criteria with `get_resume_text`

For criteria that *only* live in the resume PDF (school, degree, graduation year, certifications), call `get_resume_text(candidate_id=...)` on each survivor. The tool extracts text from the candidate's primary resume PDF.

When parsing the returned text:

- Look near "Education", "EDUCATION", or the school name itself.
- Grad year is usually `YYYY` next to the degree, sometimes a range like `2018–2022`.
- Be wary of false matches: a school name in the *Awards* section, an internship at a research lab affiliated with the school, or the school as a *client*. Require the school to appear in an education context for a "confirmed" rating.

If `get_resume_text` returns `"No attachments on this candidate"` or a non-PDF, mark education as **unverified** and surface that candidate separately rather than dropping them silently.

## Step 5 — Rank and report

Score each candidate on hard criteria first, then soft. For each one, record:

- ✅ **Confirmed** — criterion verified by structured field or resume text.
- ≈ **Inferred** — strong signal but indirect (e.g. tenure at a company *named like* a hedge fund, but no explicit "hedge fund" in their record).
- ❌ **Failed** — drop.
- ❓ **Unknown** — missing data; do not drop.

Output one markdown table, top 10:

| # | Candidate (ID) | Location | Current role | Hard criteria met | Notes |

Below the table, two short sections:
- **Strong-but-incomplete** — promising candidates missing a resume or with `❓` on a hard criterion. List with what's missing.
- **Rejected at verification** — anyone who matched the keyword search but failed a hard check (location, tenure, false-positive school mention). One line each, with the reason. This is valuable: it tells the recruiter why someone they expected to see isn't on the list.

## Anti-patterns to avoid

- **Don't trust keyword hits as evidence.** A "Harvard" match might be a school *client* on a consulting CV. Always verify with structured data or the resume context.
- **Don't `get_resume_text` until you've narrowed to a structural shortlist.** It's the expensive step — each call downloads + parses a PDF.
- **Don't widen the query just because the first one returned 0.** First check whether you over-quoted a single rare term, then drop synonyms before relaxing the AND structure.
- **Don't fabricate.** If grad year isn't in the resume text, say "not in resume" — don't infer it from work-history dates unless flagged as inferred.

## Read-only

This skill performs no writes. If the recruiter then asks to add a note, tag candidates, or attach them to a pipeline, hand off to the cats-recruiter agent or the appropriate write-tool command.
