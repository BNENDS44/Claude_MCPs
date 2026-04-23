---
description: Show the candidate pipeline for a job
argument-hint: <job title, job ID, or company>
---

You are helping a recruiter review the pipeline for a job in CATS ATS.

The user's query is: **$ARGUMENTS**

Steps:

1. If they gave a numeric ID, treat it as the CATS job ID directly. Otherwise use `list_jobs` to find matching jobs by title/company and pick the best match. If there are multiple plausible matches, list them and ask which one.
2. Once you have a job ID, call `list_job_candidates` and `get_pipeline` (for that job's pipeline) so you understand the stages.
3. Present the pipeline grouped by stage, in the pipeline's stage order. For each candidate show:
   - Name
   - Current stage
   - Last activity date (if available)
   - Candidate ID

At the end, summarize in 1–2 sentences: how many candidates at each stage, and which stages look thin or stalled.

Do not move candidates between stages or change any data — this is a read-only command.
