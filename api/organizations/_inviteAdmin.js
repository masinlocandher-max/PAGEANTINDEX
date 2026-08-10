import {cleanText, randomToken, requireUser, sendJson, serviceRequest, sha256} from "../_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const organizationId = String(body.organizationId || "");
    const email = cleanText(body.email, 320).toLowerCase();
    if (!organizationId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(res, 400, {error: "Organization and administrator email are required."});
    const membership = await serviceRequest(`organization_admin_memberships?organization_id=eq.${encodeURIComponent(organizationId)}&user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&select=id,admin_sequence&limit=1`);
    if (!membership?.length) return sendJson(res, 403, {error: "Only an active organization administrator can add another administrator."});
    const organizations = await serviceRequest(`pageant_organizations?id=eq.${encodeURIComponent(organizationId)}&status=eq.claimed&select=id,organization_name&limit=1`);
    if (!organizations?.length) return sendJson(res, 409, {error: "The organization must first be claimed by Admin 1."});

    await serviceRequest(`organization_admin_invites?organization_id=eq.${encodeURIComponent(organizationId)}&invite_email=eq.${encodeURIComponent(email)}&status=eq.pending`, {
      method: "PATCH",
      headers: {Prefer: "return=minimal"},
      body: JSON.stringify({status: "revoked"}),
    });
    const token = randomToken(36);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await serviceRequest("organization_admin_invites", {
      method: "POST",
      headers: {Prefer: "return=minimal"},
      body: JSON.stringify({organization_id: organizationId, invite_email: email, invite_kind: "admin_invite", token_hash: sha256(token), invited_by_user_id: user.id, status: "pending", expires_at: expiresAt}),
    });
    return sendJson(res, 201, {
      inviteUrl: `${String(req.headers["x-forwarded-proto"] || "https")}://${String(req.headers.host || "www.pageantindex.com")}/organization-claim/?token=${encodeURIComponent(token)}`,
      email,
      expiresAt,
    });
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
