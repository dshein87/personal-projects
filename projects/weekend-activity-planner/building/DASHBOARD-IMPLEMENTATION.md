# Dashboard Implementation Guide - Streamlit MVP

**Purpose:** Step-by-step guide to build the conversational dashboard

**Time estimate:** 4 hours total
**Tech stack:** Streamlit + Claude API + Supabase
**Deployment:** Streamlit Cloud (free tier)

---

## Overview

**What we're building:**
```
Email notification → Magic link → Streamlit dashboard → Chat with Claude → Learn from feedback
```

**Key components:**
1. Database tables (conversations + conversation_tokens)
2. Magic link security system
3. Streamlit chat UI
4. Claude API integration with conversation memory
5. n8n workflow updates for email delivery
6. Streamlit Cloud deployment

---

## Phase 1: Database Schema (15 minutes)

### Step 1.1: Create Conversations Table

**Open Supabase SQL Editor:**
```
https://supabase.com/dashboard/project/[your-project-id]/sql/new
```

**Run this SQL:**

```sql
-- Conversation storage
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id TEXT NOT NULL,      -- Links to magic link token (e.g., "2025-11-02-a3f8...")
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),  -- Message sender
  content TEXT NOT NULL,               -- Message text
  metadata JSONB DEFAULT '{}'::JSONB,  -- Structured data (activity IDs, actions, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT conversations_role_check CHECK (role IN ('user', 'assistant'))
);

CREATE INDEX idx_conversations_conv_id ON conversations(conversation_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

-- Auto-update trigger for updated_at if we add it later
COMMENT ON TABLE conversations IS 'Stores all chat messages between user and assistant';
COMMENT ON COLUMN conversations.conversation_id IS 'Links to magic link token, groups messages in one conversation';
COMMENT ON COLUMN conversations.metadata IS 'JSONB for storing structured actions like {"type": "update_rating", "activity_id": 123}';
```

### Step 1.2: Create Conversation Tokens Table

**Run this SQL:**

```sql
-- Magic link tokens
CREATE TABLE conversation_tokens (
  conv_id TEXT PRIMARY KEY,            -- Unique token (e.g., "2025-11-02-a3f8e9c1...")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,     -- 7 days from creation
  used BOOLEAN DEFAULT false,          -- Track if link has been accessed

  -- Constraint: expires_at must be in future
  CONSTRAINT expires_in_future CHECK (expires_at > created_at)
);

CREATE INDEX idx_tokens_expires ON conversation_tokens(expires_at DESC);
CREATE INDEX idx_tokens_used ON conversation_tokens(used) WHERE used = false;

COMMENT ON TABLE conversation_tokens IS 'Magic link tokens for secure dashboard access';
COMMENT ON COLUMN conversation_tokens.conv_id IS 'Cryptographically random token used in magic link URL';
```

### Step 1.3: Verify Tables Created

**Run this query:**

```sql
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('conversations', 'conversation_tokens')
ORDER BY table_name;
```

**Expected output:**
```
table_name            | column_count
---------------------+-------------
conversation_tokens  | 4
conversations        | 6
```

---

## Phase 2: Streamlit Dashboard (2 hours)

### Step 2.1: Create Dashboard File

**Create:** `rating-ui/chat_dashboard.py`

**Full implementation:**

