// Paste this into a temporary Code node and execute it once
const store = $getWorkflowStaticData('global');

// Generate a random HMAC secret (or use your own)
const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');

store.approvalsHmacSecret = secret;

return [{
  json: {
    status: 'stored',
    secret: secret,
    message: 'HMAC secret has been set. You can now run the workflow.'
  }
}];
