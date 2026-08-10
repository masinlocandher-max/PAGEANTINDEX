import {cleanText, randomToken, requireUser, sendJson, serviceRequest, sha256} from "../_lib/server.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const editionId = String(body.editionId || "");
    const candidateRosterId = body.candidateRosterId ? String(body.candidateRosterId) : null;
    const creditScope = body.creditScope === "candidate" ? "candidate" : "organization";
    const proposedRole = cleanText(body.proposedRole, 160);
    const invitedEmail = cleanText(body.invitedEmail, 320) || null;
    if (!UUID.test(editionId) || (candidateRosterId && !UUID.test(candidateRosterId))) return sendJson(res, 400, {error: "Invalid pageant relationship."});
    if (proposedRole.length < 2) return sendJson(res, 400, {error: "Add the professional role or credit."});
    if ((creditScope === "candidate") !== Boolean(candidateRosterId)) return sendJson(res, 400, {error: "Candidate credits must identify a candidate; organization credits must not."});
    if (invitedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invitedEmail)) return sendJson(res, 400, {error: "Enter a valid email address."});

    const editions = await serviceRequest(`pageant_edition_drafts?id=eq.${encodeURIComponent(editionId)}&select=id,organizer_user_id,pageant_name,edition_name,edition_year`);
    const edition = editions?.[0];
    if (!edition) return sendJson(res, 404, {error: "Pageant edition not found."});
    if (edition.organizer_user_id !== user.id && user?.app_metadata?.role !== "admin") return sendJson(res, 403, {error: "Only the organizer can invite professionals to this edition."});

    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const rows = await serviceRequest("credit_invites", {
      method: "POST",
      headers: {Prefer: "return=representation"},
      body: JSON.stringify({
        edition_id: editionId,
        candidate_roster_id: candidateRosterId,
        organizer_user_id: edition.organizer_user_id,
        invited_email: invitedEmail,
        proposed_role: proposedRole,
        credit_scope: creditScope,
        token_hash: sha256(token),
        status: "pending",
        expires_at: expiresAt,
      }),
    });
    const site = String(process.env.PUBLIC_SITE_URL || "https://www.pageantindex.com").replace(/\/$/, "");
    return sendJson(res, 201, {
      created: true,
      inviteId: rows?.[0]?.id || null,
      invitationUrl: `${site}/credit-invite/?token=${encodeURIComponent(token)}`,
      expiresAt,
    });
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