```python
#!/usr/bin/env python3
"""
Weekend Activity Planner - Conversational Dashboard

Email → Magic Link → This Dashboard → Claude API → Supabase
"""

import streamlit as st
from anthropic import Anthropic
from supabase import create_client
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables from project root
load_dotenv('../.env')

# Configuration
st.set_page_config(
    page_title="Weekend Activity Planner",
    page_icon="🎉",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Initialize clients
@st.cache_resource
def get_clients():
    """Initialize Supabase and Anthropic clients (cached for performance)"""
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Server-side key
    )
    anthropic = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    return supabase, anthropic

supabase, anthropic = get_clients()

# Constants
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"
SYSTEM_PROMPT = """You are a helpful weekend activity planning assistant for a family in Oakland, CA with kids ages 3 and 5.

**Your capabilities:**
- Suggest activities based on weather, calendar, drive time, and past ratings
- Answer questions about suggested activities
- Help plan detailed day itineraries
- Learn from feedback to improve future suggestions

**Important context:**
- Family lives in Oakland 94611 (Montclair neighborhood)
- Prefer activities within 30 minutes drive
- Wife has celiac disease (gluten-free required)
- Daughter has allergens: sesame, cashew, flax
- All restaurant suggestions MUST be safe for these restrictions

**When user shares feedback like "We went to Frog Park and loved it!":**
1. Acknowledge warmly
2. Ask clarifying questions (did both kids enjoy it?)
3. Remember this for future suggestions

**When user asks questions:**
1. Provide helpful, specific answers
2. Consider their preferences and past activities
3. Suggest alternatives if needed

Be conversational, friendly, and helpful!"""

def validate_magic_link(conv_id: str) -> bool:
    """Validate magic link token exists and hasn't expired"""
    try:
        result = supabase.table('conversation_tokens')\
            .select('*')\
            .eq('conv_id', conv_id)\
            .gte('expires_at', datetime.now().isoformat())\
            .execute()

        if result.data:
            # Mark token as used (optional tracking)
            supabase.table('conversation_tokens')\
                .update({'used': True})\
                .eq('conv_id', conv_id)\
                .execute()
            return True
        return False
    except Exception as e:
        st.error(f"Error validating link: {str(e)}")
        return False

def load_conversation_history(conv_id: str) -> list:
    """Load all messages for this conversation"""
    try:
        result = supabase.table('conversations')\
            .select('*')\
            .eq('conversation_id', conv_id)\
            .order('created_at', desc=False)\
            .execute()

        return result.data if result.data else []
    except Exception as e:
        st.error(f"Error loading history: {str(e)}")
        return []

def save_message(conv_id: str, role: str, content: str, metadata: dict = None):
    """Save a message to the conversation"""
    try:
        supabase.table('conversations').insert({
            'conversation_id': conv_id,
            'role': role,
            'content': content,
            'metadata': metadata or {}
        }).execute()
    except Exception as e:
        st.error(f"Error saving message: {str(e)}")

def call_claude(messages: list) -> str:
    """Call Claude API with conversation history"""
    try:
        response = anthropic.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=messages
        )
        return response.content[0].text
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}"

# Main UI
st.title("🎉 Weekend Activity Planner")

# Get conversation ID from URL
conv_id = st.query_params.get('conv_id')

if not conv_id:
    st.error("🔒 Invalid link. Please use the link from your email.")
    st.info("Each weekly suggestion email contains a unique link to this dashboard.")
    st.stop()

# Validate magic link
if not validate_magic_link(conv_id):
    st.error("🔒 This link has expired or is invalid.")
    st.info("Links expire after 7 days. Please check your latest email for a new link.")
    st.stop()

# Load conversation history
messages = load_conversation_history(conv_id)

# Display conversation
if messages:
    for msg in messages:
        role = msg['role']
        content = msg['content']
        avatar = "🤖" if role == "assistant" else "👤"

        with st.chat_message(role, avatar=avatar):
            st.markdown(content)

            # Show metadata if present (e.g., suggested activities)
            if msg.get('metadata') and msg['metadata'].get('activity_ids'):
                with st.expander("📋 View activity details"):
                    for activity_id in msg['metadata']['activity_ids']:
                        try:
                            activity = supabase.table('activities')\
                                .select('*')\
                                .eq('id', activity_id)\
                                .execute()

                            if activity.data:
                                act = activity.data[0]
                                col1, col2 = st.columns([3, 1])
                                with col1:
                                    st.write(f"**{act['name']}** ({act['city']})")
                                    st.write(f"📍 {act['drive_time_minutes']} min drive")
                                    if act.get('description'):
                                        st.caption(act['description'])
                                with col2:
                                    if st.button("Map", key=f"map_{activity_id}"):
                                        # Future: Open Google Maps
                                        st.info("Map feature coming soon!")
                        except:
                            pass
else:
    # No messages yet - show welcome
    st.info("👋 Welcome! This is your personalized activity planning dashboard. Start chatting below!")

# Chat input
if prompt := st.chat_input("Ask questions or share feedback..."):
    # Display user message immediately
    with st.chat_message("user", avatar="👤"):
        st.markdown(prompt)

    # Save user message
    save_message(conv_id, "user", prompt)

    # Build message history for Claude
    history = [
        {"role": m['role'], "content": m['content']}
        for m in messages
    ] + [{"role": "user", "content": prompt}]

    # Call Claude
    with st.spinner("Thinking..."):
        response = call_claude(history)

    # Display assistant response
    with st.chat_message("assistant", avatar="🤖"):
        st.markdown(response)

    # Save assistant response
    save_message(conv_id, "assistant", response)

    # Rerun to update UI with saved messages
    st.rerun()

# Footer
st.markdown("---")
st.caption("🤖 Powered by Claude AI • 🗄️ Data stored securely in Supabase")
```

