---
name: candidate-intake
description: Use when the user wants to add a candidate to CATS from a resume, LinkedIn profile, email signature, or freeform text. Triggers on phrases like "new candidate", "add to CATS", "parse this resume", "intake", or when the user pastes resume-like content with a clear intent to save it.
---

# Candidate intake into CATS ATS

This skill turns unstructured candidate info (resume text, LinkedIn paste, email signature, phone screen notes) into a clean CATS record, with a duplicate check up front.

## Fields to extract

From the input, pull as many of these as are present:

- **first_name**, **last_name** (required)
- **email** (required — if absent, ask the user for it before creating)
- **phone**
- **current_title**
- **current_company**
- **city**, **state**, **country**
- **skills** — list of keywords
- **summary** — 1–3 sentence blurb worth saving as a note

Never invent fields. If something isn't in the source text, leave it out — don't guess.

## Workflow

1. **Parse the input** into the fields above. Show the user a short summary of what you extracted before touching CATS.

2. **Duplicate check.** In this order:
   - If there's an email, call `search_candidates` with that email.
   - Also call `search_candidates` with the full name.
   If any result looks like a likely match (same email, or same name + same company/location), stop and show it to the user. Ask whether to:
     - **update** the existing candidate with new info, or
     - **create** a new one anyway (true namesake), or
     - **cancel**.

3. **Create (or update)** using `create_candidate` or `update_candidate` with the extracted fields.

4. **Save the summary as a note.** If you extracted a summary/blurb, call `add_candidate_note` with it so the free-form context lives on the candidate record.

5. **Tag the candidate** with any obvious skill tags (optional, only if the user asked for tagging or the source mentions a clear specialty). Use `list_tags` first to see existing tag names — don't invent new ones without asking.

6. **Confirm back** to the user:
   - Candidate name + new CATS ID
   - Which fields were saved
   - Note saved: yes/no
   - Tags applied: list them

## Safety

- Never create a candidate without explicit confirmation if a potential duplicate was found.
- Never fabricate an email. If the source has no email, ask.
- Never attach to a job in this skill. Job assignment is a separate step the user must ask for.
