import {commerceCredentialHash} from "../_lib/commerce.js";
import {checkoutPaidEvent, readRawBody, verifyPayMongoSignature} from "../_lib/paymongo.js";
import {sendJson, serviceRequest} from "../_lib/server.js";

export const config = {api: {bodyParser: false}};

function paidPayment(session) {
  return (session?.attributes?.payments || []).find((entry) => entry?.attributes?.status === "paid") || null;
}

async function fulfillVoting(transaction) {
  const eventId = transaction.related_entity_id;
  const candidateId = transaction.metadata?.voting_candidate_id;
  const quantity = Math.max(1, Number.parseInt(transaction.metadata?.quantity || "1", 10) || 1);
  if (!eventId || !candidateId) throw new Error("Voting payment metadata is incomplete.");
  const existing = await serviceRequest(`vote_transactions?payment_transaction_id=eq.${encodeURIComponent(transaction.id)}&status=in.(pending,confirmed)&select=id&limit=1`);
  if (existing?.length) return;
  await serviceRequest("vote_transactions", {
    method: "POST", headers: {Prefer: "return=minimal"},
    body: JSON.stringify({
      voting_event_id: eventId,
      voting_candidate_id: candidateId,
      payment_transaction_id: transaction.id,
      quantity,
      vote_kind: "paid",
      status: "confirmed",
      metadata: {channel: "paymongo"},
    }),
  });
}

async function fulfillCommerce(transaction) {
  const orders = await serviceRequest(`commerce_orders?payment_transaction_id=eq.${encodeURIComponent(transaction.id)}&select=id,offer_id,quantity,status`);
  const order = orders?.[0];
  if (!order) throw new Error("Commerce order was not found for the payment.");
  const offers = await serviceRequest(`commerce_offers?id=eq.${encodeURIComponent(order.offer_id)}&select=id,offer_type,inventory_limit,status`);
  const offer = offers?.[0];
  if (!offer) throw new Error("Commerce offer was not found.");
  const now = new Date().toISOString();
  if (!['paid','fulfilled'].includes(order.status)) {
    await serviceRequest(`commerce_orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH", headers: {Prefer: "return=minimal"}, body: JSON.stringify({status: "paid", paid_at: now}),
    });
  }

  if (offer.offer_type === "ticket" || offer.offer_type === "ppv") {
    const credentialType = offer.offer_type === "ticket" ? "ticket" : "ppv_access";
    const count = credentialType === "ticket" ? Number(order.quantity) : 1;
    const credentials = Array.from({length: count}, (_, offset) => ({
      order_id: order.id,
      offer_id: offer.id,
      credential_type: credentialType,
      credential_index: offset + 1,
      token_hash: commerceCredentialHash(order.id, credentialType, offset + 1),
      status: "active",
    }));
    await serviceRequest("commerce_access_credentials?on_conflict=order_id,credential_type,credential_index", {
      method: "POST", headers: {Prefer: "resolution=ignore-duplicates,return=minimal"}, body: JSON.stringify(credentials),
    });
    await serviceRequest(`commerce_orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH", headers: {Prefer: "return=minimal"}, body: JSON.stringify({status: "fulfilled", fulfilled_at: now}),
    });
  }

  if (offer.inventory_limit !== null) {
    const sales = await serviceRequest(`commerce_offer_sales?offer_id=eq.${encodeURIComponent(offer.id)}&select=units_sold`);
    if (Number(sales?.[0]?.units_sold || 0) >= Number(offer.inventory_limit) && offer.status !== "sold_out") {
      await serviceRequest(`commerce_offers?id=eq.${encodeURIComponent(offer.id)}`, {
        method: "PATCH", headers: {Prefer: "return=minimal"}, body: JSON.stringify({status: "sold_out"}),
      });
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const rawBody = await readRawBody(req);
    if (!verifyPayMongoSignature(rawBody, req.headers["paymongo-signature"])) return sendJson(res, 401, {error: "Invalid webhook signature."});
    const payload = JSON.parse(rawBody);
    const event = checkoutPaidEvent(payload);
    if (!event) return sendJson(res, 200, {received: true, ignored: true});
    const session = event.session;
    const transactionId = String(session?.attributes?.reference_number || session?.attributes?.metadata?.pageantindex_payment_id || "");
    if (!transactionId) return sendJson(res, 200, {received: true, ignored: true});
    const transactions = await serviceRequest(`payment_transactions?id=eq.${encodeURIComponent(transactionId)}&select=id,provider,provider_payment_ref,transaction_type,amount_minor,currency,status,related_entity_id,metadata`);
    const transaction = transactions?.[0];
    if (!transaction || transaction.provider !== "paymongo") return sendJson(res, 200, {received: true, ignored: true});
    if (transaction.provider_payment_ref && transaction.provider_payment_ref !== session.id) throw new Error("Checkout session does not match the internal transaction.");
    const payment = paidPayment(session);
    if (!payment) throw new Error("Paid checkout event did not contain a paid payment.");
    const paid = payment.attributes || {};
    if (paid.currency !== transaction.currency || Number(paid.amount) < Number(transaction.amount_minor)) throw new Error("Paid amount does not match the internal transaction.");

    const now = new Date().toISOString();
    if (transaction.status !== "confirmed") {
      await serviceRequest(`payment_transactions?id=eq.${encodeURIComponent(transaction.id)}`, {
        method: "PATCH", headers: {Prefer: "return=minimal"},
        body: JSON.stringify({
          status: "confirmed",
          confirmed_at: now,
          provider_payment_ref: session.id,
          metadata: {...(transaction.metadata || {}), paymongo_payment_id: payment.id, payment_method: paid.source?.type || null},
        }),
      });
      transaction.status = "confirmed";
    }

    if (transaction.transaction_type === "voting") await fulfillVoting(transaction);
    else if (['ticket','ppv','merchandise'].includes(transaction.transaction_type)) await fulfillCommerce(transaction);

    return sendJson(res, 200, {received: true, fulfilled: true});
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid webhook payload." : error.message});
  }
}
