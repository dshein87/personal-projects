# Weekend Activity Planner - Next Steps

**Current Status:** Phase 4 (Dashboard) - Ready to Build!
**Last Updated:** 2025-11-01
**Latest Decision:** Email + Dashboard Architecture (Streamlit MVP → React v2)
**Latest Documentation:** `building/DECISIONS.md` (Decision: Email + Dashboard Architecture)

---

## 🎯 IMMEDIATE NEXT STEP (Start Here!)

### Build Streamlit Conversational Dashboard ⭐

**Time:** 4 hours total
**Goal:** Working chat dashboard deployed to Streamlit Cloud
**Guide:** `building/DASHBOARD-IMPLEMENTATION.md` (complete step-by-step guide)

**Why this is the priority:**
- WhatsApp blocked by Meta → pivoted to superior architecture
- Email + Dashboard = platform-agnostic, swappable push mechanism
- Streamlit MVP = ship THIS WEEK (4 hrs vs 20 hrs for React)
- Validate concept with wife before investing in polish

---

## 📋 Implementation Checklist

### Phase 1: Database Schema (15 minutes)

**Location:** Supabase SQL Editor

- [ ] Create `conversations` table
  - Stores chat messages (user ↔ assistant)
  - Links to magic link tokens
  - JSONB metadata for structured actions

- [ ] Create `conversation_tokens` table
  - Magic link security
  - 7-day expiration
  - Tracks token usage

**SQL scripts:** See `building/DASHBOARD-IMPLEMENTATION.md` Phase 1

**Verification:**
```sql
SELECT COUNT(*) FROM conversations;  -- Should work (0 rows initially)
SELECT COUNT(*) FROM conversation_tokens;  -- Should work (0 rows initially)
```

---

### Phase 2: Streamlit Dashboard (2 hours)

**Location:** `rating-ui/chat_dashboard.py` (new file)

- [ ] Magic link validation system
  - Parse `conv_id` from URL params
  - Check token exists and hasn't expired
  - Mark token as used

- [ ] Chat UI implementation
  - Use `st.chat_message()` for conversation display
  - Use `st.chat_input()` for user input
  - Load conversation history from Supabase
  - Display messages with proper avatars (👤 user, 🤖 assistant)

- [ ] Claude API integration
  - Build message history for context
  - Call Claude with system prompt
  - Handle streaming responses (optional)
  - Save responses to conversations table

- [ ] Conversation persistence
  - Save user messages to Supabase immediately
  - Save assistant responses after Claude returns
  - Auto-reload messages on page refresh

- [ ] Mobile responsiveness
  - Test on phone/tablet
  - Verify chat input stays visible
  - Check keyboard doesn't cover input

**Complete code:** See `building/DASHBOARD-IMPLEMENTATION.md` Phase 2

---

### Phase 3: Local Testing (30 minutes)

- [ ] Create test token manually
  ```sql
  INSERT INTO conversation_tokens (conv_id, expires_at)
  VALUES ('test-123', NOW() + INTERVAL '7 days');
  ```

- [ ] Run dashboard locally
  ```bash
  cd rating-ui
  source .venv/bin/activate
  pip install anthropic  # Add to requirements.txt
  streamlit run chat_dashboard.py
  ```

- [ ] Open test URL
  ```
  http://localhost:8501?conv_id=test-123
  ```

- [ ] Test flow
  - [ ] Page loads without errors
  - [ ] Can type messages
  - [ ] Claude responds
  - [ ] Messages persist after refresh
  - [ ] Mobile responsive (resize browser)

---

### Phase 4: Streamlit Cloud Deployment (15 minutes)

- [ ] Update dependencies
  ```bash
  cd rating-ui
  echo "anthropic>=0.34.0" >> requirements.txt
  ```

- [ ] Commit and push
  ```bash
  git add rating-ui/chat_dashboard.py
  git add rating-ui/requirements.txt
  git commit -m "feat: Add conversational dashboard with Claude API"
  git push
  ```

- [ ] Deploy to Streamlit Cloud
  - Visit: https://share.streamlit.io/
  - Click "New app"
  - Select repo + branch
  - Main file: `rating-ui/chat_dashboard.py`
  - Add secrets (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY)
  - Deploy

- [ ] Test deployed app
  ```
  https://weekend-planner-[random].streamlit.app?conv_id=test-123
  ```

**Save this URL** - you'll need it for n8n workflow!

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
