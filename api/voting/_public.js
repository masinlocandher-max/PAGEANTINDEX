import {sendJson, serviceRequest} from "../_lib/server.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const requestedId = String(req.query?.event || "");
    if (requestedId && !UUID.test(requestedId)) return sendJson(res, 400, {error: "Invalid voting event."});
    const filter = requestedId ? `id=eq.${encodeURIComponent(requestedId)}&` : "";
    const events = await serviceRequest(`voting_events?${filter}review_state=eq.approved&published_at=not.is.null&status=in.(scheduled,open,closed,finalized)&select=id,edition_id,title,vote_mode,price_per_vote_minor,currency,max_free_votes_per_identity,starts_at,ends_at,status,show_live_totals,rules_url&order=starts_at.desc&limit=${requestedId ? 1 : 20}`);
    const output = [];
    for (const event of events || []) {
      const editions = await serviceRequest(`pageant_edition_drafts?id=eq.${encodeURIComponent(event.edition_id)}&review_state=eq.approved&published_at=not.is.null&select=id,organization_name,pageant_name,edition_name,edition_year,country_name,city,venue,event_start_at,event_end_at`);
      const edition = editions?.[0];
      if (!edition) continue;
      const candidates = await serviceRequest(`voting_candidates?voting_event_id=eq.${encodeURIComponent(event.id)}&is_active=eq.true&select=id,roster_id,display_order&order=display_order.asc`);
      const rosterIds = (candidates || []).map((item) => item.roster_id);
      const roster = rosterIds.length ? await serviceRequest(`pageant_candidate_roster_drafts?id=in.(${rosterIds.join(',')})&is_public=eq.true&select=id,candidate_display_name,representation,candidate_number`) : [];
      const rosterById = new Map((roster || []).map((row) => [row.id, row]));
      const publicCandidates = (candidates || []).map((item) => {
        const person = rosterById.get(item.roster_id);
        return person ? {id: item.id, displayName: person.candidate_display_name, representation: person.representation, candidateNumber: person.candidate_number} : null;
      }).filter(Boolean);
      if (!publicCandidates.length) continue;
      let totals = null;
      if (event.show_live_totals) {
        const ledger = await serviceRequest(`vote_transactions?voting_event_id=eq.${encodeURIComponent(event.id)}&status=eq.confirmed&select=voting_candidate_id,quantity`);
        totals = {};
        for (const row of ledger || []) totals[row.voting_candidate_id] = (totals[row.voting_candidate_id] || 0) + Number(row.quantity || 0);
      }
      output.push({
        id: event.id, title: event.title, voteMode: event.vote_mode, pricePerVoteMinor: Number(event.price_per_vote_minor), currency: event.currency,
        maxFreeVotesPerIdentity: event.max_free_votes_per_identity, startsAt: event.starts_at, endsAt: event.ends_at, status: event.status,
        showLiveTotals: event.show_live_totals, rulesUrl: event.rules_url,
        edition: {organizationName: edition.organization_name, pageantName: edition.pageant_name, editionName: edition.edition_name, editionYear: edition.edition_year, countryName: edition.country_name, city: edition.city, venue: edition.venue},
        candidates: publicCandidates.map((candidate) => ({...candidate, liveTotal: totals ? Number(totals[candidate.id] || 0) : null})),
      });
    }
    return sendJson(res, 200, {events: output});
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
