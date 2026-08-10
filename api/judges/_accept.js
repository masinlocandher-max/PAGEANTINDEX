import {requireUser, sendJson, serviceRequest, sha256} from "../_lib/server.js";

export default async function handler(req,res){
  if(req.method!=="POST") return sendJson(res,405,{error:"Method not allowed."});
  const user=await requireUser(req,res); if(!user) return;
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):req.body||{};
    const token=String(body.token||"").trim();
    if(token.length<20||token.length>200) return sendJson(res,400,{error:"Invalid judge invitation."});
    const rows=await serviceRequest(`judge_assignments?access_token_hash=eq.${encodeURIComponent(sha256(token))}&select=id,status,expires_at,judge_user_id,judge_email`);
    const assignment=rows?.[0];
    if(!assignment) return sendJson(res,404,{error:"Judge invitation not found."});
    if(assignment.status==="accepted"&&assignment.judge_user_id===user.id) return sendJson(res,200,{accepted:true,alreadyAccepted:true});
    if(assignment.status!=="invited") return sendJson(res,409,{error:"This judge invitation is no longer active."});
    if(assignment.expires_at&&new Date(assignment.expires_at).getTime()<=Date.now()){
      await serviceRequest(`judge_assignments?id=eq.${encodeURIComponent(assignment.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"revoked"})});
      return sendJson(res,410,{error:"This judge invitation has expired."});
    }
    if(assignment.judge_email&&user.email&&assignment.judge_email.toLowerCase()!==user.email.toLowerCase()) return sendJson(res,403,{error:"Sign in with the email address that received this judge invitation."});
    await serviceRequest(`judge_assignments?id=eq.${encodeURIComponent(assignment.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({judge_user_id:user.id,status:"accepted",accepted_at:new Date().toISOString()})});
    return sendJson(res,200,{accepted:true,assignmentId:assignment.id});
  }catch(error){return sendJson(res,error instanceof SyntaxError?400:503,{error:error instanceof SyntaxError?"Invalid request.":error.message});}
}
