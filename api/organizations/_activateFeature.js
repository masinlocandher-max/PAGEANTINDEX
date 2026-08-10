import {authenticatedUser, cleanText, sendJson, serviceRequest} from "../_lib/server.js";

const FEATURES = new Set(["voting", "tabulation"]);
const SUBJECTS = new Set(["organization", "organizer"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await authenticatedUser(req);
  if (!user || user.app_metadata?.role !== "admin") return sendJson(res, 403, {error: "Founder access required."});
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const subjectType = String(body.subjectType || "");
    const subjectId = String(body.subjectId || "");
    const feature = String(body.feature || "");
    const paymentStatus = String(body.paymentStatus || "paid");
    const feeAmountMinor = Number(body.feeAmountMinor);
    if (!SUBJECTS.has(subjectType) || !subjectId || !FEATURES.has(feature)) return sendJson(res, 400, {error: "Choose a valid subject and paid feature."});
    if (!Number.isInteger(feeAmountMinor) || feeAmountMinor < 0) return sendJson(res, 400, {error: "Enter a valid activation fee."});
    if (!["paid", "waived"].includes(paymentStatus)) return sendJson(res, 400, {error: "Activation requires confirmed payment or an explicit founder waiver."});
    const filter = subjectType === "organization" ? `organization_id=eq.${encodeURIComponent(subjectId)}` : `organizer_user_id=eq.${encodeURIComponent(subjectId)}`;
    const rows = await serviceRequest(`paid_feature_entitlements?${filter}&feature=eq.${encodeURIComponent(feature)}`, {
      method: "PATCH",
      headers: {Prefer: "return=representation"},
      body: JSON.stringify({status: "active", fee_amount_minor: feeAmountMinor, currency: cleanText(body.currency, 3).toUpperCase() || "PHP", payment_status: paymentStatus, commercial_reference: cleanText(body.commercialReference, 180) || null, activated_by_user_id: user.id, activated_at: new Date().toISOString(), expires_at: body.expiresAt || null}),
    });
    if (!rows?.length) return sendJson(res, 404, {error: "Paid feature entitlement was not found."});
    return sendJson(res, 200, {activated: true, entitlement: rows[0]});
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
