# Context Architecture - Documentation Strategy

**Created:** 2025-10-14
**Purpose:** Explain the layered context system for optimal Claude Code performance

---

## Problem We're Solving

**Original approach:** One massive STRATEGIC-PLAN.md (20 pages, ~7,000 tokens)
- Claude Code reads entire file on every session start
- Burns 10,000+ tokens just on context loading
- Slow, inefficient, expensive

**Better approach:** Layered context with machine-readable manifest
- Fast path: JSON manifest + summary (< 1,000 tokens)
- Deep path: Full strategic plan (reference as needed)
- Optimized for both bots (speed) and humans (comprehension)

---

## Context Layers

### Layer 1: Machine-Readable Manifest (FAST)

**File:** `.claude/project-status.json`
**Size:** ~200 lines, ~500 tokens
**Read time:** < 10 seconds
**Purpose:** Give Claude Code exactly what it needs to start work

**Contains:**
```json
{
  "current_state": {...},        // Phase, % complete, hours to v1
  "critical_blockers": [...],    // What's blocking progress
  "next_tasks": [...],           // Ordered priority queue (1-5)
  "system_health": {...},        // Database, MCP, API status
  "recent_decisions": [...],     // Context for recent changes
  "timeline": {...}              // Roadmap to v1
}
```

**Usage:** Parse on every session start, extract key info, generate status report

---

### Layer 2: Executive Summary (HUMAN-READABLE)

**File:** `building/STRATEGIC-SUMMARY.md`
**Size:** ~300 words, ~400 tokens
**Read time:** < 2 minutes
**Purpose:** Quick human-readable overview

**Contains:**
- 2-sentence current status
- Critical blocker (what to fix first)
- Next 5 priority tasks (ordered)
- Timeline to v1
- Recent decisions
- Quick reference links

**Usage:** Read for quick context, share with stakeholders, remind yourself of priorities

---

### Layer 3: Detailed Strategic Plan (REFERENCE)

**File:** `building/STRATEGIC-PLAN.md`
**Size:** 20 pages, ~5,000 words, ~7,000 tokens
**Read time:** 15-20 minutes (full read)
**Purpose:** Deep strategic context and rationale

**Contains:**
- Executive summary
- Honest status assessment
- Critical path forward
- Open questions and decisions
- Operational improvements
- Strategic recommendations
- Execution roadmap
- Success metrics
- Risk mitigation

**Usage:**
- **DON'T** read on every session start
- **DO** reference specific sections when:
  - Implementing complex features
  - Making architectural decisions
  - Understanding "why" behind decisions
  - Planning major milestones
  - Dealing with ambiguity

---

### Layer 4: Progress Tracker (DETAILED STATUS)

**File:** `building/PROGRESS.md`
**Size:** ~250 lines, ~1,500 tokens
**Purpose:** Granular task tracking by phase

**Contains:**
- Phase 1-4 breakdowns
- Checkbox lists for each task
- Progress bars (visual)
- Current sprint
- Blockers
- Notes

**Usage:**
- Reference when project-status.json is outdated
- Update after completing tasks
- Track sub-task completion within phases

---

### Layer 5: Session Logs (HISTORICAL)

**File:** `building/session-logs/YYYY-MM-DD-description.md`
**Size:** Variable, ~1,000-3,000 tokens each
**Purpose:** Capture what happened in each work session

**Contains:**
- Session goals
- Accomplishments
- Files created/modified
- Issues encountered
- Key learnings
- Next steps

