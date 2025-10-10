# 🚀 Start Session Command

Begin a new work session with optimal context loading and immediate action readiness.

## 🎯 Mission

1. Load minimal essential context (~3K tokens)
2. Detect session type (new/resume/continuation)
3. Identify single most important next action
4. Present ultra-concise briefing (max 30 lines)
5. Be ready to execute immediately

---

## 📋 Optimized Loading Strategy

### Phase 1: Essential Context (Parallel Load)

**Execute these reads in parallel for speed:**

1. **START-HERE.md** (full file)
   - Designed as 2-minute orientation
   - Contains current status
   - ~1K-1.5K tokens

2. **NEXT-STEPS.md** (first 100 lines only)
   - Immediate actions section
   - Skip implementation details
   - ~500-800 tokens

3. **Latest session log** (strategic sections):
   - Find: `ls -t building/session-logs/*.md | head -1`
   - Read: First 50 lines (summary) + Last 50 lines (next steps)
   - ~800-1K tokens

**Total Phase 1: ~3K tokens**

### Phase 2: Smart Environment Check

**Run quick checks (parallel bash commands):**

```bash
# 1. File existence (single command)
ls -1 .env .venv 2>/dev/null | wc -l  # Should be 2 if both exist

# 2. Git status (concise)
git status --porcelain --branch 2>/dev/null | head -5

# 3. Session recency (when was last session?)
stat -f "%Sm" -t "%Y-%m-%d %H:%M" $(ls -t building/session-logs/*.md | head -1) 2>/dev/null
```

**Extract from results:**
- Configuration ready? (.env exists)
- Environment ready? (.venv exists)
- Uncommitted work? (git status)
- Time since last session? (hours/days/weeks)

### Phase 3: Session Type Detection

**Determine urgency and context:**

**Type A: Immediate Continuation** (< 4 hours since last session)
- Likely same work session
- User probably remembers context
- **Briefing:** Ultra-minimal (show next action only)

**Type B: Resume Work** (4-48 hours since last session)
- New day, need orientation
- User needs context refresh
- **Briefing:** Standard (show status + next action + following steps)

**Type C: Long Gap** (> 48 hours since last session)
- Significant time gap
- User needs fuller context
- **Briefing:** Extended (include recent accomplishments)

### Phase 4: Priority Detection

**Check for high-priority signals:**

1. **Uncommitted changes** → Suggest `/document` first
2. **NEXT-STEPS has "⭐ CRITICAL"** → That's the priority
3. **NEXT-STEPS has "START HERE"** → That's the priority
4. **No clear next step** → Ask user what they want to work on

---

## 🎬 Execution Flow

### Step 1: Parallel Context Load (Speed Optimized)

**Load in single message with multiple tool calls:**
- Read START-HERE.md
- Read NEXT-STEPS.md (limit: 100)
- Bash: Find latest session log
- Read latest session log (first 50 + last 50 lines)
- Bash: Environment checks (all in one command)

**Total time: ~2-3 seconds**

### Step 2: Analyze & Detect

From loaded context, extract:
- Current phase & completion %
- Last session timestamp
- Most recent accomplishment
- Clear next action (with ⭐ or "START HERE" marking)
- Any blockers
- Environment readiness

Calculate:
- Hours since last session
- Session type (A/B/C)
- Priority signals

### Step 3: Generate Briefing

**Adaptive length based on session type:**

**Type A (< 4 hours) - Minimal Briefing (10-15 lines):**
```markdown
# Quick Resume - [Project Name]

**Last session:** [X] hours ago
**Status:** [Phase] - [Y%] complete

## 🎯 Next Action
**[Action]** ([time estimate])
```bash
[exact command]
```
[Brief why - one line]

**Continuing from:** [last accomplishment]

---
Ready to go! 🚀
```

**Type B (4-48 hours) - Standard Briefing (20-25 lines):**
```markdown
# Session Start - [Project Name]

**Status:** [Phase] - [Y%] complete
**Last session:** [X] hours/days ago

## ✅ Recent Progress
- [Last major accomplishment]

## 🎯 Next Action
**[Action]** ([time estimate])
```bash
[exact command]
```
[Why - 1-2 lines]

## 📋 Following Steps
1. [Next action] ([time])
2. [Next action] ([time])

## 🔧 Environment
- Config: [status]
- Dependencies: [status]

---
Ready to work! 🚀
```

