"use strict";

(() => {
  const SESSION_KEY="pi_supabase_session";
  const root=document.getElementById("live-tabulation-app");
  if(!root)return;
  const escapeHtml=(value)=>String(value??"").replace(/[&<>\"]/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  function session(){for(const storage of [sessionStorage,localStorage]){try{const value=JSON.parse(storage.getItem(SESSION_KEY)||"null");if(value?.access_token)return value;}catch{}}return null;}
  async function api(url,options={}){const response=await fetch(url,options);const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Request failed (${response.status}).`);return data;}
  function authHeaders(current,extra={}){return {...extra,Authorization:`Bearer ${current.access_token}`};}
  const card=(body)=>`<article class="pi-policy-card">${body}</article>`;

  function eventDetail(event,editions){
    const edition=editions.find((item)=>item.id===event.edition_id)||{};
    const pageant=[edition.pageant_name,edition.edition_name||edition.edition_year].filter(Boolean).join(" · ");
    const criteriaBySegment=new Map();for(const criterion of event.criteria||[]){const list=criteriaBySegment.get(criterion.segment_id)||[];list.push(criterion);criteriaBySegment.set(criterion.segment_id,list);}
    const totals=new Map((event.totals||[]).map((row)=>[row.roster_id,row]));
    const canEdit=['draft','rehearsal'].includes(event.status);
    const statusActions={draft:["rehearsal","canceled"],rehearsal:["draft","locked","canceled"],locked:["rehearsal","live","canceled"],live:["canceled"]}[event.status]||[];
    return `<section data-event-panel="${event.id}" hidden>
      ${card(`<p class="pi-policy-kicker">${escapeHtml(pageant||"Tabulation event")}</p><h2>${escapeHtml(event.title)}</h2><p>Status: <strong>${escapeHtml(event.status)}</strong>. ${event.roster.length} confirmed candidate${event.roster.length===1?"":"s"}, ${event.judges.length} judge assignment${event.judges.length===1?"":"s"}, ${event.criteria.length} scoring criteria.</p><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:18px">${statusActions.map((next)=>`<button data-status="${next}" data-event="${event.id}" type="button" style="border:1px solid #d8c9d2;border-radius:999px;padding:10px 14px;background:#fff;font-weight:750;cursor:pointer">${next==="live"?"Go live":next==="locked"?"Lock configuration":next==="rehearsal"?"Start rehearsal":next==="draft"?"Return to draft":"Cancel"}</button>`).join("")}${event.status==="live"?`<button data-finalize data-event="${event.id}" type="button" style="border:0;border-radius:999px;padding:10px 14px;background:#7d164b;color:#fff;font-weight:800;cursor:pointer">Finalize tabulation</button>`:""}</div>`) }
      <div class="pi-policy-grid two" style="margin-top:18px">
        ${card(`<h2>Scoring structure</h2>${event.segments.length?event.segments.map((segment)=>`<section style="margin-top:18px;padding-top:18px;border-top:1px solid #eadde5"><h3>${escapeHtml(segment.name)} <small style="font-weight:400;color:#786873">weight ${Number(segment.weight)}</small></h3><ul>${(criteriaBySegment.get(segment.id)||[]).map((criterion)=>`<li>${escapeHtml(criterion.name)} · max ${Number(criterion.max_score)} · weight ${Number(criterion.weight)}</li>`).join("")||"<li>No criteria yet.</li>"}</ul>${canEdit?`<form data-add-criterion data-event="${event.id}" data-segment="${segment.id}" style="display:grid;grid-template-columns:1fr 90px 90px auto;gap:8px"><input name="name" required maxlength="160" placeholder="Criterion" style="padding:10px;border:1px solid #d8c9d2;border-radius:9px"><input name="maxScore" type="number" min="1" step="0.01" value="100" aria-label="Max score" style="padding:10px;border:1px solid #d8c9d2;border-radius:9px"><input name="weight" type="number" min="0.0001" step="0.01" value="1" aria-label="Weight" style="padding:10px;border:1px solid #d8c9d2;border-radius:9px"><button type="submit">Add</button></form>`:""}</section>`).join(""):"<p>No scoring segments yet.</p>"}${canEdit?`<form data-add-segment data-event="${event.id}" style="display:flex;gap:8px;margin-top:20px"><input name="name" required maxlength="160" placeholder="New segment e.g. Evening Gown" style="flex:1;padding:10px;border:1px solid #d8c9d2;border-radius:9px"><input name="weight" type="number" min="0.0001" step="0.01" value="1" aria-label="Weight" style="width:88px;padding:10px;border:1px solid #d8c9d2;border-radius:9px"><button type="submit">Add segment</button></form>`:""}`)}
        ${card(`<h2>Judges</h2>${event.judges.length?`<ul>${event.judges.map((judge)=>`<li><strong>${escapeHtml(judge.judge_display_name)}</strong> · ${escapeHtml(judge.status)}${judge.judge_email?` · ${escapeHtml(judge.judge_email)}`:""}</li>`).join("")}</ul>`:"<p>No judges invited yet.</p>"}${['draft','rehearsal','locked'].includes(event.status)?`<form data-invite-judge data-event="${event.id}" style="display:grid;gap:9px;margin-top:18px"><input name="judgeDisplayName" required maxlength="180" placeholder="Judge name" style="padding:10px;border:1px solid #d8c9d2;border-radius:9px"><input name="judgeEmail" type="email" required maxlength="320" placeholder="Judge email" style="padding:10px;border:1px solid #d8c9d2;border-radius:9px"><button type="submit">Create secure judge invitation</button></form><div data-invite-output></div>`:""}`)}
      </div>
      ${card(`<h2>Live score completion</h2><div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:10px;border-bottom:1px solid #eadde5">Candidate</th><th style="text-align:right;padding:10px;border-bottom:1px solid #eadde5">Scores received</th><th style="text-align:right;padding:10px;border-bottom:1px solid #eadde5">Current rank</th><th style="text-align:right;padding:10px;border-bottom:1px solid #eadde5">Final</th></tr></thead><tbody>${event.roster.map((candidate)=>{const total=totals.get(candidate.id);const result=(event.results||[]).find((row)=>row.roster_id===candidate.id);return `<tr><td style="padding:10px;border-bottom:1px solid #f0e7ec"><strong>${escapeHtml(candidate.candidate_display_name)}</strong><br><small>${escapeHtml(candidate.representation||"")}</small></td><td style="text-align:right;padding:10px;border-bottom:1px solid #f0e7ec">${Number(total?.score_count||0)}</td><td style="text-align:right;padding:10px;border-bottom:1px solid #f0e7ec">${total?.current_rank??"—"}</td><td style="text-align:right;padding:10px;border-bottom:1px solid #f0e7ec">${result?`${Number(result.final_score).toFixed(2)} · #${result.final_rank}`:"—"}</td></tr>`;}).join("")||`<tr><td colspan="4" style="padding:18px">No confirmed candidates in this edition yet.</td></tr>`}</tbody></table></div>`) }
    </section>`;
  }

  async function load(selectEvent=null){
    const current=session();
    if(!current){root.innerHTML=card(`<h2>Organizer sign-in required</h2><p>Use the PageantIndex account that owns the pageant edition.</p><p><a href="/sign-in/">Sign in to PageantIndex</a></p>`);return;}
    const data=await api("/api/tabulation/workspace",{headers:authHeaders(current),cache:"no-store"});
    const create=card(`<h2>Create a tabulation event</h2>${data.editions?.length?`<form id="create-tabulation" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:9px"><select name="editionId" required style="padding:11px;border:1px solid #d8c9d2;border-radius:10px">${data.editions.map((edition)=>`<option value="${edition.id}">${escapeHtml(edition.pageant_name)} · ${escapeHtml(edition.edition_name||edition.edition_year)}</option>`).join("")}</select><input name="title" required maxlength="180" placeholder="Scoring title e.g. Coronation Finals" style="padding:11px;border:1px solid #d8c9d2;border-radius:10px"><button type="submit">Create</button></form>`:`<p>Create a pageant edition in your organizer dashboard first.</p><p><a href="/organization/">Open organizer workspace</a></p>`}`);
    if(!data.events?.length){root.innerHTML=create;return;}
    const selected=selectEvent&&data.events.some((event)=>event.id===selectEvent)?selectEvent:data.events[0].id;
    root.innerHTML=`${create}<div style="height:18px"></div>${card(`<label style="display:grid;gap:8px;font-weight:750">Tabulation event<select id="tabulation-select" style="padding:11px;border:1px solid #d8c9d2;border-radius:10px">${data.events.map((event)=>`<option value="${event.id}" ${event.id===selected?"selected":""}>${escapeHtml(event.title)} · ${escapeHtml(event.status)}</option>`).join("")}</select></label>`)}<div style="height:18px"></div>${data.events.map((event)=>eventDetail(event,data.editions)).join("")}`;
    root.querySelector(`[data-event-panel="${selected}"]`)?.removeAttribute("hidden");
    root.querySelector("#tabulation-select")?.addEventListener("change",(event)=>{root.querySelectorAll("[data-event-panel]").forEach((panel)=>{panel.hidden=panel.dataset.eventPanel!==event.target.value;});});
  }

  document.addEventListener("submit",async(event)=>{
    const current=session();if(!current)return;
    const form=event.target;
    let payload=null;
    if(form.id==="create-tabulation"){event.preventDefault();const data=Object.fromEntries(new FormData(form));payload={action:"create_event",editionId:data.editionId,title:data.title};}
    else if(form.matches("[data-add-segment]")){event.preventDefault();const data=Object.fromEntries(new FormData(form));payload={action:"add_segment",eventId:form.dataset.event,name:data.name,weight:Number(data.weight)};}
    else if(form.matches("[data-add-criterion]")){event.preventDefault();const data=Object.fromEntries(new FormData(form));payload={action:"add_criterion",eventId:form.dataset.event,segmentId:form.dataset.segment,name:data.name,maxScore:Number(data.maxScore),weight:Number(data.weight)};}
    else if(form.matches("[data-invite-judge]")){event.preventDefault();const data=Object.fromEntries(new FormData(form));const button=form.querySelector("button");button.disabled=true;try{const result=await api("/api/judges/invite",{method:"POST",headers:authHeaders(current,{"Content-Type":"application/json"}),body:JSON.stringify({tabulationEventId:form.dataset.event,judgeDisplayName:data.judgeDisplayName,judgeEmail:data.judgeEmail})});form.querySelector("[data-invite-output]");const output=form.nextElementSibling||document.createElement("div");output.className="pi-report-status";output.innerHTML=`Invitation created. Copy this private link to the judge:<br><code style="word-break:break-all">${escapeHtml(result.invitationUrl)}</code>`;form.insertAdjacentElement("afterend",output);button.disabled=false;}catch(error){button.disabled=false;alert(error.message);}return;}
    if(!payload)return;
    try{const result=await api("/api/tabulation/configure",{method:"POST",headers:authHeaders(current,{"Content-Type":"application/json"}),body:JSON.stringify(payload)});await load(result.eventId||payload.eventId||null);}catch(error){alert(error.message);}
  });

  document.addEventListener("click",async(event)=>{
    const current=session();if(!current)return;
    const status=event.target.closest?.("[data-status]");
    if(status){status.disabled=true;try{await api("/api/tabulation/configure",{method:"POST",headers:authHeaders(current,{"Content-Type":"application/json"}),body:JSON.stringify({action:"set_status",eventId:status.dataset.event,status:status.dataset.status})});await load(status.dataset.event);}catch(error){status.disabled=false;alert(error.message);}return;}
    const finalize=event.target.closest?.("[data-finalize]");
    if(finalize){const publish=confirm("Finalize this tabulation. Press OK to finalize and publish the official results, or Cancel to keep scoring live.");if(!publish)return;finalize.disabled=true;try{await api("/api/tabulation/finalize",{method:"POST",headers:authHeaders(current,{"Content-Type":"application/json"}),body:JSON.stringify({tabulationEventId:finalize.dataset.event,publishResults:true})});await load(finalize.dataset.event);}catch(error){finalize.disabled=false;alert(error.message);}}
  });

  load().catch((error)=>{root.innerHTML=card(`<h2>Tabulation unavailable</h2><p>${escapeHtml(error.message)}</p>`);});
})();
