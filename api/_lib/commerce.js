import crypto from "node:crypto";
import {sha256} from "./server.js";

function credentialSecret() {
  const secret = String(process.env.COMMERCE_TOKEN_SECRET || process.env.INTEGRATION_ENCRYPTION_KEY || "");
  if (secret.length < 24) throw new Error("Commerce credential signing is not configured.");
  return secret;
}

export function commerceCredentialToken(orderId, credentialType, index) {
  const digest = crypto.createHmac("sha256", credentialSecret()).update(`${orderId}|${credentialType}|${index}`).digest("base64url");
  const prefix = credentialType === "ticket" ? "PI-TKT" : credentialType === "ppv_access" ? "PI-PPV" : "PI-DL";
  return `${prefix}-${index}-${digest}`;
}

export function commerceCredentialHash(orderId, credentialType, index) {
  return sha256(commerceCredentialToken(orderId, credentialType, index));
}
