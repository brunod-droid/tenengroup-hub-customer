function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  };
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = getConfig();
  if (!url || !key) throw new Error("Missing Supabase environment variables.");
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
  if (!response.ok) throw new Error(await response.text() || `Supabase request failed: ${response.status}`);
  if (response.status === 204) return null;
  return response.json();
}

const TABLE = "action_board_actions";
const CLOSED = ["done", "cancelled", "closed"];

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const { status, owner, includeClosed, reminder } = req.query;
      let filters = "select=*&order=eta.asc.nullslast,updated_at.desc";
      if (reminder === "true") filters += "&status=eq.open&archived=eq.false";
      else if (status && status !== "all") filters += `&status=eq.${encodeURIComponent(status)}`;
      else if (includeClosed !== "true") filters += "&status=in.(open,blocked)&archived=eq.false";
      if (owner) filters += `&owner_name=eq.${encodeURIComponent(owner)}`;
      const rows = await supabaseRequest(`${TABLE}?${filters}`);
      return res.status(200).json(rows || []);
    }

    if (req.method === "POST") {
      const b = req.body || {};
      if (!b.title) return res.status(400).json({ error: "Missing title." });
      const rows = await supabaseRequest(TABLE, {
        method: "POST",
        body: JSON.stringify({
          title: b.title,
          owner_name: b.owner_name || "",
          owner_email: b.owner_email || "",
          eta: b.eta || null,
          status: b.status || "open",
          priority: b.priority || "medium",
          brand: b.brand || "",
          category: b.category || "CS",
          source: b.source || "AI email",
          progress: Number(b.progress || 0),
          context_notes: b.context_notes || "",
          comments: Array.isArray(b.comments) ? b.comments : [],
          archived: Boolean(b.archived || false),
          updated_at: new Date().toISOString()
        })
      });
      return res.status(200).json(rows?.[0] || null);
    }

    if (req.method === "PATCH") {
      const id = req.query.id || req.body?.id;
      if (!id) return res.status(400).json({ error: "Missing action id." });
      const b = req.body || {};
      const allowed = ["title", "owner_name", "owner_email", "eta", "status", "priority", "brand", "category", "source", "progress", "context_notes", "comments", "archived"];
      const payload = {};
      for (const k of allowed) if (Object.prototype.hasOwnProperty.call(b, k)) payload[k] = b[k];
      if (payload.eta === "") payload.eta = null;
      if (payload.progress !== undefined) payload.progress = Number(payload.progress || 0);
      if (payload.status && CLOSED.includes(payload.status)) payload.archived = true;
      if (payload.status === "open" || payload.status === "blocked") payload.archived = Boolean(payload.archived || false);
      payload.updated_at = new Date().toISOString();
      const rows = await supabaseRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
      return res.status(200).json(rows?.[0] || null);
    }

    if (req.method === "DELETE") {
      const id = req.query.id || req.body?.id;
      if (!id) return res.status(400).json({ error: "Missing action id." });
      await supabaseRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Actions API error." });
  }
}
