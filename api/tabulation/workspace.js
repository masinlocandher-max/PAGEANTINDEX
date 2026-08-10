import {requireUser,sendJson,serviceRequest} from "../_lib/server.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req,res){
  if(req.method!=="GET") return sendJson(res,405,{error:"Method not allowed."});
  const user=await requireUser(req,res); if(!user)return;
  try{
    const isAdmin=user?.app_metadata?.role==="admin";
    const requested=String(req.query?.event||"");
    if(requested&&!UUID.test(requested)) return sendJson(res,400,{error:"Invalid tabulation event."});
    const editionFilter=isAdmin?"":`organizer_user_id=eq.${encodeURIComponent(user.id)}&`;
    const editions=await serviceRequest(`pageant_edition_drafts?${editionFilter}select=id,organization_name,pageant_name,edition_name,edition_year,event_start_at,venue,submission_state,review_state,published_at&order=edition_year.desc,created_at.desc&limit=100`);
    const eventFilter=requested?`id=eq.${encodeURIComponent(requested)}&`:isAdmin?"":`organizer_user_id=eq.${encodeURIComponent(user.id)}&`;
    const events=await serviceRequest(`tabulation_events?${eventFilter}select=id,edition_id,organizer_user_id,title,status,scoring_precision,locked_at,live_at,finalized_at,created_at,updated_at&order=created_at.desc&limit=${requested?1:100}`);
    const detail=[];
    for(const event of events||[]){
      if(!isAdmin&&event.organizer_user_id!==user.id) continue;
      const segments=await serviceRequest(`tabulation_segments?tabulation_event_id=eq.${encodeURIComponent(event.id)}&select=id,name,display_order,weight&order=display_order.asc`);
      const segmentIds=(segments||[]).map((row)=>row.id);
      const criteria=segmentIds.length?await serviceRequest(`tabulation_criteria?segment_id=in.(${segmentIds.join(',')})&select=id,segment_id,name,max_score,weight,display_order&order=display_order.asc`):[];
      const judges=await serviceRequest(`judge_assignments?tabulation_event_id=eq.${encodeURIComponent(event.id)}&select=id,judge_display_name,judge_email,status,accepted_at,expires_at&order=created_at.asc`);
      const roster=await serviceRequest(`pageant_candidate_roster_drafts?edition_id=eq.${encodeURIComponent(event.edition_id)}&status=in.(confirmed,completed)&select=id,candidate_display_name,representation,candidate_number,status&order=candidate_number.asc.nullslast,candidate_display_name.asc`);
      const totals=await serviceRequest(`tabulation_score_totals?tabulation_event_id=eq.${encodeURIComponent(event.id)}&select=roster_id,weighted_score,score_count,current_rank`);
      const results=await serviceRequest(`tabulation_results?tabulation_event_id=eq.${encodeURIComponent(event.id)}&select=roster_id,final_score,final_rank,status,published_at`);
      detail.push({...event,segments:segments||[],criteria:criteria||[],judges:judges||[],roster:roster||[],totals:totals||[],results:results||[]});
    }
    return sendJson(res,200,{editions:editions||[],events:detail});
  }catch(error){return sendJson(res,503,{error:error.message});}
}
