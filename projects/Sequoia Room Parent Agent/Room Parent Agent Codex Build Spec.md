# Room Parent Agent — Codex Build Spec (v1)

Audience: **Codex CLI autonomous agent** working in the project root you opened.  
Platform: **n8n** with an installed **MCP server** (via “MCP Tools”) inside the `n8n-workflows` workspace.  
Goal: Implement the *Room Parent Agent* E2E with HITL approval gates, using the exposed MCP tools and Gemini as the default LLM, without inventing unspecified details.

---

## <requirements>
- **Do not fabricate**: If an input or shape is not explicitly available from files or tooling APIs, **query for it**; if absent, **halt** and emit a `<verify>` failure with a helpful message.
- **Human-in-the-loop**: Never auto-post to WhatsApp or alter sources without approval.
- **MCP tools available** (exact names):
  - `Call_WF_apply_workflow_safe_`
  - `Call_WF_diff_preview_`
  - `Call_WF_get_workflow_json_`
  - `Call_WF_list_workflows_1`
- **LLM**: Default to **Gemini**. Keep prompts in repo under `/prompts`. Keys are placeholders only.
- **Scope (v1)**: Gmail & Drive ingestion → LLM extract → Diff (Calendar/Sheets) → Approval (Sheets Admin tab + email links) → On approval, write updates → Prepare WhatsApp copy (manual posting).
- **Scheduling**: Poll every **2 hours** between **08:00–20:00 PT**; send **daily** and **weekly** rollups.
- **Schemas** (initial & editable): `events[]`, `snack_changes[]`, `allergy_changes[]`, `notices[]`.
- **Allergies sheet**: **Read-only** for now.
- **Snack sheet**: Treat `Week`, `Child` as canonical columns (exact casing). Optional columns must be discovered at runtime.
- **Calendar**: `singleEvents=true`, ISO date-times, `America/Los_Angeles`. All-day vs timed: infer from extraction; default to timed if start/end present.
- **Fixtures**: Not included for v1.
</requirements>

---

## Repository Layout (create if absent)

```text
/room-parent-agent/
  /n8n/
    room-parent-updater.json          # exported workflow snapshots (historical)
  /prompts/
    extractor.txt                     # LLM extraction prompt
    formatter_whatsapp.txt            # WhatsApp summary prompt
  /gas/
    Code.gs                           # Google Apps Script for HMAC-signed approvals
  /mcp/
    servers.json                      # MCP client config (placeholders only)
  README.md
```

> **Guardrail**: Never commit live secrets. Use env-style placeholders throughout.

---

## <plan id="bootstrap">
Prepare environment, MCP client config, and prompt files. **Use only placeholders** for secrets.
</plan>

### <task id="bootstrap.mcp">
Ensure `/mcp/servers.json` exists and points to the lone n8n MCP server.
<file path="./mcp/servers.json">
{
  "mcpServers": {
    "n8n-mcp": {
      "transport": "sse",
      "url": "${MCP_N8N_BASE_URL}",        // e.g., https://<redacted>/mcp
      "headers": {
        "Authorization": "Bearer ${MCP_N8N_BEARER}"
      }
    }
  }
}
</file>
<verify>
- Fail if `${MCP_N8N_BASE_URL}` or `${MCP_N8N_BEARER}` are literal strings at runtime.
- Make a test call to `Call_WF_list_workflows_1`; expect HTTP 2xx and non-empty JSON.
</verify>
</task>

### <task id="bootstrap.prompts">
Create prompt files.
<file path="./prompts/extractor.txt"><![CDATA[
You are an assistant that reads school communications (email bodies and PDFs) and outputs strict JSON with these top-level arrays: events[], snack_changes[], allergy_changes[], notices[].

Output rules:
- Output ONLY JSON; no prose.
- events[] objects: { title, start_iso, end_iso, location?, description?, audience? }
- snack_changes[] objects: { week_label, child, note? }
- allergy_changes[] objects: { action: "add"|"remove", child, allergy_text }
- notices[] objects: { text, audience?, priority? }

If dates/times are ambiguous, include in notices[] and leave events[] empty for that item.
]]></file>

<file path="./prompts/formatter_whatsapp.txt"><![CDATA[
You produce a concise WhatsApp-ready bulletin from the approved changes:
- "This Week" events (title → date/time → location)
- Snack rota: child by week label
- Allergy updates (read-only note)
- Brief notices

Keep under 800 characters. No links. Plain text only.
]]></file>
<verify>
- Ensure both files exist and are non-empty.
</verify>
</task>

