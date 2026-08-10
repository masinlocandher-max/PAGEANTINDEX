import {authenticatedUser, sendJson, serviceRequest} from "../_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await authenticatedUser(req);
  if (!user || user.app_metadata?.role !== "admin") return sendJson(res, 403, {error: "Founder access required."});
  try {
    const organizations = await serviceRequest("pageant_organizations?select=id,slug,organization_name,organization_type,status,primary_admin_user_id,claimed_at,published_at,created_at&order=created_at.desc&limit=200");
    const features = await serviceRequest("paid_feature_entitlements?organization_id=not.is.null&select=id,organization_id,feature,status,fee_amount_minor,currency,payment_status,commercial_reference,activated_at,expires_at&order=created_at.desc");
    return sendJson(res, 200, {organizations: organizations || [], features: features || []});
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
