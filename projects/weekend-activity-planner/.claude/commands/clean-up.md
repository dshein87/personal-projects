# /clean-up - Project Maintenance & Cleanup

**Purpose:** Maintain project health by cleaning up old files, archiving completed work, and preventing bloat.

**When to use:**
- Monthly (first of month)
- Before major milestones (v1 launch, etc.)
- When project directory feels cluttered
- When disk space is low

---

## Instructions for Claude Code

When this command is invoked, perform these cleanup operations:

### Step 1: Analyze Current State

Report on:
```bash
# Session logs
find building/session-logs -name "*.md" | wc -l
du -sh building/session-logs

# Total project size
du -sh .

# Git repo size
du -sh .git
```

Provide summary:
```
📊 **Project Health Check**

**Session Logs:** X files, Y MB
**Building Directory:** Z MB total
**Project Size:** N MB total
**Git Repo:** M MB

**Recommendation:** [Clean now / OK to skip]
```

### Step 2: Archive Old Session Logs (Aggressive Retention)

**Retention Policy:**
- **Keep last 30 days** - Always keep recent sessions
- **Keep milestone sessions** - Preserve important sessions regardless of age
  - Keywords: "milestone", "launch", "complete", "major", "v1", "v2"
- **Archive 30-180 days** - Move to archive/ subdirectory
- **Delete >180 days** - Delete completely (not worth keeping)

**Operations:**

```bash
# Create archive directory if needed
mkdir -p building/session-logs/archive

# Archive old sessions (30-180 days old)
find building/session-logs -name "*.md" -mtime +30 -mtime -180 \
  ! -path "*/archive/*" \
  ! -name "*milestone*" \
  ! -name "*launch*" \
  ! -name "*complete*" \
  ! -name "*major*" \
  -exec mv {} building/session-logs/archive/ \;

# Delete very old sessions (>180 days)
find building/session-logs/archive -name "*.md" -mtime +180 -delete
```

**Hard limit on archive:**
- If archive/ exceeds 50MB, delete oldest files until under limit
- Milestone sessions exempt from hard limit

Report:
```
📦 **Session Log Cleanup**

**Archived:** X files (30-180 days old)
**Deleted:** Y files (>180 days old)
**Retained:** Z recent files + N milestone files
**Space Saved:** M MB

**Archive Size:** [Current size] / 50MB limit
```

### Step 3: Clean Temporary Files

Remove safe-to-delete temporary files:

```bash
# Node modules in MCP servers (can be reinstalled)
find mcp-servers -name "node_modules" -type d -exec rm -rf {} +

# Build artifacts in MCP servers
find mcp-servers -name "build" -type d -exec rm -rf {} +
find mcp-servers -name "dist" -type d -exec rm -rf {} +

# Python cache
find . -name "__pycache__" -type d -exec rm -rf {} +
find . -name "*.pyc" -delete
find . -name ".pytest_cache" -type d -exec rm -rf {} +

# macOS cruft
find . -name ".DS_Store" -delete

# Log files (if any)
find . -name "*.log" -mtime +7 -delete
```

Report space saved.

### Step 4: Clean Python Virtual Environments (Optional)

**Ask user first:**
```
Clean Python virtual environment? (rating-ui/.venv)
This will delete ~200MB but requires reinstall later.
[Y/n]
```

If yes:
```bash
rm -rf rating-ui/.venv
```

### Step 5: Verify .gitignore is Working

Check that no secrets are tracked:

```bash
# Check for .env files
git ls-files | grep -E "\.env$|\.env\."

# Check for common secret patterns
git ls-files | grep -E "secret|password|credential|api.*key"
```

**If found:**
```
⚠️ WARNING: Potential secrets in git tracking!
Files: [list]

Review these files. If they contain secrets:
1. git rm --cached <file>
2. Add to .gitignore
3. git commit -m "Remove sensitive files"
```

### Step 6: Verify Database Backups

**Remind user:**
```
💾 **Database Backup Reminder**

Supabase auto-backups daily (free tier: 7 days retention)

Manual backup recommended before major changes:
1. Go to: https://supabase.com/dashboard/project/ohdmrfyyavlkoflbbjsd/database/backups
2. Click "Create manual backup"

Last manual backup: [User should check]
```

**DO NOT** attempt automatic backups (requires user login).

### Step 7: Update Cleanup Report

Create: `building/cleanup-reports/YYYY-MM-DD-cleanup-report.md`

```markdown
# Cleanup Report: YYYY-MM-DD

**Cleanup Type:** [Routine / Pre-Milestone / Emergency]
**Trigger:** [Monthly / User Request / Disk Space]

---

## Actions Taken

### Session Logs
- **Archived:** X files (Y MB)
- **Deleted:** Z files (N MB)
- **Retained:** M files

### Temporary Files
- **node_modules:** [Deleted / Kept]
- **Python cache:** X MB cleaned
- **Build artifacts:** Y MB cleaned
- **macOS files:** Z files cleaned

### Virtual Environments
- **Python venv:** [Deleted Y MB / Kept]

### Total Space Saved
**XX MB** freed

---

## Current Project Size

- **Session logs:** X MB
- **Building/:** Y MB
- **Project total:** Z MB
- **Git repo:** N MB

---

## Health Status

- [ ] Session logs < 30 files
- [ ] Archive < 50MB
- [ ] No secrets in git
- [ ] .gitignore working
- [ ] Database backup recommended

**Status:** ✅ Healthy / ⚠️ Needs attention

---

## Next Cleanup

**Recommended:** [Date 30 days from now]
```

### Step 8: Provide Summary to User

```markdown
🧹 **Cleanup Complete**

**Space Saved:** XX MB

**Actions:**
- Archived X old session logs
- Deleted Y very old logs
- Cleaned Z MB of temporary files
- [Deleted / Kept] Python virtual environment

**Project Health:**
- Session logs: X files (Y MB) ✅
- Archive: Z MB / 50MB limit ✅
- Git status: Clean ✅
- Database: Backup recommended 💾

**Next cleanup:** [Date in 30 days]

All clean! Project is healthy.
```

---

## Safety Rules

**NEVER delete:**
- Source code files (.ts, .py, .sql)
- Documentation files (building/*.md)
- Configuration files (.env.example, .gitignore, package.json)
- Database files or backups
- Any file modified in last 7 days

**ALWAYS ask before deleting:**
- Virtual environments
- Anything >100MB
- Entire directories

**NEVER commit:**
- .env files
- Credentials
- API keys
- Secrets of any kind

---

## Example Usage

```
User: /clean-up

Claude: [Analyzing project...]

📊 **Project Health Check**

**Session Logs:** 45 files, 8.2 MB
**Building Directory:** 15 MB total
**Project Size:** 235 MB total

**Recommendation:** Clean now (>30 session logs)

[Proceeds with cleanup...]

🧹 **Cleanup Complete**

**Space Saved:** 12 MB

**Actions:**
- Archived 20 old session logs (30-180 days)
- Deleted 5 very old logs (>180 days)
- Cleaned 3.5 MB of temporary files
- Kept Python virtual environment

**Next cleanup:** 2025-11-14

All clean! Project is healthy.
```

---

## Notes

- Cleanup is aggressive by design (30-day retention vs 60-day conservative)
- Milestone sessions are always preserved
- Hard limits prevent unbounded growth
- Monthly cleanup keeps project lean
- Can always recreate temporary files (node_modules, venv, cache)
- Session logs are temporary context, not permanent history
  - Real insights belong in DECISIONS.md and ISSUES.md
  - Session logs help with immediate continuity, not long-term reference
