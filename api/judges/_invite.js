import {cleanText, randomToken, requireUser, sendJson, serviceRequest, sha256} from "../_lib/server.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const tabulationEventId = String(body.tabulationEventId || "");
    const judgeDisplayName = cleanText(body.judgeDisplayName, 180);
    const judgeEmail = cleanText(body.judgeEmail, 320);
    if (!UUID.test(tabulationEventId)) return sendJson(res, 400, {error: "Invalid tabulation event."});
    if (judgeDisplayName.length < 2) return sendJson(res, 400, {error: "Enter the judge's display name."});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(judgeEmail)) return sendJson(res, 400, {error: "Enter a valid judge email address."});
    const events = await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(tabulationEventId)}&select=id,edition_id,organizer_user_id,status,title`);
    const event = events?.[0];
    if (!event) return sendJson(res, 404, {error: "Tabulation event not found."});
    if (event.organizer_user_id !== user.id && user?.app_metadata?.role !== "admin") return sendJson(res, 403, {error: "Only the organizer can invite judges to this tabulation."});
    if (!['draft','rehearsal','locked'].includes(event.status)) return sendJson(res, 409, {error: "Judge invitations are closed for this tabulation state."});
    const token = randomToken(32);
    const expiresAt = new Date(Date.now() + 7*24*60*60*1000).toISOString();
    const rows = await serviceRequest("judge_assignments", {
      method: "POST", headers: {Prefer: "return=representation"},
      body: JSON.stringify({tabulation_event_id: tabulationEventId, judge_email: judgeEmail, judge_display_name: judgeDisplayName, status: "invited", access_token_hash: sha256(token), expires_at: expiresAt}),
    });
    const site = String(process.env.PUBLIC_SITE_URL || "https://www.pageantindex.com").replace(/\/$/, "");
    return sendJson(res, 201, {created: true, assignmentId: rows?.[0]?.id || null, invitationUrl: `${site}/judge/?token=${encodeURIComponent(token)}`, expiresAt});
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
