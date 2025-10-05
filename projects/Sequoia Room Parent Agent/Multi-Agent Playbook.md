# Room Parent Agent — Multi-Agent Playbook (2025-09-22)

Use this guide to spin up parallel Codex CLI sessions against the repo. Copy the relevant role section into each agent prompt (replace placeholders) so every session understands its scope, dependencies, and completion criteria.

## 0. Shared Guardrails
- **Branching:** Each agent works on a dedicated branch named `<initials>/<role>-<date>` (e.g., `ds/ingestion-20250922`). Coordinator creates branches and merges via PR or manual review.
- **Secrets:** Never commit live credentials. Use `.env.local`, `mcp/servers.local.json`, or `servers.json.sanitized` as noted in Section 4B of the project plan.
- **Logging:** After each milestone, update both `handoff/daily_plan.xml` and `handoff/daily_update.xml` (append milestone + adjust `<meta>` if focus shifts).
- **Diff hygiene:** Run `node_modules`-free edits; format JSON with 2 spaces. Use `jq` or `python -m json.tool` for validation.
- **Fallback:** If MCP helpers fail, follow Section 4B (“MCP access fallback”) in `Room Parent Agent Project Plan.md`.

## Hotfix 2025-09-23 — Workflow Recovery
- **Issue:** n8n Cloud editor rejected sanitized export (`handoff/workflow_export_ready.json`) with "Could not find property option" because Resource Locator parameters lost their `__rl` metadata wrappers during sanitization.
- **Fix:** Restored resource locator objects (`documentId`, `sheetName`, `calendar`, nested `options.timeZone`) from the live export metadata, trimmed the payload down to `name`/`nodes`/`connections`/`settings`, and bumped the Daily/Weekly Digest schedule triggers to type version 1.5 before saving at `handoff/workflow_export_ready_fixed.json` so the Cloud editor accepts the import.
- **Guidance:** When sanitizing future exports, preserve the `__rl` wrapper with at least `mode` + `value` (and optional `cachedResultName`) so dropdown-backed parameters remain valid.

## 1. Coordinator Agent (Role: C0)
Use when launching multiple agents. This agent owns:

**Responsibilities**
1. Spin up feature branches and assign agents to roles A1–A4.
2. Maintain `<meta>` blocks in `handoff/daily_plan.xml` / `handoff/daily_update.xml`.
3. Review and merge PRs (or manual cherry-picks) back to `main`.
4. Keep `Room Parent Agent Project Plan.md` in sync (Sections 4A–4C).

**Workflow**
- Before agents start: ensure sanitized configs committed; leave live creds only in gitignored files.
- During work: track dependency readiness (e.g., Diff agent waits for ingestion schema). Update meta bullet `CurrentFocus` when assignments change.
- After merges: run final `git status`, secret sweep (`rg "AIza|Bearer"`), and append release summary to plan + logs.
- Keep active branch roster in Section 4C of the project plan current so agents know which branch to use.

**Debug Tips**
- If an agent’s branch diverges, reset using latest `n8n/room-parent-updater.json` snapshot.
- For API failures, confirm `Authorization` + `X-N8N-API-KEY` headers; see Section 4B.

## 2. Ingestion Lane Agent (Role: A1)
**Scope**
- Rename Gmail node (`Get Teacher Emails`) → `Gmail Search` and configure query per project plan.
- Add Code node `Gmail Message → Text` to normalize subject, body, attachments metadata; include `source_url`, `source_type`.
- Add Drive pipeline: `Drive PDF List` (query using run-context timestamps), `Drive Download`, `PDF → Text`, OCR fallback.
- Merge Gmail + Drive outputs via `Merge Ingestion` (Wait for Both) feeding the LLM extractor.
- Update `Basic LLM Chain` prompt path to pull from `prompts/extractor.txt` (HTTP fallback optional).

**Dependencies**
- Requires `Set Run Context` outputs (`poll_start_iso`, etc.). Ensure JSON keys match Diff agent expectations.

