"use strict";

(() => {
  const body = document.body;
  if (!body) return;
  body.classList.add("pi-v2");

  const page = body.dataset.page || body.dataset.experience || (document.getElementById("organization-app") ? "organization" : "");
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";

  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
  const safeUrl = (value) => {
    try {
      const url = new URL(String(value || ""), location.origin);
      return ["http:","https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };

  function wordmark(inverse = false) {
    return `<a class="pi-wordmark" href="/" aria-label="PageantIndex home"><img src="/public/images/pageant-icon.png" alt=""><div><strong style="${inverse ? "color:#fff" : ""}">PageantIndex</strong><span style="${inverse ? "color:#a99fa6" : ""}">The Global Network for Pageantry</span></div></a>`;
  }

  function header() {
    return `<header class="pi-launch-header"><div class="inner">${wordmark()}<nav aria-label="Primary navigation"><a href="/directory/">Search the Index</a><a href="/#how-it-works">How it works</a><a href="/#trust">Trust & confirmations</a></nav><div class="pi-header-actions"><a class="pi-button secondary" href="/sign-in/">Sign in</a><a class="pi-button primary" href="/sign-up/">Create or claim profile</a><button class="pi-header-menu" type="button" aria-label="Open menu">☰</button></div></div></header>`;
  }

  function footer() {
    return `<footer class="pi-launch-footer"><div class="pi-container inner"><span>© 2026 PageantIndex. One global platform, one relationship graph.</span><span>Philippines is the first actively populated market.</span></div></footer>`;
  }

  function renderHome() {
    const root = document.getElementById("app");
    if (!root) return;
    document.title = "PageantIndex | Global Professional Identity for Pageantry";
    root.innerHTML = `${header()}<main class="pi-launch">
      <section class="pi-home-hero"><div class="pi-container pi-home-grid"><div class="pi-home-copy"><h1>The professional <em>index</em> of pageantry.</h1><p>PageantIndex is building the global professional identity and relationship infrastructure for pageantry. Create a free public profile, preserve verified professional history, and connect the people, candidates, and organizations behind every pageant.</p><form class="pi-search" id="pi-global-search"><input name="q" autocomplete="off" placeholder="Search a person, supplier, pageant organization, category, or place" aria-label="Search PageantIndex"><button>Search the Index</button></form><div class="pi-hero-actions"><a class="pi-button primary" href="/sign-up/">Create a free profile</a><a class="claim" href="/claim-profile/">Claim an existing profile →</a></div></div>
      <aside class="pi-network-card" aria-label="PageantIndex relationship graph"><div class="pi-network-label"><strong>Relationship graph</strong><span>Who worked with whom</span></div><div class="pi-graph"><span class="pi-graph-line l1"></span><span class="pi-graph-line l2"></span><span class="pi-graph-line l3"></span><span class="pi-graph-line l4"></span><span class="pi-graph-line l5"></span><article class="pi-node n1"><small>Organization</small><strong>Miss Pageant</strong></article><article class="pi-node gold n2"><small>Edition</small><strong>2026</strong></article><article class="pi-node n3"><small>Candidate</small><strong>Candidate X</strong></article><article class="pi-node gold n4"><small>Professional</small><strong>Photographer</strong></article><article class="pi-node n5"><small>Structured credit</small><strong>Photographer for Candidate X · Miss Pageant 2026</strong></article></div><div class="pi-graph-caption">Example relationship model only. Confirmation status determines how a credit is represented publicly.</div></aside></div></section>

      <section class="pi-role-band" id="how-it-works"><div class="pi-container"><div class="pi-section-head"><h2>Start with your identity in pageantry.</h2><p>At launch, PageantIndex stays focused. One free profile system serves professionals, candidates, and pageant organizations. Each profile can build a trusted history through structured credits and confirmations.</p></div><div class="pi-role-grid"><a class="pi-role-card" href="/sign-up/?role=professional"><span class="num">01</span><h3>Supplier / Professional</h3><p>Build a portfolio, list services, add previous credits, receive invitations, and request confirmation of your pageant work.</p><b>Create profile →</b></a><a class="pi-role-card" href="/sign-up/?role=candidate"><span class="num">02</span><h3>Candidate / Titleholder</h3><p>Build a permanent pageant identity, preserve participation history, and confirm personal suppliers who worked directly with you.</p><b>Create profile →</b></a><a class="pi-role-card" href="/sign-up/?role=organization"><span class="num">03</span><h3>Pageant Organization</h3><p>Claim your institutional profile, manage editions and admins, add candidates, invite official suppliers, and confirm official roles.</p><b>Claim organization →</b></a></div></div></section>

      <section class="pi-trust" id="trust"><div class="pi-container pi-trust-layout"><div class="pi-trust-copy"><h2>Verification is not the same as a pageant credit.</h2><p>PageantIndex keeps identity verification and relationship confirmation separate. That protects the meaning of every public indicator and prevents a candidate supplier from being presented as an official pageant supplier without organization confirmation.</p></div><div class="pi-trust-list"><article class="pi-trust-item"><span class="pi-trust-mark">ID</span><div><h3>Identity Verified</h3><p>PageantIndex confirms the person or authorized account holder through the platform’s identity verification process.</p></div><span>PageantIndex trust layer</span></article><article class="pi-trust-item"><span class="pi-trust-mark candidate">C</span><div><h3>Candidate Confirmed</h3><p>The candidate confirms that a supplier or professional worked directly with her in the stated role.</p></div><span>Candidate relationship</span></article><article class="pi-trust-item"><span class="pi-trust-mark org">O</span><div><h3>Organization Confirmed</h3><p>The pageant organization confirms an official pageant-level role for a specific edition.</p></div><span>Official relationship</span></article></div></div></section>

      <section class="pi-model"><div class="pi-container"><h2>The website is the interface. The <em>relationship graph</em> is the asset.</h2><div class="pi-equation"><div><small>Field 01</small><strong>Pageant Name</strong></div><div><small>Field 02</small><strong>Year / Edition</strong></div><div><small>Field 03</small><strong>Candidate</strong></div><div><small>Field 04</small><strong>Supplier</strong></div><div><small>Field 05</small><strong>Role</strong></div></div><div class="pi-model-note"><p>A candidate-specific supplier relationship requires the candidate link. An organization-level official supplier relationship can omit the candidate.</p><p>Self-added credits remain unconfirmed until the relevant candidate or organization approves them.</p></div></div></section>

      <section class="pi-final-cta"><div class="pi-container"><div class="pi-final-box"><div><h2>Your pageant history should be easier to prove, share, and discover.</h2><p>Basic profiles remain free because a more complete index makes the network more useful for everyone. PageantIndex monetizes around the network, not simply by charging people to exist.</p></div><div class="pi-final-actions"><a class="pi-button primary" href="/sign-up/">Create free profile</a><a class="pi-button secondary" href="/directory/">Search the Index</a></div></div></div></section>
    </main>${footer()}`;
    root.querySelector("#pi-global-search")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const q = new FormData(event.currentTarget).get("q") || "";
      location.href = `/directory/?q=${encodeURIComponent(String(q).trim())}`;
    });
  }

  function installHeaderFooter() {
    const oldHeader = document.querySelector(".site-header");
    if (oldHeader) oldHeader.outerHTML = header();
    document.querySelector(".announcement-bar")?.remove();
    const oldFooter = document.querySelector(".site-footer");
    if (oldFooter) oldFooter.outerHTML = footer();
  }

  function rebrandDirectory() {
    document.title = "Search the Global Pageant Index | PageantIndex";
    installHeaderFooter();
    const hero = document.querySelector(".directory-intro > div");
    if (hero) {
      const h1 = hero.querySelector("h1");
      const p = hero.querySelector("p");
      if (h1) h1.textContent = "Search the global pageant industry.";
      if (p) p.textContent = "Find published professional profiles by category, location, service, or name. The Philippines is the first market being actively populated, but PageantIndex is one global index.";
      const actions = hero.querySelector(".empty-actions");
      if (actions) actions.innerHTML = `<a class="btn btn-primary" href="/sign-up/">Create free profile</a><a class="btn btn-secondary" href="/claim-profile/">Claim a profile</a>`;
    }
    document.querySelectorAll("#public-filter-location option").forEach((option, i) => { if (i === 0) option.textContent = "All locations"; });
    document.querySelectorAll('a[href^="/professional/"]').forEach((link) => {
      const parts = link.getAttribute("href").split("/").filter(Boolean);
      const slug = parts[parts.length - 1];
      link.setAttribute("href", `/profile/?slug=${encodeURIComponent(slug)}`);
      if (/view profile/i.test(link.textContent)) link.textContent = "Open profile";
    });
    const emptyTitle = document.querySelector(".directory-launch h2");
    if (emptyTitle) emptyTitle.textContent = "The global index is being populated with real profiles.";
    const emptyCopy = document.querySelector(".directory-launch .section-copy");
    if (emptyCopy) emptyCopy.textContent = "PageantIndex does not publish invented people, businesses, credits, or confirmation signals. Create or claim a free profile to join the index.";
  }

  function rebrandDashboard() {
    document.title = "Profile Dashboard | PageantIndex";
    const top = document.querySelector(".product-topbar");
    if (top) {
      const h1 = top.querySelector("h1");
      const p = top.querySelector("p");
      if (h1) h1.textContent = "Professional Profile Dashboard";
      if (p) p.textContent = "Manage the public identity, portfolio, credits, invitations, and verification that make up your PageantIndex profile.";
    }
    document.querySelectorAll(".brand-type strong").forEach((node) => node.textContent = "PageantIndex");
    document.querySelectorAll(".brand-type small").forEach((node) => node.remove());
    const nav = document.querySelector(".product-sidebar nav");
    if (nav && !nav.querySelector('[data-workspace-nav="credits"]')) {
      const items = [
        ["credits","Credits"],["invitations","Invitations"],["verification","Verification"]
      ];
      items.forEach(([id,label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.workspaceNav = id;
        button.innerHTML = `<span style="width:18px;text-align:center">${label[0]}</span><span>${label}</span>`;
        nav.appendChild(button);
      });
    }
    document.querySelectorAll(".private-memberships,.dashboard-ad-link").forEach((el) => el.remove());
    const steps = [...document.querySelectorAll(".profile-steps button span")];
    const replacement = ["Identity","About","Services","Portfolio","Credits","Contact","Preview"];
    steps.forEach((node, i) => { if (replacement[i]) node.textContent = replacement[i]; });
    const workspace = document.querySelector(".profile-workspace");
    if (workspace && !document.querySelector(".pi-launch-rail")) {
      workspace.insertAdjacentHTML("beforebegin", `<section class="pi-launch-rail"><article><small>Professional identity</small><strong>Public profile</strong><p>Your free PageantIndex identity, services, location, portfolio, official links, and public contact information.</p><a href="#profile-editor-form">Edit identity →</a></article><article><small>Relationship history</small><strong>Pageant credits</strong><p>Add previous pageant work and request confirmation from the relevant candidate or organization.</p><button type="button" data-pi-panel="credits">Manage credits →</button></article><article><small>Trust layer</small><strong>Verification</strong><p>Identity verification remains separate from Candidate Confirmed and Organization Confirmed credit relationships.</p><button type="button" data-pi-panel="verification">Review trust status →</button></article></section>`);
    }
    const previewLocation = document.getElementById("live-location");
    if (previewLocation && /philippines/i.test(previewLocation.textContent)) previewLocation.textContent = "Location";
    const previewStatus = document.querySelector(".preview-identity .status");
    if (previewStatus) previewStatus.textContent = "Profile under review";
    const previewButton = document.querySelector(".public-profile-preview .btn-primary");
    if (previewButton) previewButton.textContent = "Contact professional";
    const previewSmall = document.querySelector(".public-profile-preview > small");
    if (previewSmall) previewSmall.textContent = "Contact options appear after profile publication.";

    const showPanel = (type) => {
      document.querySelector("#pi-dashboard-detail")?.remove();
      const html = type === "credits" ? `<section class="pi-panel" id="pi-dashboard-detail"><div class="pi-panel-head"><div><h2>Pageant credits</h2><p>Credits connect a pageant, edition, candidate when applicable, professional, and role. Self-added credits remain unconfirmed until approved by the relevant candidate or organization.</p></div><span class="pi-status">Unconfirmed by default</span></div><div class="pi-empty"><strong>No structured credits connected yet</strong><p>Add-credit persistence and confirmation routing are the next database layer. Nothing shown here is presented as confirmed without an approving relationship.</p></div></section>` : `<section class="pi-panel" id="pi-dashboard-detail"><div class="pi-panel-head"><div><h2>Verification & confirmations</h2><p>These trust signals have different meanings and must never be collapsed into one badge.</p></div></div><div class="pi-trust-list"><article class="pi-trust-item"><span class="pi-trust-mark">ID</span><div><h3>Identity Verified</h3><p>PageantIndex identity verification status.</p></div><span>Identity layer</span></article><article class="pi-trust-item"><span class="pi-trust-mark candidate">C</span><div><h3>Candidate Confirmed</h3><p>Candidate approval applies only to the candidate-specific relationship.</p></div><span>Relationship layer</span></article><article class="pi-trust-item"><span class="pi-trust-mark org">O</span><div><h3>Organization Confirmed</h3><p>Organization approval is required before an official pageant-level role is represented as official.</p></div><span>Official layer</span></article></div></section>`;
      workspace?.insertAdjacentHTML("beforebegin", html);
      document.querySelector("#pi-dashboard-detail")?.scrollIntoView({behavior:"smooth",block:"start"});
    };
    document.querySelectorAll("[data-pi-panel='credits'],[data-workspace-nav='credits']").forEach((btn) => btn.addEventListener("click", () => showPanel("credits")));
    document.querySelectorAll("[data-pi-panel='verification'],[data-workspace-nav='verification']").forEach((btn) => btn.addEventListener("click", () => showPanel("verification")));
    document.querySelectorAll("[data-workspace-nav='invitations']").forEach((btn) => btn.addEventListener("click", () => {
      document.querySelector("#pi-dashboard-detail")?.remove();
      workspace?.insertAdjacentHTML("beforebegin", `<section class="pi-panel" id="pi-dashboard-detail"><div class="pi-panel-head"><div><h2>Invitations</h2><p>Organizations can invite official suppliers. Candidates can invite personal suppliers. Each invitation carries the pageant, edition, inviter, and proposed role.</p></div></div><div class="pi-empty"><strong>No pending invitations</strong><p>Accepted invitations will attach to this same PageantIndex identity rather than creating duplicate profiles.</p></div></section>`);
      document.querySelector("#pi-dashboard-detail")?.scrollIntoView({behavior:"smooth",block:"start"});
    }));
  }

  function rebrandAuth() {
    document.title = page === "signup" ? "Create or Claim a Profile | PageantIndex" : "Sign In | PageantIndex";
    document.querySelectorAll(".brand-type strong").forEach((node) => node.textContent = "PageantIndex");
    document.querySelectorAll(".brand-type small").forEach((node) => node.remove());
    const visualTitle = document.querySelector(".auth-visual-copy h1");
    const visualCopy = document.querySelector(".auth-visual-copy p");
    if (visualTitle) visualTitle.textContent = "Your professional pageant history, connected.";
    if (visualCopy) visualCopy.textContent = "One global identity for professionals, candidates, and pageant organizations. Build a public profile and preserve relationships that can be confirmed by the people and organizations involved.";
    const card = document.querySelector(".auth-card");
    if (card && !card.querySelector(".pi-role-picker")) {
      const currentRole = new URLSearchParams(location.search).get("role") || "professional";
      const picker = document.createElement("div");
      picker.className = "pi-role-picker";
      picker.innerHTML = `<a class="${currentRole === "professional" ? "active" : ""}" href="/sign-up/?role=professional">Professional</a><a class="${currentRole === "candidate" ? "active" : ""}" href="/candidate/">Candidate</a><a class="${currentRole === "organization" ? "active" : ""}" href="/organization/">Organization</a>`;
      const intro = card.querySelector(".muted");
      intro?.insertAdjacentElement("afterend", picker);
    }
    const h2 = card?.querySelector("h2");
    if (h2) h2.textContent = page === "signup" ? "Create your PageantIndex profile" : "Welcome back";
    const muted = card?.querySelector(".muted");
    if (muted) muted.textContent = page === "signup" ? "Basic profiles are free. Start with the identity you control." : "Sign in to manage your PageantIndex profile and relationship history.";
    const apply = card?.querySelector(".auth-apply");
    if (apply) apply.innerHTML = `Already have a profile in the index? <a href="/claim-profile/">Claim it instead</a>`;
  }

  function roleWorkspace(role) {
    const root = role === "organization" ? document.getElementById("organization-app") : document.getElementById("experience-app");
    if (!root) return;
    const isCandidate = role === "candidate";
    const title = isCandidate ? "Candidate / Titleholder Profile" : "Pageant Organization Profile";
    const copy = isCandidate ? "Manage your public pageant identity, pageant history, personal supplier relationships, invitations, and verification." : "Manage your public organization identity, authorized admins, editions, candidates, official supplier invitations, and verification.";
    const profileFields = isCandidate ? `<div class="pi-form-grid"><label class="pi-field"><span>Public name</span><input placeholder="Your public name"></label><label class="pi-field"><span>Country / market</span><input placeholder="Country"></label><label class="pi-field"><span>Current title</span><input placeholder="Optional"></label><label class="pi-field"><span>Location</span><input placeholder="City / region / country"></label><label class="pi-field full"><span>Public biography</span><textarea placeholder="Tell the pageant industry who you are."></textarea></label></div>` : `<div class="pi-form-grid"><label class="pi-field"><span>Organization name</span><input placeholder="Official organization name"></label><label class="pi-field"><span>Country / market</span><input placeholder="Country"></label><label class="pi-field"><span>Official website</span><input type="url" placeholder="https://"></label><label class="pi-field"><span>Public contact email</span><input type="email" placeholder="contact@example.com"></label><label class="pi-field full"><span>About the organization</span><textarea placeholder="Describe the organization and the pageants it operates."></textarea></label></div>`;
    const rolePanels = isCandidate ? {
      credits:["Pageant history","Your pageant participation, titles, and placements can become part of a permanent public history.","No pageant history connected yet","Add a pageant edition when the profile relationship database is connected."],
      invitations:["Personal supplier invitations","Invite photographers, designers, makeup artists, trainers, stylists, and other personal suppliers who worked directly with you.","No invitations sent","Candidate-confirmed relationships will remain separate from organization-confirmed official supplier roles."],
      verification:["Verification & confirmations","Identity verification confirms you. Candidate confirmation is the relationship signal you can give to suppliers who worked directly with you.","No verification status available","Identity verification and relationship confirmation will remain separate trust layers."]
    } : {
      credits:["Editions & official relationships","Each edition can connect candidates and official suppliers to the organization with specific roles.","No editions connected yet","Organization-level official supplier relationships do not require a candidate link."],
      invitations:["Official supplier invitations","Invite a supplier to a specific edition and proposed official role without creating a duplicate professional identity.","No pending invitations","Accepted invitations will attach the role to the supplier’s existing PageantIndex profile."],
      verification:["Organization verification","Authorized organization accounts can confirm official pageant-level roles. This is distinct from PageantIndex identity verification.","No organization verification status available","Official role confirmation must come from an authorized organization admin."]
    };
    root.innerHTML = `<div class="pi-workspace"><header class="pi-workspace-head"><div class="inner">${wordmark()}<div class="spacer"></div><a class="pi-button secondary" href="/directory/">Search the Index</a><a class="pi-button primary" href="/">Public site</a></div></header><main class="pi-workspace-body"><section class="pi-workspace-intro"><div><h1>${title}</h1><p>${copy}</p></div><div class="pi-workspace-actions"><button class="pi-button secondary" type="button" data-workspace-action="save">Save draft</button><button class="pi-button primary" type="button" data-workspace-action="preview">Preview public profile</button></div></section><div class="pi-workspace-grid"><nav class="pi-workspace-nav" aria-label="Profile workspace"><button class="active" data-tab="profile">Profile</button><button data-tab="credits">${isCandidate ? "Pageant history" : "Editions"}</button><button data-tab="invitations">Invitations</button><button data-tab="verification">Verification</button><button data-tab="settings">Settings</button></nav><section class="pi-workspace-main" id="pi-role-content"><article class="pi-panel"><div class="pi-panel-head"><div><h2>Public profile</h2><p>This information is designed to become the polished public page anyone can open without logging in.</p></div><span class="pi-status">Draft</span></div>${profileFields}</article><article class="pi-panel"><div class="pi-panel-head"><div><h2>Structured relationships</h2><p>The core record is Pageant Name + Year/Edition + Candidate when applicable + Supplier + Role.</p></div></div><div class="pi-empty"><strong>No relationships connected yet</strong><p>Nothing is shown as Candidate Confirmed or Organization Confirmed until the relevant relationship has actually been approved.</p></div></article></section></div></main></div>`;

    const content = root.querySelector("#pi-role-content");
    const renderTab = (tab) => {
      root.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      if (tab === "profile") {
        content.innerHTML = `<article class="pi-panel"><div class="pi-panel-head"><div><h2>Public profile</h2><p>This information is designed to become the polished public page anyone can open without logging in.</p></div><span class="pi-status">Draft</span></div>${profileFields}</article><article class="pi-panel"><div class="pi-panel-head"><div><h2>Structured relationships</h2><p>The core record is Pageant Name + Year/Edition + Candidate when applicable + Supplier + Role.</p></div></div><div class="pi-empty"><strong>No relationships connected yet</strong><p>Nothing is shown as Candidate Confirmed or Organization Confirmed until the relevant relationship has actually been approved.</p></div></article>`;
        return;
      }
      if (tab === "settings") {
        content.innerHTML = `<article class="pi-panel"><div class="pi-panel-head"><div><h2>Profile settings</h2><p>Manage profile visibility, official links, account authority, and future account controls.</p></div></div><div class="pi-empty"><strong>Settings surface ready</strong><p>Production account controls remain governed by authenticated server-side permissions.</p></div></article>`;
        return;
      }
      const [heading,description,empty,emptyCopy] = rolePanels[tab];
      content.innerHTML = `<article class="pi-panel"><div class="pi-panel-head"><div><h2>${heading}</h2><p>${description}</p></div></div><div class="pi-empty"><strong>${empty}</strong><p>${emptyCopy}</p></div></article>`;
    };
    root.querySelectorAll("[data-tab]").forEach((btn) => btn.addEventListener("click", () => renderTab(btn.dataset.tab)));
    root.querySelector('[data-workspace-action="save"]')?.addEventListener("click", (event) => { event.currentTarget.textContent = "Saved locally"; setTimeout(() => event.currentTarget.textContent = "Save draft", 1400); });
    root.querySelector('[data-workspace-action="preview"]')?.addEventListener("click", () => { alert("Public profile preview will use only published, confirmed profile data once this role workspace is connected to production records."); });
  }

  async function renderPublicProfile() {
    const root = document.getElementById("profile-app");
    if (!root) return;
    const slug = new URLSearchParams(location.search).get("slug") || "";
    root.innerHTML = `${header()}<main class="pi-public-profile"><section class="pi-profile-hero-v2"><div class="pi-container"><div class="pi-profile-crumbs"><a href="/">Home</a> / <a href="/directory/">Index</a> / Profile</div><div class="pi-empty"><strong>Loading public profile…</strong><p>Retrieving the published PageantIndex record.</p></div></div></section></main>${footer()}`;
    if (!slug) { root.querySelector(".pi-empty").innerHTML = `<strong>Profile not specified</strong><p>Open a published professional from the PageantIndex search results.</p>`; return; }
    try {
      const fields = "id,slug,public_name,category,location,city,headline,biography,public_email,mobile,website_url,social_url,logo_url,cover_url,services,years_experience,accepts_nationwide,available_for_travel,status,verification_status,featured,published_at,updated_at";
      const response = await fetch(`${SUPABASE_URL}/rest/v1/suppliers?select=${fields}&slug=eq.${encodeURIComponent(slug)}&status=eq.published&limit=1`, {headers:{apikey:SUPABASE_KEY}});
      if (!response.ok) throw new Error(`Profile request failed (${response.status})`);
      const rows = await response.json();
      const p = rows?.[0];
      if (!p) throw new Error("Profile unavailable");
      document.title = `${p.public_name} | PageantIndex`;
      const image = safeUrl(p.logo_url || p.cover_url) || "/public/images/pageant-icon.png";
      const website = safeUrl(p.website_url);
      const social = safeUrl(p.social_url);
      const verified = p.verification_status === "verified";
      const services = Array.isArray(p.services) ? p.services : [];
      root.innerHTML = `${header()}<main class="pi-public-profile"><section class="pi-profile-hero-v2"><div class="pi-container"><div class="pi-profile-crumbs"><a href="/">Home</a> / <a href="/directory/">Index</a> / ${esc(p.public_name)}</div><div class="pi-profile-identity"><img class="pi-profile-avatar-v2" src="${esc(image)}" alt="${esc(p.public_name)}"><div class="pi-profile-title"><h1>${esc(p.public_name)}</h1><p>${esc(p.category || "Pageant professional")} · ${esc([p.city,p.location].filter(Boolean).join(", ") || "Location not published")}</p><div class="pi-badges">${verified ? '<span class="pi-status identity">Identity Verified</span>' : '<span class="pi-status">Identity not verified</span>'}<span class="pi-status">Credits shown by confirmation state</span></div></div><div class="pi-profile-actions-v2"><button class="pi-button secondary" id="pi-share-profile">Share profile</button>${p.public_email ? `<a class="pi-button primary" href="mailto:${esc(p.public_email)}">Contact</a>` : ""}</div></div></div></section><div class="pi-container pi-profile-content"><section><article class="pi-profile-section-v2"><h2>Professional identity</h2>${p.headline ? `<p><strong>${esc(p.headline)}</strong></p>` : ""}<p>${esc(p.biography || "This professional has not published a biography yet.")}</p><div class="pi-detail-grid"><div><small>Category</small><strong>${esc(p.category || "Not specified")}</strong></div><div><small>Experience</small><strong>${p.years_experience ? `${esc(p.years_experience)} years` : "Not specified"}</strong></div><div><small>Coverage</small><strong>${p.available_for_travel ? "Available for travel" : p.accepts_nationwide ? "Nationwide" : esc(p.location || "Not specified")}</strong></div></div></article><article class="pi-profile-section-v2"><h2>Services</h2>${services.length ? `<div class="pi-credit-list">${services.map((s) => `<div class="pi-credit"><div><strong>${esc(s)}</strong><span>Service listed by profile owner</span></div></div>`).join("")}</div>` : `<div class="pi-empty"><strong>No services published yet</strong><p>The profile owner can add services from the dashboard.</p></div>`}</article><article class="pi-profile-section-v2"><h2>Pageant credits</h2><div class="pi-empty"><strong>No confirmed structured credits published yet</strong><p>Credits will identify the pageant, edition, candidate when applicable, supplier, role, and confirmation source. PageantIndex does not infer official status from candidate-level work.</p></div></article><article class="pi-profile-section-v2"><h2>Portfolio</h2><div class="pi-portfolio-empty">Portfolio assets will appear here when published from the profile workspace.</div></article></section><aside class="pi-profile-aside-v2"><article class="pi-aside-card dark"><h3>Trust status</h3><p>${verified ? "Identity Verified means PageantIndex has completed the identity verification layer for this profile. It does not automatically verify pageant credits." : "This profile does not currently display an Identity Verified status."}</p></article><article class="pi-aside-card"><h3>Relationship confirmations</h3><p>Candidate Confirmed and Organization Confirmed apply to individual pageant relationships, not to the entire profile.</p></article>${website ? `<article class="pi-aside-card"><h3>Official link</h3><a class="pi-button secondary" target="_blank" rel="noopener" href="${esc(website)}">Open website</a></article>` : social ? `<article class="pi-aside-card"><h3>Official link</h3><a class="pi-button secondary" target="_blank" rel="noopener" href="${esc(social)}">Open social profile</a></article>` : ""}</aside></div></main>${footer()}`;
      document.getElementById("pi-share-profile")?.addEventListener("click", async () => {
        try { await navigator.share?.({title:p.public_name,url:location.href}) || navigator.clipboard.writeText(location.href); } catch {}
      });
      const schema = document.createElement("script");
      schema.type = "application/ld+json";
      schema.textContent = JSON.stringify({"@context":"https://schema.org","@type":"Person","name":p.public_name,"url":location.href,"jobTitle":p.category || undefined,"description":p.biography || p.headline || undefined,"sameAs":[website,social].filter(Boolean)});
      document.head.appendChild(schema);
    } catch (error) {
      root.innerHTML = `${header()}<main class="pi-public-profile"><section class="pi-profile-hero-v2"><div class="pi-container"><div class="pi-profile-crumbs"><a href="/">Home</a> / <a href="/directory/">Index</a> / Profile</div><div class="pi-empty"><strong>Profile unavailable</strong><p>This profile is not currently published in the PageantIndex public index.</p><div style="margin-top:16px"><a class="pi-button primary" href="/directory/">Search the Index</a></div></div></div></section></main>${footer()}`;
    }
  }

  if (page === "home") renderHome();
  else if (page === "directory") rebrandDirectory();
  else if (page === "dashboard") rebrandDashboard();
  else if (page === "signin" || page === "signup") rebrandAuth();
  else if (page === "candidate") roleWorkspace("candidate");
  else if (page === "organization") roleWorkspace("organization");
  else if (page === "profile-v2") renderPublicProfile();
})();
