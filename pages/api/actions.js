function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    key:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY
  };
}

function getExpectedToken() {
  return String(process.env.ACTIONS_API_TOKEN || "").trim();
}

function getProvidedToken(req) {
  if (req.query.token) return String(req.query.token).trim();

  const auth = req.headers.authorization || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }

  return "";
}

function validateToken(req, res) {
  const expected = getExpectedToken();
  const provided = getProvidedToken(req);

  if (req.query.debug === "true") {
    res.status(200).json({
      ok: true,
      debug: true,
      bypassReachedApp: true,
      expectedExists: Boolean(expected),
      expectedLength: expected.length,
      receivedToken: Boolean(provided),
      receivedLength: provided.length,
      receivedPreview: provided ? `${provided.slice(0, 6)}...${provided.slice(-4)}` : null,
      queryTokenExists: Boolean(req.query.token),
      authHeaderExists: Boolean(req.headers.authorization)
    });
    return false;
  }

  if (!expected) {
    res.status(500).json({
      ok: false,
      error: "missing ACTIONS_API_TOKEN",
      bypassReachedApp: true,
      receivedToken: Boolean(provided)
    });
    return false;
  }

  if (!provided) {
    res.status(401).json({
      ok: false,
      error: "missing token",
      bypassReachedApp: true,
      receivedToken: false
    });
    return false;
  }

  if (provided !== expected) {
    res.status(401).json({
      ok: false,
      error: "invalid token",
      bypassReachedApp: true,
      receivedToken: true,
      receivedLength: provided.length,
      expectedLength: expected.length,
      receivedPreview: `${provided.slice(0, 6)}...${provided.slice(-4)}`
    });
    return false;
  }

  return true;
}

async function supabaseRequest(path) {
  const { url, key } = getConfig();

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  const cleanUrl = String(url).replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");

  const response = await fetch(`${cleanUrl}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

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
    res.setHeader("Cache-Control", "no-store");

    if (req.method !== "GET") {
      return res.status(405).json({
        ok: false,
        error: "method not allowed",
        bypassReachedApp: true
      });
    }

    if (!validateToken(req, res)) return;

    const includeClosed = req.query.includeClosed === "true";

    let filters =
      "select=id,title,owner_name,owner_email,eta,status,context_notes,updated_at,created_at,archived&order=eta.asc.nullslast,updated_at.desc";

    if (!includeClosed) {
      filters += "&status=in.(open,blocked)&archived=eq.false";
    }

    const rows = await supabaseRequest(`action_board_actions?${filters}`);

    return res.status(200).json({
      ok: true,
      bypassReachedApp: true,
      count: rows.length,
      actions: rows.map(mapForReminder)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Actions API error.",
      bypassReachedApp: true
    });
  }
}
