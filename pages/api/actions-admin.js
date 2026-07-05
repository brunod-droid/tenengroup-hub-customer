function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    key:
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY
  };
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
const CLOSED_STATUSES = ["done", "cancelled", "closed"];

function normalizePayload(body = {}) {
  const payload = {};

  const allowed = [
    "title",
    "owner_name",
    "owner_email",
    "eta",
    "status",
    "priority",
    "brand",
    "category",
    "source",
    "progress",
    "context_notes",
    "comments",
    "archived"
  ];

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      payload[key] = body[key];
    }
  }

  if (payload.eta === "") payload.eta = null;
  if (payload.progress !== undefined) payload.progress = Number(payload.progress || 0);

  if (payload.status && CLOSED_STATUSES.includes(payload.status)) {
    payload.archived = true;
  }

  if (payload.status === "open" || payload.status === "blocked") {
    payload.archived = Boolean(payload.archived || false);
  }

  payload.updated_at = new Date().toISOString();

  return payload;
}

export default async function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");

    if (req.method === "GET") {
      const includeClosed = req.query.includeClosed === "true";
      const owner = req.query.owner;
      const status = req.query.status;

      let filters = "select=*&order=eta.asc.nullslast,updated_at.desc";

      if (status && status !== "all") {
        filters += `&status=eq.${encodeURIComponent(status)}`;
      } else if (!includeClosed) {
        filters += "&status=in.(open,blocked)&archived=eq.false";
      }

      if (owner) {
        filters += `&owner_name=eq.${encodeURIComponent(owner)}`;
      }

      const rows = await supabaseRequest(`${TABLE}?${filters}`);
      return res.status(200).json(rows || []);
    }

    if (req.method === "POST") {
      const body = req.body || {};

      if (!body.title || !String(body.title).trim()) {
        return res.status(400).json({ error: "Missing title." });
      }

      const payload = normalizePayload({
        title: String(body.title || "").trim(),
        owner_name: body.owner_name || "",
        owner_email: body.owner_email || "",
        eta: body.eta || null,
        status: body.status || "open",
        priority: body.priority || "medium",
        brand: body.brand || "",
        category: body.category || "CS",
        source: body.source || "AI email",
        progress: body.progress || 0,
        context_notes: body.context_notes || "",
        comments: Array.isArray(body.comments) ? body.comments : [],
        archived: Boolean(body.archived || false)
      });

      const rows = await supabaseRequest(TABLE, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      return res.status(200).json(rows?.[0] || null);
    }

    if (req.method === "PATCH") {
      const id = req.query.id || req.body?.id;

      if (!id) {
        return res.status(400).json({ error: "Missing action id." });
      }

      const payload = normalizePayload(req.body || {});

      const rows = await supabaseRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });

      return res.status(200).json(rows?.[0] || null);
    }

    if (req.method === "DELETE") {
      const id = req.query.id || req.body?.id;

      if (!id) {
        return res.status(400).json({ error: "Missing action id." });
      }

      await supabaseRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Actions admin API error." });
  }
}
