---
description: Summary of today's recruiting activity across CATS
---

You are giving a recruiter a daily snapshot of what's happening in CATS ATS.

Pull "today's" activity (use the current date as the cutoff) and summarize:

1. **New candidates added today** — count, and list up to 5 with name + source.
2. **New notes / activities logged today** — count, and highlight any that mention keywords like "offer", "interview scheduled", "declined", "placed", or "urgent".
3. **Open jobs with no candidate activity in the last 7 days** — list up to 5 so the recruiter knows which roles are stalling.
4. **Hot candidates** — anyone who moved into a late-stage pipeline status (e.g. "Offer", "Placed", "Client Interview") today.

Use the tools from the `cats-ats` MCP server — typical ones are `search_candidates`, `list_candidate_activities`, `list_jobs`, `list_job_candidates`, and `list_job_activities`. Prefer a few targeted calls over dumping every record.

Format the output as short markdown sections with bullet points. Keep it scannable — the recruiter should be able to read it in under a minute.

Do not create, update, or delete anything.
