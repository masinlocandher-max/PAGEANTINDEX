"use strict";

(() => {
  const root = document.getElementById("platform-app");
  if (!root) return;

  const modules = [
    ["overview", "Overview", "◎", "Workspace"],
    ["applications", "Applications", "A", "Competition"],
    ["candidates", "Candidates", "C", "Competition"],
    ["schedule", "Schedule", "S", "Competition"],
    ["judging", "Judging & Tabulation", "J", "Event night"],
    ["voting", "Voting", "V", "Event night"],
    ["tickets", "Tickets", "T", "Event night"],
    ["record", "Official Event Record", "R", "Network"],
    ["marketplace", "Marketplace", "M", "Network"],
    ["intelligence", "Intelligence", "I", "Network"],
  ];

  const state = {
    activeModule: "overview",
    applicationFilter: "all",
    criteria: [
      {name: "Preliminary Interview", weight: 35},
      {name: "Evening Gown", weight: 25},
      {name: "Swimsuit", weight: 20},
      {name: "Advocacy", weight: 20},
    ],
    applications: [
      {id: "APP-001", name: "Candidate 01", representation: "Delegation 01", status: "screening", completion: 92},
      {id: "APP-002", name: "Candidate 02", representation: "Delegation 02", status: "submitted", completion: 100},
      {id: "APP-003", name: "Candidate 03", representation: "Delegation 03", status: "changes", completion: 74},
      {id: "APP-004", name: "Candidate 04", representation: "Delegation 04", status: "accepted", completion: 100},
    ],
    candidates: [
      {id: "01", name: "Candidate 01", representation: "Delegation 01", progress: 88, status: "confirmed"},
      {id: "02", name: "Candidate 02", representation: "Delegation 02", progress: 64, status: "requirements"},
      {id: "03", name: "Candidate 03", representation: "Delegation 03", progress: 100, status: "confirmed"},
      {id: "04", name: "Candidate 04", representation: "Delegation 04", progress: 51, status: "requirements"},
    ],
    judges: [
      {name: "Judge 01", status: "ready", submitted: "Round ready"},
      {name: "Judge 02", status: "ready", submitted: "Round ready"},
      {name: "Judge 03", status: "pending", submitted: "Awaiting access"},
      {name: "Judge 04", status: "ready", submitted: "Round ready"},
      {name: "Judge 05", status: "pending", submitted: "Invite not sent"},
    ],
    previewScores: [
      {rank: 1, name: "Candidate 03", score: "91.84"},
      {rank: 2, name: "Candidate 01", score: "90.72"},
      {rank: 3, name: "Candidate 04", score: "88.63"},
      {rank: 4, name: "Candidate 02", score: "87.95"},
    ],
    ticketTiers: [
      {name: "General Admission", detail: "Open seating", price: "₱0 preview", status: "Draft"},
      {name: "VIP", detail: "Reserved section", price: "₱0 preview", status: "Draft"},
      {name: "VVIP", detail: "Premium package", price: "₱0 preview", status: "Draft"},
    ],
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);

  const labelForStatus = (status) => ({
    submitted: ["Submitted", "review"],
    screening: ["Screening", "pending"],
    changes: ["Changes requested", "blocked"],
    accepted: ["Accepted", "ready"],
    confirmed: ["Confirmed", "ready"],
    requirements: ["Requirements", "pending"],
    draft: ["Draft", "neutral"],
  }[status] || [String(status || "Pending"), "neutral"]);

  const statusHtml = (status) => {
    const [label, kind] = labelForStatus(status);
    return `<span class="status ${kind}">${escapeHtml(label)}</span>`;
  };

  function sidebar() {
    let currentGroup = "";
    const buttons = modules.map(([id, label, icon, group]) => {
      const groupLabel = group !== currentGroup ? `<div class="nav-group">${escapeHtml(group)}</div>` : "";
      currentGroup = group;
      return `${groupLabel}<button data-module="${id}" class="${state.activeModule === id ? "active" : ""}"><span class="nav-icon">${icon}</span><span>${escapeHtml(label)}</span></button>`;
    }).join("");
    return `<aside class="platform-sidebar">
      <div class="brand-lockup"><img src="/public/images/pageant-icon.png" alt=""><div><strong>PageantIndex</strong><span>The Global Network for Pageantry</span></div></div>
      <div class="preview-chip"><b>Front-end preview</b><br>Structure only. No live competition records, payments, votes, scores or tickets are being written.</div>
      <nav class="platform-nav" aria-label="Organizer workspace">${buttons}</nav>
      <div class="sidebar-footer"><a href="/app/">Back to PageantIndex app</a></div>
    </aside>`;
  }

  function shell() {
    root.innerHTML = `<div class="platform-shell">
      ${sidebar()}
      <main class="platform-main">
        <header class="platform-topbar">
          <button class="mobile-menu" data-menu-toggle aria-label="Open navigation">☰</button>
          <div class="workspace-switch"><small>Organizer workspace</small><strong>Untitled Pageant · Front-end Preview</strong></div>
          <div class="topbar-spacer"></div>
          <div class="topbar-actions">
            <button class="ghost-btn" data-action="preview-public">Preview public page</button>
            <button class="soft-btn" data-action="save-preview">Save preview</button>
            <button class="icon-btn" data-action="help" aria-label="Help">?</button>
          </div>
        </header>
        <div class="platform-content" id="platform-content"></div>
      </main>
      <nav class="mobile-tabbar" aria-label="Quick modules">
        ${[["overview","⌂","Home"],["candidates","C","Candidates"],["judging","J","Judging"],["voting","V","Voting"],["tickets","T","Tickets"]].map(([id,icon,label]) => `<button data-module="${id}" class="${state.activeModule === id ? "active" : ""}"><b>${icon}</b>${label}</button>`).join("")}
      </nav>
      <div class="drawer-backdrop" id="drawer-backdrop"><aside class="drawer" id="drawer"></aside></div>
      <div class="toast" id="toast"></div>
    </div>`;
    renderActiveModule();
    bindGlobalEvents();
  }

  const header = (title, description, actions = "") => `<div class="module-header"><div class="module-title"><h1>${title}</h1><p>${description}</p></div><div class="module-actions">${actions}</div></div>`;
  const notice = (copy) => `<div class="notice"><span>i</span><div>${copy}</div></div>`;
  const panelHead = (title, copy = "", action = "") => `<div class="panel-head"><div><h2>${title}</h2>${copy ? `<p>${copy}</p>` : ""}</div>${action}</div>`;

  function overviewModule() {
    return `<section class="module active">
      ${header("Pageant command center", "One operating surface for applications, candidate readiness, schedules, judging, voting, tickets and the permanent PageantIndex event record.", `<button class="primary-btn" data-module="applications">Open applications</button>`)}
      ${notice("This screen intentionally uses <strong>preview-only placeholders</strong>. When the database is connected, the same components can bind to real organizer, candidate, event and transaction records.")}
      <div class="grid four">
        <article class="panel kpi preview"><small>Applications</small><strong>Workflow ready</strong><span>Submission, screening, changes, acceptance and confirmation states are structured.</span></article>
        <article class="panel kpi preview"><small>Competition</small><strong>Candidate OS ready</strong><span>Requirements, schedules and readiness views now have dedicated surfaces.</span></article>
        <article class="panel kpi preview"><small>Event night</small><strong>Control layer ready</strong><span>Judging, tabulation, voting and ticket modules are separated and navigable.</span></article>
        <article class="panel kpi preview"><small>Pageant record</small><strong>Permanent record ready</strong><span>The edition can later connect candidates, judges, results, suppliers and media.</span></article>
      </div>
      <div class="grid two" style="margin-top:16px">
        <section class="panel pad-lg">
          ${panelHead("Launch structure", "Front-end completion map for one pageant edition.")}
          <div class="setup-list">
            ${[
              ["Pageant edition & organizer identity","ready","Base workspace"],
              ["Applications & screening","ready","Native organizer flow"],
              ["Candidate requirements & schedules","ready","Competition operations"],
              ["Judging & tabulation","ready","Event-night scoring surface"],
              ["Public voting","ready","Campaign and ballot front end"],
              ["Ticket selling","ready","Inventory and purchase front end"],
              ["Official event record","ready","Permanent PageantIndex record"],
              ["Marketplace & intelligence","pending","Front-end shells prepared for real data"],
            ].map(([name,status,detail]) => `<div class="setup-item"><span class="status-dot ${status}"></span><div class="setup-copy"><strong>${name}</strong><span>${detail}</span></div>${status === "ready" ? '<span class="status ready">Structured</span>' : '<span class="status pending">Data later</span>'}</div>`).join("")}
          </div>
        </section>
        <section class="panel pad-lg">
          ${panelHead("Coronation readiness", "Operational checklist, not a live score.")}
          <div class="check-list">
            ${[
              ["Candidate roster",86],
              ["Requirements",64],
              ["Judge access",72],
              ["Voting campaign",48],
              ["Ticket setup",35],
            ].map(([label,value]) => `<div class="check-item"><div class="row-copy"><strong>${label}</strong><span>Preview progress</span></div><div style="width:130px"><div class="progress"><span style="width:${value}%"></span></div></div></div>`).join("")}
          </div>
          <button class="ghost-btn" style="width:100%;margin-top:12px" data-module="schedule">Review master schedule</button>
        </section>
      </div>
    </section>`;
  }

  function applicationsModule() {
    const counts = state.applications.reduce((acc,item) => ((acc[item.status]=(acc[item.status]||0)+1),acc),{});
    const filters = [["all","All"],["submitted","Submitted"],["screening","Screening"],["changes","Changes"],["accepted","Accepted"]];
    const rows = state.applications.filter(item => state.applicationFilter === "all" || item.status === state.applicationFilter);
    return `<section class="module active">
      ${header("Applications", "Manage the complete candidate intake journey inside PageantIndex instead of sending organizers back to forms, spreadsheets and message threads.", `<button class="ghost-btn" data-action="application-form">Public application form</button><button class="primary-btn" data-action="new-application">Add application</button>`)}
      <div class="grid four" style="margin-bottom:16px">
        <article class="panel kpi"><small>Preview total</small><strong>${state.applications.length}</strong><span>Front-end sample records</span></article>
        <article class="panel kpi"><small>Submitted</small><strong>${counts.submitted||0}</strong><span>Awaiting first review</span></article>
        <article class="panel kpi"><small>Screening</small><strong>${counts.screening||0}</strong><span>Organizer review stage</span></article>
        <article class="panel kpi"><small>Accepted</small><strong>${counts.accepted||0}</strong><span>Ready for roster conversion</span></article>
      </div>
      <section class="panel pad">
        <div class="filters">${filters.map(([id,label]) => `<button class="filter-btn ${state.applicationFilter===id?"active":""}" data-application-filter="${id}">${label}</button>`).join("")}</div>
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Applicant</th><th>Representation</th><th>Completion</th><th>Status</th><th></th></tr></thead><tbody>
        ${rows.map(item => `<tr><td class="table-main"><strong>${item.name}</strong><span>${item.id}</span></td><td>${item.representation}</td><td><div class="progress" style="width:110px"><span style="width:${item.completion}%"></span></div><span style="display:block;margin-top:5px;color:var(--pi-muted);font-size:9px">${item.completion}% preview</span></td><td>${statusHtml(item.status)}</td><td><button class="ghost-btn" data-open-application="${item.id}">Review</button></td></tr>`).join("")}
        </tbody></table></div>
      </section>
    </section>`;
  }

  function candidatesModule() {
    return `<section class="module active">
      ${header("Candidates", "A competition-ready candidate workspace for requirements, attendance, media, rehearsals and readiness across the entire pageant journey.", `<button class="ghost-btn" data-action="export-roster">Export roster</button><button class="primary-btn" data-action="add-candidate">Add candidate</button>`)}
      <div class="split">
        <section class="stack">
          ${state.candidates.map(item => `<article class="candidate-card panel"><div class="candidate-avatar">${item.id}</div><div><h3>${item.name}</h3><p>${item.representation}</p><div class="candidate-meta"><div class="candidate-progress"><div class="progress"><span style="width:${item.progress}%"></span></div></div><span style="font-size:9px;color:var(--pi-muted)">${item.progress}% ready</span></div></div>${statusHtml(item.status)}</article>`).join("")}
        </section>
        <aside class="panel pad-lg">
          ${panelHead("Requirements template", "These become real per-candidate checklists after database connection.")}
          <div class="simple-list">
            ${["Identity & eligibility","Official headshot","Advocacy materials","Medical / safety requirements","Talent / production files","Sponsor commitments","Wardrobe & measurements","Travel / accommodation"].map((label,index) => `<div class="simple-row"><span class="status-dot ${index<3?"ready":"pending"}"></span><div class="row-copy"><strong>${label}</strong><span>${index<3?"Configured":"Ready to configure"}</span></div></div>`).join("")}
          </div>
          <button class="soft-btn" style="width:100%;margin-top:12px" data-action="edit-requirements">Edit checklist template</button>
        </aside>
      </div>
    </section>`;
  }

  function scheduleModule() {
    return `<section class="module active">
      ${header("Master schedule", "Keep official activities, candidate call times, rehearsals, media obligations and production milestones in one pageant-specific timeline.", `<button class="ghost-btn" data-action="calendar-view">Calendar view</button><button class="primary-btn" data-action="add-schedule">Add activity</button>`)}
      <div class="grid two">
        <section class="panel pad-lg">
          ${panelHead("Pageant week", "Preview timeline")}
          <div class="timeline">
            ${[
              ["Day 01 · 09:00","Candidate arrival & registration","Operations · All candidates"],
              ["Day 01 · 14:00","Official orientation","Organizer · Mandatory"],
              ["Day 02 · 08:00","Official photoshoot","Media · Call time 07:30"],
              ["Day 03 · 13:00","Preliminary interviews","Judging · Closed door"],
              ["Day 04 · 18:00","Preliminary competition","Production · Full technical run"],
              ["Day 05 · 19:00","Grand coronation","Event night · Doors 17:30"],
            ].map(([time,title,detail]) => `<div class="timeline-item"><time>${time}</time><strong>${title}</strong><span>${detail}</span></div>`).join("")}
          </div>
        </section>
        <section class="panel pad-lg">
          ${panelHead("Operational layers", "Each activity can later have owners, venues, attendees and dependencies.")}
          <div class="setup-list">
            ${[
              ["Candidate schedule","ready","Call times and required attendance"],
              ["Production schedule","ready","Stage, lights, sound and rehearsals"],
              ["Judging schedule","ready","Interview and competition rounds"],
              ["Sponsor obligations","pending","Appearances and deliverables"],
              ["Media schedule","ready","Photoshoots, interviews and press"],
            ].map(([name,status,detail]) => `<div class="setup-item"><span class="status-dot ${status}"></span><div class="setup-copy"><strong>${name}</strong><span>${detail}</span></div></div>`).join("")}
          </div>
        </section>
      </div>
    </section>`;
  }

  function judgingModule() {
    return `<section class="module active">
      ${header("Judging & tabulation", "PageantIndex-native competition infrastructure: criteria, judge access, scoring rounds, locks, audit states and certified results. Front end first, scoring engine next.", `<button class="ghost-btn" data-action="judge-preview">Judge view</button><button class="primary-btn" data-action="lock-round">Lock round</button>`)}
      ${notice("Preview scores below are <strong>interface sample values only</strong>. No official scoring or tabulation is occurring in this front-end branch.")}
      <div class="split">
        <section class="stack">
          <div class="panel pad-lg">
            ${panelHead("Scoring criteria", "Weights should total 100%.", `<button class="soft-btn" data-action="add-criterion">+ Criterion</button>`)}
            <div class="criteria-list" id="criteria-list">
              ${state.criteria.map((criterion,index) => `<div class="criteria-row"><input value="${escapeHtml(criterion.name)}" data-criterion-name="${index}" aria-label="Criterion name"><input type="number" min="0" max="100" value="${criterion.weight}" data-criterion-weight="${index}" aria-label="Criterion weight"><button data-remove-criterion="${index}" aria-label="Remove criterion">×</button></div>`).join("")}
            </div>
            <div class="simple-row" style="margin-top:8px"><div class="row-copy"><strong>Total weight</strong><span>Competition rule check</span></div><strong id="criteria-total">${state.criteria.reduce((sum,item)=>sum+Number(item.weight||0),0)}%</strong></div>
          </div>
          <div class="panel pad-lg">
            ${panelHead("Judge access", "Role-specific judge workspace status")}
            <div class="judge-grid">${state.judges.map(judge => `<article class="judge-card"><strong>${judge.name}</strong><span>${judge.submitted}</span><footer><span class="status ${judge.status === "ready" ? "ready" : "pending"}">${judge.status === "ready" ? "Ready" : "Pending"}</span><button class="ghost-btn" data-action="judge-access">Manage</button></footer></article>`).join("")}</div>
          </div>
        </section>
        <aside class="panel pad-lg">
          ${panelHead("Tabulation preview", "Weighted ranking interface")}
          <div class="scoreboard">${state.previewScores.map(row => `<div class="score-row"><div class="score-rank">${row.rank}</div><div><strong>${row.name}</strong><span>Preview candidate</span></div><span class="score-value">${row.score}</span></div>`).join("")}</div>
          <div class="simple-row" style="margin-top:12px"><span class="status-dot pending"></span><div class="row-copy"><strong>Certification state</strong><span>Not connected · cannot publish official results</span></div></div>
          <button class="danger-btn" style="width:100%;margin-top:10px" data-action="publish-disabled">Publish official results</button>
        </aside>
      </div>
    </section>`;
  }

  function votingModule() {
    return `<section class="module active">
      ${header("Voting", "Build public People’s Choice and fan-voting campaigns directly inside PageantIndex, with transparent rules, candidate ballots, payment-ready vote packages and future fraud controls.", `<button class="ghost-btn" data-action="vote-rules">Voting rules</button><button class="primary-btn" data-action="new-vote-campaign">Create campaign</button>`)}
      <div class="vote-preview">
        <section class="stack">
          <div class="panel pad-lg">
            ${panelHead("Campaign setup", "Preview configuration")}
            <div class="form-grid">
              <div class="form-field"><label>Campaign name</label><input value="People's Choice · Preview"></div>
              <div class="form-field"><label>Voting model</label><select><option>Free voting</option><option>Paid voting</option><option>Hybrid voting</option></select></div>
              <div class="form-field"><label>Starts</label><input type="datetime-local"></div>
              <div class="form-field"><label>Ends</label><input type="datetime-local"></div>
              <div class="form-field full"><label>Public rules</label><textarea placeholder="Explain eligibility, vote limits, closing rules and winner determination."></textarea></div>
            </div>
          </div>
          <div class="panel pad-lg">
            ${panelHead("Vote architecture", "The database phase should bind these components to a tamper-resistant vote ledger.")}
            <div class="setup-list">
              ${[
                ["Campaign","ready","Public title, schedule and eligibility"],
                ["Ballot","ready","Eligible candidates and public candidate cards"],
                ["Vote packages","ready","Free, paid or sponsor-backed rules"],
                ["Vote ledger","pending","Database-backed immutable vote records"],
                ["Fraud controls","pending","Rate, payment and anomaly checks"],
                ["Certification","pending","Closed campaign result and audit summary"],
              ].map(([name,status,detail]) => `<div class="setup-item"><span class="status-dot ${status}"></span><div class="setup-copy"><strong>${name}</strong><span>${detail}</span></div></div>`).join("")}
            </div>
          </div>
        </section>
        <aside class="phone-preview">
          <div class="phone-screen"><div class="phone-head"><strong>People's Choice</strong><span>Public voting preview · PageantIndex</span></div><div class="vote-card"><div class="candidate-avatar">01</div><h3>Candidate 01</h3><p>Delegation 01</p><button data-action="preview-vote">Vote for Candidate 01</button></div><div class="vote-card"><div class="candidate-avatar">02</div><h3>Candidate 02</h3><p>Delegation 02</p><button data-action="preview-vote">Vote for Candidate 02</button></div></div>
        </aside>
      </div>
    </section>`;
  }

  function ticketsModule() {
    return `<section class="module active">
      ${header("Tickets", "A PageantIndex-native event sales front end for ticket classes, capacity, orders, QR admission and check-in. Payment and inventory persistence will connect later.", `<button class="ghost-btn" data-action="ticket-preview">Buyer view</button><button class="primary-btn" data-action="new-ticket-tier">Add ticket tier</button>`)}
      ${notice("Ticket values are placeholders. This branch does not charge users, issue valid QR tickets or reserve venue inventory.")}
      <section class="panel">
        ${state.ticketTiers.map(item => `<div class="ticket-tier"><div><strong>${item.name}</strong><span style="display:block;margin-top:4px">${item.detail}</span></div><span class="ticket-price">${item.price}</span><span class="status neutral">${item.status}</span><button class="ghost-btn" data-action="edit-ticket">Edit</button></div>`).join("")}
      </section>
      <div class="grid three" style="margin-top:16px">
        <article class="panel pad-lg">${panelHead("Checkout", "Buyer identity, order summary and payment handoff.")}<div class="empty-state"><h3>Checkout surface ready</h3><p>Connect payment provider and order persistence during the database phase.</p></div></article>
        <article class="panel pad-lg">${panelHead("QR admission", "One unique ticket credential per issued ticket.")}<div class="empty-state"><h3>Scanner state ready</h3><p>Check-in, duplicate-scan prevention and gate device state will connect later.</p></div></article>
        <article class="panel pad-lg">${panelHead("Settlement", "Organizer revenue, fees, refunds and payout status.")}<div class="empty-state"><h3>Financial view ready</h3><p>No financial figures are shown until real transaction records exist.</p></div></article>
      </div>
    </section>`;
  }

  function recordModule() {
    return `<section class="module active">
      ${header("Official event record", "The permanent PageantIndex edition record that survives long after coronation night and connects the people, results and businesses behind the event.", `<button class="ghost-btn" data-action="record-preview">Public record preview</button><button class="primary-btn" data-action="prepare-record">Prepare for review</button>`)}
      <div class="record-hero"><small>PageantIndex Event ID · preview</small><h2>Untitled Pageant · 2027 Edition</h2><p>This becomes the canonical record for the pageant edition: organization, candidates, judges, placements, sponsors, suppliers, media and verified official sources.</p><span class="record-id">PI-EVENT-PREVIEW-2027</span></div>
      <div class="grid two" style="margin-top:16px">
        <section class="panel pad-lg">
          ${panelHead("Record relationships", "The permanent graph behind the public page.")}
          <div class="relation-map">
            ${[
              ["Organization","Organizer profile","Owns this edition record"],
              ["Candidates","Roster + profile links","Participants and title history"],
              ["Judges","Verified judge identities","Panel and competition rounds"],
              ["Results","Certified placements","Winner, court and awards"],
              ["Suppliers","Professional profiles","Designers, HMU, photo, production"],
              ["Sponsors","Brand relationships","Official event partners"],
              ["Media","Articles + official assets","Coverage and source history"],
              ["Voting","Certified campaign","Public engagement record"],
              ["Tickets","Event commerce","Attendance infrastructure"],
            ].map(([type,title,copy]) => `<article class="relation-node"><span>${type}</span><strong>${title}</strong><p>${copy}</p></article>`).join("")}
          </div>
        </section>
        <aside class="panel pad-lg">
          ${panelHead("Publication checks", "What must be resolved before an edition becomes an official PageantIndex record.")}
          <div class="setup-list">
            ${[
              ["Organization ownership","ready"],
              ["Edition dates & venue","pending"],
              ["Candidate roster","ready"],
              ["Judge panel","pending"],
              ["Official results","pending"],
              ["Source links","pending"],
            ].map(([name,status]) => `<div class="setup-item"><span class="status-dot ${status}"></span><div class="setup-copy"><strong>${name}</strong><span>${status === "ready" ? "Structure present" : "Complete before publication"}</span></div></div>`).join("")}
          </div>
        </aside>
      </div>
    </section>`;
  }

  function marketplaceModule() {
    return `<section class="module active">
      ${header("Marketplace", "Move from directory discovery to organizer sourcing: search professionals, build a shortlist, invite suppliers and eventually manage quotes, contracts, delivery and reviews.", `<button class="primary-btn" data-action="new-sourcing">Create sourcing request</button>`)}
      <section class="panel pad-lg">
        <div class="marketplace-search"><input placeholder="Search photographer, designer, tabulation, production…"><select><option>All categories</option><option>Designers</option><option>Photography</option><option>Voting & Tabulation</option><option>Production</option></select><select><option>Any location</option><option>Local</option><option>Available for travel</option></select><button class="primary-btn" data-action="market-search">Search</button></div>
        <div class="category-rail" style="margin-top:12px">${["Designers","Hair & Makeup","Photography","Pageant Camps","Coaches","Production","Voting & Tabulation","Venues","PR & Digital"].map(name => `<button data-action="category-filter">${name}</button>`).join("")}</div>
      </section>
      <div class="grid two" style="margin-top:16px">
        <section class="panel pad-lg">${panelHead("Supplier results", "Real reviewed PageantIndex supplier profiles will appear here.")}<div class="empty-state"><h3>No fabricated suppliers</h3><p>The interface is ready, but this preview will not invent businesses or reviews. Connect the existing verified supplier directory during the data phase.</p><button class="soft-btn" style="margin-top:14px" data-action="market-search">Test search state</button></div></section>
        <section class="panel pad-lg">${panelHead("Sourcing pipeline", "Future organizer workflow")}
          <div class="setup-list">${[
            ["Discover","ready","Search verified profiles"],
            ["Shortlist","ready","Save suppliers to the edition"],
            ["Invite","ready","Send a structured project inquiry"],
            ["Quote","pending","Receive and compare commercial offers"],
            ["Hire","pending","Contract and payment layer"],
            ["Review","pending","Verified post-project reputation"],
          ].map(([name,status,detail]) => `<div class="setup-item"><span class="status-dot ${status}"></span><div class="setup-copy"><strong>${name}</strong><span>${detail}</span></div></div>`).join("")}</div>
        </section>
      </div>
    </section>`;
  }

  function intelligenceModule() {
    return `<section class="module active">
      ${header("PageantIndex Intelligence", "The data layer that eventually turns structured pageant records into defensible industry insight for organizers, brands, media and professionals.", `<button class="ghost-btn" data-action="metric-definitions">Metric definitions</button>`)}
      ${notice("No invented analytics are shown. These panels are deliberate zero-data states until production events, profiles, inquiries, scores, votes and transactions create real records.")}
      <div class="intelligence-grid">
        <article class="panel pad-lg">${panelHead("Edition performance", "Applications, engagement, attendance and event operations.")}<div class="chart-placeholder"><div><strong>Awaiting real event data</strong><span>Connect the organizer, voting and ticketing tables before plotting trends.</span></div></div></article>
        <article class="panel pad-lg">${panelHead("Industry relationships", "Organizations, candidates, suppliers, sponsors and outcomes.")}<div class="chart-placeholder"><div><strong>Relationship graph ready</strong><span>The official event record becomes the source for this network intelligence.</span></div></div></article>
        <article class="panel pad-lg">${panelHead("Supplier intelligence", "Demand, inquiries, category gaps and organizer sourcing.")}<div class="chart-placeholder"><div><strong>Marketplace telemetry pending</strong><span>Use source-backed inquiry and match records only.</span></div></div></article>
        <article class="panel pad-lg">${panelHead("Pageant history", "Placements, titleholders, country and organization performance over time.")}<div class="chart-placeholder"><div><strong>Historical dataset pending</strong><span>Build from reviewed PageantIndex records, never scraped or inferred claims without sources.</span></div></div></article>
      </div>
    </section>`;
  }

  const renderers = {
    overview: overviewModule,
    applications: applicationsModule,
    candidates: candidatesModule,
    schedule: scheduleModule,
    judging: judgingModule,
    voting: votingModule,
    tickets: ticketsModule,
    record: recordModule,
    marketplace: marketplaceModule,
    intelligence: intelligenceModule,
  };

  function renderActiveModule() {
    const content = document.getElementById("platform-content");
    if (!content) return;
    content.innerHTML = (renderers[state.activeModule] || overviewModule)();
    document.querySelectorAll("[data-module]").forEach(button => button.classList.toggle("active", button.dataset.module === state.activeModule));
    bindModuleEvents();
  }

  function navigate(moduleId) {
    if (!renderers[moduleId]) return;
    state.activeModule = moduleId;
    renderActiveModule();
    document.querySelector(".platform-shell")?.classList.remove("menu-open");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function toast(message) {
    const element = document.getElementById("toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(window.__piToastTimer);
    window.__piToastTimer = setTimeout(() => element.classList.remove("show"), 2500);
  }

  function openDrawer(content) {
    const backdrop = document.getElementById("drawer-backdrop");
    const drawer = document.getElementById("drawer");
    if (!backdrop || !drawer) return;
    drawer.innerHTML = content;
    backdrop.classList.add("open");
    drawer.querySelectorAll("[data-drawer-close]").forEach(button => button.addEventListener("click", closeDrawer));
  }

  function closeDrawer() {
    document.getElementById("drawer-backdrop")?.classList.remove("open");
  }

  function applicationDrawer(item) {
    return `<div class="drawer-head"><div><h2>${escapeHtml(item.name)}</h2><p>${escapeHtml(item.id)} · ${escapeHtml(item.representation)} · front-end preview record</p></div><button class="drawer-close" data-drawer-close>×</button></div>
      <div class="grid two">
        <article class="panel kpi"><small>Completion</small><strong>${item.completion}%</strong><span>Preview checklist state</span></article>
        <article class="panel kpi"><small>Current stage</small><strong style="font-size:20px">${labelForStatus(item.status)[0]}</strong><span>Local front-end state</span></article>
      </div>
      <section class="panel pad" style="margin-top:16px"><div class="panel-head"><div><h3>Application review</h3><p>Future database fields can bind here without redesigning the screen.</p></div></div><div class="simple-list">
        ${["Identity & eligibility","Contact information","Representation","Biography & advocacy","Required documents","Official photo","Consent & declarations"].map((label,index)=>`<div class="simple-row"><span class="status-dot ${index < 5 ? "ready" : "pending"}"></span><div class="row-copy"><strong>${label}</strong><span>${index < 5 ? "Preview complete" : "Preview requires review"}</span></div></div>`).join("")}
      </div></section>
      <div class="drawer-actions"><button class="ghost-btn" data-drawer-close>Close</button><button class="soft-btn" data-application-stage="changes" data-application-id="${item.id}">Request changes</button><button class="primary-btn" data-application-stage="accepted" data-application-id="${item.id}">Accept applicant</button></div>`;
  }

  function bindGlobalEvents() {
    document.querySelectorAll("[data-module]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.module)));
    document.querySelector("[data-menu-toggle]")?.addEventListener("click", () => document.querySelector(".platform-shell")?.classList.toggle("menu-open"));
    document.getElementById("drawer-backdrop")?.addEventListener("click", event => {
      if (event.target?.id === "drawer-backdrop") closeDrawer();
    });
  }

  function bindModuleEvents() {
    document.querySelectorAll("[data-module]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.module)));

    document.querySelectorAll("[data-application-filter]").forEach(button => button.addEventListener("click", () => {
      state.applicationFilter = button.dataset.applicationFilter;
      renderActiveModule();
    }));

    document.querySelectorAll("[data-open-application]").forEach(button => button.addEventListener("click", () => {
      const item = state.applications.find(application => application.id === button.dataset.openApplication);
      if (!item) return;
      openDrawer(applicationDrawer(item));
      document.querySelectorAll("[data-application-stage]").forEach(stageButton => stageButton.addEventListener("click", () => {
        const application = state.applications.find(row => row.id === stageButton.dataset.applicationId);
        if (application) application.status = stageButton.dataset.applicationStage;
        closeDrawer();
        renderActiveModule();
        toast("Preview application stage updated locally. Nothing was written to production.");
      }));
    }));

    document.querySelectorAll("[data-criterion-name]").forEach(input => input.addEventListener("input", () => {
      const index = Number(input.dataset.criterionName);
      if (state.criteria[index]) state.criteria[index].name = input.value;
    }));
    document.querySelectorAll("[data-criterion-weight]").forEach(input => input.addEventListener("input", () => {
      const index = Number(input.dataset.criterionWeight);
      if (state.criteria[index]) state.criteria[index].weight = Number(input.value || 0);
      const total = state.criteria.reduce((sum,item)=>sum+Number(item.weight||0),0);
      const totalElement = document.getElementById("criteria-total");
      if (totalElement) totalElement.textContent = `${total}%`;
    }));
    document.querySelectorAll("[data-remove-criterion]").forEach(button => button.addEventListener("click", () => {
      state.criteria.splice(Number(button.dataset.removeCriterion),1);
      renderActiveModule();
    }));

    document.querySelectorAll("[data-action]").forEach(button => button.addEventListener("click", () => handleAction(button.dataset.action)));
  }

  function handleAction(action) {
    if (action === "add-criterion") {
      state.criteria.push({name:"New criterion",weight:0});
      renderActiveModule();
      return;
    }
    if (action === "new-application") {
      const next = String(state.applications.length + 1).padStart(2,"0");
      state.applications.push({id:`APP-00${state.applications.length+1}`,name:`Candidate ${next}`,representation:`Delegation ${next}`,status:"submitted",completion:0});
      renderActiveModule();
      toast("Preview application added locally.");
      return;
    }
    if (action === "add-candidate") {
      const next = String(state.candidates.length + 1).padStart(2,"0");
      state.candidates.push({id:next,name:`Candidate ${next}`,representation:`Delegation ${next}`,progress:0,status:"requirements"});
      renderActiveModule();
      toast("Preview candidate added locally.");
      return;
    }
    if (action === "new-ticket-tier") {
      state.ticketTiers.push({name:"New ticket tier",detail:"Configure access",price:"₱0 preview",status:"Draft"});
      renderActiveModule();
      toast("Preview ticket tier added locally.");
      return;
    }
    if (action === "publish-disabled") {
      toast("Official result publishing stays disabled until the real scoring and audit backend is connected.");
      return;
    }
    if (action === "preview-vote") {
      toast("Preview only. No vote was recorded or charged.");
      return;
    }
    if (action === "save-preview") {
      try {
        localStorage.setItem("pageantindex_frontend_preview", JSON.stringify({criteria:state.criteria,ticketTiers:state.ticketTiers,updatedAt:new Date().toISOString()}));
        toast("Preview configuration saved to this browser only.");
      } catch {
        toast("Browser preview could not be saved.");
      }
      return;
    }
    if (action === "preview-public" || action === "record-preview" || action === "ticket-preview" || action === "judge-preview") {
      toast("Public-facing preview surface is structured; live routing comes with the integration pass.");
      return;
    }
    if (action === "market-search" || action === "category-filter") {
      toast("Marketplace search UI is ready; real supplier results will come from the existing reviewed directory.");
      return;
    }
    if (action === "lock-round") {
      toast("Round lock is a front-end control only until signed score submissions and audit logs are connected.");
      return;
    }
    if (action === "new-vote-campaign") {
      toast("Voting campaign builder is ready for database and payment integration.");
      return;
    }
    if (action === "prepare-record") {
      toast("Official record review state will connect to the existing PageantIndex admin workflow later.");
      return;
    }
    if (action === "help") {
      openDrawer(`<div class="drawer-head"><div><h2>PageantIndex OS preview</h2><p>What this branch is and is not.</p></div><button class="drawer-close" data-drawer-close>×</button></div><section class="panel pad"><div class="simple-list"><div class="simple-row"><span class="status-dot ready"></span><div class="row-copy"><strong>Front-end structure</strong><span>Navigation, screens, interactions and responsive layouts are implemented.</span></div></div><div class="simple-row"><span class="status-dot pending"></span><div class="row-copy"><strong>Database</strong><span>Not connected to the new OS modules yet.</span></div></div><div class="simple-row"><span class="status-dot pending"></span><div class="row-copy"><strong>Payments / votes / scores</strong><span>Preview-only; no production transactions are created.</span></div></div></div></section><div class="drawer-actions"><button class="primary-btn" data-drawer-close>Got it</button></div>`);
      return;
    }
    toast("Front-end control ready. Database connection comes in the next phase.");
  }

  shell();
})();
