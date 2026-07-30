"use strict";

const categories = [
  ["Designers", "scissors"],
  ["Hair and Makeup", "sparkles"],
  ["Photography", "camera"],
  ["Videography", "video"],
  ["Pageant Camps", "training"],
  ["Coaches", "message"],
  ["Pageant Directors", "clipboard"],
  ["Hosts and Choreographers", "microphone"],
  ["Crown and Sash Suppliers", "crown"],
  ["Events and Production", "production"],
  ["Voting and Tabulation", "chart"],
  ["Venues and Hotels", "building"],
  ["Beauty and Wellness", "heart"],
  ["PR and Digital Services", "megaphone"],
];
const locations = [
  "Metro Manila",
  "Zambales",
  "Pampanga",
  "Bataan",
  "Tarlac",
  "Cebu",
  "Davao",
  "Iloilo",
  "Bacolod",
  "Cavite",
  "Laguna",
  "Bulacan",
];
let profiles = [];
const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
const SESSION_KEY = "pi_supabase_session";

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}
function isAdminSession() {
  return readSession()?.user?.app_metadata?.role === "admin";
}
async function supabaseRequest(pathname, options = {}) {
  const session = readSession();
  const headers = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...(options.headers || {}),
  };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const response = await fetch(`${SUPABASE_URL}${pathname}`, {...options, headers});
  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || payload?.error_description || payload?.hint || `Request failed (${response.status})`);
  return payload;
}
function normalizeSupplier(row) {
  return {
    ...row,
    id: row.slug,
    databaseId: row.id,
    name: row.public_name,
    category: row.category,
    location: row.location,
    city: row.city || row.location,
    desc: row.biography || row.headline || "",
    imageUrl: row.cover_url || row.logo_url || "/public/images/pageant-icon.png",
    services: Array.isArray(row.services) ? row.services : [],
    verified: row.verification_status === "verified",
    featured: Boolean(row.featured),
    nationwide: Boolean(row.accepts_nationwide),
    travel: Boolean(row.available_for_travel),
    years: row.years_experience || 0,
    updated: row.updated_at ? new Date(row.updated_at).toLocaleDateString("en-PH") : "",
  };
}
async function loadSuppliers(admin = false) {
  const fields = "id,slug,public_name,category,location,city,headline,biography,public_email,mobile,website_url,social_url,logo_url,cover_url,services,years_experience,accepts_nationwide,available_for_travel,status,verification_status,featured,featured_label,sort_order,published_at,created_at,updated_at";
  try {
    const filter = admin && isAdminSession() ? "" : "&status=eq.published";
    const rows = await supabaseRequest(`/rest/v1/suppliers?select=${fields}${filter}&order=featured.desc,sort_order.asc,public_name.asc`);
    profiles = (rows || []).map(normalizeSupplier);
  } catch (error) {
    profiles = [];
    window.__supplierLoadError = error.message;
  }
}
const articles = [
  {
    slug: "choose-pageant-photographer",
    tag: "Industry Guide",
    title: "How to Choose a Pageant Photographer",
    author: "Pageant Index Editorial",
    date: "July 25, 2026",
    time: "8 min read",
    image: "guide-photographer.webp",
    summary:
      "A practical guide to portfolios, usage rights, delivery timelines, direction style, and event coverage.",
  },
  {
    slug: "coronation-production-checklist",
    tag: "Production",
    title: "Complete Coronation Production Checklist",
    author: "Pageant Index Editorial",
    date: "July 22, 2026",
    time: "12 min read",
    image: "guide-production.webp",
    summary:
      "A production-ready checklist covering stage, lights, audio, livestream, rehearsals, safety, and contingencies.",
  },
  {
    slug: "hiring-pageant-coach",
    tag: "Pageant Business",
    title: "Questions to Ask Before Hiring a Pageant Coach",
    author: "Pageant Index Editorial",
    date: "July 18, 2026",
    time: "7 min read",
    image: "guide-coach.webp",
    summary:
      "What to clarify about coaching scope, ethics, preparation methods, boundaries, and expected outcomes.",
  },
  {
    slug: "choose-gown-designer",
    tag: "Design and Beauty",
    title: "How to Choose a Pageant Gown Designer",
    author: "Pageant Index Editorial",
    date: "July 15, 2026",
    time: "9 min read",
    image: "guide-designer.webp",
    summary:
      "How to evaluate design fit, timelines, budget, construction quality, fittings, and ownership terms.",
  },
];
const events = [];

const isAdminHost = window.location.hostname === "admin.pageantindex.com";
const page = isAdminHost ? "admin" : document.body.dataset.page || "home";
const path = window.__APP_PATH || window.location.pathname;
if (isAdminHost) {
  document.title = "Admin Dashboard | Pageant Index Philippines";
  let robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement("meta");
    robots.name = "robots";
    document.head.appendChild(robots);
  }
  robots.content = "noindex,nofollow";
}

const categoryIconPaths = {
  scissors:
    '<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.7 8.7 10.6 10.6M8.7 15.3 19 5"/>',
  sparkles:
    '<path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7L12 3Z"/><path d="m5 15-.8 2.2L2 18l2.2.8L5 21l.8-2.2L8 18l-2.2-.8L5 15Z"/>',
  camera:
    '<path d="M14.5 5 16 8h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3l1.5-3h5Z"/><circle cx="12" cy="14" r="3.5"/>',
  video:
    '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3v-4Z"/>',
  training:
    '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11.5V17c3.2 2.3 8.8 2.3 12 0v-5.5M22 9v6"/>',
  message:
    '<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"/><path d="M8 9h8M8 13h5"/>',
  clipboard:
    '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4"/>',
  microphone:
    '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/>',
  crown: '<path d="m3 18 2-10 4 4 3-7 3 7 4-4 2 10H3Z"/><path d="M5 21h14"/>',
  production:
    '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M7 5l3 5M13 5l3 5"/>',
  chart:
    '<path d="M4 20V10M10 20V6M16 20v-8M3 20h18"/><path d="m14 7 2 2 4-5"/>',
  building:
    '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/><path d="m18 2 .5 1.5L20 4l-1.5.5L18 6l-.5-1.5L16 4l1.5-.5L18 2Z"/>',
  megaphone:
    '<path d="m3 11 14-6v14L3 13v-2Z"/><path d="M11 16v4a2 2 0 0 1-2 2H7l-2-8M17 9a4 4 0 0 1 0 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};

function svgIcon(name, className = "") {
  const pathData =
    categoryIconPaths[name] || '<path d="M5 12h14M13 6l6 6-6 6"/>';
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${pathData}</svg>`;
}
function iconLabel(name) {
  const assets = {
    training: "graduation-cap", message: "message-circle", clipboard: "clipboard-list",
    microphone: "mic-vocal", production: "clapperboard", chart: "chart-no-axes-combined",
    building: "building-2", heart: "heart-pulse"
  };
  return `<span class="category-icon" aria-hidden="true"><img src="/public/icons/${assets[name] || name}.svg" alt=""></span>`;
}
function assetIcon(name, className = "") {
  return `<img class="asset-icon ${className}" src="/public/icons/${name}.svg" alt="" aria-hidden="true">`;
}
function brandLockup(inverse = false) {
  return `<span class="brand-lockup${inverse ? " inverse" : ""}"><img src="/public/images/pageant-icon.png" alt=""><span class="brand-type"><strong>PAGEANT INDEX</strong><small>PHILIPPINES</small></span></span>`;
}
function announcementBar() {
  const message = `<span>Pageant Index Philippines</span><i aria-hidden="true"></i><span>Founding directory applications are open</span><i aria-hidden="true"></i><a href="/list-your-business/">Apply to be listed</a>`;
  return `<aside class="announcement-bar" aria-label="Pageant Index announcement"><div class="announcement-track"><div>${message}</div><div aria-hidden="true">${message}</div><div aria-hidden="true">${message}</div></div></aside>`;
}
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}
function badgeHtml(p) {
  return `${p.verified ? '<span class="badge verified-badge">Verified</span>' : ""}${p.featured ? '<span class="badge gold-badge">Featured</span>' : ""}`;
}
function listingCard(p) {
  return `<article class="listing-card">
    ${p.featured ? '<span class="ribbon">Featured</span>' : ""}
    <div class="card-media"><img src="/public/images/${p.image}" alt="Portfolio preview for ${p.name}" decoding="async"></div>
    <div class="card-body">
      <h3 class="card-title">${p.name}</h3><div class="card-category">${p.category}</div>
      <div class="card-meta">● ${p.city}, ${p.location}</div>
      <div class="card-meta"><span class="rating">★ ${p.rating}</span> <span>(${p.reviews} verified reviews)</span></div>
      <div class="verified">${p.verified ? "Verified profile" : "Basic profile"}</div>
      <div class="portfolio-strip">${[1, 2, 3, 4].map((i) => `<img loading="lazy" src="/public/images/gallery-${i}.jpg" alt="${p.name} portfolio item ${i}">`).join("")}</div>
      <div class="card-actions"><a class="btn btn-secondary btn-small" href="/professional/${p.id}/">View Profile</a><button class="btn btn-primary btn-small inquiry-trigger" data-profile="${p.id}">Send Inquiry</button></div>
    </div></article>`;
}
function resultCard(p) {
  const aliases =
    {
      Photography: "photographer pageant photographer photo studio",
      "Hair and Makeup": "makeup artist hair stylist hmu",
      Designers: "gown designer national costume designer fashion designer",
      "Pageant Camps": "pageant camp training",
      Coaches: "pageant coach q and a coach",
      "Voting and Tabulation": "voting provider tabulation provider",
      "Events and Production":
        "production team lights sound led wall livestreaming team",
      "Crown and Sash Suppliers": "crown supplier sash supplier",
      "PR and Digital Services":
        "pr agency branding social media website digital services",
    }[p.category] || "";
  const searchText =
    `${p.name} ${p.category} ${p.location} ${p.city} ${p.desc} ${p.services.join(" ")} ${aliases}`
      .toLowerCase()
      .replaceAll('"', "");
  return `<article class="result-card ${p.featured ? "featured-result" : ""}" data-profile-card data-name="${p.name.toLowerCase()}" data-search="${searchText}" data-category="${p.category}" data-location="${p.location}" data-verified="${p.verified}" data-featured="${p.featured}" data-nationwide="${p.nationwide}" data-travel="${p.travel}" data-rating="${p.rating}" data-views="${p.views}" data-updated="${p.updated}">
    ${p.featured ? '<span class="ribbon">Featured</span>' : ""}<div class="card-media"><img loading="lazy" src="/public/images/${p.image}" alt="${p.name} portfolio"></div>
    <div class="result-content"><div class="profile-badges">${badgeHtml(p)}</div><h3>${p.name}</h3><div class="card-category">${p.category} · ${p.city}, ${p.location}</div><p class="result-desc">${p.desc}</p><div class="card-meta"><span class="rating">★ ${p.rating}</span> ${p.reviews} verified reviews · ${p.years} years experience</div><div class="card-meta">${p.nationwide ? "Accepts nationwide projects" : "Regional service"} · ${p.travel ? "Available for travel" : "Local projects"}</div></div>
    <div class="result-actions"><a class="btn btn-secondary btn-small" href="/professional/${p.id}/">View Profile</a><button class="btn btn-primary btn-small inquiry-trigger" data-profile="${p.id}">Send Inquiry</button></div>
  </article>`;
}
function publicSupplierCard(p) {
  return `<article class="result-card ${p.featured ? "featured-result" : ""}" data-profile-card data-name="${escapeHtml(p.name.toLowerCase())}" data-search="${escapeHtml(`${p.name} ${p.category} ${p.location} ${p.services.join(" ")}`.toLowerCase())}" data-category="${escapeHtml(p.category)}" data-location="${escapeHtml(p.location)}" data-verified="${p.verified}" data-featured="${p.featured}" data-nationwide="${p.nationwide}" data-travel="${p.travel}">
    ${p.featured ? '<span class="ribbon">Featured</span>' : ""}
    <div class="card-media"><img loading="lazy" src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)} portfolio" onerror="this.src='/public/images/pageant-icon.png'"></div>
    <div class="result-content"><div class="profile-badges">${badgeHtml(p)}</div><h3>${escapeHtml(p.name)}</h3><div class="card-category">${escapeHtml(p.category)} · ${escapeHtml(p.city)}, ${escapeHtml(p.location)}</div><p class="result-desc">${escapeHtml(p.desc)}</p><div class="card-meta">${p.nationwide ? "Accepts nationwide projects" : "Regional service"} · ${p.travel ? "Available for travel" : "Local projects"}</div></div>
    <div class="result-actions"><a class="btn btn-secondary btn-small" href="/professional/${encodeURIComponent(p.id)}/">View profile</a><button class="btn btn-primary btn-small inquiry-trigger" data-profile="${escapeHtml(p.id)}">Send inquiry</button></div>
  </article>`;
}
function articleCard(a) {
  return `<article class="article-card"><a href="/articles/${a.slug}/"><img src="/public/images/${a.image}" alt="${a.title}" decoding="async"><span class="article-tag">${a.tag}</span><h3>${a.title}</h3><p class="muted" style="font-size:.76rem">${a.summary}</p><div class="article-meta">By ${a.author} · ${a.date} · ${a.time}</div></a></article>`;
}

function header() {
  const nav = [
    ["Home", "/"],
    ["Directory", "/directory/"],
    ["Categories", "/categories/"],
    ["Locations", "/locations/"],
    ["Rankings", "/rankings/"],
    ["Pageant Calendar", "/pageant-calendar/"],
    ["Articles", "/articles/"],
    ["About", "/about/"],
  ];
  return `<header class="site-header"><div class="container nav-wrap"><a class="brand" href="/" aria-label="Pageant Index Philippines home">${brandLockup()}</a><nav class="desktop-nav" aria-label="Primary navigation">${nav.map(([l, u]) => `<a class="${path === u ? "active" : ""}" href="${u}">${l}</a>`).join("")}</nav><div class="nav-actions"><a class="signin" href="/sign-in/">Sign In</a><a class="btn btn-primary" href="/list-your-business/">List Your Business</a><button class="menu-toggle" aria-label="Open menu" aria-expanded="false">${svgIcon("menu")}</button></div></div><nav class="mobile-nav" aria-label="Mobile navigation">${nav.map(([l, u]) => `<a href="${u}">${l}</a>`).join("")}<a href="/sign-in/">Sign In</a><a class="mobile-nav-cta" href="/list-your-business/">List Your Business</a></nav></header>`;
}
function footer() {
  return `<footer class="site-footer"><div class="container"><div class="footer-grid"><div class="footer-brand">${brandLockup(true)}<p>The trusted discovery and verification directory for the people and businesses behind Philippine pageantry.</p><a class="footer-domain" href="https://www.pageantindex.com/">www.pageantindex.com</a></div><div class="footer-col"><h4>Explore</h4><a href="/directory/">Directory</a><a href="/categories/">Categories</a><a href="/locations/">Locations</a><a href="/articles/">Reading Materials</a><a href="/pageant-calendar/">Calendar</a></div><div class="footer-col"><h4>For Professionals</h4><a href="/list-your-business/">List Your Business</a><a href="/claim-profile/">Claim Your Profile</a><a href="/verification/">Verification</a><a href="/list-your-business/#founding">Founding Program</a><a href="/advertise/">Advertise with Pageant Index</a></div><div class="footer-col"><h4>Standards</h4><a href="/ranking-methodology/">Ranking Methodology</a><a href="/about/#advertising">Advertising Disclosure</a><a href="/about/#reviews">Review Guidelines</a><a href="/about/#complaints">Complaints Process</a><a href="/about/#privacy">Privacy</a></div></div><div class="footer-bottom"><span>© 2026 Pageant Index Philippines. All rights reserved.</span><span>Independent directory for Philippine pageantry.</span></div></div></footer>`;
}

function homePage() {
  return `<main class="page-shell"><section class="hero"><div class="hero-media" role="img" aria-label="Filipino pageant professionals preparing a crown backstage"></div><div class="container hero-inner"><div class="hero-content"><h1>Find the people behind every <em>winning</em> moment.</h1><p>Discover pageant professionals, suppliers, creatives, organizations, and production partners across the Philippines.</p><form class="hero-search" data-main-search><label class="sr-only" for="home-search">Search the directory</label><input id="home-search" name="q" placeholder="Search by service, business, professional, specialty, province, or city"><button class="btn btn-primary">Search the Directory</button></form><div class="popular"><span>Popular searches:</span>${["Pageant photographer", "Gown designer", "Makeup artist", "Pageant coach", "Pageant camp", "Tabulation provider", "Crown supplier", "Livestreaming team"].map((x) => `<a class="chip" href="/directory/?q=${encodeURIComponent(x)}">${x}</a>`).join("")}</div><div class="hero-proof"><span><b>${svgIcon("check")}</b>Identity and business verification</span><span><b>${svgIcon("info")}</b>Paid placements are clearly labeled</span></div></div></div></section>