**Type C (> 48 hours) - Extended Briefing (25-30 lines):**
```markdown
# Session Start - [Project Name]

**Status:** [Phase] - [Y%] complete
**Last session:** [X] days/weeks ago

## ✅ Recent Accomplishments
- [Top 2-3 from last session]

## 🎯 Next Action
**[Action]** ([time estimate])
```bash
[exact command]
```
[Why - 2-3 lines]

## 📋 Following Steps
1. [Next action] ([time])
2. [Next action] ([time])
3. [Next action] ([time])

## ⚠️ Notes
- [Any blockers or context needed]

## 🔧 Environment
- Config: [status]
- Dependencies: [status]

## 📚 Context Loaded
[List what was read]

---
Ready to work! 🚀 Or ask questions for more context.
```

---

## ⚡ Critical Optimizations

### 1. Eliminate PROGRESS.md Read
**Why:** START-HERE.md already has current status
**Savings:** ~500-1K tokens
**Exception:** Only load PROGRESS.md if START-HERE missing

### 2. Strategic Session Log Sections
**Instead of:** "First 100 + last 100 lines" (arbitrary)
**Use:** "First 50 + last 50 lines" (captures summary + next steps)
**Why:** Session logs have structure:
- Lines 1-50: Title, status, goals, accomplishments
- Lines -50 to end: Next steps, quick start commands
**Savings:** 50% reduction in session log tokens

### 3. Adaptive Briefing Length
**Instead of:** Always 50 lines
**Use:** 10-15 (Type A), 20-25 (Type B), 25-30 (Type C)
**Why:** Immediate continuation doesn't need full context
**User experience:** Faster resume for short gaps

### 4. Single-Command Environment Check
**Instead of:** Multiple separate bash commands
**Use:** One command with piped checks
```bash
echo "ENV: $(ls .env 2>/dev/null && echo ✅ || echo ❌)" && \
echo "VENV: $(ls -d .venv 2>/dev/null && echo ✅ || echo ❌)" && \
echo "GIT: $(git status --porcelain 2>/dev/null | wc -l | xargs) changes" && \
echo "LAST: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M" $(ls -t building/session-logs/*.md 2>/dev/null | head -1) 2>/dev/null || echo 'No logs')"
```
**Savings:** Faster execution, single tool call

### 5. Priority Signal Detection
**Smart detection of urgency:**
- Search for "⭐ CRITICAL" in NEXT-STEPS
- Search for "START HERE" in NEXT-STEPS
- Check git status for uncommitted work
- Flag if found → Adjust briefing

**User experience:** Always see most important thing first

---

## 🎯 Success Criteria

**Speed:**
- ✅ Context loaded in < 3 seconds
- ✅ Briefing presented in < 5 seconds total
- ✅ User can start working in < 10 seconds

**Efficiency:**
- ✅ ~3K tokens used (1.5% of 200K budget)
- ✅ 197K tokens remaining for work
- ✅ No redundant file reads

**Clarity:**
- ✅ ONE clear next action
- ✅ Exact command ready to copy/paste
- ✅ Time estimate provided
- ✅ No decision fatigue

**Adaptability:**
- ✅ Briefing length matches context needs
- ✅ Detects priority signals
- ✅ Handles edge cases (no session logs, uncommitted work)

---

## 🚨 Special Cases

### Case 1: No Session Logs Yet
**Detection:** `building/session-logs/` empty or doesn't exist
**Action:**
- Skip session log read
- Use START-HERE and NEXT-STEPS only
- Note: "First session or new project"
- Briefing Type: C (extended, to orient fully)

### Case 2: Uncommitted Work Detected
**Detection:** Git status shows staged/unstaged changes
**Action:**
- **Priority override:** Suggest `/document` FIRST
- Show in briefing:
```markdown
⚠️ **Uncommitted Work Detected** ([X] files changed)

**Recommended:** Run `/document` to capture current state before continuing.

Or: Type "continue anyway" to proceed with uncommitted work.
```

### Case 3: No Clear Next Step
**Detection:** NEXT-STEPS.md is vague or missing next action
**Action:**
- Flag in briefing
- Ask user: "What would you like to work on?"
- Offer options from NEXT-STEPS if available
- Or: Load PROGRESS.md to show what's pending

### Case 4: Multiple Priority Signals
**Detection:** Multiple "⭐ CRITICAL" or "START HERE" markers
**Action:**
- Choose the **first** one encountered
- List others as "Following Steps"
- User can override if needed

### Case 5: Brand New Project
**Detection:** START-HERE.md doesn't exist
**Action:**
- Load README.md instead
- Note: "First time setup"
- Offer: "Want me to create documentation structure?"
- Briefing Type: C (extended)

---

## 💡 Token Budget Breakdown

