# Room-Parent Support Agent — Build & Deploy (Sequoia 2025–26)

> Low-code pipeline that keeps the Sequoia classroom’s Google Calendar, snack rota, allergy list, and WhatsApp updates accurate and timely — with **human approval** before anything is posted.

---

## 0) Project facts (pre-filled)

**Classroom**: Sequoia @ The Renaissance International School (Oakland, CA)

**WhatsApp group**: `Sequoia 2025-26` (inside the TRIS community; posting done manually after approval)

**Google Drive (weekly PDFs from teachers → parents)**: 
- Folder: https://drive.google.com/drive/folders/1OBL_4GuvnBVmwVOOD5cmAHM4wqxwztoq

**Google Sheets (Snack + Allergy, separate tabs)**: 
- Spreadsheet: https://docs.google.com/spreadsheets/d/1A-z6pGIFbGWJUlyP4UxgTdGVXNvmZlFsg3QsIxTR3QE/edit?gid=0#gid=0
- Tabs: `Snack Week Schedule`, `Allergies`, `OpsLog` (OpsLog is new and will be created on first run)

**Google Calendar (shared classroom calendar)**:
- ID: 7517dd2443c38f31e858f6a544c3e2d9f945811fe970225fb3fe1fe0c180e4e9@group.calendar.google.com

**Email patterns**:
- School newsletters (Mailchimp relay common):
  - From: `communications@therenaissanceschool.org` (often via `gmail.mcsv.net`)
  - Reply-To: `communications@therenaissanceschool.org`
  - Subject: `TRIS Newsletter - <Date>`
- Sequoia classroom updates:
  - Common From: `katrinar@therenaissanceschool.org` (not exclusive)
  - Always CC: `parents-sequoia@therenaissanceschool.org`
  - Subject: `Sequoia Update for <Date>`

---

## 1) Secrets & IDs (fill these once, then commit)

```ini
# Google
GOOGLE_SHEETS_SPREADSHEET_ID=1A-z6pGIFbGWJUlyP4UxgTdGVXNvmZlFsg3QsIxTR3QE
GOOGLE_SHEETS_SNACK_TAB=Snack Week Schedule
GOOGLE_SHEETS_ALLERGY_TAB=Allergies
GOOGLE_SHEETS_LOG_TAB=OpsLog
GOOGLE_CALENDAR_ID=7517dd2443c38f31e858f6a544c3e2d9f945811fe970225fb3fe1fe0c180e4e9@group.calendar.google.com
GOOGLE_DRIVE_FOLDER_ID=1OBL_4GuvnBVmwVOOD5cmAHM4wqxwztoq

# Gmail query lookback
GMAIL_LOOKBACK_DAYS=14

# Optional (for outbound previews via email or DM)
NOTIFY_EMAIL=<david@example.com>
```

---

## 2) Observed structures (from your file)

**Snack Week Schedule (tab name: `Snack Week Schedule`)**

- Columns observed: `Child`, `Week`, and a header cell labeled `Last update: 8/27/25`.
- Pending clarification: whether the third header is a real column (e.g., Notes) or a sheet-level note.
- **For now, treat as read-only keys:**
  - `Week` (primary key for the rota)
  - `Child` (assigned snack parent)

**Allergies (tab name: `Allergies`)**

- Columns observed: a single column labeled `Allergy`.
- Pending clarification: how student identity and severity are encoded (e.g., "Name — Allergy" lines, separate columns, or free text).
- **For now, treat as read-only free text**; no writes until structure is confirmed.

**OpsLog (proposed, optional)**

- New tab we can add for audit if you approve: `Timestamp | Action | Target | Diff(JSON) | PerformedBy | SourceLink`.

---

## 3) Architecture

**Flows**
1. **Email→Update (ETL)**: Pull Gmail → LLM extract structured changes → Diff vs Calendar/Sheets → Approval → Apply → Draft WhatsApp text → You paste into group.
2. **Drive PDF watcher**: Watch weekly PDFs folder → extract text → same extractor → join the diff pipeline → approval → apply.
3. **Q&A (optional)**: Lightweight lookup service for “@agent snack next week?” or “@agent allergies?” sourcing Sheets/Calendar.

**Admin & Monitoring**
- **Admin tab** inside the live Sheet with KPIs, queues, errors, and charts (spec below).
- **Apps Script sidebar** providing Approve/Reject/Copy actions via signed n8n webhooks.
- **Weekly and Daily digests** via n8n Gmail node (spec below).
- **(Optional) Raycast panel** on your Mac for quick review and actions.

**Principles**
- Calendar is *the* source of truth for events.
- Human-in-the-loop: nothing posts or writes without an approval click.

---

## 4) n8n workflow (node plan)

> Name: **Room-Parent Updater (Sequoia)**  
> Schedule: ETL every 2 hours (08:00–20:00 America/Los_Angeles). Digests: **daily** brief + **weekly** roll‑up (configurable).

