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

## 1. Deploy (pick one path)

### Path A — One-click deploy (easiest, no coding)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/BNENDS44/Claude_MCPs)

1. Click the button above. Sign in to Cloudflare if prompted (free account is fine).
2. Cloudflare will fork this repo to your GitHub, create the Worker, and deploy.
3. When it finishes, you'll see your Worker at
   `https://cats-ats-mcp.<your-subdomain>.workers.dev` — copy that URL.
4. Go to the [Cloudflare dashboard](https://dash.cloudflare.com/) →
   **Workers & Pages → cats-ats-mcp → Settings → Variables and Secrets** and
   add two **Secrets**:
   - `CATS_API_KEY` — paste the API key from CATS (*Settings → API → Generate
     API Key*)
   - `SHARED_BEARER_TOKEN` — paste any long random string (see the generator
     commands below). This is the password you'll share with teammates.
5. Click **Deploy** on the dashboard to apply the secrets. Done.

**Generate a random bearer token:**
```bash
# macOS / Linux / Git Bash on Windows:
openssl rand -hex 32

# Windows PowerShell:
-join ((48..57) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
```
Or just use any password manager to generate a 64-char random string.

### Path B — Deploy from your own machine (if you prefer the terminal)

**Prereqs:** Cloudflare account, CATS API key, [Node.js 20+](https://nodejs.org/).

```bash
git clone https://github.com/BNENDS44/Claude_MCPs.git
cd Claude_MCPs
npm install
npx wrangler login                               # browser pops up → Allow
npx wrangler secret put CATS_API_KEY             # paste your CATS API key
npx wrangler secret put SHARED_BEARER_TOKEN      # paste random 64-char string
npm run deploy                                   # prints your MCP URL
```

---

## 2. Share with your team

Your MCP endpoint is:
```
https://cats-ats-mcp.<your-subdomain>.workers.dev/mcp
```
(note the trailing `/mcp`). Send each teammate **two** things:

- that URL
- the `SHARED_BEARER_TOKEN` you set above

---

## 3. Team setup (per person)

Each teammate adds the MCP to their Claude client. Pick the one they use.

### Claude Desktop (macOS / Windows)

1. Open Claude Desktop → **Settings → Connectors → Add custom connector**.
2. Name: `CATS ATS`
3. URL: the `/mcp` URL you shared.
4. Authentication: **Bearer token** → paste the `SHARED_BEARER_TOKEN`.
5. Save. Claude will list the connector's tools in the tool menu.

### Claude Code (CLI) — easiest: install the plugin

This repo also ships a Claude Code **plugin** that bundles the MCP connection,
slash commands (`/cats-find-candidate`, `/cats-pipeline`, `/cats-daily-summary`,
`/cats-add-note`, `/cats-new-candidate`), a recruiter subagent, and a
candidate-intake skill. Each teammate runs this once:

```bash
# 1. Tell Claude where your Worker lives and give it the shared token.
#    Put these in your shell profile (~/.zshrc, ~/.bashrc) so they stick.
export CATS_MCP_URL="https://cats-ats-mcp.yourname.workers.dev/mcp"
export CATS_BEARER_TOKEN="the_shared_token_you_were_given"

# 2. Add this repo as a plugin marketplace and install the plugin.
claude
> /plugin marketplace add BNENDS44/Claude_MCPs
> /plugin install cats-ats@cats-ats
```

That's it — the MCP is wired up, and the slash commands show up when they type `/`.

**Plain-manual alternative** (if the plugin flow doesn't work for someone):

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

## 4. Local development

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

## 5. What tools are exposed?

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

## 6. Security notes

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

## 7. Troubleshooting

**`Unauthorized` when teammates connect** — they're missing or mistyping the
bearer token. Have them paste it again, exactly.

**`CATS API 401` from a tool** — the CATS API key is wrong or revoked.
Re-upload with `npx wrangler secret put CATS_API_KEY` and redeploy.

**A tool returns an unexpected shape** — the CATS schema drifted. Use
`cats_request` as a workaround and open an issue so the tool can be updated.

**Logs** — `npm run tail` streams live Worker logs; the Cloudflare dashboard
has a persistent log view under *Workers & Pages → cats-ats-mcp → Logs*.
