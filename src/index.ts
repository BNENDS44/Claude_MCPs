import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface Env {
  CATS_API_KEY: string;
  SHARED_BEARER_TOKEN?: string;
  MCP_OBJECT: DurableObjectNamespace;
}

const BASE_URL = "https://api.catsone.com/v3";

type CallFn = (
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  query?: Record<string, unknown>,
  body?: unknown,
) => Promise<unknown>;

function makeCall(apiKey: string): CallFn {
  return async (method, path, query, body) => {
    const url = new URL(BASE_URL + path);
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null || v === "") continue;
        url.searchParams.set(k, String(v));
      }
    }
    const resp = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await resp.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!resp.ok) {
      throw new Error(
        `CATS API ${resp.status} ${resp.statusText}: ` +
          (typeof data === "string" ? data : JSON.stringify(data)),
      );
    }
    return data;
  };
}

function ok(data: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data, null, 2) },
    ],
  };
}

const paging = {
  page: z.number().int().positive().optional().describe("Page number (1-indexed)"),
  per_page: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Results per page (max 100)"),
};

export class CatsMcp extends McpAgent<Env> {
  server = new McpServer({
    name: "cats-ats",
    version: "0.1.0",
  });

  async init() {
    const call = makeCall(this.env.CATS_API_KEY);
    const s = this.server;

    // ------------------------------------------------------------------
    // Candidates
    // ------------------------------------------------------------------
    s.tool(
      "search_candidates",
      "Search or list candidates. All filters are optional; combine freely.",
      {
        ...paging,
        q: z.string().optional().describe("Full-text search query"),
        email: z.string().optional(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        phone: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        title: z.string().optional(),
        current_employer: z.string().optional(),
        is_hot: z.boolean().optional(),
        date_created_min: z.string().optional().describe("ISO date lower bound"),
        date_created_max: z.string().optional().describe("ISO date upper bound"),
      },
      async (args) => ok(await call("GET", "/candidates", args)),
    );

    s.tool(
      "get_candidate",
      "Get a single candidate by ID.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/candidates/${id}`)),
    );

    s.tool(
      "create_candidate",
      "Create a new candidate.",
      {
        first_name: z.string(),
        last_name: z.string(),
        email1: z.string().optional(),
        email2: z.string().optional(),
        phone_cell: z.string().optional(),
        phone_home: z.string().optional(),
        phone_work: z.string().optional(),
        title: z.string().optional(),
        current_employer: z.string().optional(),
        current_pay: z.string().optional(),
        desired_pay: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        country: z.string().optional(),
        source: z.string().optional(),
        key_skills: z.string().optional(),
        notes: z.string().optional(),
        is_hot: z.boolean().optional(),
        owner_id: z.number().int().optional(),
        extra: z
          .record(z.any())
          .optional()
          .describe("Additional fields (e.g. custom fields) merged into the request body"),
      },
      async ({ extra, ...fields }) =>
        ok(await call("POST", "/candidates", undefined, { ...fields, ...(extra ?? {}) })),
    );

    s.tool(
      "update_candidate",
      "Update a candidate. Provide only the fields to change.",
      {
        id: z.number().int(),
        fields: z
          .record(z.any())
          .describe("Object of field_name: new_value pairs to update"),
      },
      async ({ id, fields }) =>
        ok(await call("PATCH", `/candidates/${id}`, undefined, fields)),
    );

    s.tool(
      "delete_candidate",
      "Delete a candidate.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("DELETE", `/candidates/${id}`)),
    );

    s.tool(
      "list_candidate_jobs",
      "List jobs (pipelines) a candidate is attached to.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/candidates/${id}/jobs`, q)),
    );

    s.tool(
      "list_candidate_activities",
      "List activities logged against a candidate.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/candidates/${id}/activities`, q)),
    );

    s.tool(
      "add_candidate_activity",
      "Log an activity against a candidate (call, email, meeting, etc.).",
      {
        candidate_id: z.number().int(),
        activity_type_id: z
          .number()
          .int()
          .describe("Use list_activity_types to find valid IDs"),
        notes: z.string().optional(),
        job_id: z.number().int().optional().describe("Optional job this activity relates to"),
        date: z.string().optional().describe("ISO datetime; defaults to now"),
        extra: z.record(z.any()).optional(),
      },
      async ({ candidate_id, extra, ...body }) =>
        ok(
          await call(
            "POST",
            `/candidates/${candidate_id}/activities`,
            undefined,
            { ...body, ...(extra ?? {}) },
          ),
        ),
    );

    s.tool(
      "list_candidate_notes",
      "List notes on a candidate.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/candidates/${id}/notes`, q)),
    );

    s.tool(
      "add_candidate_note",
      "Add a note to a candidate.",
      {
        candidate_id: z.number().int(),
        text: z.string(),
      },
      async ({ candidate_id, text }) =>
        ok(await call("POST", `/candidates/${candidate_id}/notes`, undefined, { text })),
    );

    s.tool(
      "list_candidate_tags",
      "List tags on a candidate.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/candidates/${id}/tags`)),
    );

    s.tool(
      "add_candidate_tags",
      "Add one or more tags to a candidate.",
      {
        candidate_id: z.number().int(),
        tags: z.array(z.string()).describe("Tag names to add"),
      },
      async ({ candidate_id, tags }) =>
        ok(
          await call("POST", `/candidates/${candidate_id}/tags`, undefined, { tags }),
        ),
    );

    s.tool(
      "remove_candidate_tag",
      "Remove a single tag from a candidate.",
      {
        candidate_id: z.number().int(),
        tag_id: z.number().int(),
      },
      async ({ candidate_id, tag_id }) =>
        ok(await call("DELETE", `/candidates/${candidate_id}/tags/${tag_id}`)),
    );

    s.tool(
      "list_candidate_attachments",
      "List file attachments (resumes, docs) on a candidate.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/candidates/${id}/attachments`, q)),
    );

    s.tool(
      "list_candidate_emails",
      "List emails associated with a candidate.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/candidates/${id}/emails`, q)),
    );

    s.tool(
      "list_candidate_skills",
      "List parsed skills on a candidate.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/candidates/${id}/skills`)),
    );

    // ------------------------------------------------------------------
    // Jobs
    // ------------------------------------------------------------------
    s.tool(
      "list_jobs",
      "List or search jobs.",
      {
        ...paging,
        q: z.string().optional(),
        title: z.string().optional(),
        status: z.string().optional().describe("e.g. 'Active', 'On Hold', 'Closed'"),
        company_id: z.number().int().optional(),
        contact_id: z.number().int().optional(),
        owner_id: z.number().int().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        is_hot: z.boolean().optional(),
      },
      async (args) => ok(await call("GET", "/jobs", args)),
    );

    s.tool(
      "get_job",
      "Get a single job by ID.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/jobs/${id}`)),
    );

    s.tool(
      "create_job",
      "Create a new job.",
      {
        title: z.string(),
        description: z.string().optional(),
        company_id: z.number().int().optional(),
        contact_id: z.number().int().optional(),
        owner_id: z.number().int().optional(),
        status: z.string().optional(),
        type: z.string().optional().describe("e.g. 'Contract', 'Direct Hire'"),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        zip: z.string().optional(),
        rate_min: z.number().optional(),
        rate_max: z.number().optional(),
        rate_type: z.string().optional(),
        openings: z.number().int().optional(),
        is_hot: z.boolean().optional(),
        extra: z.record(z.any()).optional(),
      },
      async ({ extra, ...fields }) =>
        ok(await call("POST", "/jobs", undefined, { ...fields, ...(extra ?? {}) })),
    );

    s.tool(
      "update_job",
      "Update a job. Provide only the fields to change.",
      {
        id: z.number().int(),
        fields: z.record(z.any()),
      },
      async ({ id, fields }) =>
        ok(await call("PATCH", `/jobs/${id}`, undefined, fields)),
    );

    s.tool(
      "delete_job",
      "Delete a job.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("DELETE", `/jobs/${id}`)),
    );

    s.tool(
      "list_job_candidates",
      "List candidates attached to a job (the pipeline).",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/jobs/${id}/candidates`, q)),
    );

    s.tool(
      "attach_candidate_to_job",
      "Attach a candidate to a job pipeline, optionally at a specific status.",
      {
        job_id: z.number().int(),
        candidate_id: z.number().int(),
        status_id: z
          .number()
          .int()
          .optional()
          .describe("Pipeline status ID (see list_pipelines for values)"),
      },
      async ({ job_id, candidate_id, status_id }) =>
        ok(
          await call(
            "POST",
            `/jobs/${job_id}/candidates`,
            undefined,
            { candidate_id, ...(status_id !== undefined ? { status_id } : {}) },
          ),
        ),
    );

    s.tool(
      "detach_candidate_from_job",
      "Remove a candidate from a job pipeline.",
      {
        job_id: z.number().int(),
        candidate_id: z.number().int(),
      },
      async ({ job_id, candidate_id }) =>
        ok(await call("DELETE", `/jobs/${job_id}/candidates/${candidate_id}`)),
    );

    s.tool(
      "list_job_notes",
      "List notes on a job.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/jobs/${id}/notes`, q)),
    );

