import {sendJson,serviceRequest} from "../_lib/server.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req,res){
  if(req.method!=="GET") return sendJson(res,405,{error:"Method not allowed."});
  try{
    const requested=String(req.query?.edition||"");
    if(requested&&!UUID.test(requested)) return sendJson(res,400,{error:"Invalid pageant edition."});
    const filter=requested?`id=eq.${encodeURIComponent(requested)}&`:"";
    const editions=await serviceRequest(`pageant_edition_drafts?${filter}review_state=eq.approved&published_at=not.is.null&select=id,organization_name,pageant_name,edition_name,edition_year,event_start_at,event_end_at,country_name,city,venue,official_url,rules_url,description&order=event_start_at.desc.nullslast,edition_year.desc&limit=${requested?1:30}`);
    const output=[];
    for(const edition of editions||[]){
      const roster=await serviceRequest(`pageant_candidate_roster_drafts?edition_id=eq.${encodeURIComponent(edition.id)}&is_public=eq.true&status=in.(confirmed,completed)&select=id,candidate_display_name,representation,candidate_number,title_or_placement,status&order=candidate_number.asc.nullslast,candidate_display_name.asc`);
      const voting=await serviceRequest(`voting_events?edition_id=eq.${encodeURIComponent(edition.id)}&review_state=eq.approved&published_at=not.is.null&status=in.(scheduled,open,closed,finalized)&select=id,title,status,starts_at,ends_at`);
      const offers=await serviceRequest(`commerce_offers?edition_id=eq.${encodeURIComponent(edition.id)}&review_state=eq.approved&published_at=not.is.null&status=in.(scheduled,active,sold_out,closed)&select=id,offer_type,name,status,price_minor,currency`);
      const tabulations=await serviceRequest(`tabulation_events?edition_id=eq.${encodeURIComponent(edition.id)}&status=eq.finalized&select=id,title,finalized_at`);
      const tabulationIds=(tabulations||[]).map((row)=>row.id);
      const results=tabulationIds.length?await serviceRequest(`tabulation_results?tabulation_event_id=in.(${tabulationIds.join(',')})&status=eq.final&published_at=not.is.null&select=tabulation_event_id,roster_id,final_score,final_rank,published_at&order=final_rank.asc`):[];
      const credits=await serviceRequest(`professional_credits?edition_id=eq.${encodeURIComponent(edition.id)}&status=eq.confirmed&select=id,candidate_roster_id,supplier_user_id,role,credit_scope,confirmed_at`);
      const supplierIds=[...new Set((credits||[]).map((row)=>row.supplier_user_id))];
      const suppliers=supplierIds.length?await serviceRequest(`professional_profile_drafts?user_id=in.(${supplierIds.join(',')})&review_state=eq.approved&select=user_id,business_name,primary_category,category,country_name,city,official_link`):[];
      const supplierById=new Map((suppliers||[]).map((row)=>[row.user_id,row]));
      output.push({
        edition,
        roster:roster||[],
        voting:voting||[],
        offers:(offers||[]).map((offer)=>({...offer,price_minor:Number(offer.price_minor)})),
        tabulations:tabulations||[],
        results:(results||[]).map((result)=>({...result,final_score:Number(result.final_score)})),
        credits:(credits||[]).map((credit)=>{const supplier=supplierById.get(credit.supplier_user_id);return supplier?{id:credit.id,candidateRosterId:credit.candidate_roster_id,role:credit.role,scope:credit.credit_scope,confirmedAt:credit.confirmed_at,supplier:{businessName:supplier.business_name,category:supplier.primary_category||supplier.category,countryName:supplier.country_name,city:supplier.city,officialLink:supplier.official_link}}:null;}).filter(Boolean),
      });
    }
    return sendJson(res,200,{events:output});
  }catch(error){return sendJson(res,503,{error:error.message});}
}
