// netlify/functions/card-status.js (CommonJS + Blobs)
const { getStore } = require('@netlify/blobs');

let store;
try {
  // ✅ Correct signature uses an options object with a name
  store = getStore({ name: 'card-store' });
} catch (e) {
  // If Blobs isn’t available, we’ll see it in the response
  store = null;
}

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function readStatus() {
  if (!store) return 'Active';
  const value = await store.get('status'); // returns string or null
  return value || 'Active';
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
        if (store) {
          await store.set('status', pretty); // persist!
        }
        return { statusCode: 200, headers, body: JSON.stringify({ status: pretty, persisted: !!store }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ message: "Status must be 'Active' or 'Deactivated'." }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ message: 'Server error', error: String(err) }) };
  }
};
