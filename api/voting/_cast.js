import {requestIdentityHash, sendJson, serviceRequest} from "../_lib/server.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const votingEventId = String(body.votingEventId || "");
    const votingCandidateId = String(body.votingCandidateId || "");
    const paymentTransactionId = body.paymentTransactionId ? String(body.paymentTransactionId) : null;
    const requestedQuantity = Math.max(1, Math.min(Number.parseInt(body.quantity || "1", 10) || 1, 100000));
    if (!UUID.test(votingEventId) || !UUID.test(votingCandidateId) || (paymentTransactionId && !UUID.test(paymentTransactionId))) {
      return sendJson(res, 400, {error: "Invalid voting request."});
    }

    const events = await serviceRequest(`voting_events?id=eq.${encodeURIComponent(votingEventId)}&select=id,vote_mode,price_per_vote_minor,currency,max_free_votes_per_identity,starts_at,ends_at,status,review_state,published_at,show_live_totals`);
    const event = events?.[0];
    const now = Date.now();
    if (!event || event.review_state !== "approved" || !event.published_at || event.status !== "open") return sendJson(res, 409, {error: "This voting event is not open."});
    if (new Date(event.starts_at).getTime() > now || new Date(event.ends_at).getTime() <= now) return sendJson(res, 409, {error: "Voting is outside the official voting window."});

    const candidates = await serviceRequest(`voting_candidates?id=eq.${encodeURIComponent(votingCandidateId)}&voting_event_id=eq.${encodeURIComponent(votingEventId)}&is_active=eq.true&select=id`);
    if (!candidates?.length) return sendJson(res, 404, {error: "Candidate is not active in this voting event."});

    let voteKind = "free";
    let quantity = 1;
    let identityHash = null;
    if (paymentTransactionId) {
      if (!['paid','mixed'].includes(event.vote_mode)) return sendJson(res, 400, {error: "Paid voting is not enabled for this event."});
      const payments = await serviceRequest(`payment_transactions?id=eq.${encodeURIComponent(paymentTransactionId)}&select=id,transaction_type,amount_minor,currency,status,related_entity_id`);
      const payment = payments?.[0];
      const expected = Number(event.price_per_vote_minor || 0) * requestedQuantity;
      if (!payment || payment.status !== "confirmed" || payment.transaction_type !== "voting" || payment.currency !== event.currency || Number(payment.amount_minor) < expected || String(payment.related_entity_id || "") !== votingEventId) {
        return sendJson(res, 409, {error: "Confirmed payment does not match this vote purchase."});
      }
      const prior = await serviceRequest(`vote_transactions?payment_transaction_id=eq.${encodeURIComponent(paymentTransactionId)}&status=in.(pending,confirmed)&select=id&limit=1`);
      if (prior?.length) return sendJson(res, 409, {error: "This payment has already been used for voting."});
      voteKind = "paid";
      quantity = requestedQuantity;
    } else {
      if (!['free','mixed'].includes(event.vote_mode)) return sendJson(res, 400, {error: "This event requires a paid vote."});
      identityHash = requestIdentityHash(req, votingEventId);
      const limit = Number(event.max_free_votes_per_identity || 1);
      const previous = await serviceRequest(`vote_transactions?voting_event_id=eq.${encodeURIComponent(votingEventId)}&voter_identity_hash=eq.${encodeURIComponent(identityHash)}&vote_kind=eq.free&status=eq.confirmed&select=quantity`);
      const used = (previous || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0);
      if (used + 1 > limit) return sendJson(res, 429, {error: "The free-vote limit for this voting event has been reached."});
    }

    const created = await serviceRequest("vote_transactions", {
      method: "POST",
      headers: {Prefer: "return=representation"},
      body: JSON.stringify({
        voting_event_id: votingEventId,
        voting_candidate_id: votingCandidateId,
        voter_identity_hash: identityHash,
        payment_transaction_id: paymentTransactionId,
        quantity,
        vote_kind: voteKind,
        status: "confirmed",
        metadata: {channel: "web"},
      }),
    });

    let total = null;
    if (event.show_live_totals) {
      const ledger = await serviceRequest(`vote_transactions?voting_event_id=eq.${encodeURIComponent(votingEventId)}&voting_candidate_id=eq.${encodeURIComponent(votingCandidateId)}&status=eq.confirmed&select=quantity`);
      total = (ledger || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    }
    return sendJson(res, 201, {accepted: true, receiptId: created?.[0]?.id || null, quantity, liveTotal: total});
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
