export default async function handler(req, res) {
  const password = req.query.password || (req.body && req.body.password);
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const SUPABASE_URL = "https://ehlvuzvqornzoaftekap.supabase.co";
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const verifiedRes = await fetch(
    `${SUPABASE_URL}/rest/v1/votes?select=startup_id&verified=eq.true`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const verifiedRows = await verifiedRes.json();

  const pendingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/votes?select=startup_id&verified=eq.false`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const pendingRows = await pendingRes.json();

  const counts = {};
  verifiedRows.forEach(row => { counts[row.startup_id] = (counts[row.startup_id] || 0) + 1; });

  return res.status(200).json({
    counts,
    total_verified: verifiedRows.length,
    total_pending: pendingRows.length
  });
}