### <task id="bootstrap.readme">
Write README skeleton.
<file path="./README.md"><![CDATA[
# Room Parent Agent (v1)

**HITL-first** agent that consolidates class communications (Gmail/Drive), extracts structured updates (Gemini), diffs against Sheets/Calendar, and produces an approval queue. On approval, it writes updates and prepares WhatsApp text (manual send).

- MCP tools (from n8n): `Call_WF_list_workflows_1`, `Call_WF_get_workflow_json_`, `Call_WF_diff_preview_`, `Call_WF_apply_workflow_safe_`
- Scheduling: Every 2 hours (08:00–20:00 PT), plus daily/weekly digests.
- Secrets: Environment placeholders only; rotate real keys in n8n.
]]></file>
</task>

---

## <plan id="discover-workflow">
Discover the active n8n workflow JSON; never assume node IDs. Work in diff/patch loops using the exposed MCP tools.
</plan>

### <task id="wf.list">
List workflows via MCP and select the primary Room Parent workflow.
<mcp-call server="n8n-mcp" tool="Call_WF_list_workflows_1">
{}
</mcp-call>
<verify>
- Choose a single workflow whose name contains a stable substring like "room" AND "parent" (case-insensitive). If multiple, **halt** and emit options.
- Capture its identifier for subsequent calls: `<var id="WF_ID">...</var>`
</verify>
</task>

### <task id="wf.get">
Fetch workflow JSON.
<mcp-call server="n8n-mcp" tool="Call_WF_get_workflow_json_">
{ "workflow_id": "${WF_ID}" }
</mcp-call>
<verify>
- Validate JSON structure with `nodes[]` and `connections` present.
- Store snapshot at `./n8n/room-parent-updater.json` (timestamped copy).
</verify>
</task>

---

## <plan id="requirements-on-workflow">
Bring the workflow to the **v1 functional baseline** using safe diffs, without inventing missing shapes.
</plan>

### Functional Baseline (non-optional)

1. **Ingestion**
   - Gmail polling with filters defined in project plan (keep as-is; do not broaden without explicit instruction).
   - Drive polling against the designated folder; process only `application/pdf`; fallback to OCR if plain text not detected.
2. **LLM Extraction (Gemini)**
   - Use `/prompts/extractor.txt`.
   - Emit strictly valid JSON as defined.
3. **Diff/Compose**
   - Combine extracted items with current **Snack Sheet** and **Calendar**.
   - Do **not** write allergies for v1; include as read-only notes.
4. **Approval surfaces**
   - (A) **Google Sheets Admin tab**: queue of proposed actions with Approve/Reject.
   - (B) **Daily email** that includes per-item **Approve/Reject** links.
   - Both must call n8n webhooks with an **HMAC-SHA256** signature header.
5. **Writeback**
   - On approval, write **Snack** updates and **Calendar** events only.
   - Prepare WhatsApp bulletin text; never post.
6. **Scheduling**
   - Cron or Schedule Trigger to run every 2 hours, from 08:00 to 20:00 PT.
   - Daily digest (18:00 PT) and Weekly digest (Sun 18:00 PT).

### <task id="wf.diff.preview">
Request a diff preview that brings the workflow to the baseline above.
<mcp-call server="n8n-mcp" tool="Call_WF_diff_preview_">
{
  "workflow_id": "${WF_ID}",
  "baseline_requirements": {
    "ingestion": { "gmail": "as-documented", "drive_pdfs_only": true },
    "llm": { "provider": "gemini", "prompt_path": "./prompts/extractor.txt" },
    "diff_compose": true,
    "approvals": { "sheets_admin": true, "email_links": true, "hmac": "required" },
    "writeback": { "snack_sheet": true, "calendar": true, "allergies": "read_only" },
    "scheduling": { "every_2h_8to20_pt": true, "daily_18pt": true, "weekly_sun_18pt": true }
  }
}
</mcp-call>
<verify>
- Expect a machine-readable diff (added/removed/changed nodes and credentials usage). If the tool returns “insufficient context,” **halt** and surface the missing elements.
</verify>
</task>

