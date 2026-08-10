"use strict";

window.PageantIndexGlobal = (() => {
  const relationshipTypes = [
    ["candidate", "Candidate"],
    ["edition", "Pageant Edition"],
    ["organization", "Organization"],
    ["professional", "Professional"],
  ];

  const iconPaths = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
    candidate: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21c.6-4.4 3.1-6.5 7-6.5s6.4 2.1 7 6.5"/>',
    professional: '<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M9 7V5h6v2M4 12h16M10 12v2h4v-2"/>',
    organization: '<path d="m3 9 9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    edition: '<path d="m4 9 8-5 8 5v10H4V9Z"/><path d="M9 19v-5h6v5M8 10h8"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
    shield: '<path d="M12 3 20 6v5c0 5.2-3.3 8.3-8 10-4.7-1.7-8-4.8-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
    check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
    award: '<path d="M8 3h8v4a4 4 0 0 1-8 0V3ZM6 4H3v2a4 4 0 0 0 4 4M18 4h3v2a4 4 0 0 1-4 4M12 11v5M8 21h8M9 16h6"/>',
    camera: '<path d="M9 6.5 10.2 4h3.6L15 6.5h3a3 3 0 0 1 3 3V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5a3 3 0 0 1 3-3h3Z"/><circle cx="12" cy="13" r="3.5"/>',
    makeup: '<path d="m7 3 10 10M5 5l3-3 3 3-3 3-3-3ZM13 13l4-4 3 3-4 4M14 18l-3 3-2-2 3-3"/>',
    design: '<path d="M4 5h16M8 5v14M16 5v14M4 19h16M8 10h8M8 15h8"/>',
    production: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 11h18M7 6l3 5M14 6l3 5"/>',
    judge: '<path d="M12 4v16M5 8h14M7 8l-3 6h6L7 8ZM17 8l-3 6h6l-3-6ZM8 21h8"/>',
    voting: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="m9 4 3 3 5-5M8 13h8"/>',
    ticket: '<path d="M4 7h16v4a2.5 2.5 0 0 0 0 5v4H4v-4a2.5 2.5 0 0 0 0-5V7Z"/><path d="M12 9v9"/>',
    stream: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3V9Z"/>',
    merchandise: '<path d="m8 4 4 2 4-2 4 3-3 4v10H7V11L4 7l4-3Z"/><path d="M9 5c.6 2 5.4 2 6 0"/>',
    result: '<path d="M8 4h8v4a4 4 0 0 1-8 0V4ZM12 12v5M8 21h8M9 17h6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    alert: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
    note: '<path d="M5 3h11l3 3v15H5V3Z"/><path d="M15 3v5h5M8 12h8M8 16h6"/>',
    location: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 18 5-5 3 3 3-4 5 6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  };

  function icon(name, className = "") {
    return `<svg class="pi-icon ${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name] || iconPaths.link}</svg>`;
  }

  function brand(inverse = false) {
    return `<span class="pi-brand${inverse ? " inverse" : ""}"><span class="pi-wordmark">Pageant<span>Index</span></span><small>The Global Network for Pageantry</small></span>`;
  }

  function header() {
    const nav = [
      ["Explore", "/directory/"],
      ["Professionals", "/directory/"],
      ["Candidates", "/candidates/"],
      ["Organizations", "/organizations/"],
      ["Events", "/event/"],
    ];
    const navHtml = nav.map(([label, url]) => {
      const current = path === url || (label === "Professionals" && page === "profile");
      return `<a class="${current ? "active" : ""}" href="${url}">${label}</a>`;
    }).join("");
    return `<header class="pi-header">
      <div class="pi-shell pi-header-inner">
        <a href="/" class="pi-header-brand" aria-label="PageantIndex home">${brand()}</a>
        <nav class="pi-desktop-nav" aria-label="Primary navigation">${navHtml}</nav>
        <div class="pi-header-actions">
          <a class="pi-search-link" href="/directory/" aria-label="Search PageantIndex">${icon("search")}</a>
          <a class="pi-signin" href="/sign-in/">Sign in</a>
          <a class="pi-button pi-button-primary" href="/sign-up/">Create profile</a>
          <button class="pi-menu-button" type="button" data-pi-menu aria-label="Open menu" aria-expanded="false">${icon("menu")}</button>
        </div>
      </div>
      <div class="pi-mobile-drawer" aria-hidden="true">
        <div class="pi-mobile-drawer-head">${brand()}<button type="button" data-pi-menu aria-label="Close menu">${icon("close")}</button></div>
        <nav aria-label="Mobile navigation">${navHtml}<a href="/vote/">Voting</a><a href="/tickets/">Tickets</a><a href="/trust/">Trust Center</a></nav>
        <div class="pi-mobile-drawer-actions"><a href="/sign-in/">Sign in</a><a class="pi-button pi-button-primary" href="/sign-up/">Create profile</a></div>
      </div>
    </header>`;
  }

  function footer() {
    const columns = [
      ["Explore", [["Global index", "/directory/"], ["Events", "/event/"], ["Voting", "/vote/"], ["Industry records", "/articles/"]]],
      ["For Professionals", [["Overview", "/directory/"], ["Create profile", "/sign-up/?role=professional"], ["Profile workspace", "/dashboard/"]]],
      ["For Candidates", [["Overview", "/candidates/"], ["Create profile", "/sign-up/?role=candidate"], ["Pageant history", "/candidates/"]]],
      ["For Organizations", [["Overview", "/organizations/"], ["Claim organization", "/claim-profile/"], ["Official editions", "/event/"]]],
      ["Trust", [["Trust Center", "/trust/"], ["Verification", "/verification/"], ["Report concern", "/report/"]]],
      ["Company", [["About", "/about/"], ["Standards", "/ranking-methodology/"], ["Contact", "/report/"]]],
    ];
    return `<footer class="pi-footer"><div class="pi-shell">
      <div class="pi-footer-top">
        <div class="pi-footer-identity">${brand(true)}<p>The professional identity, relationship, event, competition, and official-record infrastructure for global pageantry.</p></div>
        <div class="pi-footer-columns">${columns.map(([title, links]) => `<div><h3>${title}</h3>${links.map(([label,url]) => `<a href="${url}">${label}</a>`).join("")}</div>`).join("")}</div>
      </div>
      <div class="pi-footer-bottom"><span>© 2026 PageantIndex</span><nav><a href="/about/#privacy">Privacy</a><a href="/about/">Terms</a><a href="/trust/">Copyright</a><a href="/report/">Report concern</a></nav></div>
    </div></footer>`;
  }

  function relationshipRail(items = relationshipTypes, compact = false) {
    return `<div class="pi-relationship-rail${compact ? " compact" : ""}">${items.map(([type, label], index) => `<div class="pi-relationship-node ${type}"><span>${icon(type)}</span><strong>${label}</strong>${index < items.length - 1 ? '<i aria-hidden="true"></i>' : ""}</div>`).join("")}</div>`;
  }

  function emptyState(title, copy, action = "") {
    return `<div class="pi-empty">${icon("link")}<h3>${title}</h3><p>${copy}</p>${action}</div>`;
  }

  function trustRow(type, title, copy) {
    return `<article class="pi-trust-row ${type}"><span>${icon(type === "identity" ? "shield" : type === "credit" ? "professional" : type)}</span><div><h3>${title}</h3><p>${copy}</p></div></article>`;
  }

  function home() {
    const identities = [
      ["professional", "Professional / Supplier", "Build a public professional record, portfolio, services, and confirmed credits.", "/sign-up/?role=professional", "/public/images/pi-professional.webp"],
      ["candidate", "Candidate / Titleholder", "Document representation, placements, team relationships, and career history.", "/sign-up/?role=candidate", "/public/images/pi-candidate.webp"],
      ["organization", "Pageant Organization", "Manage official editions, candidates, suppliers, judges, voting, tickets, and results.", "/sign-up/?role=organization", "/public/images/pi-global-hero.webp"],
    ];
    const eventLayers = [
      ["organization", "Organization"],
      ["edition", "Edition"],
      ["candidate", "Candidates"],
      ["professional", "Suppliers"],
      ["judge", "Judges"],
      ["voting", "Voting"],
      ["ticket", "Tickets"],
      ["result", "Results"],
    ];
    return `<main class="pi-home">
      <section class="pi-hero">
        <div class="pi-hero-copy">
          <div class="pi-hero-copy-inner">
            <h1>The Global Network for Pageantry.</h1>
            <p>Create a professional identity, document pageant history, connect verified roles, manage official editions, and participate in the global pageant ecosystem.</p>
            <div class="pi-actions"><a class="pi-button pi-button-primary" href="/sign-up/">Create your profile</a><a class="pi-button pi-button-quiet" href="/directory/">Explore PageantIndex</a></div>
          </div>
        </div>
        <div class="pi-hero-media" role="img" aria-label="A pageant candidate and production professionals preparing backstage">
          <div class="pi-hero-graph">${relationshipRail()}</div>
        </div>
      </section>

      <section class="pi-index-search"><div class="pi-shell pi-index-search-inner">
        <div><h2>Explore the index.</h2><p>Search people, organizations, editions, countries, and confirmed professional roles.</p></div>
        <form data-main-search><label><span class="sr-only">Search PageantIndex</span>${icon("search")}<input name="q" placeholder="Search names, titles, countries, or roles"></label><button class="pi-button pi-button-primary">Search</button></form>
      </div></section>

      <section class="pi-section pi-connected"><div class="pi-shell">
        <div class="pi-section-intro"><h2>One industry. Connected.</h2><p>PageantIndex turns fragmented pageant history into structured relationships that can be understood, confirmed, and carried forward.</p></div>
        ${relationshipRail()}
        <div class="pi-record-formula"><span>Candidate</span><b>+</b><span>Pageant Edition</span><b>+</b><span>Organization</span><b>+</b><span>Professional</span><b>+</b><span>Role</span></div>
      </div></section>

      <section class="pi-section pi-identities"><div class="pi-shell">
        <div class="pi-section-intro"><h2>Choose your PageantIndex identity</h2><p>Begin with the role that represents you. Additional relationships are added through confirmations and invitations.</p></div>
        <div class="pi-identity-list">${identities.map(([type,title,copy,url,image]) => `<article class="pi-identity-band">
          <div class="pi-identity-image"><img src="${image}" alt="" loading="lazy"></div>
          <div class="pi-identity-copy"><span>${icon(type)}</span><div><h3>${title}</h3><p>${copy}</p></div></div>
          <div class="pi-identity-preview">${relationshipRail(type === "organization" ? [["organization","Organization"],["candidate","Candidate"],["professional","Professional"]] : type === "candidate" ? [["candidate","Candidate"],["edition","Edition"],["organization","Organization"]] : [["candidate","Candidate"],["professional","Professional"],["organization","Organization"]], true)}</div>
          <a href="${url}" aria-label="Create ${title} profile">${icon("arrow")}</a>
        </article>`).join("")}</div>
      </div></section>

      <section class="pi-section pi-history"><div class="pi-shell">
        <div class="pi-history-heading"><div><h2>Your pageant history, structured.</h2><p>A permanent professional record, not a social feed.</p></div><small>Interface demonstration. Published records appear only after confirmation.</small></div>
        <div class="pi-history-grid">
          <div class="pi-history-labels"><div>${icon("candidate")}<span><strong>As candidate</strong><small>Representation and placement history</small></span></div><div>${icon("professional")}<span><strong>Professional credits</strong><small>Confirmed work and official roles</small></span></div></div>
          <div class="pi-history-years">${[["2024","Pageant Edition","Candidate"],["2025","National Edition","1st Runner-Up"],["2026","Official Edition","Winner"]].map(([year,editionLabel,result]) => `<div><strong>${year}</strong><span class="pi-history-point"></span><p>${editionLabel}</p><em>${result}</em></div>`).join("")}</div>
        </div>
      </div></section>

      <section class="pi-section pi-event-layer"><div class="pi-shell">
        <div class="pi-event-layer-head"><div><h2>The official event layer</h2><p>One canonical edition connects its public record, operational tools, commerce, and final results.</p></div><a href="/event/">View official editions ${icon("arrow")}</a></div>
        <div class="pi-event-line">${eventLayers.map(([type,label],index) => `<div><span>${icon(type)}</span><strong>${label}</strong>${index < eventLayers.length - 1 ? "<i></i>" : ""}</div>`).join("")}</div>
        <div class="pi-event-demo"><aside><span>Interface demonstration</span><h3>Official edition record</h3><p>Only tabs with approved content appear publicly.</p></aside><div>${["Overview","Candidates","Team","Voting","Tickets","Results"].map((label,i)=>`<span class="${i===0?"active":""}">${label}</span>`).join("")}</div></div>
      </div></section>

      <section class="pi-audience pi-professionals">
        <div class="pi-audience-media"><img src="/public/images/pi-professional.webp" alt="A professional photographer covering a pageant rehearsal" loading="lazy"></div>
        <div class="pi-audience-copy"><h2>For professionals</h2><p>Build a credible public dossier around your expertise, confirmed pageant work, service area, portfolio, and professional inquiry path.</p>
          <div class="pi-dossier-menu">${["Professional Profile","Official Credits","Portfolio","Experience","Services"].map((label,i)=>`<a href="/directory/">${icon(["professional","link","image","calendar","settings"][i])}<span>${label}</span>${icon("arrow")}</a>`).join("")}<a class="inquiry" href="/directory/">Send professional inquiry ${icon("arrow")}</a></div>
        </div>
      </section>

      <section class="pi-audience-pair">
        <article class="pi-candidate-audience"><div><h2>For candidates</h2><p>Document representation, pageant history, placements, official events, and the professional team behind your journey.</p><ul><li>${icon("calendar")} Pageant history</li><li>${icon("candidate")} Representation</li><li>${icon("award")} Placements</li><li>${icon("professional")} Professional team</li></ul><a href="/candidates/">Explore candidate records ${icon("arrow")}</a></div><img src="/public/images/pi-candidate.webp" alt="Adult pageant candidate waiting backstage during rehearsal" loading="lazy"></article>
        <article class="pi-organization-audience"><div><h2>For organizations</h2><p>Operate each edition and preserve its official record in one institutional system.</p><ul>${["Edition management","Candidate roster","Official suppliers","Judges","Voting","Ticketing","Official results","Historical archive"].map((x,i)=>`<li>${icon(["edition","candidate","professional","judge","voting","ticket","result","calendar"][i])}<span>${x}</span></li>`).join("")}</ul><a href="/organizations/">Explore organization tools ${icon("arrow")}</a></div><div class="pi-organization-console">${relationshipRail([["organization","Organization"],["edition","Edition"],["result","Official record"]])}</div></article>
      </section>

      <section class="pi-section pi-trust"><div class="pi-shell">
        <div class="pi-section-intro"><h2>Trust should be specific.</h2><p>Different claims require different evidence. PageantIndex never collapses them into one vague badge.</p></div>
        <div class="pi-trust-list">
          ${trustRow("identity","Identity Verified","PageantIndex reviewed evidence connecting the account to the person represented.")}
          ${trustRow("organization","Organization Confirmed","Authority to represent the pageant organization was reviewed.")}
          ${trustRow("candidate","Candidate Confirmed","The candidate confirmed the relevant identity or relationship.")}
          ${trustRow("credit","Professional Credit Confirmed","An authorized participant confirmed the edition, professional, and role relationship.")}
        </div>
      </div></section>

      <section class="pi-final-cta"><div class="pi-final-lines" aria-hidden="true"></div><div class="pi-shell"><h2>Build your pageant identity.<br>Connect your history.</h2><div class="pi-actions"><a class="pi-button pi-button-primary" href="/sign-up/">Create profile</a><a class="pi-button pi-button-dark-outline" href="/claim-profile/">Claim organization</a></div></div></section>
    </main>`;
  }

  function professionalResult(profile) {
    const imageUrl = safeHttpUrl(profile.imageUrl, "/public/images/pi-professional.webp");
    const relationships = Array.isArray(profile.credits) ? profile.credits : [];
    return `<article class="pi-result-row" data-profile-card data-name="${escapeHtml(profile.name.toLowerCase())}" data-search="${escapeHtml(`${profile.name} ${profile.category} ${profile.location} ${profile.services.join(" ")}`.toLowerCase())}" data-category="${escapeHtml(profile.category)}" data-location="${escapeHtml(profile.location)}" data-verified="${profile.verified}" data-featured="${profile.featured}" data-nationwide="${profile.nationwide}" data-travel="${profile.travel}">
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(profile.name)}" loading="lazy" data-fallback-image>
      <div class="pi-result-identity"><div><h2>${escapeHtml(profile.name)}</h2>${profile.verified ? '<span class="pi-specific-status identity">Identity verified</span>' : ""}</div><p>${escapeHtml(profile.category)} · ${escapeHtml(profile.city)}, ${escapeHtml(profile.location)}</p><small>${escapeHtml(profile.desc || "Professional profile")}</small></div>
      <div class="pi-result-credits"><strong>Confirmed relationships</strong>${relationships.length ? relationships.slice(0,2).map((credit)=>`<span>${escapeHtml(credit)}</span>`).join("") : "<span>No confirmed credits published yet.</span>"}</div>
      <a class="pi-button pi-button-quiet" href="/professional/${encodeURIComponent(profile.id)}/">View profile</a>
    </article>`;
  }

  function directory() {
    const publishedLocations = [...new Set(profiles.map((profile) => profile.location).filter(Boolean))].sort((a,b) => a.localeCompare(b));
    const results = profiles.length ? `<div class="pi-directory-context"><strong id="result-count">${profiles.length}</strong><span>published professional${profiles.length === 1 ? "" : "s"}</span><select id="sort-select" aria-label="Sort results"><option value="recommended">Recommended</option><option value="alphabetical">Alphabetical</option></select></div><div id="results-list" class="pi-results-list">${profiles.map(professionalResult).join("")}</div><div id="empty-results" hidden>${emptyState("No matching professionals","Try a broader profession, country, region, or keyword.")}</div>` : emptyState("No published professionals yet.","PageantIndex does not invent suppliers or professional activity. Approved profiles will appear here after review.",'<a class="pi-button pi-button-primary" href="/sign-up/?role=professional">Create professional profile</a>');
    return `<main class="pi-directory-page">
      <section class="pi-page-title"><div class="pi-shell"><h1>Explore the global pageant industry.</h1><p>Discover people through professional identity, verified expertise, location, and confirmed pageant relationships.</p></div></section>
      <section class="pi-directory-shell pi-shell">
        <button class="pi-filter-trigger" data-filter-toggle>${icon("filter")} Filters</button>
        <aside class="pi-filter-rail" id="pi-filter-rail"><div class="pi-filter-head"><h2>Refine results</h2><button type="button" data-filter-toggle aria-label="Close filters">${icon("close")}</button></div>
          <form id="public-directory-search">
            <label><span>Search</span><input id="public-filter-keyword" name="query" placeholder="Name, role, or expertise"></label>
            <details open><summary>Identity type</summary><label class="pi-check"><input type="checkbox" checked disabled> Professional / Supplier</label></details>
            <details open><summary>Profession</summary><select id="public-filter-category"><option value="">All professions</option>${categories.map(([name])=>`<option>${name}</option>`).join("")}</select></details>
            <details open><summary>Country or region</summary><select id="public-filter-location"><option value="">All locations</option>${publishedLocations.map((name)=>`<option>${escapeHtml(name)}</option>`).join("")}</select></details>
            <details><summary>Availability</summary><label class="pi-check"><input type="checkbox" disabled> Available for travel</label><label class="pi-check"><input type="checkbox" disabled> Accepting inquiries</label></details>
            <details><summary>Trust</summary><label class="pi-check"><input type="checkbox" disabled> Identity verified</label><label class="pi-check"><input type="checkbox" disabled> Confirmed credits</label></details>
            <button class="pi-button pi-button-primary">Apply filters</button>
          </form>
        </aside>
        <div class="pi-directory-results">${results}</div>
      </section>
    </main>`;
  }

  function professionalProfile() {
    const slug = path.split("/").filter(Boolean).pop();
    const profile = profiles.find((item) => item.id === slug);
    if (!profile) return `<main class="pi-record-page"><section class="pi-page-title"><div class="pi-shell"><h1>Professional profile</h1><p>This profile is not published in the approved PageantIndex record.</p></div></section><div class="pi-shell pi-empty-wrap">${emptyState("Profile unavailable","Browse published professionals or create an owner-reviewed profile.",'<a class="pi-button pi-button-primary" href="/directory/">Explore professionals</a>')}</div></main>`;
    const imageUrl = safeHttpUrl(profile.imageUrl, "/public/images/pi-professional.webp");
    return `<main class="pi-record-page">
      <section class="pi-profile-hero"><div class="pi-shell pi-profile-hero-grid">
        <div class="pi-profile-photo"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(profile.name)}" data-fallback-image></div>
        <div class="pi-profile-identity"><p>${escapeHtml(profile.category)}</p><h1>${escapeHtml(profile.name)}</h1><div class="pi-profile-location">${icon("location")} ${escapeHtml(profile.city)}, ${escapeHtml(profile.location)}</div><div class="pi-profile-statuses">${profile.verified ? '<span class="pi-specific-status identity">Identity verified</span>' : '<span class="pi-specific-status neutral">Identity not verified</span>'}</div><p class="pi-profile-summary">${escapeHtml(profile.desc || "Professional information is being completed.")}</p><div class="pi-actions"><button class="pi-button pi-button-primary inquiry-trigger" data-profile="${escapeHtml(profile.id)}">Send professional inquiry</button><button class="pi-button pi-button-quiet share-profile">Share profile</button></div></div>
      </div></section>
      <nav class="pi-profile-nav" aria-label="Profile sections">${["Overview","Credits","Portfolio","Experience","Services","Contact"].map((label,i)=>`<button class="${i===0?"active":""}" data-profile-tab="${label.toLowerCase()}">${label}</button>`).join("")}</nav>
      <div class="pi-shell pi-profile-body">
        <section id="overview"><h2>Overview</h2><p>${escapeHtml(profile.desc || "No biography has been published.")}</p><dl><div><dt>Specialization</dt><dd>${escapeHtml(profile.category)}</dd></div><div><dt>Travel availability</dt><dd>${profile.travel ? "Available for travel" : "Not published"}</dd></div><div><dt>Service area</dt><dd>${profile.nationwide ? "Nationwide" : escapeHtml(profile.location)}</dd></div><div><dt>Languages</dt><dd>Not published</dd></div></dl></section>
        <section id="credits" class="pi-credit-section"><div><h2>Official credits</h2><p>Organization-level and candidate-level relationships remain visibly separate.</p></div>${emptyState("No confirmed credits yet.","Add a professional credit or ask an organization or candidate to confirm your role.")}</section>
        <section id="portfolio"><h2>Portfolio</h2>${emptyState("No public portfolio yet.","Approved, rights-cleared work will appear here without awkward cropping.")}</section>
        <section id="experience"><h2>Experience</h2><p>No experience record has been published.</p></section>
        <section id="services"><h2>Services</h2>${profile.services.length ? `<div class="pi-service-rows">${profile.services.map((service)=>`<div><span>${icon("check")}</span><strong>${escapeHtml(service)}</strong></div>`).join("")}</div>` : emptyState("No services published.","Service details will appear after profile review.")}</section>
        <section id="contact" class="pi-contact-panel"><div><h2>Professional inquiry</h2><p>Share the event, date, location, service, budget range, and requirements privately.</p></div><button class="pi-button pi-button-primary inquiry-trigger" data-profile="${escapeHtml(profile.id)}">Send professional inquiry</button></section>
      </div>
    </main>`;
  }

  function candidates() {
    return `<main class="pi-record-index">
      <section class="pi-editorial-index-hero"><div class="pi-shell"><div><h1>Candidate identities built for the permanent record.</h1><p>Prestigious public profiles for representation, official placements, team relationships, media, and pageant history.</p><a class="pi-button pi-button-primary" href="/sign-up/?role=candidate">Create candidate profile</a></div><img src="/public/images/pi-candidate.webp" alt="Adult pageant candidate backstage during rehearsal"></div></section>
      <section class="pi-section"><div class="pi-shell pi-record-demo"><div><span>Candidate profile preview</span><h2>A career record, not a fan page.</h2><p>Every published item is connected to an edition, organization, role, placement, or confirmed professional relationship.</p></div><div class="pi-demo-timeline">${["About","Pageant history","Placements","Professional team","Confirmed suppliers","Media","Official events"].map((label,i)=>`<div class="${i===1?"active":""}"><span>${icon(["candidate","calendar","award","professional","shield","image","edition"][i])}</span><strong>${label}</strong></div>`).join("")}</div></div></section>
      <section class="pi-section pi-soft"><div class="pi-shell">${emptyState("No published candidate records yet.","PageantIndex will show candidate profiles only after the applicable review or confirmation. No candidate activity is invented.",'<a class="pi-button pi-button-quiet" href="/sign-up/?role=candidate">Start a candidate profile</a>')}</div></section>
    </main>`;
  }

  function candidateProfile() {
    const tabs = ["About", "Pageant history", "Placements", "Professional team", "Media", "Official events"];
    return `<main class="pi-record-page pi-candidate-profile">
      <section class="pi-candidate-profile-hero"><div class="pi-shell pi-candidate-profile-grid">
        <div class="pi-candidate-profile-photo"><img src="/public/images/pi-candidate.webp" alt="Adult pageant candidate backstage during an official rehearsal"></div>
        <div class="pi-profile-identity"><p>Candidate profile · Interface demonstration</p><h1>Candidate identity</h1><div class="pi-profile-location">${icon("location")} Representation not published</div><div class="pi-profile-statuses"><span class="pi-specific-status neutral">Confirmation not published</span></div><p class="pi-profile-summary">A prestigious, permanent professional record for representation, edition history, placements, official teams, and confirmed supplier relationships.</p><small class="pi-demo-disclaimer">No candidate name, title, placement, or relationship is being represented as real on this demonstration screen.</small></div>
      </div></section>
      <nav class="pi-profile-nav" aria-label="Candidate profile sections">${tabs.map((label,i)=>`<button class="${i===0?"active":""}" data-profile-tab="${label.toLowerCase().replaceAll(" ","-")}">${label}</button>`).join("")}</nav>
      <div class="pi-shell pi-profile-body">
        <section id="about"><h2>About</h2><div class="pi-record-facts"><div><span>Representation</span><strong>Not published</strong></div><div><span>Current title / status</span><strong>Not published</strong></div><div><span>Confirmation state</span><strong>Not published</strong></div></div></section>
        <section id="pageant-history"><div><h2>Pageant history</h2><p>Every milestone connects to one canonical edition and organization.</p></div>${emptyState("No pageant history published yet.","Approved editions and placements will form the candidate’s permanent chronological record.")}</section>
        <section id="placements"><h2>Placements</h2>${relationshipRail([["candidate","Candidate"],["edition","Official edition"],["award","Placement"]],true)}</section>
        <section id="professional-team"><div><h2>Professional team</h2><p>Candidate-level relationships remain separate from organization-level credits.</p></div><div class="pi-record-table"><div><b>Professional</b><b>Role</b><b>Confirmation</b></div><div><span>—</span><span>—</span><span>—</span></div></div></section>
        <section id="media"><h2>Media</h2>${emptyState("No approved media yet.","Rights-cleared editorial images will appear here at full quality.")}</section>
        <section id="official-events"><h2>Official events</h2>${emptyState("No official events published yet.","Approved edition relationships will appear here when confirmed.")}</section>
      </div>
    </main>`;
  }

  function organizations() {
    const tools = [["edition","Edition management"],["candidate","Candidate roster"],["professional","Official suppliers"],["judge","Judges"],["voting","Voting"],["ticket","Ticketing"],["result","Official results"],["calendar","Historical archive"]];
    return `<main class="pi-record-index">
      <section class="pi-institutional-hero"><div class="pi-shell"><div><h1>Official infrastructure for pageant organizations.</h1><p>Claim institutional identity, manage editions and relationships, operate competition tools, and preserve a public historical archive.</p><div class="pi-actions"><a class="pi-button pi-button-primary" href="/sign-up/?role=organization">Create organization profile</a><a class="pi-button pi-button-dark-outline" href="/claim-profile/">Claim organization</a></div></div><div class="pi-institutional-mark">${icon("organization")}<span>Organization</span><i></i>${icon("edition")}<span>Official editions</span></div></div></section>
      <section class="pi-section"><div class="pi-shell pi-organization-tools"><div><h2>Institutional by design.</h2><p>Leadership, current edition, past editions, candidates, official suppliers, announcements, and results remain connected to one authoritative organization record.</p></div><div>${tools.map(([type,label])=>`<div>${icon(type)}<span>${label}</span>${icon("arrow")}</div>`).join("")}</div></div></section>
      <section class="pi-section pi-soft"><div class="pi-shell">${emptyState("No public organizations yet.","Once an organization is reviewed and publishes its profile or edition, it will appear here.",'<a class="pi-button pi-button-quiet" href="/claim-profile/">Submit an organization claim</a>')}</div></section>
    </main>`;
  }

  function organizationProfile() {
    const tabs = ["About", "Leadership", "Current edition", "Past editions", "Candidates", "Official suppliers", "Results archive", "Announcements"];
    return `<main class="pi-record-page pi-organization-profile">
      <section class="pi-organization-profile-hero"><div class="pi-shell pi-organization-profile-grid">
        <div class="pi-organization-seal">${icon("organization")}<span>Organization identity</span></div>
        <div class="pi-profile-identity"><p>Institutional profile · Interface demonstration</p><h1>Organization name</h1><div class="pi-profile-location">${icon("globe")} Country not published</div><div class="pi-profile-statuses"><span class="pi-specific-status neutral">Organization confirmation not published</span></div><p class="pi-profile-summary">One authoritative record for leadership, canonical editions, candidate rosters, official suppliers, announcements, and results history.</p><div class="pi-actions"><button class="pi-button pi-button-primary" disabled>Follow</button><a class="pi-button pi-button-dark-outline" href="/event/">View editions</a><a class="pi-button pi-button-dark-outline" href="/report/">Contact</a></div></div>
      </div></section>
      <nav class="pi-profile-nav" aria-label="Organization profile sections">${tabs.map((label,i)=>`<button class="${i===0?"active":""}" data-profile-tab="${label.toLowerCase().replaceAll(" ","-")}">${label}</button>`).join("")}</nav>
      <div class="pi-shell pi-profile-body">
        <section id="about"><h2>About</h2><div class="pi-record-facts"><div><span>Country</span><strong>Not published</strong></div><div><span>Official URL</span><strong>Not published</strong></div><div><span>Confirmation status</span><strong>Not published</strong></div></div></section>
        <section id="leadership"><h2>Leadership</h2>${emptyState("No leadership record published.","Approved organization representatives will appear here.")}</section>
        <section id="current-edition"><h2>Current edition</h2>${emptyState("No current edition published.","Once the organization publishes an approved edition, it will become the canonical current record.")}</section>
        <section id="past-editions"><div><h2>Edition archive</h2><p>A chronological institutional record, not a collection of disconnected cards.</p></div><div class="pi-edition-archive"><div><span>Edition year</span><strong>—</strong><small>No public edition</small></div><div><span>Edition year</span><strong>—</strong><small>No public edition</small></div><div><span>Edition year</span><strong>—</strong><small>No public edition</small></div></div></section>
        <section id="candidates"><h2>Candidates</h2>${emptyState("No candidate roster published.","Approved candidates remain connected to their specific edition.")}</section>
        <section id="official-suppliers"><h2>Official suppliers</h2>${emptyState("No official supplier credits published.","Organization-level credits will remain distinct from candidate-level relationships.")}</section>
        <section id="results-archive"><h2>Results archive</h2>${emptyState("No official results published.","Published results will remain connected to the canonical edition record.")}</section>
        <section id="announcements"><h2>Announcements</h2>${emptyState("No public announcements.","Approved institutional announcements will appear here.")}</section>
      </div>
    </main>`;
  }

  function events() {
    return `<main class="pi-record-index">
      <section class="pi-page-title"><div class="pi-shell"><h1>Official editions and permanent pageant records.</h1><p>Each approved edition connects its organization, candidates, teams, competition tools, commerce, and official results.</p></div></section>
      <section class="pi-section"><div class="pi-shell pi-edition-anatomy"><div><h2>One canonical edition.</h2><p>Only approved content appears publicly. Operational tools stay contextual to the edition they serve.</p></div>${relationshipRail([["organization","Organization"],["edition","Edition"],["candidate","Candidates"],["professional","Team"],["result","Results"]])}</div></section>
      <section class="pi-section pi-soft"><div class="pi-shell">${emptyState("No public editions yet.","Once an organization publishes an approved edition, it will appear here. PageantIndex does not invent event activity.",'<a class="pi-button pi-button-primary" href="/sign-up/?role=organization">Create organization profile</a>')}</div></section>
    </main>`;
  }

  function edition() {
    const tabs = ["Overview","Candidates","Team","Voting","Tickets","Results"];
    return `<main class="pi-edition-page">
      <section class="pi-edition-hero"><img src="/public/images/pi-global-hero.webp" alt="Pageant production team preparing an official stage"><div class="pi-edition-identity"><span>Official edition record</span><h1>Pageant name</h1><dl><div><dt>Edition / Year</dt><dd>Not published</dd></div><div><dt>Date</dt><dd>Not published</dd></div><div><dt>Venue</dt><dd>Not published</dd></div><div><dt>Organization</dt><dd>Not published</dd></div><div><dt>Official status</dt><dd>Not published</dd></div></dl><small>Interface demonstration. This is not a published event.</small></div></section>
      <nav class="pi-edition-tabs">${tabs.map((label,i)=>`<button class="${i===0?"active":""}" data-pi-tab="${label.toLowerCase()}">${label}</button>`).join("")}</nav>
      <section class="pi-shell pi-edition-content">
        <div class="pi-edition-column"><h2>Candidates</h2><div class="pi-candidate-placeholders">${Array.from({length:6},()=>`<div><span>${icon("candidate")}</span><strong>Candidate</strong><small>Representation</small></div>`).join("")}</div><p class="pi-demo-note">Interface demonstration only. Published rosters contain approved candidate records.</p></div>
        <div class="pi-edition-column"><h2>Official suppliers</h2><h3>Organization Team</h3>${[["camera","Official Photographer"],["makeup","Official Makeup Team"],["design","Official Designer"],["production","Production"]].map(([type,label])=>`<div class="pi-team-row">${icon(type)}<span>${label}</span><em>—</em></div>`).join("")}<h3>Candidate Teams</h3><div class="pi-mini-table"><div><b>Candidate</b><b>Professional</b><b>Role</b></div>${Array.from({length:3},()=>"<div><span>—</span><span>—</span><span>—</span></div>").join("")}</div></div>
        <div class="pi-edition-column"><h2>Results</h2><div class="pi-winner-placeholder"><span>WINNER</span><div><strong>Candidate</strong><small>Representation</small></div></div><div class="pi-placement-row"><strong>1st Runner-Up</strong><span>—</span></div><div class="pi-placement-row"><strong>2nd Runner-Up</strong><span>—</span></div>${emptyState("No public results yet.","Official results will appear here once the organization publishes them.")}</div>
      </section>
    </main>`;
  }

  const commerceConfig = {
    voting: {
      icon: "voting", title: "Official voting", copy: "A clear, event-specific voting experience with published rules, visible closing time, and secure payment distinction.", labels: ["Voting period","Rules","Candidate","Representation","Free vote / paid vote"], empty: "No voting event is currently open."
    },
    tickets: {
      icon: "ticket", title: "Official event tickets", copy: "Event context comes first. Ticket type, quantity, price, availability, and checkout remain clear.", labels: ["Event","Ticket type","Quantity","Price","Availability"], empty: "No approved ticket offer is available."
    },
    livestream: {
      icon: "stream", title: "Official livestream access", copy: "Credential-based event access without exposing a private stream URL before authorization.", labels: ["Event","Start time","Access offer","Credential","Support"], empty: "No livestream access offer is available."
    },
    merchandise: {
      icon: "merchandise", title: "Official edition merchandise", copy: "Merchandise remains secondary and is always tied to the pageant, edition, inventory, and organizer.", labels: ["Pageant","Edition","Product","Price","Inventory"], empty: "No approved merchandise is available."
    }
  };

  function commerce(kind) {
    const config = commerceConfig[kind];
    return `<main class="pi-commerce-page"><section class="pi-commerce-hero"><div class="pi-shell"><span>${icon(config.icon)}</span><div><h1>${config.title}</h1><p>${config.copy}</p></div></div></section><section class="pi-section"><div class="pi-shell pi-commerce-interface"><div class="pi-commerce-context"><span>Event context</span><h2>Official edition</h2><p>No approved event is selected.</p>${relationshipRail([["organization","Organization"],["edition","Edition"]],true)}</div><div class="pi-commerce-fields">${config.labels.map((label)=>`<div><span>${label}</span><strong>—</strong></div>`).join("")}<button class="pi-button pi-button-primary" disabled>Continue securely</button></div></div></section><section class="pi-section pi-soft"><div class="pi-shell">${emptyState(config.empty,"Official offers will appear only after organizer approval. No inventory, pricing, or activity is fabricated.")}</div></section></main>`;
  }

  function operationsNav(active) {
    const items = [["judge","Scoring","/judge/"],["result","Tabulation","/tabulation/"],["note","Reports","#"],["settings","Settings","#"]];
    return `<aside class="pi-ops-sidebar"><a href="/">${brand(true)}</a><nav>${items.map(([type,label,url])=>`<a class="${label.toLowerCase()===active?"active":""}" href="${url}">${icon(type)}<span>${label}</span></a>`).join("")}</nav><a class="pi-ops-help" href="/trust/">${icon("shield")} Trust & support</a></aside>`;
  }

  function statusLegend() {
    return `<div class="pi-status-legend">${[["not-started","Not started"],["in-progress","In progress"],["saved","Saved"],["complete","Complete"],["locked","Locked"],["closed","Scoring closed"]].map(([state,label])=>`<span class="${state}"><i></i>${label}</span>`).join("")}</div>`;
  }

  function judge() {
    return `<main class="pi-ops-shell">${operationsNav("scoring")}<section class="pi-ops-main">
      <header class="pi-ops-top"><div><h1>Judge Scoring</h1><p>Confidential competition workspace</p></div><label>Event<select disabled><option>No active event</option></select></label><label>Judge<select disabled><option>Not assigned</option></select></label><div><small>Scoring status</small>${statusLegend()}</div></header>
      <div class="pi-rehearsal-note">${icon("alert")} Interface demonstration. No live competition, candidate, or judge is connected.</div>
      <div class="pi-scoring-layout"><aside class="pi-candidate-rail"><h2>Candidates</h2>${Array.from({length:7},(_,i)=>`<button class="${i===0?"active":""}" disabled><span>${icon("candidate")}</span><strong>Candidate slot</strong><i class="${["in-progress","saved","complete","not-started","locked","closed","not-started"][i]}"></i></button>`).join("")}</aside>
        <section class="pi-score-workspace"><div class="pi-score-candidate"><span>${icon("candidate")}</span><div><small>Candidate</small><strong>No candidate assigned</strong></div></div><div class="pi-score-selects"><label>Segment<select disabled><option>Not configured</option></select></label><label>Criteria<select disabled><option>Not configured</option></select></label></div><div class="pi-score-entry"><label>Score<input id="pi-score-input" type="number" value="" placeholder="0.00" disabled></label><small>Score range appears after configuration.</small></div><label class="pi-score-notes">Optional notes<textarea placeholder="Add notes (optional)" disabled></textarea></label><div class="pi-score-actions"><button class="pi-button pi-button-quiet" disabled>Save draft</button><button class="pi-button pi-button-primary" disabled>Save & next criteria</button></div></section>
      </div>
    </section></main>`;
  }

  function tabulation() {
    const statuses = ["Judges invited","Judges active","Candidates scored","Missing scores","Configuration status","Live status","Finalization status"];
    return `<main class="pi-ops-shell">${operationsNav("tabulation")}<section class="pi-ops-main">
      <header class="pi-ops-top"><div><h1>Tabulation Control Room</h1><p>Professional competition configuration and live-state control</p></div><div class="pi-ops-mode">${icon("lock")} No active event</div></header>
      <div class="pi-rehearsal-note">${icon("alert")} Interface demonstration. Controls are disabled until an authorized event is configured.</div>
      <div class="pi-tabulation-layout"><aside class="pi-stage-rail"><h2>Competition stages</h2>${["Stage","Segment","Criteria"].map((label)=>`<details open><summary>${label}</summary><span>Not configured</span></details>`).join("")}</aside>
        <section class="pi-tabulation-center"><div class="pi-live-state"><h2>Live scoring state</h2><div>${statuses.slice(0,4).map((label)=>`<span><small>${label}</small><strong>—</strong></span>`).join("")}</div></div><div class="pi-configuration"><h2>Configuration</h2><div>${statuses.slice(4).map((label)=>`<span><small>${label}</small><strong>—</strong></span>`).join("")}</div></div><div class="pi-results-table"><div class="pi-table-head"><h2>Results table</h2><span>No competition data</span></div><table><thead><tr><th>Rank</th><th>Candidate</th><th>Representation</th><th>Score</th><th>Completion status</th></tr></thead><tbody>${Array.from({length:6},()=>"<tr><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr>").join("")}</tbody></table></div></section>
        <aside class="pi-control-rail"><section><h2>Alerts</h2>${emptyState("No active alerts","Alerts appear when an authorized competition is live.")}</section><section><h2>Judge completion</h2>${statusLegend()}</section><section class="pi-danger-controls"><h2>Controls</h2>${[["Rehearsal","quiet"],["Lock configuration","quiet"],["Go live","primary"],["Finalize results","warning"],["Publish results","danger"]].map(([label,type])=>`<button class="pi-control ${type}" data-confirm-action="${label}" disabled>${label}${["Finalize results","Publish results"].includes(label)?icon("alert"):""}</button>`).join("")}</section></aside>
      </div>
    </section></main>`;
  }

  function trust() {
    const sections = [
      ["Identity verification","Evidence connects an account to the person represented. It does not guarantee future conduct or performance."],
      ["Organization confirmation","Authority to represent an organization is reviewed separately from personal identity."],
      ["Candidate confirmation","Candidate identity and candidate-confirmed relationships use their own evidence path."],
      ["Credit confirmation","A structured Pageant + Edition + Professional + Role relationship is confirmed by an authorized participant."],
      ["Moderation","Reports are triaged by evidence and risk, not popularity."],
      ["Copyright","Uploaders must own or have permission to publish submitted work."],
      ["Privacy","Private identity evidence and private contact information are not intended for public display."],
      ["Minors","Publication involving minors requires heightened care and applicable guardian authorization."],
      ["Paid visibility","Sponsored visibility is labeled and cannot purchase verification or organic authority."],
      ["Reporting and appeals","Accepted reports receive a case reference, evidence review, and a recorded outcome."],
    ];
    return `<main class="pi-trust-center"><section class="pi-trust-hero"><div class="pi-shell"><h1>Trust should be clear, specific, and earned.</h1><p>PageantIndex separates identity, authority, professional history, commercial visibility, moderation, and official records so one signal can never quietly stand in for another.</p></div></section><section class="pi-section"><div class="pi-shell pi-trust-center-grid"><aside><nav>${sections.map(([title],i)=>`<a href="#trust-${i}">${title}</a>`).join("")}</nav><a class="pi-button pi-button-primary" href="/report/">Report a concern</a></aside><div>${sections.map(([title,copy],i)=>`<section id="trust-${i}"><span>${icon(["shield","organization","candidate","professional","alert","image","lock","candidate","ticket","note"][i])}</span><div><h2>${title}</h2><p>${copy}</p></div></section>`).join("")}<div class="pi-policy-note"><strong>Operational standard, not legal advice.</strong><p>Final legal terms and jurisdiction-specific obligations require qualified counsel.</p></div></div></div></section></main>`;
  }

  function report() {
    return `<main class="pi-report-page"><section class="pi-page-title"><div class="pi-shell"><h1>Report a concern.</h1><p>A simple, serious path for identity, copyright, privacy, fraud, harassment, safety, and record-integrity concerns.</p></div></section><section class="pi-section"><div class="pi-shell pi-report-grid"><aside><h2>What happens next</h2><ol><li>Your report is assigned a case reference.</li><li>Evidence and risk are reviewed.</li><li>Clarification may be requested.</li><li>The outcome is recorded.</li></ol><p>Do not include passwords, full payment credentials, or unnecessary private identity documents in this form.</p></aside><form id="pi-report-form" class="pi-report-form"><label>Report type<select name="report_type" required><option value="">Select report type</option><option>Impersonation</option><option>Copyright</option><option>Privacy</option><option>Fraud</option><option>Harassment</option><option>Safety</option><option>Incorrect record</option><option>Other</option></select></label><label>Subject<input name="subject" required></label><label>Description<textarea name="description" required placeholder="Explain what happened and identify the relevant profile, edition, or content."></textarea></label><label>Evidence links<textarea name="evidence_links" placeholder="One public link per line"></textarea></label><label>Contact email <small>Optional</small><input name="email" type="email"></label><label class="pi-check"><input type="checkbox" required> I confirm that this report is submitted in good faith.</label><button class="pi-button pi-button-primary">Submit report</button><div id="pi-report-status" aria-live="polite"></div></form></div></section></main>`;
  }

  function account(mode) {
    const createFirst = mode === "signup";
    return `<main class="pi-auth-page"><section class="pi-auth-visual"><a href="/">${brand(true)}</a><div><h1>One identity.<br>A connected pageant history.</h1><p>Create the record that represents your work, title, or organization across the global pageant ecosystem.</p>${relationshipRail()}</div></section><section class="pi-auth-panel"><a class="pi-auth-mobile-brand" href="/">${brand()}</a><div class="pi-auth-card"><h2>${createFirst ? "Create your PageantIndex identity" : "Welcome back"}</h2><p>${createFirst ? "Choose the role that represents you. Secondary roles can be added later." : "Access your private PageantIndex workspace."}</p>
      <div class="auth-tabs" role="tablist"><button class="${createFirst?"":"active"}" data-auth-tab="signin">Sign in</button><button class="${createFirst?"active":""}" data-auth-tab="signup">Create account</button></div>
      <form id="signin-form" class="auth-form ${createFirst?"":"active"}" data-auth-panel="signin"><div class="field"><label for="signin-email">Email</label><input id="signin-email" name="email" type="email" required autocomplete="email"></div><div class="field"><label for="signin-password">Password</label><input id="signin-password" name="password" type="password" required autocomplete="current-password"></div><div class="auth-options"><label class="check-row"><input type="checkbox"> Keep me signed in</label><button type="button" class="text-link" data-forgot-password>Forgot password?</button></div><button class="pi-button pi-button-primary">Sign in</button></form>
      <form id="signup-form" class="auth-form ${createFirst?"active":""}" data-auth-panel="signup">
        <fieldset class="pi-role-choice"><legend>Choose your primary identity</legend><button type="button" data-account-role="professional" class="active">${icon("professional")}<span><strong>Professional / Supplier</strong><small>Build your professional record.</small></span></button><button type="button" data-account-role="candidate">${icon("candidate")}<span><strong>Candidate / Titleholder</strong><small>Document your pageant history.</small></span></button><button type="button" data-account-role="organization">${icon("organization")}<span><strong>Pageant Organization</strong><small>Manage official editions.</small></span></button></fieldset>
        <input type="hidden" name="role" id="pi-account-role" value="professional">
        <div class="form-grid"><div class="field"><label>Full name</label><input name="name" required autocomplete="name"></div><div class="field"><label id="pi-identity-name-label">Business or professional name</label><input name="business" required></div><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Primary category</label><select name="category" required><option value="">Select category</option>${categories.map(([name])=>`<option>${name}</option>`).join("")}<option>Candidate / Titleholder</option><option>Pageant Organization</option></select></div><div class="field"><label>Password</label><input name="password" type="password" minlength="8" required autocomplete="new-password"></div><div class="field"><label>Confirm password</label><input name="confirm" type="password" minlength="8" required autocomplete="new-password"></div></div>
        <div class="pi-onboarding-preview"><span>Identity</span><i></i><span>Details</span><i></i><span>History / Edition</span><i></i><span>Confirmation</span><i></i><span>Publish</span></div>
        <label class="checkbox-consent"><input type="checkbox" required> I confirm that I am authorized to represent this identity and agree to the trust standards.</label><button class="pi-button pi-button-primary">Create account</button><p class="form-note">Creating an account does not automatically publish a profile. Publication follows the applicable review or confirmation process.</p>
      </form></div></section></main>`;
  }

  function init() {
    document.querySelectorAll("[data-pi-menu]").forEach((button) => button.addEventListener("click", () => {
      const drawer = document.querySelector(".pi-mobile-drawer");
      if (!drawer) return;
      const open = !drawer.classList.contains("open");
      if (open) window.__piMenuReturnFocus = document.activeElement;
      drawer.classList.toggle("open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("pi-menu-open", open);
      document.querySelectorAll("[data-pi-menu]").forEach((item) => item.setAttribute("aria-expanded", String(open)));
      if (open) drawer.querySelector("button, a")?.focus();
      else window.__piMenuReturnFocus?.focus?.();
    }));
    document.querySelector(".pi-mobile-drawer")?.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      const drawer = event.currentTarget;
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
      document.body.classList.remove("pi-menu-open");
    });
    document.addEventListener("keydown", (event) => {
      const drawer = document.querySelector(".pi-mobile-drawer.open");
      if (!drawer) return;
      if (event.key === "Escape") {
        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
        document.body.classList.remove("pi-menu-open");
        document.querySelectorAll("[data-pi-menu]").forEach((item) => item.setAttribute("aria-expanded", "false"));
        window.__piMenuReturnFocus?.focus?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = [...drawer.querySelectorAll('a[href], button:not([disabled])')];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.querySelectorAll("[data-filter-toggle]").forEach((button) => button.addEventListener("click", () => {
      document.getElementById("pi-filter-rail")?.classList.toggle("open");
    }));
    document.querySelectorAll("[data-profile-tab]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-profile-tab]").forEach((item)=>item.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.profileTab)?.scrollIntoView({behavior:"smooth",block:"start"});
    }));
    document.querySelectorAll("[data-pi-tab]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-pi-tab]").forEach((item)=>item.classList.remove("active"));
      button.classList.add("active");
    }));
    document.querySelectorAll("[data-account-role]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll("[data-account-role]").forEach((item)=>item.classList.remove("active"));
      button.classList.add("active");
      const role = button.dataset.accountRole;
      const input = document.getElementById("pi-account-role");
      if (input) input.value = role;
      const nameLabel = document.getElementById("pi-identity-name-label");
      if (nameLabel) nameLabel.textContent = role === "candidate" ? "Public profile name" : role === "organization" ? "Organization name" : "Business or professional name";
      const category = document.querySelector('#signup-form select[name="category"]');
      if (category && role === "candidate") category.value = "Candidate / Titleholder";
      if (category && role === "organization") category.value = "Pageant Organization";
      if (category && role === "professional" && ["Candidate / Titleholder","Pageant Organization"].includes(category.value)) category.value = "";
    }));
    const roleFromQuery = new URLSearchParams(location.search).get("role");
    if (roleFromQuery) document.querySelector(`[data-account-role="${roleFromQuery}"]`)?.click();

    document.getElementById("pi-report-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const status = document.getElementById("pi-report-status");
      const button = form.querySelector("button");
      button.disabled = true;
      const caseReference = `PI-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
      try {
        await submitIntake("report", form, {payload:{case_reference:caseReference}});
        form.innerHTML = `<div class="pi-report-success">${icon("shield")}<h2>Report received.</h2><p>Your case reference is:</p><strong>${caseReference}</strong><small>Keep this reference for any follow-up.</small></div>`;
      } catch (error) {
        status.textContent = error.message;
        status.className = "error";
        button.disabled = false;
      }
    });
  }

  return {
    header,
    footer,
    home,
    directory,
    professionalProfile,
    candidates,
    candidateProfile,
    organizations,
    organizationProfile,
    events,
    edition,
    commerce,
    judge,
    tabulation,
    trust,
    report,
    account,
    init,
  };
})();
