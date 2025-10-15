# /start - Begin New Work Session

**Purpose:** Load latest project context and verify system health before starting work.

**When to use:** At the beginning of EVERY work session, before accepting any tasks.

---

## Instructions for Claude Code

When this command is invoked, perform these steps in order:

### Step 1: Load Latest Context (ALWAYS)

**Read in this order** (optimized for speed):

1. **`.claude/project-status.json`** (machine-readable, ~100 lines)
   - Parse critical_blockers array
   - Parse next_tasks array (first 3 items)
   - Parse system_health object
   - **This gives you 90% of needed context in ~500 tokens**

2. **`building/STRATEGIC-SUMMARY.md`** (~300 words, < 2 min read)
   - Quick human-readable summary
   - Current status and priorities
   - Timeline and next steps

3. **`building/session-logs/[most-recent].md`** (scan, don't read fully)
   - Check "Next Steps" section only
   - See what was done vs what remains

**Only if needed for deep context:**

4. **`building/STRATEGIC-PLAN.md`** (20 pages, reference as needed)
   - Don't read upfront - reference specific sections when needed
   - Use when implementing complex features
   - Consult for strategic rationale or detailed plans

5. **`building/PROGRESS.md`** (comprehensive status)
   - Read if project-status.json is outdated
   - Use for detailed phase breakdowns

### Step 2: Verify .env Configuration (CRITICAL)

**Always check .env setup to prevent security issues and missing credentials.**

Run these checks:

```bash
# 1. Check if .env exists
ls -la .env

# 2. Verify required keys are present (grep for key names, not values!)
grep -E "^(SUPABASE_URL|SUPABASE_ANON_KEY|DATABASE_PASSWORD|SUPABASE_PROJECT_REF)" .env | wc -l
# Should return 4 for Phase 1 minimum

# 3. Verify .env is gitignored
git check-ignore .env
# Should output: .env (confirms it's ignored)
```

**Report .env status:**

```markdown
🔒 **.env Configuration Check**

**Status:** ✅ Ready / ⚠️ Missing keys / ❌ Not found

**Phase 1 Required Keys:**
- SUPABASE_URL: [✓ Found / ✗ Missing]
- SUPABASE_ANON_KEY: [✓ Found / ✗ Missing]
- SUPABASE_SERVICE_ROLE_KEY: [✓ Found / ✗ Missing]
- DATABASE_PASSWORD: [✓ Found / ✗ Missing]
- SUPABASE_PROJECT_REF: [✓ Found / ✗ Missing]
- SUPABASE_ACCESS_TOKEN: [✓ Found / ✗ Missing]

**Git Safety:** .env is [✓ Ignored / ⚠️ NOT IGNORED - FIX NOW!]
```

**If .env is missing or incomplete:**

```markdown
⚠️ **.env Setup Required**

**Create .env file:**
```bash
cd /Users/dshein/Personal\ Projects/projects/weekend-activity-planner
cp .env.example .env
```

**Then add these credentials:**
1. **Supabase:** Get from https://supabase.com/dashboard/project/ohdmrfyyavlkoflbbjsd/settings/api
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

2. **Database Password:** Get from https://supabase.com/dashboard/project/ohdmrfyyavlkoflbbjsd/settings/database
   - DATABASE_PASSWORD (the password you just rotated!)

3. **Supabase MCP Token:** Get from https://supabase.com/dashboard/account/tokens
   - SUPABASE_ACCESS_TOKEN

**IMPORTANT:** NEVER commit .env to git!
```

### Step 3: Verify System Health

Run these checks:

```bash
# 1. Check MCP connection
claude mcp list

# 2. Verify Supabase has data
# Ask user if they want to run database health check via MCP

# 3. Check git status (don't commit secrets)
git status
```

### Step 4: Report Current State

Parse project-status.json and provide summary:

```
📊 **Project Status** (from project-status.json)

**Phase:** {current_state.phase} ({current_state.completion_percentage}% complete)
**Overall Progress:** {current_state.overall_completion_percentage}% toward v1
**Time to v1:** ~{current_state.estimated_hours_to_v1} hours

**🚨 Critical Blocker:** {critical_blockers[0].name}
   Impact: {critical_blockers[0].impact}
   Solution: {critical_blockers[0].solution}
   Time: {critical_blockers[0].time_estimate}

**✅ Next Priority Tasks:**
1. {next_tasks[0].name} ({next_tasks[0].time_estimate})
2. {next_tasks[1].name} ({next_tasks[1].time_estimate})
3. {next_tasks[2].name} ({next_tasks[2].time_estimate})

**System Health:**
- Database: {system_health.database.status}
  - Activities: {system_health.database.seed_data.activities}
  - Restaurants: {system_health.database.seed_data.restaurants}
  - Visits: {system_health.database.seed_data.visits} ⚠️
- MCP: {system_health.mcp_servers.status}
- Supabase MCP: {system_health.mcp_servers.supabase_mcp}

**Ready to work!** Recommend tackling: {next_tasks[0].name}
```

### Step 5: Ask User What to Work On

Don't assume - let user choose from:
- Critical blocker (if exists)
- Next priority task from roadmap
- Specific user request
- Code review / testing
- Documentation update

---

## Example Usage

```
User: /start

Claude: [Loads context files...]

📊 **Project Status Summary**

**Phase:** Phase 1 - Foundation (~80% complete)
**Progress:** 25-30% toward v1 launch

**Last Session:** 2025-10-14 - Strategic planning and MCP testing

**Critical Blocker:** Bootstrap rating data (visits table empty - blocks Activity Planner)

**Next Priority Task:** Rate 30-40 activities via Streamlit UI (45 min)

**System Health:**
- MCP Connection: ✓ Supabase connected (read-only)
- Database: ✓ 75 activities, 25 restaurants, 0 visits
- Git Status: 3 uncommitted files

**Ready to work!** Should we tackle the critical blocker (bootstrap ratings) or work on something else?
```

---

## Notes

- This command should be run at the START of every session
- It ensures Claude has fresh context from building/ directory
- Prevents duplicate work or misalignment
- Quick health check catches issues early
- User chooses what to work on based on current state
