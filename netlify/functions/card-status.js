// netlify/functions/card-status.js
import { getStore } from '@netlify/blobs';   // persistent store
const store = getStore('card-store');        // a site-wide namespace for your keys

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper to read the current status (default "Active" if not set yet)
async function readStatus() {
  const value = await store.get('status');   // returns a string or null
  return value || 'Active';
}

export async function handler(event) {
  // CORS preflight
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
        await store.set('status', pretty);   // persist!
        return { statusCode: 200, headers, body: JSON.stringify({ status: pretty }) };
      }

      return { statusCode: 400, headers, body: JSON.stringify({ message: "Status must be 'Active' or 'Deactivated'." }) };
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Invalid JSON.' }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
}
