import {cleanText,requireUser,sendJson,serviceRequest} from "../_lib/server.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function ownedEvent(id,user){
  const rows=await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(id)}&select=id,edition_id,organizer_user_id,title,status`);
  const event=rows?.[0];
  if(!event) throw new Error("Tabulation event not found.");
  if(event.organizer_user_id!==user.id&&user?.app_metadata?.role!=="admin") throw new Error("You do not control this tabulation event.");
  return event;
}

export default async function handler(req,res){
  if(req.method!=="POST") return sendJson(res,405,{error:"Method not allowed."});
  const user=await requireUser(req,res); if(!user)return;
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):req.body||{};
    const action=String(body.action||"");
    if(action==="create_event"){
      const editionId=String(body.editionId||""); const title=cleanText(body.title,180);
      if(!UUID.test(editionId)||title.length<2) return sendJson(res,400,{error:"Choose an edition and title."});
      const editions=await serviceRequest(`pageant_edition_drafts?id=eq.${encodeURIComponent(editionId)}&select=id,organizer_user_id`);
      const edition=editions?.[0];
      if(!edition||(edition.organizer_user_id!==user.id&&user?.app_metadata?.role!=="admin")) return sendJson(res,403,{error:"You do not control this pageant edition."});
      const rows=await serviceRequest("tabulation_events",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({edition_id:editionId,organizer_user_id:edition.organizer_user_id,title,status:"draft",scoring_precision:2})});
      return sendJson(res,201,{created:true,eventId:rows?.[0]?.id||null});
    }

    const eventId=String(body.eventId||""); if(!UUID.test(eventId)) return sendJson(res,400,{error:"Invalid tabulation event."});
    const event=await ownedEvent(eventId,user);
    if(action==="add_segment"){
      if(!['draft','rehearsal'].includes(event.status)) return sendJson(res,409,{error:"Scoring structure is locked."});
      const name=cleanText(body.name,160); const weight=Number(body.weight??1); const displayOrder=Number.parseInt(body.displayOrder??"0",10)||0;
      if(name.length<2||!Number.isFinite(weight)||weight<=0) return sendJson(res,400,{error:"Enter a valid segment name and weight."});
      const rows=await serviceRequest("tabulation_segments",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({tabulation_event_id:eventId,name,weight,display_order:displayOrder})});
      return sendJson(res,201,{created:true,segmentId:rows?.[0]?.id||null});
    }
    if(action==="add_criterion"){
      if(!['draft','rehearsal'].includes(event.status)) return sendJson(res,409,{error:"Scoring structure is locked."});
      const segmentId=String(body.segmentId||""); const name=cleanText(body.name,160); const maxScore=Number(body.maxScore??100); const weight=Number(body.weight??1); const displayOrder=Number.parseInt(body.displayOrder??"0",10)||0;
      if(!UUID.test(segmentId)||name.length<2||!Number.isFinite(maxScore)||maxScore<=0||!Number.isFinite(weight)||weight<=0) return sendJson(res,400,{error:"Enter a valid criterion."});
      const segments=await serviceRequest(`tabulation_segments?id=eq.${encodeURIComponent(segmentId)}&tabulation_event_id=eq.${encodeURIComponent(eventId)}&select=id`);
      if(!segments?.length) return sendJson(res,404,{error:"Segment does not belong to this tabulation event."});
      const rows=await serviceRequest("tabulation_criteria",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({segment_id:segmentId,name,max_score:maxScore,weight,display_order:displayOrder})});
      return sendJson(res,201,{created:true,criterionId:rows?.[0]?.id||null});
    }
    if(action==="set_status"){
      const next=String(body.status||"");
      const transitions={draft:new Set(["rehearsal","canceled"]),rehearsal:new Set(["draft","locked","canceled"]),locked:new Set(["live","rehearsal","canceled"]),live:new Set(["canceled"])};
      if(!transitions[event.status]?.has(next)) return sendJson(res,409,{error:`Cannot move tabulation from ${event.status} to ${next}.`});
      if(next==="locked"||next==="live"){
        const segments=await serviceRequest(`tabulation_segments?tabulation_event_id=eq.${encodeURIComponent(eventId)}&select=id`);
        const segmentIds=(segments||[]).map((row)=>row.id);
        const criteria=segmentIds.length?await serviceRequest(`tabulation_criteria?segment_id=in.(${segmentIds.join(',')})&select=id`):[];
        const judges=await serviceRequest(`judge_assignments?tabulation_event_id=eq.${encodeURIComponent(eventId)}&status=in.(accepted,active,completed)&select=id`);
        const roster=await serviceRequest(`pageant_candidate_roster_drafts?edition_id=eq.${encodeURIComponent(event.edition_id)}&status=in.(confirmed,completed)&select=id`);
        if(!segments?.length||!criteria?.length||!judges?.length||!roster?.length) return sendJson(res,409,{error:"Add scoring segments and criteria, at least one accepted judge, and confirmed candidates before locking or going live."});
      }
      const patch={status:next};
      if(next==="locked") patch.locked_at=new Date().toISOString();
      if(next==="live") patch.live_at=new Date().toISOString();
      await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(eventId)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});
      return sendJson(res,200,{updated:true,status:next});
    }
    return sendJson(res,400,{error:"Unknown tabulation action."});
  }catch(error){
    const status=/do not control|not control/.test(error.message)?403:503;
    return sendJson(res,error instanceof SyntaxError?400:status,{error:error instanceof SyntaxError?"Invalid request.":error.message});
  }
}
