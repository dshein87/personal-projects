/**
 * Room Parent approval helpers for Google Sheets Admin tab.
 * Columns expected: WhenFound, Type, Summary, SourceLink, ApproveLink, RejectLink, Status, Token.
 * Required Script Properties: N8N_WEBHOOK_URL, HMAC_SECRET.
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Room Parent')
    .addItem('Approve Selected', 'approveSelected')
    .addItem('Reject Selected', 'rejectSelected')
    .addToUi();
}

function approveSelected() { actOnSelection('approve'); }
function rejectSelected() { actOnSelection('reject'); }

function actOnSelection(action) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();
  if (!range) return;

  const webhook = PropertiesService.getScriptProperties().getProperty('N8N_WEBHOOK_URL');
  const secret = PropertiesService.getScriptProperties().getProperty('HMAC_SECRET');
  if (!webhook || !secret) {
    throw new Error('Missing script properties: set N8N_WEBHOOK_URL and HMAC_SECRET.');
  }

  const headerValues = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const idxToken = headerValues.indexOf('Token');
  if (idxToken === -1) throw new Error('Admin tab is missing the Token column.');
  const idxSummary = headerValues.indexOf('Summary');
  const idxType = headerValues.indexOf('Type');
  const idxWhen = headerValues.indexOf('WhenFound');
  const idxSource = headerValues.indexOf('SourceLink');

  const startRow = range.getRow();
  const numRows = range.getNumRows();
  const totalCols = sheet.getLastColumn();

  for (let offset = 0; offset < numRows; offset++) {
    const rowNumber = startRow + offset;
    if (rowNumber === 1) continue; // skip header row

    const rowValues = sheet.getRange(rowNumber, 1, 1, totalCols).getDisplayValues()[0];
    const token = String(rowValues[idxToken] || '').trim();
    if (!token) {
      Logger.log(`Row ${rowNumber}: no token found; skipping.`);
      continue;
    }

    const ts = new Date().toISOString();
    const canonical = JSON.stringify({ token, action, ts });
    const signature = computeHmacHex(canonical, secret);

    const body = {
      token,
      action,
      ts,
      actor: Session.getActiveUser().getEmail(),
      rowNumber,
      summary: idxSummary === -1 ? '' : rowValues[idxSummary],
      type: idxType === -1 ? '' : rowValues[idxType],
      when_found: idxWhen === -1 ? '' : rowValues[idxWhen],
      source_link: idxSource === -1 ? '' : rowValues[idxSource]
    };

    const response = UrlFetchApp.fetch(webhook, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(body),
      headers: { 'X-Signature': 'sha256=' + signature },
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    if (statusCode >= 400) {
      Logger.log(`Row ${rowNumber}: approval ${action} failed (${statusCode}) ${response.getContentText()}`);
    } else {
      Logger.log(`Row ${rowNumber}: approval ${action} sent (${statusCode}).`);
    }
  }
}

function computeHmacHex(message, secret) {
  const signature = Utilities.computeHmacSha256Signature(message, secret);
  return signature.map(b => (b + 256) % 256)
                  .map(b => ('0' + b.toString(16)).slice(-2))
                  .join('');
}
