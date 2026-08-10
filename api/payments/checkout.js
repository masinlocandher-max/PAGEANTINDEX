import {authenticatedUser, cleanText, randomToken, sendJson, serviceRequest, sha256} from "../_lib/server.js";
import {createCheckoutSession, paymentMethods} from "../_lib/paymongo.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function publicSite() {
  return String(process.env.PUBLIC_SITE_URL || "https://www.pageantindex.com").replace(/\/$/, "");
}

function validEmail(value) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  let transactionId = null;
  let orderId = null;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const purpose = body.purpose === "offer" ? "offer" : body.purpose === "voting" ? "voting" : "";
    if (!purpose) return sendJson(res, 400, {error: "Choose a valid checkout purpose."});
    const user = await authenticatedUser(req);
    const buyerName = cleanText(body.buyerName, 180) || null;
    const buyerEmail = cleanText(body.buyerEmail, 320) || user?.email || null;
    if (!validEmail(buyerEmail)) return sendJson(res, 400, {error: "Enter a valid email address."});

    let name;
    let description;
    let amountMinor;
    let quantity;
    let transactionType;
    let relatedEntityId;
    let successUrl;
    let cancelUrl;
    let metadata;
    let orderAccessToken = null;
    let orderReference = null;

    if (purpose === "voting") {
      const eventId = String(body.votingEventId || "");
      const candidateId = String(body.votingCandidateId || "");
      quantity = Math.max(1, Math.min(Number.parseInt(body.quantity || "1", 10) || 1, 100000));
      if (!UUID.test(eventId) || !UUID.test(candidateId)) return sendJson(res, 400, {error: "Invalid voting checkout."});
      const events = await serviceRequest(`voting_events?id=eq.${encodeURIComponent(eventId)}&select=id,title,vote_mode,price_per_vote_minor,currency,starts_at,ends_at,status,review_state,published_at`);
      const event = events?.[0];
      const now = Date.now();
      if (!event || event.review_state !== "approved" || !event.published_at || event.status !== "open" || new Date(event.starts_at).getTime() > now || new Date(event.ends_at).getTime() <= now) {
        return sendJson(res, 409, {error: "This voting event is not open for paid voting."});
      }
      if (!['paid','mixed'].includes(event.vote_mode) || Number(event.price_per_vote_minor) <= 0) return sendJson(res, 409, {error: "Paid voting is not enabled for this event."});
      const candidates = await serviceRequest(`voting_candidates?id=eq.${encodeURIComponent(candidateId)}&voting_event_id=eq.${encodeURIComponent(eventId)}&is_active=eq.true&select=id,roster_id`);
      if (!candidates?.length) return sendJson(res, 404, {error: "Candidate is not active in this voting event."});
      amountMinor = Number(event.price_per_vote_minor) * quantity;
      name = `${event.title} vote${quantity === 1 ? "" : "s"}`.slice(0, 180);
      description = "Official PageantIndex voting checkout";
      transactionType = "voting";
      relatedEntityId = eventId;
      metadata = {purpose: "voting", voting_candidate_id: candidateId, quantity: String(quantity), unit_amount_minor: String(event.price_per_vote_minor)};
      successUrl = `${publicSite()}/vote/?event=${encodeURIComponent(eventId)}&payment_success=1`;
      cancelUrl = `${publicSite()}/vote/?event=${encodeURIComponent(eventId)}&payment_canceled=1`;
    } else {
      const offerId = String(body.offerId || "");
      quantity = Math.max(1, Math.min(Number.parseInt(body.quantity || "1", 10) || 1, 1000));
      if (!UUID.test(offerId)) return sendJson(res, 400, {error: "Invalid offer."});
      const offers = await serviceRequest(`commerce_offers?id=eq.${encodeURIComponent(offerId)}&select=id,edition_id,organizer_user_id,offer_type,name,description,price_minor,currency,inventory_limit,sale_starts_at,sale_ends_at,status,review_state,published_at`);
      const offer = offers?.[0];
      const now = Date.now();
      if (!offer || offer.review_state !== "approved" || !offer.published_at || offer.status !== "active") return sendJson(res, 409, {error: "This offer is not available for purchase."});
      if (offer.sale_starts_at && new Date(offer.sale_starts_at).getTime() > now) return sendJson(res, 409, {error: "Sales have not opened yet."});
      if (offer.sale_ends_at && new Date(offer.sale_ends_at).getTime() <= now) return sendJson(res, 409, {error: "Sales have closed."});
      if (Number(offer.price_minor) <= 0) return sendJson(res, 409, {error: "This offer is not configured for paid checkout."});
      if (offer.inventory_limit !== null) {
        const sales = await serviceRequest(`commerce_offer_sales?offer_id=eq.${encodeURIComponent(offerId)}&select=units_sold`);
        const sold = Number(sales?.[0]?.units_sold || 0);
        if (sold + quantity > Number(offer.inventory_limit)) return sendJson(res, 409, {error: "Requested quantity is no longer available."});
      }
      amountMinor = Number(offer.price_minor) * quantity;
      name = offer.name;
      description = offer.description || `PageantIndex ${offer.offer_type} purchase`;
      transactionType = offer.offer_type;
      relatedEntityId = offerId;
      metadata = {purpose: "offer", offer_id: offerId, offer_type: offer.offer_type, quantity: String(quantity), unit_amount_minor: String(offer.price_minor)};
      orderAccessToken = randomToken(32);
      const transactionRows = await serviceRequest("payment_transactions", {
        method: "POST", headers: {Prefer: "return=representation"},
        body: JSON.stringify({payer_user_id: user?.id || null, provider: "paymongo", transaction_type: transactionType, amount_minor: amountMinor, currency: "PHP", status: "pending", related_entity_type: "commerce_offer", related_entity_id: offerId, metadata}),
      });
      transactionId = transactionRows?.[0]?.id;
      if (!transactionId) throw new Error("Could not create a payment transaction.");
      const orderRows = await serviceRequest("commerce_orders", {
        method: "POST", headers: {Prefer: "return=representation"},
        body: JSON.stringify({
          offer_id: offerId, buyer_user_id: user?.id || null, buyer_email: buyerEmail, buyer_name: buyerName,
          quantity, unit_amount_minor: Number(offer.price_minor), amount_minor: amountMinor, currency: "PHP",
          status: "pending_payment", payment_transaction_id: transactionId, access_token_hash: sha256(orderAccessToken),
          fulfillment_data: offer.offer_type === "merchandise" && body.shipping && typeof body.shipping === "object" ? {shipping: body.shipping} : {},
        }),
      });
      orderId = orderRows?.[0]?.id;
      orderReference = orderRows?.[0]?.public_reference;
      if (!orderId || !orderReference) throw new Error("Could not create the order record.");
      metadata.order_id = orderId;
      metadata.order_reference = orderReference;
      await serviceRequest(`payment_transactions?id=eq.${encodeURIComponent(transactionId)}`, {method: "PATCH", headers: {Prefer: "return=minimal"}, body: JSON.stringify({metadata})});
      successUrl = `${publicSite()}/order/?reference=${encodeURIComponent(orderReference)}&key=${encodeURIComponent(orderAccessToken)}`;
      cancelUrl = `${publicSite()}/order/?reference=${encodeURIComponent(orderReference)}&key=${encodeURIComponent(orderAccessToken)}&canceled=1`;
    }

    if (!transactionId) {
      const rows = await serviceRequest("payment_transactions", {
        method: "POST", headers: {Prefer: "return=representation"},
        body: JSON.stringify({payer_user_id: user?.id || null, provider: "paymongo", transaction_type: transactionType, amount_minor: amountMinor, currency: "PHP", status: "pending", related_entity_type: purpose === "voting" ? "voting_event" : "commerce_offer", related_entity_id: relatedEntityId, metadata}),
      });
      transactionId = rows?.[0]?.id;
      if (!transactionId) throw new Error("Could not create a payment transaction.");
    }

    const checkout = await createCheckoutSession({
      line_items: [{name, description: description.slice(0, 500), amount: Math.round(amountMinor / quantity), currency: "PHP", quantity}],
      payment_method_types: paymentMethods(),
      success_url: successUrl,
      cancel_url: cancelUrl,
      reference_number: transactionId,
      send_email_receipt: true,
      pass_on_fees: false,
      metadata: {pageantindex_payment_id: transactionId, purpose, related_id: relatedEntityId},
      ...(buyerEmail || buyerName ? {billing: {email: buyerEmail || undefined, name: buyerName || undefined}} : {}),
    });

    await serviceRequest(`payment_transactions?id=eq.${encodeURIComponent(transactionId)}`, {
      method: "PATCH", headers: {Prefer: "return=minimal"},
      body: JSON.stringify({provider_payment_ref: checkout.id, metadata: {...metadata, checkout_session_id: checkout.id}}),
    });
    return sendJson(res, 201, {checkoutUrl: checkout.attributes.checkout_url, paymentTransactionId: transactionId, orderReference});
  } catch (error) {
    if (transactionId) {
      await serviceRequest(`payment_transactions?id=eq.${encodeURIComponent(transactionId)}`, {method: "PATCH", headers: {Prefer: "return=minimal"}, body: JSON.stringify({status: "failed"})}).catch(() => {});
    }
    if (orderId) {
      await serviceRequest(`commerce_orders?id=eq.${encodeURIComponent(orderId)}`, {method: "PATCH", headers: {Prefer: "return=minimal"}, body: JSON.stringify({status: "canceled"})}).catch(() => {});
    }
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
