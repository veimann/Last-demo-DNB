// netlify/functions/card-status.js

// ⚠️ Demo-only: this value is in-memory and may reset on cold starts.
let cardStatus = "Active";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",              // allow calls from your chatbot/web
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod === "GET") {
    return { statusCode: 200, headers, body: JSON.stringify({ status: cardStatus }) };
  }

  if (event.httpMethod === "POST") {
    try {
      const { status } = JSON.parse(event.body || "{}");
      const normalized = String(status || "").toLowerCase();

      if (normalized === "active" || normalized === "deactivated") {
        // Capitalize nicely for the response
        cardStatus = normalized[0].toUpperCase() + normalized.slice(1);
        return { statusCode: 200, headers, body: JSON.stringify({ status: cardStatus }) };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Status must be 'Active' or 'Deactivated'." }),
      };
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ message: "Invalid JSON." }) };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ message: "Method Not Allowed" }) };
};