### Step 2.2: Update Dependencies

**Update `rating-ui/requirements.txt`:**

```txt
streamlit>=1.28.0
anthropic>=0.34.0
supabase>=2.0.0
python-dotenv>=1.0.0
```

### Step 2.3: Test Locally

**Terminal commands:**

```bash
cd rating-ui

# Activate venv (create if needed)
if [ ! -d .venv ]; then python3 -m venv .venv; fi
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create test token in Supabase (temporary)
# In Supabase SQL Editor:
# INSERT INTO conversation_tokens (conv_id, expires_at)
# VALUES ('test-123', NOW() + INTERVAL '7 days');

# Run dashboard with test token
streamlit run chat_dashboard.py

# Open browser to: http://localhost:8501?conv_id=test-123
```

**What to test:**
- ✅ Page loads without errors
- ✅ Magic link validation works
- ✅ Can type messages
- ✅ Claude responds
- ✅ Messages persist (refresh page, messages still there)
- ✅ Mobile responsive (resize browser window)

---

## Phase 3: Streamlit Cloud Deployment (15 minutes)

### Step 3.1: Prepare for Deployment

**Ensure .gitignore excludes secrets:**

```bash
# Check .env is gitignored
git check-ignore .env
# Should output: .env

# Check .venv is gitignored
git check-ignore rating-ui/.venv
# Should output: rating-ui/.venv
```

**Commit dashboard code:**

```bash
git add rating-ui/chat_dashboard.py
git add rating-ui/requirements.txt
git commit -m "feat: Add Streamlit conversational dashboard

- Magic link validation
- Claude API integration
- Conversation persistence
- Mobile responsive chat UI

Ready for Streamlit Cloud deployment."

git push
```

### Step 3.2: Deploy to Streamlit Cloud

**Visit:** https://share.streamlit.io/

1. **Sign in** with GitHub
2. **Click "New app"**
3. **Configure:**
   - Repository: `[your-username]/weekend-activity-planner`
   - Branch: `main`
   - Main file path: `rating-ui/chat_dashboard.py`
   - App URL: `weekend-planner` (or choose custom)

4. **Add secrets** (click "Advanced settings" → "Secrets"):

```toml
SUPABASE_URL = "https://[your-project].supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "[redacted-rotated]"  # Use JWT Signing Key instead
ANTHROPIC_API_KEY = "[redacted-rotated]"
```

5. **Click "Deploy"**

**Wait 2-3 minutes for deployment...**

**Your dashboard URL:**
```
https://weekend-planner-[random].streamlit.app
```

**Test deployed dashboard:**
```
https://weekend-planner-[random].streamlit.app?conv_id=test-123
```

---

## Phase 4: n8n Workflow Updates (45 minutes)

### Step 4.1: Add Magic Link Generation Node

**In n8n workflow (ID: wRRp1fTwNzOHr9rY):**

1. **Open workflow:**
   ```
   https://dshein.app.n8n.cloud/workflow/wRRp1fTwNzOHr9rY
   ```

2. **Add new node after "Format Message":**
   - Node type: **Code**
   - Name: **Generate Magic Link**

**Code:**

```javascript
const crypto = require('crypto');

// Generate unique conversation ID
const date = new Date().toISOString().split('T')[0];  // 2025-11-02
const randomToken = crypto.randomBytes(16).toString('hex');  // a3f8e9c1d4b2...
const convId = `${date}-${randomToken}`;

// Calculate expiration (7 days from now)
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7);

return {
  json: {
    conv_id: convId,
    expires_at: expiresAt.toISOString(),
    dashboard_url: `https://weekend-planner-[YOUR-APP].streamlit.app?conv_id=${convId}`
  }
};
```

### Step 4.2: Store Token in Supabase

**Add node after "Generate Magic Link":**
- Node type: **HTTP Request**
- Name: **Store Magic Link Token**

**Configuration:**

```
Method: POST
URL: {{$env.SUPABASE_URL}}/rest/v1/conversation_tokens
Authentication: None (use headers)

