import {commerceCredentialHash} from "../_lib/commerce.js";
import {checkoutPaidEvent, readRawBody, verifyPayMongoSignature} from "../_lib/paymongo.js";
import {sendJson, serviceRequest} from "../_lib/server.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const config = {api: {bodyParser: false}};

async function rawRequestBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;
  if (req.body && typeof req.body === "object") {
    throw new Error("Raw webhook body is unavailable for signature verification.");
  }
  return readRawBody(req);
}

async function confirmVoting(transaction, now) {
  const metadata = transaction.metadata || {};
  const candidateId = String(metadata.voting_candidate_id || "");
  const quantity = Number.parseInt(metadata.quantity || "1", 10) || 1;
  if (!UUID.test(String(transaction.related_entity_id || "")) || !UUID.test(candidateId)) {
    throw new Error("Voting payment metadata is incomplete.");
  }
  const existing = await serviceRequest(
    `vote_transactions?payment_transaction_id=eq.${encodeURIComponent(transaction.id)}&status=in.(pending,confirmed)&select=id,status`,
  );
  if (existing?.length) return;
  await serviceRequest("vote_transactions", {
    method: "POST",
    headers: {Prefer: "return=minimal"},
    body: JSON.stringify({
      voting_event_id: transaction.related_entity_id,
      voting_candidate_id: candidateId,
      payment_transaction_id: transaction.id,
      quantity,
      vote_kind: "paid",
      status: "confirmed",
      cast_at: now,
      metadata: {channel: "paymongo_webhook"},
    }),
  });
}

async function fulfillCommerce(transaction, now) {
  const orders = await serviceRequest(
    `commerce_orders?payment_transaction_id=eq.${encodeURIComponent(transaction.id)}&select=id,offer_id,quantity,status,public_reference`,
  );
  const order = orders?.[0];
  if (!order) throw new Error("Commerce payment has no matching order.");

  if (!['paid','fulfilled'].includes(order.status)) {
    await serviceRequest(`commerce_orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      headers: {Prefer: "return=minimal"},
      body: JSON.stringify({status: "paid", paid_at: now}),
    });
  }

  const offers = await serviceRequest(
    `commerce_offers?id=eq.${encodeURIComponent(order.offer_id)}&select=id,offer_type,metadata`,
  );
  const offer = offers?.[0];
  if (!offer) throw new Error("Commerce offer is no longer available.");
  if (!['ticket','ppv'].includes(offer.offer_type)) return;

  const credentialType = offer.offer_type === "ticket" ? "ticket" : "ppv_access";
  const required = credentialType === "ticket" ? Number(order.quantity) : 1;
  const existing = await serviceRequest(
    `commerce_access_credentials?order_id=eq.${encodeURIComponent(order.id)}&credential_type=eq.${credentialType}&select=credential_index`,
  );
  const present = new Set((existing || []).map((row) => Number(row.credential_index)));
  const rows = [];
  for (let index = 1; index <= required; index += 1) {
    if (present.has(index)) continue;
    rows.push({
      order_id: order.id,
      offer_id: order.offer_id,
      credential_type: credentialType,
      credential_index: index,
      token_hash: commerceCredentialHash(order.id, credentialType, index),
      status: "active",
      expires_at: offer.metadata?.access_expires_at || null,
    });
  }
  if (rows.length) {
    await serviceRequest("commerce_access_credentials", {
      method: "POST",
      headers: {Prefer: "return=minimal"},
      body: JSON.stringify(rows),
    });
  }
  if (order.status !== "fulfilled") {
    await serviceRequest(`commerce_orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      headers: {Prefer: "return=minimal"},
      body: JSON.stringify({status: "fulfilled", fulfilled_at: now}),
    });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const rawBody = await rawRequestBody(req);
    const signature = req.headers["paymongo-signature"] || req.headers["Paymongo-Signature"] || "";
    if (!verifyPayMongoSignature(rawBody, signature)) return sendJson(res, 401, {error: "Invalid webhook signature."});

    const payload = JSON.parse(rawBody);
    const paid = checkoutPaidEvent(payload);
    if (!paid) return sendJson(res, 200, {received: true, ignored: true});

    const session = paid.session;
    const attributes = session?.attributes || {};
    const transactionId = String(attributes.reference_number || attributes.metadata?.pageantindex_payment_id || "");
    if (!UUID.test(transactionId)) return sendJson(res, 200, {received: true, ignored: true});

    const transactions = await serviceRequest(
      `payment_transactions?id=eq.${encodeURIComponent(transactionId)}&select=id,provider,provider_payment_ref,transaction_type,related_entity_id,status,metadata,amount_minor,currency`,
    );
    const transaction = transactions?.[0];
    if (!transaction || transaction.provider !== "paymongo") return sendJson(res, 200, {received: true, ignored: true});
    if (transaction.provider_payment_ref && transaction.provider_payment_ref !== session.id) {
      return sendJson(res, 409, {error: "Checkout session does not match the payment transaction."});
    }

    const now = new Date().toISOString();
    if (transaction.status !== "confirmed") {
      await serviceRequest(`payment_transactions?id=eq.${encodeURIComponent(transaction.id)}`, {
        method: "PATCH",
        headers: {Prefer: "return=minimal"},
        body: JSON.stringify({status: "confirmed", confirmed_at: now, provider_payment_ref: session.id}),
      });
      transaction.status = "confirmed";
    }

    if (transaction.transaction_type === "voting") await confirmVoting(transaction, now);
    else if (['ticket','ppv','merchandise'].includes(transaction.transaction_type)) await fulfillCommerce(transaction, now);

    return sendJson(res, 200, {received: true});
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {
      error: error instanceof SyntaxError ? "Invalid webhook payload." : error.message,
    });
  }
}
