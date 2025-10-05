# Approval QA Checklist (A3 & A4)

Use these once HMAC validation is wired. Each scenario should log expected Admin row + OpsLog results.

1. **Approve happy path**
   - Payload: token from `pending_lookup`, valid `hmac_payload`, timestamp within 24h.
   - Expect: webhook 200, admin Status → `Approved`, OpsLog entry with token + diff JSON, pending entry cleared.

2. **Reject happy path**
   - Same token/signature shape, action `reject`.
   - Expect: admin Status → `Rejected`, OpsLog entry noting rejection, no apply branch triggered.

3. **Expired timestamp**
   - Replay valid payload with `ts` older than 24h.
   - Expect: webhook 410 or 400 with `expired` message, pending entry unchanged, OpsLog note optional.

4. **Tampered signature**
   - Modify body after signing or alter token.
   - Expect: webhook 401, pending entry unchanged, Admin row stays `Pending`.

5. **Unknown token**
   - Send validly signed payload for a token not in `pending_lookup`.
   - Expect: webhook 404, no OpsLog entry.

6. **Duplicate approval** (optional once apply branch ready)
   - Replay a previously approved token.
   - Expect: webhook 409, Admin row remains `Approved`, no duplicate writes.

Record results in `handoff/daily_update.xml` (QA notes) once executed.
