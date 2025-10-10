# 🧹 Clean-Up Command

You are tasked with **aggressively but intelligently** analyzing the project for unnecessary files, cleaning up the codebase, organizing archives, and maintaining a lean folder structure. This is a **thoughtful, data-driven cleanup** that balances safety with efficiency.

## 🎯 Mission

1. Identify and eliminate unnecessary files
2. Archive only what has lasting value
3. Delete aggressively when safe
4. Quantify space savings
5. Prevent future bloat
6. Run `/document` at the end

---

## ⚠️ Safety Principles

### NEVER Touch (Sacred Files):
- `.git/` directory and git history
- `node_modules/`, `venv/`, `.venv/`, `__pycache__/` (package manager territory)
- `.env` or any files with credentials
- Active source code in `mcp-servers/`, `rating-ui/`, `database/`
- Current configuration files (`package.json`, `tsconfig.json`, `requirements.txt`)
- `.gitignore`, `.env.example`
- Primary documentation: `README.md`, `START-HERE.md`, `NEXT-STEPS.md`

### Aggressive Approach:
- **Default to delete** temp files, logs, build artifacts
- **Archive sparingly** - only if historical value is clear
- **Challenge retention** - prove it needs to stay
- **Measure impact** - report space savings
- **User approval required** only for ambiguous files

---

## 🔍 Analysis Process

### Step 1: COMPREHENSIVE SCAN

Recursively examine **every file** and categorize:

#### Immediate Deletion (No User Approval Needed):
```
Pattern-based auto-delete:
- **/.DS_Store
- **/*.tmp, **/*.bak, **/*.swp, **/*~
- **/Thumbs.db, **/desktop.ini
- **/*.log (unless in logs/ directory and < 7 days)
- **/dist/, **/build/, **/.tsbuildinfo (build artifacts - regenerable)
- **/__pycache__/, **/*.pyc, **/*.pyo
- **/coverage/, **/.nyc_output/ (test coverage - regenerable)
- Empty files (0 bytes)
- Files ending in _copy, _backup, _old (unless < 7 days)
```

#### Active Files (Keep):
- Source code in mcp-servers/, rating-ui/, database/
- Configuration files in use
- Current documentation (README, START-HERE, NEXT-STEPS, PROGRESS, DECISIONS, ISSUES)
- Session logs < 30 days (changed from 60 - be more aggressive)
- Scripts actively referenced
- .env.example (template)

#### Archive Candidates (Review for Value):
- Session logs 30-90 days old (changed from 60-180)
  - **Default action:** Delete unless milestone
  - Only archive if contains unique insights not in DECISIONS.md
- Superseded documentation (only if shows meaningful evolution)
- Completed planning docs (check if insights captured in DECISIONS.md first)
- One-time scripts (archive only if complex/might need reference)
- Experimental code (only if demonstrates valuable learning)

#### Aggressive Deletion (User Approval Required):
- Duplicate files (semantic duplicates, not just identical)
- Session logs 90+ days (milestone sessions ask user, routine delete)
- Archive files 180+ days (delete unless explicitly marked "preserve")
- Documentation duplicating info in current docs
- Scripts clearly superseded by better versions

### Step 2: DUPLICATE DETECTION

**File Hash Analysis:**
- Generate SHA-256 hash for all files
- Group identical files
- Keep one, delete others (keep shortest path or most recent)

**Semantic Duplicate Detection:**
- Compare file names (>80% similarity)
- Compare file sizes (within 5%)
- Compare creation dates
- Flag for user review if suspicious

**Example:**
```
schema.sql (100KB, 2025-10-01)
schema_v2.sql (100KB, 2025-10-05)
schema_backup.sql (100KB, 2025-10-05)
→ Likely duplicates, keep schema.sql, delete others
```

### Step 3: SIZE ANALYSIS

For each category, calculate:
- Total size
- Number of files
- Potential space savings
- Impact percentage

