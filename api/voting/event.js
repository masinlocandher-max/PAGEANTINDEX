import {sendJson, serviceRequest} from "../_lib/server.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const eventId = String(req.query?.event || "");
    if (!eventId) {
      const rows = await serviceRequest("voting_events?review_state=eq.approved&published_at=not.is.null&status=in.(scheduled,open)&select=id,title,vote_mode,price_per_vote_minor,currency,starts_at,ends_at,status&order=starts_at.asc&limit=20");
      return sendJson(res, 200, {events: rows || []});
    }
    if (!UUID.test(eventId)) return sendJson(res, 400, {error: "Invalid voting event."});
    const rows = await serviceRequest(`voting_events?id=eq.${encodeURIComponent(eventId)}&review_state=eq.approved&published_at=not.is.null&select=id,edition_id,title,vote_mode,price_per_vote_minor,currency,max_free_votes_per_identity,starts_at,ends_at,status,show_live_totals,rules_url`);
    const event = rows?.[0];
    if (!event) return sendJson(res, 404, {error: "Voting event not found."});
    const candidateRows = await serviceRequest(`voting_candidates?voting_event_id=eq.${encodeURIComponent(eventId)}&is_active=eq.true&select=id,roster_id,display_order&order=display_order.asc`);
    const rosterIds = (candidateRows || []).map((row) => row.roster_id);
    const roster = rosterIds.length
      ? await serviceRequest(`pageant_candidate_roster_drafts?id=in.(${rosterIds.join(',')})&is_public=eq.true&select=id,candidate_display_name,representation,candidate_number,status`)
      : [];
    const rosterMap = new Map((roster || []).map((row) => [row.id, row]));
    let totals = new Map();
    if (event.show_live_totals && candidateRows?.length) {
      const ledger = await serviceRequest(`vote_transactions?voting_event_id=eq.${encodeURIComponent(eventId)}&status=eq.confirmed&select=voting_candidate_id,quantity`);
      totals = new Map();
      for (const row of ledger || []) totals.set(row.voting_candidate_id, (totals.get(row.voting_candidate_id) || 0) + Number(row.quantity || 0));
    }
    const candidates = (candidateRows || []).map((candidate) => {
      const profile = rosterMap.get(candidate.roster_id);
      if (!profile) return null;
      return {
        id: candidate.id,
        rosterId: candidate.roster_id,
        displayOrder: candidate.display_order,
        name: profile.candidate_display_name,
        representation: profile.representation,
        candidateNumber: profile.candidate_number,
        liveTotal: event.show_live_totals ? (totals.get(candidate.id) || 0) : null,
      };
    }).filter(Boolean);
    return sendJson(res, 200, {event, candidates});
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
