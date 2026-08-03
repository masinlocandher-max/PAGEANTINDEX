"use strict";

(() => {
  if (location.pathname !== "/admin/") return;

  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  let loading = false;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);

  function session() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (value?.access_token) return value;
      } catch {}
    }
    return null;
  }

  function isAdmin() {
    return session()?.user?.app_metadata?.role === "admin";
  }

  async function request(pathname, options = {}) {
    const active = session();
    const headers = {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    };
    if (active?.access_token) headers.Authorization = `Bearer ${active.access_token}`;
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {...options, headers});
    const text = response.status === 204 ? "" : await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = {message: text}; }
    }
    if (!response.ok) throw new Error(payload?.message || payload?.hint || `Request failed (${response.status})`);
    return payload;
  }

  const stateLabel = (value) => `<span class="pi-admin-state ${escapeHtml(value || "pending")}">${escapeHtml((value || "pending").replaceAll("_", " "))}</span>`;

  function reviewButtons(kind, id, publish = false) {
    return `<div class="pi-admin-actions">
      <button type="button" data-review-kind="${kind}" data-review-id="${id}" data-review-state="approved" ${publish ? 'data-publish="true"' : ""}>${publish ? "Approve and publish" : "Approve"}</button>
      <button type="button" data-review-kind="${kind}" data-review-id="${id}" data-review-state="changes_requested">Request changes</button>
      <button type="button" data-review-kind="${kind}" data-review-id="${id}" data-review-state="rejected">Reject</button>
    </div>`;
  }

  function cards(rows, renderer, empty) {
    return rows?.length ? rows.map(renderer).join("") : `<div class="pi-admin-empty">${escapeHtml(empty)}</div>`;
  }

  async function loadQueues() {
    const requests = [
      ["mediaProfiles", "/rest/v1/media_profile_drafts?select=user_id,column_name,role,media_type,country_name,city,submission_state,review_state,updated_at&submission_state=eq.submitted&review_state=in.(pending,in_review,changes_requested)&order=updated_at.asc&limit=100"],
      ["mediaArticles", "/rest/v1/media_articles?select=id,title,column_name,author_name,submission_state,review_state,updated_at&submission_state=eq.submitted&review_state=in.(pending,in_review,changes_requested)&order=updated_at.asc&limit=100"],
      ["organizations", "/rest/v1/pageant_organization_drafts?select=user_id,organization_name,organization_type,country_name,city,submission_state,review_state,updated_at&submission_state=eq.submitted&review_state=in.(pending,in_review,changes_requested)&order=updated_at.asc&limit=100"],
      ["editions", "/rest/v1/pageant_edition_drafts?select=id,pageant_name,edition_name,edition_year,country_name,city,event_start_at,submission_state,review_state,updated_at&submission_state=eq.submitted&review_state=in.(pending,in_review,changes_requested)&order=updated_at.asc&limit=100"],
      ["announcements", "/rest/v1/organizer_announcement_requests?select=id,title,summary,target_url,submission_state,review_state,updated_at&submission_state=eq.submitted&review_state=in.(pending,in_review,changes_requested)&order=updated_at.asc&limit=100"],
      ["experiences", "/rest/v1/pageant_experience_requests?select=id,title,experience_type,guest_access_requested,provider_name,starts_at,submission_state,review_state,updated_at&submission_state=eq.submitted&review_state=in.(pending,in_review,changes_requested)&order=updated_at.asc&limit=100"],
      ["publishedAnnouncements", "/rest/v1/announcements?select=id,title,category,status,published_at&order=created_at.desc&limit=25"],
      ["featuredAds", "/rest/v1/featured_ads?select=id,label,title,placement,status,starts_at,ends_at&order=created_at.desc&limit=25"],
    ];
    const results = await Promise.allSettled(requests.map(([, path]) => request(path)));
    return Object.fromEntries(requests.map(([key], index) => [key, results[index].status === "fulfilled" ? results[index].value || [] : []]));
  }

  function moderationMarkup(data) {
    const total = data.mediaProfiles.length + data.mediaArticles.length + data.organizations.length + data.editions.length + data.announcements.length + data.experiences.length;
    return `<section class="pi-admin-moderation" data-pi-admin-moderation>
      <header><div><span>Multi-audience control center</span><h2>Audience and content moderation</h2><p>Review official profiles and content without mixing paid visibility with verification, editorial approval, pageant results, or trust.</p></div><strong>${total}<small>pending items</small></strong></header>
      <nav class="pi-admin-tabs"><button class="active" data-admin-tab="audiences">Audiences</button><button data-admin-tab="pageants">Pageants</button><button data-admin-tab="content">Content</button><button data-admin-tab="publishing">Publish</button></nav>
      <div class="pi-admin-panel active" data-admin-panel="audiences">
        <div class="pi-admin-group"><h3>Media profiles</h3><div class="pi-admin-list">${cards(data.mediaProfiles, (row) => `<article><div><strong>${escapeHtml(row.column_name || "Unnamed media column")}</strong><span>${escapeHtml([row.role, row.media_type, row.city, row.country_name].filter(Boolean).join(" · "))}</span></div>${stateLabel(row.review_state)}${reviewButtons("media-profile", row.user_id)}</article>`, "No submitted media profiles require review.")}</div></div>
        <div class="pi-admin-group"><h3>Pageant organizations</h3><div class="pi-admin-list">${cards(data.organizations, (row) => `<article><div><strong>${escapeHtml(row.organization_name || "Unnamed organization")}</strong><span>${escapeHtml([row.organization_type, row.city, row.country_name].filter(Boolean).join(" · "))}</span></div>${stateLabel(row.review_state)}${reviewButtons("organization", row.user_id)}</article>`, "No submitted organizations require review.")}</div></div>
      </div>
      <div class="pi-admin-panel" data-admin-panel="pageants">
        <div class="pi-admin-group"><h3>Pageant editions</h3><div class="pi-admin-list">${cards(data.editions, (row) => `<article><div><strong>${escapeHtml([row.pageant_name, row.edition_name].filter(Boolean).join(" · "))}</strong><span>${escapeHtml([row.edition_year, row.city, row.country_name, row.event_start_at ? new Date(row.event_start_at).toLocaleDateString() : ""].filter(Boolean).join(" · "))}</span></div>${stateLabel(row.review_state)}${reviewButtons("edition", row.id)}</article>`, "No submitted pageant editions require review.")}</div></div>
        <div class="pi-admin-group"><h3>Public experience requests</h3><div class="pi-admin-list">${cards(data.experiences, (row) => `<article><div><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml([row.experience_type?.replaceAll("_", " "), row.provider_name, row.guest_access_requested ? "Guest access requested" : "Account-linked access requested"].filter(Boolean).join(" · "))}</span></div>${stateLabel(row.review_state)}${reviewButtons("experience", row.id)}</article>`, "No voting, broadcast, ticket, or merchandise requests require review.")}</div></div>
      </div>
      <div class="pi-admin-panel" data-admin-panel="content">
        <div class="pi-admin-group"><h3>Media articles</h3><div class="pi-admin-list">${cards(data.mediaArticles, (row) => `<article><div><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml([row.column_name, row.author_name].filter(Boolean).join(" · "))}</span></div>${stateLabel(row.review_state)}${reviewButtons("media-article", row.id, true)}</article>`, "No submitted media articles require review.")}</div></div>
        <div class="pi-admin-group"><h3>Organizer announcements</h3><div class="pi-admin-list">${cards(data.announcements, (row) => `<article><div><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.summary)}</span></div>${stateLabel(row.review_state)}${reviewButtons("organizer-announcement", row.id, true)}</article>`, "No organizer announcements require review.")}</div></div>
      </div>
      <div class="pi-admin-panel" data-admin-panel="publishing">
        <div class="pi-admin-publish-grid">
          <form id="pi-admin-announcement-form"><h3>Publish announcement</h3><label>Title<input name="title" required maxlength="220"></label><label>Category<input name="category" required maxlength="100" value="Platform update"></label><label>Summary<textarea name="summary" required maxlength="1000"></textarea></label><label>Official link<input name="target_url" type="url"></label><label class="pi-admin-check"><input name="is_pinned" type="checkbox"> Pin this announcement</label><button>Publish announcement</button></form>
          <form id="pi-admin-ad-form"><h3>Create featured campaign</h3><label>Visible label<input name="label" required maxlength="80" value="Featured"></label><label>Campaign title<input name="title" required maxlength="220"></label><label>Placement<select name="placement"><option value="network">Across network</option><option value="home">Home</option><option value="directory">Supplier directory</option><option value="media">Media</option><option value="updates">Announcements</option><option value="app">Mobile app</option></select></label><label>Summary<textarea name="summary" required maxlength="1000"></textarea></label><label>Image URL<input name="image_url" type="url"></label><label>Destination URL<input name="target_url" type="url"></label><button>Publish featured campaign</button></form>
        </div>
        <div class="pi-admin-published"><div><h3>Recent announcements</h3>${cards(data.publishedAnnouncements, (row) => `<p><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(row.status)}</span></p>`, "No announcements published.")}</div><div><h3>Featured campaigns</h3>${cards(data.featuredAds, (row) => `<p><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(`${row.label} · ${row.status}`)}</span></p>`, "No featured campaigns created.")}</div></div>
      </div>
      <div class="pi-admin-message" id="pi-admin-message" role="status"></div>
    </section>`;
  }

  async function review(kind, id, nextState, publish) {
    const calls = {
      "media-profile": ["admin_review_media_profile", {profile_user_id: id, next_review_state: nextState}],
      "media-article": ["admin_review_media_article", {article_id: id, next_review_state: nextState, publish_now: publish}],
      organization: ["admin_review_pageant_organization", {profile_user_id: id, next_review_state: nextState}],
      edition: ["admin_review_pageant_edition", {edition_id: id, next_review_state: nextState}],
      experience: ["admin_review_pageant_experience", {request_id: id, next_review_state: nextState}],
      "organizer-announcement": ["admin_review_organizer_announcement", {request_id: id, next_review_state: nextState, publish_now: publish}],
    };
    const [name, args] = calls[kind] || [];
    if (!name) throw new Error("Unknown moderation action.");
    await request(`/rest/v1/rpc/${name}`, {method: "POST", body: JSON.stringify(args)});
  }

  function formRecord(form) {
    const data = Object.fromEntries(new FormData(form));
    form.querySelectorAll('input[type="checkbox"]').forEach((input) => { data[input.name] = input.checked; });
    Object.keys(data).forEach((key) => { if (data[key] === "") data[key] = null; });
    return data;
  }

  function bind(section) {
    section.querySelectorAll("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => {
      section.querySelectorAll("[data-admin-tab]").forEach((item) => item.classList.toggle("active", item === button));
      section.querySelectorAll("[data-admin-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.adminPanel === button.dataset.adminTab));
    }));

    section.querySelectorAll("[data-review-kind]").forEach((button) => button.addEventListener("click", async () => {
      const message = section.querySelector("#pi-admin-message");
      button.disabled = true;
      message.textContent = "Saving review decision…";
      try {
        await review(button.dataset.reviewKind, button.dataset.reviewId, button.dataset.reviewState, button.dataset.publish === "true");
        message.textContent = "Review decision saved.";
        section.remove();
        await render();
      } catch (error) {
        message.textContent = error.message;
        button.disabled = false;
      }
    }));

    section.querySelector("#pi-admin-announcement-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = section.querySelector("#pi-admin-message");
      try {
        await request("/rest/v1/announcements", {method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify({...formRecord(form), status: "published", published_at: new Date().toISOString()})});
        form.reset();
        message.textContent = "Announcement published.";
        section.remove();
        await render();
      } catch (error) { message.textContent = error.message; }
    });

    section.querySelector("#pi-admin-ad-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = section.querySelector("#pi-admin-message");
      try {
        await request("/rest/v1/featured_ads", {method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify({...formRecord(form), status: "published", starts_at: new Date().toISOString()})});
        form.reset();
        message.textContent = "Featured campaign published.";
        section.remove();
        await render();
      } catch (error) { message.textContent = error.message; }
    });
  }

  async function render() {
    if (loading || !isAdmin() || document.querySelector("[data-pi-admin-moderation]")) return;
    const main = document.querySelector("main");
    if (!main) return;
    loading = true;
    try {
      const data = await loadQueues();
      const wrapper = document.createElement("div");
      wrapper.innerHTML = moderationMarkup(data);
      const section = wrapper.firstElementChild;
      main.appendChild(section);
      bind(section);
    } catch (error) {
      const notice = document.createElement("div");
      notice.className = "pi-admin-load-error";
      notice.dataset.piAdminModeration = "true";
      notice.textContent = `Audience moderation could not load: ${error.message}`;
      main.appendChild(notice);
    } finally {
      loading = false;
    }
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(async () => {
      queued = false;
      await render();
    });
  };
  new MutationObserver(queue).observe(document.documentElement, {childList: true, subtree: true});
  queue();
})();