    s.tool(
      "add_job_note",
      "Add a note to a job.",
      { job_id: z.number().int(), text: z.string() },
      async ({ job_id, text }) =>
        ok(await call("POST", `/jobs/${job_id}/notes`, undefined, { text })),
    );

    s.tool(
      "list_job_activities",
      "List activities logged against a job.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/jobs/${id}/activities`, q)),
    );

    // ------------------------------------------------------------------
    // Companies
    // ------------------------------------------------------------------
    s.tool(
      "list_companies",
      "List or search companies.",
      {
        ...paging,
        q: z.string().optional(),
        name: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        owner_id: z.number().int().optional(),
      },
      async (args) => ok(await call("GET", "/companies", args)),
    );

    s.tool(
      "get_company",
      "Get a company by ID.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/companies/${id}`)),
    );

    s.tool(
      "create_company",
      "Create a new company.",
      {
        name: z.string(),
        website: z.string().optional(),
        phone_work: z.string().optional(),
        phone_fax: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        country: z.string().optional(),
        industry: z.string().optional(),
        owner_id: z.number().int().optional(),
        extra: z.record(z.any()).optional(),
      },
      async ({ extra, ...fields }) =>
        ok(await call("POST", "/companies", undefined, { ...fields, ...(extra ?? {}) })),
    );