1) **Trigger — Schedule (ETL)**
- Cron: */120 minutes.

2) **Gmail — Search**
- Query:
```
(newer_than:${GMAIL_LOOKBACK_DAYS}d) (
  from:(communications@therenaissanceschool.org)
  OR replyto:(communications@therenaissanceschool.org)
  OR subject:("TRIS Newsletter -")
  OR cc:(parents-sequoia@therenaissanceschool.org)
  OR from:(katrinar@therenaissanceschool.org)
  OR subject:("Sequoia Update for")
)
```

3) **Drive — List files** (weekly PDFs)
- Query: `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType='application/pdf' and modifiedTime > {{$json.lastChecked || "1970-01-01T00:00:00Z"}}`
- For each: **Download**

4) **PDF to text** → **LLM Extractor** (strict JSON)

5) **Calendar — Get events (next 60d)** → **Function — Diff**

6) **Sheets — Read** (`Snack Week Schedule`, `Allergies`) → **Function — Match & Diff**

7) **LLM — Draft WhatsApp post** (80–120 words; ISO dates; minimal PII)

8) **Approval Gate** (email + admin sidebar buttons)

9) **Apply** (on Approve)
- Calendar writes; Snack `Child` cell update; Allergy row adds/removes; OpsLog append

10) **Publish (manual)**
- Copy-ready text + `wa.me` deep link

11) **Error handler**
- Catch → notify + log to Admin

12) **Triggers — Digests**
- **Daily Brief (default 6:00 pm PT)** → email KPIs + pending approvals
- **Weekly Roll-up (Sunday 6:00 pm PT)** → fuller metrics + charts snapshot

---

## 5) Extraction JSON (strict contract)

```json
{
  "events": [
    {"op":"upsert|cancel","title":"…","start":"…","end":"…","location":"…","notes":"…","source":"email|pdf","source_url":"…"}
  ],
  "snack_changes": [
    {"week_text":"Sep.29- Oct. 3","child":"Devraj Gambino","note":"optional"}
  ],
  "allergy_changes": [
    {"op":"add","item":"Egg"},
    {"op":"remove","item":"Milk"}
  ],
  "notices": [
    {"type":"reminder","text":"Bring indoor shoes by next Monday","source_url":"…"}
  ]
}
```

---

## 5A) Admin panel — Google Sheets + Sidebar (phase 1)

**Admin tab (new worksheet)**
- **Summary (top)**: `Last Run`, `Runs (7d)`, `Errors (7d)`, `Pending Approvals`, `Approved (7d)`, `Calendar Changed (7/30d)`.
- **Approval Queue**: columns `WhenFound | Type (Calendar/Snack/Allergy) | Summary | SourceLink | ApproveLink | RejectLink`.
- **Errors**: `When | Stage | Message | ExecutionLink`.
- **Upcoming Snack (next two weeks)**: parsed from `Week` text; skip holidays; blank Child rows ignored.
- **Charts**: `Changes per week`, `Time-to-approve (p50/p90)`.

**Apps Script sidebar**
- Menu: `Admin → Open Sidebar`.
- Panels: `Overview`, `Approvals`, `Settings`.
- Buttons call signed n8n webhooks (`/approve`, `/reject`) and copy the WhatsApp draft.

> All webhook URLs carry an HMAC token (secret in n8n) and expire (e.g., 72h).

---

## 5B) Raycast panel (phase 2, optional)

