---
description: Add a note to a candidate or job in CATS
argument-hint: <candidate name or job title> — <note text>
---

You are helping a recruiter add a note in CATS ATS.

The user's input is: **$ARGUMENTS**

The input should contain both a target (candidate name, job title, or ID) and the note text — usually separated by a dash, colon, or the word "note:". Parse it into two parts:

- **target** — who/what the note is on
- **note** — the content

Steps:

1. If the target looks like a candidate (a person's name) use `search_candidates` to find them. If it looks like a job (job title or "job: ..."), use `list_jobs`. If ambiguous, check candidates first, then jobs.
2. If you get more than one match, show the top matches and ask the user which one before writing anything.
3. Once the target is confirmed, call `add_candidate_note` or `add_job_note` with the note text.
4. Confirm back to the user: "Added note to **{name}**: *{note}*" and include the candidate/job ID.

**Safety rule:** never write a note without a confirmed target. If you are not sure which record is right, stop and ask.
