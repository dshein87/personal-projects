/**
 * Adds a custom menu for Room Parent approvals.
 * Requires Script Properties: N8N_WEBHOOK_URL, HMAC_SECRET
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
  const values = range.getDisplayValues();
  const webhook = PropertiesService.getScriptProperties().getProperty('N8N_WEBHOOK_URL');
  const secret  = PropertiesService.getScriptProperties().getProperty('HMAC_SECRET');
  if (!webhook || !secret) throw new Error('Missing script properties');

  values.forEach(row => {
    const entityId = row[0];      // assumes first column holds entity_id (configure in n8n)
    const entityType = row[1];    // assumes second column holds entity_type
    const body = JSON.stringify({
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      actor: Session.getActiveUser().getEmail(),
      ts: new Date().toISOString()
    });
    const sig = computeHmacHex(body, secret);
    const resp = UrlFetchApp.fetch(webhook, {
      method: 'post',
      contentType: 'application/json',
      payload: body,
      headers: { 'X-Signature': 'sha256=' + sig }
    });
    Logger.log(resp.getResponseCode());
  });
}

function computeHmacHex(message, secret) {
  const signature = Utilities.computeHmacSha256Signature(message, secret);
  return signature.map(b => (b + 256) % 256)
                  .map(b => ('0' + b.toString(16)).slice(-2))
                  .join('');
}