### <task id="wf.apply.safe">
Apply the diff **safely**.
<mcp-call server="n8n-mcp" tool="Call_WF_apply_workflow_safe_">
{
  "workflow_id": "${WF_ID}",
  "diff": "${OUTPUT_OF_wf.diff.preview}",
  "safety": { "dry_run": false, "backup_before_apply": true }
}
</mcp-call>
<verify>
- Confirm apply result indicates success and the workflow validates.
- If “Referenced node doesn’t exist” or similar appears, see Diagnostics § below and retry after fetching the fresh JSON.
</verify>
</task>

---

## <plan id="approvals">
Implement HMAC-signed approvals from Google Sheets and from the daily email.
</plan>

### HMAC Contract
- Header: `X-Signature: sha256=<hex>`
- Payload: canonical JSON body of the approval action `{action, entity_type, entity_id, actor, ts}`
- Key: `${APPROVALS_HMAC_SECRET}` (store in n8n credentials; never plaintext in code).

### <task id="approvals.n8n.auth">
Create or verify a secret credential named `approvals-hmac` in n8n and set `${APPROVALS_HMAC_SECRET}`.
<verify>
- Ensure all inbound approval webhooks validate the signature before enqueuing state changes.
</verify>
</task>

### <task id="approvals.gas">
Create minimal Apps Script to render Approve/Reject in the “Admin” tab and call the signed webhook.
<file path="./gas/Code.gs"><![CDATA[
/**
 * Adds a custom menu for Room Parent approvals.
 * Requires Script Properties: N8N_WEBHOOK_URL, HMAC_SECRET
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Room Parent')
    .addItem('Approve Selected', 'approveSelected')
    .addItem('Reject Selected', 'rejectSelected')
    .addToUi();
}

function approveSelected() { actOnSelection('approve'); }
function rejectSelected() { actOnSelection('reject'); }

function actOnSelection(action) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();
  const values = range.getDisplayValues();
  const webhook = PropertiesService.getScriptProperties().getProperty('N8N_WEBHOOK_URL');
  const secret  = PropertiesService.getScriptProperties().getProperty('HMAC_SECRET');
  if (!webhook || !secret) throw new Error('Missing script properties');

  values.forEach(row => {
    const entityId = row[0];      // assumes first column holds entity_id (configure in n8n)
    const entityType = row[1];    // assumes second column holds entity_type
    const body = JSON.stringify({
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      actor: Session.getActiveUser().getEmail(),
      ts: new Date().toISOString()
    });
    const sig = computeHmacHex(body, secret);
    const resp = UrlFetchApp.fetch(webhook, {
      method: 'post',
      contentType: 'application/json',
      payload: body,
      headers: { 'X-Signature': 'sha256=' + sig }
    });
    Logger.log(resp.getResponseCode());
  });
}

function computeHmacHex(message, secret) {
  const signature = Utilities.computeHmacSha256Signature(message, secret);
  return signature.map(b => (b + 256) % 256)
                  .map(b => ('0' + b.toString(16)).slice(-2))
                  .join('');
}
]]></file>
<verify>
- Ensure the Admin tab has columns with `entity_id` and `entity_type` in cols A/B (or adjust n8n mapping accordingly).
- In production, set `N8N_WEBHOOK_URL` and `HMAC_SECRET` using Script Properties.
</verify>
</task>

### <task id="approvals.email">
Ensure the daily email includes **Approve** / **Reject** links that hit n8n webhooks with an HMAC query or header.
<verify>
- Links must be pre-signed (server-generated) and expire within 24 hours (include `ts` and `hmac`); n8n validates on receipt.
</verify>
</task>

---

## <plan id="scheduling">
Implement polling + digest schedules.
</plan>

### <task id="schedule.polling">
Ensure a schedule trigger runs every 2 hours from 08:00–20:00 PT.
<assert>
- Exactly 7 runs per day (08,10,12,14,16,18,20 PT).
</assert>
</task>

### <task id="schedule.digests">
Ensure a daily digest at 18:00 PT and a weekly digest Sunday at 18:00 PT.
<assert>
- Daily node exists; Weekly node exists; downstream email/send logic wired.
</assert>
</task>

---

## <plan id="llm">
Wire Gemini as default extraction engine with strict JSON output.
</plan>

### <task id="llm.config">
Configure provider + temperature per project plan (keep stable).
<config>
GEMINI_API_KEY=${GEMINI_API_KEY}
LLM_PROVIDER=gemini
LLM_TEMPERATURE=0.2
</config>
<verify>
- A sample run over one email+PDF produces valid JSON matching the schema.
</verify>
</task>

---

## <plan id="outputs">
Writeback and WhatsApp text generation after approvals.
</plan>

### <task id="writeback.snack">
On approval, write Snack changes to the `Snack Week Schedule` tab, matching exact headers (`Week`, `Child`).
<assert>
- No duplicate rows for a given (Week, Child).
</assert>
</task>

### <task id="writeback.calendar">
On approval, create/update Google Calendar events using ISO datetimes and America/Los_Angeles.
<assert>
- SingleEvents true; no duplicates per (title,start_iso).
</assert>
</task>

### <task id="whatsapp.format">
Generate WhatsApp preview text using `/prompts/formatter_whatsapp.txt`.
<assert>
- Plain text ≤ 800 chars; no links.
</assert>
</task>

---

## Diagnostics & Known Error Playbook

### 1) “Method not allowed - please check you are using the right HTTP method”
<verify>
- Likely a mismatch between MCP tool contract and call verb. Re-discover the tool’s method by invoking a no-op or metadata call (if supported) or checking the tool’s usage guide in the MCP server. Ensure `Call_WF_apply_workflow_safe_` and `Call_WF_diff_preview_` are invoked with the expected method (commonly POST) and structured body.
</verify>

### 2) “workflowId is required [line 17]”
<verify>
- Ensure payload key is exactly what the tool expects. Try both `workflow_id` and `workflowId` if the tool’s schema is unclear—first query the tool with a schema/echo call when available. Persist the correct casing in future calls.
</verify>

### 3) “MCP error -32001: Request timed out”
<verify>
- Increase client timeout and ensure the n8n MCP endpoint supports SSE keepalive. Retry with exponential backoff. If the diff/apply is heavy, request a dry-run or chunked diff first.
</verify>

### 4) “Cannot assign to read only property 'name' of object 'Error: Referenced node doesn't exist'”
<verify>
- Fetch fresh workflow JSON; ensure all node IDs referenced by the diff exist. Apply changes in topological order: create nodes → connect → set parameters → enable. Avoid mutating error objects or reserved fields. If a node was deleted out-of-band, re-generate the diff from the refreshed JSON.
</verify>

### 5) “Referenced node doesn’t exist” (without the read-only error)
<verify>
- The diff references a connection to a node not present. Use `Call_WF_get_workflow_json_` to list nodes, map by `name` and `id`, and re-materialize the missing node or adjust the connection endpoints.
</verify>

---

## Acceptance Checks (v1)

### <verify id="accept.extract">
Run one full poll cycle; confirm extractor returns only JSON with arrays: `events`, `snack_changes`, `allergy_changes`, `notices`.
</verify>

### <verify id="accept.approvals">
From Sheets Admin tab, approve a single snack change and reject another; verify webhook HMAC is validated and only the approved item is applied.
</verify>

### <verify id="accept.calendar">
Approve a single new Calendar event; verify creation and de-duplication on re-run.
</verify>

### <verify id="accept.whatsapp">
Generate WhatsApp bulletin; manual review confirms content/length rules.
</verify>

### <verify id="accept.schedules">
Confirm 2-hour cadence windows, daily and weekly digests scheduled.
</verify>

---

## Rollback

### <rollback id="wf.restore">
If apply fails or behavior regresses:
1. Disable the workflow in n8n.
2. Re-apply the last good snapshot from `./n8n/room-parent-updater.json` via `Call_WF_apply_workflow_safe_`.
3. Re-enable and run a dry poll.
</rollback>

---

## Variables & Secrets (placeholders only)

```ini
# MCP
MCP_N8N_BASE_URL=
MCP_N8N_BEARER=

# LLM
GEMINI_API_KEY=

# Approvals
APPROVALS_HMAC_SECRET=
N8N_APPROVAL_WEBHOOK_URL=  # server-side configured; do not embed in client code
```

**Important**: You (Codex) must never print, log, or commit real values. Always prompt the operator to set them within n8n credentials or environment.

---

## Completion Criteria

- The workflow can be discovered, diffed, and safely updated via MCP.
- Polling, extraction, diffing, approvals, and writebacks all work **with HITL**.
- WhatsApp text is generated but not posted.
- Diagnostics are embedded; rollback is documented.


---

## Security & repo hygiene

- Add `.gitignore` entries for workflow exports, local scripts output, and any credential dumps before publishing.
- Perform manual secret sweep (env vars, `Sequioa parent app API keys.md`, static data scripts) prior to Git pushes.
- Re-run approval secret injector only after checkout; never store the raw secret in repo files.
