import {requireUser, sendJson, serviceRequest} from "../_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await requireUser(req, res);
  if (!user) return;
  try {
    const requested = String(req.query?.organization || "");
    const memberFilter = requested ? `organization_id=eq.${encodeURIComponent(requested)}&` : "";
    const memberships = await serviceRequest(`organization_admin_memberships?${memberFilter}user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&select=id,organization_id,user_id,admin_sequence,membership_role,organization_verification_state,organization_verified_at,created_at&order=admin_sequence.asc&limit=20`);
    if (!memberships?.length) return sendJson(res, 403, {error: "You are not an active administrator of this organization."});
    const membership = memberships[0];
    const organizations = await serviceRequest(`pageant_organizations?id=eq.${encodeURIComponent(membership.organization_id)}&select=id,slug,organization_name,organization_type,official_url,public_email,bio,country_code,country_name,city,region,status,primary_admin_user_id,claimed_at,published_at,created_at&limit=1`);
    const organization = organizations?.[0];
    if (!organization) return sendJson(res, 404, {error: "Organization record not found."});
    const [admins, features, editions] = await Promise.all([
      serviceRequest(`organization_admin_memberships?organization_id=eq.${encodeURIComponent(organization.id)}&status=eq.active&select=user_id,admin_sequence,membership_role,organization_verification_state,organization_verified_at,created_at&order=admin_sequence.asc`),
      serviceRequest(`paid_feature_entitlements?organization_id=eq.${encodeURIComponent(organization.id)}&select=feature,status,fee_amount_minor,currency,payment_status,commercial_reference,activated_at,expires_at&order=feature.asc`),
      serviceRequest(`pageant_edition_drafts?organization_id=eq.${encodeURIComponent(organization.id)}&select=id,pageant_name,edition_name,edition_year,review_state,submission_state,published_at,event_start_at&order=edition_year.desc.nullslast,created_at.desc&limit=50`),
    ]);
    return sendJson(res, 200, {organization, membership, admins: admins || [], features: features || [], editions: editions || []});
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
