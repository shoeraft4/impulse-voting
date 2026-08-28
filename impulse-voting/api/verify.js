export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) return res.status(400).send("Missing token");

  const SUPABASE_URL = "https://ehlvuzvqornzoaftekap.supabase.co";
  const SUPABASE_KEY = "sb_secret_Lpyo9Gl4jNR4SBQ-zjFpjQ_nUh6zpC5";

  const findRes = await fetch(
    `${SUPABASE_URL}/rest/v1/votes?token=eq.${token}&verified=eq.false&select=id`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const rows = await findRes.json();

  if (!rows.length) {
    return res.status(200).send(`<html><body style="font-family:sans-serif;background:#0d0d0d;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center"><h2 style="color:#ff6b6b;">Link expired or already used</h2><p style="color:#888;">This verification link is no longer valid.</p><a href="https://impulse-voting.vercel.app" style="color:#c8ff00;">Back to voting</a></div></body></html>`);
  }

  await fetch(
    `${SUPABASE_URL}/rest/v1/votes?token=eq.${token}`,
    {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ verified: true })
    }
  );

  return res.status(200).send(`<html><body style="font-family:sans-serif;background:#0d0d0d;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;"><div style="text-align:center"><h2 style="color:#c8ff00;">Vote confirmed!</h2><p style="color:#888;">Your vote has been counted. Thank you!</p><a href="https://impulse-voting.vercel.app" style="display:inline-block;margin-top:16px;background:#c8ff00;color:#0d0d0d;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">See results</a></div></body></html>`);
}
