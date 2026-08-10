import {requireUser, sendJson, serviceRequest} from "../_lib/server.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const tabulationEventId = String(body.tabulationEventId || "");
    const publishResults = body.publishResults === true;
    if (!UUID.test(tabulationEventId)) return sendJson(res, 400, {error: "Invalid tabulation event."});

    const events = await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(tabulationEventId)}&select=id,edition_id,organizer_user_id,status,scoring_precision`);
    const event = events?.[0];
    if (!event) return sendJson(res, 404, {error: "Tabulation event not found."});
    const isAdmin = user?.app_metadata?.role === "admin";
    if (event.organizer_user_id !== user.id && !isAdmin) return sendJson(res, 403, {error: "Only the event organizer can finalize this tabulation."});
    if (!['locked','live'].includes(event.status)) return sendJson(res, 409, {error: "Lock the scoring configuration and run live scoring before finalization."});

    const assignments = await serviceRequest(`judge_assignments?tabulation_event_id=eq.${encodeURIComponent(tabulationEventId)}&status=in.(accepted,active,completed)&select=id`);
    const segments = await serviceRequest(`tabulation_segments?tabulation_event_id=eq.${encodeURIComponent(tabulationEventId)}&select=id`);
    const segmentIds = (segments || []).map((row) => row.id);
    const criteria = segmentIds.length
      ? await serviceRequest(`tabulation_criteria?segment_id=in.(${segmentIds.join(',')})&select=id`)
      : [];
    const roster = await serviceRequest(`pageant_candidate_roster_drafts?edition_id=eq.${encodeURIComponent(event.edition_id)}&status=in.(confirmed,completed)&select=id`);
    if (!assignments?.length) return sendJson(res, 409, {error: "No active judges are assigned."});
    if (!criteria?.length) return sendJson(res, 409, {error: "No scoring criteria are configured."});
    if (!roster?.length) return sendJson(res, 409, {error: "No confirmed candidates are in the edition roster."});

    const expectedPerCandidate = assignments.length * criteria.length;
    const totals = await serviceRequest(`tabulation_score_totals?tabulation_event_id=eq.${encodeURIComponent(tabulationEventId)}&select=roster_id,weighted_score,score_count,current_rank`);
    const totalsByRoster = new Map((totals || []).map((row) => [row.roster_id, row]));
    const incomplete = roster.filter((candidate) => Number(totalsByRoster.get(candidate.id)?.score_count || 0) !== expectedPerCandidate);
    if (incomplete.length) {
      return sendJson(res, 409, {
        error: "Finalization blocked because scoring is incomplete.",
        incompleteCandidates: incomplete.length,
        expectedScoresPerCandidate: expectedPerCandidate,
      });
    }

    const now = new Date().toISOString();
    const rows = roster.map((candidate) => {
      const total = totalsByRoster.get(candidate.id);
      return {
        tabulation_event_id: tabulationEventId,
        roster_id: candidate.id,
        final_score: Number(total.weighted_score) / assignments.length,
        final_rank: Number(total.current_rank),
        status: "final",
        published_at: publishResults ? now : null,
      };
    });
    await serviceRequest("tabulation_results?on_conflict=tabulation_event_id,roster_id", {
      method: "POST",
      headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
      body: JSON.stringify(rows),
    });
    await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(tabulationEventId)}`, {
      method: "PATCH",
      headers: {Prefer: "return=minimal"},
      body: JSON.stringify({status: "finalized", finalized_at: now}),
    });
    return sendJson(res, 200, {finalized: true, published: publishResults, candidateCount: rows.length, judgeCount: assignments.length});
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
