const crypto = require('crypto');

function slugify(input) {
  return String(input ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

function ensureIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString();
  return null;
}

function makeCalendarKey(summary, startIso) {
  const titlePart = slugify(summary);
  const timePart = startIso ? startIso.slice(0, 16) : 'no-time';
  return `${titlePart}|${timePart}`;
}

function createToken(scope, dedupeKey, payload) {
  const hash = crypto.createHash('sha256');
  hash.update(scope || '');
  hash.update('|');
  hash.update(dedupeKey || '');
  hash.update('|');
  hash.update(JSON.stringify(payload || {}));
  return hash.digest('hex').slice(0, 24);
}

function buildHmacPayload(token, action, dedupeKey, requestedAtIso) {
  return {
    version: 1,
    token,
    action,
    dedupe_key: dedupeKey,
    requested_at: requestedAtIso,
  };
}

function normalizeValue(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function sameValue(a, b) {
  return normalizeValue(a) === normalizeValue(b);
}

function describeCalendarDiff(existing, next) {
  if (!existing) {
    return 'Create new event';
  }
  const changes = [];
  if (!sameValue(existing.summary, next.summary)) changes.push('summary');
  if (!sameValue(existing.start_iso, next.start_iso)) changes.push('start');
  if (!sameValue(existing.end_iso, next.end_iso)) changes.push('end');
  if (!sameValue(existing.location, next.location)) changes.push('location');
  if (!sameValue(existing.description, next.description)) changes.push('description');
  return changes.length ? `Update ${changes.join(', ')}` : 'No change';
}

function firstSourceRef(action) {
  const refs = action.source_refs;
  if (!Array.isArray(refs) || !refs.length) return null;
  return refs[0];
}

function buildAdminRow({
  action,
  scope,
  whenIso,
  summaryText,
  detail,
}) {
  const ref = firstSourceRef(action);
  return {
    token: action.approval_token,
    scope,
    type: scope === 'calendar' ? 'Calendar' : scope === 'snack' ? 'Snack' : scope,
    when_found_iso: whenIso,
    summary: summaryText,
    detail: detail || null,
    source_url: ref?.url || null,
    source_type: ref?.type || null,
    dedupe_key: action.dedupe_key,
    status: 'Pending',
    hmac_payload: action.hmac_payload,
  };
}

function buildAdminSheetRow(adminRow) {
  return {
    WhenFound: adminRow.when_found_iso,
    Type: adminRow.type,
    Summary: adminRow.summary,
    Detail: adminRow.detail || '',
    SourceLink: adminRow.source_url || '',
    SourceType: adminRow.source_type || '',
    Status: adminRow.status,
    Token: adminRow.token,
    DedupeKey: adminRow.dedupe_key || '',
    Action: adminRow.hmac_payload?.action || '',
  };
}

function buildPendingRecord({ action, applyPayload, meta }) {
  return {
    token: action.approval_token,
    scope: action.scope,
    op: action.op,
    dedupe_key: action.dedupe_key,
    created_at: meta.generated_at_iso,
    hmac_payload: action.hmac_payload,
    admin_row: action.admin_row,
    apply: applyPayload,
    source_refs: action.source_refs || null,
    meta: {
      summary: action.summary || action.week_label || null,
      generated_at: meta.generated_at_iso,
      poll_start_iso: meta.poll_start_iso || null,
      poll_end_iso: meta.poll_end_iso || null,
    },
  };
}

const input = $json || {};
const meta = input.meta || {};
const nowIso = new Date().toISOString();
if (!meta.generated_at_iso) meta.generated_at_iso = nowIso;

const current = input.current || {};
const proposed = input.proposed || {};

const currentCalendar = Array.isArray(current.calendar) ? current.calendar : [];
const currentSnacks = Array.isArray(current.snacks) ? current.snacks : [];
const proposedEvents = Array.isArray(proposed.events) ? proposed.events : [];
const proposedSnackChanges = Array.isArray(proposed.snack_changes) ? proposed.snack_changes : [];
const proposedAllergyChanges = Array.isArray(proposed.allergy_changes) ? proposed.allergy_changes : [];
const proposedNotices = Array.isArray(proposed.notices) ? proposed.notices : [];

const calendarByKey = new Map();
const calendarById = new Map();
for (const event of currentCalendar) {
  const key = event.dedupe_key || makeCalendarKey(event.summary || '', event.start_iso);
  if (key) calendarByKey.set(key, event);
  if (event.event_id) calendarById.set(event.event_id, event);
}

const snackByKey = new Map();
for (const row of currentSnacks) {
  const key = row.week_key || slugify(row.week_label || '');
  if (key) snackByKey.set(key, row);
}

const calendarActions = [];
const snackActions = [];
const adminRows = [];
const adminSheetRows = [];
const warnings = [];
const pendingLookup = {};
const tokens = new Set();
const dedupeGuards = new Set();

function registerAction(action, applyPayload) {
  if (!action.approval_token) return;
  if (dedupeGuards.has(action.approval_token)) return;
  dedupeGuards.add(action.approval_token);
  tokens.add(action.approval_token);
  const pendingRecord = buildPendingRecord({ action, applyPayload, meta });
  pendingLookup[action.approval_token] = pendingRecord;
  const adminRow = buildAdminRow({
    action,
    scope: action.scope,
    whenIso: meta.generated_at_iso,
    summaryText: action.admin_summary,
    detail: action.admin_detail,
  });
  action.admin_row = adminRow;
  adminRows.push(adminRow);
  adminSheetRows.push(buildAdminSheetRow(adminRow));
}

for (const item of proposedEvents) {
  const op = item.op === 'cancel' ? 'cancel' : 'upsert';
  const summary = item.summary || '';
  const startIso = item.start_iso || null;
  const dedupeKey = item.dedupe_key || makeCalendarKey(summary, startIso);
  const sourceRefs = item.source_refs || [];
  let existing = null;
  if (item.raw && item.raw.event_id) {
    existing = calendarById.get(item.raw.event_id) || null;
  }
  if (!existing && item.event_id) {
    existing = calendarById.get(item.event_id) || null;
  }
  if (!existing && dedupeKey) {
    existing = calendarByKey.get(dedupeKey) || null;
  }

  if (!summary) {
    warnings.push('Calendar entry missing summary, skipping.');
    continue;
  }

  if (op === 'cancel') {
    const target = existing;
    if (!target) {
      warnings.push(`Cancel request for "${summary}" had no matching calendar event.`);
      continue;
    }
    const applyPayload = {
      scope: 'calendar',
      op: 'cancel',
      event_id: target.event_id,
      summary: target.summary,
      start_iso: target.start_iso,
      end_iso: target.end_iso,
    };
    const token = createToken('calendar.cancel', dedupeKey || target.event_id || summary, applyPayload);
    const action = {
      scope: 'calendar',
      op: 'cancel',
      event_id: target.event_id,
      summary: target.summary || summary,
      start_iso: target.start_iso || startIso,
      end_iso: target.end_iso || null,
      location: target.location || null,
      description: target.description || null,
      dedupe_key: dedupeKey || target.dedupe_key,
      source_refs: sourceRefs.length ? sourceRefs : target.source_refs,
      approval_token: token,
      hmac_payload: buildHmacPayload(token, 'calendar.cancel', dedupeKey || target.dedupe_key, meta.generated_at_iso),
      admin_summary: `Cancel ${target.summary || summary}`,
      admin_detail: `Will remove event on ${target.start_iso || startIso}`,
    };
    calendarActions.push(action);
    registerAction(action, applyPayload);
    continue;
  }

  if (!startIso) {
    warnings.push(`Upsert for "${summary}" missing start time; skipping.`);
    continue;
  }

  const applyPayload = {
    scope: 'calendar',
    op: 'upsert',
    event_id: existing ? existing.event_id : null,
    summary,
    start_iso: startIso,
    end_iso: item.end_iso || (existing ? existing.end_iso : null) || null,
    location: item.location || (existing ? existing.location : null) || null,
    description: item.description || (existing ? existing.description : null) || null,
    audience: item.audience || null,
    source_refs: sourceRefs.length ? sourceRefs : (existing ? existing.source_refs : null),
  };

  if (existing) {
    const noChange = sameValue(existing.summary, summary)
      && sameValue(existing.start_iso, startIso)
      && sameValue(existing.end_iso, applyPayload.end_iso)
      && sameValue(existing.location, applyPayload.location)
      && sameValue(existing.description, applyPayload.description);
    if (noChange) {
      continue;
    }
  }

  const token = createToken('calendar.upsert', dedupeKey || summary, applyPayload);
  const action = {
    scope: 'calendar',
    op: 'upsert',
    event_id: applyPayload.event_id,
    summary,
    start_iso: applyPayload.start_iso,
    end_iso: applyPayload.end_iso,
    location: applyPayload.location || undefined,
    description: applyPayload.description || undefined,
    audience: applyPayload.audience || undefined,
    dedupe_key: dedupeKey,
    source_refs: applyPayload.source_refs || undefined,
    approval_token: token,
    hmac_payload: buildHmacPayload(token, 'calendar.upsert', dedupeKey, meta.generated_at_iso),
    diff: existing ? {
      previous: {
        summary: existing.summary,
        start_iso: existing.start_iso,
        end_iso: existing.end_iso,
        location: existing.location,
        description: existing.description,
      }
    } : { previous: null },
    admin_summary: `${existing ? 'Update' : 'Create'} ${summary}`,
    admin_detail: describeCalendarDiff(existing, applyPayload),
  };
  calendarActions.push(action);
  registerAction(action, applyPayload);
}

for (const item of proposedSnackChanges) {
  const weekKey = item.week_key || slugify(item.week_label || '');
  if (!weekKey) {
    warnings.push('Snack change missing week label.');
    continue;
  }
  const existing = snackByKey.get(weekKey) || null;
  const priorChild = existing ? String(existing.child || '').trim() : '';
  const newChild = String(item.child || '').trim();
  const note = item.note || null;
  const sourceRefs = item.source_refs || [];

  if (!newChild && !priorChild) {
    continue;
  }
  if (newChild && priorChild && newChild.toLowerCase() === priorChild.toLowerCase() && !note) {
    continue;
  }

  const op = newChild ? 'assign' : 'clear';
  const applyPayload = {
    scope: 'snack',
    op,
    week_key: weekKey,
    week_label: item.week_label,
    row_index: existing ? existing.row_index : null,
    prior_child: priorChild || null,
    new_child: newChild || null,
    note,
    source_refs: sourceRefs.length ? sourceRefs : null,
  };
  const dedupeKey = `snack|${weekKey}`;
  const token = createToken(`snack.${op}`, dedupeKey, applyPayload);
  const action = {
    scope: 'snack',
    op,
    week_key: weekKey,
    week_label: item.week_label,
    row_index: applyPayload.row_index,
    prior_child: priorChild || null,
    new_child: newChild || null,
    note,
    source_refs: sourceRefs.length ? sourceRefs : null,
    dedupe_key: dedupeKey,
    approval_token: token,
    hmac_payload: buildHmacPayload(token, `snack.${op}`, dedupeKey, meta.generated_at_iso),
    admin_summary: `Snack ${item.week_label || weekKey}`,
    admin_detail: op === 'assign'
      ? (priorChild ? `Reassign ${priorChild} → ${newChild}` : `Assign ${newChild}`)
      : 'Clear assignment',
  };
  snackActions.push(action);
  registerAction(action, applyPayload);
}

const allergySummary = {
  adds: proposedAllergyChanges.filter((row) => (row.action || '').toLowerCase() === 'add'),
  removes: proposedAllergyChanges.filter((row) => (row.action || '').toLowerCase() === 'remove'),
};

const store = $getWorkflowStaticData('global');
const previousPending = store.pendingApprovals && typeof store.pendingApprovals === 'object'
  ? store.pendingApprovals
  : {};

const mergedPending = { ...previousPending, ...pendingLookup };

// Trim stale entries older than 30 days to avoid unbounded growth.
const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
for (const [token, record] of Object.entries(mergedPending)) {
  const createdAt = record?.created_at ? Date.parse(record.created_at) : Date.now();
  if (Number.isFinite(createdAt) && createdAt < cutoff && !tokens.has(token)) {
    delete mergedPending[token];
  }
}

store.pendingApprovals = mergedPending;
store.pendingApprovalsUpdatedAtIso = meta.generated_at_iso;
store.pendingApprovalsCount = Object.keys(mergedPending).length;

const preview = {
  calendar: calendarActions.slice(0, 2).map((action) => ({
    token: action.approval_token,
    op: action.op,
    summary: action.summary,
    start_iso: action.start_iso,
  })),
  snack: snackActions.slice(0, 2).map((action) => ({
    token: action.approval_token,
    op: action.op,
    week: action.week_label,
    child: action.new_child,
  })),
  allergies: {
    adds: allergySummary.adds.length,
    removes: allergySummary.removes.length,
  },
};
console.log('[Compute Diffs] preview', JSON.stringify(preview, null, 2));

return [{
  json: {
    meta: {
      ...meta,
      diff_generated_at_iso: meta.generated_at_iso,
      pending_count: tokens.size,
    },
    calendar_actions: calendarActions,
    snack_actions: snackActions,
    allergy_changes: proposedAllergyChanges,
    allergy_summary: allergySummary,
    notices: proposedNotices,
    admin_rows: adminRows,
    admin_sheet_rows: adminSheetRows,
    pending_tokens: Array.from(tokens),
    debug: {
      warnings,
      counts: {
        current_calendar: currentCalendar.length,
        proposed_calendar: proposedEvents.length,
        current_snacks: currentSnacks.length,
        proposed_snacks: proposedSnackChanges.length,
      },
    },
  },
}];