    s.tool(
      "update_company",
      "Update a company. Provide only the fields to change.",
      { id: z.number().int(), fields: z.record(z.any()) },
      async ({ id, fields }) =>
        ok(await call("PATCH", `/companies/${id}`, undefined, fields)),
    );

    s.tool(
      "delete_company",
      "Delete a company.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("DELETE", `/companies/${id}`)),
    );

    s.tool(
      "list_company_contacts",
      "List contacts for a company.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/companies/${id}/contacts`, q)),
    );

    s.tool(
      "list_company_jobs",
      "List jobs for a company.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/companies/${id}/jobs`, q)),
    );

    s.tool(
      "list_company_notes",
      "List notes on a company.",
      { id: z.number().int(), ...paging },
      async ({ id, ...q }) => ok(await call("GET", `/companies/${id}/notes`, q)),
    );

    s.tool(
      "add_company_note",
      "Add a note to a company.",
      { company_id: z.number().int(), text: z.string() },
      async ({ company_id, text }) =>
        ok(await call("POST", `/companies/${company_id}/notes`, undefined, { text })),
    );

    // ------------------------------------------------------------------
    // Contacts
    // ------------------------------------------------------------------
    s.tool(
      "list_contacts",
      "List or search contacts (people at companies).",
      {
        ...paging,
        q: z.string().optional(),
        email: z.string().optional(),
        first_name: z.string().optional(),
        last_name: z.string().optional(),
        company_id: z.number().int().optional(),
        owner_id: z.number().int().optional(),
      },
      async (args) => ok(await call("GET", "/contacts", args)),
    );

    s.tool(
      "get_contact",
      "Get a contact by ID.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/contacts/${id}`)),
    );

