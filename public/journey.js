"use strict";

(() => {
  const root = document.getElementById("journey-app");
  if (!root) return;

  const roles = [
    {id:"organization", icon:"O", name:"Pageant Organization", copy:"Create and operate pageant editions, teams, candidates, competition systems and official records."},
    {id:"candidate", icon:"C", name:"Candidate / Titleholder", copy:"Discover opportunities, apply, complete requirements, compete and build a permanent verified history."},
    {id:"professional", icon:"P", name:"Pageant Professional", copy:"Build professional identity, receive event opportunities and become discoverable across the industry."},
    {id:"judge", icon:"J", name:"Judge / Tabulator", copy:"Enter secure competition workflows for scoring, monitoring, certification and official results."},
    {id:"fan", icon:"F", name:"Fan / Voter", copy:"Discover candidates, follow official events and participate in transparent voting experiences."},
    {id:"attendee", icon:"T", name:"Ticket Buyer / Attendee", copy:"Find events, choose access, receive tickets and move smoothly from checkout to venue entry."},
    {id:"brand", icon:"B", name:"Brand / Sponsor", copy:"Discover events, professionals and partnership opportunities across the pageant economy."},
    {id:"media", icon:"M", name:"Media / Researcher", copy:"Use official event records, historical results and structured pageant information as a trusted reference."},
  ];

  const goals = {
    organization:[
      ["create","Create or manage a pageant","Set up organization identity, editions, staff, applications and candidate operations."],
      ["eventnight","Run competition night","Open judging, tabulation, voting, tickets and event-night control."],
      ["record","Publish the official record","Preserve candidates, placements, results, suppliers, sponsors and history."],
    ],
    candidate:[
      ["discover","Find pageants to join","Move from discovery into an application-ready event journey."],
      ["compete","Manage my competition journey","Track application, requirements, schedules and pageant-week activity."],
      ["career","Build my pageant profile","Turn participation and titles into a durable PageantIndex professional record."],
    ],
    professional:[
      ["profile","Build my professional profile","Create a discoverable portfolio and pageant-industry identity."],
      ["work","Find or receive opportunities","Move from discovery and organizer inquiry into an event-specific work relationship."],
      ["credits","Build verified credits","Connect your role to pageant editions, organizations and candidates accurately."],
    ],
    judge:[
      ["score","Score a competition","Use a secure judge-only scoring journey with clear criteria and submission state."],
      ["tabulate","Manage tabulation","Monitor judge status, lock rounds, investigate anomalies and certify outcomes."],
      ["results","Confirm official results","Move approved competition output into the permanent event record."],
    ],
    fan:[
      ["follow","Follow a pageant","Open the canonical event page for candidates, schedule, voting and results."],
      ["vote","Vote for a candidate","Enter the transparent ballot and confirmation journey."],
      ["history","Explore results and history","Move from a live event into PageantIndex's permanent pageant records."],
    ],
    attendee:[
      ["tickets","Buy event tickets","Choose ticket access and move through checkout to a QR credential."],
      ["event","View event details","See schedule, candidates, venue information, voting and official updates."],
      ["checkin","Access my event","Use the ticket journey as the bridge from purchase to venue entry."],
    ],
    brand:[
      ["discover","Discover pageants and partners","Explore organizations, editions, candidates and professional suppliers."],
      ["sponsor","Find sponsorship opportunities","Use structured event and organization records to identify relevant partnerships."],
      ["intelligence","Understand the industry","Move toward PageantIndex Intelligence as structured market data grows."],
    ],
    media:[
      ["records","Find official pageant records","Use permanent edition pages rather than scattered social posts."],
      ["people","Research people and credits","Trace candidates, titleholders, organizations and professional relationships."],
      ["intelligence","Explore industry intelligence","Use structured historical data for patterns, context and future research."],
    ],
  };

  const routes = {
    organization:{create:["Organization setup","/organization/","Create or manage your organization identity, team authority, editions and verification before entering operations."],eventnight:["Organizer OS","/platform/","Run the pageant from one operating surface: applications, candidates, schedules, judging, voting, tickets and records."],record:["Official event record","/event/","Review how an edition becomes a permanent PageantIndex record after the competition."]},
    candidate:{discover:["Public event discovery","/event/","Start from an official edition page, then move into the application journey when applications are open."],compete:["Candidate portal","/candidate/","Use one private place for application status, requirements, schedule and competition readiness."],career:["Candidate PageantIndex profile","/candidate/","Build the profile that can later preserve verified titles, placements and professional pageant history."]},
    professional:{profile:["Professional network","/directory/","Start with discovery and professional identity inside the global PageantIndex network."],work:["Supplier workspace","/supplier-workspace/","Receive event briefs, respond to organizers and track opportunity status."],credits:["Professional credits","/supplier-workspace/","Prepare event-specific relationships that can later connect organization, edition, candidate and role."]},
    judge:{score:["Judge scoring","/judge/","Enter the isolated judge journey for criteria, candidate-by-candidate scoring, review and locked submission."],tabulate:["Tabulation control room","/tabulation/","Monitor judge completion, lock rounds, certify results and preserve an audit trail."],results:["Official event record","/event/","See the public destination where certified results ultimately belong."]},
    fan:{follow:["Official event","/event/","Follow one canonical edition page instead of chasing fragmented posts across platforms."],vote:["People's Choice voting","/vote/","Choose a candidate, review the ballot and receive confirmation through the dedicated voter flow."],history:["Official event record","/event/","Continue from the live competition into the permanent historical record."]},
    attendee:{tickets:["PageantIndex Tickets","/tickets/","Choose access, move through ticket selection and reach the QR credential experience."],event:["Official event","/event/","See the event, candidates, schedule, voting, tickets and results in one public destination."],checkin:["Ticket access","/tickets/","Use the ticket journey as the future bridge to secure event check-in."]},
    brand:{discover:["Global pageant network","/directory/","Explore the people and organizations that make up the pageant economy."],sponsor:["Official event ecosystem","/event/","See where sponsors, organizations, candidates and event activity connect around one edition."],intelligence:["PageantIndex Intelligence","/platform/#intelligence","Preview the future intelligence layer built from structured pageant data."]},
    media:{records:["Official event record","/event/","Use a canonical edition page as the trusted starting point for results and context."],people:["PageantIndex directory","/directory/","Research candidates, professionals and organizations through structured profiles and credits."],intelligence:["PageantIndex Intelligence","/platform/#intelligence","Preview how historical records can become useful industry intelligence."]},
  };

  let selectedRole = null;
  let selectedGoal = null;

  function brand(){return `<a class="brand" href="/"><img src="/public/images/pageant-icon.png" alt=""><div><strong>PageantIndex</strong><span>The Global Network for Pageantry</span></div></a>`;}
  function lifecycle(){return `<div class="lifecycle">${[["01","Discover"],["02","Join"],["03","Operate"],["04","Compete"],["05","Engage"],["06","Crown"],["07","Record"],["08","Grow"]].map(([n,label])=>`<div class="life"><small>${n}</small><strong>${label}</strong></div>`).join("")}</div>`;}

  function resultHTML(){
    if(!selectedRole || !selectedGoal) return "";
    const [title,url,copy] = routes[selectedRole][selectedGoal];
    return `<section class="result" aria-live="polite"><div><small>Your next PageantIndex destination</small><h3>${title}</h3><p>${copy}</p></div><div class="result-actions"><a class="secondary" href="/event/">See public event</a><a class="primary" href="${url}">Continue journey →</a></div></section>`;
  }

  function renderGoals(){
    const wrap=document.getElementById("goal-wrap");
    if(!wrap) return;
    if(!selectedRole){wrap.innerHTML="";return;}
    wrap.innerHTML=`<div class="goal-wrap"><div class="step-head"><div><small>Step 2</small><h2>What are you here to do?</h2><p>PageantIndex should route you by intent, not force you to understand its entire product architecture first.</p></div></div><div class="goal-grid">${goals[selectedRole].map(([id,name,copy])=>`<button class="goal ${selectedGoal===id?"selected":""}" data-goal="${id}"><strong>${name}</strong><span>${copy}</span></button>`).join("")}</div>${resultHTML()}</div>`;
    bindGoals();
  }

  function render(){
    root.innerHTML=`<div class="shell"><header class="topbar">${brand()}<div class="grow"></div><a class="toplink" href="/directory/">Explore network</a><a class="toplink" href="/sign-in/">Sign in</a></header><main class="main">
      <section class="hero"><div><h1>One pageant industry. One connected journey.</h1><p>PageantIndex follows the real life of pageantry from discovery and professional identity to pageant operations, competition, audience participation, official results and long-term industry intelligence.</p></div><aside class="hero-side"><strong>Start with who you are.</strong><p>You should never need to know which PageantIndex product name to open. Tell us your place in pageantry and what you need to accomplish. The platform takes you to the right experience.</p></aside></section>
      ${lifecycle()}
      <section class="panel journey"><div class="step-head"><div><small>Step 1</small><h2>Where do you belong in pageantry?</h2><p>The same event can involve organizations, candidates, professionals, judges, fans, buyers, brands and media. Their journeys connect, but their interfaces should not be identical.</p></div><button class="reset" id="reset">Reset journey</button></div><div class="role-grid">${roles.map(r=>`<button class="role ${selectedRole===r.id?"selected":""}" data-role="${r.id}"><span class="icon">${r.icon}</span><strong>${r.name}</strong><span>${r.copy}</span></button>`).join("")}</div><div id="goal-wrap"></div></section>
      <section class="blueprint"><h2>The blueprint behind the journey</h2><p>PageantIndex is designed as one connected industry system. Public discovery brings people in. Operational tools help pageants run. Transactions and participation create activity. Official records preserve what happened. Structured relationships and history create the intelligence layer.</p><div class="rails">
        <article class="panel rail"><small>Network</small><h3>Identity & discovery</h3><p>Profiles and permanent records make people, pageants and professional relationships searchable and credible.</p><ul><li>Candidates and titleholders</li><li>Pageant organizations and editions</li><li>Professionals and suppliers</li><li>Verification and credits</li></ul><a href="/directory/">Explore the network →</a></article>
        <article class="panel rail"><small>Operations</small><h3>Run the pageant</h3><p>The Organizer OS turns PageantIndex from a directory into infrastructure that pageant organizations can operate on.</p><ul><li>Applications and requirements</li><li>Candidate and schedule management</li><li>Judging and tabulation</li><li>Voting, tickets and event control</li></ul><a href="/platform/">Open Organizer OS →</a></article>
        <article class="panel rail"><small>Permanent value</small><h3>Record, reputation & intelligence</h3><p>When the event ends, its relationships and verified results remain useful instead of disappearing into social feeds.</p><ul><li>Official event record</li><li>Titles, placements and credits</li><li>Supplier and organization relationships</li><li>Future PageantIndex Intelligence</li></ul><a href="/event/">View event record →</a></article>
      </div></section>
      <div class="footer-note">Front-end journey only. Database-backed identity, transactions, votes, scores, ticket issuance, verification and official-result certification remain separate production integrations.</div>
    </main><div class="toast" id="toast"></div></div>`;
    document.querySelectorAll("[data-role]").forEach(btn=>btn.addEventListener("click",()=>{selectedRole=btn.dataset.role;selectedGoal=null;document.querySelectorAll("[data-role]").forEach(x=>x.classList.toggle("selected",x===btn));renderGoals();document.getElementById("goal-wrap")?.scrollIntoView({behavior:"smooth",block:"nearest"});}));
    document.getElementById("reset")?.addEventListener("click",()=>{selectedRole=null;selectedGoal=null;render();});
    renderGoals();
  }

  function bindGoals(){document.querySelectorAll("[data-goal]").forEach(btn=>btn.addEventListener("click",()=>{selectedGoal=btn.dataset.goal;renderGoals();document.querySelector(".result")?.scrollIntoView({behavior:"smooth",block:"nearest"});}));}
  render();
})();
