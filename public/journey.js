"use strict";

(() => {
  const root = document.getElementById("journey-app");
  if (!root) return;

  const roles = [
    {
      id:"supplier",
      icon:"S",
      name:"Supplier / Professional",
      copy:"Create a professional identity, show your work, connect your pageant credits and become discoverable globally.",
    },
    {
      id:"candidate",
      icon:"C",
      name:"Candidate / Titleholder",
      copy:"Build a public pageant profile, connect your history and confirm the professionals who worked directly with you.",
    },
    {
      id:"organization",
      icon:"O",
      name:"Pageant Organization",
      copy:"Claim your organization, manage editions and admins, add candidates and confirm official pageant-level suppliers.",
    },
  ];

  const goals = {
    supplier:[
      ["create","Create or claim my profile","Start with a free PageantIndex professional identity and build a polished public pageant résumé."],
      ["credits","Add my pageant credits","Connect Pageant Name + Year/Edition + Candidate + Role. Self-added credits remain unconfirmed until approved."],
      ["identity","Manage verification and confirmations","See identity verification separately from candidate-confirmed and organization-confirmed work relationships."],
    ],
    candidate:[
      ["profile","Create or claim my candidate profile","Build a public pageant identity with titles, history, official links and professional relationships."],
      ["suppliers","Invite or confirm my personal suppliers","Confirm people who worked directly with you without turning them into official pageant suppliers."],
      ["history","Manage my pageant history","Connect editions, placements and candidate-specific professional credits into one structured record."],
    ],
    organization:[
      ["claim","Claim my organization profile","Establish the official organization identity and add authorized admins."],
      ["editions","Manage pageant editions and candidates","Create the edition structure that connects the organization, year, candidates and pageant relationships."],
      ["official","Invite or confirm official suppliers","Confirm pageant-level official roles separately from candidate-specific supplier relationships."],
    ],
  };

  const routes = {
    supplier:{
      create:["Create your free professional profile","/sign-up/","Build your PageantIndex identity first. Your public profile becomes the shareable professional page people and search systems can understand."],
      credits:["Manage your professional credits","/dashboard/","Add structured work history using Pageant Name + Year/Edition + Candidate + Role, with confirmation status kept visible."],
      identity:["Manage your profile trust layer","/dashboard/","Identity Verified, Candidate Confirmed and Organization Confirmed stay separate so the profile shows exactly what was verified and by whom."],
    },
    candidate:{
      profile:["Create your candidate profile","/sign-up/","Start with a free public identity that can later connect pageant history, placements and candidate-specific professional relationships."],
      suppliers:["Manage candidate relationships","/dashboard/","Invite personal suppliers or confirm supplier-submitted credits that accurately describe work done directly for you."],
      history:["Manage your pageant record","/dashboard/","Keep pageant editions, placements and candidate-level credits structured inside one professional identity."],
    },
    organization:{
      claim:["Claim your organization","/organization/","Create or claim the organization identity, establish authority and add the people allowed to manage it."],
      editions:["Manage editions and candidates","/organization/","Build the organization’s structured pageant history before adding official supplier relationships."],
      official:["Manage official supplier relationships","/organization/","Invite professionals through PageantIndex and confirm only the official pageant-level roles your organization actually recognizes."],
    },
  };

  let selectedRole = null;
  let selectedGoal = null;

  function brand(){return `<a class="brand" href="/"><img src="/public/images/pageant-icon.png" alt=""><div><strong>PageantIndex</strong><span>The Global Network for Pageantry</span></div></a>`;}

  function lifecycle(){return `<div class="lifecycle launch-life">${[
    ["01","Discover"],["02","Create / Claim"],["03","Build Profile"],["04","Connect Credits"],["05","Confirm Relationships"],["06","Get Discovered"]
  ].map(([n,label])=>`<div class="life"><small>${n}</small><strong>${label}</strong></div>`).join("")}</div>`;}

  function resultHTML(){
    if(!selectedRole || !selectedGoal) return "";
    const [title,url,copy] = routes[selectedRole][selectedGoal];
    return `<section class="result" aria-live="polite"><div><small>Your next PageantIndex step</small><h3>${title}</h3><p>${copy}</p></div><div class="result-actions"><a class="secondary" href="/directory/">Search the index</a><a class="primary" href="${url}">Continue →</a></div></section>`;
  }

  function renderGoals(){
    const wrap=document.getElementById("goal-wrap");
    if(!wrap) return;
    if(!selectedRole){wrap.innerHTML="";return;}
    wrap.innerHTML=`<div class="goal-wrap"><div class="step-head"><div><small>Step 2</small><h2>What do you need to do now?</h2><p>The launch experience stays focused on identity, profiles, credits, invitations, confirmations and verification.</p></div></div><div class="goal-grid">${goals[selectedRole].map(([id,name,copy])=>`<button class="goal ${selectedGoal===id?"selected":""}" data-goal="${id}"><strong>${name}</strong><span>${copy}</span></button>`).join("")}</div>${resultHTML()}</div>`;
    bindGoals();
  }

  function render(){
    root.innerHTML=`<div class="shell"><header class="topbar">${brand()}<div class="grow"></div><a class="toplink" href="/directory/">Search the index</a><a class="toplink" href="/sign-in/">Sign in</a></header><main class="main">
      <section class="hero"><div><h1>Build your professional identity in pageantry.</h1><p>PageantIndex is building the global professional identity and relationship infrastructure for pageantry, starting with public profiles, verified professional history and a connected industry network.</p></div><aside class="hero-side"><strong>Global from day one.</strong><p>The Philippines is the first market we actively populate and operationalize. PageantIndex remains one platform, one brand, one database and one set of standards worldwide.</p></aside></section>
      ${lifecycle()}
      <section class="panel journey"><div class="step-head"><div><small>Step 1</small><h2>Who are you in pageantry?</h2><p>At launch, PageantIndex is intentionally simple. Suppliers, candidates and organizations create or claim free profiles, manage structured credits and relationships, and publish polished public identities.</p></div><button class="reset" id="reset">Reset</button></div><div class="role-grid launch-role-grid">${roles.map(r=>`<button class="role ${selectedRole===r.id?"selected":""}" data-role="${r.id}"><span class="icon">${r.icon}</span><strong>${r.name}</strong><span>${r.copy}</span></button>`).join("")}</div><div id="goal-wrap"></div></section>

      <section class="blueprint"><h2>The launch product</h2><p>The visible PageantIndex product is deliberately narrow. The value comes from making each profile useful, trustworthy and connected, not from exposing every future module at once.</p><div class="rails launch-rails">
        <article class="panel rail"><small>01</small><h3>Landing Page</h3><p>Discover PageantIndex, search the index, understand the platform and create or claim a free profile.</p><ul><li>Global discovery</li><li>Searchable index</li><li>Create or claim profile</li><li>Clear platform explanation</li></ul><a href="/">Open PageantIndex →</a></article>
        <article class="panel rail"><small>02</small><h3>Dashboard / Profile Creation</h3><p>Manage identity, portfolio, credits, invitations, confirmations and verification from one private workspace.</p><ul><li>Profile and portfolio</li><li>Credits and relationships</li><li>Invitations and confirmations</li><li>Identity verification</li></ul><a href="/dashboard/">Open dashboard →</a></article>
        <article class="panel rail"><small>03</small><h3>Public Profile</h3><p>A polished, shareable professional page anyone can open without logging in.</p><ul><li>Identity and category</li><li>Bio, services and portfolio</li><li>Pageant credits and confirmations</li><li>Official links and contact options</li></ul><a href="/directory/">Search public profiles →</a></article>
      </div></section>

      <section class="blueprint graph-section"><h2>The relationship graph is the moat</h2><p>PageantIndex does not flatten every pageant relationship into a generic credit. The platform records exactly who worked with whom, where, when and in what role.</p><div class="graph-line"><strong>Pageant Name</strong><span>+</span><strong>Year / Edition</strong><span>+</span><strong>Candidate</strong><span>+</span><strong>Supplier</strong><span>+</span><strong>Role</strong></div><div class="rails launch-rails">
        <article class="panel rail"><small>Candidate relationship</small><h3>Personal supplier</h3><p>A supplier who worked directly with a candidate is shown as candidate-specific.</p><ul><li>Photographer for Candidate X · Miss Pageant 2026</li><li>Candidate can confirm the relationship</li><li>Not automatically an official pageant supplier</li></ul></article>
        <article class="panel rail"><small>Organization relationship</small><h3>Official supplier</h3><p>Only the organization can confirm an official pageant-level role.</p><ul><li>Official Photographer · Miss Pageant 2026</li><li>Organization confirms the role</li><li>Separate from personal candidate suppliers</li></ul></article>
        <article class="panel rail"><small>Self-added history</small><h3>Unconfirmed until approved</h3><p>Suppliers may add previous credits themselves, but PageantIndex keeps the confirmation state explicit.</p><ul><li>Self-added does not equal verified</li><li>Candidate or organization can confirm</li><li>History grows without overstating trust</li></ul></article>
      </div></section>

      <section class="blueprint"><h2>Three separate trust layers</h2><p>PageantIndex confirms identity and records relationship confirmations without pretending to decide who is “best.”</p><div class="rails launch-rails trust-rails">
        <article class="panel rail"><small>Identity Verified</small><h3>Who you are</h3><p>PageantIndex confirms the person using identity evidence and selfie/liveness checks.</p></article>
        <article class="panel rail"><small>Candidate Confirmed</small><h3>Worked directly with this candidate</h3><p>The candidate confirms that the supplier worked directly with her in the stated role.</p></article>
        <article class="panel rail"><small>Organization Confirmed</small><h3>Official pageant-level role</h3><p>The organization confirms that the professional held the stated official role for that pageant edition.</p></article>
      </div></section>

      <section class="future"><div><small>Later, not launch-facing</small><h2>The broader ecosystem stays in the architecture.</h2><p>PageantIndex Privileges, hotels, airlines, tourism, ticketing, voting, tabulation, analytics, advertising, booking and business tools remain part of the long-term platform. They do not appear publicly until they are ready.</p></div><div class="future-note"><strong>Growth strategy</strong><p>Benefits first: secure useful hotel and airline privileges, then invite organizations to claim free profiles and bring candidates, teams and suppliers into the network.</p></div></section>

      <section class="network-loop"><h2>Partners → organizations → candidates → suppliers → credits → stronger network.</h2><p>Basic profiles remain free because completeness of the index is itself the asset. PageantIndex monetizes around the network, not simply by charging people to exist.</p></section>
      <div class="footer-note">Launch blueprint: one global platform, one brand, one database and one set of standards. Country partners are a commercial expansion layer, not separate PageantIndex products.</div>
    </main></div>`;
    document.querySelectorAll("[data-role]").forEach(btn=>btn.addEventListener("click",()=>{selectedRole=btn.dataset.role;selectedGoal=null;document.querySelectorAll("[data-role]").forEach(x=>x.classList.toggle("selected",x===btn));renderGoals();document.getElementById("goal-wrap")?.scrollIntoView({behavior:"smooth",block:"nearest"});}));
    document.getElementById("reset")?.addEventListener("click",()=>{selectedRole=null;selectedGoal=null;render();});
    renderGoals();
  }

  function bindGoals(){document.querySelectorAll("[data-goal]").forEach(btn=>btn.addEventListener("click",()=>{selectedGoal=btn.dataset.goal;renderGoals();document.querySelector(".result")?.scrollIntoView({behavior:"smooth",block:"nearest"});}));}
  render();
})();
