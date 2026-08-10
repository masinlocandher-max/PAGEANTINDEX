import {sendJson, serviceRequest, sha256} from "../_lib/server.js";

const maskEmail = (value) => {
  const [name, domain] = String(value || "").split("@");
  if (!domain) return "";
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, Math.min(6, name.length - 2)))}@${domain}`;
};

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const token = String(req.query?.token || "");
    if (token.length < 20) return sendJson(res, 400, {error: "Invalid organization invitation."});
    const invites = await serviceRequest(`organization_admin_invites?token_hash=eq.${encodeURIComponent(sha256(token))}&status=eq.pending&select=id,organization_id,invite_email,invite_kind,expires_at&limit=1`);
    const invite = invites?.[0];
    if (!invite) return sendJson(res, 404, {error: "Invitation is invalid or no longer available."});
    if (new Date(invite.expires_at).getTime() <= Date.now()) return sendJson(res, 410, {error: "Invitation has expired."});
    const organizations = await serviceRequest(`pageant_organizations?id=eq.${encodeURIComponent(invite.organization_id)}&select=id,organization_name,slug,status,country_name,city&limit=1`);
    const organization = organizations?.[0];
    if (!organization) return sendJson(res, 404, {error: "Organization record is unavailable."});
    return sendJson(res, 200, {organization, inviteKind: invite.invite_kind, invitedEmail: maskEmail(invite.invite_email), expiresAt: invite.expires_at});
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
