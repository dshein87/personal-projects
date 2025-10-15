# /document - End-of-Session Documentation

**Purpose:** Update all project documentation at the end of a work session to capture progress and maintain context continuity.

**When to use:** At the END of every significant work session (>30 min of work).

---

## Instructions for Claude Code

When this command is invoked, perform these steps:

### Step 1: Assess Session Significance

Determine session type based on work done:

- **Minor session** (<30 min, small changes) - Brief updates only
- **Standard session** (30min-2hrs, feature work) - Standard documentation
- **Major session** (>2hrs or milestone) - Comprehensive documentation

### Step 2: Update PROGRESS.md

1. Read current building/PROGRESS.md
2. Update:
   - Last updated date (today)
   - Mark completed tasks as [x]
   - Update progress percentages for relevant phases
   - Add any new blockers discovered
   - Update "Current Blockers" section
   - Refresh "Success Metrics for Next Week" if needed
3. Preserve all other content

**Critical:** Update "Last comprehensive review" date at bottom.

### Step 3: Create Session Log

Create: `building/session-logs/YYYY-MM-DD-brief-description.md`

**Template for session log:**

```markdown
# Session Log: YYYY-MM-DD - Brief Description

**Date:** YYYY-MM-DD
**Duration:** ~X hours
**Phase:** [Current phase from PROGRESS.md]
**Status:** [Success / Partial / Blocked]

---

## 🎯 Session Goals

[What you set out to accomplish]

---

## ✅ Accomplishments

[What was actually completed]

### Files Created/Modified
- file1.ext - [Brief description of changes]
- file2.ext - [Brief description of changes]

---

## 🐛 Issues Encountered

[If any - use format from ISSUES.md template]

---

## 💡 Key Learnings

[Technical insights, decisions made, patterns discovered]

---

## 📊 Current State

**Completed:**
- [x] Task 1
- [x] Task 2

**In Progress:**
- [ ] Task 3 (50% done)

**Blocked:**
- [ ] Task 4 (waiting on X)

---

## 🚀 Next Steps

[What should be done in the next session - ordered by priority]

1. **Immediate:** [Highest priority task]
2. **Following:** [Next task after that]
3. **Then:** [Third priority]

**Time Estimate:** [Hours for next session's work]

---

## 📁 Important File Paths

[Any new files or paths relevant to next session]

---

**Session Status:** [✅ Complete / 🟡 Partial / ❌ Blocked]
**Next Session Goal:** [One sentence describing next priority]
```

**Note:** For minor sessions, use abbreviated template with just Accomplishments + Next Steps.

### Step 4: Update START-HERE.md or NEXT-STEPS.md (if needed)

Only update if:
- Major milestone reached (e.g., "Database complete")
- Critical path changed (e.g., "Now unblocked, focus on X")
- New blocker requires different approach

Otherwise, skip this step.

### Step 5: Update .claude/CLAUDE.md Status

Update the status line at top:
```markdown
**Status:** 🚧 In Development (Phase X - Y% Complete)
**Last updated:** YYYY-MM-DD
```

Update the "Critical Context Files" section if new strategic documents were created.

### Step 6: Git Status Check

**CRITICAL - Security Check:**

1. Run `git status`
2. **Check for secrets:** Scan for .env, credentials, API keys
3. **If secrets found:** STOP and warn user loudly:
   ```
   ⚠️ WARNING: .env or credentials detected in git status!
   DO NOT COMMIT THESE FILES.
   Run: git checkout .env
   Verify .gitignore is working.
   ```
4. **If clean:** Report status
   ```
   Git status: X modified files, all safe to commit
   Files changed: [list]
   ```

**DO NOT commit anything. Just report status.**

### Step 7: Provide Summary to User

```markdown
📝 **Documentation Updated**

**Session Summary:**
- Duration: X hours
- Accomplishments: [1-sentence summary]
- Status: [✅ / 🟡 / ❌]

**Files Updated:**
- building/PROGRESS.md (updated progress to X%)
- building/session-logs/YYYY-MM-DD-description.md (created)
- .claude/CLAUDE.md (updated status)

**Next Session Priority:** [One sentence]

**Git Status:** X files modified (safe to commit / ⚠️ CONTAINS SECRETS)

---

All documentation updated! Session context preserved for next time.
```

---

## Security Rules (CRITICAL)

**NEVER document:**
- Actual API keys
- Actual passwords
- Actual credentials
- .env file contents
- Supabase service role keys
- Any secret values

**ONLY document:**
- That credentials were obtained
- Where to get credentials (links to dashboards)
- Template formats (e.g., "sk-ant-xxxxx")
- Whether setup was successful

**If you see real secrets in files:**
1. STOP immediately
2. Warn user
3. Do NOT include in documentation
4. Remind about .gitignore

---

## Example Usage

```
User: /document

Claude: [Reads current session context...]

📝 **Documenting session...**

[Updates PROGRESS.md...]
[Creates session log...]
[Updates .claude/CLAUDE.md...]
[Checks git status...]

📝 **Documentation Updated**

**Session Summary:**
- Duration: 2 hours
- Accomplishments: Implemented Food Finder MCP server, all 4 tools working
- Status: ✅ Complete

**Files Updated:**
- building/PROGRESS.md (Phase 2 now 25% complete)
- building/session-logs/2025-10-15-food-finder-implementation.md
- .claude/CLAUDE.md (status updated)

**Next Session Priority:** Implement Activity Planner MCP server (4 hours)

**Git Status:** 8 files modified (safe to commit)

All documentation updated! Session context preserved for next time.
```

---

## Notes

- Run this at the END of every session before stopping work
- Ensures continuity between sessions
- Future Claude (or you in 3 months) will thank you
- The better the documentation, the faster you can resume
- Takes 2-5 minutes but saves 15+ minutes next session