<section class="category-strip"><div class="container"><div class="strip-title">BROWSE BY CATEGORY</div><div class="category-grid">${categories.map(([name, code]) => `<a class="category-card" href="/directory/?category=${encodeURIComponent(name)}">${iconLabel(code)}<span>${name}</span></a>`).join("")}</div></div></section>
<section class="section-tight"><div class="container"><div class="section-head"><div><div class="eyebrow">Founding directory</div><h2 class="section-title small">Approved supplier profiles are coming online</h2><p class="section-copy">Every public listing must be submitted or claimed by its owner and reviewed before publication. No placeholder business names are shown.</p></div><a class="btn btn-primary" href="/list-your-business/">Apply to be listed</a></div><div class="supplier-placeholder-grid">${categories.slice(0,6).map(([name, code]) => `<a class="supplier-placeholder" href="/list-your-business/">${iconLabel(code)}<span><strong>${name}</strong><small>Verified listings opening soon</small></span>${svgIcon("arrow","inline-icon")}</a>`).join("")}</div></div></section>
<section class="location-strip"><div class="container"><div class="section-head" style="margin-bottom:16px"><div><div class="eyebrow">Search by location</div><h2 class="section-title small">Find professionals in your area</h2></div><a class="text-link" href="/locations/">View all locations →</a></div><div class="location-grid">${locations
    .slice(0, 11)
    .map(
      (l, i) =>
        `<a class="location-card" href="/directory/?location=${encodeURIComponent(l)}"><img src="/public/images/location-${i + 1}.jpg" alt="${l}" decoding="async"><span class="location-label">${l}<small>Explore listings</small></span></a>`,
    )
    .join("")}</div></div></section>
<section class="section-tight"><div class="container how-grid"><div class="how-panel"><h3>How it works for clients</h3><div class="steps three">${[
    ["search", "Search", "Find the right professional or supplier."],
    ["badge-check", "Compare", "Review verified profile evidence and services."],
    ["messages-square", "Connect", "Send a private project inquiry."],
  ]
    .map(
      (x) =>
        `<div class="step"><span class="step-icon">${assetIcon(x[0])}</span><strong>${x[1]}</strong><span>${x[2]}</span></div>`,
    )
    .join(
      "",
    )}</div></div><div class="how-panel"><h3>How it works for professionals</h3><div class="steps">${[
    ["file-user", "Claim Your Profile", "Create or claim your listing."],
    ["shield-check", "Complete Verification", "Submit category-specific evidence."],
    ["inbox", "Receive Inquiries", "Connect with potential clients."],
    ["chart-no-axes-combined", "Grow Visibility", "Use clearly labeled visibility tools."],
  ]
    .map(
      (x) =>
        `<div class="step"><span class="step-icon">${assetIcon(x[0])}</span><strong>${x[1]}</strong><span>${x[2]}</span></div>`,
    )
    .join("")}</div></div></div></section>
