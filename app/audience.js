"use strict";

(() => {
  const config = window.PageantIndexConfig;
  const root = document.getElementById("app");
  if (!config || !root) return;

  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  const WEB_URL = "https://www.pageantindex.com";
  let statePromise = null;
  let appState = {role: "guest", user: null, announcements: [], ads: [], articles: [], history: []};

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);

  const safeUrl = (value, fallback = "#") => {
    try {
      const url = new URL(String(value || ""), WEB_URL);
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

  async function request(pathname, options = {}) {
    const session = readSession();
    const headers = {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {...options, headers});
    const text = response.status === 204 ? "" : await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = {message: text}; }
    }
    if (!response.ok) throw new Error(payload?.message || payload?.error_description || payload?.hint || `Request failed (${response.status})`);
    return payload;
  }

  async function loadState() {
    if (statePromise) return statePromise;
    statePromise = (async () => {
      const session = readSession();
      let user = session?.user || null;
      if (session?.access_token && !user) {
        try { user = await request("/auth/v1/user"); } catch {}
      }
      let role = user?.user_metadata?.account_type || "guest";
      if (user?.id) {
        try {
          const profiles = await request(`/rest/v1/user_profiles?select=account_type,display_name&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
          if (profiles?.[0]?.account_type) role = profiles[0].account_type;
        } catch {}
      }
      const results = await Promise.allSettled([
        request("/rest/v1/announcements?select=id,title,summary,category,target_url,published_at&status=eq.published&order=is_pinned.desc,published_at.desc&limit=8"),
        request("/rest/v1/featured_ads?select=id,label,title,summary,image_url,target_url,placement&status=eq.published&order=priority.desc,created_at.desc&limit=8"),
        request("/rest/v1/media_articles?select=id,slug,title,excerpt,cover_url,column_name,author_name,published_at,canonical_url&review_state=eq.approved&published_at=not.is.null&order=published_at.desc&limit=10"),
        role === "candidate" && user?.id
          ? request(`/rest/v1/candidate_pageant_history?select=id,pageant_name,year_joined,title_or_placement,participation_type&user_id=eq.${encodeURIComponent(user.id)}&order=participation_type.asc,year_joined.desc`)
          : Promise.resolve([]),
      ]);
      appState = {
        role,
        user,
        announcements: results[0].status === "fulfilled" ? results[0].value || [] : [],
        ads: results[1].status === "fulfilled" ? results[1].value || [] : [],
        articles: results[2].status === "fulfilled" ? results[2].value || [] : [],
        history: results[3].status === "fulfilled" ? results[3].value || [] : [],
      };
      return appState;
    })();
    return statePromise;
  }

  function announcementMarkup() {
    if (!appState.announcements.length) return '<div class="empty">No approved announcements are published yet.</div>';
    return appState.announcements.map((item) => `<article class="audience-feed-card"><span>${escapeHtml(item.category || "Announcement")}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary || "")}</p>${item.target_url ? `<a href="${escapeHtml(safeUrl(item.target_url))}">Open update</a>` : ""}</article>`).join("");
  }

  function adMarkup() {
    if (!appState.ads.length) return '<div class="empty">No featured campaigns are active.</div>';
    return appState.ads.map((item) => `<article class="audience-ad-card"><span>${escapeHtml(item.label || "Featured")}</span>${item.image_url ? `<img src="${escapeHtml(safeUrl(item.image_url, "/public/images/pageant-icon.png"))}" alt="" loading="lazy">` : ""}<h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.summary || "")}</p>${item.target_url ? `<a href="${escapeHtml(safeUrl(item.target_url))}" rel="sponsored">View featured offer</a>` : ""}</article>`).join("");
  }

  function articleMarkup() {
    if (!appState.articles.length) return '<div class="empty">No reviewed media articles are published yet.</div>';
    return appState.articles.map((item) => {
      const href = item.canonical_url || `${WEB_URL}/media/?article=${encodeURIComponent(item.slug)}`;
      return `<article class="audience-media-card">${item.cover_url ? `<img src="${escapeHtml(safeUrl(item.cover_url, "/public/images/pageant-icon.png"))}" alt="" loading="lazy">` : ""}<span>${escapeHtml(item.column_name || "Pageant Index Media")}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.excerpt || "")}</p><div><a href="${escapeHtml(safeUrl(href, href))}">Read</a><button type="button" data-app-share="${escapeHtml(href)}" data-app-share-title="${escapeHtml(item.title)}">Share</button></div></article>`;
    }).join("");
  }

  function historyMarkup() {
    if (appState.role !== "candidate") return `<div class="panel"><h2>Official pageant calendar</h2><p>Browse reviewed dates and official sources. Always confirm application, venue, ticket, and travel details with the organizer.</p><a class="primary" href="${WEB_URL}/pageant-calendar/">Open calendar</a></div>`;
    if (!appState.user) return `<div class="panel"><h2>Your pageant journey</h2><p>Sign in to keep a private record of current and previous pageants.</p><a class="primary" href="${WEB_URL}/sign-in/">Sign in</a></div>`;
    const current = appState.history.filter((item) => item.participation_type === "current");
    const previous = appState.history.filter((item) => item.participation_type === "previous");
    const rows = (items, empty) => items.length ? items.map((item) => `<article class="audience-history-row"><strong>${escapeHtml(item.pageant_name)}</strong><span>${escapeHtml([item.year_joined, item.title_or_placement].filter(Boolean).join(" · ") || "Details not added")}</span></article>`).join("") : `<div class="empty">${empty}</div>`;
    return `<div class="section"><div class="section-heading"><h2>Current pageant</h2><a href="${WEB_URL}/dashboard/#pageant-history">Manage</a></div><div class="audience-history-list">${rows(current, "No current pageant added.")}</div></div><div class="section"><div class="section-heading"><h2>Previous pageants</h2><span>${previous.length} recorded</span></div><div class="audience-history-list">${rows(previous, "No previous pageants added.")}</div></div><div class="panel section"><h2>Find your team</h2><p>Search coaches, HMUAs, designers, photographers, videographers, hotels, flights, and other reviewed suppliers.</p><a class="primary" href="#" data-audience-nav="discover">Find suppliers</a></div>`;
  }

  function roleAccountMarkup() {
    const role = appState.role;
    const roleLabel = role === "guest" ? "Guest" : role[0].toUpperCase() + role.slice(1);
    const roleTools = {
      guest: [["Create an account", `${WEB_URL}/sign-up/`], ["Browse as guest", `${WEB_URL}/experiences/`]],
      enthusiast: [["Personalize the app", `${WEB_URL}/dashboard/`], ["Saved suppliers", "#saved"], ["Voting, watch and shop", `${WEB_URL}/experiences/`]],
      candidate: [["Candidate profile", `${WEB_URL}/dashboard/#candidate-profile`], ["Pageant history", `${WEB_URL}/dashboard/#pageant-history`], ["Saved suppliers", "#saved"]],
      supplier: [["Supplier profile", `${WEB_URL}/dashboard/`], ["Private inquiries", `${WEB_URL}/dashboard/#inquiries`], ["Advertising", `${WEB_URL}/advertise/`]],
      media: [["Media column", `${WEB_URL}/dashboard/#media-profile`], ["Article drafts", `${WEB_URL}/dashboard/#media-articles`], ["Public media hub", `${WEB_URL}/media/`]],
    };
    const common = [["Supplier directory", "discover"], ["Announcements", "updates"], ["Media", "media"], ["Pageants", "pageants"]];
    return `<div class="audience-account-card"><span>Account type</span><h2>${escapeHtml(roleLabel)}</h2><p>${escapeHtml(config.audienceDescriptions[role] || "Browse Pageant Index without signing in.")}</p></div><div class="section"><div class="section-heading"><h2>Your tools</h2></div><div class="audience-link-list">${(roleTools[role] || roleTools.guest).map(([label, href]) => `<a href="${href}">${escapeHtml(label)}<b>›</b></a>`).join("")}</div></div><div class="section"><div class="section-heading"><h2>Shared across Pageant Index</h2></div><div class="audience-link-list">${common.map(([label, screen]) => `<button type="button" data-audience-nav="${screen}">${escapeHtml(label)}<b>›</b></button>`).join("")}</div></div><div class="travel-note">${escapeHtml(config.guestAccessDisclosure)}</div>`;
  }

  function mediaScreen() {
    return `<section class="screen" data-screen="media"><div class="hero"><h1>Media and columns.</h1><p>Read reviewed articles from approved media accounts and share stories to other platforms.</p></div><div class="audience-media-list">${articleMarkup()}</div><div class="panel section"><h2>Media contributors</h2><p>Approved media accounts receive a dedicated column and a private article workspace.</p><a class="primary" href="${WEB_URL}/sign-up/">Join as media</a></div></section>`;
  }

  function updatesScreen() {
    return `<section class="screen" data-screen="updates"><div class="hero"><h1>Announcements and featured updates.</h1><p>Official platform notices and clearly labeled commercial placements, kept separate from verification and rankings.</p></div><div class="section"><div class="section-heading"><h2>Announcements</h2><a href="${WEB_URL}/announcements/">View all</a></div><div class="audience-feed-list">${announcementMarkup()}</div></div><div class="section"><div class="section-heading"><h2>Featured</h2><span>Advertising</span></div><div class="audience-ad-list">${adMarkup()}</div></div></section>`;
  }

  function updateNavigation(shell) {
    const desktop = shell.querySelector(".desktop-sidebar nav");
    const bottom = shell.querySelector(".bottom-nav");
    const buttons = config.appMenu.map(({id, icon, label}) => `<button type="button" data-audience-nav="${id}"><b>${escapeHtml(icon)}</b>${escapeHtml(label)}</button>`).join("");
    if (desktop) desktop.innerHTML = config.appMenu.map(({id, label}) => `<button type="button" data-audience-nav="${id}">${escapeHtml(label)}</button>`).join("");
    if (bottom) bottom.innerHTML = buttons;
  }

  function ensureScreens(shell) {
    const main = shell.querySelector("main");
    if (!main) return;
    main.querySelector('[data-screen="media"]')?.remove();
    main.querySelector('[data-screen="updates"]')?.remove();
    main.insertAdjacentHTML("beforeend", mediaScreen() + updatesScreen());

    const pageants = main.querySelector('[data-screen="pageants"]');
    if (pageants) pageants.innerHTML = `<div class="hero"><h1>Pageants.</h1><p>Review official pageant information and keep your own history when signed in as a candidate.</p></div>${historyMarkup()}`;

    const account = main.querySelector('[data-screen="account"]');
    if (account) {
      const originalActions = account.querySelector(".travel-actions")?.outerHTML || "";
      account.innerHTML = `<div class="hero"><h1>Account.</h1><p>Role-specific tools without changing the shared public experience.</p></div>${roleAccountMarkup()}${originalActions}`;
    }

    const discover = main.querySelector('[data-screen="discover"]');
    if (discover && !discover.querySelector("[data-audience-common-strip]")) {
      discover.insertAdjacentHTML("beforeend", `<div class="section audience-common-strip" data-audience-common-strip><div class="section-heading"><h2>Across the network</h2><span>For everyone</span></div><div class="audience-common-grid"><button type="button" data-audience-nav="updates">Announcements</button><button type="button" data-audience-nav="media">Media</button><button type="button" data-audience-nav="pageants">Pageants</button><a href="${WEB_URL}/experiences/">Vote, Watch, Shop</a></div></div>`);
    }
  }

  function showScreen(shell, id) {
    shell.querySelectorAll("[data-screen]").forEach((screen) => screen.classList.toggle("active", screen.dataset.screen === id));
    shell.querySelectorAll("[data-audience-nav]").forEach((button) => button.classList.toggle("active", button.dataset.audienceNav === id));
    window.scrollTo({top: 0, behavior: "smooth"});
  }

  function bind(shell) {
    shell.querySelectorAll("[data-audience-nav]").forEach((button) => {
      if (button.dataset.audienceBound) return;
      button.dataset.audienceBound = "true";
      button.addEventListener("click", (event) => {
        const id = button.dataset.audienceNav;
        if (!id) return;
        event.preventDefault();
        showScreen(shell, id);
      });
    });
    shell.querySelectorAll("[data-app-share]").forEach((button) => {
      if (button.dataset.audienceBound) return;
      button.dataset.audienceBound = "true";
      button.addEventListener("click", async () => {
        const url = new URL(button.dataset.appShare, WEB_URL).href;
        const title = button.dataset.appShareTitle || "Pageant Index Media";
        try {
          if (navigator.share) await navigator.share({title, url});
          else {
            await navigator.clipboard.writeText(url);
            alert("Article link copied.");
          }
        } catch (error) {
          if (error.name !== "AbortError") alert("Copy the article link to share.");
        }
      });
    });
  }

  async function enhance() {
    const shell = root.querySelector(".app-shell");
    if (!shell || shell.dataset.audienceReady === "true") return;
    shell.dataset.audienceReady = "true";
    await loadState();
    updateNavigation(shell);
    ensureScreens(shell);
    bind(shell);
    showScreen(shell, "discover");
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(async () => {
      queued = false;
      await enhance();
    });
  };
  new MutationObserver(queue).observe(root, {childList: true, subtree: true});
  queue();
})();
