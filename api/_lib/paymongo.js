import crypto from "node:crypto";

const PAYMONGO_API = "https://api.paymongo.com";

function secretKey() {
  const key = String(process.env.PAYMONGO_SECRET_KEY || "").trim();
  if (!/^sk_(test|live)_/.test(key)) throw new Error("PayMongo checkout is not configured.");
  return key;
}

function authHeader() {
  return `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`;
}

export function paymentMethods() {
  const allowed = new Set(["card", "gcash", "qrph"]);
  const configured = String(process.env.PAYMONGO_PAYMENT_METHODS || "card,gcash,qrph")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => allowed.has(value));
  return configured.length ? configured : ["qrph"];
}

export async function createCheckoutSession(attributes) {
  const response = await fetch(`${PAYMONGO_API}/v2/checkout_sessions`, {
    method: "POST",
    headers: {Authorization: authHeader(), "Content-Type": "application/json", Accept: "application/json"},
    body: JSON.stringify({data: {attributes}}),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.errors?.[0]?.detail || payload?.error?.message || `PayMongo checkout failed (${response.status}).`;
    throw new Error(detail);
  }
  const checkout = payload?.data;
  if (!checkout?.id || !checkout?.attributes?.checkout_url) throw new Error("PayMongo did not return a checkout URL.");
  return checkout;
}

export function verifyPayMongoSignature(rawBody, signatureHeader) {
  const secret = String(process.env.PAYMONGO_WEBHOOK_SECRET || "").trim();
  if (!secret) throw new Error("PayMongo webhook verification is not configured.");
  const parts = Object.fromEntries(String(signatureHeader || "").split(",").map((pair) => {
    const index = pair.indexOf("=");
    return index > 0 ? [pair.slice(0, index).trim(), pair.slice(index + 1).trim()] : [pair.trim(), ""];
  }));
  if (!parts.t || (!parts.te && !parts.li)) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  return [parts.te, parts.li].filter(Boolean).some((candidate) => {
    if (candidate.length !== expected.length) return false;
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
  });
}

export async function readRawBody(req, maxBytes = 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error("Webhook payload is too large.");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function checkoutPaidEvent(payload) {
  const modern = payload?.data;
  if (modern?.type === "checkout_session.payment.paid" && modern?.data?.id) {
    return {session: modern.data, livemode: Boolean(modern.livemode)};
  }
  const legacy = payload?.data?.attributes;
  if (legacy?.type === "checkout_session.payment.paid" && legacy?.data?.id) {
    return {session: legacy.data, livemode: Boolean(legacy.livemode)};
  }
  return null;
}
