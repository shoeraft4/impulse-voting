async function fetchAllRows(url, headers) {
  const pageSize = 1000;
  let offset = 0;
  let all = [];

  while (true) {
    const res = await fetch(url, {
      headers: {
        ...headers,
        Range: `${offset}-${offset + pageSize - 1}`
      }
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(detail);
    }

    const rows = await res.json();
    all = all.concat(rows);

    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

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

    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

    let verifiedRows, pendingRows;
    try {
      verifiedRows = await fetchAllRows(
        `${SUPABASE_URL}/rest/v1/votes?select=startup_id&verified=eq.true`,
        headers
      );
    } catch (e) {
      return res.status(502).json({ error: "supabase_error", detail: String(e.message || e) });
    }

    try {
      pendingRows = await fetchAllRows(
        `${SUPABASE_URL}/rest/v1/votes?select=startup_id&verified=eq.false`,
        headers
      );
    } catch (e) {
      pendingRows = [];
    }

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
