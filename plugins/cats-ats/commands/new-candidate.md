---
description: Create a new candidate in CATS from pasted details or a resume
argument-hint: <pasted resume, email signature, or LinkedIn blurb>
---

You are helping a recruiter add a new candidate to CATS ATS.

The user pasted: **$ARGUMENTS**

Steps:

1. Extract these fields from what they pasted:
   - First name, last name (required)
   - Email (required if present — flag if missing)
   - Phone
   - Current title
   - Current company
   - City / state / country
   - Notes / summary (anything else worth saving as a candidate note)

2. **Duplicate check.** Before creating, call `search_candidates` by email (if present) and by full name. If you find a likely existing candidate, show them and ask the user whether to update the existing record, create a new one anyway, or stop.

3. Once the user confirms (or there is no duplicate and you have at least first name, last name, and email), call `create_candidate` with the extracted fields. If there is a summary blurb, follow up with `add_candidate_note` to save it as a note on the new candidate.

4. Confirm back: "Created candidate **{name}** (CATS ID {id})" — and mention the note if one was added.

**Safety rules:**

- Never create a candidate without explicit confirmation if a possible duplicate was found.
- Never guess an email address. If there's no email in the paste, ask the user for one before creating.