Headers:
  apikey: {{$env.SUPABASE_ANON_KEY}}
  Authorization: Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}
  Content-Type: application/json
  Prefer: return=minimal

Body (JSON):
{
  "conv_id": "{{ $json.conv_id }}",
  "expires_at": "{{ $json.expires_at }}"
}
```

### Step 4.3: Store Initial Suggestions Message

**Add node after "Store Magic Link Token":**
- Node type: **HTTP Request**
- Name: **Store Suggestions in Conversation**

**Configuration:**

```
Method: POST
URL: {{$env.SUPABASE_URL}}/rest/v1/conversations
Authentication: None (use headers)

Headers:
  apikey: {{$env.SUPABASE_ANON_KEY}}
  Authorization: Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}
  Content-Type: application/json
  Prefer: return=minimal

Body (JSON):
{
  "conversation_id": "{{ $('Generate Magic Link').item.json.conv_id }}",
  "role": "assistant",
  "content": "{{ $('Format Message').item.json.message }}",
  "metadata": {
    "type": "weekly_suggestions",
    "activity_ids": {{ $('Score Activities').item.json.top_activities }},
    "generated_at": "{{ $now.toISO() }}"
  }
}
```

### Step 4.4: Update Email Node

**Modify existing "Send WhatsApp" node (or add Gmail node):**

**If using Gmail:**
- Node type: **Gmail**
- Operation: **Send**

**Configuration:**

```
To: your-email@gmail.com  # Or wife's email
Subject: 🎉 Your Weekend Suggestions Are Ready!

Message (HTML):
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #1a73e8;">🎉 Weekend Activity Suggestions</h1>

  <p>Hi there!</p>

  <p>I've prepared 3 personalized activity suggestions for this weekend based on:</p>
  <ul>
    <li>✅ Weather forecast</li>
    <li>✅ Your calendar availability</li>
    <li>✅ Past activity ratings</li>
    <li>✅ Drive time preferences</li>
  </ul>

  <div style="margin: 30px 0; text-align: center;">
    <a href="{{ $('Generate Magic Link').item.json.dashboard_url }}"
       style="background-color: #1a73e8; color: white; padding: 15px 30px;
              text-decoration: none; border-radius: 5px; font-size: 16px;
              display: inline-block;">
      View Suggestions & Chat 💬
    </a>
  </div>

  <p><small style="color: #666;">
    Questions? Feedback? Just click the link above and chat with me!<br>
    This link is valid for 7 days.
  </small></p>

  <hr style="border: 1px solid #eee; margin: 30px 0;">

  <p style="color: #999; font-size: 12px;">
    🤖 Powered by Weekend Activity Planner<br>
    📧 You're receiving this because you signed up for weekly suggestions
  </p>
</body>
</html>
```

### Step 4.5: Test Complete Workflow

**Click "Execute Workflow"**

**Expected flow:**
1. ✅ Manual Trigger fires
2. ✅ Query Visit History (~1500 visits)
3. ✅ Query Activities (76 activities)
4. ✅ Score Activities (top 3)
5. ✅ Query Restaurants (~30 restaurants)
6. ✅ Match Restaurants (2 per activity)
7. ✅ Format Message (WhatsApp-style text)
8. ✅ **Generate Magic Link** (new token)
9. ✅ **Store Token** (in conversation_tokens)
10. ✅ **Store Suggestions** (in conversations)
11. ✅ **Send Email** (with magic link)

**Verify:**
```bash
# Check email inbox
# Click magic link
# Should open Streamlit dashboard
# Should see suggestions in chat
# Should be able to chat with Claude
```

---

## Phase 5: End-to-End Testing (15 minutes)

### Test Checklist

**1. Database:**
- [ ] `conversation_tokens` table has new row
- [ ] `conversations` table has assistant message with suggestions

**Query to check:**
```sql
SELECT * FROM conversation_tokens ORDER BY created_at DESC LIMIT 1;
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 1;
```

**2. Email:**
- [ ] Received email with subject "🎉 Your Weekend Suggestions Are Ready!"
- [ ] Email has magic link button
- [ ] Link format: `https://...streamlit.app?conv_id=2025-11-02-...`