    s.tool(
      "create_contact",
      "Create a new contact.",
      {
        first_name: z.string(),
        last_name: z.string(),
        email1: z.string().optional(),
        email2: z.string().optional(),
        phone_work: z.string().optional(),
        phone_cell: z.string().optional(),
        title: z.string().optional(),
        company_id: z.number().int().optional(),
        owner_id: z.number().int().optional(),
        notes: z.string().optional(),
        extra: z.record(z.any()).optional(),
      },
      async ({ extra, ...fields }) =>
        ok(await call("POST", "/contacts", undefined, { ...fields, ...(extra ?? {}) })),
    );

    s.tool(
      "update_contact",
      "Update a contact. Provide only the fields to change.",
      { id: z.number().int(), fields: z.record(z.any()) },
      async ({ id, fields }) =>
        ok(await call("PATCH", `/contacts/${id}`, undefined, fields)),
    );

    s.tool(
      "delete_contact",
      "Delete a contact.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("DELETE", `/contacts/${id}`)),
    );

    // ------------------------------------------------------------------
    // Lists (candidate/contact/company/job collections)
    // ------------------------------------------------------------------
    s.tool(
      "list_lists",
      "List all saved lists in the account.",
      { ...paging, type: z.enum(["candidate", "contact", "company", "job"]).optional() },
      async (args) => ok(await call("GET", "/lists", args)),
    );

    s.tool(
      "get_list",
      "Get a single list by ID.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/lists/${id}`)),
    );

    s.tool(
      "create_list",
      "Create a new list.",
      {
        name: z.string(),
        type: z.enum(["candidate", "contact", "company", "job"]),
        description: z.string().optional(),
      },
      async (fields) => ok(await call("POST", "/lists", undefined, fields)),
    );

    s.tool(
      "delete_list",
      "Delete a list.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("DELETE", `/lists/${id}`)),
    );

    s.tool(
      "list_list_members",
      "List members of a list. The member type depends on the list's type.",
      {
        id: z.number().int(),
        member_type: z
          .enum(["candidates", "contacts", "companies", "jobs"])
          .describe("Plural of the list's type"),
        ...paging,
      },
      async ({ id, member_type, ...q }) =>
        ok(await call("GET", `/lists/${id}/${member_type}`, q)),
    );

    s.tool(
      "add_to_list",
      "Add an entity to a list.",
      {
        list_id: z.number().int(),
        member_type: z.enum(["candidates", "contacts", "companies", "jobs"]),
        entity_id: z.number().int(),
      },
      async ({ list_id, member_type, entity_id }) =>
        ok(
          await call(
            "POST",
            `/lists/${list_id}/${member_type}`,
            undefined,
            { id: entity_id },
          ),
        ),
    );

    s.tool(
      "remove_from_list",
      "Remove an entity from a list.",
      {
        list_id: z.number().int(),
        member_type: z.enum(["candidates", "contacts", "companies", "jobs"]),
        entity_id: z.number().int(),
      },
      async ({ list_id, member_type, entity_id }) =>
        ok(await call("DELETE", `/lists/${list_id}/${member_type}/${entity_id}`)),
    );

    // ------------------------------------------------------------------
    // Pipelines, Users, Tags, Custom Fields, Activity Types, Email Templates
    // ------------------------------------------------------------------
    s.tool(
      "list_pipelines",
      "List all pipeline/workflow definitions with their stages.",
      paging,
      async (args) => ok(await call("GET", "/pipelines", args)),
    );

    s.tool(
      "get_pipeline",
      "Get a single pipeline by ID, including its statuses.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/pipelines/${id}`)),
    );

    s.tool(
      "get_me",
      "Get the API user's own profile (who owns CATS_API_KEY).",
      {},
      async () => ok(await call("GET", "/users/me")),
    );

    s.tool(
      "list_users",
      "List all users in the CATS account.",
      paging,
      async (args) => ok(await call("GET", "/users", args)),
    );

    s.tool(
      "get_user",
      "Get a user by ID.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/users/${id}`)),
    );

    s.tool(
      "list_tags",
      "List all tags in use across the account.",
      paging,
      async (args) => ok(await call("GET", "/tags", args)),
    );