**Optimized `/start` token usage:**

| Item | Tokens | % of Budget |
|------|--------|-------------|
| START-HERE.md (full) | ~1,200 | 0.6% |
| NEXT-STEPS.md (100 lines) | ~600 | 0.3% |
| Latest session log (100 lines) | ~800 | 0.4% |
| Environment checks | ~200 | 0.1% |
| Briefing generation | ~400 | 0.2% |
| **TOTAL** | **~3,200** | **1.6%** |
| **Remaining for work** | **196,800** | **98.4%** |

**Comparison to alternatives:**

| Approach | Tokens | % Budget | Remaining |
|----------|--------|----------|-----------|
| **Optimized `/start`** | 3,200 | 1.6% | 196,800 |
| Original `/start` | 5,000 | 2.5% | 195,000 |
| Load all building/ docs | 30,000 | 15% | 170,000 |
| Load everything | 80,000 | 40% | 120,000 |

**Efficiency gain:** 37% fewer tokens than original version!

---

## 📊 Example Outputs

### Example A: Immediate Continuation (2 hours since last session)

```markdown
# Quick Resume - Weekend Activity Planner

**Last session:** 2 hours ago
**Status:** Phase 1 - 75% complete

## 🎯 Next Action
**Bootstrap Ratings via Rating UI** (45 min) ⭐
```bash
cd rating-ui && streamlit run streamlit_app.py
```
Rate 30-40 activities. Needed for recommendation algorithms.

**Continuing from:** Supabase setup complete

---
Ready to go! 🚀
```

### Example B: Resume Work (1 day since last session)

```markdown
# Session Start - Weekend Activity Planner

**Status:** Phase 1 - 75% complete
**Last session:** 1 day ago

## ✅ Recent Progress
- Supabase database fully operational (75 activities, 25 restaurants)

## 🎯 Next Action
**Bootstrap Ratings via Rating UI** (45 min) ⭐
```bash
cd rating-ui
streamlit run streamlit_app.py
```
Rate 30-40 activities you've visited. Required for recommendation algorithms to work.

## 📋 Following Steps
1. Implement Food Finder MCP (2-3 hours)
2. Implement Activity Planner MCP (3-4 hours)

## 🔧 Environment
- Config: ✅ Ready (.env exists)
- Dependencies: ✅ Ready (.venv exists)

---
Ready to work! 🚀
```

### Example C: Long Gap (1 week since last session)

```markdown
# Session Start - Weekend Activity Planner

**Status:** Phase 1 - 75% complete
**Last session:** 7 days ago

## ✅ Recent Accomplishments
- Supabase database fully operational (75 activities, 25 restaurants)
- `/document` and `/clean-up` slash commands created
- All documentation updated

## 🎯 Next Action
**Bootstrap Ratings via Rating UI** (45 min) ⭐
```bash
cd rating-ui
pip install -r requirements.txt
streamlit run streamlit_app.py
```
Rate 30-40 activities you've actually visited (Frog Park, Heather Farms, etc.).
Critical: Recommendation algorithms need this data to work.
Rate separately for 3yo and 5yo (different preferences).

## 📋 Following Steps
1. Implement Food Finder MCP (2-3 hours) - Easiest server
2. Implement Activity Planner MCP (3-4 hours) - Most important
3. Test end-to-end with orchestrator

## ⚠️ Notes
- Database is ready with seed data
- No blockers - ready to continue

## 🔧 Environment
- Config: ✅ Ready (.env exists)
- Dependencies: ✅ Ready (.venv exists)
- Git: 0 uncommitted changes

## 📚 Context Loaded
- START-HERE.md ✅
- NEXT-STEPS.md ✅
- Session log: 2025-10-09-supabase-setup-and-slash-commands.md ✅

---
Ready to work! 🚀 Ask questions for more context.
```

---

## 🚀 Execute Now

1. **Parallel load** (single message, multiple tools):
   - Read START-HERE.md
   - Read NEXT-STEPS.md (limit: 100)
   - Find & read latest session log (first 50 + last 50)
   - Bash: Environment check (single command)

2. **Analyze**:
   - Extract current status
   - Calculate hours since last session
   - Detect session type (A/B/C)
   - Identify priority signals

3. **Generate briefing**:
   - Use appropriate template for session type
   - Include only relevant sections
   - Keep under line limit
   - Clear next action with exact command

4. **Present**:
   - Show briefing
   - Be ready to execute next action
   - Offer to load more context if needed

**Approach:** Ultra-fast, minimal tokens, maximum clarity. User working in 10 seconds.

Begin session startup now.
