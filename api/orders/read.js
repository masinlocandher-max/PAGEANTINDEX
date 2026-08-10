import {commerceCredentialToken} from "../_lib/commerce.js";
import {sendJson, serviceRequest, sha256} from "../_lib/server.js";

const REFERENCE = /^PI-ORD-[A-Z0-9]{8,20}$/;

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const reference = String(req.query?.reference || "").trim().toUpperCase();
    const key = String(req.query?.key || "").trim();
    if (!REFERENCE.test(reference) || key.length < 20 || key.length > 200) {
      return sendJson(res, 400, {error: "Invalid order access link."});
    }
    const orders = await serviceRequest(
      `commerce_orders?public_reference=eq.${encodeURIComponent(reference)}&access_token_hash=eq.${encodeURIComponent(sha256(key))}&select=id,public_reference,offer_id,quantity,unit_amount_minor,amount_minor,currency,status,buyer_email,buyer_name,paid_at,fulfilled_at,created_at`,
    );
    const order = orders?.[0];
    if (!order) return sendJson(res, 404, {error: "Order not found or access link is invalid."});
    const offers = await serviceRequest(
      `commerce_offers?id=eq.${encodeURIComponent(order.offer_id)}&select=id,offer_type,name,description,metadata`,
    );
    const offer = offers?.[0] || null;
    const credentials = ['paid','fulfilled'].includes(order.status)
      ? await serviceRequest(`commerce_access_credentials?order_id=eq.${encodeURIComponent(order.id)}&select=credential_type,credential_index,status,expires_at,redeemed_at&order=credential_index.asc`)
      : [];
    const safeCredentials = (credentials || []).map((credential) => ({
      type: credential.credential_type,
      index: Number(credential.credential_index),
      status: credential.status,
      expiresAt: credential.expires_at,
      redeemedAt: credential.redeemed_at,
      token: credential.status === 'active'
        ? commerceCredentialToken(order.id, credential.credential_type, Number(credential.credential_index))
        : null,
    }));
    return sendJson(res, 200, {
      order: {
        reference: order.public_reference,
        quantity: order.quantity,
        unitAmountMinor: order.unit_amount_minor,
        amountMinor: order.amount_minor,
        currency: order.currency,
        status: order.status,
        buyerEmail: order.buyer_email,
        buyerName: order.buyer_name,
        paidAt: order.paid_at,
        fulfilledAt: order.fulfilled_at,
        createdAt: order.created_at,
      },
      offer: offer ? {
        type: offer.offer_type,
        name: offer.name,
        description: offer.description,
        instructions: offer.metadata?.buyer_instructions || null,
      } : null,
      credentials: safeCredentials,
    });
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
