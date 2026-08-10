import {requireUser, sendJson, serviceRequest, sha256} from "../_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const token = String(body.token || "");
    if (token.length < 20) return sendJson(res, 400, {error: "Invalid organization invitation."});
    const result = await serviceRequest("rpc/pageantindex_accept_organization_invite", {
      method: "POST",
      headers: {Prefer: "return=representation"},
      body: JSON.stringify({p_token_hash: sha256(token), p_user_id: user.id, p_email: user.email || ""}),
    });
    const payload = Array.isArray(result) ? result[0] : result;
    return sendJson(res, 200, {accepted: true, ...payload});
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 409, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
