export default async function handler(req, res) {
  try {
    // Safe diagnostic: tells you whether the env var exists on THIS deployment,
    // without ever revealing its value. Visit /api/admin-stats?check=1
    if (req.query.check) {
      return res.status(200).json({
        admin_password_configured: !!process.env.ADMIN_PASSWORD,
        supabase_key_configured: !!process.env.SUPABASE_SERVICE_KEY
      });
    }

    const password = req.query.password || (req.body && req.body.password);
    if (!process.env.ADMIN_PASSWORD) {
      return res.status(500).json({ error: "ADMIN_PASSWORD is not set on this deployment" });
    }
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "wrong_password" });
    }

    const SUPABASE_URL = "https://ehlvuzvqornzoaftekap.supabase.co";
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
    if (!SUPABASE_KEY) {
      return res.status(500).json({ error: "SUPABASE_SERVICE_KEY is not set on this deployment" });
    }

    const verifiedRes = await fetch(
      `${SUPABASE_URL}/rest/v1/votes?select=startup_id&verified=eq.true`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!verifiedRes.ok) {
      const t = await verifiedRes.text();
      return res.status(502).json({ error: "supabase_error", detail: t });
    }
    const verifiedRows = await verifiedRes.json();

    const pendingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/votes?select=startup_id&verified=eq.false`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const pendingRows = pendingRes.ok ? await pendingRes.json() : [];

    const counts = {};
    verifiedRows.forEach(row => { counts[row.startup_id] = (counts[row.startup_id] || 0) + 1; });

    return res.status(200).json({
      counts,
      total_verified: verifiedRows.length,
      total_pending: pendingRows.length
    });
  } catch (e) {
    return res.status(500).json({ error: "server_exception", detail: String(e) });
  }
}
