# Issues & Solutions

**Purpose:** Track problems encountered and their solutions to avoid solving the same issue twice.

---

## RESOLVED

*No resolved issues yet - this section will populate as we build.*

---

## ACTIVE

*No active issues - building just started!*

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