<section class="section" style="background:var(--off)"><div class="container"><div class="section-head"><div><div class="eyebrow">Industry editorial</div><h2 class="section-title">Guides for better pageant decisions</h2></div><a class="text-link" href="/articles/">View all articles →</a></div><div class="article-grid">${articles.map(articleCard).join("")}</div></div></section>
<section class="cta-band"><div class="container cta-inner"><div><h2>Your work deserves to be discovered.</h2><p>Create or claim your Pageant Index profile, present your portfolio, receive inquiries, and become part of the Philippine pageant professionals directory.</p></div><a class="btn btn-gold" href="/list-your-business/">List Your Business</a></div></section></main>`;
}

function pageHero(title, copy, crumb = "Home") {
  return `<section class="page-hero"><div class="container"><div class="breadcrumbs"><a href="/">Home</a> / ${crumb}</div><h1>${title}</h1><p>${copy}</p></div></section>`;
}
function directoryPage() {
  const directoryBody = profiles.length
    ? `<div class="directory-results-head"><div><strong id="result-count">${profiles.length}</strong> published professional${profiles.length === 1 ? "" : "s"}</div><select id="sort-select" aria-label="Sort suppliers"><option value="recommended">Recommended</option><option value="alphabetical">Alphabetical</option></select></div><div class="results-list" id="results-list">${profiles.map(publicSupplierCard).join("")}</div><div class="empty-state" id="empty-results" hidden><h3>No matching professionals</h3><p>Try a broader category, location, or keyword.</p></div>`
    : `<div class="directory-launch directory-trust"><div class="directory-empty-icon">${assetIcon("shield-check")}</div><div><h2 class="section-title small">We are building this directory with real professionals.</h2><p class="section-copy">Pageant Index does not publish invented business names, fake reviews, or fabricated rankings. Join the founding directory or invite a professional whose work deserves to be discovered.</p><div class="empty-actions"><a class="btn btn-primary" href="/list-your-business/">Apply to be listed</a><button class="btn btn-secondary" data-invite-professional>Invite a professional</button></div></div></div>`;
  return `<main class="page-shell"><section class="directory-hero"><div class="container"><div class="breadcrumbs"><a href="/">Home</a> / Directory</div><div class="directory-intro"><div><h1>The official directory of Philippine pageant professionals.</h1><p>Discover trusted suppliers and partners who help bring every pageant to life. Profiles appear only after owner submission and review.</p><div class="empty-actions"><a class="btn btn-primary" href="/list-your-business/">Apply to be listed</a><button class="btn btn-secondary" id="invite-professional">Invite a professional</button></div></div><aside class="ad-invitation"><span>Advertising</span><h2>Advertise with Pageant Index</h2><p>Put your brand in front of pageant professionals, organizers, candidates, and decision-makers.</p><ul class="feature-list"><li>Clearly labeled visibility</li><li>Category and editorial placements</li><li>Campaign options shared privately</li><li>Reporting after activation</li></ul><a class="btn btn-gold" href="/advertise/">Request a campaign brief</a></aside></div></div></section><section class="directory-search-band"><div class="container"><form class="directory-search-form" id="public-directory-search"><label class="field"><span>What are you looking for?</span><input id="public-filter-keyword" name="query" placeholder="Search services, categories, or specialties"></label><label class="field"><span>Category</span><select id="public-filter-category" name="category"><option value="">All categories</option>${categories.map(([name]) => `<option>${name}</option>`).join("")}</select></label><label class="field"><span>Location</span><select id="public-filter-location" name="location"><option value="">All Philippines</option>${locations.map((name) => `<option>${name}</option>`).join("")}</select></label><button class="btn btn-primary">Search directory</button></form></div></section><section class="section"><div class="container">${directoryBody}<div class="section-head directory-category-head"><div><div class="eyebrow">Explore by category</div><h2 class="section-title small">Find the right specialist</h2></div><a class="text-link" href="/categories/">View all categories ${svgIcon("arrow","inline-icon")}</a></div><div class="supplier-placeholder-grid">${categories.map(([name, code]) => `<a class="supplier-placeholder" href="/directory/?category=${encodeURIComponent(name)}">${iconLabel(code)}<span><strong>${name}</strong><small>Browse published profiles</small></span>${svgIcon("arrow","inline-icon")}</a>`).join("")}</div></div></section></main>`;
}

function categoriesPage() {
  return `<main>${pageHero("Explore pageant services by category.", "Browse SEO-ready category pages designed around how clients actually search for pageant professionals and suppliers.", "Categories")}<section class="section"><div class="container"><div class="listing-grid">${categories.map(([name, code]) => `<a class="price-card" href="/directory/?category=${encodeURIComponent(name)}">${iconLabel(code)}<h2 class="display" style="font-size:1.55rem;margin:18px 0 8px">${name}</h2><p class="muted" style="font-size:.76rem">Find ${name.toLowerCase()} serving candidates, pageant organizations, LGUs, schools, festivals, and production teams.</p><span class="text-link">Browse profiles ${svgIcon("arrow", "inline-icon")}</span></a>`).join("")}</div></div></section></main>`;
}
function locationsPage() {
  return `<main>${pageHero("Pageant professionals by location.", "Discover regional talent and suppliers by region, province, city, and municipality, with nationwide service filters for larger productions.", "Locations")}<section class="section"><div class="container"><div class="listing-grid">${locations.map((l, i) => `<a class="listing-card" href="/directory/?location=${encodeURIComponent(l)}"><div class="card-media" style="height:180px"><img src="/public/images/location-${(i % 11) + 1}.jpg" alt="${l}"></div><div class="card-body"><h2 class="card-title">${l}</h2><p class="muted" style="font-size:.74rem">Browse professionals and suppliers serving this area.</p><span class="text-link">Explore ${l} ${svgIcon("arrow", "inline-icon")}</span></div></a>`).join("")}</div></div></section></main>`;
}
function rankingsPage() {
  return `<main>${pageHero("Rankings built on evidence, not payment.", "Formal rankings will be introduced only after the platform has enough verified profiles, client feedback, activity, and performance data.", "Rankings")}<section class="section"><div class="container"><div class="disclosure" style="margin-bottom:28px"><strong>Current phase:</strong> Discovery labels are informational, not definitive industry rankings. Paid packages do not directly change organic ranking scores.</div><div class="rank-grid">${[
    [
      "Most Viewed",
      "Profiles receiving the most genuine profile visits in the selected period.",
    ],
    [
      "Highly Reviewed",
      "Profiles with a sufficient number of verified reviews and strong recent feedback.",
    ],
    [
      "Trending Profiles",
      "Profiles showing meaningful, recent increases in discovery and engagement.",
    ],
    [
      "Editor's Selection",
      "Editorially selected work based on relevance, portfolio quality, and industry contribution.",
    ],
    [
      "Most Active",
      "Profiles consistently maintaining complete information and recent project activity.",
    ],
    [
      "Recently Verified",
      "Profiles that completed category-specific verification checks most recently.",
    ],
  ]
    .map(
      (x) =>
        `<article class="rank-card"><span class="eyebrow">Discovery label</span><h3>${x[0]}</h3><p class="muted">${x[1]}</p></article>`,
    )
    .join(
      "",
    )}</div><div style="margin-top:50px"><div class="section-head"><div><h2 class="section-title small">Organic, featured, sponsored, and editorial are different.</h2><p class="section-copy">Every visibility type is disclosed so users can understand why a profile appears where it does.</p></div><a class="btn btn-primary" href="/ranking-methodology/">Read Ranking Methodology</a></div><table class="methodology-table"><thead><tr><th>Label</th><th>How it works</th><th>Can it be purchased?</th></tr></thead><tbody><tr><td>Organic ranking</td><td>Calculated from disclosed trust, relevance, completeness, activity, and user-feedback signals.</td><td>No</td></tr><tr><td>Featured placement</td><td>Paid priority visibility in clearly labeled areas, separate from organic scores.</td><td>Yes</td></tr><tr><td>Sponsored content</td><td>Commercial content or campaigns visibly marked as sponsored.</td><td>Yes</td></tr><tr><td>Editorial selection</td><td>Chosen by the editorial team for relevance, story value, or industry contribution.</td><td>No</td></tr></tbody></table></div></div></section></main>`;
}
function calendarPage() {
  return `<main>${pageHero("Philippine pageant calendar.", "Confirmed application deadlines, coronation dates, organizer details, and official links will be published after review.", "Pageant Calendar")}<section class="section"><div class="container"><div class="directory-launch"><div class="directory-empty-icon">${assetIcon("clipboard-list")}</div><div><div class="eyebrow">Events desk</div><h2 class="section-title small">No confirmed events are published yet.</h2><p class="section-copy">Organizers may submit an event for editorial review. Dates and official organizer links must be verifiable before they appear publicly.</p><button class="btn btn-primary" id="submit-event-btn">Submit an Event</button></div></div></div></section></main>`;
}
function articlesPage() {
  const editorialCategories = [
    ["Industry Guides", "clipboard"],
    ["Professional Spotlights", "camera"],
    ["Pageant Business", "chart"],
    ["Production", "production"],
    ["Design and Beauty", "sparkles"],
    ["Technology", "video"],
    ["Voting and Tabulation", "chart"],
    ["Tourism Pageants", "crown"],
    ["Regional Pageantry", "building"],
    ["Industry Updates", "megaphone"],
  ];
  return `<main>${pageHero("Pageant industry guides and editorial.", "Complete, practical reading materials for candidates, families, professionals, organizers, schools, tourism offices, and production teams.", "Articles")}<section class="section"><div class="container"><div class="category-grid" style="margin-bottom:34px">${editorialCategories.map(([name, icon]) => `<a class="category-card" href="#${name.toLowerCase().replaceAll(" ", "-")}">${iconLabel(icon)}<span>${name}</span></a>`).join("")}</div><div class="article-grid">${articles.map(articleCard).join("")}</div></div></section></main>`;
}
function pricingPage() {
  return `<main>${pageHero("Present your work. Receive inquiries. Grow your visibility.", "Apply for the profile and visibility level that matches your business. Commercial terms are shared privately after review.", "List Your Business")}<section class="section"><div class="container"><div class="confidential-note">${svgIcon("info")}<div><strong>Rates are confidential.</strong><p>PageantIndex reviews each business, category, and visibility request before sharing a private proposal. No public rate card is displayed.</p></div></div><div class="pricing-grid"><article class="price-card"><div class="plan-label">Directory access</div><h2 class="plan-title">Basic Profile</h2><p class="plan-desc">Essential presence for professionals and organizations entering the Philippine pageant directory.</p><ul class="feature-list"><li>Business or professional name</li><li>Primary category and location</li><li>One verified contact link</li><li>Basic directory discovery</li><li>Claim and ownership review</li></ul><a class="btn btn-ghost btn-block" href="/claim-profile/">Claim a Profile</a></article><article class="price-card popular"><div class="plan-label">Trust and credibility</div><h2 class="plan-title">Verified Profile</h2><p class="plan-desc">For professionals ready to present a complete, evidence-backed public profile.</p><ul class="feature-list"><li>Identity and business review</li><li>Full profile and portfolio</li><li>Contact and inquiry tools</li><li>Service areas and availability</li><li>Review eligibility</li><li>Profile management</li></ul><button class="btn btn-primary btn-block plan-select" data-plan="Verified Profile">Request Private Terms</button></article><article class="price-card"><div class="plan-label">Business growth</div><h2 class="plan-title">Professional Profile</h2><p class="plan-desc">Expanded visibility and lead tools for established professionals, teams, and suppliers.</p><ul class="feature-list"><li>Everything in Verified</li><li>Expanded portfolio and video</li><li>Service presentation</li><li>Lead notifications</li><li>Profile analytics</li><li>Priority support</li><li>Editorial consideration</li></ul><button class="btn btn-primary btn-block plan-select" data-plan="Professional Profile">Request Private Terms</button></article><article class="price-card gold-plan"><div class="plan-label">Campaign visibility</div><h2 class="plan-title">Featured Placement</h2><p class="plan-desc">Clearly labeled paid visibility for launches, seasonal campaigns, and priority discovery.</p><ul class="feature-list"><li>Labeled priority visibility</li><li>Featured category placement</li><li>Homepage consideration</li><li>Highlighted profile treatment</li><li>Campaign reporting</li><li>No direct effect on organic score</li></ul><button class="btn btn-gold btn-block plan-select" data-plan="Featured Placement">Discuss a Campaign</button></article></div><div id="founding" class="cta-band founding-band"><div class="cta-inner"><div><h2>Founding Member Program</h2><p>Selected early members may receive a permanent founding distinction, priority onboarding, private introductory terms, early access, and editorial consideration. The badge never guarantees ranking.</p></div><button class="btn btn-gold plan-select" data-plan="Founding Member Program">Apply as Founding Member</button></div></div></div></section></main>`;
}
function advertisePage() {
  return `<main>${pageHero("Advertise with Pageant Index.", "Build a clearly labeled campaign for the Philippine pageant industry. Rates and recommendations are shared privately after a campaign review.", "Advertising")}<section class="section"><div class="container advertise-layout"><div><div class="eyebrow">Campaign opportunities</div><h2 class="section-title">Visibility with commercial clarity.</h2><p class="section-copy">Advertising remains separate from organic rankings and verification. Every placement is visibly labeled so brands can grow without compromising directory trust.</p><div class="ad-options">${[["Homepage and category visibility","Reach users during professional discovery."],["Sponsored editorial","Tell a useful, properly disclosed brand story."],["Event and seasonal campaigns","Support launches, pageant seasons, and priority dates."],["Professional recruitment","Invite qualified suppliers or collaborators to apply."]].map(([title,copy])=>`<article>${assetIcon("megaphone")}<div><h3>${title}</h3><p>${copy}</p></div></article>`).join("")}</div></div><aside class="campaign-brief"><h2>Request a campaign brief</h2><p>Tell us what success should look like. The Pageant Index team will review fit, inventory, timing, and private commercial terms.</p><form id="campaign-form" class="form-grid"><div class="field"><label>Brand or organization</label><input name="brand" required></div><div class="field"><label>Contact person</label><input name="contact" required autocomplete="name"></div><div class="field"><label>Work email</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Mobile number</label><input name="mobile" required inputmode="tel"></div><div class="field"><label>Campaign objective</label><select name="objective" required><option value="">Select objective</option><option>Brand awareness</option><option>Professional recruitment</option><option>Product or service launch</option><option>Event promotion</option><option>Sponsored editorial</option><option>Custom partnership</option></select></div><div class="field"><label>Preferred launch</label><input name="launch" type="date"></div><div class="field full"><label>Audience and campaign details</label><textarea name="details" required placeholder="Describe the audience, message, location, duration, and the action you want people to take."></textarea></div><label class="checkbox-consent field full"><input type="checkbox" required> I understand that advertising is clearly labeled and does not purchase organic ranking or verification.</label><div class="field full"><button class="btn btn-primary btn-block">Submit campaign request</button></div></form></aside></div></section></main>`;
}
function verificationPage() {
  return `<main>${pageHero("Verification confirms submitted information.", "Verification checks identity, business, professional, or category-specific evidence. It is not a guarantee of service quality, outcomes, conduct, or client satisfaction.", "Verification")}<section class="section"><div class="container"><div class="how-grid"><article class="info-panel"><h3>What may be reviewed</h3><ul class="feature-list"><li>Government-issued identification</li><li>Business registration</li><li>Professional portfolio</li><li>Official website or social account</li><li>Client references</li><li>Proof of completed work</li><li>Organization appointment</li><li>Accreditation or certification</li></ul></article><article class="info-panel"><h3>What verification does not mean</h3><ul class="feature-list"><li>It does not guarantee service quality</li><li>It does not guarantee availability</li><li>It does not guarantee project results</li><li>It does not replace contracts or due diligence</li><li>It does not prevent future complaints</li><li>It does not create a permanent ranking advantage</li></ul></article></div><div class="form-card" style="margin-top:30px"><h2 class="section-title small">Request verification</h2><form class="form-grid" data-generic-form data-success="Verification request submitted for review."><div class="field"><label>Profile or business name</label><input required></div><div class="field"><label>Primary category</label><select required>${categories.map((c) => `<option>${c[0]}</option>`).join("")}</select></div><div class="field full"><label>Evidence summary</label><textarea required placeholder="Describe the identity, business, professional, or portfolio evidence you are ready to submit."></textarea></div><label class="checkbox-consent field full"><input required type="checkbox"> I understand that private verification documents will remain private and will not appear publicly.</label><div class="field full"><button class="btn btn-primary">Start Verification Request</button></div></form></div></div></section></main>`;
}
function methodologyPage() {
  return `<main>${pageHero("Public ranking methodology.", "A transparent framework for future organic ranking, discovery labels, featured visibility, sponsored content, and editorial selection.", "Ranking Methodology")}<section class="section"><div class="container"><div class="disclosure" style="margin-bottom:30px"><strong>No fabricated rankings:</strong> Formal comparative rankings will remain inactive until enough verified profiles, reviews, activity, complaint outcomes, and performance data exist.</div><table class="methodology-table"><thead><tr><th>Possible factor</th><th>What it may measure</th><th>Safeguard</th></tr></thead><tbody>${[
    [
      "Verification completion",
      "Completion of category-appropriate identity, business, and professional checks.",
      "Verification is not a quality guarantee.",
    ],
    [
      "Profile completeness",
      "Useful, current information, services, portfolios, and contact details.",
      "Completeness cannot be purchased as a score.",
    ],
    [
      "Verified client feedback",
      "Authenticated feedback with sufficient sample size and recency.",
      "Suspicious reviews may be investigated, not automatically deleted.",
    ],
    [
      "Professional activity",
      "Recent updates, projects, and responsible platform use.",
      "Activity must be meaningful, not spam.",
    ],
    [
      "Documented experience",
      "Evidence-backed completed work and relevant professional history.",
      "Years alone do not determine quality.",
    ],
    [
      "Response rate",
      "Timely, respectful responses to legitimate inquiries.",
      "No penalty for spam or abusive inquiries.",
    ],
    [
      "Portfolio quality",
      "Relevance, clarity, recency, and presentation of documented work.",
      "Editorial review criteria will be published.",
    ],
    [
      "Industry contribution",
      "Education, mentoring, innovation, community work, or standards-building.",
      "Requires documented evidence.",
    ],
    [
      "Complaints",
      "Resolved and unresolved complaints with due process.",
      "Businesses may respond and appeal moderation decisions.",
    ],
  ]
    .map(
      (x) =>
        `<tr><td><strong>${x[0]}</strong></td><td>${x[1]}</td><td>${x[2]}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table><div class="section" style="padding-bottom:0"><h2 class="section-title small">Commercial separation</h2><p class="section-copy">Subscriptions pay for profile tools, verification processing, analytics, expanded media, support, and clearly labeled visibility. They do not directly buy organic ranking points.</p></div></div></section></main>`;
}
function aboutPage() {
  return `<main>${pageHero("Trusted infrastructure for Philippine pageantry.", "Pageant Index Philippines is built to make professional discovery clearer, safer, more credible, and commercially sustainable without selling fake authority.", "About")}<section class="section"><div class="container"><div class="how-grid"><div><div class="eyebrow">Our purpose</div><h2 class="section-title">Make the industry easier to navigate.</h2><p class="section-copy">Candidates, parents, directors, LGUs, schools, tourism offices, festivals, producers, and event organizers need a reliable way to compare professionals and suppliers. Professionals need a credible place to present work, build trust, receive inquiries, and grow visibility.</p></div><div class="info-panel"><h3>What we will not become</h3><ul class="feature-list"><li>A fan page or beauty-pageant organization</li><li>An award-selling website</li><li>A pay-to-win ranking scheme</li><li>A platform that hides sponsored visibility</li><li>A public archive of private verification documents</li></ul></div></div><div id="advertising" class="profile-section" style="margin-top:52px"><h2>Advertising disclosure</h2><p>Featured placements, sponsored events, sponsored articles, and commercial campaigns are visibly labeled. Payment does not directly change organic ranking scores.</p></div><div id="reviews" class="profile-section"><h2>Review policy</h2><p>Reviews should come from verified accounts or transactions when possible. Negative reviews are not automatically removed because a business complains. Administrators may request evidence, temporarily hide a review during an investigation, restore legitimate reviews, and document moderation decisions.</p></div><div id="complaints" class="profile-section"><h2>Reports and complaints</h2><p>Users may report inaccurate information, misconduct, impersonation, suspicious reviews, or unsafe content. Businesses have a fair opportunity to respond, and serious actions are recorded in audit logs.</p></div><div id="privacy" class="profile-section"><h2>Privacy and document handling</h2><p>Private identity and verification documents are stored separately from public profile data. The platform supports consent records, privacy controls, account deletion requests, secure uploads, and role-based access.</p></div></div></section></main>`;
}
function signInPage() {
  const createFirst = page === "signup";
  return `<main class="auth-shell official-auth"><section class="auth-visual"><div class="auth-visual-copy">${brandLockup(true)}<h1>The professional home of Philippine pageantry.</h1><p>Build a trusted profile, present your portfolio, receive qualified inquiries, and manage your visibility.</p></div></section><section class="auth-panel"><div class="auth-card"><a href="/" class="auth-mobile-brand">${brandLockup()}</a><h2>Professional account</h2><p class="muted">Access and manage your Pageant Index professional profile.</p><div class="auth-tabs" role="tablist"><button class="${createFirst ? "" : "active"}" data-auth-tab="signin">Sign In</button><button class="${createFirst ? "active" : ""}" data-auth-tab="signup">Create Account</button></div><form id="signin-form" class="auth-form ${createFirst ? "" : "active"}" data-auth-panel="signin"><div class="field"><label for="signin-email">Email</label><input id="signin-email" name="email" type="email" required autocomplete="email" placeholder="you@example.com"></div><div class="field"><label for="signin-password">Password</label><input id="signin-password" name="password" type="password" required autocomplete="current-password" placeholder="Enter your password"></div><div class="auth-options"><label class="check-row"><input type="checkbox"> Keep me signed in</label><button type="button" class="text-link" data-forgot-password>Forgot password?</button></div><button class="btn btn-primary btn-block">Sign In</button><p class="form-note">Accounts are activated after profile ownership review.</p></form><form id="signup-form" class="auth-form ${createFirst ? "active" : ""}" data-auth-panel="signup"><div class="form-grid"><div class="field"><label>Full name</label><input name="name" required autocomplete="name"></div><div class="field"><label>Business or professional name</label><input name="business" required></div><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Primary category</label><select name="category" required><option value="">Select category</option>${categories.map(([name]) => `<option>${name}</option>`).join("")}</select></div><div class="field"><label>Password</label><input name="password" type="password" minlength="8" required autocomplete="new-password"></div><div class="field"><label>Confirm password</label><input name="confirm" type="password" minlength="8" required autocomplete="new-password"></div></div><label class="checkbox-consent"><input type="checkbox" required> I confirm that I am authorized to represent this professional or business.</label><button class="btn btn-primary btn-block">Create Account</button><p class="form-note">Creating an account does not automatically publish a profile. Every listing is reviewed.</p></form><div class="auth-apply">Not listed yet? <a href="/list-your-business/">Apply to be listed</a></div><p class="auth-privacy">By continuing, you agree to our profile standards and privacy policy.</p></div></section></main>`;
}
function profilePage() {
  const slug = path.split("/").filter(Boolean).pop();
  const p = profiles.find((x) => x.id === slug) || profiles[0];
  if (!p) return `<main>${pageHero("Profile unavailable.", "This supplier profile is not published in the approved Pageant Index directory.", "Directory")}<section class="section"><div class="container"><div class="directory-launch"><div class="directory-empty-icon">${assetIcon("shield-check")}</div><div><h2 class="section-title small">This listing is not available.</h2><p class="section-copy">Browse the official directory or apply to create an owner-verified profile.</p><div class="empty-actions"><a class="btn btn-primary" href="/directory/">Open directory</a><a class="btn btn-secondary" href="/list-your-business/">Apply to be listed</a></div></div></div></div></section></main>`;
  return `<main><section class="profile-hero"><div class="container"><div class="breadcrumbs"><a href="/">Home</a> / <a href="/directory/">Directory</a> / ${p.name}</div><div class="profile-summary"><img class="profile-avatar" src="/public/images/${p.image}" alt="${p.name}"><div><h1 class="profile-name">${p.name}</h1><div class="profile-badges">${badgeHtml(p)}<span class="badge gold-badge">Founding Member</span></div><div class="card-meta">${p.category} · ${p.city}, ${p.location}</div><div class="card-meta"><span class="rating">★ ${p.rating}</span> ${p.reviews} verified reviews · ${p.years} years experience</div><div class="card-meta">${p.nationwide ? "Accepts nationwide projects" : "Regional service"} · ${p.travel ? "Available for travel" : "Local projects only"}</div></div><div class="profile-actions"><button class="btn btn-primary inquiry-trigger" data-profile="${p.id}">Send Inquiry</button><button class="btn btn-ghost save-profile" data-profile="${p.id}">Save Profile</button><button class="btn btn-ghost share-profile">Share Profile</button></div></div></div></section><div class="profile-nav"><div class="container" style="display:flex;gap:30px"><button class="active" data-tab="overview">Overview</button><button data-tab="portfolio">Portfolio</button><button data-tab="services">Services</button><button data-tab="reviews">Reviews</button><button data-tab="faqs">FAQs</button><button data-tab="info">Info</button></div></div><div class="container profile-layout"><section class="profile-main"><div class="profile-section" data-section="overview"><h2>About</h2><p>${p.desc} The team works with candidates, pageant organizations, tourism offices, schools, LGUs, and producers. Every project begins with a written scope, timeline, deliverables, and project-specific terms.</p><div class="details-grid"><div class="detail"><strong>Specialties</strong><span>${p.services.slice(0, 2).join(", ")}</span></div><div class="detail"><strong>Years of experience</strong><span>${p.years} years</span></div><div class="detail"><strong>Languages</strong><span>English, Filipino</span></div><div class="detail"><strong>Service areas</strong><span>${p.nationwide ? "Nationwide" : "Region-based"}</span></div><div class="detail"><strong>Travel availability</strong><span>${p.travel ? "Available" : "Not available"}</span></div><div class="detail"><strong>Last updated</strong><span>${p.updated}</span></div></div></div><div class="profile-section" data-section="portfolio"><h2>Professional Portfolio</h2><div class="gallery-grid">${[1, 2, 3, 4].map((i) => `<img src="/public/images/gallery-${i}.jpg" alt="${p.name} portfolio ${i}">`).join("")}</div></div><div class="profile-section" data-section="services"><h2>Services and packages</h2><p class="section-copy private-services-copy">Project rates are confidential and shared privately after the professional reviews the scope.</p><div class="service-grid">${p.services.map((s, i) => `<article class="service-card"><h3>${s}</h3><p>${["Project planning, creative direction, and professional execution based on an approved scope.", "Includes a discovery consultation, written deliverables, and timeline.", "Custom package for pageant candidates, organizations, or production teams."][i]}</p><div class="price">Private quotation</div></article>`).join("")}</div></div><div class="profile-section" data-section="reviews"><h2>Verified client reviews</h2>${[
    ["Professionalism", "5.0"],
    ["Communication", "4.9"],
    ["Quality of work", "4.9"],
    ["Timeliness", "4.8"],
    ["Value", "4.8"],
  ]
    .map(
      (x) =>
        `<div class="detail" style="margin-bottom:8px"><strong>${x[0]}</strong><span>★ ${x[1]}</span></div>`,
    )
    .join(
      "",
    )}<article class="info-panel" style="margin-top:18px"><strong>Mariel Santos · Verified project</strong><p style="margin-top:8px">The scope, timeline, and deliverables were explained clearly. Communication remained professional throughout the project.</p><small class="muted">Service received: ${p.services[0]} · Project date: June 2026</small></article><form class="form-card" style="margin-top:18px" data-generic-form data-success="Your review was submitted for verification and moderation."><h3 class="display" style="font-size:1.5rem;margin-top:0">Write a review</h3><div class="form-grid"><div class="field"><label>Overall experience</label><select><option>5 - Excellent</option><option>4 - Good</option><option>3 - Average</option><option>2 - Poor</option><option>1 - Very poor</option></select></div><div class="field"><label>Project date</label><input type="date" required></div><div class="field full"><label>Written review</label><textarea required></textarea></div><div class="field full"><button class="btn btn-primary">Submit Review</button></div></div></form></div><div class="profile-section" data-section="faqs"><h2>Frequently asked questions</h2>${["How early should clients inquire?", "Do you accept nationwide projects?", "What is required to reserve a date?", "Are travel costs included?"].map((q, i) => `<details class="info-panel" style="margin-bottom:10px"><summary style="font-weight:700;cursor:pointer">${q}</summary><p>${["Booking 6–12 weeks ahead is recommended for major pageant projects.", "Nationwide availability depends on the service scope, schedule, and travel requirements.", "A signed agreement and reservation fee may be required after the scope is approved.", "Travel and accommodation are quoted separately unless explicitly included."][i]}</p></details>`).join("")}</div><div class="profile-section" data-section="info"><h2>Credentials and verification</h2><div class="details-grid"><div class="detail"><strong>Identity</strong><span>Verified</span></div><div class="detail"><strong>Business evidence</strong><span>Reviewed</span></div><div class="detail"><strong>Portfolio evidence</strong><span>Reviewed</span></div></div><div class="disclosure" style="margin-top:18px">Verification confirms submitted information based on category requirements. It is not a guarantee of service quality, conduct, or outcomes.</div></div></section><aside class="profile-aside"><div class="contact-card"><h3>Contact information</h3><div class="contact-row">● ${p.city}, ${p.location}</div><div class="contact-row">● ${p.nationwide ? "Nationwide service" : "Regional service"}</div><div class="contact-row">Direct contact details are shared privately after an inquiry is accepted.</div><button class="btn btn-primary btn-block inquiry-trigger" data-profile="${p.id}" style="margin-top:14px">Send Private Inquiry</button></div><div class="contact-card"><h3>Verification details</h3><div class="contact-row">✓ Identity verified</div><div class="contact-row">✓ Business evidence reviewed</div><div class="contact-row">✓ Portfolio evidence reviewed</div><div class="contact-row">Verified July 2026</div></div><div class="disclosure">${p.featured ? "This profile has paid featured visibility. Featured placement does not change its organic ranking score." : "This profile is not currently using paid featured placement."}</div><button class="btn btn-ghost btn-block" data-report-profile>Report Profile</button></aside></div><button class="btn btn-primary sticky-inquiry inquiry-trigger" data-profile="${p.id}">Send Inquiry to ${p.name}</button></main>`;
}
function claimPage() {
  return `<main>${pageHero("Claim an existing profile.", "Ownership claims are reviewed privately before a listing or account is activated.", "Claim Profile")}<section class="section"><div class="container" style="max-width:820px"><div class="form-card"><h2 class="display">Submit a profile claim</h2><p class="section-copy">If Pageant Index has contacted you about an unpublished listing, provide the details below. New businesses should use the listing application.</p><form class="form-grid" data-generic-form data-success="Your profile claim has been submitted for ownership review."><div class="field"><label>Business or professional name</label><input required></div><div class="field"><label>Full name</label><input required autocomplete="name"></div><div class="field"><label>Email</label><input type="email" required autocomplete="email"></div><div class="field"><label>Mobile number</label><input required></div><div class="field full"><label>Official website or social profile</label><input type="url" required></div><div class="field full"><label>Ownership evidence summary</label><textarea required placeholder="Explain your relationship to the business and the evidence available for private review."></textarea></div><label class="checkbox-consent field full"><input type="checkbox" required> I confirm that I am authorized to represent this business or professional profile.</label><div class="field full"><button class="btn btn-primary">Submit Claim</button></div></form></div></div></section></main>`;
}
function databaseProfilePage() {
  const slug = path.split("/").filter(Boolean).pop();
  const p = profiles.find((supplier) => supplier.id === slug);
  if (!p) return `<main>${pageHero("Profile unavailable.", "This supplier profile is not published in the approved Pageant Index directory.", "Directory")}<section class="section"><div class="container"><div class="directory-launch"><div class="directory-empty-icon">${assetIcon("shield-check")}</div><div><h2 class="section-title small">This listing is not available.</h2><p class="section-copy">Browse the official directory or apply to create an owner-verified profile.</p><div class="empty-actions"><a class="btn btn-primary" href="/directory/">Open directory</a><a class="btn btn-secondary" href="/list-your-business/">Apply to be listed</a></div></div></div></div></section></main>`;
  return `<main><section class="profile-hero"><div class="container"><div class="breadcrumbs"><a href="/">Home</a> / <a href="/directory/">Directory</a> / ${escapeHtml(p.name)}</div><div class="profile-summary"><img class="profile-avatar" src="${escapeHtml(p.logo_url || p.imageUrl)}" alt="${escapeHtml(p.name)}" onerror="this.src='/public/images/pageant-icon.png'"><div><h1 class="profile-name">${escapeHtml(p.name)}</h1><div class="profile-badges">${badgeHtml(p)}</div><div class="card-meta">${escapeHtml(p.category)} · ${escapeHtml(p.city)}, ${escapeHtml(p.location)}</div><div class="card-meta">${p.nationwide ? "Accepts nationwide projects" : "Regional service"} · ${p.travel ? "Available for travel" : "Local projects"}</div></div><div class="profile-actions"><button class="btn btn-primary inquiry-trigger" data-profile="${escapeHtml(p.id)}">Send Inquiry</button><button class="btn btn-ghost share-profile">Share Profile</button></div></div></div></section><div class="container profile-layout"><section class="profile-main"><div class="profile-section"><h2>About</h2>${p.headline ? `<h3>${escapeHtml(p.headline)}</h3>` : ""}<p>${escapeHtml(p.desc || "Profile information is being completed.")}</p><div class="details-grid"><div class="detail"><strong>Category</strong><span>${escapeHtml(p.category)}</span></div><div class="detail"><strong>Years of experience</strong><span>${p.years || "Not specified"}</span></div><div class="detail"><strong>Service area</strong><span>${p.nationwide ? "Nationwide" : escapeHtml(p.location)}</span></div><div class="detail"><strong>Travel</strong><span>${p.travel ? "Available" : "Not specified"}</span></div></div></div><div class="profile-section"><h2>Services</h2>${p.services.length ? `<div class="service-grid">${p.services.map((service)=>`<article class="service-card"><h3>${escapeHtml(service)}</h3><p>Contact the professional with your project scope for availability and private terms.</p></article>`).join("")}</div>` : '<p class="muted">Service details are being completed.</p>'}</div></section><aside class="profile-aside"><div class="contact-card"><h3>Contact this professional</h3><div class="contact-row">${escapeHtml(p.city)}, ${escapeHtml(p.location)}</div>${p.website_url ? `<a class="text-link" href="${escapeHtml(p.website_url)}" target="_blank" rel="noopener">Official website</a>` : ""}${p.social_url ? `<a class="text-link" href="${escapeHtml(p.social_url)}" target="_blank" rel="noopener">Official social page</a>` : ""}<button class="btn btn-primary btn-block inquiry-trigger" data-profile="${escapeHtml(p.id)}">Send private inquiry</button></div><div class="contact-card"><h3>Profile status</h3><div class="contact-row">${p.verified ? "Identity or business evidence verified" : "Verification not completed"}</div><div class="disclosure">Verification confirms reviewed information. It is not a guarantee of service quality, conduct, availability, or results.</div></div>${p.featured ? '<div class="disclosure">This profile has clearly labeled paid featured visibility. Featured placement does not change its organic ranking score.</div>' : ""}</aside></div></main>`;
}
function dashboardPage() {
  const portfolioRows = [1,2,3,4].map((i) => `<div class="portfolio-row" data-portfolio-row><button class="drag-handle" aria-label="Reorder asset">⋮⋮</button><div class="portfolio-thumb">${assetIcon("camera")}<img alt="" hidden></div><input aria-label="Portfolio caption" value="" placeholder="Add a descriptive caption"><select aria-label="Portfolio category"><option>Editorial</option><option>Event</option><option>Campaign</option><option>Product</option><option>Behind the scenes</option></select><label class="cover-radio"><input type="radio" name="cover" ${i===1?"checked":""}> Cover</label><button class="icon-button remove-asset" aria-label="Remove asset">×</button></div>`).join("");
  return `<main class="product-shell"><aside class="product-sidebar">${brandLockup(true)}<nav>${[["building-2","Overview"],["file-user","Public Profile"],["camera","Portfolio"],["clipboard-list","Services"],["inbox","Inquiries"],["megaphone","Advertising"],["settings","Settings"]].map(([icon,label],i)=>`<button class="${i===1?"active":""}" data-workspace-nav="${label.toLowerCase().replace(" ","-")}">${assetIcon(icon)}<span>${label}</span></button>`).join("")}</nav><div class="profile-progress"><strong>Profile readiness</strong><p id="readiness-message">Complete the required public details.</p><div class="progress"><span id="readiness-bar" style="width:0%"></span></div><small id="readiness-label">0% complete</small></div><a href="/">View public site</a></aside><section class="product-main"><header class="product-topbar"><div><h1>Professional Profile Workspace</h1><p>Create the public landing page clients and organizers will trust.</p></div><div><button class="btn btn-secondary" id="save-profile-draft">Save draft</button><button class="btn btn-primary" id="submit-profile-review">Submit for review</button></div></header><div class="profile-readiness"><div><strong id="readiness-score">0%</strong><span>Profile readiness</span></div><ul id="readiness-checklist"><li data-check="identity">Add your professional or business name</li><li data-check="about">Write a useful introduction</li><li data-check="services">Describe your services</li><li data-check="location">Add your service location</li><li data-check="contact">Add a public contact email</li><li data-check="portfolio">Upload at least three HD portfolio images</li></ul></div><div class="profile-steps">${["Basics","About","Services","Portfolio","Credentials","Contact","Preview"].map((x,i)=>`<button data-step-target="${i}" class="${i===0?"active":""}"><b>${i+1}</b><span>${x}</span></button>`).join("")}</div><div class="profile-workspace"><section class="portfolio-editor"><div class="workspace-title"><h2>Public profile details</h2><p>Complete the information below, then add original portfolio work you are authorized to publish.</p></div><form class="form-grid profile-editor-form" id="profile-editor-form"><div class="field"><label>Business or professional name</label><input id="preview-business-name" name="business" required placeholder="Official public name"></div><div class="field"><label>Primary category</label><select id="preview-category" name="category">${categories.map(([name])=>`<option>${name}</option>`).join("")}</select></div><div class="field"><label>City and province</label><input id="preview-location" name="location" required placeholder="City, Province"></div><div class="field"><label>Public contact email</label><input id="preview-email" name="email" type="email" required placeholder="hello@yourbusiness.com"></div><div class="field full"><label>About your work</label><textarea id="preview-about" name="about" required placeholder="Describe your expertise, approach, and the clients you serve."></textarea></div><div class="field full"><label>Services offered</label><textarea id="preview-services" name="services" required placeholder="List the services clients can inquire about."></textarea></div><div class="field"><label>Service coverage</label><select id="preview-coverage" name="coverage"><option>Local and regional</option><option>Nationwide</option><option>Available for travel</option></select></div><div class="field"><label>Official website or social page</label><input id="preview-link" name="link" type="url" placeholder="https://"></div></form><div class="workspace-title portfolio-heading"><h2>Portfolio assets</h2><p>Images must be clear enough for clients to evaluate your work.</p></div><label class="asset-dropzone" for="portfolio-upload">${assetIcon("inbox")}<strong>Drag and drop HD images here</strong><span>or choose files from your device</span><input id="portfolio-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple><span class="btn btn-secondary">Choose files</span></label><div class="asset-requirements"><strong>Image requirements</strong><span>Minimum 1200px on the longest side</span><span>JPG, PNG, or WEBP</span><span>Maximum 10MB per file</span><span>Original or authorized work only</span></div><div class="portfolio-list-head"><strong id="asset-count">0 uploaded assets</strong><span>Select one cover image and add descriptive captions.</span></div><div class="portfolio-list" id="portfolio-list">${portfolioRows}</div><button class="text-link" id="add-portfolio-row">+ Add another asset</button></section><aside class="public-profile-preview"><div class="preview-head"><h2>Live public preview</h2><button class="text-link" id="open-full-preview">Preview details</button></div><div class="preview-cover"><div class="preview-logo">${assetIcon("crown")}</div></div><div class="preview-identity"><strong id="live-business-name">Your business name</strong><span id="live-category">Professional category</span><span id="live-location">Location, Philippines</span><span class="status pending">Review required</span></div><div class="preview-section"><h3>About</h3><p id="live-about">Your professional introduction will appear here.</p></div><div class="preview-section"><h3>Services</h3><p id="live-services">Your services will appear here.</p></div><div class="preview-section"><h3>Portfolio</h3><div class="preview-portfolio" id="preview-portfolio">${[1,2,3,4].map(()=>`<span>${assetIcon("camera")}</span>`).join("")}</div></div><button class="btn btn-primary btn-block" disabled>Send inquiry</button><small>Inquiries activate after approval and publication.</small><a class="dashboard-ad-link" href="/advertise/">${assetIcon("megaphone")}<span><strong>Promote after publication</strong><small>Request a clearly labeled campaign.</small></span></a></aside></div></section></main>`;
  return `<main class="dashboard-shell"><aside class="dashboard-sidebar">${brandLockup(true)}<nav class="dash-nav">${["Dashboard", "Profile", "Inquiries", "Portfolio", "Services", "Reviews", "Analytics", "Subscription", "Verification", "Team", "Support"].map((x, i) => `<button class="${i === 0 ? "active" : ""}" data-dash-tab="${x.toLowerCase()}">${x}</button>`).join("")}<a href="/">View Public Site</a></nav></aside><section class="dashboard-main"><div class="dash-head"><div><div class="eyebrow">Professional dashboard</div><h1>Welcome back, Alon.</h1><p class="muted">Here is what is happening with your profile.</p></div><a class="btn btn-primary" href="/professional/alon-mendoza-designs/">View Profile</a></div><div class="stat-grid"><div class="stat-card"><span>Profile views</span><strong>1,248</strong><small>↑ 12% this month</small></div><div class="stat-card"><span>Inquiries</span><strong id="dash-inquiry-count">12</strong><small>↑ 8% this month</small></div><div class="stat-card"><span>Profile saves</span><strong>89</strong><small>↑ 5% this month</small></div><div class="stat-card"><span>Review score</span><strong>4.9</strong><small>128 verified reviews</small></div></div><div class="dash-grid"><div class="panel"><h2>Recent inquiries</h2><div class="inquiry-list" id="dashboard-inquiries">${[
    ["Maria Santos", "Municipal pageant gown", "New"],
    ["Cebu Queen Org", "Coronation wardrobe", "Replied"],
    ["Juan Dela Cruz", "Portrait session referral", "New"],
  ]
    .map(
      (x, i) =>
        `<div class="inquiry-row"><img class="avatar-sm" src="/public/images/gallery-${i + 1}.jpg" alt=""><div><strong>${x[0]}</strong><span>${x[1]} · July ${29 - i}, 2026</span></div><span class="status ${x[2] === "New" ? "open" : "upcoming"}">${x[2]}</span></div>`,
    )
    .join(
      "",
    )}</div><button class="text-link" style="margin-top:14px">View all inquiries →</button></div><div class="panel"><h2>Profile completion</h2><div style="display:flex;justify-content:space-between;font-size:.75rem;margin-bottom:8px"><span>Complete profile</span><strong>92%</strong></div><div class="progress"><span style="width:92%"></span></div><ul class="feature-list"><li>Basic information</li><li>Portfolio</li><li>Services</li><li>Verification</li><li>Reviews</li></ul><button class="btn btn-secondary btn-block">Complete Profile</button></div></div><div class="dash-grid"><div class="panel"><h2>Analytics overview</h2><div class="mini-chart">${[35, 60, 48, 82, 72, 95, 74, 90, 54, 76, 43, 68].map((h) => `<i style="height:${h}%"></i>`).join("")}</div></div><div class="panel"><h2>Subscription</h2><span class="badge pink-badge">Professional Plan</span><p class="muted" style="font-size:.76rem">Renews August 20, 2026</p><button class="btn btn-primary btn-block plan-select" data-plan="Manage Professional Subscription">Manage Subscription</button></div></div></section></main>`;
}
function adminPage() {
  if (!isAdminSession()) {
    return `<main class="admin-auth-shell"><section class="admin-auth-card">${brandLockup()}<h1>Administrator access</h1><p>Sign in with an authorized Pageant Index administrator account.</p><form id="admin-login-form"><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Password</label><input name="password" type="password" required autocomplete="current-password"></div><button class="btn btn-primary btn-block">Sign in securely</button><div class="admin-auth-message" id="admin-auth-message"></div></form><a href="/">Return to public website</a></section></main>`;
  }
  const counts = {
    published: profiles.filter((p) => p.status === "published").length,
    draft: profiles.filter((p) => p.status === "draft").length,
    pending: profiles.filter((p) => p.status === "pending_review").length,
    featured: profiles.filter((p) => p.featured).length,
  };
  const rows = profiles.length
    ? profiles.map((p) => `<tr data-admin-name="${escapeHtml(`${p.name} ${p.category} ${p.location}`.toLowerCase())}" data-status="${p.status}" data-category="${escapeHtml(p.category)}" data-location="${escapeHtml(p.location)}"><td><strong>${escapeHtml(p.name)}</strong><br><small>${escapeHtml(p.id)}</small></td><td>${escapeHtml(p.category)}</td><td>${escapeHtml(p.city)}, ${escapeHtml(p.location)}</td><td><span class="status ${p.status === "published" ? "open" : "pending"}">${p.status.replaceAll("_"," ")}</span></td><td>${p.verified ? "Verified" : p.verification_status.replaceAll("_"," ")}</td><td>${p.featured ? "Yes" : "No"}</td><td>${escapeHtml(p.updated)}</td><td><button class="btn btn-small btn-ghost admin-edit" data-profile="${escapeHtml(p.id)}">View / Edit</button></td></tr>`).join("")
    : `<tr class="empty-table-row"><td colspan="8">${assetIcon("inbox")}<strong>No suppliers yet</strong><span>Add the first real supplier to begin the directory.</span><button class="btn btn-primary btn-small" data-add-supplier>Add Supplier</button></td></tr>`;
  const adminNav = [["building-2","Overview"],["file-user","Suppliers"],["clipboard-list","Applications"],["shield-check","Verification"],["camera","Portfolio Review"],["inbox","Inquiries"],["megaphone","Advertising"],["newspaper","Articles"],["calendar","Events"],["chart-no-axes-combined","Audit Log"],["settings","Settings"]];
  return `<main class="product-shell admin-product"><aside class="product-sidebar">${brandLockup(true)}<nav>${adminNav.map(([icon,label],i)=>`<button class="${i===1?"active":""}">${assetIcon(icon)}<span>${label}</span></button>`).join("")}</nav><a href="/">View public site</a></aside><section class="product-main"><header class="product-topbar"><div><h1>Supplier Administration</h1><p>Create, review, publish, and maintain official supplier profiles.</p></div><div><button class="btn btn-ghost" id="admin-signout">Sign out</button><button class="btn btn-primary" data-add-supplier>+ Add Supplier</button></div></header><div class="admin-zero-stats">${[["file-user","Published",counts.published],["clipboard-list","Drafts",counts.draft],["shield-check","Pending Review",counts.pending],["megaphone","Featured",counts.featured]].map(([icon,label,value])=>`<div>${assetIcon(icon)}<strong>${value}</strong><span>${label}</span></div>`).join("")}</div><div class="admin-suppliers-layout"><section class="admin-primary"><div class="admin-toolbar"><input id="admin-search" placeholder="Search suppliers"><select id="admin-status-filter"><option value="">All statuses</option><option value="draft">Draft</option><option value="pending_review">Pending review</option><option value="published">Published</option><option value="unpublished">Unpublished</option><option value="archived">Archived</option></select><select id="admin-category-filter"><option value="">All categories</option>${categories.map(([name])=>`<option>${name}</option>`).join("")}</select><select id="admin-location-filter"><option value="">All locations</option>${locations.map((name)=>`<option>${name}</option>`).join("")}</select></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Supplier</th><th>Category</th><th>Location</th><th>Status</th><th>Verification</th><th>Featured</th><th>Updated</th><th>Actions</th></tr></thead><tbody id="admin-tbody">${rows}</tbody></table></div><div class="admin-table-footer">Showing <strong id="admin-visible-count">${profiles.length}</strong> of ${profiles.length} suppliers</div></section></div></section></main>`;
}
const articleBodies = {
  "choose-pageant-photographer": `
    <p class="article-lead">A strong pageant photographer does more than make attractive images. The right professional understands campaign goals, directs confidently, protects the schedule, and delivers files that work across print, social media, press, and competition requirements.</p>
    <h2>Define the assignment first</h2><p>Write down the images you need before requesting quotations: official headshots, full-length portraits, advocacy content, sponsor deliverables, wardrobe looks, behind-the-scenes coverage, or coronation-night photographs. Confirm the intended platforms, required dimensions, deadline, location, and number of final images.</p>
    <h2>Review complete galleries, not highlights</h2><p>A social feed shows only selected work. Ask to see one or two complete sessions similar to yours. Look for consistent focus, skin tone, fabric detail, posing, retouching, and image quality across different lighting conditions—not only one exceptional frame.</p>
    <h2>Questions to ask</h2><ul class="article-checklist"><li>Who will photograph the session or event?</li><li>How many edited images are included, and when are they delivered?</li><li>Are hair, makeup, studio, assistants, permits, travel, and overtime included?</li><li>How are image selections and revision requests handled?</li><li>What usage rights are granted to the candidate, organizer, sponsors, and photographer?</li><li>How are files backed up, delivered, and archived?</li></ul>
    <h2>Direction and working style</h2><p>Discuss how the photographer directs posing and expression, especially if the candidate is new to professional shoots. For events, ask how the team coordinates with production, handles changing light, and covers key moments without obstructing judges or the audience.</p>
    <h2>Put the agreement in writing</h2><p>The agreement should identify deliverables, payment schedule, cancellation and rescheduling terms, turnaround time, retouching limits, usage rights, credit requirements, travel costs, and what happens if equipment or weather affects the assignment.</p>
    <div class="article-callout"><strong>Final check:</strong> Choose the photographer whose full body of work, communication, process, and written terms match the assignment—not simply the lowest quotation or largest follower count.</div>`,
  "coronation-production-checklist": `
    <p class="article-lead">A coronation night succeeds when creative, technical, safety, and guest-experience decisions are coordinated early. Use this checklist as a planning framework, then adapt it to the venue, audience size, program, and local requirements.</p>
    <h2>Production foundation</h2><ul class="article-checklist"><li>Confirm venue access, capacity, loading route, curfew, power, rigging limits, and house rules.</li><li>Name one production lead and establish a clear approval chain.</li><li>Lock the running order, candidate count, segments, awards, speakers, and estimated duration.</li><li>Create a contact sheet for organizers, venue staff, suppliers, medical support, security, and emergency contacts.</li></ul>
    <h2>Stage, lighting, audio, and video</h2><p>Approve a scaled stage plan showing entrances, exits, stairs, judges, hosts, screens, cameras, and backstage holding areas. Test lighting for every wardrobe color and performance position. Prepare dedicated microphones for hosts, performers, judges, and announcements, with labeled backups. Confirm playback formats, screen resolution, camera positions, recording, and livestream connectivity.</p>
    <h2>Program and content control</h2><ul class="article-checklist"><li>Use one master script with version number and owner.</li><li>Verify names, titles, pronunciation, award order, music cues, and sponsor obligations.</li><li>Place every audio, video, and graphic asset in an organized show folder with backups.</li><li>Prepare holding slides and neutral music for unexpected pauses.</li></ul>
    <h2>Candidate and backstage operations</h2><p>Publish call times, rehearsal schedules, dressing-room assignments, wardrobe sequence, prop responsibilities, and stage routes. Assign backstage coordinators who can communicate with the stage manager. Keep walkways dry and unobstructed, mark level changes clearly, and check gowns, footwear, and props during rehearsal.</p>
    <h2>Rehearsals and contingencies</h2><p>Run a technical cue-to-cue before the full dress rehearsal. Then rehearse entrances, exits, host links, tabulation handoff, special awards, final question, crowning, and winner photography. Prepare written responses for power loss, delayed results, microphone failure, missing media, medical incidents, severe weather, and schedule overrun.</p>
    <div class="article-callout"><strong>Show-day rule:</strong> Freeze nonessential changes before doors open. Any necessary change should pass through the production lead and be communicated to every affected department.</div>`,
  "hiring-pageant-coach": `
    <p class="article-lead">Coaching should help a candidate think, communicate, move, and prepare with greater clarity—not imitate another contestant or promise a crown. A good fit depends on goals, methods, boundaries, and trust.</p>
    <h2>Clarify what you need</h2><p>Identify the competition stage and the candidate’s priorities: interview, question and answer, advocacy, stage presence, runway, wardrobe planning, media preparation, fitness coordination, or an overall program. Ask which needs the coach handles directly and which require qualified specialists.</p>
    <h2>Ask about the coaching method</h2><ul class="article-checklist"><li>How is the first assessment conducted?</li><li>How are sessions structured and progress documented?</li><li>Is feedback adapted to the candidate’s voice, background, age, and goals?</li><li>How are practice questions selected and reviewed?</li><li>What preparation is expected between sessions?</li><li>How does the coach respond when a method is not working?</li></ul>
    <h2>Discuss ethics and boundaries</h2><p>Ask how the coach protects confidentiality, handles conflicts of interest, works with minors and parents, communicates outside sessions, and refers health, nutrition, mental-health, legal, or medical matters to qualified professionals. Avoid anyone who humiliates candidates, guarantees results, encourages dishonesty, or pressures you into unrelated services.</p>
    <h2>Understand the package</h2><p>Confirm session length, number of sessions, format, location, rescheduling policy, travel, access between sessions, included materials, payment schedule, and refund terms. If a team is involved, identify who provides each service and who remains accountable for the overall plan.</p>
    <h2>Evaluate the relationship</h2><p>A consultation should leave the candidate informed and respected. The coach should listen carefully, explain their approach, give specific observations, and be comfortable stating what they cannot provide. References can help, but testimonials and titles should never replace a direct assessment of fit.</p>
    <div class="article-callout"><strong>Healthy outcome:</strong> The candidate becomes more prepared and self-directed while retaining an authentic voice, reasonable boundaries, and responsibility for their own decisions.</div>`,
  "choose-gown-designer": `
    <p class="article-lead">A pageant gown must support the candidate, the segment, and the movement required on stage. Choosing a designer is therefore a decision about design judgment, construction, communication, fittings, schedule, and written ownership terms.</p>
    <h2>Prepare a useful brief</h2><p>Share the event date, segment rules, venue, stage conditions, candidate measurements, footwear, movement needs, preferred silhouette, colors to consider or avoid, and a realistic spending range. Inspiration images can communicate direction, but ask for an original solution suited to the wearer.</p>
    <h2>Examine construction closely</h2><p>Review finished garments in person when possible. Inspect seams, lining, closures, boning, cups, hems, embellishment security, weight distribution, and comfort. Ask to see how the garment moves from the front, side, and back under strong light.</p>
    <h2>Questions for the designer</h2><ul class="article-checklist"><li>Who creates the design and who constructs the garment?</li><li>How many fittings are required, and when will they happen?</li><li>Which fabrics, embellishments, understructure, and accessories are included?</li><li>What changes are included after design approval?</li><li>How are rush work, travel, shipping, repairs, and late measurement changes handled?</li><li>Is the gown purchased, rented, borrowed, sponsored, or returned after use?</li></ul>
    <h2>Plan the fitting timeline</h2><p>Agree on dates for design approval, measurements, sourcing, mock-up or first fitting, refinement, final fitting, and collection. Build in time for walking, sitting, stairs, quick changes, photographs, and emergency adjustments. Bring the intended shoes and foundation garments to fittings.</p>
    <h2>Document ownership and publicity</h2><p>The written agreement should clarify total cost, payment milestones, cancellation, design changes, garment ownership, exclusivity if any, alteration responsibility, image use, credits, sponsor disclosure, and what happens if the event or candidate measurements change.</p>
    <div class="article-callout"><strong>Final fitting:</strong> Check comfort, balance, hem length, closures, skin safety, movement, and a simple repair kit. The candidate should be able to enter, walk, turn, sit, and exit with confidence.</div>`
};
function articleDetailPage() {
  const slug = path.split("/").filter(Boolean).pop();
  const a = articles.find((x) => x.slug === slug) || articles[0];
  const related = articles.filter((x) => x.slug !== a.slug).slice(0, 3);
  return `<main>${pageHero(a.title, a.summary, "Reading Materials")}<article class="section"><div class="container article-body"><img class="article-hero-image" src="/public/images/${a.image}" alt="${a.title}"><div class="article-meta">By ${a.author} · Published ${a.date} · Updated July 30, 2026 · ${a.time}</div>${articleBodies[a.slug]}<section class="related-reading"><div class="section-head"><div><div class="eyebrow">Continue reading</div><h2 class="section-title small">Related guides</h2></div><a class="text-link" href="/articles/">All reading materials →</a></div><div class="article-grid">${related.map(articleCard).join("")}</div></section></div></article></main>`;
}

function render() {
  let content = "";
  switch (page) {
    case "home":
      content = homePage();
      break;
    case "directory":
      content = directoryPage();
      break;
    case "categories":
      content = categoriesPage();
      break;
    case "locations":
      content = locationsPage();
      break;
    case "rankings":
      content = rankingsPage();
      break;
    case "calendar":
      content = calendarPage();
      break;
    case "articles":
      content = articlesPage();
      break;
    case "article":
      content = articleDetailPage();
      break;
    case "pricing":
      content = pricingPage();
      break;
    case "advertise":
      content = advertisePage();
      break;
    case "verification":
      content = verificationPage();
      break;
    case "methodology":
      content = methodologyPage();
      break;
    case "about":
      content = aboutPage();
      break;
    case "signin":
      content = signInPage();
      break;
    case "signup":
      content = signInPage();
      break;
    case "profile":
      content = databaseProfilePage();
      break;
    case "claim":
      content = claimPage();
      break;
    case "dashboard":
      document.getElementById("app").innerHTML =
        announcementBar() +
        dashboardPage() +
        modalHtml() +
        toastHtml();
      init();
      return;
    case "admin":
      document.getElementById("app").innerHTML =
        announcementBar() + adminPage() + modalHtml() + toastHtml();
      init();
      return;
    default:
      content = homePage();
  }
  if (page === "signin" || page === "signup") {
    document.getElementById("app").innerHTML =
      announcementBar() + content + modalHtml() + toastHtml();
    initSignIn();
    return;
  }
  document.getElementById("app").innerHTML =
    announcementBar() + header() + content + footer() + modalHtml() + toastHtml();
  init();
}

function modalHtml() {
  return `<div class="modal-backdrop" id="modal-backdrop" aria-hidden="true"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">Send Inquiry</h2><button class="modal-close" aria-label="Close dialog">${svgIcon("close")}</button></div><div class="modal-body" id="modal-body"></div></div></div>`;
}
function toastHtml() {
  return `<div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}
function showToast(message, type = "success") {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = message;
  t.className = `toast ${type} show`;
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => t.classList.remove("show"), 3500);
}
function openModal(title, html) {
  const b = document.getElementById("modal-backdrop");
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = html;
  b.classList.add("open");
  b.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(
    () => b.querySelector("input,button,select,textarea")?.focus(),
    50,
  );
}
function closeModal() {
  const b = document.getElementById("modal-backdrop");
  if (!b) return;
  b.classList.remove("open");
  b.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
function inquiryForm(p) {
  return `<p class="muted">Your inquiry will be saved in the professional dashboard and sent to <strong>${p.name}</strong>.</p><form id="inquiry-form" class="form-grid"><input type="hidden" name="profile" value="${p.name}"><div class="field"><label>Full name</label><input name="name" required autocomplete="name"></div><div class="field"><label>Email</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Mobile number</label><input name="mobile" required inputmode="tel"></div><div class="field"><label>Type of event</label><select name="eventType" required><option value="">Select event type</option><option>Municipal Pageant</option><option>Provincial Pageant</option><option>National Pageant</option><option>School Pageant</option><option>Festival Pageant</option><option>Corporate Event</option><option>Campaign or Photoshoot</option></select></div><div class="field"><label>Event date</label><input name="date" type="date" required></div><div class="field"><label>Location</label><input name="location" required></div><div class="field"><label>Required service</label><select name="service" required>${p.services.map((s) => `<option>${s}</option>`).join("")}</select></div><div class="field"><label>Estimated budget</label><select name="budget" required><option>Below ₱10,000</option><option>₱10,000–₱30,000</option><option>₱30,001–₱75,000</option><option>₱75,001–₱150,000</option><option>₱150,000+</option><option>Requesting a proposal</option></select></div><div class="field full"><label>Project details</label><textarea name="details" required placeholder="Tell the professional what you need, expected deliverables, and important dates."></textarea></div><div class="field full"><label>Preferred contact method</label><select name="contact"><option>Email</option><option>Mobile call</option><option>SMS</option><option>Messaging app</option></select></div><label class="checkbox-consent field full"><input name="consent" type="checkbox" required> I consent to Pageant Index sharing this inquiry with the selected professional and storing it for account and anti-spam purposes.</label><div class="field full"><button class="btn btn-primary btn-block">Send Inquiry</button></div></form>`;
}
function init() {
  document.documentElement.classList.add("motion-enabled");
  const revealTargets = document.querySelectorAll(
    ".section-head, .supplier-placeholder, .article-card, .location-card, .directory-launch, .price-card, .info-panel",
  );
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("motion-in");
          observer.unobserve(entry.target);
        }
      }),
      { threshold: 0.08, rootMargin: "0px 0px -24px" },
    );
    revealTargets.forEach((element) => {
      element.classList.add("motion-ready");
      observer.observe(element);
    });
  }
  document.querySelector(".menu-toggle")?.addEventListener("click", (e) => {
    const m = document.querySelector(".mobile-nav");
    const open = m.classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", String(open));
    e.currentTarget.setAttribute(
      "aria-label",
      open ? "Close menu" : "Open menu",
    );
    e.currentTarget.innerHTML = svgIcon(open ? "close" : "menu");
  });
  document.querySelector(".modal-close")?.addEventListener("click", closeModal);
  document.getElementById("modal-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-backdrop") closeModal();
  });
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") closeModal();
    },
    { once: false },
  );
  document.querySelectorAll("[data-main-search]").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = new FormData(f).get("q") || "";
      location.href = `/directory/?q=${encodeURIComponent(q)}`;
    }),
  );
  document.querySelectorAll(".inquiry-trigger").forEach((b) =>
    b.addEventListener("click", () => {
      const p = profiles.find((x) => x.id === b.dataset.profile) || profiles[0];
      openModal(`Send Inquiry to ${p.name}`, inquiryForm(p));
      document
        .getElementById("inquiry-form")
        ?.addEventListener("submit", (ev) => {
          ev.preventDefault();
          const data = Object.fromEntries(new FormData(ev.target));
          const existing = JSON.parse(
            localStorage.getItem("pi_inquiries") || "[]",
          );
          existing.unshift({ ...data, createdAt: new Date().toISOString() });
          localStorage.setItem("pi_inquiries", JSON.stringify(existing));
          ev.target.innerHTML = `<div class="empty-state"><h3>Inquiry sent</h3><p>${p.name} will receive your project details. A copy has been saved in your account activity.</p><button type="button" class="btn btn-primary" id="close-success">Done</button></div>`;
          document.getElementById("close-success").onclick = closeModal;
          showToast("Inquiry sent successfully.");
        });
    }),
  );
  document.querySelectorAll(".save-profile").forEach((b) =>
    b.addEventListener("click", () => {
      const saves = new Set(
        JSON.parse(localStorage.getItem("pi_saved") || "[]"),
      );
      saves.add(b.dataset.profile);
      localStorage.setItem("pi_saved", JSON.stringify([...saves]));
      b.textContent = "Saved";
      showToast("Profile saved.");
    }),
  );
  document.querySelectorAll(".share-profile").forEach((b) =>
    b.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        showToast("Profile link copied.");
      } catch {
        showToast("Copy this page URL to share.");
      }
    }),
  );
  document
    .querySelectorAll("[data-report-profile]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        openModal(
          "Report Profile",
          `<form class="form-grid" data-modal-form><div class="field full"><label>Reason</label><select><option>Incorrect information</option><option>Impersonation</option><option>Unsafe or abusive conduct</option><option>Suspicious reviews</option><option>Other</option></select></div><div class="field full"><label>Details</label><textarea required></textarea></div><div class="field full"><button class="btn btn-primary">Submit Report</button></div></form>`,
        ),
      ),
    );
  document.querySelectorAll("[data-generic-form]").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      f.reset();
      showToast(f.dataset.success || "Submitted successfully.");
    }),
  );
  document.querySelectorAll("[data-newsletter]").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      f.reset();
      showToast("You are subscribed to Pageant Index updates.");
    }),
  );
  document
    .querySelectorAll(".plan-select")
    .forEach((b) =>
      b.addEventListener("click", () =>
        openModal(
          b.dataset.plan,
          `<p class="muted">Complete the details below to start the ${b.dataset.plan} onboarding process.</p><form class="form-grid" data-modal-form><div class="field"><label>Business or professional name</label><input required></div><div class="field"><label>Email</label><input type="email" required></div><div class="field"><label>Mobile number</label><input required></div><div class="field"><label>Primary category</label><select>${categories.map((c) => `<option>${c[0]}</option>`).join("")}</select></div><label class="checkbox-consent field full"><input type="checkbox" required> I understand that paid visibility is clearly labeled and does not purchase a higher organic ranking.</label><div class="field full"><button class="btn btn-primary btn-block">Continue</button></div></form>`,
        ),
      ),
    );
  const inviteProfessional = () => openModal(
    "Invite a Professional",
    `<p class="muted">Send an official Pageant Index invitation to a professional or supplier you trust.</p><form class="form-grid" data-modal-form><div class="field"><label>Your name</label><input name="sender" required></div><div class="field"><label>Your email</label><input name="senderEmail" type="email" required></div><div class="field"><label>Professional or business name</label><input name="professional" required></div><div class="field"><label>Their email</label><input name="professionalEmail" type="email" required></div><div class="field full"><label>Why should they join?</label><textarea name="note" placeholder="Optional personal note"></textarea></div><label class="checkbox-consent field full"><input type="checkbox" required> I confirm that I know this professional or have a legitimate reason to invite them.</label><div class="field full"><button class="btn btn-primary btn-block">Send invitation request</button></div></form>`,
  );
  document.getElementById("invite-professional")?.addEventListener("click", inviteProfessional);
  document.querySelectorAll("[data-invite-professional]").forEach((button) =>
    button.addEventListener("click", inviteProfessional));
  document.querySelector("[data-directory-interest]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    localStorage.setItem("pi_directory_interest", JSON.stringify({...data, createdAt:new Date().toISOString()}));
    openModal("Be notified when matches are published", `<p class="muted">The founding directory is accepting verified profiles. Leave your email and we will notify you when matching professionals are published.</p><form class="form-grid" data-modal-form><div class="field full"><label>Email</label><input name="email" type="email" required autocomplete="email"></div><div class="field full"><button class="btn btn-primary btn-block">Notify me</button></div></form>`);
  });
  document.getElementById("campaign-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    localStorage.setItem("pi_campaign_request", JSON.stringify({...data, createdAt:new Date().toISOString()}));
    event.currentTarget.innerHTML = `<div class="empty-state"><h3>Campaign request received</h3><p>Your brief has been saved. The Pageant Index team will review fit, timing, inventory, and private commercial terms before activation.</p><a class="btn btn-primary" href="/">Return home</a></div>`;
    showToast("Campaign request submitted.");
  });
  document.addEventListener("submit", (e) => {
    if (e.target.matches("[data-modal-form]")) {
      e.preventDefault();
      e.target.innerHTML =
        '<div class="empty-state"><h3>Request received</h3><p>The Pageant Index onboarding team will contact you with the next steps.</p></div>';
      showToast("Request submitted.");
    }
  });
  if (page === "directory") initDirectory();
  if (page === "profile") initProfileTabs();
  if (page === "claim") initClaim();
  if (page === "signin" || page === "signup") initSignIn();
  if (page === "calendar") initCalendar();
  if (page === "admin") initAdmin();
  if (page === "dashboard") initDashboard();
}
function initDirectory() {
  const q = new URLSearchParams(window.__APP_SEARCH ?? location.search);
  const kw = document.getElementById("public-filter-keyword");
  const cat = document.getElementById("public-filter-category");
  const loc = document.getElementById("public-filter-location");
  const sort = document.getElementById("sort-select");
  if (!kw || !cat || !loc) return;
  kw.value = q.get("q") || "";
  cat.value = q.get("category") || "";
  loc.value = q.get("location") || "";
  const apply = () => {
    const cards = [...document.querySelectorAll("[data-profile-card]")];
    cards.forEach((c) => {
      const hay = (c.dataset.search || "").toLowerCase();
      const ok =
        (!kw.value || hay.includes(kw.value.toLowerCase())) &&
        (!cat.value || c.dataset.category === cat.value) &&
        (!loc.value || c.dataset.location === loc.value);
      c.hidden = !ok;
    });
    const visible = cards.filter((c) => !c.hidden);
    const list = document.getElementById("results-list");
    if (list && sort) {
      const sorted = [...visible].sort((a, b) => {
        if (sort.value === "alphabetical")
        return a.dataset.name.localeCompare(b.dataset.name);
        return Number(b.dataset.featured) - Number(a.dataset.featured);
      });
      sorted.forEach((card) => list.appendChild(card));
    }
    if (document.getElementById("result-count")) document.getElementById("result-count").textContent = visible.length;
    if (document.getElementById("empty-results")) document.getElementById("empty-results").hidden = visible.length !== 0;
  };
  [kw, cat, loc, sort].filter(Boolean).forEach((element) =>
    element.addEventListener(element === kw ? "input" : "change", apply));
  document.getElementById("public-directory-search")?.addEventListener("submit", (event) => {
    event.preventDefault();
    apply();
  });
  apply();
}
function initProfileTabs() {
  document.querySelectorAll(".profile-nav button").forEach((b) =>
    b.addEventListener("click", () => {
      document
        .querySelectorAll(".profile-nav button")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      document
        .querySelector(`[data-section="${b.dataset.tab}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }),
  );
}
function initClaim() {
  let step = 0;
  const show = () => {
    document
      .querySelectorAll("[data-claim-step]")
      .forEach((x) =>
        x.classList.toggle("active", +x.dataset.claimStep === step),
      );
    document
      .querySelectorAll("[data-step-indicator]")
      .forEach((x) =>
        x.classList.toggle("active", +x.dataset.stepIndicator <= step),
      );
  };
  document.querySelectorAll(".claim-next").forEach((b) =>
    b.addEventListener("click", () => {
      step = Math.min(4, step + 1);
      show();
    }),
  );
  document.querySelectorAll(".claim-back").forEach((b) =>
    b.addEventListener("click", () => {
      step = Math.max(0, step - 1);
      show();
    }),
  );
}
function initSignIn() {
  const signupMessage = document.querySelector("#signup-form .form-note");
  if (signupMessage) {
    signupMessage.id = "signup-message";
    signupMessage.setAttribute("aria-live", "polite");
  }
  const signupForm = document.getElementById("signup-form");
  if (signupForm) signupForm.noValidate = true;
  const setTab = (name) => {
    document.querySelectorAll("[data-auth-tab]").forEach((button) =>
      button.classList.toggle("active", button.dataset.authTab === name));
    document.querySelectorAll("[data-auth-panel]").forEach((panel) =>
      panel.classList.toggle("active", panel.dataset.authPanel === name));
  };
  document.querySelectorAll("[data-auth-tab]").forEach((button) =>
    button.addEventListener("click", () => setTab(button.dataset.authTab)));
  document.getElementById("signin-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      const session = await supabaseRequest("/auth/v1/token?grant_type=password", {
        method:"POST",
        body:JSON.stringify({email:data.email,password:data.password}),
      });
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      showToast("Signed in successfully.");
      setTimeout(() => location.href = isAdminSession() ? "/admin/" : "/dashboard/", 500);
    } catch (error) {
      showToast(error.message, "error");
      button.disabled = false;
    }
  });
  document.getElementById("signup-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const firstInvalid = [...form.elements].find((field) =>
      typeof field.checkValidity === "function" && !field.checkValidity());
    if (firstInvalid) {
      const label = firstInvalid.closest(".field")?.querySelector("label")?.textContent || "required field";
      const message = `Please complete the ${label.toLowerCase()}.`;
      const status = document.getElementById("signup-message");
      if (status) status.textContent = message;
      firstInvalid.focus();
      showToast(message, "error");
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    if (data.password !== data.confirm) {
      const status = document.getElementById("signup-message");
      if (status) status.textContent = "Passwords do not match.";
      showToast("Passwords do not match.", "error");
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    const status = document.getElementById("signup-message");
    if (status) status.textContent = "Creating your secure account…";
    try {
      const response = await supabaseRequest("/auth/v1/signup", {
        method:"POST",
        body:JSON.stringify({
          email:data.email,
          password:data.password,
          data:{full_name:data.name,business_name:data.business,category:data.category},
        }),
      });
      if (response?.access_token) localStorage.setItem(SESSION_KEY, JSON.stringify(response));
      const message = response?.access_token ? "Account created." : "Check your email to confirm your account.";
      const status = document.getElementById("signup-message");
      if (status) status.textContent = message;
      showToast(message);
      setTimeout(() => location.href = response?.access_token ? "/dashboard/" : "/sign-in/", 800);
    } catch (error) {
      const status = document.getElementById("signup-message");
      if (status) status.textContent = error.message;
      showToast(error.message, "error");
      button.disabled = false;
    }
  });
  document.querySelector("[data-forgot-password]")?.addEventListener("click", () =>
    showToast("Password recovery will activate with secure authentication."));
}
function initCalendar() {
  document
    .getElementById("submit-event-btn")
    ?.addEventListener("click", () =>
      openModal(
        "Submit a Pageant Event",
        `<form class="form-grid" data-modal-form><div class="field"><label>Pageant name</label><input required></div><div class="field"><label>Organization</label><input required></div><div class="field"><label>Event date</label><input type="date" required></div><div class="field"><label>Application deadline</label><input type="date"></div><div class="field"><label>Location</label><input required></div><div class="field"><label>Event type</label><select><option>Municipal</option><option>Provincial</option><option>Regional</option><option>National</option><option>School</option><option>Festival</option><option>Tourism</option></select></div><div class="field full"><label>Official link</label><input type="url"></div><div class="field full"><label>Organizer contact</label><input required></div><div class="field full"><button class="btn btn-primary btn-block">Submit for Approval</button></div></form>`,
      ),
    );
}
function slugify(value) {
  return String(value || "").toLowerCase().trim()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function adminSupplierForm(p = null) {
  const value = (key, fallback = "") => escapeHtml(p?.[key] ?? fallback);
  const checked = (key) => p?.[key] ? "checked" : "";
  const selected = (actual, expected) => actual === expected ? "selected" : "";
  return `<form id="admin-supplier-form" class="admin-supplier-form" data-database-id="${p?.databaseId || ""}">
    <div class="admin-form-section"><h3>Public identity</h3><div class="form-grid">
      <div class="field"><label>Public name *</label><input name="public_name" required maxlength="120" value="${value("name")}"></div>
      <div class="field"><label>Profile slug *</label><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value="${value("id")}" placeholder="supplier-name"></div>
      <div class="field"><label>Category *</label><select name="category" required>${categories.map(([name])=>`<option ${selected(p?.category,name)}>${name}</option>`).join("")}</select></div>
      <div class="field"><label>Province or region *</label><select name="location" required>${locations.map((name)=>`<option ${selected(p?.location,name)}>${name}</option>`).join("")}</select></div>
      <div class="field"><label>City or municipality</label><input name="city" value="${value("city")}"></div>
      <div class="field"><label>Years of experience</label><input name="years_experience" type="number" min="0" max="100" value="${value("years")}"></div>
      <div class="field full"><label>Headline</label><input name="headline" maxlength="180" value="${value("headline")}"></div>
      <div class="field full"><label>Biography</label><textarea name="biography" maxlength="4000">${value("biography",p?.desc || "")}</textarea></div>
    </div></div>
    <div class="admin-form-section"><h3>Contact and links</h3><div class="form-grid">
      <div class="field"><label>Public email</label><input name="public_email" type="email" value="${value("public_email")}"></div>
      <div class="field"><label>Mobile</label><input name="mobile" inputmode="tel" value="${value("mobile")}"></div>
      <div class="field"><label>Website</label><input name="website_url" type="url" value="${value("website_url")}"></div>
      <div class="field"><label>Official social page</label><input name="social_url" type="url" value="${value("social_url")}"></div>
      <div class="field"><label>Logo URL</label><input name="logo_url" type="url" value="${value("logo_url")}"></div>
      <div class="field"><label>Cover image URL</label><input name="cover_url" type="url" value="${value("cover_url")}"></div>
      <div class="field full"><label>Services, one per line</label><textarea name="services">${escapeHtml((p?.services || []).join("\n"))}</textarea></div>
    </div></div>
    <div class="admin-form-section"><h3>Status and visibility</h3><div class="form-grid">
      <div class="field"><label>Publication status</label><select name="status">${["draft","pending_review","published","unpublished","archived"].map((status)=>`<option value="${status}" ${selected(p?.status || "draft",status)}>${status.replaceAll("_"," ")}</option>`).join("")}</select></div>
      <div class="field"><label>Verification status</label><select name="verification_status">${["not_requested","pending","verified","rejected","expired"].map((status)=>`<option value="${status}" ${selected(p?.verification_status || "not_requested",status)}>${status.replaceAll("_"," ")}</option>`).join("")}</select></div>
      <label class="checkbox-consent"><input name="accepts_nationwide" type="checkbox" ${checked("nationwide")}> Accepts nationwide projects</label>
      <label class="checkbox-consent"><input name="available_for_travel" type="checkbox" ${checked("travel")}> Available for travel</label>
      <label class="checkbox-consent"><input name="featured" type="checkbox" ${checked("featured")}> Clearly label as featured</label>
      <div class="field"><label>Featured label</label><input name="featured_label" value="${value("featured_label")}" placeholder="Featured"></div>
    </div></div>
    <div class="admin-form-actions">
      ${p ? '<button class="btn btn-danger" type="button" id="delete-supplier">Delete</button>' : '<span></span>'}
      <div><button class="btn btn-ghost" type="button" id="cancel-supplier">Cancel</button><button class="btn btn-secondary" type="submit" data-save-mode="draft">Save draft</button><button class="btn btn-primary" type="submit" data-save-mode="current">${p?.status === "published" ? "Save changes" : "Save & publish"}</button></div>
    </div>
  </form>`;
}
function supplierFormPayload(form, mode) {
  const data = new FormData(form);
  const publicName = String(data.get("public_name") || "").trim();
  const requestedStatus = String(data.get("status") || "draft");
  return {
    public_name: publicName,
    slug: slugify(data.get("slug") || publicName),
    category: data.get("category"),
    location: data.get("location"),
    city: String(data.get("city") || "").trim() || null,
    years_experience: data.get("years_experience") ? Number(data.get("years_experience")) : null,
    headline: String(data.get("headline") || "").trim() || null,
    biography: String(data.get("biography") || "").trim() || null,
    public_email: String(data.get("public_email") || "").trim() || null,
    mobile: String(data.get("mobile") || "").trim() || null,
    website_url: String(data.get("website_url") || "").trim() || null,
    social_url: String(data.get("social_url") || "").trim() || null,
    logo_url: String(data.get("logo_url") || "").trim() || null,
    cover_url: String(data.get("cover_url") || "").trim() || null,
    services: String(data.get("services") || "").split("\n").map((x)=>x.trim()).filter(Boolean),
    accepts_nationwide: data.get("accepts_nationwide") === "on",
    available_for_travel: data.get("available_for_travel") === "on",
    featured: data.get("featured") === "on",
    featured_label: String(data.get("featured_label") || "").trim() || null,
    verification_status: data.get("verification_status"),
    status: mode === "draft" ? "draft" : (form.dataset.databaseId ? requestedStatus : "published"),
  };
}
function initAdmin() {
  const login = document.getElementById("admin-login-form");
  if (login) {
    login.addEventListener("submit", async (event) => {
      event.preventDefault();
      const message = document.getElementById("admin-auth-message");
      message.textContent = "Signing in…";
      try {
        const credentials = Object.fromEntries(new FormData(login));
        const session = await supabaseRequest("/auth/v1/token?grant_type=password", {method:"POST", body:JSON.stringify(credentials)});
        if (session?.user?.app_metadata?.role !== "admin") throw new Error("This account is not authorized for administration.");
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        location.reload();
      } catch (error) {
        localStorage.removeItem(SESSION_KEY);
        message.textContent = error.message;
      }
    });
    return;
  }
  document.getElementById("admin-signout")?.addEventListener("click", async () => {
    try { await supabaseRequest("/auth/v1/logout", {method:"POST"}); } catch {}
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  });
  const applyFilters = () => {
    const keyword = document.getElementById("admin-search").value.toLowerCase();
    const status = document.getElementById("admin-status-filter").value;
    const category = document.getElementById("admin-category-filter").value;
    const locationFilter = document.getElementById("admin-location-filter").value;
    const rows = [...document.querySelectorAll("#admin-tbody tr[data-admin-name]")];
    rows.forEach((row) => row.hidden =
      !row.dataset.adminName.includes(keyword) ||
      Boolean(status && row.dataset.status !== status) ||
      Boolean(category && row.dataset.category !== category) ||
      Boolean(locationFilter && row.dataset.location !== locationFilter));
    document.getElementById("admin-visible-count").textContent = rows.filter((row)=>!row.hidden).length;
  };
  ["admin-search","admin-status-filter","admin-category-filter","admin-location-filter"].forEach((id) =>
    document.getElementById(id)?.addEventListener(id === "admin-search" ? "input" : "change", applyFilters));
  const bindSupplierForm = (supplier = null) => {
    openModal(supplier ? `Edit ${supplier.name}` : "Add Supplier", adminSupplierForm(supplier));
    const form = document.getElementById("admin-supplier-form");
    const nameField = form.elements.public_name;
    const slugField = form.elements.slug;
    nameField.addEventListener("input", () => {
      if (!form.dataset.databaseId && !slugField.dataset.edited) slugField.value = slugify(nameField.value);
    });
    slugField.addEventListener("input", () => slugField.dataset.edited = "true");
    document.getElementById("cancel-supplier").onclick = closeModal;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = event.submitter;
      const mode = button?.dataset.saveMode || "current";
      const payload = supplierFormPayload(form, mode);
      if (!payload.slug) return showToast("A valid profile slug is required.", "error");
      button.disabled = true;
      button.textContent = "Saving…";
      try {
        if (form.dataset.databaseId) {
          await supabaseRequest(`/rest/v1/suppliers?id=eq.${encodeURIComponent(form.dataset.databaseId)}`, {method:"PATCH", body:JSON.stringify(payload)});
        } else {
          await supabaseRequest("/rest/v1/suppliers", {method:"POST", body:JSON.stringify(payload)});
        }
        showToast(payload.status === "published" ? "Supplier published." : "Supplier saved.");
        closeModal();
        setTimeout(() => location.reload(), 450);
      } catch (error) {
        showToast(error.message, "error");
        button.disabled = false;
        button.textContent = mode === "draft" ? "Save draft" : "Save changes";
      }
    });
    document.getElementById("delete-supplier")?.addEventListener("click", () => {
      openModal("Delete supplier permanently?", `<div class="danger-confirm"><p>This permanently removes <strong>${escapeHtml(supplier.name)}</strong> and its directory record. This action cannot be undone.</p><div><button class="btn btn-ghost" id="cancel-delete">Cancel</button><button class="btn btn-danger" id="confirm-delete">Delete permanently</button></div></div>`);
      document.getElementById("cancel-delete").onclick = closeModal;
      document.getElementById("confirm-delete").onclick = async () => {
        try {
          await supabaseRequest(`/rest/v1/suppliers?id=eq.${encodeURIComponent(supplier.databaseId)}`, {method:"DELETE"});
          showToast("Supplier deleted.");
          closeModal();
          setTimeout(() => location.reload(), 450);
        } catch (error) { showToast(error.message,"error"); }
      };
    });
  };
  document.querySelectorAll("[data-add-supplier]").forEach((button) =>
    button.addEventListener("click", () => bindSupplierForm()));
  document.querySelectorAll(".admin-edit").forEach((button) =>
    button.addEventListener("click", () => bindSupplierForm(profiles.find((p)=>p.id===button.dataset.profile))));
}
function initDashboard() {
  const upload = document.getElementById("portfolio-upload");
  if (!upload) return;
  let uploadedCount = 0;
  const fields = {
    business: document.getElementById("preview-business-name"),
    category: document.getElementById("preview-category"),
    location: document.getElementById("preview-location"),
    email: document.getElementById("preview-email"),
    about: document.getElementById("preview-about"),
    services: document.getElementById("preview-services"),
    coverage: document.getElementById("preview-coverage"),
    link: document.getElementById("preview-link"),
  };
  const renderProfileState = () => {
    document.getElementById("live-business-name").textContent = fields.business.value || "Your business name";
    document.getElementById("live-category").textContent = fields.category.value || "Professional category";
    document.getElementById("live-location").textContent = fields.location.value || "Location, Philippines";
    document.getElementById("live-about").textContent = fields.about.value || "Your professional introduction will appear here.";
    document.getElementById("live-services").textContent = fields.services.value || "Your services will appear here.";
    const checks = {
      identity: Boolean(fields.business.value.trim()),
      about: fields.about.value.trim().length >= 40,
      services: fields.services.value.trim().length >= 10,
      location: Boolean(fields.location.value.trim()),
      contact: fields.email.validity.valid && Boolean(fields.email.value),
      portfolio: uploadedCount >= 3,
    };
    const completed = Object.values(checks).filter(Boolean).length;
    const score = Math.round(completed / Object.keys(checks).length * 100);
    document.getElementById("readiness-score").textContent = `${score}%`;
    document.getElementById("readiness-label").textContent = `${score}% complete`;
    document.getElementById("readiness-bar").style.width = `${score}%`;
    document.getElementById("readiness-message").textContent = score === 100 ? "Ready for editorial review." : "Complete the required public details.";
    Object.entries(checks).forEach(([name, complete]) =>
      document.querySelector(`[data-check="${name}"]`)?.classList.toggle("complete", complete));
    return score;
  };
  const updatePreview = (files) => {
    uploadedCount = files.length;
    const slots = [...document.querySelectorAll("#preview-portfolio span")];
    [...files].slice(0, slots.length).forEach((file, index) => {
      slots[index].innerHTML = `<img src="${URL.createObjectURL(file)}" alt="">`;
    });
    document.getElementById("asset-count").textContent =
      `${files.length} uploaded asset${files.length === 1 ? "" : "s"}`;
    renderProfileState();
  };
  upload.addEventListener("change", () => updatePreview(upload.files));
  Object.values(fields).forEach((field) => field.addEventListener("input", renderProfileState));
  Object.values(fields).forEach((field) => field.addEventListener("change", renderProfileState));
  document.querySelectorAll(".remove-asset").forEach((button) =>
    button.addEventListener("click", () => button.closest("[data-portfolio-row]")?.remove()));
  document.getElementById("save-profile-draft")?.addEventListener("click", () => {
    const draft = {
      business: document.getElementById("preview-business-name").value,
      category: document.getElementById("preview-category").value,
      location: document.getElementById("preview-location").value,
      about: document.getElementById("preview-about").value,
      email: fields.email.value,
      services: document.getElementById("preview-services").value,
      coverage: fields.coverage.value,
      link: fields.link.value,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem("pi_profile_draft", JSON.stringify(draft));
    showToast("Profile draft saved on this device.");
  });
  document.getElementById("submit-profile-review")?.addEventListener("click", () => {
    if (renderProfileState() < 100) {
      showToast("Complete every readiness item before submitting.", "error");
      document.querySelector(".profile-readiness")?.scrollIntoView({behavior:"smooth"});
      return;
    }
    localStorage.setItem("pi_profile_review", JSON.stringify({status:"submitted",submittedAt:new Date().toISOString()}));
    openModal("Profile submitted for review", `<div class="empty-state">${assetIcon("shield-check")}<h3>Your profile is now in review.</h3><p>Pageant Index will review ownership, public information, portfolio rights, and category evidence before publication. Submission does not guarantee approval or ranking.</p><button class="btn btn-primary" type="button" id="close-review-success">Done</button></div>`);
    document.getElementById("close-review-success").onclick = closeModal;
  });
  document.getElementById("add-portfolio-row")?.addEventListener("click", () =>
    upload.click());
  document.getElementById("open-full-preview")?.addEventListener("click", () =>
    openModal("Public profile preview", `<div class="preview-dialog"><h3>${escapeHtml(fields.business.value || "Your business name")}</h3><p>${escapeHtml(fields.category.value)} · ${escapeHtml(fields.location.value || "Location, Philippines")}</p><h4>About</h4><p>${escapeHtml(fields.about.value || "Your professional introduction will appear here.")}</p><h4>Services</h4><p>${escapeHtml(fields.services.value || "Your services will appear here.")}</p></div>`));
  const draft = JSON.parse(localStorage.getItem("pi_profile_draft") || "null");
  if (draft) Object.entries(fields).forEach(([name, field]) => {
    if (draft[name]) field.value = draft[name];
  });
  renderProfileState();
}
async function bootstrap() {
  if (["home","directory","categories","locations","profile","admin"].includes(page)) {
    await loadSuppliers(page === "admin");
  }
  render();
}
bootstrap();
