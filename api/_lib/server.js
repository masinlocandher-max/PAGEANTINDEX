import crypto from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://uwcqvsitjtknxsaypjxj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

export function requireServiceRole() {
  if (!SERVICE_ROLE_KEY) throw new Error("Server data access is not configured.");
  return SERVICE_ROLE_KEY;
}

export async function serviceRequest(pathname, options = {}) {
  const serviceKey = requireServiceRole();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    ...options,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = {message: text}; }
  }
  if (!response.ok) throw new Error(payload?.message || payload?.hint || `Data request failed (${response.status}).`);
  return payload;
}

export async function authenticatedUser(req) {
  const auth = String(req.headers.authorization || "");
  if (!auth.startsWith("Bearer ")) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: auth},
  });
  if (!response.ok) return null;
  return response.json();
}

export async function requireUser(req, res) {
  const user = await authenticatedUser(req);
  if (!user) {
    sendJson(res, 401, {error: "PageantIndex sign-in required."});
    return null;
  }
  return user;
}

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function requestIdentityHash(req, eventId) {
  const secret = process.env.VOTE_HASH_SECRET || process.env.INTEGRATION_ENCRYPTION_KEY || "";
  if (secret.length < 24) throw new Error("Vote anti-abuse secret is not configured.");
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = forwarded || String(req.socket?.remoteAddress || "unknown");
  const agent = String(req.headers["user-agent"] || "unknown").slice(0, 240);
  return crypto.createHmac("sha256", secret).update(`${eventId}|${ip}|${agent}`).digest("hex");
}

export function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

export function isHttpsUrl(value) {
  try { return new URL(String(value)).protocol === "https:"; } catch { return false; }
}
