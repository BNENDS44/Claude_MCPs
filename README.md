# CATS ATS — Cloud MCP Server

A cloud-hosted [Model Context Protocol](https://modelcontextprotocol.io) server
that lets Claude (Desktop, Code, or the web app) drive your
[CATS Applicant Tracking System](https://www.catsone.com/) account.

- **Runs on Cloudflare Workers** — deploys in one command, free tier is plenty
  for a recruiting team, no servers to babysit.
- **Shared-key model** — one CATS API key stored as a Worker secret; every
  teammate connects with a shared bearer token you hand out.
- **Full CATS coverage** — ~40 purpose-built tools for candidates, jobs,
  companies, contacts, lists, pipelines, tags, notes, activities, users,
  custom fields, email templates, plus a generic `cats_request` escape hatch
  for anything exotic.

---

## 1. One-time setup (~10 minutes)

You only do this once — your teammates don't need to repeat it.

### Prereqs

1. A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free).
2. A CATS ATS account with an **API key**. In CATS: *Settings → API → Generate
   API Key*. Copy it; you'll paste it in step 5.
3. [Node.js 20+](https://nodejs.org/) installed on your computer.
4. This repository cloned locally:
   ```bash
   git clone https://github.com/bnends44/claude_mcps.git
   cd claude_mcps
   ```

### Steps

**2. Install dependencies**
```bash
npm install
```

**3. Log in to Cloudflare**
```bash
npx wrangler login
```
This opens a browser window; click *Allow*.

**4. Pick a unique name (optional)**
Open `wrangler.jsonc` and change the `"name"` field if you want a custom
subdomain. The default `cats-ats-mcp` will deploy to
`https://cats-ats-mcp.<your-subdomain>.workers.dev`.

**5. Upload your CATS API key as a secret**
```bash
npx wrangler secret put CATS_API_KEY
```
Paste the API key from CATS when prompted, then press Enter.

**6. Create a shared bearer token (strongly recommended)**
This is a password your team uses to talk to the MCP. Without it, anyone who
discovers the URL can use your CATS account. Generate a random one:
```bash
# On macOS / Linux:
openssl rand -hex 32

# On Windows PowerShell:
-join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
```
Copy the output, then:
```bash
npx wrangler secret put SHARED_BEARER_TOKEN
```
Paste it in when prompted. **Save this token somewhere safe** — you'll share
it with teammates in step 8.

**7. Deploy**
```bash
npm run deploy
```
Wrangler prints a URL like `https://cats-ats-mcp.yourname.workers.dev`. Copy
that; it's your MCP endpoint. The MCP path is `/mcp`, so the full URL your
team will use is:
```
https://cats-ats-mcp.yourname.workers.dev/mcp
```

**8. Share with your team** — send them two things:
- the URL above
- the `SHARED_BEARER_TOKEN` value you generated in step 6

---

## 2. Team setup (per person)

Each teammate adds the MCP to their Claude client. Pick the one they use.

### Claude Desktop (macOS / Windows)

1. Open Claude Desktop → **Settings → Connectors → Add custom connector**.
2. Name: `CATS ATS`
3. URL: the `/mcp` URL you shared.
4. Authentication: **Bearer token** → paste the `SHARED_BEARER_TOKEN`.
5. Save. Claude will list the connector's tools in the tool menu.

### Claude Code (CLI)

```bash
claude mcp add cats-ats \
  --transport http \
  --url  https://cats-ats-mcp.yourname.workers.dev/mcp \
  --header "Authorization: Bearer YOUR_SHARED_BEARER_TOKEN"
```

### Claude.ai (web)

Go to **Settings → Connectors → Add custom connector** and fill in the same
URL + bearer token as Desktop above.

---

## 3. Local development

Want to try changes without deploying?

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars and fill in CATS_API_KEY (+ optional SHARED_BEARER_TOKEN)
npm run dev
```

This serves the MCP at `http://localhost:8787/mcp`. Point a local Claude
client at that URL to test.

Live-tail production logs:
```bash
npm run tail
```

---

## 4. What tools are exposed?

Common recruiting flows are wrapped as first-class tools (Claude picks them
automatically):

| Area | Tools |
|---|---|
| **Candidates** | `search_candidates`, `get_candidate`, `create_candidate`, `update_candidate`, `delete_candidate`, `list_candidate_jobs`, `list_candidate_activities`, `add_candidate_activity`, `list_candidate_notes`, `add_candidate_note`, `list_candidate_tags`, `add_candidate_tags`, `remove_candidate_tag`, `list_candidate_attachments`, `list_candidate_emails`, `list_candidate_skills` |
| **Jobs** | `list_jobs`, `get_job`, `create_job`, `update_job`, `delete_job`, `list_job_candidates`, `attach_candidate_to_job`, `detach_candidate_from_job`, `list_job_notes`, `add_job_note`, `list_job_activities` |
| **Companies** | `list_companies`, `get_company`, `create_company`, `update_company`, `delete_company`, `list_company_contacts`, `list_company_jobs`, `list_company_notes`, `add_company_note` |
| **Contacts** | `list_contacts`, `get_contact`, `create_contact`, `update_contact`, `delete_contact` |
| **Lists** | `list_lists`, `get_list`, `create_list`, `delete_list`, `list_list_members`, `add_to_list`, `remove_from_list` |
| **Pipelines** | `list_pipelines`, `get_pipeline` |
| **Users** | `get_me`, `list_users`, `get_user` |
| **Metadata** | `list_tags`, `list_custom_fields`, `list_activity_types`, `list_email_templates`, `get_email_template`, `list_departments` |
| **Escape hatch** | `cats_request` — any method + path, for endpoints not listed above |

---

## 5. Security notes

- **The `SHARED_BEARER_TOKEN` is the only thing standing between the public
  internet and your CATS account.** Treat it like a password. Rotate with
  `npx wrangler secret put SHARED_BEARER_TOKEN` + `npm run deploy`.
- **All teammates share one CATS API key**, so CATS audit logs attribute
  every change to that single API user. If you need per-user attribution,
  re-architect to per-user keys (ask me to help).
- To revoke team access, rotate the bearer token. Anyone still using the old
  one gets 401.
- To shut it all down: `npx wrangler delete` (removes the Worker entirely).

---

## 6. Troubleshooting

**`Unauthorized` when teammates connect** — they're missing or mistyping the
bearer token. Have them paste it again, exactly.

**`CATS API 401` from a tool** — the CATS API key is wrong or revoked.
Re-upload with `npx wrangler secret put CATS_API_KEY` and redeploy.

**A tool returns an unexpected shape** — the CATS schema drifted. Use
`cats_request` as a workaround and open an issue so the tool can be updated.

**Logs** — `npm run tail` streams live Worker logs; the Cloudflare dashboard
has a persistent log view under *Workers & Pages → cats-ats-mcp → Logs*.
