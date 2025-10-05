const tzDefault = 'America/Los_Angeles';

function slugify(input) {
  return String(input ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
}

function parseWeekRange(label) {
  if (!label) return null;
  const clean = String(label).replace(/\s+/g, ' ').trim();
  const rangeRe = /([A-Za-z]{3,})\.?\s*(\d{1,2})(?:[–-]\s*([A-Za-z]{3,})\.?\s*(\d{1,2}))?/;
  const match = clean.match(rangeRe);
  if (!match) return null;
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const startMonthIndex = months.indexOf(match[1].slice(0, 3).toLowerCase());
  if (startMonthIndex === -1) return null;
  const startDay = Number(match[2]);
  let endMonthIndex = startMonthIndex;
  let endDay = Number(match[4] || match[2]);
  if (match[3]) {
    const idx = months.indexOf(match[3].slice(0, 3).toLowerCase());
    if (idx !== -1) endMonthIndex = idx;
  }
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(Date.UTC(year, startMonthIndex, startDay, 0, 0, 0));
  const end = new Date(Date.UTC(year, endMonthIndex, endDay, 23, 59, 59));
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) return null;
  return { start_iso: start.toISOString(), end_iso: end.toISOString() };
}

function ensureIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.valueOf())) return direct.toISOString();
  const dateOnly = trimmed.match(/\d{4}-\d{2}-\d{2}/);
  if (dateOnly) {
    const parsed = new Date(dateOnly[0] + 'T00:00:00.000Z');
    if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString();
  }
  return null;
}

function calendarTimeToIso(entry, { isEnd = false } = {}) {
  if (!entry) return null;
  if (typeof entry === 'string') return ensureIso(entry);
  if (entry.dateTime) return ensureIso(entry.dateTime);
  if (entry.date) {
    const suffix = isEnd ? 'T23:59:59.000Z' : 'T00:00:00.000Z';
    return ensureIso(entry.date + suffix);
  }
  return null;
}

function makeCalendarKey(summary, startIso) {
  const titlePart = slugify(summary);
  const timePart = startIso ? startIso.slice(0, 16) : 'no-time';
  return titlePart + '|' + timePart;
}

function normalizeCalendar(events) {
  return events.map((event) => {
    const startIso = calendarTimeToIso(event.start);
    const endIso = calendarTimeToIso(event.end, { isEnd: true }) || startIso;
    return {
      event_id: event.id || event.eventId || event.iCalUID || null,
      summary: String(event.summary || '').trim(),
      description: String(event.description || '').trim() || undefined,
      location: String(event.location || '').trim() || undefined,
      start_iso: startIso,
      end_iso: endIso,
      all_day: Boolean(event.start && event.start.date && !event.start.dateTime),
      html_link: event.htmlLink || undefined,
      dedupe_key: makeCalendarKey(event.summary || '', startIso),
      source_refs: event.htmlLink ? [{ url: event.htmlLink, type: 'calendar', item_id: event.id || null }] : undefined,
      raw: event
    };
  });
}

function normalizeSnackRows(rows) {
  return rows
    .map((row, index) => {
      const weekLabel = String(row.Week ?? row.week ?? '').trim();
      if (!weekLabel) return null;
      const range = parseWeekRange(weekLabel);
      const weekKey = range ? range.start_iso.slice(0, 10) : slugify(weekLabel);
      const child = String(row.Child ?? row.child ?? '').trim();
      const rowIndex = row.rowIndex ?? row.$row ?? row.__sheetRow ?? (index + 2);
      return {
        week_label: weekLabel,
        week_key: weekKey,
        child,
        range,
        row_index: rowIndex,
        raw: row
      };
    })
    .filter(Boolean);
}

function normalizeAllergies(rows) {
  return rows
    .map((row) => {
      const text = row.Allergy ?? row.allergy ?? row.text ?? row.note;
      const trimmed = String(text || '').trim();
      if (!trimmed) return null;
      return { text: trimmed, raw: row };
    })
    .filter(Boolean);
}

function buildSourceRefs(record, topSource) {
  const refs = [];
  const addRef = (ref) => {
    if (!ref || !ref.url) return;
    const exists = refs.some((existing) => existing.url === ref.url && existing.type === ref.type);
    if (!exists) refs.push(ref);
  };

  const directRefs = Array.isArray(record.source_refs) ? record.source_refs : [];
  for (const ref of directRefs) {
    if (!ref) continue;
    addRef({
      url: String(ref.url || ref.href || ''),
      type: ref.type || ref.source_type || record.source_type || topSource?.source_type || null,
      item_id: ref.item_id || record.item_id || null,
      label: ref.label || ref.title || null
    });
  }

  if (record.source_url) {
    addRef({
      url: String(record.source_url),
      type: record.source_type || record.source || topSource?.source_type || null,
      item_id: record.item_id || record.source_id || topSource?.source_id || null,
      label: record.source_subject || topSource?.subject || null
    });
  }

  if (topSource && topSource.source_url) {
    addRef({
      url: String(topSource.source_url),
      type: topSource.source_type || null,
      item_id: topSource.source_id || null,
      label: topSource.subject || topSource.file_name || null
    });
  }

  return refs.length ? refs : undefined;
}

