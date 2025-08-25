// netlify/functions/card-status.js (CommonJS version)
const { getStore } = require('@netlify/blobs');   // use require in CJS
const store = getStore('card-store');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function readStatus() {
  const value = await store.get('status'); // string or null
  return value || 'Active';
}

module.exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    const status = await readStatus();
    return { statusCode: 200, headers, body: JSON.stringify({ status }) };
  }

  if (event.httpMethod === 'POST') {
    try {
      const { status } = JSON.parse(event.body || '{}');
      const normalized = String(status || '').toLowerCase();

      if (normalized === 'active' || normalized === 'deactivated') {
        const pretty = normalized[0].toUpperCase() + normalized.slice(1);
        await store.set('status', pretty);
        return { statusCode: 200, headers, body: JSON.stringify({ status: pretty }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ message: "Status must be 'Active' or 'Deactivated'." }) };
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Invalid JSON.' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
};
