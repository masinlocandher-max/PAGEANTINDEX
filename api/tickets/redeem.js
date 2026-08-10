import {requireUser,sendJson,serviceRequest,sha256} from "../_lib/server.js";

export default async function handler(req,res){
  if(req.method!=="POST") return sendJson(res,405,{error:"Method not allowed."});
  const user=await requireUser(req,res);if(!user)return;
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body||"{}"):req.body||{};
    const token=String(body.token||"").trim();
    if(!/^PI-TKT-\d+-[A-Za-z0-9_-]{30,}$/.test(token)) return sendJson(res,400,{error:"Invalid PageantIndex ticket credential."});
    const credentials=await serviceRequest(`commerce_access_credentials?token_hash=eq.${encodeURIComponent(sha256(token))}&credential_type=eq.ticket&select=id,order_id,offer_id,credential_index,status,redeemed_at`);
    const credential=credentials?.[0];
    if(!credential)return sendJson(res,404,{error:"Ticket credential not found."});
    const offers=await serviceRequest(`commerce_offers?id=eq.${encodeURIComponent(credential.offer_id)}&select=id,organizer_user_id,name,edition_id`);
    const offer=offers?.[0];
    if(!offer)return sendJson(res,404,{error:"Ticket offer not found."});
    if(offer.organizer_user_id!==user.id&&user?.app_metadata?.role!=="admin") return sendJson(res,403,{error:"Only the organizer for this ticket offer can redeem the credential."});
    const orders=await serviceRequest(`commerce_orders?id=eq.${encodeURIComponent(credential.order_id)}&select=public_reference,status,quantity`);
    const order=orders?.[0];
    if(!order||!['paid','fulfilled'].includes(order.status)) return sendJson(res,409,{error:"The ticket order is not in a valid paid state."});
    if(credential.status==="redeemed") return sendJson(res,200,{valid:true,alreadyRedeemed:true,redeemedAt:credential.redeemed_at,offerName:offer.name,orderReference:order.public_reference,ticketNumber:credential.credential_index});
    if(credential.status!=="active") return sendJson(res,409,{error:`Ticket is ${credential.status}.`});
    const now=new Date().toISOString();
    await serviceRequest(`commerce_access_credentials?id=eq.${encodeURIComponent(credential.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"redeemed",redeemed_at:now,redeemed_by_user_id:user.id})});
    return sendJson(res,200,{valid:true,redeemed:true,redeemedAt:now,offerName:offer.name,orderReference:order.public_reference,ticketNumber:credential.credential_index});
  }catch(error){return sendJson(res,error instanceof SyntaxError?400:503,{error:error instanceof SyntaxError?"Invalid request.":error.message});}
}
