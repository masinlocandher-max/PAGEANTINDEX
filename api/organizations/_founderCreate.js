import {authenticatedUser, cleanText, randomToken, sendJson, serviceRequest, sha256} from "../_lib/server.js";

const slugify = (value) => String(value || "").toLowerCase().trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  const user = await authenticatedUser(req);
  if (!user || user.app_metadata?.role !== "admin") return sendJson(res, 403, {error: "Founder access required."});
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const organizationName = cleanText(body.organizationName, 220);
    const claimEmail = cleanText(body.claimEmail, 320).toLowerCase();
    const slug = slugify(body.slug || organizationName);
    if (organizationName.length < 2 || !slug) return sendJson(res, 400, {error: "Enter a valid organization name."});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimEmail)) return sendJson(res, 400, {error: "Enter the initial administrator's email."});

    const rows = await serviceRequest("pageant_organizations", {
      method: "POST",
      headers: {Prefer: "return=representation"},
      body: JSON.stringify({
        organization_name: organizationName,
        slug,
        organization_type: cleanText(body.organizationType, 120) || null,
        official_url: cleanText(body.officialUrl, 500) || null,
        public_email: cleanText(body.publicEmail, 320) || null,
        country_code: cleanText(body.countryCode, 2).toUpperCase() || null,
        country_name: cleanText(body.countryName, 120) || null,
        city: cleanText(body.city, 120) || null,
        region: cleanText(body.region, 120) || null,
        status: "unclaimed",
        created_by_user_id: user.id,
      }),
    });
    const organization = rows?.[0];
    if (!organization?.id) throw new Error("Organization record could not be created.");

    const rawToken = randomToken(36);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await serviceRequest("organization_admin_invites", {
      method: "POST",
      headers: {Prefer: "return=minimal"},
      body: JSON.stringify({
        organization_id: organization.id,
        invite_email: claimEmail,
        invite_kind: "founder_claim",
        token_hash: sha256(rawToken),
        status: "pending",
        expires_at: expiresAt,
        invited_by_user_id: user.id,
      }),
    });

    return sendJson(res, 201, {
      organization: {id: organization.id, name: organization.organization_name, slug: organization.slug, status: organization.status},
      claimUrl: `${String(req.headers["x-forwarded-proto"] || "https")}://${String(req.headers.host || "www.pageantindex.com")}/organization-claim/?token=${encodeURIComponent(rawToken)}`,
      claimEmail,
      expiresAt,
    });
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
