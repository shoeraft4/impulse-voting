export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, startup_id } = req.body;

  if (!email || !startup_id) return res.status(400).json({ error: "Missing fields" });

  const SUPABASE_URL = "https://ehlvuzvqornzoaftekap.supabase.co";
  const SUPABASE_KEY = "sb_secret_Lpyo9Gl4jNR4SBQ-zjFpjQ_nUh6zpC5";
  const RESEND_KEY = "re_CrEd763a_QV8WkPFnmmfmqspAXC7PB8Bm";

  const checkRes = await fetch(
    `${SUPABASE_URL}/rest/v1/votes?email=eq.${encodeURIComponent(email.toLowerCase())}&verified=eq.true&select=id`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const existing = await checkRes.json();
  if (existing.length > 0) return res.status(409).json({ error: "already_voted" });

  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

  await fetch(
    `${SUPABASE_URL}/rest/v1/votes?email=eq.${encodeURIComponent(email.toLowerCase())}&verified=eq.false`,
    { method: "DELETE", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );

  await fetch(`${SUPABASE_URL}/rest/v1/votes`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ email: email.toLowerCase(), startup_id, verified: false, token })
  });

  const verifyUrl = `https://impulse-voting.vercel.app/api/verify?token=${token}`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Impulse Network <onboarding@resend.dev>",
      to: email,
      subject: "Confirm your vote — Impulse Startup Competition 2026",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0d0d0d;color:#fff;"><h2 style="color:#c8ff00;margin-bottom:8px;">Confirm your vote</h2><p style="color:#aaa;margin-bottom:24px;">Click the button below to confirm your vote for the Impulse Network Startup Competition 2026.</p><a href="${verifyUrl}" style="display:inline-block;background:#c8ff00;color:#0d0d0d;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Confirm my vote</a><p style="color:#555;font-size:12px;margin-top:24px;">If you did not vote, ignore this email.</p></div>`
    })
  });

  return res.status(200).json({ success: true });
}
