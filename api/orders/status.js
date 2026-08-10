import {commerceCredentialToken} from "../_lib/commerce.js";
import {authenticatedUser, sendJson, serviceRequest, sha256} from "../_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const reference = String(req.query?.reference || "").trim().slice(0, 80);
    const key = String(req.query?.key || "").trim();
    if (!/^PI-ORD-[A-Z0-9]{8,20}$/.test(reference)) return sendJson(res, 400, {error: "Invalid order reference."});
    const orders = await serviceRequest(`commerce_orders?public_reference=eq.${encodeURIComponent(reference)}&select=id,public_reference,offer_id,buyer_user_id,quantity,unit_amount_minor,amount_minor,currency,status,payment_transaction_id,access_token_hash,paid_at,fulfilled_at,created_at`);
    const order = orders?.[0];
    if (!order) return sendJson(res, 404, {error: "Order not found."});
    const user = await authenticatedUser(req);
    const authorizedByUser = Boolean(user && (user.id === order.buyer_user_id || user?.app_metadata?.role === "admin"));
    const authorizedByKey = Boolean(key && order.access_token_hash && sha256(key) === order.access_token_hash);
    if (!authorizedByUser && !authorizedByKey) return sendJson(res, 403, {error: "Order access key required."});

    const offers = await serviceRequest(`commerce_offers?id=eq.${encodeURIComponent(order.offer_id)}&select=id,edition_id,offer_type,name,description,status`);
    const offer = offers?.[0];
    if (!offer) return sendJson(res, 404, {error: "Order offer is no longer available."});
    const editions = await serviceRequest(`pageant_edition_drafts?id=eq.${encodeURIComponent(offer.edition_id)}&select=pageant_name,edition_name,edition_year,venue,event_start_at,event_end_at`);
    const edition = editions?.[0] || null;
    const transaction = order.payment_transaction_id ? (await serviceRequest(`payment_transactions?id=eq.${encodeURIComponent(order.payment_transaction_id)}&select=status,confirmed_at`))?.[0] : null;
    const credentialRows = ['paid','fulfilled'].includes(order.status)
      ? await serviceRequest(`commerce_access_credentials?order_id=eq.${encodeURIComponent(order.id)}&status=in.(active,redeemed)&select=credential_type,credential_index,status,expires_at,redeemed_at&order=credential_index.asc`)
      : [];
    const credentials = (credentialRows || []).map((credential) => ({
      type: credential.credential_type,
      index: credential.credential_index,
      status: credential.status,
      expiresAt: credential.expires_at,
      redeemedAt: credential.redeemed_at,
      token: commerceCredentialToken(order.id, credential.credential_type, credential.credential_index),
    }));
    return sendJson(res, 200, {
      reference: order.public_reference,
      quantity: order.quantity,
      unitAmountMinor: Number(order.unit_amount_minor),
      amountMinor: Number(order.amount_minor),
      currency: order.currency,
      status: order.status,
      paymentStatus: transaction?.status || null,
      paidAt: order.paid_at,
      fulfilledAt: order.fulfilled_at,
      offer: {type: offer.offer_type, name: offer.name, description: offer.description},
      edition,
      credentials,
    });
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
