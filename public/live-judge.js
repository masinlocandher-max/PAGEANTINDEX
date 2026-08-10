"use strict";

(() => {
  const SESSION_KEY="pi_supabase_session";
  const root=document.getElementById("live-judge-app");
  if(!root) return;
  const token=new URLSearchParams(location.search).get("token")||"";
  const escapeHtml=(value)=>String(value??"").replace(/[&<>\"]/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  function session(){for(const storage of [sessionStorage,localStorage]){try{const value=JSON.parse(storage.getItem(SESSION_KEY)||"null");if(value?.access_token)return value;}catch{}}return null;}
  async function json(url,options={}){const response=await fetch(url,options);const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||`Request failed (${response.status}).`);return data;}

  async function renderInvite(){
    const data=await json(`/api/judges/inspect?token=${encodeURIComponent(token)}`,{cache:"no-store"});
    const edition=data.edition||{};
    const pageant=[edition.pageant_name,edition.edition_name||edition.edition_year].filter(Boolean).join(" · ");
    if(!data.active){root.innerHTML=`<div class="pi-policy-card"><h2>Invitation unavailable</h2><p>This judge invitation is ${escapeHtml(data.status||"inactive")} or has expired.</p></div>`;return;}
    const current=session();
    root.innerHTML=`<div class="pi-policy-card"><p class="pi-policy-kicker">Pending judge assignment</p><h2>${escapeHtml(data.judgeDisplayName)}</h2><p><strong>${escapeHtml(data.event?.title||"Official scoring")}</strong>${pageant?` · ${escapeHtml(pageant)}`:""}</p><p>${edition.venue?`${escapeHtml(edition.venue)}. `:""}This invitation expires ${data.expiresAt?escapeHtml(new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short"}).format(new Date(data.expiresAt))):"when revoked by the organizer"}.</p>${current?`<button id="accept-judge" type="button" style="border:0;border-radius:999px;padding:12px 18px;background:#7d164b;color:#fff;font-weight:800;cursor:pointer">Accept judge assignment</button>`:`<p class="pi-report-status">Sign in with the email address that received this invitation, then reopen this link.</p><p><a href="/sign-in/">Sign in to PageantIndex</a></p>`}</div>`;
    root.querySelector("#accept-judge")?.addEventListener("click",async(event)=>{const button=event.currentTarget;button.disabled=true;button.textContent="Accepting…";try{await json("/api/judges/accept",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${current.access_token}`},body:JSON.stringify({token})});history.replaceState({},"","/judge/");await renderWorkspace();}catch(error){button.disabled=false;button.textContent="Accept judge assignment";root.insertAdjacentHTML("beforeend",`<p class="pi-report-status">${escapeHtml(error.message)}</p>`);}});
  }

  function scoreKey(criterionId,rosterId){return `${criterionId}:${rosterId}`;}
  function assignmentView(item,index){
    const scoreMap=new Map((item.scores||[]).map((score)=>[scoreKey(score.criterion_id,score.roster_id),score]));
    const criteriaBySegment=new Map();
    for(const criterion of item.criteria||[]){const list=criteriaBySegment.get(criterion.segment_id)||[];list.push(criterion);criteriaBySegment.set(criterion.segment_id,list);}
    const editable=['rehearsal','live'].includes(item.event.status);
    const pageant=[item.edition?.pageant_name,item.edition?.edition_name||item.edition?.edition_year].filter(Boolean).join(" · ");
    return `<section data-judge-assignment="${item.assignment.id}" ${index===0?"":"hidden"}>
      <div class="pi-policy-card"><p class="pi-policy-kicker">${escapeHtml(pageant||"Judge workspace")}</p><h2>${escapeHtml(item.event.title)}</h2><p>Status: <strong>${escapeHtml(item.event.status)}</strong>. ${editable?"Scores can be saved while the event is in rehearsal or live scoring.":"Scoring is currently locked."}</p></div>
      ${(item.roster||[]).map((candidate)=>`<article class="pi-policy-card" style="margin-top:18px"><p class="pi-policy-kicker">${candidate.candidate_number?`Candidate ${escapeHtml(candidate.candidate_number)}`:"Official candidate"}</p><h2>${escapeHtml(candidate.candidate_display_name)}</h2><p>${escapeHtml(candidate.representation||"")}</p>
        ${(item.segments||[]).map((segment)=>{const criteria=criteriaBySegment.get(segment.id)||[];return `<fieldset style="margin:22px 0 0;padding:20px;border:1px solid #eadde5;border-radius:16px"><legend style="padding:0 8px;font-weight:800">${escapeHtml(segment.name)}</legend><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px">${criteria.map((criterion)=>{const saved=scoreMap.get(scoreKey(criterion.id,candidate.id));return `<label style="display:grid;gap:7px;font-weight:650">${escapeHtml(criterion.name)} <small style="font-weight:400;color:#786873">Max ${Number(criterion.max_score)}</small><input data-score data-criterion="${criterion.id}" data-roster="${candidate.id}" type="number" min="0" max="${Number(criterion.max_score)}" step="0.01" value="${saved?Number(saved.score):""}" ${editable?"":"disabled"} style="padding:12px;border:1px solid #d8c9d2;border-radius:10px;font:inherit"></label>`;}).join("")}</div></fieldset>`;}).join("")}
      </article>`).join("")}
      <div style="position:sticky;bottom:12px;margin-top:22px;padding:14px;border-radius:16px;background:rgba(23,9,18,.94);color:#fff;display:flex;justify-content:space-between;align-items:center;gap:14px;box-shadow:0 16px 50px rgba(0,0,0,.22)"><span>${editable?"Save a complete or partial scoring pass. The organizer cannot overwrite your judge scores.":"Scoring is locked."}</span>${editable?`<button data-save-scores type="button" style="border:0;border-radius:999px;padding:12px 18px;background:#fff;color:#351027;font-weight:800;cursor:pointer">Save scores</button>`:""}</div>
    </section>`;
  }

  async function renderWorkspace(){
    const current=session();
    if(!current){root.innerHTML=`<div class="pi-policy-card"><h2>Judge sign-in required</h2><p>Sign in to the PageantIndex account connected to your judge invitation.</p><p><a href="/sign-in/">Sign in to PageantIndex</a></p></div>`;return;}
    const data=await json("/api/judges/workspace",{headers:{Authorization:`Bearer ${current.access_token}`},cache:"no-store"});
    if(!data.assignments?.length){root.innerHTML=`<div class="pi-policy-card"><h2>No active judge assignments.</h2><p>Accepted PageantIndex judge invitations will appear here. No sample pageant or fabricated scoring data is shown.</p></div>`;return;}
    root.innerHTML=`${data.assignments.length>1?`<label class="pi-policy-card" style="display:grid;gap:8px;margin-bottom:18px">Judge assignment<select id="judge-assignment-select" style="padding:12px;border:1px solid #d8c9d2;border-radius:10px">${data.assignments.map((item,index)=>`<option value="${index}">${escapeHtml(item.edition?.pageant_name||item.event.title)} · ${escapeHtml(item.event.title)}</option>`).join("")}</select></label>`:""}${data.assignments.map(assignmentView).join("")}`;
    root.querySelector("#judge-assignment-select")?.addEventListener("change",(event)=>{root.querySelectorAll("[data-judge-assignment]").forEach((section,index)=>{section.hidden=index!==Number(event.target.value);});});
  }

  document.addEventListener("click",async(event)=>{
    const button=event.target.closest?.("[data-save-scores]");if(!button)return;
    const section=button.closest("[data-judge-assignment]");
    const current=session();if(!current)return;
    const scores=[...section.querySelectorAll("[data-score]")].filter((input)=>input.value!=="").map((input)=>({criterionId:input.dataset.criterion,rosterId:input.dataset.roster,score:Number(input.value)}));
    if(!scores.length)return;
    button.disabled=true;const original=button.textContent;button.textContent="Saving…";
    try{const result=await json("/api/judges/score",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${current.access_token}`},body:JSON.stringify({assignmentId:section.dataset.judgeAssignment,scores})});button.textContent=`Saved ${result.count} scores`;setTimeout(()=>{button.disabled=false;button.textContent=original;},1800);window.PageantIndexAnalytics?.track?.("judge_scores_saved",{result:"success"});}
    catch(error){button.disabled=false;button.textContent=original;const note=document.createElement("p");note.className="pi-report-status";note.textContent=error.message;button.parentElement.appendChild(note);}
  });

  (token?renderInvite():renderWorkspace()).catch((error)=>{root.innerHTML=`<div class="pi-policy-card"><h2>Judge workspace unavailable</h2><p>${escapeHtml(error.message)}</p></div>`;});
})();
