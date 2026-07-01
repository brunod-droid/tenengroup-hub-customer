export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  return res.status(200).json({
    ok: true,
    bypassReachedApp: true,
    route: "/api/ping",
    method: req.method,
    debug: req.query.debug === "true",
    receivedQuery: Object.keys(req.query || {}),
    timestamp: new Date().toISOString()
  });
}
