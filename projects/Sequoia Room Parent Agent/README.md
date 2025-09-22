# Room Parent Agent (v1)

**HITL-first** agent that consolidates class communications (Gmail/Drive), extracts structured updates (Gemini), diffs against Sheets/Calendar, and produces an approval queue. On approval, it writes updates and prepares WhatsApp text (manual send).

- MCP tools (from n8n): `Call_WF_list_workflows_1`, `Call_WF_get_workflow_json_`, `Call_WF_diff_preview_`, `Call_WF_apply_workflow_safe_`
- Scheduling: Every 2 hours (08:00–20:00 PT), plus daily/weekly digests.
- Secrets: Environment placeholders only; rotate real keys in n8n.

## Prompt Library

Adjust tones or formats by editing the files under `/prompts/`:
- `extractor.txt` – Gmail/Drive fact extraction prompt.
- `formatter_whatsapp.txt` – WhatsApp bulletin generator (≤800 chars, plain text).
- `digest_daily.txt` – Friendly, succinct daily email digest.
- `digest_weekly.txt` – Weekly recap email template.

Each prompt is intentionally lightweight so tone tweaks can be made without touching the workflow logic.