function normalizeProposed(extractor) {
  const events = Array.isArray(extractor.events) ? extractor.events : [];
  const snackChanges = Array.isArray(extractor.snack_changes) ? extractor.snack_changes : [];
  const allergyChanges = Array.isArray(extractor.allergy_changes) ? extractor.allergy_changes : [];
  const notices = Array.isArray(extractor.notices) ? extractor.notices : [];
  const topSource = extractor._source || null;

  const normEvents = events.map((event, index) => {
    const summary = String(event.title ?? event.summary ?? '').trim();
    const startIso = ensureIso(event.start_iso ?? event.start);
    const endIso = ensureIso(event.end_iso ?? event.end);
    return {
      index,
      op: String(event.op || 'upsert').toLowerCase(),
      summary,
      start_iso: startIso,
      end_iso: endIso || null,
      location: String(event.location || '').trim() || undefined,
      description: String(event.description ?? event.notes ?? '').trim() || undefined,
      audience: event.audience || undefined,
      dedupe_key: makeCalendarKey(summary, startIso),
      item_id: event.item_id || event.source_item_id || null,
      source_refs: buildSourceRefs(event, topSource),
      raw: event
    };
  });

  const normSnack = snackChanges.map((row, index) => {
    const weekLabel = String(row.week_label ?? row.week_text ?? row.week ?? '').trim();
    const range = parseWeekRange(weekLabel);
    const weekKey = range ? range.start_iso.slice(0, 10) : slugify(weekLabel);
    return {
      index,
      week_label: weekLabel,
      week_key: weekKey,
      child: String(row.child ?? row.assignee ?? '').trim(),
      note: String(row.note ?? row.notes ?? '').trim() || undefined,
      item_id: row.item_id || null,
      source_refs: buildSourceRefs(row, topSource),
      raw: row
    };
  });

  const normAllergy = allergyChanges.map((row, index) => {
    const action = String(row.action ?? row.op ?? '').toLowerCase();
    const payload = row.allergy_text ?? row.item ?? row.text ?? '';
    return {
      index,
      action,
      child: row.child || row.student || null,
      allergy_text: typeof payload === 'string' ? payload.trim() : payload,
      source_refs: buildSourceRefs(row, topSource),
      raw: row
    };
  });

  const normNotices = notices.map((notice, index) => ({
    index,
    text: String(notice.text ?? '').trim(),
    audience: notice.audience || undefined,
    priority: notice.priority || undefined,
    source_refs: buildSourceRefs(notice, topSource),
    raw: notice
  }));

  return { events: normEvents, snack_changes: normSnack, allergy_changes: normAllergy, notices: normNotices, topSource };
}

const aggregator = {
  runContext: null,
  extractor: null,
  calendar: [],
  snackRows: [],
  allergyRows: [],
  opsRows: [],
  debugKeys: []
};

for (let inputIndex = 0; inputIndex < 8; inputIndex++) {
  let items;
  try {
    items = $items(inputIndex);
  } catch (err) {
    continue;
  }
  if (!items || !items.length) continue;
  for (const item of items) {
    const json = item && item.json ? item.json : null;
    if (!json || typeof json !== 'object') continue;
    const keys = Object.keys(json);
    aggregator.debugKeys.push(keys);
    if (json.poll_start_iso || json.poll_end_iso || json.lookback_start_iso) {
      aggregator.runContext = { ...(aggregator.runContext || {}), ...json };
      continue;
    }
    if (!aggregator.extractor && (Array.isArray(json.events) || Array.isArray(json.snack_changes))) {
      aggregator.extractor = json;
      continue;
    }
    if (json.kind === 'calendar#event' || json.start || json.summary) {
      aggregator.calendar.push(json);
      continue;
    }
    if ('Week' in json || 'Child' in json || 'week' in json) {
      aggregator.snackRows.push(json);
      continue;
    }
    if ('Allergy' in json || 'allergy' in json || 'Allergies' in json) {
      aggregator.allergyRows.push(json);
      continue;
    }
    if ('Action' in json || 'Target' in json || 'Diff' in json || 'timestamp' in json) {
      aggregator.opsRows.push(json);
      continue;
    }
  }
}

if (!aggregator.extractor) {
  throw new Error('Compile Current State: missing extractor payload. Saw input key sets: ' + JSON.stringify(aggregator.debugKeys.slice(0, 5)));
}

const runContext = aggregator.runContext || {};
if (!runContext.tz) runContext.tz = tzDefault;
const meta = {
  generated_at_iso: new Date().toISOString(),
  tz: runContext.tz,
  poll_start_iso: runContext.poll_start_iso || null,
  poll_end_iso: runContext.poll_end_iso || null,
  lookback_start_iso: runContext.lookback_start_iso || null,
  lookback_end_iso: runContext.lookback_end_iso || null
};

const current = {
  calendar: normalizeCalendar(aggregator.calendar),
  snacks: normalizeSnackRows(aggregator.snackRows),
  allergies: normalizeAllergies(aggregator.allergyRows),
  opslog: aggregator.opsRows
};

const proposed = normalizeProposed(aggregator.extractor);

return [{
  json: {
    meta,
    current,
    proposed,
    debug: {
      source_counts: {
        calendar: aggregator.calendar.length,
        snack_rows: aggregator.snackRows.length,
        allergy_rows: aggregator.allergyRows.length,
        ops_rows: aggregator.opsRows.length
      }
    }
  }
}];
