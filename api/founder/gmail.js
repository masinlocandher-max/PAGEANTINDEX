import {
  decryptSecret,
  getIntegration,
  refreshGoogleAccessToken,
  requireFounder,
  sendJson,
} from "../_lib/founder.js";

function headerValue(headers, name) {
  return headers?.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value || "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireFounder(req, res);
  if (!user) return;

  try {
    const integration = await getIntegration(user.id, "google_gmail");
    if (!integration || integration.status !== "connected") {
      return sendJson(res, 409, {error: "Gmail is not connected yet."});
    }

    const refreshToken = decryptSecret(integration.encrypted_refresh_token, integration.token_iv);
    const accessToken = await refreshGoogleAccessToken(refreshToken, req);
    const query = new URLSearchParams({maxResults: "12", q: "newer_than:14d -category:promotions"});
    const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${query}`, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
    const list = await listResponse.json();
    if (!listResponse.ok) throw new Error(list.error?.message || "Could not read Gmail inbox.");

    const messages = await Promise.all((list.messages || []).slice(0, 12).map(async ({id, threadId}) => {
      const metadata = new URLSearchParams({format: "metadata"});
      ["From", "Subject", "Date"].forEach((header) => metadata.append("metadataHeaders", header));
      const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?${metadata}`, {
        headers: {Authorization: `Bearer ${accessToken}`},
      });
      const message = await response.json();
      if (!response.ok) return null;
      return {
        id,
        threadId,
        from: headerValue(message.payload?.headers, "From"),
        subject: headerValue(message.payload?.headers, "Subject") || "(No subject)",
        date: headerValue(message.payload?.headers, "Date"),
        snippet: message.snippet || "",
        unread: Array.isArray(message.labelIds) && message.labelIds.includes("UNREAD"),
      };
    }));

    return sendJson(res, 200, {
      accountEmail: integration.account_email,
      messages: messages.filter(Boolean),
    });
  } catch (error) {
    return sendJson(res, 500, {error: error.message});
  }
}
