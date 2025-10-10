# 📚 Documentation & Handoff Command

You are tasked with creating a comprehensive project documentation update and session handoff. This command should be run at the end of a working session to ensure perfect continuity for the next session.

## 🎯 Mission

Create documentation that allows someone (including future David) to:
1. Understand exactly what was accomplished this session
2. Know precisely what to do next (with exact commands)
3. Understand any problems encountered and how they were solved
4. Pick up the project immediately without confusion
5. Learn from decisions and discoveries made

## ⚖️ Proportionality Principle

**Match documentation detail to session significance:**
- **Minor session** (< 1 hour, simple changes): Brief session log, minimal updates
- **Medium session** (1-3 hours, feature work): Standard documentation
- **Major session** (> 3 hours, milestone): Comprehensive documentation

**Don't over-document:** If you only fixed a typo, don't write a 5-page report.

---

## 📋 Required Actions

### 0. CHECK WHAT EXISTS FIRST

Before updating files, verify they exist:
- `building/session-logs/` directory (create if missing)
- `building/PROGRESS.md` (should exist)
- `NEXT-STEPS.md` (should exist)
- `START-HERE.md` (should exist)
- `building/ISSUES.md` (may need creation)
- `building/DECISIONS.md` (may need creation)

**Only update files that exist.** Don't create new top-level documentation files unless explicitly needed.

---

### 1. ANALYZE THE SESSION

Review the entire conversation and identify:

**Accomplishments:**
- What features were built or configured?
- What problems were solved?
- What files were created or modified?
- What tools were installed?
- What database changes were made?
- What tests were run?

**Issues Encountered:**
- What errors occurred?
- How were they resolved?
- What didn't work as expected?
- What workarounds were needed?
- What bugs were discovered?

**Decisions Made:**
- Why were certain approaches chosen?
- What alternatives were considered?
- What trade-offs were made?
- What was deferred for later?

**Configuration Changes:**
- What credentials were added?
- What .env variables were set?
- What dependencies were installed?
- What APIs were configured?

**Next Steps Identified:**
- What is the immediate next action?
- What are the next 3-5 steps?
- What is blocked or waiting?
- What needs testing?

### 2. CREATE SESSION LOG

Create a new file: `building/session-logs/YYYY-MM-DD-session-description.md`

Use today's date and a short descriptive name (e.g., `2025-10-09-supabase-setup.md`)

**⚠️ IMPORTANT:** Only include sections that are relevant to this session. Skip sections with nothing to report.