**Usage:**
- Check "Next Steps" section only (don't read full log)
- Reference when resuming multi-session work
- Understand historical context if needed

---

## Session Start Flow (Optimized)

### Fast Path (< 1,000 tokens, < 1 minute)

1. **Parse `.claude/project-status.json`**
   - Extract: critical_blockers[0], next_tasks[0-2], system_health
   - **Tokens:** ~500

2. **Read `building/STRATEGIC-SUMMARY.md`**
   - Scan headings, read critical blocker section
   - **Tokens:** ~400

3. **Check latest session log "Next Steps" section**
   - Don't read full log, just the end
   - **Tokens:** ~100

**Total:** ~1,000 tokens, < 1 minute
**Result:** 90% of needed context loaded

---

### Deep Path (when needed, ~7,000 tokens, 10-15 minutes)

Only load these if:
- Implementing complex feature
- Making architectural decision
- Need strategic rationale
- Hit ambiguity or uncertainty

4. **Read relevant section of `building/STRATEGIC-PLAN.md`**
   - Don't read whole thing, search for relevant section
   - Example: "Part 4: Operational Improvements"
   - **Tokens:** ~1,000-2,000 per section

5. **Read `building/PROGRESS.md`** (if project-status.json is stale)
   - Check detailed phase breakdown
   - Verify task dependencies
   - **Tokens:** ~1,500

**Total:** ~2,500-3,500 additional tokens
**Result:** Deep context for complex decisions

---

## Document Maintenance

### Who Updates What?

**`.claude/project-status.json`:**
- Updated by: Claude Code (via /document command) or manually
- Frequency: End of every session
- Critical fields: critical_blockers, next_tasks, system_health

**`building/STRATEGIC-SUMMARY.md`:**
- Updated by: Claude Code (regenerate from project-status.json)
- Frequency: After major milestones
- Source of truth: project-status.json

**`building/STRATEGIC-PLAN.md`:**
- Updated by: Manual (strategic reviews)
- Frequency: Quarterly or after major pivots
- Purpose: Deep thinking, not operational tracking

**`building/PROGRESS.md`:**
- Updated by: Claude Code (via /document command)
- Frequency: End of every session
- Use for: Checkbox task tracking

**`building/session-logs/`:**
- Updated by: Claude Code (via /document command)
- Frequency: End of every session
- Use for: Historical context

---

## Design Principles

### 1. Optimize for Machine First, Human Second

**Why:** Claude Code is the primary consumer of this context. Humans can read markdown easily, but bots need structured data.

**How:**
- JSON for machine-readable state
- Markdown for human-readable summaries
- Layered approach (fast then deep)

---

### 2. Single Source of Truth

**project-status.json is the source of truth for:**
- Current phase and completion
- Critical blockers
- Next tasks (priority queue)
- System health

**All other documents derive from or reference it.**

---

### 3. Lazy Loading

**Don't read everything upfront.**

Read just enough to start work (< 1,000 tokens), then load more context only when needed.

**Example:**
- Session start: Read JSON + summary
- Implementing feature: Read relevant IMPLEMENTATION-GUIDE.md section
- Making decision: Read relevant STRATEGIC-PLAN.md section

---

### 4. Separation of Concerns

**Operational (changes frequently):**
- project-status.json
- STRATEGIC-SUMMARY.md
- PROGRESS.md
- session-logs/

**Strategic (changes rarely):**
- STRATEGIC-PLAN.md
- DECISIONS.md
- IMPLEMENTATION-GUIDE.md
- API-REFERENCE.md

---

## Benefits

### For Claude Code:
✅ 90% faster context loading (1,000 tokens vs 10,000)
✅ Structured data easy to parse
✅ Clear priority queue (no ambiguity)
✅ System health checks built-in

### For Humans (David):
✅ Quick status check (read summary, < 2 min)
✅ Deep dives available when needed (full plan)
✅ Historical context preserved (session logs)
✅ Clear what's blocking progress

### For Project:
✅ Reduces token costs
✅ Faster session startup
✅ Better decision tracking
✅ Maintainable over time

---

## Migration from Old Approach

**Old:** Read STRATEGIC-PLAN.md (20 pages) on every session start

**New:**
1. Parse project-status.json (500 tokens)
2. Read STRATEGIC-SUMMARY.md (400 tokens)
3. Reference STRATEGIC-PLAN.md only when needed

**Token savings:** ~9,000 tokens per session start (90% reduction)

**Cost savings:** At $0.003/1K input tokens = ~$0.03 per session
- 10 sessions/month = ~$0.30/month savings
- Minimal $, but **massive speed improvement**

---

## Example: Session Start Comparison

### Old Approach (Inefficient)

```
User: /start

Claude:
1. Read STRATEGIC-PLAN.md (7,000 tokens)
2. Read PROGRESS.md (1,500 tokens)
3. Read latest session log (2,000 tokens)
4. Generate summary from memory

Total: ~10,500 tokens, ~2-3 minutes
```

---

### New Approach (Optimized)

```
User: /start

Claude:
1. Parse project-status.json (500 tokens)
   → Extract: critical_blockers[0], next_tasks[0-2], system_health
2. Read STRATEGIC-SUMMARY.md (400 tokens)
   → Quick overview
3. Check session log "Next Steps" (100 tokens)
   → See what's next

Total: ~1,000 tokens, < 30 seconds

Output:
📊 **Project Status**
Phase: Phase 1 - Foundation (80% complete)
Critical Blocker: Bootstrap rating data (0 visits)
Next Task: Rate 30-40 activities via Streamlit (45 min)
System Health: Database ✓, MCP skeleton only

Ready to work! Recommend: Bootstrap ratings
```

---

## Future Enhancements

### Potential Additions:

1. **Metrics tracking** (add to project-status.json):
   - Session count
   - Total hours logged
   - Tasks completed this week

2. **Auto-sync** (update project-status.json automatically):
   - Parse PROGRESS.md checkboxes
   - Update next_tasks from PROGRESS.md
   - Detect new blockers

3. **Visualization** (generate from project-status.json):
   - Gantt chart of timeline
   - Progress bars
   - Dependency graph

4. **AI-friendly schemas** (enhance JSON structure):
   - Add task dependencies graph
   - Include acceptance criteria per task
   - Track estimated vs actual time

---

## Conclusion

**Key Insight:** Claude Code needs different context than humans. Optimize for machine-readable, layered loading, and lazy references.

**Result:**
- 90% faster session startup
- Same or better context quality
- Maintainable long-term
- Scales as project grows

**This approach should be the standard for all future Claude Code projects.**

---

*Document structure inspired by modern web performance principles: lazy loading, tree shaking, and progressive enhancement.*