**Report:**
```
Temp files: 45MB (234 files) - DELETE
Build artifacts: 120MB (12 dirs) - DELETE
Old session logs: 8MB (45 files) - DELETE (keep 3 milestones = 2MB)
Duplicates: 15MB (23 files) - DELETE

Total savings: 186MB → 181MB net (5MB retained in archive)
```

### Step 4: ARCHIVE ANALYSIS

**If archive/ exists:**

#### Archive Retention Rules (More Aggressive):

**Session Logs:**
- < 30 days: Keep active
- 30-90 days: DELETE unless milestone (milestones identified by: "milestone", "v1", "launch", "completion" in filename)
- 90-180 days: DELETE (archive.tar.gz old milestones for reference)
- 180+ days: DELETE completely (no exceptions - insights should be in DECISIONS.md)

**Documentation:**
- Superseded docs: Keep 1 generation back (delete older)
- Planning docs: DELETE when captured in DECISIONS.md or completed
- Drafts: DELETE after 30 days if not promoted

**Code:**
- Experimental: DELETE after 90 days if not merged
- One-time scripts: DELETE after 180 days if not referenced
- POCs: DELETE immediately if failed/abandoned

**Archive Size Limit:**
- **Hard cap:** 50MB total archive size
- If exceeded: Compress old months to .tar.gz
- If still exceeded: Delete oldest compressed archives

### Step 5: DEPENDENCY AUDIT

**Check for unused dependencies:**

**Node.js (if package.json exists):**
```bash
npx depcheck
# Flag unused packages for removal
```

**Python (if requirements.txt exists):**
```bash
# Check imports vs requirements
# Flag unused packages
```

Report unused dependencies for user approval to remove.

### Step 6: PATTERN DETECTION

**Identify waste patterns:**
- Multiple backup files (user creates manual backups)
- Duplicate documentation (same info, different files)
- Abandoned experiments (started but not finished)
- Verbose logging (oversized log files)
- Redundant seed data (multiple versions of same dataset)

**Recommend preventive measures:**
- Update .gitignore patterns
- Add pre-commit hooks
- Set up automated cleanup
- Configure IDE to not create temp files

---

## 📋 Execution Steps

### Step 1: CREATE CLEANUP REPORT

Create: `building/cleanup-reports/YYYY-MM-DD-cleanup-report.md`

**Report Structure:**

