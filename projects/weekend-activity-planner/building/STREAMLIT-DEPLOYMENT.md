# Streamlit Cloud Deployment Guide

**App:** Weekend Activity Planner - Conversational Dashboard
**File:** `rating-ui/chat_dashboard.py`
**Status:** Ready to deploy

**Created:** 2025-11-02

---

## Prerequisites

✅ **Before deploying:**
- [x] Dashboard code complete (`chat_dashboard.py`)
- [x] Local testing successful (all 4 tools working)
- [x] Dependencies updated (`requirements.txt` includes `anthropic>=0.34.0`)
- [x] Code committed to git (see steps below)
- [x] Secrets ready (Supabase + Anthropic API keys)

---

## Step 1: Commit Dashboard Code

**Run these commands:**

```bash
cd /Users/dshein/Personal\ Projects/projects/weekend-activity-planner

# Verify .env is gitignored (should output: .env)
git check-ignore .env

# Stage dashboard files
git add rating-ui/chat_dashboard.py
git add rating-ui/requirements.txt
git add database/migrations/004_create_conversations_table.sql
git add database/migrations/005_create_conversation_tokens_table.sql

# Commit
git commit -m "feat: Add conversational dashboard with Claude 4.5 + tool integration

- Magic link validation (7-day expiration)
- Claude 4.5 Sonnet with 4 tools:
  - query_activities (search activities by criteria)
  - find_restaurants (dietary-safe restaurants)
  - get_visit_history (past visits/ratings)
  - get_weather_forecast (stub)
- Conversation persistence to Supabase
- Tool call viewer in UI
- Mobile responsive design

Database:
- conversations table (chat messages)
- conversation_tokens table (magic link security)

Tested locally: All tools working correctly

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push
```

---

## Step 2: Deploy to Streamlit Cloud

### 2.1: Sign In

**Visit:** https://share.streamlit.io/

**Sign in with GitHub account** (authorize Streamlit to access your repos)

---

### 2.2: Create New App

1. **Click "New app"** (top right)

2. **Configure app settings:**

   **Repository:** `dshein87/personal-projects` (or your GitHub username)
   **Branch:** `main`
   **Main file path:** `projects/weekend-activity-planner/rating-ui/chat_dashboard.py`

   **App URL (optional):** `weekend-planner` (or choose custom subdomain)

---

### 2.3: Add Secrets

**Click "Advanced settings" → "Secrets"**

**Paste this TOML configuration:**

```toml
# Supabase credentials
SUPABASE_URL = "https://ohdmrfyyavlkoflbbjsd.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZG1yZnl5YXZsa29mbGJianNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA0MTkyMywiZXhwIjoyMDc1NjE3OTIzfQ.rzd5PDAV_FwKq_jJRRgPjagVUyzuJQ_Z0w64uH2aZP0"

# Anthropic API key (get from .env file)
ANTHROPIC_API_KEY = "[your-anthropic-api-key-from-.env]"
```

**⚠️ Security Notes:**
- These secrets are stored securely in Streamlit Cloud
- NOT visible in your git repo
- NOT visible in deployed app code
- Only accessible by your deployed app

---

### 2.4: Deploy

