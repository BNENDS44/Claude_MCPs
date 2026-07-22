# CATS ATS — Cloud MCP Server

A cloud-hosted [Model Context Protocol](https://modelcontextprotocol.io) server
that lets Claude (Desktop, Code, or the web app) drive your
[CATS Applicant Tracking System](https://www.catsone.com/) account.

- **Runs on Cloudflare Workers** — deploys in one command, free tier is plenty
  for a recruiting team, no servers to babysit.
- **Shared-key model** — one CATS API key stored as a Worker secret; every
  teammate connects with a shared bearer token you hand out.
- **Full CATS coverage** — 65 purpose-built tools for candidates, jobs,
  companies, contacts, lists, pipelines, tags, notes, activities, users,
  custom fields, email templates — including full-text search and resume-PDF
  text extraction — plus a generic `cats_request` escape hatch for anything
  exotic.

> **New to this?** Hand your recruiters the one-page guide:
> [**Using CATS in Claude**](docs/USING-CATS-IN-CLAUDE.md) — plain-English
> examples of what to ask and five tips that make it 10× better.

> **Also in this repo — [`skill-router`](#8-bonus-the-skill-router-plugin):** a
> Claude Code plugin that automatically launches the best skill for every task
> (and flags the skills you wish you had), so nobody has to remember which one to
> run. Jump to [section 8](#8-bonus-the-skill-router-plugin).

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

Your MCP supports **two URL formats** depending on which Claude client the
teammate uses:

**For Claude Desktop and Claude.ai (web)** — the "Add custom connector" dialog
only accepts a URL (no custom-header field), so the token goes in the URL:
```
https://cats-ats-mcp.<your-subdomain>.workers.dev/k/<SHARED_BEARER_TOKEN>/mcp
```
The whole URL is effectively a shared password — treat it like one.

**For Claude Code (CLI)** — the CLI supports custom headers, so use the clean
URL plus an `Authorization: Bearer` header (see section 3).
```
https://cats-ats-mcp.<your-subdomain>.workers.dev/mcp
```

Send each teammate the URL that matches their Claude client.

---

## 3. Team setup (per person)

Each teammate adds the MCP to their Claude client. Pick the one they use.

### Claude Desktop (macOS / Windows)

1. Open Claude Desktop → **Settings → Connectors → Add custom connector**.
2. **Name:** `CATS ATS`
3. **Remote MCP server URL:** paste the `/k/<TOKEN>/mcp` URL, e.g.
   `https://cats-ats-mcp.yourname.workers.dev/k/YOUR_SHARED_BEARER_TOKEN/mcp`
4. Leave the OAuth fields blank. Click **Add**.
5. Claude will list the connector's tools in the tool menu.

### Claude.ai (web)

Go to **Settings → Connectors → Add custom connector** and enter the same
`/k/<TOKEN>/mcp` URL as Desktop above. Leave OAuth fields blank.

### Claude Code (CLI) — easiest: install the plugin

This repo also ships a Claude Code **plugin** that bundles the MCP connection,
six slash commands (`/cats-ats:search`, `/cats-ats:find-candidate`,
`/cats-ats:pipeline`, `/cats-ats:daily-summary`, `/cats-ats:add-note`,
`/cats-ats:new-candidate` — plugin commands are namespaced by plugin name), a
recruiter subagent, and `candidate-intake` + `candidate-search` skills. Each
teammate runs this once:

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

The CLI supports custom headers, so the token goes in a header instead of
the URL:

```bash
claude mcp add cats-ats \
  --transport http \
  --url  https://cats-ats-mcp.yourname.workers.dev/mcp \
  --header "Authorization: Bearer YOUR_SHARED_BEARER_TOKEN"
```

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
| **Candidates** | `search_candidates` (full-text over resume PDFs; supports `AND`/`OR`/`NOT` and quoted phrases), `get_candidate`, `create_candidate`, `update_candidate`, `delete_candidate`, `list_candidate_jobs`, `list_candidate_activities`, `add_candidate_activity`, `list_candidate_notes`, `add_candidate_note`, `list_candidate_tags`, `add_candidate_tags`, `remove_candidate_tag`, `list_candidate_attachments`, `get_resume_text`, `get_attachment_text`, `list_candidate_emails`, `list_candidate_skills` |
| **Jobs** | `search_jobs` (full-text; supports `AND`/`OR`/`NOT` and quoted phrases), `list_jobs`, `get_job`, `create_job`, `update_job`, `delete_job`, `list_job_candidates`, `attach_candidate_to_job`, `detach_candidate_from_job`, `list_job_notes`, `add_job_note`, `list_job_activities` |
| **Companies** | `search_companies` (full-text; supports `AND`/`OR`/`NOT` and quoted phrases), `list_companies`, `get_company`, `create_company`, `update_company`, `delete_company`, `list_company_contacts`, `list_company_jobs`, `list_company_notes`, `add_company_note` |
| **Contacts** | `search_contacts` (full-text; supports `AND`/`OR`/`NOT` and quoted phrases), `list_contacts`, `get_contact`, `create_contact`, `update_contact`, `delete_contact` |
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

**Quick self-test (no tools needed)** — open
`https://cats-ats-mcp.<your-subdomain>.workers.dev/k/<TOKEN>/` (note the
trailing slash, no `/mcp`) in any browser. A green "✓ Token is valid" page
means the server and token are both fine; `Unauthorized` means the token is
wrong.

**`Unauthorized` when teammates connect** — they're missing or mistyping the
bearer token. Have them paste it again, exactly.

**`CATS API 401` from a tool** — the CATS API key is wrong or revoked.
Re-upload with `npx wrangler secret put CATS_API_KEY` and redeploy.

**A tool returns an unexpected shape** — the CATS schema drifted. Use
`cats_request` as a workaround and open an issue so the tool can be updated.

**Logs** — `npm run tail` streams live Worker logs; the Cloudflare dashboard
has a persistent log view under *Workers & Pages → cats-ats-mcp → Logs*.

---

## 8. Bonus: the `skill-router` plugin

This marketplace also ships **`skill-router`** — a Claude Code plugin that makes
Claude pick and launch the *best* skill for whatever you ask, so nobody has to
remember which skill to run or even know one exists. When no skill fits, it
notices the gap and can build one.

**Install (Claude Code CLI):**
```bash
claude
> /plugin marketplace add BNENDS44/Claude_MCPs   # if not already added
> /plugin install skill-router@cats-ats
```
Approve the hooks when prompted, then start a fresh session.

**How it behaves.** On any non-trivial task it silently runs a short **ROUTE**
protocol — **R**ead the request, find the best **O**ption (skill / slash command /
subagent / MCP tool), **U**se it instead of hand-rolling, **T**rack any capability
gap, and **E**volve by forging the high-value gaps into new skills. Trivial
one-liners are left alone, so it never becomes a tax on simple asks.

**What's inside:**

| Skill | Role |
|---|---|
| `skill-router` | The brain — routes every task to the best available skill/tool. |
| `super-skill-architect` | Decides whether a gap deserves a skill, and designs the spec. |
| `master-skill-forge` | Builds, validates, and installs new skills. |

**Why it's automatic, not manual.** A `SessionStart` hook scans every skill
location and injects a fresh capability catalog plus the routing directive each
session; a lightweight `UserPromptSubmit` hook keeps it active every turn. That's
what makes the right skill fire without anyone asking. Capability gaps accumulate
in `.claude/skill-wishlist.md` so recurring needs surface for forging.

If it ever feels chatty, delete the `UserPromptSubmit` block in
[`plugins/skill-router/hooks/hooks.json`](plugins/skill-router/hooks/hooks.json) —
the once-per-session priming still drives routing. Full details and the trigger
descriptions (tuned with the skill-creator eval loop) live in
[`plugins/skill-router/README.md`](plugins/skill-router/README.md).
