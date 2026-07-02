export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const expected = String(process.env.ACTIONS_API_TOKEN || "").trim();
  const provided = String(req.query.token || "").trim();

  if (!expected) {
    return res.status(500).json({ ok: false, error: "missing ACTIONS_API_TOKEN", bypassReachedApp: true });
  }

  if (!provided || provided !== expected) {
    return res.status(401).json({
      ok: false,
      error: !provided ? "missing token" : "invalid token",
      bypassReachedApp: true,
      receivedToken: Boolean(provided),
      receivedLength: provided.length,
      expectedLength: expected.length
    });
  }

  const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/+$/, "");

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ ok: false, error: "missing Supabase env vars", bypassReachedApp: true });
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/action_board_actions?select=id,title,owner_name,owner_email,eta,status,context_notes,updated_at,created_at,archived&status=in.(open,blocked)&archived=eq.false&order=eta.asc.nullslast,updated_at.desc`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`
      }
    }
  );

  if (!response.ok) {
    return res.status(500).json({ ok: false, error: await response.text(), bypassReachedApp: true });
  }

  const rows = await response.json();

  return res.status(200).json({
    ok: true,
    bypassReachedApp: true,
    count: rows.length,
    actions: rows.map((row) => ({
      id: row.id,
      title: row.title || "",
      owner_name: row.owner_name || "",
      owner_email: row.owner_email || "",
      eta: row.eta || null,
      status: row.status || "open",
      context: row.context_notes || "",
      last_updated: row.updated_at || row.created_at || null
    }))
  });
}
