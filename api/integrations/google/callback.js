import {
  encryptSecret,
  getIntegration,
  googleConfig,
  sendJson,
  upsertIntegration,
  verifyOAuthState,
} from "../../_lib/founder.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});

  const code = String(req.query?.code || "");
  const state = String(req.query?.state || "");
  const oauthError = String(req.query?.error || "");
  const site = (process.env.PUBLIC_SITE_URL || `https://${req.headers.host || "www.pageantindex.com"}`).replace(/\/$/, "");

  if (oauthError) {
    res.statusCode = 302;
    res.setHeader("Location", `${site}/founder/?gmail=declined`);
    return res.end();
  }

  try {
    const {userId} = verifyOAuthState(state);
    const {clientId, clientSecret, redirectUri} = googleConfig(req);
    if (!code) throw new Error("Missing Google authorization code.");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) {
      throw new Error(token.error_description || token.error || "Google authorization failed.");
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {Authorization: `Bearer ${token.access_token}`},
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.email) throw new Error("Could not read the connected Google account email.");

    const existing = await getIntegration(userId, "google_gmail").catch(() => null);
    const refreshToken = token.refresh_token || (existing?.encrypted_refresh_token && existing?.token_iv ? "__KEEP_EXISTING__" : "");
    if (!refreshToken) throw new Error("Google did not return offline access. Reconnect and grant access again.");

    let encrypted = existing?.encrypted_refresh_token || null;
    let iv = existing?.token_iv || null;
    if (refreshToken !== "__KEEP_EXISTING__") {
      const secured = encryptSecret(refreshToken);
      encrypted = secured.encrypted;
      iv = secured.iv;
    }

    await upsertIntegration({
      owner_user_id: userId,
      provider: "google_gmail",
      status: "connected",
      account_email: profile.email,
      encrypted_refresh_token: encrypted,
      token_iv: iv,
      scope: token.scope || "https://www.googleapis.com/auth/gmail.readonly",
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    res.statusCode = 302;
    res.setHeader("Location", `${site}/founder/?gmail=connected`);
    return res.end();
  } catch (error) {
    res.statusCode = 302;
    res.setHeader("Location", `${site}/founder/?gmail=error&reason=${encodeURIComponent(error.message.slice(0, 180))}`);
    return res.end();
  }
}
