# Weekend Activity Planner - Next Steps

**Current Status:** Phase 4 (Dashboard) - Ready for Deployment! ✅
**Last Updated:** 2025-11-02
**Latest Session:** Security cleanup & API key migration (45 min session)
**Latest Documentation:** `building/session-logs/2025-11-02-security-cleanup-api-key-migration.md`

---

## 🎯 IMMEDIATE NEXT STEP (Start Here!)

### Test Dashboard with New API Keys ⭐

**Time:** 5-10 minutes
**Goal:** Verify all 4 tools work with new Supabase keys
**Status:** Dashboard running on localhost:8501, needs functional testing

**Why this is the priority:**
- ✅ Security cleanup complete (all exposed keys removed)
- ✅ Migrated to new Supabase API keys (publishable/secret format)
- ✅ Dashboard code updated and restarted
- 🟡 Need to verify everything still works before deployment

**Test URL:** http://localhost:8501?conv_id=test-2025-11-02

**Test these queries:**
1. "What activities are good for outdoor sunny days?"
2. "Show me our visit history"
3. "Find restaurants in Berkeley"
4. "What's the weather forecast?"

**Expected:** All tools execute without errors, database queries return results

**If tests pass:** Proceed to Streamlit Cloud deployment (next step)
**If errors:** Check logs with `tail -50 /tmp/streamlit.log`

---

## 📋 Implementation Checklist

### Phase 1: Database Schema ✅ COMPLETE

**Location:** Supabase SQL Editor

- [x] Create `conversations` table
  - Stores chat messages (user ↔ assistant)
  - Links to magic link tokens
  - JSONB metadata for structured actions

- [x] Create `conversation_tokens` table
  - Magic link security
  - 7-day expiration
  - Tracks token usage

**Status:** Tables created and verified (2025-11-02)
**Test token:** `test-2025-11-02` (expires 2025-11-09)

---

### Phase 2: Streamlit Dashboard ✅ COMPLETE

**Location:** `rating-ui/chat_dashboard.py` (~450 lines)

- [x] Magic link validation system
  - Parse `conv_id` from URL params
  - Check token exists and hasn't expired
  - Mark token as used

- [x] Chat UI implementation
  - Use `st.chat_message()` for conversation display
  - Use `st.chat_input()` for user input
  - Load conversation history from Supabase
  - Display messages with proper avatars (👤 user, 🤖 assistant)

- [x] Claude API integration (Claude 4.5 Sonnet)
  - Build message history for context
  - Call Claude with system prompt
  - Tool calling with 4 tools integrated
  - Save responses to conversations table

- [x] Conversation persistence
  - Save user messages to Supabase immediately
  - Save assistant responses after Claude returns
  - Auto-reload messages on page refresh

- [x] Mobile responsiveness
  - Responsive design
  - Chat input visible on mobile

**Status:** Built and tested (2025-11-02)
**Tools:** query_activities, find_restaurants, get_visit_history, get_weather_forecast

---

### Phase 3: Local Testing 🟡 IN PROGRESS

- [x] Create test token
  - Token created: `test-2025-11-02`
  - Expires: 2025-11-09

- [x] Run dashboard locally
  - Dashboard running on http://localhost:8501
  - Using new Supabase API keys (publishable/secret format)
  - All dependencies installed

- [x] Dashboard started successfully
  - http://localhost:8501?conv_id=test-2025-11-02

- [ ] **Test all 4 tools** (NEEDS VERIFICATION)
  - [ ] query_activities tool
  - [ ] find_restaurants tool
  - [ ] get_visit_history tool
  - [ ] get_weather_forecast tool

- [ ] **Verify persistence**
  - [ ] Messages persist after refresh
  - [ ] Conversation history loads correctly

**Next action:** Test dashboard at URL above with sample queries

---

### Phase 4: Streamlit Cloud Deployment ⏸️ READY (pending local test)

**Prerequisites:**
- [x] Code committed to GitHub (commits: 38a6d0f, 237dba6, 2a12c56)
- [x] Dependencies updated (anthropic>=0.34.0)
- [x] Security cleanup complete
- [x] API keys migrated to new format
- [ ] Local testing complete (pending)

