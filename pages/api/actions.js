function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  };
}

function getExpectedToken() {
  return process.env.ACTIONS_API_TOKEN || process.env.ACTION_BOARD_API_TOKEN || "";
}

function getProvidedToken(req) {
  const queryToken = req.query.token;
  const auth = req.headers.authorization || "";

  if (queryToken) return String(queryToken);

  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  return "";
}

function requireValidToken(req, res) {
  const expected = getExpectedToken();
  const provided = getProvidedToken(req);

  if (!expected) {
    res.status(500).json({ error: "Missing ACTIONS_API_TOKEN environment variable." });
    return false;
  }

  if (!provided || provided !== expected) {
    res.status(401).json({ error: "Unauthorized." });
    return false;
  }

  return true;
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = getConfig();

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cleanUrl = String(url).replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");

  const response = await fetch(`${cleanUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

const TABLE = "action_board_actions";

function mapForReminder(row) {
  return {
    id: row.id,
    title: row.title || "",
    owner_name: row.owner_name || "",
    owner_email: row.owner_email || "",
    eta: row.eta || null,
    status: row.status || "open",
    context: row.context_notes || "",
    last_updated: row.updated_at || row.created_at || null
  };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed. This endpoint is read-only." });
    }

    if (!requireValidToken(req, res)) return;

    const includeClosed = req.query.includeClosed === "true";
    const owner = req.query.owner;
    const status = req.query.status;

    let filters = "select=id,title,owner_name,owner_email,eta,status,context_notes,updated_at,created_at,archived&order=eta.asc.nullslast,updated_at.desc";

    if (status && status !== "all") {
      filters += `&status=eq.${encodeURIComponent(status)}`;
    } else if (!includeClosed) {
      filters += "&status=in.(open,blocked)";
    }

    if (!includeClosed) {
      filters += "&archived=eq.false";
    }

    if (owner) {
      filters += `&owner_name=eq.${encodeURIComponent(owner)}`;
    }

    const rows = await supabaseRequest(`${TABLE}?${filters}`);
    return res.status(200).json((rows || []).map(mapForReminder));
  } catch (error) {
    return res.status(500).json({ error: error.message || "Actions API error." });
  }
}