```markdown
# Cleanup Report - YYYY-MM-DD

**Status:** Proposed Actions (Awaiting User Approval for Ambiguous Items Only)
**Estimated Space Savings:** XMB → YMB (Z% reduction)

---

## 📊 Executive Summary

| Category | Files | Size | Action | Savings |
|----------|-------|------|--------|---------|
| Temp files | 234 | 45MB | DELETE (auto) | 45MB |
| Build artifacts | 12 | 120MB | DELETE (auto) | 120MB |
| Duplicates | 23 | 15MB | DELETE (auto) | 15MB |
| Old session logs | 45 | 8MB | DELETE (keep 3) | 6MB |
| Archive cleanup | 67 | 22MB | DELETE (user approval) | 22MB |
| **TOTAL** | **381** | **210MB** | | **208MB** |

**Net savings: 208MB (99% reduction)**

---

## 🗑️ Auto-Delete (No Approval Needed)

These will be deleted automatically (safe patterns):

### Temp & System Files (45MB)
- `**/.DS_Store` (234 files, 2.3MB)
- `**/*.tmp` (12 files, 15MB)
- `**/*.bak` (5 files, 8MB)
- `**/*~` (89 files, 12MB)
- `**/dist/` (3 dirs, 8MB build artifacts)

### Build Artifacts (120MB)
- `mcp-servers/*/dist/` (regenerable)
- `**/.tsbuildinfo` (regenerable)
- `**/__pycache__/` (regenerable)

### Duplicates - Identical Hash (15MB)
- `database/schema_backup.sql` (identical to schema.sql) → DELETE
- `docs/setup_copy.md` (identical to setup.md) → DELETE
- [List all with hash verification]

---

## 📦 Archive Actions (User Approval Required)

### Archive Deletions (22MB)

**Session logs 180+ days old (18MB):**
- `archive/2025-04/session-logs/2025-04-12-routine-updates.md` (18KB)
  - Age: 180 days
  - Type: Routine (no milestone keywords)
  - Value: Low (routine updates)
  - **Recommendation:** DELETE
- [List all old logs]

**Superseded docs 90+ days old (4MB):**
- `archive/2025-06/docs/old-architecture.md` (1.2MB)
  - Superseded by: `building/DECISIONS.md` (current architecture documented)
  - Age: 120 days
  - **Recommendation:** DELETE

### Session Log Cleanup (6MB saved)

**30-90 days old (Delete unless milestone):**
- `building/session-logs/2025-07-15-bug-fixes.md` → DELETE (routine)
- `building/session-logs/2025-07-20-database-migration.md` → KEEP (milestone)
- `building/session-logs/2025-08-01-refactoring.md` → DELETE (routine)
- [List all with keep/delete decision]

**Keeping (milestones only):**
- 2025-07-20-database-migration.md (milestone)
- 2025-08-15-v1-launch.md (milestone)
- 2025-09-01-whatsapp-integration.md (milestone)

---

## ⚠️ Semantic Duplicates (User Review)

**Potential duplicates (need confirmation):**
- `setup-guide.md` vs `SETUP.md`
  - Name similarity: 85%
  - Size: 12KB vs 14KB
  - Recommendation: Review content, likely merge
- [List suspicious pairs]

---

## 🔍 Dependency Audit

**Unused npm packages (recommend removal):**
- `lodash` (not imported anywhere) - 1.2MB
- `axios` (replaced by native fetch) - 500KB
- [List unused packages]

**Unused Python packages:**
- [Check requirements.txt vs actual imports]

---

## 📁 Folder Structure Review

### Current Structure Issues

**Problems identified:**
- `database/` has backup files mixed with active files
- `building/session-logs/` has 89 session logs (too many, archive old ones)
- `scripts/` has one-time setup scripts mixed with reusable scripts

**Proposed cleanup:**
- Move database backups to archive
- Archive session logs 30+ days
- Separate scripts/ into setup/ (one-time) and tools/ (reusable)

---

## 🎯 Preventive Measures

### Update .gitignore
Add these patterns to prevent future bloat:
```
*.tmp
*.bak
*~
.DS_Store
*.log
dist/
build/
.tsbuildinfo
coverage/
```

### Recommendations
1. **Set up automated cleanup:** Monthly cron job to run `/clean-up`
2. **Pre-commit hook:** Prevent committing temp files
3. **IDE configuration:** Disable auto-save backup files
4. **Log rotation:** Limit log files to 7 days

---

## ✅ Execution Plan

### Phase 1: Auto-Delete (No approval needed)
- Delete temp files (45MB)
- Delete build artifacts (120MB)
- Delete verified duplicates (15MB)
- **Total: 180MB freed**

### Phase 2: User Approval Required
- Archive deletions (22MB) - **Approve?**
- Session log cleanup (6MB) - **Approve?**
- Semantic duplicates - **Review needed**

### Phase 3: Post-Cleanup
- Update .gitignore
- Run dependency removal (if approved)
- Update documentation references
- Run `/document` to capture cleanup

---

## 🚫 User Decisions Needed

**Reply with:**
- "Approve all" - Execute all proposed actions (auto + user approval items)
- "Auto only" - Only execute auto-delete items
- "Custom: [specify]" - Custom approval (e.g., "Approve all except semantic duplicates")
- "Review [specific items]" - Discuss specific files

**Awaiting user decision to proceed...**
```

### Step 2: EXECUTE APPROVED ACTIONS

**After user approval:**

1. **Phase 1: Auto-delete** (always safe)
   - Delete temp files, build artifacts, verified duplicates
   - Remove empty directories
   - Report space freed

2. **Phase 2: Approved deletions**
   - Delete approved archive files
   - Delete approved session logs
   - Handle semantic duplicates per user direction

