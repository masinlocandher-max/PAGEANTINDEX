import {sendJson, serviceRequest} from "../_lib/server.js";

const TYPES = new Set(["ticket","ppv","merchandise"]);

export default async function handler(req, res) {
  if (req.method !== "GET") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const type = String(req.query?.type || "ticket").toLowerCase();
    if (!TYPES.has(type)) return sendJson(res, 400, {error: "Invalid offer type."});
    const editionId = String(req.query?.edition || "");
    const editionFilter = editionId ? `edition_id=eq.${encodeURIComponent(editionId)}&` : "";
    const offers = await serviceRequest(`commerce_offers?${editionFilter}offer_type=eq.${encodeURIComponent(type)}&review_state=eq.approved&published_at=not.is.null&status=in.(scheduled,active,sold_out,closed)&select=id,edition_id,offer_type,name,description,price_minor,currency,inventory_limit,sale_starts_at,sale_ends_at,status,metadata&order=created_at.desc&limit=50`);
    const result = [];
    for (const offer of offers || []) {
      const editions = await serviceRequest(`pageant_edition_drafts?id=eq.${encodeURIComponent(offer.edition_id)}&review_state=eq.approved&published_at=not.is.null&select=id,organization_name,pageant_name,edition_name,edition_year,venue,event_start_at,event_end_at,country_name,city`);
      const edition = editions?.[0];
      if (!edition) continue;
      const sales = await serviceRequest(`commerce_offer_sales?offer_id=eq.${encodeURIComponent(offer.id)}&select=units_sold`);
      const sold = Number(sales?.[0]?.units_sold || 0);
      const available = offer.inventory_limit === null ? null : Math.max(0, Number(offer.inventory_limit) - sold);
      result.push({
        id: offer.id, type: offer.offer_type, name: offer.name, description: offer.description,
        priceMinor: Number(offer.price_minor), currency: offer.currency, inventoryLimit: offer.inventory_limit,
        unitsAvailable: available, saleStartsAt: offer.sale_starts_at, saleEndsAt: offer.sale_ends_at, status: offer.status,
        metadata: offer.metadata || {},
        edition: {id: edition.id, organizationName: edition.organization_name, pageantName: edition.pageant_name, editionName: edition.edition_name, editionYear: edition.edition_year, venue: edition.venue, eventStartAt: edition.event_start_at, eventEndAt: edition.event_end_at, countryName: edition.country_name, city: edition.city},
      });
    }
    return sendJson(res, 200, {offers: result});
  } catch (error) {
    return sendJson(res, 503, {error: error.message});
  }
}
