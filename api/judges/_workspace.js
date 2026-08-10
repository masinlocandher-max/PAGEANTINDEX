import {requireUser,sendJson,serviceRequest} from "../_lib/server.js";

export default async function handler(req,res){
  if(req.method!=="GET") return sendJson(res,405,{error:"Method not allowed."});
  const user=await requireUser(req,res); if(!user) return;
  try{
    const assignments=await serviceRequest(`judge_assignments?judge_user_id=eq.${encodeURIComponent(user.id)}&status=in.(accepted,active,completed)&select=id,tabulation_event_id,judge_display_name,status,accepted_at&order=created_at.desc`);
    const output=[];
    for(const assignment of assignments||[]){
      const events=await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(assignment.tabulation_event_id)}&select=id,edition_id,title,status,scoring_precision,locked_at,live_at,finalized_at`);
      const event=events?.[0]; if(!event) continue;
      const editions=await serviceRequest(`pageant_edition_drafts?id=eq.${encodeURIComponent(event.edition_id)}&select=id,organization_name,pageant_name,edition_name,edition_year,event_start_at,venue`);
      const edition=editions?.[0]||null;
      const segments=await serviceRequest(`tabulation_segments?tabulation_event_id=eq.${encodeURIComponent(event.id)}&select=id,name,display_order,weight&order=display_order.asc`);
      const segmentIds=(segments||[]).map((row)=>row.id);
      const criteria=segmentIds.length?await serviceRequest(`tabulation_criteria?segment_id=in.(${segmentIds.join(',')})&select=id,segment_id,name,max_score,weight,display_order&order=display_order.asc`):[];
      const roster=await serviceRequest(`pageant_candidate_roster_drafts?edition_id=eq.${encodeURIComponent(event.edition_id)}&status=in.(confirmed,completed)&select=id,candidate_display_name,representation,candidate_number&order=candidate_number.asc.nullslast,candidate_display_name.asc`);
      const scores=await serviceRequest(`judge_scores?judge_assignment_id=eq.${encodeURIComponent(assignment.id)}&select=id,criterion_id,roster_id,score,note,submitted_at,updated_at`);
      output.push({assignment,event,edition,segments:segments||[],criteria:criteria||[],roster:roster||[],scores:scores||[]});
    }
    return sendJson(res,200,{assignments:output});
  }catch(error){return sendJson(res,503,{error:error.message});}
}
