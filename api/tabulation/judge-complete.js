import {requireUser,sendJson,serviceRequest} from "../_lib/server.js";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function handler(req,res){
  if(req.method!=="POST")return sendJson(res,405,{error:"Method not allowed."});
  const user=await requireUser(req,res); if(!user)return;
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):req.body||{}; const eventId=String(body.tabulationEventId||"");
    if(!UUID.test(eventId))return sendJson(res,400,{error:"Invalid tabulation event."});
    const assignments=await serviceRequest(`judge_assignments?tabulation_event_id=eq.${encodeURIComponent(eventId)}&judge_user_id=eq.${encodeURIComponent(user.id)}&status=in.(accepted,active,completed)&select=id,status&limit=1`); const mine=assignments?.[0];
    if(!mine)return sendJson(res,403,{error:"You are not an active judge for this event."}); if(mine.status==="completed")return sendJson(res,200,{complete:true,alreadyComplete:true});
    const events=await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(eventId)}&select=edition_id,status`); const event=events?.[0];
    if(!event||!["rehearsal","live"].includes(event.status))return sendJson(res,409,{error:"This event is not accepting score submissions."});
    const segments=await serviceRequest(`tabulation_segments?tabulation_event_id=eq.${encodeURIComponent(eventId)}&select=id`); const segmentIds=(segments||[]).map(x=>x.id);
    const criteria=segmentIds.length?await serviceRequest(`tabulation_criteria?segment_id=in.(${segmentIds.join(',')})&select=id`):[];
    const roster=await serviceRequest(`pageant_candidate_roster_drafts?edition_id=eq.${encodeURIComponent(event.edition_id)}&status=in.(confirmed,completed)&select=id`);
    const scores=await serviceRequest(`judge_scores?judge_assignment_id=eq.${encodeURIComponent(mine.id)}&select=id`); const expected=(criteria||[]).length*(roster||[]).length;
    if(!expected||(scores||[]).length!==expected)return sendJson(res,409,{error:"Complete every candidate and criterion before locking your submission.",scoreCount:(scores||[]).length,expectedScoreCount:expected});
    await serviceRequest(`judge_assignments?id=eq.${encodeURIComponent(mine.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"completed"})});
    return sendJson(res,200,{complete:true,scoreCount:expected});
  }catch(error){return sendJson(res,error instanceof SyntaxError?400:503,{error:error instanceof SyntaxError?"Invalid request.":error.message});}
}