**3. Dashboard:**
- [ ] Click link → Dashboard loads
- [ ] Shows "🎉 Weekend Activity Planner" title
- [ ] Shows suggestions from assistant
- [ ] Can type in chat input
- [ ] Claude responds
- [ ] Messages persist (refresh page)

**4. Claude Integration:**
- [ ] Type: "What's the weather like?"
- [ ] Claude gives contextual response
- [ ] Type: "We went to Frog Park yesterday, kids loved it!"
- [ ] Claude acknowledges and responds appropriately

**5. Mobile:**
- [ ] Open link on phone
- [ ] Dashboard is responsive
- [ ] Can scroll chat history
- [ ] Can type messages
- [ ] Keyboard doesn't cover input

---

## Troubleshooting

### Issue: "Invalid link" error

**Check:**
```sql
SELECT * FROM conversation_tokens WHERE conv_id = 'YOUR-TOKEN-HERE';
```

**Common causes:**
- Token not created (n8n node failed)
- Token expired (> 7 days old)
- Wrong conv_id in URL

**Fix:**
- Check n8n execution logs
- Manually create test token
- Verify URL parameter is correct

---

### Issue: Dashboard loads but no messages

**Check:**
```sql
SELECT * FROM conversations WHERE conversation_id = 'YOUR-TOKEN-HERE';
```

**Common causes:**
- Suggestions not stored in conversations table
- Wrong conversation_id

**Fix:**
- Check "Store Suggestions in Conversation" node in n8n
- Verify conversation_id matches token

---

### Issue: Claude not responding

**Check Streamlit logs:**
```
# In Streamlit Cloud dashboard:
# Your app → Logs → Filter for "error"
```

**Common causes:**
- Missing ANTHROPIC_API_KEY in secrets
- Invalid API key
- API rate limit hit

**Fix:**
- Verify API key in Streamlit secrets
- Check Anthropic dashboard for usage/limits
- Add error handling in code

---

### Issue: Messages not persisting

**Check:**
```sql
SELECT COUNT(*) FROM conversations WHERE conversation_id = 'YOUR-TOKEN-HERE';
```

**Common causes:**
- Supabase credentials wrong
- Database write permissions issue
- Exception during save_message()

**Fix:**
- Verify SUPABASE_SERVICE_ROLE_KEY (not anon key!)
- Check Supabase logs
- Add try/except logging in code

---

## Next Steps After Deployment

**Week 1:**
1. **Send test email** (run n8n workflow manually)
2. **Test full flow** yourself
3. **Send to wife** for real test
4. **Collect feedback** on UX

**Week 2-4:**
1. **Monitor usage** (check conversations table)
2. **Refine Claude prompts** based on responses
3. **Add features** as needed:
   - Activity photos
   - Map integration
   - In-chat rating buttons
4. **Improve suggestions** based on feedback

**Optional Later:**
- **WhatsApp integration** (when Meta unblocks)
- **React rebuild** (if Streamlit UX is limiting)
- **Multi-user support** (friends & family)

---

## Success Metrics

**MVP is successful if:**
- ✅ Wife uses it once per week
- ✅ She provides feedback via chat
- ✅ System learns from feedback
- ✅ Suggestions improve over time
- ✅ No major technical issues

**Ready to upgrade to React if:**
- Wife uses it regularly ✅
- AND UI polish is limiting adoption
- AND you have 20 hours to invest

**Keep Streamlit if:**
- It's working fine!
- Focus effort on better suggestions, not shinier UI

---

## Quick Reference Commands

**Local development:**
```bash
cd rating-ui
source .venv/bin/activate
streamlit run chat_dashboard.py
# Open: http://localhost:8501?conv_id=test-123
```

**Deploy to Streamlit Cloud:**
```bash
git add rating-ui/chat_dashboard.py
git commit -m "Update dashboard"
git push
# Auto-deploys in ~2 minutes
```

**Check database:**
```sql
-- Recent conversations
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 10;

-- Active tokens
SELECT * FROM conversation_tokens
WHERE expires_at > NOW()
ORDER BY created_at DESC;
```

**n8n workflow:**
```
https://dshein.app.n8n.cloud/workflow/wRRp1fTwNzOHr9rY
```

---

*This guide provides everything needed to build, deploy, and test the Streamlit dashboard MVP. Total time: ~4 hours. Ship this week!*
