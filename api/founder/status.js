import {getIntegration, requireFounder, sendJson} from "../_lib/founder.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireFounder(req, res);
  if (!user) return;

  try {
    let gmail = null;
    try {
      gmail = await getIntegration(user.id, "google_gmail");
    } catch (error) {
      gmail = {status: "storage_unavailable", error: error.message};
    }

    const gatewayConnected = Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
    const openaiConnected = Boolean(process.env.OPENAI_API_KEY);

    return sendJson(res, 200, {
      openai: {
        connected: gatewayConnected || openaiConnected,
        model: gatewayConnected
          ? (process.env.FOUNDER_AI_MODEL || "openai/gpt-5.4")
          : (process.env.OPENAI_MODEL || "gpt-5-mini"),
        provider: gatewayConnected ? "vercel-ai-gateway" : (openaiConnected ? "openai" : null),
      },
      gmail: {
        connected: gmail?.status === "connected",
        accountEmail: gmail?.account_email || null,
        status: gmail?.status || "not_connected",
      },
    });
  } catch (error) {
    return sendJson(res, 500, {error: error.message});
  }
}
