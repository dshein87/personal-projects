# Lessons Learned

**Purpose:** Capture insights, discoveries, and "aha moments" during the build process.

---

## 2025-10-09: Project Kickoff

### Lesson: Building Documentation System First Saves Time Later

**What:** Created comprehensive `building/` folder structure before writing any code

**Learning:** Having session tracking, decision logs, and progress tracking from day 1 means:
- Easy to resume after interruptions
- Decisions are documented with context
- New contributors (or future self) can get up to speed quickly

**Impact:** Minimal upfront time (~30 min) for long-term maintainability

**Recommendation:** Always create documentation infrastructure first on complex projects

---

### Lesson: Multi-Agent Architecture Requires More Planning But Pays Off

**What:** Chose to build 5 specialized MCP servers instead of one monolithic agent

**Learning:** Initial setup is more complex, but benefits include:
- Easier debugging (isolate which agent has issues)
- Better prompt tuning (each agent has focused expertise)
- More scalable (can add new agents without touching existing ones)
- Better learning experience (teaches multi-agent orchestration)

**Trade-off:** More files to manage, but organization makes it manageable

**Recommendation:** For projects with distinct domains (music, food, activities), specialized agents are worth it

---

*Add new lessons as the project progresses.*

---

## Template for New Lessons

```markdown
## YYYY-MM-DD: [Lesson Title]

**What:** [Brief description of situation]

**Learning:** [What you discovered or learned]

**Impact:** [How it affected the project]

**Recommendation:** [What you'd do next time]
```

---

## Common Patterns to Watch For

As the project progresses, look for patterns in:

- **What took longer than expected?** (helps with future estimation)
- **What was easier than expected?** (often reusable patterns)
- **What would you do differently?** (architectural learnings)
- **What surprised you?** (unexpected challenges or solutions)

---

*This file will grow as we build and discover new insights.*
