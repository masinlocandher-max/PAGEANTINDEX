"use strict";

(() => {
  const config = window.PageantIndexConfig;
  const root = document.getElementById("app");
  if (!config || !root) return;

  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  const WEB_URL = "https://www.pageantindex.com";
  let suppliers = [];
  let savedSupplierIds = new Set();
  let activeScreen = "discover";
  let session = null;
  let user = null;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);

  function readSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const parsed = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (parsed?.access_token) return parsed;
      } catch {}
    }
    return null;
  }

  async function request(pathname, options = {}, token = null) {
    const headers = {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    };
    const accessToken = token || session?.access_token;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {...options, headers});
    const text = response.status === 204 ? "" : await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = {message: text}; }
    }
    if (!response.ok) throw new Error(payload?.message || payload?.error_description || payload?.hint || `Request failed (${response.status})`);
    return payload;
  }

  function countryOptions() {
    return config.countries.map(({code, name, flag}) => `<option value="${code}">${flag} ${escapeHtml(name)}</option>`).join("");
  }

  function categoryOptions() {
    return config.supplierCategories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
  }

  function navItems() {
    const accountType = user?.user_metadata?.account_type || "guest";
    if (accountType === "supplier") {
      return [
        ["discover", "⌂", "Discover"],
        ["profile", "♕", "Profile"],
        ["inquiries", "♡", "Inquiries"],
        ["travel", "✈", "Travel"],
        ["account", "☰", "Account"],
      ];
    }
    return [
      ["discover", "⌂", "Discover"],
      ["saved", "♡", "Saved"],
      ["pageants", "♕", "Pageants"],
      ["travel", "✈", "Travel"],
      ["account", "☰", "Account"],
    ];
  }

  function supplierCard(profile) {
    const image = profile.cover_url || profile.logo_url || "/public/images/pageant-icon.png";
    const flag = profile.country_code ? `${config.flagFromCode(profile.country_code)} ` : "";
    const location = [profile.city, profile.region, profile.country_name || profile.location].filter(Boolean).join(", ");
    const saved = savedSupplierIds.has(profile.id);
    return `<article class="supplier-card" data-supplier-card data-category="${escapeHtml(profile.category || profile.primary_category || "")}" data-country="${escapeHtml(profile.country_code || "")}" data-search="${escapeHtml(`${profile.public_name} ${profile.category || ""} ${location} ${(profile.services || []).join(" ")}`.toLowerCase())}">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(profile.public_name)}" loading="lazy" data-fallback>
      <div><div>${profile.verification_status === "verified" ? '<span class="badge">Verified</span>' : ""}</div><h3>${escapeHtml(profile.public_name)}</h3><p>${escapeHtml(profile.category || profile.primary_category || "Supplier")}</p><p>${escapeHtml(flag + (location || "Location not published"))}</p></div>
      <div class="actions"><a class="secondary" href="${WEB_URL}/professional/${encodeURIComponent(profile.slug)}/">View profile</a><button class="${saved ? "secondary" : "primary"}" type="button" data-save-supplier="${escapeHtml(profile.id)}">${saved ? "Saved" : "Save"}</button></div>
    </article>`;
  }

  function discoverScreen() {
    return `<section class="screen ${activeScreen === "discover" ? "active" : ""}" data-screen="discover">
      <div class="hero"><h1>Discover the people behind pageantry.</h1><p>Search real published supplier profiles worldwide. Pageant Index does not display invented ratings, reviews, businesses, or activity.</p></div>
      <div class="search-row"><input id="app-search" type="search" placeholder="Search supplier, service, city, or country"><button class="primary" type="button" id="app-search-button">Search</button></div>
      <div class="filter-grid"><select id="app-category"><option value="">All categories</option>${categoryOptions()}</select><select id="app-country"><option value="">🌐 All countries</option>${countryOptions()}</select></div>
      <div class="section"><div class="section-heading"><h2>Published suppliers</h2><span><b id="app-result-count">${suppliers.length}</b> shown</span></div><div class="supplier-list" id="supplier-list">${suppliers.length ? suppliers.map(supplierCard).join("") : '<div class="empty">No approved supplier profiles are published yet. New profiles appear only after Pageant Index review.</div>'}</div></div>
    </section>`;
  }

  function savedScreen() {
    const saved = suppliers.filter((profile) => savedSupplierIds.has(profile.id));
    return `<section class="screen ${activeScreen === "saved" ? "active" : ""}" data-screen="saved"><div class="hero"><h1>Saved suppliers.</h1><p>Your shortlist is private to your account.</p></div><div class="section"><div class="supplier-list">${saved.length ? saved.map(supplierCard).join("") : `<div class="empty">No suppliers saved yet.${session ? " Browse the directory and tap Save." : ` <a href="${WEB_URL}/sign-in/">Sign in</a> to keep a private shortlist.`}</div>`}</div></div></section>`;
  }

  function pageantsScreen() {
    return `<section class="screen ${activeScreen === "pageants" ? "active" : ""}" data-screen="pageants"><div class="hero"><h1>Pageant calendar.</h1><p>View reviewed dates, official sources, and clearly marked announcements on the Pageant Index website.</p></div><div class="panel section"><h2>Upcoming pageants</h2><p>Event dates can change. Confirm applications, tickets, travel, venue, and accreditation with the official organizer before making commitments.</p><a class="primary" href="${WEB_URL}/pageant-calendar/">Open global calendar</a></div></section>`;
  }

  function travelScreen() {
    const travelProfiles = suppliers.filter((profile) => ["Hotel / Accommodation", "Flights / Airline / Travel Agency", "Transportation / Tour Services"].includes(profile.category || profile.primary_category));
    return `<section class="screen ${activeScreen === "travel" ? "active" : ""}" data-screen="travel"><div class="hero"><h1>Flights, hotels, and travel.</h1><p>Discover approved travel-related providers serving pageant candidates, organizations, and teams.</p></div><div class="travel-note">${escapeHtml(config.travelDisclosure)}</div><div class="travel-actions"><a class="primary" href="${WEB_URL}/directory/?category=Flights%20%2F%20Airline%20%2F%20Travel%20Agency">Find flights and travel</a><a class="secondary" href="${WEB_URL}/directory/?category=Hotel%20%2F%20Accommodation">Find hotels</a></div><div class="section"><div class="section-heading"><h2>Travel providers</h2><span>${travelProfiles.length} published</span></div><div class="supplier-list">${travelProfiles.length ? travelProfiles.map(supplierCard).join("") : '<div class="empty">No approved travel providers are published yet. Pageant Index will not claim booking availability until a provider is reviewed and listed.</div>'}</div></div></section>`;
  }

  function supplierProfileScreen() {
    return `<section class="screen ${activeScreen === "profile" ? "active" : ""}" data-screen="profile"><div class="hero"><h1>Your supplier profile.</h1><p>Manage your primary category, additional categories, countries served, portfolio, and review submission on the secure website workspace.</p></div><div class="panel section"><h2>Supplier workspace</h2><p>Photographer and Videographer are separate categories. You may select one as primary and the other as an additional category.</p><a class="primary" href="${WEB_URL}/dashboard/">Manage supplier profile</a></div></section>`;
  }

  function inquiriesScreen() {
    return `<section class="screen ${activeScreen === "inquiries" ? "active" : ""}" data-screen="inquiries"><div class="hero"><h1>Inquiries.</h1><p>Only real submitted inquiries will appear in the protected supplier workspace.</p></div><div class="panel section"><h2>Private inquiry queue</h2><p>Open the full workspace to review routed project inquiries. Pageant Index does not seed example clients or fake activity.</p><a class="primary" href="${WEB_URL}/dashboard/">Open inquiries</a></div></section>`;
  }

  function accountScreen() {
    const type = user?.user_metadata?.account_type;
    const name = user?.user_metadata?.business_name || user?.user_metadata?.full_name || user?.email || "Guest";
    return `<section class="screen ${activeScreen === "account" ? "active" : ""}" data-screen="account"><div class="hero"><h1>Account.</h1><p>Manage your secure Pageant Index identity and profile type.</p></div><div class="account-list section"><div class="account-row"><strong>${escapeHtml(name)}</strong><span>${type ? escapeHtml(type[0].toUpperCase() + type.slice(1)) : "Not signed in"}</span></div><div class="account-row"><strong>Global network</strong><span>${escapeHtml(config.tagline)}</span></div><div class="account-row"><strong>Privacy</strong><span>Private account data is not automatically public</span></div></div><div class="travel-actions">${session ? `<button class="secondary" type="button" id="app-signout">Sign out</button><a class="primary" href="${WEB_URL}/dashboard/">Open full workspace</a>` : `<a class="primary" href="${WEB_URL}/sign-in/">Sign in</a><a class="secondary" href="${WEB_URL}/sign-up/">Create account</a>`}</div></section>`;
  }

  function shell() {
    const items = navItems();
    const screens = [discoverScreen()];
    if (items.some(([id]) => id === "saved")) screens.push(savedScreen());
    if (items.some(([id]) => id === "pageants")) screens.push(pageantsScreen());
    if (items.some(([id]) => id === "profile")) screens.push(supplierProfileScreen());
    if (items.some(([id]) => id === "inquiries")) screens.push(inquiriesScreen());
    screens.push(travelScreen(), accountScreen());
    return `<div class="app-shell"><aside class="desktop-sidebar"><img src="/public/images/pageant-icon.png" alt="Pageant Index"><p>${escapeHtml(config.tagline)}. A mobile-first companion for real supplier discovery, candidate tools, travel providers, and secure account access.</p><nav>${items.map(([id,,label]) => `<button type="button" class="${activeScreen === id ? "active" : ""}" data-nav="${id}">${label}</button>`).join("")}</nav></aside><div class="mobile-app"><header class="app-topbar"><img class="app-logo" src="/public/images/pageant-icon.png" alt="Pageant Index"><div class="app-title"><strong>Pageant Index</strong><span>${escapeHtml(config.tagline)}</span></div><div class="spacer"></div><a class="icon-button" href="${WEB_URL}/directory/" aria-label="Open full directory">⌕</a></header><main>${screens.join("")}</main><nav class="bottom-nav">${items.map(([id,icon,label]) => `<button type="button" class="${activeScreen === id ? "active" : ""}" data-nav="${id}"><b>${icon}</b>${label}</button>`).join("")}</nav></div></div>`;
  }

  function render() {
    root.innerHTML = shell();
    bind();
  }

  function showScreen(name) {
    activeScreen = name;
    document.querySelectorAll("[data-screen]").forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === name));
    document.querySelectorAll("[data-nav]").forEach((button) => button.classList.toggle("active", button.dataset.nav === name));
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function applyFilters() {
    const query = document.getElementById("app-search")?.value.trim().toLowerCase() || "";
    const category = document.getElementById("app-category")?.value || "";
    const country = document.getElementById("app-country")?.value || "";
    const cards = [...document.querySelectorAll("[data-supplier-card]")];
    cards.forEach((card) => {
      card.hidden = Boolean((query && !card.dataset.search.includes(query)) || (category && card.dataset.category !== category) || (country && card.dataset.country !== country));
    });
    const visible = cards.filter((card) => !card.hidden).length;
    const count = document.getElementById("app-result-count");
    if (count) count.textContent = visible;
  }

  async function toggleSave(button) {
    if (!session?.access_token || !user?.id) {
      location.href = `${WEB_URL}/sign-in/?next=/dashboard/`;
      return;
    }
    const supplierId = button.dataset.saveSupplier;
    button.disabled = true;
    try {
      if (savedSupplierIds.has(supplierId)) {
        await request(`/rest/v1/saved_supplier_profiles?user_id=eq.${encodeURIComponent(user.id)}&supplier_id=eq.${encodeURIComponent(supplierId)}`, {method: "DELETE", headers: {Prefer: "return=minimal"}});
        savedSupplierIds.delete(supplierId);
      } else {
        await request("/rest/v1/saved_supplier_profiles", {method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify({user_id:user.id,supplier_id:supplierId})});
        savedSupplierIds.add(supplierId);
      }
      render();
    } catch (error) {
      button.disabled = false;
      alert(error.message);
    }
  }

  function bind() {
    document.querySelectorAll("[data-nav]").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.nav)));
    document.getElementById("app-search")?.addEventListener("input", applyFilters);
    document.getElementById("app-search-button")?.addEventListener("click", applyFilters);
    document.getElementById("app-category")?.addEventListener("change", applyFilters);
    document.getElementById("app-country")?.addEventListener("change", applyFilters);
    document.querySelectorAll("[data-save-supplier]").forEach((button) => button.addEventListener("click", () => toggleSave(button)));
    document.querySelectorAll("[data-fallback]").forEach((image) => image.addEventListener("error", () => { image.src = "/public/images/pageant-icon.png"; }, {once:true}));
    document.getElementById("app-signout")?.addEventListener("click", async () => {
      try { await request("/auth/v1/logout", {method:"POST"}); } catch {}
      localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); location.reload();
    });
  }

  async function start() {
    root.innerHTML = '<div class="loading"><div><img src="/public/images/pageant-icon.png" alt="Pageant Index"><p>Loading the global network</p></div></div>';
    session = readSession();
    if (session?.access_token) {
      try { user = await request("/auth/v1/user", {method:"GET"}, session.access_token); }
      catch { user = session.user || null; }
    }
    try {
      suppliers = await request("/rest/v1/suppliers?select=id,slug,public_name,category,primary_category,additional_categories,country_code,country_name,city,region,location,logo_url,cover_url,services,verification_status,status&status=eq.published&order=featured.desc,sort_order.asc,public_name.asc");
    } catch (error) {
      console.warn("Published suppliers could not be loaded.", error.message);
      suppliers = [];
    }
    if (user?.id) {
      try {
        const rows = await request(`/rest/v1/saved_supplier_profiles?select=supplier_id&user_id=eq.${encodeURIComponent(user.id)}`);
        savedSupplierIds = new Set((rows || []).map((row) => row.supplier_id));
      } catch {}
    }
    render();
  }

  start();
})();