**Session Log Structure (use what's needed):**
```markdown
# Session Log: [Short Description]

**Date:** YYYY-MM-DD
**Duration:** [Approximate time]
**Phase:** [Current project phase]
**Status:** [Overall session outcome: Success/Blocked/In Progress]

---

## 🎯 Session Goals

[What we set out to accomplish]

---

## ✅ Accomplishments

[Detailed list of what was completed, with file paths and specifics]

### Files Created/Modified
- `path/to/file.ext` - [What changed and why]
- `path/to/file.ext` - [What changed and why]

### Configuration Changes
- [Environment variables added]
- [Dependencies installed]
- [Services configured]

### Database Changes
- [Schema updates]
- [Data loaded]
- [Tables created]

---

## 🐛 Issues Encountered

### Issue 1: [Brief description]
**Problem:** [Detailed explanation]
**Cause:** [Root cause if known]
**Solution:** [How it was resolved]
**Prevention:** [How to avoid in future]

[Repeat for each issue]

---

## 💡 Key Learnings

- [Important insights discovered]
- [Patterns identified]
- [Best practices learned]
- [Gotchas to remember]

---

## 🎯 Decisions Made

### Decision 1: [Topic]
**Context:** [Why this decision was needed]
**Options Considered:**
1. [Option A] - Pros/Cons
2. [Option B] - Pros/Cons
**Chosen:** [Selected option]
**Rationale:** [Why this was chosen]

[Repeat for each decision]

---

## 📊 Current State

**Completed:**
- ✅ [Item 1]
- ✅ [Item 2]

**In Progress:**
- 🟡 [Item 1] - [Current status]

**Blocked:**
- ⏸️ [Item 1] - [What's blocking it]

**Not Started:**
- ⏸️ [Item 1]

---

## 🚀 Next Steps

### Immediate Next Action (Start Here!)
**Action:** [Exact action to take]
**Time:** [Estimated time]
**Command:**
```bash
[Exact command to run]
```
**Expected Outcome:** [What should happen]

### Following Steps (In Order)
1. **[Action 1]** ([Time estimate])
   - Command: `[exact command]`
   - Goal: [What this accomplishes]

2. **[Action 2]** ([Time estimate])
   - Command: `[exact command]`
   - Goal: [What this accomplishes]

[Continue for 3-5 steps]

---

## 📁 Important File Paths

- **Config:** `path/to/.env` - [Description]
- **Database:** `path/to/schema.sql` - [Description]
- **Main Code:** `path/to/main.py` - [Description]
[List all relevant paths]

---

## 🔑 Credentials & Configuration

**⚠️ CRITICAL: NEVER include actual credentials, passwords, API keys, or secrets.**

**Document locations only:**
- Supabase: Project URL stored in `.env`, Dashboard at https://supabase.com/dashboard/project/[ref]
- Other services: Status and where credentials are stored (NOT the actual credentials)

**Example (CORRECT):**
- ✅ "Anthropic API key added to `.env` as `ANTHROPIC_API_KEY`"
- ❌ "Anthropic API key: sk-ant-1234567890..." (WRONG - never do this)

---

## 🧪 Testing Instructions

**To verify current state:**
```bash
[Commands to verify everything works]
```

**Expected output:**
[What you should see]

---

## 📚 Context for Next Session

[Any additional context that would be helpful for picking this up later]

**Quick Start Commands:**
```bash
# Navigate to project
cd [project-path]

# Activate environment (if needed)
source .venv/bin/activate

# Run next step
[command]
```

---

## 🔗 References

- Related documentation: [Links to relevant docs]
- External resources: [Any helpful links]
- Previous sessions: [Links to related session logs]

---

**Session End:** [Timestamp]
**Next Session Goal:** [What to focus on next time]
```

### 3. UPDATE PROGRESS.MD

Update `building/PROGRESS.md` with:
- Current completion percentages
- What phase we're in
- What's done, in progress, and pending
- Updated timeline estimates
- Any changes to scope or approach

### 4. UPDATE NEXT-STEPS.MD

Update `NEXT-STEPS.md` to reflect:
- Current status (what's just been completed)
- **Immediate next action** with exact commands (most detailed)
- Next 3-5 actions in priority order
- Any blocked items
- Clear success criteria for each step

**Focus:** Detailed step-by-step instructions for implementing next features.

### 5. UPDATE START-HERE.MD

Update `START-HERE.md` sections:
- Current Status (percentages, completion markers)
- **Quick orientation** for what to do next (high-level)
- Success Milestones (check off completed items)
- Any changes to time estimates

**Focus:** Quick resume guide, not detailed implementation steps (those go in NEXT-STEPS.md).

### 6. UPDATE OR CREATE ISSUES.MD

Update `building/ISSUES.md` with:
- New issues discovered
- Issues resolved (move to "Resolved" section)
- Current blockers
- Workarounds in place

### 7. UPDATE DECISIONS.MD (if needed)

Add to `building/DECISIONS.md` any significant:
- Architectural decisions
- Technology choices
- Approach changes
- Trade-offs made

### 8. UPDATE README.MD (if major changes)

**ONLY update the main README.md if there are significant changes:**
- Installation instructions changed
- Major features were added or completed
- Setup process changed
- Prerequisites changed
- Project status fundamentally shifted

**Do NOT update README for:**
- Minor bug fixes
- Internal refactoring
- Documentation updates
- Work in progress

**README updates should be rare** (maybe once per milestone).

## 📝 Documentation Standards

**Writing Style:**
- Use clear, active voice
- Include exact commands (copy-pasteable)
- Reference specific file paths with line numbers when relevant
- Explain WHY, not just WHAT
- Include timestamps and dates
- Use emojis for visual scanning (✅ 🐛 💡 🎯 ⏸️ 🟡)
- Format code blocks with language tags
- Use tables for comparisons
- Include estimated time for each action

**Context Requirements:**
- Someone should be able to resume without asking questions
- Commands should be exact and tested
- File paths should be absolute or clearly relative
- Prerequisites should be explicit
- Expected outcomes should be clear

**Success Criteria:**
- Could you hand this to another developer and they could continue?
- Could future-you pick this up in 6 months without confusion?
- Are all decisions and trade-offs documented?
- Are all credentials and configuration documented (but not exposed)?
- Is the immediate next step crystal clear?

## 🎬 Execution Instructions

1. **Read** the entire conversation from start to finish
2. **Extract** all relevant information systematically
3. **Create** the session log with comprehensive details
4. **Update** all relevant documentation files
5. **Verify** that next steps are crystal clear with exact commands
6. **Review** that someone could pick this up immediately
7. **Confirm** all decisions and learnings are captured

## ⚡ Critical Requirements

### DO:
- ✅ Include exact commands to run (tested and copy-pasteable)
- ✅ Include file paths and line numbers where relevant
- ✅ Explain why decisions were made
- ✅ Document what didn't work and why
- ✅ Make the next action immediately obvious
- ✅ Include time estimates for next actions
- ✅ Reference specific errors and solutions
- ✅ Match documentation length to session significance
- ✅ Skip irrelevant template sections
- ✅ Verify files exist before updating them

### DO NOT:
- ❌ Be vague or assume context
- ❌ Skip documenting issues or failures
- ❌ Forget to update progress indicators
- ❌ Leave next steps ambiguous
- ❌ Include actual credentials, API keys, or secrets
- ❌ Create unnecessary new top-level documentation files
- ❌ Write 10-page logs for minor sessions
- ❌ Update README.md for every small change
- ❌ Duplicate information across multiple files unnecessarily

---

## 🚀 Execute Now

Take your time. Be thorough. Review the entire session. Create documentation that ensures perfect continuity. Make it impossible to be confused about what to do next.

Begin the documentation process now.
