// netlify/functions/card-status.js (CommonJS + Blobs + in-memory fallback)
const { getStore } = require('@netlify/blobs');

// Try to open the persistent store (ok if not available)
let store = null;
try {
  store = getStore({ name: 'card-store' });
} catch (_) { /* ignore */ }

// In-memory fallback (survives while the same instance is warm)
let volatileStatus = 'Active';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function readStatus() {
  if (store) {
    const value = await store.get('status'); // string or null
    return value || volatileStatus;
  }
  return volatileStatus;
}

async function writeStatus(value) {
  volatileStatus = value;          // always keep the in-memory copy
  if (store) await store.set('status', value); // persist if available
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    if (event.httpMethod === 'GET') {
      const status = await readStatus();
      return { statusCode: 200, headers, body: JSON.stringify({ status, persisted: !!store }) };
    }

    if (event.httpMethod === 'POST') {
      const { status } = JSON.parse(event.body || '{}');
      const normalized = String(status || '').toLowerCase();

      if (normalized === 'active' || normalized === 'deactivated') {
        const pretty = normalized[0].toUpperCase() + normalized.slice(1);
        await writeStatus(pretty);
        return { statusCode: 200, headers, body: JSON.stringify({ status: pretty, persisted: !!store }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ message: "Status must be 'Active' or 'Deactivated'." }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Server error', error: String(err) }) };
  }
};