**Deployment steps:**
- [ ] Deploy to Streamlit Cloud
  - Visit: https://share.streamlit.io/
  - Click "New app"
  - Repo: dshein87/personal-projects
  - Branch: main
  - File: projects/weekend-activity-planner/rating-ui/chat_dashboard.py
  - Add secrets:
    ```toml
    SUPABASE_URL = "https://ohdmrfyyavlkoflbbjsd.supabase.co"
    SUPABASE_SECRET_KEY = "[paste-new-secret-key]"
    ANTHROPIC_API_KEY = "[paste-anthropic-key]"
    ```
  - Deploy

- [ ] Test deployed app
  - Create test token in Supabase
  - Visit deployed URL with conv_id parameter

**Guide:** `building/STREAMLIT-DEPLOYMENT.md` (complete step-by-step)
**Estimated time:** 15 minutes after local testing passes

---

### Phase 5: n8n Workflow Updates (45 minutes)

**Location:** n8n Cloud (workflow ID: wRRp1fTwNzOHr9rY)

- [ ] Add "Generate Magic Link" node (Code node)
  - Generate unique token: `${date}-${crypto.randomBytes(16).toString('hex')}`
  - Calculate expiration: 7 days from now
  - Build dashboard URL with conv_id parameter

- [ ] Add "Store Magic Link Token" node (HTTP Request)
  - POST to `/rest/v1/conversation_tokens`
  - Store conv_id and expires_at

- [ ] Add "Store Suggestions in Conversation" node (HTTP Request)
  - POST to `/rest/v1/conversations`
  - Save initial suggestions as assistant message
  - Include metadata with activity_ids

- [ ] Update Email node (Gmail or existing email service)
  - Replace WhatsApp Send node
  - Subject: "🎉 Your Weekend Suggestions Are Ready!"
  - Body: HTML email with magic link button
  - Link: Dashboard URL with conv_id

- [ ] Test complete workflow
  - Click "Execute Workflow"
  - Verify all nodes succeed
  - Check email inbox
  - Click magic link
  - Verify dashboard loads with suggestions

**Complete code:** See `building/DASHBOARD-IMPLEMENTATION.md` Phase 4

---

### Phase 6: End-to-End Testing (15 minutes)

- [ ] **Database verification**
  ```sql
  SELECT * FROM conversation_tokens ORDER BY created_at DESC LIMIT 1;
  SELECT * FROM conversations ORDER BY created_at DESC LIMIT 1;
  ```

- [ ] **Email delivery**
  - Check inbox for email
  - Verify subject line
  - Click magic link
  - Should open dashboard

- [ ] **Dashboard functionality**
  - Loads without errors
  - Shows suggestions from assistant
  - Can type messages
  - Claude responds appropriately
  - Messages persist

- [ ] **Conversation memory**
  - Type: "What's the weather like?"
  - Claude should respond contextually
  - Type: "We went to Frog Park, kids loved it!"
  - Claude should acknowledge and respond

- [ ] **Mobile experience**
  - Open link on phone
  - Dashboard responsive
  - Can type and send messages
  - Keyboard doesn't cover input

---

## 🎨 Optional Enhancements (Week 2+)

These can wait until after basic functionality works:

### Visual Enhancements

- [ ] Add activity photos to suggestions
  - Store image URLs in activities table
  - Display with `st.image()`

- [ ] Add map integration
  - "View Map" button per activity
  - Open Google Maps with coordinates

- [ ] Add rating buttons in chat
  - Quick thumbs up/down
  - Update visits table directly from chat

### Claude Prompt Improvements

- [ ] Test different system prompts
  - More conversational tone?
  - Better activity descriptions?
  - More proactive suggestions?

- [ ] Add MCP tool calling
  - Let Claude query activities table
  - Let Claude update ratings
  - Let Claude check weather

### n8n Workflow Enhancements

- [ ] Add webhook for inbound messages (future)
  - If user replies to email
  - Parse reply and add to conversation

- [ ] Add scheduled cleanup
  - Delete expired tokens
  - Archive old conversations

---

## 🔄 Future Upgrade Path (Optional)

### When to Consider React Rebuild

**Upgrade to React + FastAPI IF:**
- ✅ Wife actively uses Streamlit dashboard weekly
- AND one of:
  - UI polish is limiting adoption
  - Need features Streamlit can't support
  - Want real-time features (WebSockets)
  - Scaling beyond family users

**Time investment:** ~25 hours (but with validated concept + usage data)

**What stays the same:**
- Email workflow (n8n)
- Database schema (conversations, tokens)
- Magic link system (same format)
- Claude prompts (reuse!)