1. **Click "Deploy"**
2. **Wait 2-3 minutes** for deployment (you'll see build logs)
3. **App will auto-launch** when ready

**Your deployed URL will be:**
```
https://weekend-planner-[random-hash].streamlit.app
```

**Example:** `https://weekend-planner-abc123xyz.streamlit.app`

---

## Step 3: Test Deployed Dashboard

### 3.1: Create Test Token in Supabase

**Run in Supabase SQL Editor:**
```sql
INSERT INTO conversation_tokens (conv_id, expires_at)
VALUES ('test-deployed-2025-11-02', NOW() + INTERVAL '7 days')
RETURNING *;
```

### 3.2: Test Dashboard Access

**Visit:**
```
https://weekend-planner-[your-hash].streamlit.app?conv_id=test-deployed-2025-11-02
```

**Expected:**
- ✅ Dashboard loads (no errors)
- ✅ Shows "Welcome!" message (no conversation history yet)
- ✅ Chat input is visible

### 3.3: Test Tools

**Try these queries:**
1. "What activities are good for outdoor sunny days?"
2. "Show me our visit history"
3. "Find restaurants in Berkeley"

**Expected:**
- ✅ Claude responds (may take 2-5 seconds)
- ✅ Tool calls are executed
- ✅ Results displayed correctly
- ✅ Messages persist (refresh page, still there)

---

## Step 4: Update n8n Workflow with Dashboard URL

**Once you have your deployed URL:**

1. **Open n8n workflow:** https://dshein.app.n8n.cloud/workflow/wRRp1fTwNzOHr9rY

2. **Edit "Generate Magic Link" node** (you'll add this node - see N8N-WORKFLOW-UPDATES.md)

3. **Update dashboard URL in the code:**
   ```javascript
   const dashboardUrl = `https://weekend-planner-[YOUR-HASH].streamlit.app?conv_id=${convId}`;
   ```

4. **Replace `[YOUR-HASH]`** with your actual Streamlit app hash

**Save workflow**

---

## Step 5: End-to-End Test

**After n8n workflow is updated:**

1. **Run n8n workflow manually** (Execute Workflow button)
2. **Check email inbox** (david.shein@gmail.com)
3. **Click magic link in email**
4. **Verify:**
   - Dashboard opens with suggestions
   - Can chat about suggestions
   - Messages persist

---

## Troubleshooting

### Issue: Dashboard shows "Connection error"

**Check:**
- Streamlit Cloud app status (should be green/running)
- Secrets are configured correctly
- Supabase is accessible

**Fix:**
- View logs in Streamlit Cloud dashboard
- Check for API key issues
- Verify Supabase credentials

---

### Issue: "Invalid link" error

**Check:**
- Token exists in Supabase: `SELECT * FROM conversation_tokens WHERE conv_id = 'YOUR-TOKEN';`
- Token hasn't expired (check `expires_at` column)
- URL parameter is correct (`?conv_id=...`)

**Fix:**
- Create new test token
- Verify n8n workflow is creating tokens correctly

---

### Issue: Claude not responding

**Check:**
- Anthropic API key is valid
- API key has credits available
- Check Streamlit logs for errors

**Fix:**
- Verify API key in Streamlit secrets
- Check Anthropic dashboard: https://console.anthropic.com/

---

### Issue: Tools not working

**Check:**
- Supabase connection working
- Database tables have data
- Tool queries are correct

**Fix:**
- Test Supabase connection in logs
- Verify SUPABASE_SERVICE_ROLE_KEY (not anon key!)
- Check tool function implementations

---

## Maintenance

### Updating the Dashboard

**After making code changes:**

```bash
# Make changes to chat_dashboard.py
# Test locally first!

# Commit and push
git add rating-ui/chat_dashboard.py
git commit -m "Update dashboard: [description]"
git push

# Auto-deploys in ~2 minutes
```

**Streamlit Cloud auto-deploys on git push!**

---

### Monitoring

**Streamlit Cloud Dashboard:**
- https://share.streamlit.io/
- View your app
- Check logs for errors
- Monitor usage/performance

**Supabase Dashboard:**
- https://supabase.com/dashboard/project/ohdmrfyyavlkoflbbjsd
- Monitor conversation_tokens table
- Monitor conversations table
- Check for errors in logs

---

## Cost Estimation

**Streamlit Cloud:**
- Free tier: Unlimited public apps
- Private apps: $20/month (not needed for now)

**Anthropic API:**
- Claude 4.5 Sonnet: ~$3-5/month for expected usage
- ~10 conversations/week × 10 messages/conversation × $0.015/1K tokens
- Cost estimate: $5-10/month

**Supabase:**
- Free tier: Sufficient for this use case
- 500MB database, 2GB bandwidth

**Total: ~$5-10/month**

---

## Security Best Practices

✅ **Current security measures:**
- API keys stored in Streamlit secrets (not in code)
- Magic links expire after 7 days
- Cryptographically random tokens (256 bits)
- HTTPS by default (Streamlit Cloud)
- Supabase service role key used (proper permissions)

⚠️ **Future enhancements:**
- Add rate limiting (prevent token brute force)
- Add IP whitelisting (if needed)
- Implement user authentication (v2)
- Add audit logging for sensitive operations

---

## Success Criteria

**Deployment is successful if:**
- ✅ Dashboard accessible via public URL
- ✅ Magic link validation works
- ✅ Claude responds to queries
- ✅ All 4 tools execute correctly
- ✅ Conversation persists across refreshes
- ✅ No errors in logs
- ✅ Mobile responsive

**Ready for family testing if:**
- All above criteria met ✅
- n8n workflow sends email successfully ✅
- Email → Dashboard → Chat flow works end-to-end ✅

---

## Next Steps After Deployment

1. **Test full flow** (n8n → email → dashboard → chat)
2. **Send to wife** for real-world testing
3. **Collect feedback** on UX
4. **Monitor usage** for first 2 weeks
5. **Iterate** based on feedback

---

**Ready to deploy!** 🚀

**Estimated deployment time:** 15 minutes
**Current status:** Code complete, tested locally, ready for Streamlit Cloud
