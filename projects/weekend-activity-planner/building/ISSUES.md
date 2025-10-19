# Issues & Solutions

**Purpose:** Track problems encountered and their solutions to avoid solving the same issue twice.

---

## RESOLVED

### Issue #1: Streamlit Button State Not Persisting
**Date:** 2025-10-14
**Component:** Rating UI (streamlit_app.py)
**Problem:** Clicking YES/NO buttons didn't save answers; selections disappeared on page rerun
**Root Cause:** `rating_data` was a local variable recreated on each Streamlit rerun, not persisted in session state
**Impact:** Made rating workflow unusable - couldn't save any ratings
**Solution:** Added `temp_answers` dictionary to `st.session_state` to persist button clicks across reruns
```python
# Initialize temp state
if 'temp_answers' not in st.session_state:
    st.session_state.temp_answers = {}

# Save immediately on button click
if st.button("👍 YES", ...):
    st.session_state.temp_answers[activity_id]['liked_by_3yo'] = True
    st.rerun()  # Critical for persistence
```
**Reference:** `rating-ui/streamlit_app.py` lines 120-180
**Lesson:** Always use `st.session_state` for values that must persist across Streamlit reruns
**Status:** RESOLVED

---

### Issue #2: Database Migration Failed - Dependent View Error
**Date:** 2025-10-14
**Component:** Database schema (Supabase)
**Problem:** Migration to binary ratings failed with error: `cannot drop column rating_3yo of table visits because other objects depend on it`
**Root Cause:** View `recent_visits_with_details` referenced the old column names
**Impact:** Blocked migration from 1-5 star ratings to binary YES/NO system
**Solution:** Created new migration that drops dependent views first using CASCADE:
```sql
-- STEP 1: Drop dependent views FIRST
DROP VIEW IF EXISTS recent_visits_with_details CASCADE;

-- STEP 2: Drop old columns
ALTER TABLE visits
DROP COLUMN IF EXISTS rating_3yo,
DROP COLUMN IF EXISTS rating_5yo,
DROP COLUMN IF EXISTS rating_overall;

-- STEP 3: Add new binary columns
ALTER TABLE visits
ADD COLUMN liked_by_3yo BOOLEAN,
ADD COLUMN liked_by_5yo BOOLEAN;

-- STEP 5: Recreate view with new columns
CREATE VIEW recent_visits_with_details AS ...
```
**Reference:** `database/migrations/001_binary_ratings_fixed.sql`
**Lesson:** Always check for dependent objects (views, triggers, functions) before dropping/renaming columns in PostgreSQL
**Status:** RESOLVED

---

## ACTIVE

### Issue #3: Meta Developer Portal Rate Limit
**Date:** 2025-10-18
**Component:** WhatsApp Cloud API Integration
**Problem:** Hit Meta/Facebook rate limit when attempting to access https://developers.facebook.com/ to set up WhatsApp Business API
**Impact:** Cannot proceed with WhatsApp integration until rate limit clears (blocks final 5% of project)
**Root Cause:** Meta's anti-automation protection triggered by access patterns
**Solution:** Wait for rate limit to clear (typically hours to 24 hours), then resume setup
**Workaround:** None available - must wait for Meta to clear the limit
**Status:** ACTIVE - Waiting for rate limit to clear
**Timeline:** Should clear within 24 hours (by 2025-10-19)
**Next Action:** Check https://developers.facebook.com/ periodically; when accessible, continue with WhatsApp setup per `building/session-logs/2025-10-18-whatsapp-integration-started.md`

---

## BACKLOG

*No backlog issues yet.*

---

## Template for New Issues

When adding an issue, use this format:

```markdown
### Issue #X: [Short Title]
**Date:** YYYY-MM-DD
**Component:** [Which part of system]
**Problem:** [Clear description of the issue]
**Impact:** [How it affects functionality]
**Solution:** [What fixed it]
**Reference:** [Code location or commit]
**Status:** RESOLVED/ACTIVE/BACKLOG
```

---

## Common Issues to Watch For

Based on the architecture, here are potential issues to monitor:

### API-Related
- **Spotify token expiration**: OAuth refresh tokens expire, need renewal logic
- **WhatsApp rate limiting**: Meta has limits on message frequency
- **Calendar API quota**: Google Calendar has daily request limits
- **Weather API limits**: Free tiers have request caps

### Database-Related
- **Supabase RLS**: Row-level security can block queries during dev
- **Connection pooling**: Too many concurrent connections
- **Query performance**: N+1 queries, missing indexes

### MCP Server-Related
- **Tool timeout**: Long-running tools need timeout handling
- **Error propagation**: Subagent errors need proper error messages
- **Context size**: Large result sets might exceed token limits

### n8n Workflow-Related
- **Workflow failures**: Network issues, API downtime
- **Cron timing**: Timezone issues with scheduled workflows
- **Data transformation**: JSON parsing errors

---

*Document issues as they arise during development.*

### Issue #3: n8n Match Restaurants - inputs[1] Undefined
**Date:** 2025-10-18
**Component:** n8n workflow (Match Restaurants node)
**Problem:** Match Restaurants node expected two inputs but `inputs[1]` was undefined, causing error: `Cannot read properties of undefined (reading 'json')`
**Root Cause:** n8n execution model limitation - "split and rejoin" connection patterns don't preserve data correctly during workflow execution. Connection existed in API/UI but data didn't flow.
**Impact:** Workflow failed at Match Restaurants node during E2E testing
**Solution:** Implemented defensive fallback pattern - node tries to use `inputs[1]` from connection, but fetches restaurants directly from Supabase if undefined:
```javascript
let restaurants = [];
if (inputs[1] !== undefined) {
  restaurants = inputs[1].json; // Use connection
} else {
  // Fallback: fetch directly
  restaurants = await this.helpers.httpRequest({...});
}
```
**Reference:** n8n workflow wRRp1fTwNzOHr9rY, Match Restaurants node
**Lesson:** Make n8n nodes self-sufficient rather than relying on complex connection patterns. n8n executes as linear chain, not true DAG.
**Status:** RESOLVED

---

### Issue #4: n8n Code Node - fetch() is not defined
**Date:** 2025-10-18
**Component:** n8n workflow (Match Restaurants node)
**Problem:** After implementing defensive fallback using browser `fetch()` API, got error: `fetch is not defined [line 23]`
**Root Cause:** n8n Code nodes run in restricted Node.js environment without browser globals (`fetch`, `window`, `document`)
**Impact:** Defensive fallback failed to execute
**Solution:** Replaced browser `fetch()` with n8n's built-in HTTP helper:
```javascript
// ❌ Don't use (browser API)
const response = await fetch(url, {headers: {...}});

// ✅ Do use (n8n helper)
const data = await this.helpers.httpRequest({
  method: 'GET',
  url: url,
  headers: {...}
});
```
**Reference:** n8n workflow wRRp1fTwNzOHr9rY, Match Restaurants node
**Lesson:** Always use `this.helpers.httpRequest()` or `this.helpers.request()` for HTTP calls in n8n Code nodes, never `fetch()` or external libraries unless pre-installed.
**Status:** RESOLVED

---

