import {requireUser, sendJson, serviceRequest, sha256} from "../_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const token = String(body.token || "").trim();
    if (token.length < 20 || token.length > 200) return sendJson(res, 400, {error: "Invalid invitation token."});
    const tokenHash = sha256(token);
    const invites = await serviceRequest(`credit_invites?token_hash=eq.${encodeURIComponent(tokenHash)}&select=id,edition_id,candidate_roster_id,organizer_user_id,invited_email,proposed_role,credit_scope,status,expires_at,accepted_by_user_id`);
    const invite = invites?.[0];
    if (!invite) return sendJson(res, 404, {error: "Invitation not found."});
    if (invite.status === "accepted" && invite.accepted_by_user_id === user.id) return sendJson(res, 200, {accepted: true, alreadyAccepted: true});
    if (invite.status !== "pending") return sendJson(res, 409, {error: "This invitation is no longer active."});
    if (new Date(invite.expires_at).getTime() <= Date.now()) {
      await serviceRequest(`credit_invites?id=eq.${encodeURIComponent(invite.id)}`, {method: "PATCH", headers: {Prefer: "return=minimal"}, body: JSON.stringify({status: "expired"})});
      return sendJson(res, 410, {error: "This invitation has expired."});
    }

    const profiles = await serviceRequest(`professional_profile_drafts?user_id=eq.${encodeURIComponent(user.id)}&select=user_id,business_name,submission_state,review_state`);
    if (!profiles?.length) return sendJson(res, 409, {error: "Create or claim your free PageantIndex professional profile before accepting this credit.", profileRequired: true});

    const existingQuery = invite.candidate_roster_id
      ? `professional_credits?edition_id=eq.${encodeURIComponent(invite.edition_id)}&candidate_roster_id=eq.${encodeURIComponent(invite.candidate_roster_id)}&supplier_user_id=eq.${encodeURIComponent(user.id)}&role=eq.${encodeURIComponent(invite.proposed_role)}&status=neq.removed&select=id,status`
      : `professional_credits?edition_id=eq.${encodeURIComponent(invite.edition_id)}&candidate_roster_id=is.null&supplier_user_id=eq.${encodeURIComponent(user.id)}&role=eq.${encodeURIComponent(invite.proposed_role)}&status=neq.removed&select=id,status`;
    const existing = (await serviceRequest(existingQuery))?.[0];
    const now = new Date().toISOString();
    let creditId = existing?.id || null;
    if (existing) {
      await serviceRequest(`professional_credits?id=eq.${encodeURIComponent(existing.id)}`, {
        method: "PATCH", headers: {Prefer: "return=minimal"},
        body: JSON.stringify({status: "confirmed", confirmed_by_user_id: user.id, confirmed_at: now}),
      });
    } else {
      const rows = await serviceRequest("professional_credits", {
        method: "POST", headers: {Prefer: "return=representation"},
        body: JSON.stringify({
          edition_id: invite.edition_id,
          candidate_roster_id: invite.candidate_roster_id,
          supplier_user_id: user.id,
          role: invite.proposed_role,
          credit_scope: invite.credit_scope,
          status: "confirmed",
          created_by_user_id: invite.organizer_user_id,
          confirmed_by_user_id: user.id,
          confirmed_at: now,
        }),
      });
      creditId = rows?.[0]?.id || null;
    }
    await serviceRequest(`credit_invites?id=eq.${encodeURIComponent(invite.id)}`, {
      method: "PATCH", headers: {Prefer: "return=minimal"},
      body: JSON.stringify({status: "accepted", accepted_by_user_id: user.id}),
    });
    return sendJson(res, 200, {accepted: true, creditId});
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
