import {requireUser, sendJson, serviceRequest} from "../_lib/server.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function assignment(userId,eventId){
  const rows=await serviceRequest(`judge_assignments?tabulation_event_id=eq.${encodeURIComponent(eventId)}&judge_user_id=eq.${encodeURIComponent(userId)}&status=in.(accepted,active,completed)&select=id,judge_display_name,status,accepted_at&limit=1`);
  return rows?.[0]||null;
}

export default async function handler(req,res){
  const user=await requireUser(req,res); if(!user)return;
  try{
    if(req.method==="GET"){
      const eventId=String(req.query?.event||"");
      if(!eventId){
        const assignments=await serviceRequest(`judge_assignments?judge_user_id=eq.${encodeURIComponent(user.id)}&status=in.(accepted,active,completed)&select=id,tabulation_event_id,judge_display_name,status,accepted_at&order=created_at.desc&limit=40`);
        return sendJson(res,200,{assignments:assignments||[]});
      }
      if(!UUID.test(eventId))return sendJson(res,400,{error:"Invalid tabulation event."});
      const mine=await assignment(user.id,eventId); if(!mine)return sendJson(res,403,{error:"You are not an active judge for this event."});
      const events=await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(eventId)}&select=id,edition_id,title,status,scoring_precision,live_at,finalized_at`);
      const event=events?.[0]; if(!event)return sendJson(res,404,{error:"Tabulation event not found."});
      const segments=await serviceRequest(`tabulation_segments?tabulation_event_id=eq.${encodeURIComponent(eventId)}&select=id,name,display_order,weight&order=display_order.asc`);
      const segmentIds=(segments||[]).map(x=>x.id);
      const criteria=segmentIds.length?await serviceRequest(`tabulation_criteria?segment_id=in.(${segmentIds.join(',')})&select=id,segment_id,name,max_score,weight,display_order&order=display_order.asc`):[];
      const candidates=await serviceRequest(`pageant_candidate_roster_drafts?edition_id=eq.${encodeURIComponent(event.edition_id)}&status=in.(confirmed,completed)&select=id,candidate_display_name,representation,candidate_number&order=candidate_number.asc`);
      const scores=await serviceRequest(`judge_scores?judge_assignment_id=eq.${encodeURIComponent(mine.id)}&select=criterion_id,roster_id,score,note,updated_at`);
      return sendJson(res,200,{event,assignment:mine,segments:segments||[],criteria:criteria||[],candidates:candidates||[],scores:scores||[]});
    }
    if(req.method!=="POST")return sendJson(res,405,{error:"Method not allowed."});
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):req.body||{};
    const eventId=String(body.tabulationEventId||""),criterionId=String(body.criterionId||""),rosterId=String(body.rosterId||"");
    if(![eventId,criterionId,rosterId].every(UUID.test))return sendJson(res,400,{error:"Invalid score references."});
    const mine=await assignment(user.id,eventId); if(!mine)return sendJson(res,403,{error:"You are not an active judge for this event."});
    if(mine.status==="completed")return sendJson(res,409,{error:"Your scoring submission is locked."});
    const events=await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(eventId)}&select=id,edition_id,status`); const event=events?.[0];
    if(!event||!["rehearsal","live"].includes(event.status))return sendJson(res,409,{error:"This event is not accepting scores."});
    const segments=await serviceRequest(`tabulation_segments?tabulation_event_id=eq.${encodeURIComponent(eventId)}&select=id`); const segmentIds=(segments||[]).map(x=>x.id);
    const criteria=segmentIds.length?await serviceRequest(`tabulation_criteria?segment_id=in.(${segmentIds.join(',')})&id=eq.${encodeURIComponent(criterionId)}&select=id,max_score`):[];
    const max=Number(criteria?.[0]?.max_score); const score=Number(body.score);
    const roster=await serviceRequest(`pageant_candidate_roster_drafts?id=eq.${encodeURIComponent(rosterId)}&edition_id=eq.${encodeURIComponent(event.edition_id)}&status=in.(confirmed,completed)&select=id`);
    if(!Number.isFinite(max)||!roster?.length||!Number.isFinite(score)||score<0||score>max)return sendJson(res,400,{error:"Score is outside the allowed range."});
    await serviceRequest("judge_scores?on_conflict=judge_assignment_id,criterion_id,roster_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({tabulation_event_id:eventId,judge_assignment_id:mine.id,criterion_id:criterionId,roster_id:rosterId,score,note:String(body.note||"").trim().slice(0,1000)||null})});
    if(mine.status==="accepted")await serviceRequest(`judge_assignments?id=eq.${encodeURIComponent(mine.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"active"})});
    return sendJson(res,200,{saved:true});
  }catch(error){return sendJson(res,error instanceof SyntaxError?400:503,{error:error instanceof SyntaxError?"Invalid request.":error.message});}
}
