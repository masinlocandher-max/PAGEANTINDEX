"use strict";

(() => {
  const root=document.getElementById("live-event-app"); if(!root)return;
  const params=new URLSearchParams(location.search); const requested=params.get("edition")||"";
  const escapeHtml=(value)=>String(value??"").replace(/[&<>\"]/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  const money=(minor,currency="PHP")=>new Intl.NumberFormat("en-PH",{style:"currency",currency}).format(Number(minor||0)/100);
  const dateTime=(value)=>value?new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"";
  const card=(body)=>`<article class="pi-policy-card">${body}</article>`;

  function render(item){
    const e=item.edition;
    const resultsByRoster=new Map((item.results||[]).map((row)=>[row.roster_id,row]));
    const creditsByCandidate=new Map();
    const orgCredits=[];
    for(const credit of item.credits||[]){if(credit.scope==="organization")orgCredits.push(credit);else{const list=creditsByCandidate.get(credit.candidateRosterId)||[];list.push(credit);creditsByCandidate.set(credit.candidateRosterId,list);}}
    return `<section>
      ${card(`<p class="pi-policy-kicker">${escapeHtml(e.organization_name||"Official PageantIndex event")}</p><h2>${escapeHtml(e.pageant_name)} ${e.edition_name||e.edition_year?`<small style="font-weight:400;color:#786873">${escapeHtml(e.edition_name||e.edition_year)}</small>`:""}</h2><p>${escapeHtml(e.description||"")}</p><p>${e.event_start_at?`<strong>${escapeHtml(dateTime(e.event_start_at))}</strong>`:"Date to be announced"}${e.venue?` · ${escapeHtml(e.venue)}`:""}${e.city?` · ${escapeHtml(e.city)}`:""}${e.country_name?`, ${escapeHtml(e.country_name)}`:""}</p><div style="display:flex;flex-wrap:wrap;gap:9px;margin-top:18px">${(item.voting||[]).filter((v)=>v.status==="open"||v.status==="scheduled").map((v)=>`<a href="/vote/?event=${encodeURIComponent(v.id)}" style="padding:10px 14px;border-radius:999px;background:#7d164b;color:#fff;text-decoration:none;font-weight:800">${v.status==="open"?"Vote now":"Voting schedule"}</a>`).join("")}${(item.offers||[]).filter((o)=>o.offer_type==="ticket").length?`<a href="/tickets/?edition=${encodeURIComponent(e.id)}" style="padding:10px 14px;border-radius:999px;background:#24131d;color:#fff;text-decoration:none;font-weight:800">Tickets</a>`:""}${e.official_url?`<a href="${escapeHtml(e.official_url)}" target="_blank" rel="noreferrer">Official pageant site</a>`:""}</div>`) }
      <div class="pi-policy-grid two" style="margin-top:18px">
        ${card(`<h2>Candidates</h2>${item.roster?.length?`<div style="display:grid;gap:12px">${item.roster.map((candidate)=>{const result=resultsByRoster.get(candidate.id);const credits=creditsByCandidate.get(candidate.id)||[];return `<section style="padding:16px;border:1px solid #eadde5;border-radius:14px"><p class="pi-policy-kicker">${candidate.candidate_number?`Candidate ${escapeHtml(candidate.candidate_number)}`:"Official candidate"}</p><h3 style="margin:7px 0">${escapeHtml(candidate.candidate_display_name)}</h3><p style="margin:0;color:#786873">${escapeHtml(candidate.representation||"")}</p>${candidate.title_or_placement?`<p><strong>${escapeHtml(candidate.title_or_placement)}</strong></p>`:""}${result?`<p>Official final rank: <strong>#${Number(result.final_rank)}</strong></p>`:""}${credits.length?`<p style="font-size:.8rem;color:#786873">Confirmed team: ${credits.map((credit)=>`${escapeHtml(credit.role)} · ${escapeHtml(credit.supplier.businessName)}`).join("; ")}</p>`:""}</section>`;}).join("")}</div>`:"<p>No public candidate roster has been published for this edition yet.</p>"}`)}
        ${card(`<h2>Official services</h2>${item.offers?.length?`<ul>${item.offers.map((offer)=>`<li><strong>${escapeHtml(offer.name)}</strong> · ${escapeHtml(offer.offer_type.toUpperCase())} · ${escapeHtml(money(offer.price_minor,offer.currency))} · ${escapeHtml(offer.status)}</li>`).join("")}</ul>`:"<p>No tickets, PPV, or merchandise offers have been published for this edition.</p>"}<h3>Confirmed organization suppliers</h3>${orgCredits.length?`<ul>${orgCredits.map((credit)=>`<li>${escapeHtml(credit.role)} · <strong>${escapeHtml(credit.supplier.businessName)}</strong></li>`).join("")}</ul>`:"<p>No organization-level professional credits are public yet.</p>"}`)}
      </div>
      ${item.tabulations?.length?card(`<h2>Official results</h2>${item.tabulations.map((tab)=>{const rows=(item.results||[]).filter((result)=>result.tabulation_event_id===tab.id);return `<section style="margin-top:16px"><h3>${escapeHtml(tab.title)}</h3>${rows.length?`<ol>${rows.sort((a,b)=>a.final_rank-b.final_rank).map((row)=>{const candidate=item.roster.find((entry)=>entry.id===row.roster_id);return candidate?`<li><strong>${escapeHtml(candidate.candidate_display_name)}</strong> · ${escapeHtml(candidate.representation||"")}</li>`:"";}).join("")}</ol>`:"<p>Final results have not been published.</p>"}</section>`;}).join("")}`):""}
    </section>`;
  }

  async function load(){
    const query=requested?`?edition=${encodeURIComponent(requested)}`:"";
    const response=await fetch(`/api/events/public${query}`,{cache:"no-store"});
    const data=await response.json().catch(()=>({})); if(!response.ok)throw new Error(data.error||"Event data could not be loaded.");
    if(!data.events?.length){root.innerHTML=card(`<h2>No public pageant edition is available yet.</h2><p>Only organizer-submitted, reviewed, and published PageantIndex editions appear here. No demo pageants are inserted.</p>`);return;}
    if(data.events.length===1){root.innerHTML=render(data.events[0]);return;}
    root.innerHTML=`${card(`<label style="display:grid;gap:8px;font-weight:750">Official event<select id="event-select" style="padding:12px;border:1px solid #d8c9d2;border-radius:10px">${data.events.map((item,index)=>`<option value="${index}">${escapeHtml(item.edition.pageant_name)} · ${escapeHtml(item.edition.edition_name||item.edition.edition_year)}</option>`).join("")}</select></label>`)}<div style="height:18px"></div><div id="event-detail"></div>`;
    const detail=root.querySelector("#event-detail");const select=root.querySelector("#event-select");const show=()=>{detail.innerHTML=render(data.events[Number(select.value)||0]);};select.addEventListener("change",show);show();
  }
  load().catch((error)=>{root.innerHTML=card(`<h2>Event unavailable</h2><p>${escapeHtml(error.message)}</p>`);});
})();
