"use strict";

(() => {
  const config = window.PageantIndexConfig;
  if (!config) return;

  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  const rolePages = new Set(["/candidates/", "/media/", "/announcements/", "/experiences/"]);
  let publicContent = {announcements: [], ads: [], articles: []};
  let contentPromise = null;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);

  const safeUrl = (value, fallback = "#") => {
    try {
      const url = new URL(String(value || ""), location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : fallback;
    } catch {
      return fallback;
    }
  };

  function readSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const session = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (session?.access_token) return session;
      } catch {}
    }
    return null;
  }

  function saveSession(session, persistent = false) {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (persistent ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
  }

  async function request(pathname, options = {}, explicitToken = null) {
    const session = readSession();
    const headers = {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    };
    const token = explicitToken || session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {...options, headers});
    const text = response.status === 204 ? "" : await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = {message: text}; }
    }
    if (!response.ok) throw new Error(payload?.message || payload?.error_description || payload?.hint || `Request failed (${response.status})`);
    return payload;
  }

  const countryName = (code) => config.countries.find((country) => country.code === code)?.name || code || "";
  const countryOptions = (selected = "") => config.countries.map(({code, name, flag}) => `<option value="${code}" ${selected === code ? "selected" : ""}>${flag} ${escapeHtml(name)}</option>`).join("");
  const optionList = (values, selected = "") => values.map((value) => `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");

  async function loadPublicContent() {
    if (contentPromise) return contentPromise;
    contentPromise = Promise.allSettled([
      request("/rest/v1/announcements?select=id,title,summary,category,target_url,published_at&status=eq.published&order=is_pinned.desc,published_at.desc&limit=8"),
      request("/rest/v1/featured_ads?select=id,label,title,summary,image_url,target_url,placement,starts_at,ends_at&status=eq.published&order=priority.desc,created_at.desc&limit=8"),
      request("/rest/v1/media_articles?select=id,slug,title,excerpt,cover_url,column_name,author_name,published_at,canonical_url&review_state=eq.approved&published_at=not.is.null&order=published_at.desc&limit=12"),
    ]).then(([announcements, ads, articles]) => {
      publicContent = {
        announcements: announcements.status === "fulfilled" ? announcements.value || [] : [],
        ads: ads.status === "fulfilled" ? ads.value || [] : [],
        articles: articles.status === "fulfilled" ? articles.value || [] : [],
      };
      return publicContent;
    });
    return contentPromise;
  }

  function replaceNavigation() {
    const desktop = document.querySelector(".desktop-nav");
    const mobile = document.querySelector(".mobile-nav");
    const activePath = location.pathname;
    const links = config.publicMenu.map(({label, href}) => `<a class="${activePath === href ? "active" : ""}" href="${href}">${escapeHtml(label)}</a>`).join("");
    if (desktop && desktop.dataset.piAudienceMenu !== "true") {
      desktop.dataset.piAudienceMenu = "true";
      desktop.innerHTML = links;
    }
    if (mobile && mobile.dataset.piAudienceMenu !== "true") {
      mobile.dataset.piAudienceMenu = "true";
      mobile.innerHTML = `${links}<a href="/sign-in/">Sign In</a><a class="mobile-nav-cta" href="/sign-up/">Join Pageant Index</a>`;
    }
    document.querySelectorAll(".nav-actions .btn-primary").forEach((button) => {
      button.textContent = "Join";
      button.href = "/sign-up/";
    });
    document.querySelectorAll(".brand").forEach((brand) => brand.setAttribute("aria-label", "Pageant Index home"));
  }

  function audienceSelectorMarkup() {
    return config.accountTypes.map(({value, label}) => `<label><input type="radio" name="account_type" value="${value}" required><span>${escapeHtml(label)}</span></label>`).join("");
  }

  function enhanceSignup() {
    const form = document.getElementById("signup-form");
    if (!form || form.dataset.piAudienceReady === "true") return;
    const accountSwitch = form.querySelector(".pi-profile-type-switch");
    if (!accountSwitch) return;
    form.dataset.piAudienceReady = "true";
    form.noValidate = true;
    accountSwitch.innerHTML = audienceSelectorMarkup();

    const candidateSection = form.querySelector("[data-pi-candidate-fields]");
    candidateSection?.insertAdjacentHTML("beforeend", `
      <div class="field"><label>Current pageant</label><input name="candidate_current_pageant" maxlength="180" placeholder="Leave blank when not currently competing"></div>
      <div class="field"><label>Current title or representation</label><input name="candidate_current_title" maxlength="180"></div>
      <div class="field pi-field-full"><label>Previous pageants</label><textarea name="candidate_previous_pageants" maxlength="2000" placeholder="One per line: year, pageant, placement or title"></textarea><span class="pi-helper">You can add complete pageant history in your private candidate workspace later.</span></div>`);

    form.querySelector("[data-pi-supplier-fields]")?.insertAdjacentHTML("afterend", `
      <section class="pi-ecosystem-fields" data-pi-enthusiast-fields hidden>
        <div class="field pi-field-full"><div class="pi-role-note"><strong>Enthusiast account</strong><span>${escapeHtml(config.audienceDescriptions.enthusiast)}</span></div></div>
        <div class="field pi-field-full"><label>Interests</label><div class="pi-category-grid">
          ${["Supplier discovery", "Pageant announcements", "Media articles", "Voting", "Pay-per-view", "Merchandise"].map((interest) => `<label class="pi-category-option"><input type="checkbox" name="enthusiast_interests" value="${interest}"><span>${interest}</span></label>`).join("")}
        </div></div>
      </section>
      <section class="pi-ecosystem-fields" data-pi-media-fields hidden>
        <div class="field"><label>Media outlet or column name *</label><input name="media_column_name" maxlength="180"></div>
        <div class="field"><label>Media role *</label><select name="media_role"><option value="">Choose one</option>${optionList(config.mediaRoles)}</select></div>
        <div class="field"><label>Media type *</label><select name="media_type"><option value="">Choose one</option>${optionList(config.mediaTypes)}</select></div>
        <div class="field"><label>Official website or social page</label><input name="media_official_url" type="url" placeholder="https://"></div>
        <div class="field pi-field-full"><label>About the column or publication *</label><textarea name="media_bio" maxlength="2500"></textarea></div>
        <div class="field pi-field-full"><div class="pi-role-note"><strong>Media publishing</strong><span>Approved media accounts receive a dedicated column. Articles remain drafts until submitted and reviewed, then published stories can be shared to other platforms.</span></div></div>
      </section>`);

    const updateFields = () => {
      const type = form.querySelector('input[name="account_type"]:checked')?.value || "";
      const sections = {
        candidate: form.querySelector("[data-pi-candidate-fields]"),
        supplier: form.querySelector("[data-pi-supplier-fields]"),
        enthusiast: form.querySelector("[data-pi-enthusiast-fields]"),
        media: form.querySelector("[data-pi-media-fields]"),
      };
      Object.entries(sections).forEach(([role, section]) => {
        if (!section) return;
        const active = role === type;
        section.hidden = !active;
        section.querySelectorAll("input,select,textarea").forEach((field) => {
          const optional = [
            "candidate_pageant_title", "candidate_current_pageant", "candidate_current_title",
            "candidate_previous_pageants", "supplier_additional_categories", "supplier_category_other",
            "media_official_url", "enthusiast_interests",
          ].includes(field.name);
          field.disabled = !active;
          if (!optional) field.required = active;
        });
      });
      const country = form.elements.country_code;
      const city = form.elements.city;
      if (country) country.required = Boolean(type);
      if (city) city.required = Boolean(type);
      const intro = document.querySelector(".official-auth .muted");
      if (intro && type) intro.textContent = config.audienceDescriptions[type];
    };
    form.querySelectorAll('input[name="account_type"]').forEach((input) => input.addEventListener("change", updateFields));
    updateFields();

    const note = document.getElementById("signup-message");
    if (note) note.textContent = "Choose the account type that matches how you will use Pageant Index. Browsing and guest transactions do not require an account.";
  }

  function checkedValues(form, name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
  }

  function previousPageants(value) {
    return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 20);
  }

  async function createRoleRecords(user, payload, token) {
    const common = {
      user_id: user.id,
      account_type: payload.account_type,
      full_name_private: payload.name,
      display_name: payload.account_type === "supplier" ? payload.supplier_business_name : payload.account_type === "media" ? payload.media_column_name : payload.name,
      country_code: payload.country_code,
      country_name: countryName(payload.country_code),
      city: payload.city,
      region: payload.region || null,
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted_at: new Date().toISOString(),
    };
    await request("/rest/v1/user_profiles?on_conflict=user_id", {
      method: "POST",
      headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
      body: JSON.stringify(common),
    }, token);

    if (payload.account_type === "enthusiast") {
      await request("/rest/v1/enthusiast_profiles?on_conflict=user_id", {
        method: "POST", headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
        body: JSON.stringify({user_id: user.id, display_name: payload.name, interests: payload.enthusiast_interests || []}),
      }, token);
      return;
    }

    if (payload.account_type === "candidate") {
      await request("/rest/v1/candidate_profile_drafts?on_conflict=user_id", {
        method: "POST", headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
        body: JSON.stringify({
          user_id: user.id,
          display_name: payload.name,
          candidate_status: payload.candidate_status,
          pageant_title: payload.candidate_pageant_title || payload.candidate_current_title || null,
          current_pageant: payload.candidate_current_pageant || null,
          current_title: payload.candidate_current_title || null,
          primary_goal: payload.candidate_goal,
          country_code: payload.country_code,
          country_name: countryName(payload.country_code),
          city: payload.city,
          region: payload.region || null,
        }),
      }, token);
      const historyRows = [];
      if (payload.candidate_current_pageant) historyRows.push({
        user_id: user.id, pageant_name: payload.candidate_current_pageant,
        title_or_placement: payload.candidate_current_title || null, participation_type: "current",
      });
      previousPageants(payload.candidate_previous_pageants).forEach((line) => historyRows.push({
        user_id: user.id, pageant_name: line, participation_type: "previous",
      }));
      if (historyRows.length) await request("/rest/v1/candidate_pageant_history", {
        method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify(historyRows),
      }, token);
      return;
    }

    if (payload.account_type === "supplier") {
      const additional = (payload.supplier_additional_categories || []).filter((category) => category !== payload.supplier_primary_category);
      await request("/rest/v1/professional_profile_drafts?on_conflict=user_id", {
        method: "POST", headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
        body: JSON.stringify({
          user_id: user.id,
          business_name: payload.supplier_business_name,
          category: payload.supplier_primary_category,
          primary_category: payload.supplier_primary_category,
          additional_categories: additional,
          category_other: payload.supplier_category_other || null,
          country_code: payload.country_code,
          country_name: countryName(payload.country_code),
          city: payload.city,
          region: payload.region || null,
          location: [payload.city, payload.region, countryName(payload.country_code)].filter(Boolean).join(", "),
          public_email: payload.email,
        }),
      }, token);
      return;
    }

    await request("/rest/v1/media_profile_drafts?on_conflict=user_id", {
      method: "POST", headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
      body: JSON.stringify({
        user_id: user.id,
        column_name: payload.media_column_name,
        role: payload.media_role,
        media_type: payload.media_type,
        official_url: payload.media_official_url || null,
        bio: payload.media_bio,
        country_code: payload.country_code,
        country_name: countryName(payload.country_code),
        city: payload.city,
        region: payload.region || null,
      }),
    }, token);
  }

  async function handleAudienceSignup(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "signup-form") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    enhanceSignup();
    const firstInvalid = [...form.elements].find((field) => !field.disabled && typeof field.checkValidity === "function" && !field.checkValidity());
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.reportValidity?.();
      window.showToast?.("Please complete the required information.", "error");
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    if (data.password !== data.confirm) return window.showToast?.("Passwords do not match.", "error");
    const payload = {
      ...data,
      supplier_additional_categories: checkedValues(form, "supplier_additional_categories"),
      enthusiast_interests: checkedValues(form, "enthusiast_interests"),
    };
    const button = form.querySelector('button[type="submit"]');
    const status = document.getElementById("signup-message");
    button.disabled = true;
    if (status) status.textContent = "Creating your secure Pageant Index account…";
    try {
      const response = await request("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          data: {
            full_name: payload.name,
            account_type: payload.account_type,
            country_code: payload.country_code,
            country_name: countryName(payload.country_code),
            city: payload.city,
            region: payload.region || null,
            business_name: payload.supplier_business_name || null,
            column_name: payload.media_column_name || null,
          },
        }),
      });
      if (response?.access_token && response?.user) {
        saveSession(response, false);
        await createRoleRecords(response.user, payload, response.access_token);
      }
      const confirmed = Boolean(response?.access_token);
      const message = confirmed ? "Account created." : "Check your email to confirm your account.";
      if (status) status.textContent = message;
      window.showToast?.(message);
      const destination = payload.account_type === "enthusiast" ? "https://app.pageantindex.com/" : "/dashboard/";
      setTimeout(() => { location.href = confirmed ? destination : "/sign-in/"; }, 700);
    } catch (error) {
      if (status) status.textContent = error.message;
      window.showToast?.(error.message, "error");
      button.disabled = false;
    }
  }

  function announcementCards(items) {
    return items.length ? items.map((item) => `<article class="pi-content-card"><span>${escapeHtml(item.category || "Announcement")}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary || "")}</p>${item.target_url ? `<a href="${escapeHtml(safeUrl(item.target_url))}">Read announcement</a>` : ""}</article>`).join("") : '<div class="pi-empty">No approved announcements are published yet.</div>';
  }

  function adCards(items) {
    return items.length ? items.map((item) => `<article class="pi-ad-card"><span>${escapeHtml(item.label || "Featured")}</span>${item.image_url ? `<img src="${escapeHtml(safeUrl(item.image_url, "/public/images/pageant-icon.png"))}" alt="" loading="lazy">` : ""}<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary || "")}</p>${item.target_url ? `<a href="${escapeHtml(safeUrl(item.target_url))}" rel="sponsored">View featured offer</a>` : ""}</article>`).join("") : '<div class="pi-empty">No featured campaigns are active right now.</div>';
  }

  function articleCards(items) {
    return items.length ? items.map((item) => {
      const href = item.canonical_url || `/media/?article=${encodeURIComponent(item.slug)}`;
      return `<article class="pi-media-card"><div>${item.cover_url ? `<img src="${escapeHtml(safeUrl(item.cover_url, "/public/images/pageant-icon.png"))}" alt="" loading="lazy">` : ""}</div><span>${escapeHtml(item.column_name || "Pageant Index Media")}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.excerpt || "")}</p><div class="pi-card-actions"><a href="${escapeHtml(safeUrl(href, href))}">Read article</a><button type="button" data-share-article="${escapeHtml(href)}" data-share-title="${escapeHtml(item.title)}">Share</button></div></article>`;
    }).join("") : '<div class="pi-empty">No reviewed media articles are published yet.</div>';
  }

  function routePageMarkup(pathname) {
    if (pathname === "/candidates/") return `<main class="pi-audience-page"><section class="pi-audience-hero"><div class="container"><span>Candidate network</span><h1>Build a pageant journey around real opportunities.</h1><p>Candidates can find suppliers, track the current pageant they joined, and keep a private record of previous pageants, titles, and placements.</p><div class="pi-hero-actions"><a class="btn btn-primary" href="/sign-up/">Create Candidate Account</a><a class="btn btn-secondary" href="/directory/">Find Suppliers</a></div></div></section><section class="section"><div class="container pi-feature-layout"><article><h2>Private candidate record</h2><p>Your candidate workspace separates private history from anything you choose to publish. Add current and previous pageants, dates, titles, placements, official links, and notes.</p></article><article><h2>Supplier discovery</h2><p>Search coaches, HMUAs, designers, photographers, videographers, hotels, flights, and other reviewed providers by category and country.</p></article><article><h2>Pageant planning</h2><p>Use announcements, the reviewed calendar, saved suppliers, travel providers, and media coverage without relying on invented event information.</p></article></div></section><section class="section pi-shared-band"><div class="container"><h2>Everyone sees the same trusted foundation.</h2><div class="pi-common-grid">${config.sharedExperience.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div></section></main>`;
    if (pathname === "/media/") return `<main class="pi-audience-page"><section class="pi-audience-hero"><div class="container"><span>Media network</span><h1>Independent columns and shareable pageant stories.</h1><p>Approved media accounts receive their own column, article workspace, publishing review, canonical links, and built-in sharing to other platforms.</p><div class="pi-hero-actions"><a class="btn btn-primary" href="/sign-up/">Create Media Account</a><a class="btn btn-secondary" href="/advertise/">Media Partnership</a></div></div></section><section class="section"><div class="container"><div class="section-head"><div><h2 class="section-title">Latest media articles</h2><p class="section-copy">Every published article has a named column, author attribution, review state, and shareable link.</p></div></div><div class="pi-media-grid" data-pi-media-grid>${articleCards(publicContent.articles)}</div></div></section></main>`;
    if (pathname === "/announcements/") return `<main class="pi-audience-page"><section class="pi-audience-hero"><div class="container"><span>Official updates</span><h1>Announcements without the noise.</h1><p>Reviewed platform notices, pageant updates, deadlines, launches, media calls, supplier opportunities, and featured campaigns in one place.</p></div></section><section class="section"><div class="container"><div class="pi-announcement-grid">${announcementCards(publicContent.announcements)}</div><div class="section-head pi-subhead"><div><h2 class="section-title small">Featured advertisements</h2><p class="section-copy">Commercial placements are always clearly labeled and remain separate from verification and organic ranking.</p></div></div><div class="pi-ad-grid">${adCards(publicContent.ads)}</div></div></section></main>`;
    if (pathname === "/experiences/") return `<main class="pi-audience-page"><section class="pi-audience-hero"><div class="container"><span>Public experiences</span><h1>Vote, watch, and shop without unnecessary account barriers.</h1><p>${escapeHtml(config.guestAccessDisclosure)}</p></div></section><section class="section"><div class="container pi-experience-grid"><article><strong>Voting</strong><h2>Public voting</h2><p>Organizer-approved voting pages can support guest participation, verified payments, clear rules, and audit records.</p><span>Available when an official voting event is published</span></article><article><strong>Watch</strong><h2>Pay-per-view and livestream</h2><p>Viewers may purchase access as guests. Email receipts and secure access links can replace forced membership.</p><span>Available when an official broadcast is published</span></article><article><strong>Shop</strong><h2>Merchandise</h2><p>Guest checkout remains available. Creating an enthusiast account is optional for saved addresses, order history, and app personalization.</p><span>Store inventory will appear only when verified</span></article><article><strong>Tickets</strong><h2>Official event access</h2><p>Event tickets and passes may be sold through approved organizers or payment partners with transparent terms.</p><span>No invented inventory or unofficial ticket claims</span></article></div></section></main>`;
    return "";
  }

  async function renderAudienceRoute() {
    if (!rolePages.has(location.pathname)) return;
    await loadPublicContent();
    const main = document.querySelector("main");
    if (!main || main.dataset.piAudienceRoute === "true") return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = routePageMarkup(location.pathname);
    const replacement = wrapper.firstElementChild;
    replacement.dataset.piAudienceRoute = "true";
    main.replaceWith(replacement);
    const titles = {
      "/candidates/": "Candidates | Pageant Index",
      "/media/": "Media | Pageant Index",
      "/announcements/": "Announcements | Pageant Index",
      "/experiences/": "Voting, Pay-Per-View and Merch | Pageant Index",
    };
    document.title = titles[location.pathname] || document.title;
    bindShareButtons();
  }

  async function injectCommonExperience() {
    if (location.pathname !== "/") return;
    await loadPublicContent();
    const footer = document.querySelector(".site-footer");
    if (!footer || document.querySelector("[data-pi-common-experience]")) return;
    footer.insertAdjacentHTML("beforebegin", `<section class="section pi-common-experience" data-pi-common-experience><div class="container"><div class="section-head"><div><h2 class="section-title">One ecosystem, shared by every audience.</h2><p class="section-copy">Enthusiasts, candidates, suppliers, and media all discover the same reviewed suppliers, announcements, pageants, articles, and clearly labeled featured campaigns.</p></div><a class="btn btn-secondary" href="/announcements/">View announcements</a></div><div class="pi-common-columns"><div><h3>Latest announcements</h3><div class="pi-announcement-grid compact">${announcementCards(publicContent.announcements.slice(0, 3))}</div></div><div><h3>Featured</h3><div class="pi-ad-grid compact">${adCards(publicContent.ads.slice(0, 2))}</div></div></div></div></section>`);
  }

  function bindShareButtons() {
    document.querySelectorAll("[data-share-article]").forEach((button) => {
      if (button.dataset.piShareBound) return;
      button.dataset.piShareBound = "true";
      button.addEventListener("click", async () => {
        const url = new URL(button.dataset.shareArticle, location.origin).href;
        const title = button.dataset.shareTitle || "Pageant Index Media";
        try {
          if (navigator.share) await navigator.share({title, url});
          else {
            await navigator.clipboard.writeText(url);
            window.showToast?.("Article link copied.");
          }
        } catch (error) {
          if (error.name !== "AbortError") window.showToast?.("Copy the article URL to share.", "error");
        }
      });
    });
  }

  async function currentProfile() {
    const session = readSession();
    if (!session?.access_token || !session?.user?.id) return null;
    try {
      const rows = await request(`/rest/v1/user_profiles?select=*&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`);
      return rows?.[0] || null;
    } catch {
      return null;
    }
  }

  function roleQuickLinks(role) {
    const common = [
      ["Find Suppliers", "/directory/"], ["Announcements", "/announcements/"],
      ["Featured", "/announcements/#featured"], ["Pageants", "/pageant-calendar/"],
    ];
    const roleLinks = {
      enthusiast: [["Open App", "https://app.pageantindex.com/"], ["Public Experiences", "/experiences/"]],
      candidate: [["Candidate Profile", "#candidate-profile"], ["Pageant History", "#pageant-history"]],
      supplier: [["Supplier Profile", "#supplier-profile"], ["Inquiries", "#inquiries"]],
      media: [["Media Column", "#media-profile"], ["Articles", "#media-articles"]],
    };
    return [...(roleLinks[role] || []), ...common].map(([label, href]) => `<a href="${href}">${escapeHtml(label)}</a>`).join("");
  }

  function candidateWorkspace(profile) {
    return `<main class="pi-role-workspace" data-pi-role-workspace><aside><div class="pi-workspace-brand">Pageant Index<small>Candidate Workspace</small></div><nav>${roleQuickLinks("candidate")}</nav></aside><section><header><div><h1>Your candidate journey</h1><p>Keep current and previous pageants organized while finding reviewed suppliers and opportunities.</p></div><a class="btn btn-secondary" href="/directory/">Find suppliers</a></header><form id="pi-candidate-workspace-form" class="pi-workspace-form"><section id="candidate-profile"><h2>Candidate profile</h2><div class="pi-form-grid"><label>Display name<input name="display_name" required value="${escapeHtml(profile.display_name || "")}"></label><label>Candidate status<select name="candidate_status">${optionList(config.candidateStatuses)}</select></label><label>Current pageant<input name="current_pageant" maxlength="180"></label><label>Current title or representation<input name="current_title" maxlength="180"></label><label class="full">Public bio<textarea name="public_bio" maxlength="3000"></textarea></label></div><button class="btn btn-primary" type="submit">Save candidate profile</button></section></form><section id="pageant-history" class="pi-workspace-section"><h2>Current and previous pageants</h2><div id="pi-pageant-history-list" class="pi-history-list"><div class="pi-empty">Loading your private pageant history…</div></div><form id="pi-pageant-history-form" class="pi-inline-form"><input name="pageant_name" required placeholder="Pageant name"><input name="year_joined" type="number" min="1900" max="2100" placeholder="Year"><input name="title_or_placement" placeholder="Title or placement"><select name="participation_type"><option value="current">Current</option><option value="previous">Previous</option></select><button class="btn btn-secondary">Add record</button></form></section></section></main>`;
  }

  function mediaWorkspace(profile) {
    return `<main class="pi-role-workspace" data-pi-role-workspace><aside><div class="pi-workspace-brand">Pageant Index<small>Media Workspace</small></div><nav>${roleQuickLinks("media")}</nav></aside><section><header><div><h1>Your media column</h1><p>Create accurate, attributable stories that can be reviewed, published, and shared.</p></div><a class="btn btn-secondary" href="/media/">View media hub</a></header><form id="pi-media-profile-form" class="pi-workspace-form"><section id="media-profile"><h2>Column profile</h2><div class="pi-form-grid"><label>Column or outlet name<input name="column_name" required value="${escapeHtml(profile.display_name || "")}"></label><label>Role<select name="role">${optionList(config.mediaRoles)}</select></label><label>Media type<select name="media_type">${optionList(config.mediaTypes)}</select></label><label>Official link<input name="official_url" type="url"></label><label class="full">About the column<textarea name="bio" required maxlength="2500"></textarea></label></div><button class="btn btn-primary">Save media profile</button></section></form><section id="media-articles" class="pi-workspace-section"><h2>Article drafts</h2><div id="pi-media-draft-list" class="pi-history-list"><div class="pi-empty">Loading drafts…</div></div><form id="pi-media-article-form" class="pi-workspace-form"><div class="pi-form-grid"><label class="full">Article title<input name="title" required maxlength="220"></label><label class="full">Excerpt<textarea name="excerpt" required maxlength="500"></textarea></label><label class="full">Article body<textarea name="body" required minlength="100"></textarea></label><label>Cover image URL<input name="cover_url" type="url"></label><label>Canonical URL<input name="canonical_url" type="url"></label></div><button class="btn btn-primary">Save draft</button></form></section></section></main>`;
  }

  function enthusiastWorkspace(profile) {
    return `<main class="pi-role-workspace" data-pi-role-workspace><aside><div class="pi-workspace-brand">Pageant Index<small>Enthusiast Workspace</small></div><nav>${roleQuickLinks("enthusiast")}</nav></aside><section><header><div><h1>Your pageant interests</h1><p>Use your account for app personalization, saved suppliers, and optional history. Public browsing and guest checkout remain open.</p></div><a class="btn btn-primary" href="https://app.pageantindex.com/">Open app</a></header><section class="pi-workspace-section"><h2>What your account adds</h2><div class="pi-feature-layout"><article><h3>Private saved suppliers</h3><p>Keep a shortlist across devices after signing in.</p></article><article><h3>Personalized updates</h3><p>Choose the pageants, media, and supplier categories you want to follow.</p></article><article><h3>Optional purchase history</h3><p>Guest checkout remains available. Signed-in purchases may be linked only when you choose.</p></article></div><div class="pi-role-note"><strong>No forced membership</strong><span>${escapeHtml(config.guestAccessDisclosure)}</span></div></section></section></main>`;
  }

  async function replaceRoleWorkspace() {
    if (location.pathname !== "/dashboard/") return;
    const shell = document.querySelector(".product-shell");
    if (!shell || shell.dataset.piRoleChecked === "true") return;
    shell.dataset.piRoleChecked = "true";
    const profile = await currentProfile();
    const role = profile?.account_type || readSession()?.user?.user_metadata?.account_type;
    if (!role || role === "supplier") return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = role === "candidate" ? candidateWorkspace(profile || {}) : role === "media" ? mediaWorkspace(profile || {}) : enthusiastWorkspace(profile || {});
    shell.replaceWith(wrapper.firstElementChild);
    bindRoleWorkspace(role, profile || {});
  }

  async function bindRoleWorkspace(role, profile) {
    const session = readSession();
    if (!session?.user?.id) return;
    const userId = session.user.id;
    if (role === "candidate") {
      const form = document.getElementById("pi-candidate-workspace-form");
      try {
        const rows = await request(`/rest/v1/candidate_profile_drafts?select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
        const draft = rows?.[0];
        if (draft) {
          form.elements.display_name.value = draft.display_name || profile.display_name || "";
          form.elements.candidate_status.value = draft.candidate_status || "";
          form.elements.current_pageant.value = draft.current_pageant || "";
          form.elements.current_title.value = draft.current_title || "";
          form.elements.public_bio.value = draft.public_bio || "";
        }
      } catch {}
      form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        try {
          await request("/rest/v1/candidate_profile_drafts?on_conflict=user_id", {method: "POST", headers: {Prefer: "resolution=merge-duplicates,return=minimal"}, body: JSON.stringify({user_id: userId, ...data})});
          window.showToast?.("Candidate profile saved.");
        } catch (error) { window.showToast?.(error.message, "error"); }
      });
      const renderHistory = async () => {
        const list = document.getElementById("pi-pageant-history-list");
        try {
          const rows = await request(`/rest/v1/candidate_pageant_history?select=id,pageant_name,year_joined,title_or_placement,participation_type&user_id=eq.${encodeURIComponent(userId)}&order=participation_type.asc,year_joined.desc`);
          list.innerHTML = rows?.length ? rows.map((row) => `<article><strong>${escapeHtml(row.pageant_name)}</strong><span>${escapeHtml([row.year_joined, row.title_or_placement, row.participation_type].filter(Boolean).join(" · "))}</span></article>`).join("") : '<div class="pi-empty">No pageant records added yet.</div>';
        } catch (error) { list.innerHTML = `<div class="pi-empty">${escapeHtml(error.message)}</div>`; }
      };
      document.getElementById("pi-pageant-history-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        try {
          await request("/rest/v1/candidate_pageant_history", {method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify({user_id: userId, ...data, year_joined: data.year_joined ? Number(data.year_joined) : null})});
          event.currentTarget.reset();
          await renderHistory();
          window.showToast?.("Pageant record added.");
        } catch (error) { window.showToast?.(error.message, "error"); }
      });
      renderHistory();
    }

    if (role === "media") {
      const profileForm = document.getElementById("pi-media-profile-form");
      try {
        const rows = await request(`/rest/v1/media_profile_drafts?select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
        const draft = rows?.[0];
        if (draft) Object.entries(draft).forEach(([key, value]) => { if (profileForm.elements[key] && value != null) profileForm.elements[key].value = value; });
      } catch {}
      profileForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(profileForm));
        try {
          await request("/rest/v1/media_profile_drafts?on_conflict=user_id", {method: "POST", headers: {Prefer: "resolution=merge-duplicates,return=minimal"}, body: JSON.stringify({user_id: userId, ...data})});
          window.showToast?.("Media profile saved.");
        } catch (error) { window.showToast?.(error.message, "error"); }
      });
      const renderDrafts = async () => {
        const list = document.getElementById("pi-media-draft-list");
        try {
          const rows = await request(`/rest/v1/media_articles?select=id,title,submission_state,review_state,updated_at&author_user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`);
          list.innerHTML = rows?.length ? rows.map((row) => `<article><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(`${row.submission_state} · ${row.review_state}`)}</span></article>`).join("") : '<div class="pi-empty">No article drafts yet.</div>';
        } catch (error) { list.innerHTML = `<div class="pi-empty">${escapeHtml(error.message)}</div>`; }
      };
      document.getElementById("pi-media-article-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget));
        const slug = data.title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 160);
        try {
          await request("/rest/v1/media_articles", {method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify({author_user_id: userId, slug: `${slug}-${Date.now().toString(36)}`, ...data, submission_state: "draft"})});
          event.currentTarget.reset();
          await renderDrafts();
          window.showToast?.("Article draft saved.");
        } catch (error) { window.showToast?.(error.message, "error"); }
      });
      renderDrafts();
    }
  }

  function observe() {
    let queued = false;
    const run = () => {
      queued = false;
      replaceNavigation();
      enhanceSignup();
      renderAudienceRoute();
      injectCommonExperience();
      replaceRoleWorkspace();
      bindShareButtons();
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(run);
    };
    new MutationObserver(queue).observe(document.documentElement, {childList: true, subtree: true});
    queue();
  }

  document.addEventListener("submit", handleAudienceSignup, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, {once: true});
  else observe();
})();
