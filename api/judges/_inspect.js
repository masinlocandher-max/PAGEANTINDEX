import {sendJson, serviceRequest, sha256} from "../_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const token = String(req.query?.token || "").trim();
    if (token.length < 20 || token.length > 200) return sendJson(res, 400, {error: "Invalid judge invitation."});
    const rows = await serviceRequest(`judge_assignments?access_token_hash=eq.${encodeURIComponent(sha256(token))}&select=id,tabulation_event_id,judge_display_name,status,expires_at`);
    const assignment = rows?.[0];
    if (!assignment) return sendJson(res, 404, {error: "Judge invitation not found."});
    const events = await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(assignment.tabulation_event_id)}&select=id,edition_id,title,status`);
    const event = events?.[0];
    const editions = event ? await serviceRequest(`pageant_edition_drafts?id=eq.${encodeURIComponent(event.edition_id)}&select=pageant_name,edition_name,edition_year,organization_name,event_start_at,venue`) : [];
    const edition = editions?.[0] || null;
    return sendJson(res, 200, {
      active: assignment.status === "invited" && (!assignment.expires_at || new Date(assignment.expires_at).getTime() > Date.now()),
      status: assignment.status,
      expiresAt: assignment.expires_at,
      judgeDisplayName: assignment.judge_display_name,
      event: event ? {title: event.title, status: event.status} : null,
      edition,
    });
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
