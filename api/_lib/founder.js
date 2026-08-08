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

export async function requireFounder(req, res) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    sendJson(res, 401, {error: "Founder sign-in required."});
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: auth,
    },
  });

  if (!response.ok) {
    sendJson(res, 401, {error: "Your PageantIndex session is no longer valid."});
    return null;
  }

  const user = await response.json();
  if (user?.app_metadata?.role !== "admin") {
    sendJson(res, 403, {error: "Founder dashboard access is restricted."});
    return null;
  }

  return user;
}

function requireServiceRole() {
  if (!SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return SERVICE_ROLE_KEY;
}

async function integrationRequest(pathname, options = {}) {
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
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || `Integration store failed (${response.status}).`);
  }
  return payload;
}

export async function getIntegration(userId, provider) {
  const rows = await integrationRequest(
    `founder_integrations?owner_user_id=eq.${encodeURIComponent(userId)}&provider=eq.${encodeURIComponent(provider)}&select=*`,
  );
  return rows?.[0] || null;
}

export async function upsertIntegration(record) {
  const payload = await integrationRequest("founder_integrations?on_conflict=owner_user_id,provider", {
    method: "POST",
    headers: {Prefer: "resolution=merge-duplicates,return=representation"},
    body: JSON.stringify(record),
  });
  return payload?.[0] || null;
}

function cryptoKey() {
  const secret = process.env.INTEGRATION_ENCRYPTION_KEY || "";
  if (secret.length < 24) throw new Error("INTEGRATION_ENCRYPTION_KEY is not configured securely.");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", cryptoKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, tag]).toString("base64url"),
    iv: iv.toString("base64url"),
  };
}

export function decryptSecret(encrypted, ivValue) {
  const bytes = Buffer.from(encrypted, "base64url");
  const tag = bytes.subarray(bytes.length - 16);
  const ciphertext = bytes.subarray(0, bytes.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", cryptoKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function signOAuthState(userId) {
  const payload = Buffer.from(JSON.stringify({userId, issuedAt: Date.now()})).toString("base64url");
  const signature = crypto.createHmac("sha256", cryptoKey()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state) {
  const [payload, signature] = String(state || "").split(".");
  if (!payload || !signature) throw new Error("Invalid OAuth state.");
  const expected = crypto.createHmac("sha256", cryptoKey()).update(payload).digest();
  const supplied = Buffer.from(signature, "base64url");
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    throw new Error("Invalid OAuth state signature.");
  }
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!decoded.userId || Date.now() - Number(decoded.issuedAt || 0) > 10 * 60 * 1000) {
    throw new Error("OAuth state expired.");
  }
  return decoded;
}

export function googleConfig(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const origin = process.env.PUBLIC_SITE_URL || `https://${req.headers.host || "www.pageantindex.com"}`;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured.");
  return {
    clientId,
    clientSecret,
    redirectUri: `${origin.replace(/\/$/, "")}/api/integrations/google/callback`,
  };
}

export async function refreshGoogleAccessToken(refreshToken, req) {
  const {clientId, clientSecret} = googleConfig(req);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const token = await tokenResponse.json();
  if (!tokenResponse.ok || !token.access_token) {
    throw new Error(token.error_description || token.error || "Could not refresh Gmail access.");
  }
  return token.access_token;
}