    s.tool(
      "list_custom_fields",
      "List custom field definitions.",
      {
        entity_type: z
          .enum(["candidate", "contact", "company", "job"])
          .optional()
          .describe("Filter to fields on one entity type"),
      },
      async (args) => ok(await call("GET", "/custom_fields", args)),
    );

    s.tool(
      "list_activity_types",
      "List activity type definitions (used by add_candidate_activity).",
      {},
      async () => ok(await call("GET", "/activity_types")),
    );

    s.tool(
      "list_email_templates",
      "List saved email templates.",
      paging,
      async (args) => ok(await call("GET", "/email_templates", args)),
    );

    s.tool(
      "get_email_template",
      "Get a single email template.",
      { id: z.number().int() },
      async ({ id }) => ok(await call("GET", `/email_templates/${id}`)),
    );

    s.tool(
      "list_departments",
      "List departments in the account.",
      paging,
      async (args) => ok(await call("GET", "/departments", args)),
    );

    // ------------------------------------------------------------------
    // Generic escape hatch — reaches any CATS endpoint not wrapped above.
    // ------------------------------------------------------------------
    s.tool(
      "cats_request",
      "Generic CATS API call. Use for endpoints not covered by a specific tool. " +
        "Path is the part after /v3 (e.g. '/jobs/42/notes'). See https://docs.catsone.com/api/v3 for reference.",
      {
        method: z.enum(["GET", "POST", "PATCH", "PUT", "DELETE"]),
        path: z
          .string()
          .describe("Path after /v3, starting with '/'. Example: /jobs/42/notes"),
        query: z.record(z.any()).optional(),
        body: z.record(z.any()).optional(),
      },
      async ({ method, path, query, body }) =>
        ok(
          await call(
            method,
            path.startsWith("/") ? path : `/${path}`,
            query,
            body,
          ),
        ),
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function browserInfoPage(opts: {
  title: string;
  heading: string;
  lead: string;
  connectorUrl?: string;
}): string {
  const urlBlock = opts.connectorUrl
    ? `<p><strong>Paste this URL into Claude:</strong></p>
       <pre><code>${escapeHtml(opts.connectorUrl)}</code></pre>
       <p class="muted">Treat this URL like a password — it contains your shared token.</p>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(opts.title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 640px; margin: 40px auto; padding: 0 20px; color: #222; line-height: 1.5; }
  h1 { color: #0b7f3f; }
  pre { background: #f4f4f4; padding: 12px 16px; border-radius: 6px; overflow-x: auto; }
  code { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 14px; }
  .muted { color: #666; font-size: 13px; }
  ol li { margin-bottom: 8px; }
</style>
</head>
<body>
<h1>${escapeHtml(opts.heading)}</h1>
<p>${escapeHtml(opts.lead)}</p>
${urlBlock}
<h2>Next step — add it to Claude</h2>
<ol>
  <li>Open <strong>Claude Desktop</strong> or <strong>Claude.ai</strong>.</li>
  <li>Go to <strong>Settings → Connectors → Add custom connector</strong>.</li>
  <li>Name it <code>CATS ATS</code>.</li>
  <li>Paste the URL above as the <strong>Remote MCP server URL</strong>.</li>
  <li>Leave every other field blank and click <strong>Add</strong>.</li>
  <li>Start a new chat and ask: <em>"Using the CATS ATS connector, who am I?"</em></li>
</ol>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // URL-embedded token auth: /k/<TOKEN>/mcp
    // Designed for the Claude.ai / Claude Desktop "Add custom connector" UI,
    // which only accepts a URL (no custom header slot). The token is the
    // SHARED_BEARER_TOKEN value; the whole URL functions as a shared secret.
    // Example: https://worker.example/k/abc123/mcp
    const urlTokenMatch = url.pathname.match(/^\/k\/([^/]+)(\/.*)?$/);
    if (urlTokenMatch) {
      const urlToken = urlTokenMatch[1];
      const subPath = urlTokenMatch[2] ?? "/";
      if (!env.SHARED_BEARER_TOKEN || urlToken !== env.SHARED_BEARER_TOKEN) {
        return new Response("Unauthorized", { status: 401 });
      }
      if (subPath === "/mcp") {
        // Browsers can't speak MCP — MCP is JSON-RPC over POST. If a user
        // hits this URL in a browser (GET) to "test" it, give a friendly
        // explanation instead of the SDK's terse "Not found".
        if (request.method === "GET") {
          const connectorUrl = `${url.origin}/k/${urlToken}/mcp`;
          return new Response(
            browserInfoPage({
              title: "CATS ATS — MCP endpoint (token verified)",
              heading: "✓ Your token works — the server is reachable",
              lead:
                "You're looking at the MCP endpoint in a browser. Browsers can't " +
                "actually talk MCP (the protocol needs POST with specific " +
                "headers), so a browser will only ever see this page. The real " +
                "test is adding it to Claude.",
              connectorUrl,
            }),
            { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        }
        const rewritten = new Request(
          new URL("/mcp", url).toString(),
          request,
        );
        return CatsMcp.serve("/mcp").fetch(rewritten, env, ctx);
      }
      // /k/<TOKEN>/  (no /mcp suffix) — browser-friendly "token works" page so
      // the recruiter can visually confirm the token is correct before pasting
      // the full URL into Claude Desktop / Claude.ai.
      if (subPath === "/" || subPath === "") {
        const connectorUrl = `${url.origin}/k/${urlToken}/mcp`;
        return new Response(
          browserInfoPage({
            title: "CATS ATS — token verified",
            heading: "✓ Token is valid",
            lead:
              "Great — the server accepted your token. Copy the URL below and " +
              "paste it into Claude Desktop or Claude.ai under " +
              "Settings → Connectors → Add custom connector.",
            connectorUrl,
          }),
          { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }
      return new Response(
        "URL-embedded token auth only supports /mcp (Streamable HTTP).\n" +
          "For SSE, use the /sse endpoint with Authorization: Bearer header.",
        { status: 404 },
      );
    }

    // Header-based auth for /mcp and /sse (for CLI clients that send headers).
    if (env.SHARED_BEARER_TOKEN) {
      if (url.pathname.startsWith("/mcp") || url.pathname.startsWith("/sse")) {
        const header = request.headers.get("Authorization") ?? "";
        const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
        if (provided !== env.SHARED_BEARER_TOKEN) {
          return new Response("Unauthorized", { status: 401 });
        }
      }
    }

    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      return CatsMcp.serveSSE("/sse").fetch(request, env, ctx);
    }
    if (url.pathname === "/mcp") {
      // Bare /mcp in a browser (GET) → friendly page instead of terse 404/405.
      if (request.method === "GET") {
        return new Response(
          browserInfoPage({
            title: "CATS ATS — MCP endpoint",
            heading: "This is an MCP endpoint — not a web page",
            lead:
              "You reached the server, but /mcp expects MCP (JSON-RPC over POST). " +
              "Browsers can't talk MCP, so you'll always see this page here. " +
              "For Claude Desktop / Claude.ai, use the /k/<TOKEN>/mcp URL format " +
              "so the token is embedded and no custom headers are needed.",
          }),
          { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      }
      return CatsMcp.serve("/mcp").fetch(request, env, ctx);
    }

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          name: "cats-ats-mcp",
          endpoints: { mcp: "/mcp", sse: "/sse", urlToken: "/k/<TOKEN>/mcp" },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (url.pathname === "/") {
      return new Response(
        browserInfoPage({
          title: "CATS ATS — MCP Server",
          heading: "CATS ATS MCP server is running",
          lead:
            "This is the cloud MCP server for the CATS ATS. It's healthy. " +
            "To connect a Claude client, use the /k/<YOUR_SHARED_BEARER_TOKEN>/mcp " +
            "URL (for Claude Desktop / Claude.ai), or /mcp with an Authorization " +
            "header (for Claude Code CLI).",
        }),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    return new Response(
      "Not found. Valid paths: /, /health, /mcp, /sse, /k/<TOKEN>/mcp",
      { status: 404 },
    );
  },
};
