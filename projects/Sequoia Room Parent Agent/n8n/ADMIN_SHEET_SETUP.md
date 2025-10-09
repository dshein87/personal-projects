# Admin Sheet Setup Instructions

## Create the Admin Tab

1. Open: https://docs.google.com/spreadsheets/d/GOOGLE_SHEET_ID_PLACEHOLDER/edit
   (Replace GOOGLE_SHEET_ID_PLACEHOLDER with your actual Sheet ID - see CONFIG_SETUP.md)
2. Click the "+" button at bottom left to add a new sheet
3. Rename it to: **Admin**
4. Add these column headers in row 1:

```
WhenFound | Type | Summary | Detail | SourceLink | SourceType | ApproveLink | RejectLink | Status | Token | Action | ExpiresAt | ProcessedAt | Actor
```

## Column Descriptions

- **WhenFound**: ISO timestamp when the change was detected
- **Type**: Calendar, Snack, Allergy, etc.
- **Summary**: Brief description of the change
- **Detail**: Additional details about what will change
- **SourceLink**: URL to the source (Gmail or Drive)
- **SourceType**: email or pdf
- **ApproveLink**: HMAC-signed URL to approve the change
- **RejectLink**: HMAC-signed URL to reject the change
- **Status**: Pending, Approved, Rejected, Expired
- **Token**: Unique identifier for this approval
- **Action**: Scope.operation (e.g., calendar.upsert, snack.assign)
- **ExpiresAt**: When the approval links expire (24h)
- **ProcessedAt**: When the approval was acted upon
- **Actor**: Who approved/rejected (email or name)

## After Creating

Re-run the workflow and the Admin Queue Write nodes should populate this sheet with pending approvals.
