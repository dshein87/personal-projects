# n8n Merge Node Reference

## Available Modes (as of n8n Cloud 2025)

Based on actual n8n Cloud instance capabilities, the Merge node supports these modes:

### 1. **Append** ✅ RECOMMENDED FOR THIS WORKFLOW
- **Description**: Output items of each input, one after the other
- **Use case**: Concatenating results from multiple branches into a single list
- **JSON value**: `"mode": "append"`
- **This workflow uses**: Append mode for all Merge nodes (replacing deprecated mergeByIndex)

### 2. **Combine**
- **Description**: Merge matching items together
- **Use case**: Joining data from multiple sources (like SQL JOIN)
- **JSON value**: `"mode": "combine"`

### 3. **SQL Query**
- **Description**: Write a query to do the merge
- **Use case**: Complex merge logic using SQL syntax
- **JSON value**: `"mode": "multiplex"` (or specific SQL mode)

### 4. **Choose Branch**
- **Description**: Output data from a specific branch, without modifying it
- **Use case**: Conditional routing - pick one input based on logic
- **JSON value**: `"mode": "chooseBranch"`

## ⚠️ Deprecated Modes

### ❌ mergeByIndex
- **Status**: NOT supported in current n8n Cloud versions
- **Error**: `Cannot read properties of undefined (reading 'execute')`
- **Replacement**: Use `"append"` mode instead
- **Note**: For simple sequential concatenation of inputs, append mode works perfectly

## Updated Nodes in This Workflow

All Merge nodes updated from deprecated `mergeByIndex` to `append` mode:

1. **Merge Snack Outcome** - `append` mode, 2 inputs
2. **Merge Calendar Outcome** - `append` mode, 4 inputs
3. **Merge Daily Digest Data** - `append` mode, 2 inputs (fixes digest generation error)
4. **Merge Weekly Digest Data** - `append` mode, 2 inputs
5. **Merge** (main ingestion) - default mode, 6 inputs

## Workflow Export Note

When exporting workflows from older n8n versions or importing community templates, always validate Merge node modes before uploading to n8n Cloud.

**Date Updated**: 2025-10-05
**n8n Version Context**: n8n Cloud (production instance)