**What changes:**
- Dashboard UI (Streamlit → React + shadcn/ui)
- Backend API (Streamlit server → FastAPI)
- Deployment (Streamlit Cloud → Vercel + Railway)

**Migration guide:** See `building/DECISIONS.md` - "Migration Path (Streamlit → React)"

---

## 📊 Success Metrics

### Week 1 (This Week)

**Goal:** Deploy working dashboard

- [ ] Dashboard deployed to Streamlit Cloud
- [ ] Magic links working end-to-end
- [ ] Claude API integration working
- [ ] Can send test email and chat

### Week 2

**Goal:** Wife tests and provides feedback

- [ ] Send first real suggestion email (Thursday noon)
- [ ] Wife clicks link and explores dashboard
- [ ] She chats with Claude at least once
- [ ] Collect feedback on UX

### Weeks 3-4

**Goal:** Regular usage and iteration

- [ ] Wife uses dashboard weekly
- [ ] Provides feedback via chat
- [ ] System learns from feedback (ratings update)
- [ ] Suggestions improve based on data

### Month 2

**Goal:** Decide on v2 path

- [ ] Dashboard is working well → keep Streamlit, focus on content
- [ ] OR: UI polish needed → plan React rebuild
- [ ] OR: Not being used → diagnose why (content? UX? timing?)

---

## 🚨 Common Issues & Solutions

### Issue: "Invalid link" error

**Check:**
```sql
SELECT * FROM conversation_tokens WHERE conv_id = 'YOUR-TOKEN';
```

**Possible causes:**
- Token not created (n8n node failed)
- Token expired (> 7 days)
- Typo in conv_id

**Fix:**
- Check n8n execution logs
- Create test token manually
- Verify URL parameter

---

### Issue: Claude not responding

**Check Streamlit logs** (in Streamlit Cloud dashboard)

**Possible causes:**
- Missing ANTHROPIC_API_KEY
- Invalid API key
- Rate limit hit

**Fix:**
- Add key to Streamlit secrets
- Verify key in Anthropic dashboard
- Check usage/limits

---

### Issue: Messages not persisting

**Check:**
```sql
SELECT * FROM conversations WHERE conversation_id = 'YOUR-TOKEN';
```

**Possible causes:**
- Wrong Supabase credentials
- Using anon key instead of service role key
- Exception during save

**Fix:**
- Verify SUPABASE_SERVICE_ROLE_KEY
- Check Supabase logs
- Add error logging in code

---

## 📚 Reference Documentation

### Implementation Guides

- **Step-by-step:** `building/DASHBOARD-IMPLEMENTATION.md`
- **Architecture decision:** `building/DECISIONS.md` (Email + Dashboard Architecture)
- **Testing:** `building/TESTING.md`

### Database References

- **Schema:** `database/schema.sql`
- **New tables:** Documented in DASHBOARD-IMPLEMENTATION.md Phase 1

### API Documentation

- **Claude API:** https://docs.anthropic.com/
- **Streamlit:** https://docs.streamlit.io/
- **Supabase:** https://supabase.com/docs

### Deployment

- **Streamlit Cloud:** https://share.streamlit.io/
- **n8n Cloud:** https://dshein.app.n8n.cloud/

---

## ⏱️ Time Breakdown

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Database schema | 15 min | ⏸️ TODO |
| 2 | Streamlit dashboard | 2 hours | ⏸️ TODO |
| 3 | Local testing | 30 min | ⏸️ TODO |
| 4 | Streamlit Cloud deploy | 15 min | ⏸️ TODO |
| 5 | n8n workflow updates | 45 min | ⏸️ TODO |
| 6 | End-to-end testing | 15 min | ⏸️ TODO |
| **TOTAL** | **MVP complete** | **4 hours** | **Ready to start!** |

---

## 🎯 Bottom Line

**What we're building:** Email → Magic Link → Streamlit Dashboard → Chat with Claude → Learn from feedback

**Why this approach:**
- ✅ Ship THIS WEEK (not weeks from now)
- ✅ Validate concept before investing in polish
- ✅ Platform-agnostic (can add WhatsApp later without rewriting)
- ✅ Rich UI (photos, maps, buttons - not just text)
- ✅ Fast iteration (single codebase, free hosting)

**Next action:** Follow `building/DASHBOARD-IMPLEMENTATION.md` step-by-step

**Questions?** See `building/DECISIONS.md` for full architectural rationale

---

*Ready to build? Start with `building/DASHBOARD-IMPLEMENTATION.md` Phase 1!*
