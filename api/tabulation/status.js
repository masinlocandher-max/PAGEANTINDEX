import {requireUser, sendJson, serviceRequest} from "../_lib/server.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const requested = String(req.query?.event || "");
    const isAdmin = user?.app_metadata?.role === "admin";
    if (!requested) {
      const filter = isAdmin ? "" : `&organizer_user_id=eq.${encodeURIComponent(user.id)}`;
      const events = await serviceRequest(`tabulation_events?select=id,edition_id,title,status,scoring_precision,locked_at,live_at,finalized_at,created_at${filter}&order=created_at.desc&limit=40`);
      return sendJson(res, 200, {events: events || []});
    }
    if (!UUID.test(requested)) return sendJson(res, 400, {error: "Invalid tabulation event."});
    const rows = await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(requested)}&select=id,edition_id,organizer_user_id,title,status,scoring_precision,locked_at,live_at,finalized_at,created_at`);
    const event = rows?.[0];
    if (!event) return sendJson(res, 404, {error: "Tabulation event not found."});
    if (event.organizer_user_id !== user.id && !isAdmin) return sendJson(res, 403, {error: "You do not manage this tabulation event."});

    const [segments, assignments, roster, results, totals] = await Promise.all([
      serviceRequest(`tabulation_segments?tabulation_event_id=eq.${encodeURIComponent(event.id)}&select=id,name,display_order,weight&order=display_order.asc`),
      serviceRequest(`judge_assignments?tabulation_event_id=eq.${encodeURIComponent(event.id)}&select=id,judge_display_name,status,accepted_at,created_at&order=created_at.asc`),
      serviceRequest(`pageant_candidate_roster_drafts?edition_id=eq.${encodeURIComponent(event.edition_id)}&status=in.(confirmed,completed)&select=id,candidate_display_name,representation,candidate_number,status&order=candidate_number.asc`),
      serviceRequest(`tabulation_results?tabulation_event_id=eq.${encodeURIComponent(event.id)}&select=roster_id,final_score,final_rank,status,published_at&order=final_rank.asc.nullslast`),
      serviceRequest(`tabulation_score_totals?tabulation_event_id=eq.${encodeURIComponent(event.id)}&select=roster_id,weighted_score,score_count,current_rank`),
    ]);
    const segmentIds = (segments || []).map((row) => row.id);
    const criteria = segmentIds.length
      ? await serviceRequest(`tabulation_criteria?segment_id=in.(${segmentIds.join(',')})&select=id,segment_id,name,max_score,weight,display_order&order=display_order.asc`)
      : [];
    const activeJudges = (assignments || []).filter((row) => ["accepted","active","completed"].includes(row.status));
    const expectedScores = activeJudges.length * (criteria || []).length;
    const totalsMap = new Map((totals || []).map((row) => [row.roster_id, row]));
    const resultMap = new Map((results || []).map((row) => [row.roster_id, row]));
    const candidates = (roster || []).map((candidate) => {
      const total = totalsMap.get(candidate.id);
      const final = resultMap.get(candidate.id);
      return {
        id: candidate.id,
        name: candidate.candidate_display_name,
        representation: candidate.representation,
        candidateNumber: candidate.candidate_number,
        scoreCount: Number(total?.score_count || 0),
        expectedScoreCount: expectedScores,
        scoringComplete: expectedScores > 0 && Number(total?.score_count || 0) === expectedScores,
        weightedScore: total?.weighted_score === undefined ? null : Number(total.weighted_score),
        currentRank: total?.current_rank === undefined ? null : Number(total.current_rank),
        finalScore: final?.final_score === undefined ? null : Number(final.final_score),
        finalRank: final?.final_rank === undefined ? null : Number(final.final_rank),
        finalPublished: Boolean(final?.published_at),
      };
    });
    return sendJson(res, 200, {
      event: {...event, expectedScoresPerCandidate: expectedScores},
      segments: segments || [],
      criteria: criteria || [],
      judges: assignments || [],
      candidates,
      allScoringComplete: candidates.length > 0 && expectedScores > 0 && candidates.every((candidate) => candidate.scoringComplete),
    });
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