- Command: **Room Parent Queue**
- Lists pending items with: `Open diff`, `Copy WhatsApp`, **Approve**, **Reject`** (maps to signed webhooks).
- Keyboard-first UX; runs locally on your Mac; no hosting.

---

## 6) Apps Script (optional Q&A micro-API)

> We will finalize logic after you confirm the exact formats in `Week` and `Allergies`. The snippet below shows placeholders and guards to avoid wrong matches.

```js
function doGet(e) {
  const SHEET_ID = '1A-z6pGIFbGWJUlyP4UxgTdGVXNvmZlFsg3QsIxTR3QE';
  const rota = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Snack Week Schedule');
  const allergy = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Allergies');

  const dataRota = rota.getDataRange().getValues();
  const headerRota = dataRota[0].map(String);
  const idxWeek = headerRota.indexOf('Week');
  const idxChild = headerRota.indexOf('Child');

  // TODO: Confirm: is Week an ISO date (YYYY-MM-DD), a single date, or a range like "9/2–9/6"?
  // The lookup below returns the first upcoming row where Week includes next Monday's date string.
  const tz = Session.getScriptTimeZone();
  const today = new Date();
  const nextMon = new Date(today);
  nextMon.setDate(today.getDate() + ((8 - today.getDay()) % 7));
  const nextMonStr1 = Utilities.formatDate(nextMon, tz, 'yyyy-MM-dd');
  const nextMonStr2 = Utilities.formatDate(nextMon, tz, 'M/d');

  let nextSnack = null;
  for (let i = 1; i < dataRota.length; i++) {
    const row = dataRota[i];
    const weekVal = String(row[idxWeek] || '');
    if (weekVal.includes(nextMonStr1) || weekVal.includes(nextMonStr2)) {
      nextSnack = { week: weekVal, child: row[idxChild] };
      break;
    }
  }

  const dataAll = allergy.getDataRange().getValues();
  const headerAll = dataAll[0].map(String);
  // If only one column exists labeled 'Allergy', return lines of free text until structure is confirmed.
  let allergies = [];
  if (headerAll.length === 1 && headerAll[0] === 'Allergy') {
    allergies = dataAll.slice(1).map(r => ({ note: String(r[0] || '') })).filter(x => x.note);
  } else {
    // TODO: Replace with structured extraction once you confirm columns.
    allergies = dataAll.slice(1).map(r => r);
  }

  return ContentService.createTextOutput(JSON.stringify({ nextSnack, allergies })).setMimeType(ContentService.MimeType.JSON);
}
```

---

## 7) Deployment steps

1. **n8n Cloud**
   - Use your n8n **Cloud** workspace (no Docker). Create credentials for Gmail, Google Sheets, Google Calendar, and Google Drive.
   - Create **three credentials** for LLMs (OpenAI / Anthropic / Google Gemini) so we can switch providers via a `Switch` node.

2. **Sheets** (writes allowed **after approval**)
   - Tabs: `Snack Week Schedule`, `Allergies`, add `OpsLog`.
   - Share **edit** with the n8n Google account.

3. **Calendar**
   - Ensure the n8n Google account has **edit** access to:
     - `7517dd2443c38f31e858f6a544c3e2d9f945811fe970225fb3fe1fe0c180e4e9@group.calendar.google.com`.

4. **Dry run**
   - Import 2 “TRIS Newsletter” and 2 “Sequoia Update” emails + 1 weekly PDF.
   - Run extractor → inspect diffs (Calendar, snack `Child`, allergy add/remove).
   - Approve → confirm Calendar/Sheets changes; copy/paste WhatsApp draft.

5. **Cutover**
   - Enable schedule; set lookback to 7–14 days initially; then daily once stable.

---

## 8) Test plan (acceptance)

- **Email capture**: 100% of the above subject/sender patterns in last 14 days are ingested; ≤1% false positives.
- **PDF watcher**: detects a new PDF within one polling cycle; parses dates/locations correctly.
- **Diff logic**: correct create/update/delete for Calendar; correct upsert for Sheets.
- **Approval**: no writes or posts without Approve.
- **Message**: 80–120 words, bullets, ISO dates, minimal PII.
- **OpsLog**: each change includes a `source_url` to the email or PDF.

---

## 9) Operational runbook

- **Daily**: clear approval queue.
- **Weekly**: skim OpsLog for churn; spot-check allergy entries.
- **Monthly**: review Gmail filters and Drive OCR behavior.
- **Backups**: Sheets versions auto; export CSV monthly.

---

## 10) Notes & constraints

- WhatsApp Business APIs do not post into existing groups. This workflow intentionally produces a copy-ready message and deep-link, and you paste into `Sequoia 2025-26`.
- Keep allergy details minimal in WhatsApp; full details live only in the `Allergies` tab and are referenced by initials in group messages.

---

## 11) Deliverables

- `room-parent-updater.json` — n8n workflow export (Gmail query + Drive watcher + approval gate + provider switch)
- `Code.gs` — optional Q&A endpoint (week-range parser, class-wide allergy list)
- This file — `ROOM-PARENT-AGENT.md`
- `prompts/` — extractor + formatter prompts
- `sample-emails/` — 4 anonymized fixtures

---

## 12) LLM provider abstraction (Cloud-friendly)

- **Why**: Your ChatGPT/Claude/Gemini *subscriptions* do **not** expose API calls; n8n nodes require **API keys**. Create credentials for **OpenAI**, **Anthropic**, and **Google Gemini** once, then pick a provider per run.
- **How**: Add a top-level `Set` node `{ "LLM_PROVIDER": "openai|anthropic|gemini" }` → a `Switch` node routes to the provider-specific node (OpenAI / Anthropic / Google Gemini). Prompts and temperature live in one `Set` node upstream.
- **Swap**: Change the `LLM_PROVIDER` value to switch vendors without touching mapping/diff logic. You can also duplicate the workflow: one per provider.
- **Keys**: Store API keys only in n8n **Credentials** (never in plain text).


---

## Security audit checklist

- Ensure `.gitignore` excludes secrets (API keys, workflow exports with credentials).
- Verify `Sequioa parent app API keys.md` contains placeholders only before sync.
- Review n8n credentials and workflow static data for stray secrets prior to GitHub pushes.
- Run `./scripts/set_approvals_secret.sh` post-clone to inject secrets locally (never commit outputs).
