export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send("Missing token");

  const SUPABASE_URL = "https://ehlvuzvqornzoaftekap.supabase.co";
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_KEY) {
    return res.status(500).send("SUPABASE_SERVICE_KEY is not set on this deployment");
  }

  const findRes = await fetch(
    `${SUPABASE_URL}/rest/v1/votes?token=eq.${token}&verified=eq.false&select=id`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );

  if (!findRes.ok) {
    const errBody = await findRes.text();
    return res.status(200).send(`<html><body style="font-family:sans-serif;background:#0f1626;color:#ffffff;padding:40px;"><h2 style="color:#ff6b6b;">Debug: Supabase query failed</h2><p>Status: ${findRes.status}</p><pre style="white-space:pre-wrap;background:#161f35;padding:16px;border-radius:8px;">${errBody}</pre></body></html>`);
  }

  const rows = await findRes.json();

  if (!rows.length) {
    return res.status(200).send(`<html><body style="font-family:sans-serif;background:#0f1626;color:#ffffff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center"><h2 style="color:#ff6b6b;">Link expired or already used</h2><p style="color:#8b93ab;">This verification link is no longer valid.</p><a href="https://impulse-voting.vercel.app" style="color:#e2836f;">Back to Impulse Voting</a></div></body></html>`);
  }

  await fetch(`${SUPABASE_URL}/rest/v1/votes?token=eq.${token}`, {
    method: "PATCH",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ verified: true })
  });

  return res.status(200).send(`<html><body style="font-family:sans-serif;background:#0f1626;color:#ffffff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center"><h2 style="color:#e2836f;">Vote confirmed!</h2><p style="color:#8b93ab;">Your vote has been counted. Thank you!</p><a href="https://impulse-voting.vercel.app" style="display:inline-block;margin-top:16px;background:#e2836f;color:#10182b;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">Back to Impulse Voting</a></div></body></html>`);
}
