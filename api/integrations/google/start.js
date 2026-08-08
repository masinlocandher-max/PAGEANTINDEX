import {googleConfig, requireFounder, sendJson, signOAuthState} from "../../_lib/founder.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireFounder(req, res);
  if (!user) return;

  try {
    const {clientId, redirectUri} = googleConfig(req);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: [
        "openid",
        "email",
        "https://www.googleapis.com/auth/gmail.readonly",
      ].join(" "),
      state: signOAuthState(user.id),
    });
    return sendJson(res, 200, {authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`});
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
