# Fix for "Attach Extractor Prompt" Node

## Problem
The node was extracting email text as the prompt instead of the HTTP Request response. This happened because the fallback chain `promptData.data || promptData.body || promptData.text || ...` would match `promptData.text` for email items.

## Root Cause
The code didn't validate input sources and used `.text` as a fallback, which exists in email items. When processing input 1, if `promptData.data` was somehow unavailable, it would fall through to `promptData.text`, grabbing the first email's text.

## Solution
The fixed version:
1. **Validates input structures** - Checks that both inputs are present
2. **Prioritizes HTTP Request fields** - Checks `.data` and `.body` BEFORE `.text`
3. **Removes `.text` fallback** - Prevents email content from being used as prompt
4. **Adds validation** - Verifies the extracted text looks like a prompt, not email content

## How to Apply

### Step 1: Open the Node in n8n
1. Go to: https://dshein.app.n8n.cloud/workflow/QyJqHziW6fupaR5H
2. Click on the **"Attach Extractor Prompt"** node
3. Click the **"Code"** tab (not Parameters)

### Step 2: Replace the Code
1. Select all existing code (Cmd+A or Ctrl+A)
2. Open the fixed code file:
   ```bash
   cat n8n/ATTACH_EXTRACTOR_PROMPT_FIXED.js
   ```
3. Copy the entire contents
4. Paste into the node's Code tab

### Step 3: Save and Test
1. Click **"Save"** in the top-right of the workflow
2. Click **"Execute step"** to test the node individually
3. Verify output shows:
   - `prompt_template` contains: "You are an assistant that reads school communications..."
   - `prompt_text` starts with the instruction prompt, not email content

### Step 4: Run Full Workflow
1. Click **"Execute workflow"** button
2. Monitor the "Validate JSON" node - it should now receive structured JSON
3. If successful, proceed to diff computation and approval queue

## Expected Behavior After Fix

### Correct prompt_template (first 100 chars):
```
"You are an assistant that reads school communications (email bodies and PDFs) and outputs strict..."
```

### Incorrect prompt_template (what you're seeing now):
```
"Subject: View this email in your browser..."
```

## Verification Checklist

After applying:
- [ ] Node executes without error
- [ ] `prompt_template` contains instruction text (not email content)
- [ ] All 22 items have the SAME `prompt_template`
- [ ] `prompt_text` includes SOURCE_TYPE and CONTENT sections
- [ ] "Basic LLM Chain" node receives proper instructions
- [ ] "Validate JSON" node receives structured JSON (not freeform summaries)

## Rollback (If Needed)
If this fix causes issues, the previous version is in:
```
handoff/workflow_export_ready_fixed.json
```

Extract with:
```bash
jq -r '.nodes[] | select(.name == "Attach Extractor Prompt") | .parameters.jsCode' handoff/workflow_export_ready_fixed.json
```