**Exit Criteria**
- `Validate JSON` node outputs records with `source_type`, `source_url`, `item_id` hash.
- `n8n/room-parent-updater.json` updated and uploaded via n8n API (PUT with `name`, `nodes`, `connections`, `settings`).
- Tests: Dry-run Gmail + Drive nodes with mock data (use n8n Execute once) verifying merge counts.

## 3. Diff & Queue Builder Agent (Role: A2)
**Scope**
- Rename `TRIS 2025-26 Next 60-days` → `Calendar Snapshot`; adjust time window (`poll_start_iso` → +60d).
- Refine Sheets readers, add optional `OpsLog Snapshot`.
- Implement Code nodes `Compile Current State` and `Compute Diffs` (per Section 4A) producing approval payloads with `approval_token`, `hmac_payload` skeleton, and admin row data.
- Persist pending actions in workflow static data for approvals.

**Dependencies**
- Consumes ingestion schema from A1. Coordinate JSON structure (events/snack/allergy notices).

**Exit Criteria**
- `Compute Diffs` output documented in plan + logs (include sample JSON snippet).
- Admin queue dataset staged (no writes yet—Approvals agent will handle).
- Tests: Simulate ingestion payload; ensure diff calculates upsert/clear/cancel actions without duplicates.

## 4. Approvals & HMAC Agent (Role: A3)
**Scope**
- Replace token-based approval flow with HMAC validation: update `Approve`/`Reject` webhooks, add `Validate HMAC` node.
- Modify/link `Make Approval Links` (or new signer) to produce signed URLs + headers using `store.approvalsHmacSecret`.
- Update Google Sheets Admin tab writer to include `Status`, `ProcessedAt`, `Actor`, `Token` columns.
- Generate email template with signed approve/reject links, 24h expiry.
- Update `gas/Code.gs` instructions to match HMAC contract.

**Dependencies**
- Requires diff payload structure from A2.

**Exit Criteria**
- Webhooks reject invalid signatures; successful approve populates execution ID for resume.
- Document new HMAC flow in `Room Parent Agent Project Plan.md` and README if needed.
- Tests: Manual webhook POST with valid/invalid signatures.

## 5. Writebacks & Messaging Agent (Role: A4)
**Scope**
- Implement `Apply Snack`, `Apply Calendar`, `OpsLog Append`, and `Assemble WhatsApp Draft` nodes.
- Wire `Daily Digest Prep` / `Weekly Digest Prep` to actual data and send via LLM prompts.
- Finalize notifications (email/Slack) and error handler.
- Assist coordinator with QA dry-run after all lanes integrate.

**Dependencies**
- Needs approved diff payload from A3.

**Exit Criteria**
- Approved item writes to Sheets/Calendar once (idempotent). OpsLog entry contains diff + actor.
- WhatsApp draft respects prompt (≤800 chars, plain text).
- Tests: Run simulated approval to ensure writes + digest generation succeed.

## 6. Common Error Playbook (Quick Reference)
- `request/body must NOT have additional properties`: strip read-only keys (`id`, `createdAt`, `active`, `tags`) before PUT.
- `request/body must have required property 'name'`: always include `name` in payload.
- HMAC mismatch: confirm payload JSON string before signing matches webhook body.
- Duplicate sheet writes: enforce unique key (`Week`,`Child`) and log before write.
- Timezone drift: verify `manualTimezone` in schedule nodes.

## 7. Re-entry Checklist (if starting fresh)
1. Pull latest `main` and run secret sweep (`rg "Bearer"`).
2. Use Section 4B to refresh `n8n/room-parent-updater.json` from live n8n.
3. Update `<meta>` blocks with new `CurrentFocus` / `NextSubtasks` / `RemainingWork`.
4. Assign roles (A1–A4) and brief each agent with the relevant section above.
5. Coordinator monitors progress, merges in sequence A1 → A2 → A3 → A4, then kicks off QA.

---

When you launch a new agent, copy the role block (e.g., “Role: A1”) into the prompt and replace placeholders such as branch names or specific test instructions.
