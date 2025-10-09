const crypto = require('crypto');

const input = ($json && typeof $json === 'object') ? $json : {};
const store = $getWorkflowStaticData('global');
if (!store || typeof store !== 'object') {
  throw new Error('Static data unavailable for approval link generation.');
}
// Auto-generate secret if missing (FIXED)
if (!store.approvalsHmacSecret) {
  store.approvalsHmacSecret = crypto.randomBytes(32).toString('hex');
  console.log('Generated new HMAC secret:', store.approvalsHmacSecret.slice(0, 16) + '...');
}

const ttlHours = 24;
const ttlMs = ttlHours * 60 * 60 * 1000;

const meta = input.meta || {};
const adminRows = Array.isArray(input.admin_rows) ? input.admin_rows : [];
const pendingStore = (store.pendingApprovals && typeof store.pendingApprovals === 'object') ? store.pendingApprovals : {};

const diffIso = meta.diff_generated_at_iso || meta.generated_at_iso || new Date().toISOString();
const diffMs = Date.parse(diffIso) || Date.now();

const baseUrlString = String($execution.resumeUrl || '').replace('/webhook-waiting/', '/webhook/');

// Fixed buildUrl to use string manipulation instead of URL object
function buildUrl(action, token, ts) {
  const base = baseUrlString.replace(/\/[^/]*$/, `/room-parent/${action}`);
  const params = 'token=' + encodeURIComponent(token) + '&action=' + encodeURIComponent(action) + '&ts=' + encodeURIComponent(ts);
  return base + '?' + params;
}

function signPayload(token, action, ts) {
  const canonical = JSON.stringify({ token, action, ts });
  const digest = crypto
    .createHmac('sha256', store.approvalsHmacSecret)
    .update(canonical)
    .digest('hex');
  return {
    canonical,
    signature: 'sha256=' + digest,
  };
}

if (!adminRows.length) {
  return [{
    json: {
      ...input,
      approvals: {
        count: 0,
        ttl_hours: ttlHours,
        generated_at_iso: diffIso,
        items: [],
      },
      admin_sheet_rows_signed: [],
      pending_tokens: input.pending_tokens || [],
    },
  }];
}

const signedSheetRows = [];
const emailItems = [];
const tokens = new Set(input.pending_tokens || []);

for (const row of adminRows) {
  const token = row.token;
  if (!token) {
    continue;
  }

  const ts = row.when_found_iso || diffIso;
  const tsMs = Date.parse(ts) || diffMs;
  const expiresAt = new Date(tsMs + ttlMs).toISOString();

  const approveSignature = signPayload(token, 'approve', ts);
  const rejectSignature = signPayload(token, 'reject', ts);
  const approveUrl = buildUrl('approve', token, ts);
  const rejectUrl = buildUrl('reject', token, ts);

  const existing = (pendingStore[token] && typeof pendingStore[token] === 'object') ? pendingStore[token] : {};
  const status = existing.status || 'Pending';

  const scope = existing.scope
    || row.scope
    || (row.hmac_payload && typeof row.hmac_payload.action === 'string'
      ? row.hmac_payload.action.split('.')[0]
      : null);

  existing.token = token;
  existing.scope = scope;
  existing.op = existing.op || row.op || null;
  existing.created_at = existing.created_at || ts;
  existing.expires_at = expiresAt;
  existing.hmac_payload = existing.hmac_payload || row.hmac_payload || null;
  existing.admin_row = {
    ...row,
    status,
  };
  existing.status = status;
  existing.links = {
    approve: { url: approveUrl, signature: approveSignature.signature, ts },
    reject: { url: rejectUrl, signature: rejectSignature.signature, ts },
    ttl_hours: ttlHours,
    expires_at: expiresAt,
  };

  pendingStore[token] = existing;

  signedSheetRows.push({
    WhenFound: row.when_found_iso || diffIso,
    Type: row.type || (scope ? scope.charAt(0).toUpperCase() + scope.slice(1) : ''),
    Summary: row.summary || '',
    Detail: row.detail || '',
    SourceLink: row.source_url || '',
    SourceType: row.source_type || '',
    ApproveLink: approveUrl,
    RejectLink: rejectUrl,
    Status: status,
    Token: token,
    Action: (row.hmac_payload && row.hmac_payload.action) || (existing.hmac_payload && existing.hmac_payload.action) || '',
    ExpiresAt: expiresAt,
    ProcessedAt: existing.closed_at_iso || '',
    Actor: existing.actor || '',
  });

  emailItems.push({
    token,
    type: row.type || scope || '',
    summary: row.summary || '',
    detail: row.detail || '',
    whenFound: row.when_found_iso || diffIso,
    sourceLink: row.source_url || '',
    sourceType: row.source_type || '',
    expiresAt,
    ts,
    approvals: {
      approve: {
        action: 'approve',
        url: approveUrl,
        headers: { 'X-Signature': approveSignature.signature },
        payload: { token, action: 'approve', ts },
      },
      reject: {
        action: 'reject',
        url: rejectUrl,
        headers: { 'X-Signature': rejectSignature.signature },
        payload: { token, action: 'reject', ts },
      },
    },
  });

  tokens.add(token);
}

store.pendingApprovals = pendingStore;
store.pendingApprovalsCount = Object.values(pendingStore)
  .filter((record) => (record && (record.status || 'Pending') === 'Pending')).length;

return [{
  json: {
    ...input,
    approvals: {
      count: emailItems.length,
      ttl_hours: ttlHours,
      generated_at_iso: diffIso,
      items: emailItems,
    },
    admin_sheet_rows_signed: signedSheetRows,
    pending_tokens: Array.from(tokens),
  },
}];
