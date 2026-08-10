import {sendJson, serviceRequest, sha256} from "../_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const token = String(req.query?.token || "").trim();
    if (token.length < 20 || token.length > 200) return sendJson(res, 400, {error: "Invalid invitation token."});
    const invites = await serviceRequest(`credit_invites?token_hash=eq.${encodeURIComponent(sha256(token))}&select=id,edition_id,candidate_roster_id,proposed_role,credit_scope,status,expires_at`);
    const invite = invites?.[0];
    if (!invite) return sendJson(res, 404, {error: "Invitation not found."});
    const editions = await serviceRequest(`pageant_edition_drafts?id=eq.${encodeURIComponent(invite.edition_id)}&select=id,pageant_name,edition_name,edition_year,organization_name`);
    const edition = editions?.[0] || null;
    let candidate = null;
    if (invite.candidate_roster_id) {
      const candidates = await serviceRequest(`pageant_candidate_roster_drafts?id=eq.${encodeURIComponent(invite.candidate_roster_id)}&select=id,candidate_display_name,representation`);
      candidate = candidates?.[0] || null;
    }
    return sendJson(res, 200, {
      active: invite.status === "pending" && new Date(invite.expires_at).getTime() > Date.now(),
      status: invite.status,
      expiresAt: invite.expires_at,
      proposedRole: invite.proposed_role,
      creditScope: invite.credit_scope,
      edition: edition ? {pageantName: edition.pageant_name, editionName: edition.edition_name, editionYear: edition.edition_year, organizationName: edition.organization_name} : null,
      candidate: candidate ? {displayName: candidate.candidate_display_name, representation: candidate.representation} : null,
    });
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