3. **Phase 3: Archive maintenance**
   - If archiving: Create archive/YYYY-MM/ structure
   - Use `git mv` for tracked files
   - Create/update ARCHIVE-INDEX.md
   - Compress old archives if > 50MB

4. **Phase 4: Prevention**
   - Update .gitignore with new patterns
   - Remove unused dependencies (if approved)
   - Clean up empty directories

5. **Phase 5: Verification**
   - Check for broken references
   - Update documentation links
   - Verify nothing critical was deleted

### Step 3: ARCHIVE INDEX (If Used)

**Only create if files are actually archived:**

```markdown
# Archive Index - YYYY-MM

**Archived:** YYYY-MM-DD | **Size:** X MB | **Files:** Y

## Milestones (Keep Indefinitely)
- `2025-07-20-database-migration.md` - DB schema v1 established
- [Critical milestones only]

## Temporary Archive (Review for deletion after 90 days)
- [Files with unclear long-term value]

## Deletion Schedule
- **2025-12-01:** Review temporary archives
- **2026-03-01:** Delete all 180+ day routine logs
```

### Step 4: RUN /DOCUMENT

**Automatically invoke `/document`** to:
- Create session log for cleanup work
- Update PROGRESS.md
- Update NEXT-STEPS.md
- Record space savings and patterns found

---

## 📝 Cleanup Standards

### Session Log Retention (Aggressive)

**< 30 days:** Keep active
- Current work context
- Recently referenced

**30-90 days:** DELETE unless milestone
- Milestone keywords: "milestone", "v1", "launch", "completion", "migration", "integration"
- Non-milestones: DELETE (routine work)
- Archive only if explicitly valuable

**90+ days:** DELETE (no exceptions)
- All insights should be in DECISIONS.md or ISSUES.md
- Milestone sessions: Summarize in DECISIONS.md, then delete

### Archive Retention (Hard Limits)

**Size limit:** 50MB total
- Compress old months: `tar -czf archive/2025-06.tar.gz archive/2025-06/`
- Delete compressed archives > 180 days

**Time limit:** 180 days maximum
- Delete everything 180+ days
- No exceptions (insights preserved in docs)

### Deletion Confidence Levels

**AUTO (100% safe):**
- Temp files, build artifacts, system junk
- Verified identical duplicates
- Empty files

**HIGH (95% safe, auto-delete with logging):**
- Session logs 90+ days (non-milestone)
- Archive files 180+ days
- Superseded docs (insights captured elsewhere)

**MEDIUM (User approval):**
- Session logs 30-90 days
- Semantic duplicates
- Unused dependencies

**LOW (User review required):**
- Unclear documentation
- Scripts with unknown purpose
- Files without clear context

---

## 🎯 Success Criteria

After cleanup:
- ✅ **Significant space savings** (target: >100MB or >25% reduction)
- ✅ **Zero temp files** in project
- ✅ **Zero build artifacts** (regenerable)
- ✅ **< 10 session logs** in active directory (rest archived/deleted)
- ✅ **Archive < 50MB** (or compressed)
- ✅ **No duplicates** in active directories
- ✅ **.gitignore updated** to prevent recurrence
- ✅ **Broken references fixed**
- ✅ **All actions logged** via `/document`

---

## 🚀 Execute Now

1. **Deep scan** - Analyze every file, calculate sizes
2. **Pattern matching** - Auto-identify deletable files
3. **Duplicate detection** - Hash analysis + semantic matching
4. **Size reporting** - Quantify impact
5. **Create report** - Detailed, data-driven cleanup plan
6. **Auto-delete safe files** - Execute obvious deletions
7. **User approval** - Present ambiguous items
8. **Execute approved actions** - Clean up per user direction
9. **Update prevention** - .gitignore, recommendations
10. **Run /document** - Capture everything

**Approach:** Be aggressive but thoughtful. Delete confidently when safe. Archive sparingly. Prove value for retention.

Begin comprehensive cleanup analysis now.
