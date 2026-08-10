import {requireUser,sendJson,serviceRequest} from "../_lib/server.js";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(req,res){
  if(req.method!=="POST") return sendJson(res,405,{error:"Method not allowed."});
  const user=await requireUser(req,res); if(!user) return;
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):req.body||{};
    const assignmentId=String(body.assignmentId||"");
    const scoreRows=Array.isArray(body.scores)?body.scores:[];
    if(!UUID.test(assignmentId)||!scoreRows.length||scoreRows.length>1000) return sendJson(res,400,{error:"Invalid score submission."});
    const assignments=await serviceRequest(`judge_assignments?id=eq.${encodeURIComponent(assignmentId)}&judge_user_id=eq.${encodeURIComponent(user.id)}&status=in.(accepted,active)&select=id,tabulation_event_id`);
    const assignment=assignments?.[0];
    if(!assignment) return sendJson(res,403,{error:"This judge assignment is not active for your account."});
    const events=await serviceRequest(`tabulation_events?id=eq.${encodeURIComponent(assignment.tabulation_event_id)}&select=id,status`);
    const event=events?.[0];
    if(!event||!['rehearsal','live'].includes(event.status)) return sendJson(res,409,{error:"Scoring is not open for this tabulation event."});
    const rows=scoreRows.map((row)=>({
      tabulation_event_id:event.id,
      judge_assignment_id:assignment.id,
      criterion_id:String(row.criterionId||""),
      roster_id:String(row.rosterId||""),
      score:Number(row.score),
      note:String(row.note||"").trim().slice(0,1000)||null,
    }));
    if(rows.some((row)=>!UUID.test(row.criterion_id)||!UUID.test(row.roster_id)||!Number.isFinite(row.score)||row.score<0)) return sendJson(res,400,{error:"One or more scores are invalid."});
    await serviceRequest("judge_scores?on_conflict=judge_assignment_id,criterion_id,roster_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)});
    if(assignment.status==="accepted") await serviceRequest(`judge_assignments?id=eq.${encodeURIComponent(assignment.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"active"})});
    return sendJson(res,200,{saved:true,count:rows.length,savedAt:new Date().toISOString()});
  }catch(error){return sendJson(res,error instanceof SyntaxError?400:503,{error:error instanceof SyntaxError?"Invalid request.":error.message});}
}
