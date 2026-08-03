"use strict";

(() => {
  if (location.pathname !== "/dashboard/") return;

  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  let activeRender = false;

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

  async function currentRole() {
    const active = session();
    if (!active?.user?.id) return null;
    try {
      const rows = await request(`/rest/v1/user_profiles?select=account_type&user_id=eq.${encodeURIComponent(active.user.id)}&limit=1`);
      return rows?.[0]?.account_type || active.user.user_metadata?.account_type || null;
    } catch {
      return active.user.user_metadata?.account_type || null;
    }
  }

  const stateBadge = (record) => `<span class="pi-submission-state ${escapeHtml(record.review_state || "pending")}">${escapeHtml(`${record.submission_state || "draft"} · ${record.review_state || "pending"}`.replaceAll("_", " "))}</span>`;

  function submissionButton(kind, id, disabled = false) {
    return `<button type="button" class="btn btn-secondary pi-submit-review" data-submit-kind="${kind}" data-submit-id="${id}" ${disabled ? "disabled" : ""}>${disabled ? "Submitted" : "Submit for review"}</button>`;
  }

  async function patch(table, filter, payload) {
    return request(`/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: {Prefer: "return=minimal"},
      body: JSON.stringify(payload),
    });
  }

  async function submitRecord(kind, id) {
    const active = session();
    const userId = active?.user?.id;
    if (!userId) throw new Error("Sign in again before submitting.");
    const actions = {
      "media-profile": () => patch("media_profile_drafts", `user_id=eq.${encodeURIComponent(userId)}`, {submission_state: "submitted"}),
      "media-article": () => patch("media_articles", `id=eq.${encodeURIComponent(id)}&author_user_id=eq.${encodeURIComponent(userId)}`, {submission_state: "submitted"}),
      "organizer-profile": () => patch("pageant_organization_drafts", `user_id=eq.${encodeURIComponent(userId)}`, {submission_state: "submitted"}),
      "organizer-edition": () => patch("pageant_edition_drafts", `id=eq.${encodeURIComponent(id)}&organizer_user_id=eq.${encodeURIComponent(userId)}`, {submission_state: "submitted"}),
      "organizer-experience": () => patch("pageant_experience_requests", `id=eq.${encodeURIComponent(id)}&organizer_user_id=eq.${encodeURIComponent(userId)}`, {submission_state: "submitted"}),
      "organizer-announcement": () => patch("organizer_announcement_requests", `id=eq.${encodeURIComponent(id)}&organizer_user_id=eq.${encodeURIComponent(userId)}`, {submission_state: "submitted"}),
    };
    if (!actions[kind]) throw new Error("Unknown submission type.");
    await actions[kind]();
  }

  function recordRows(rows, kind, titleFor, detailFor, empty) {
    if (!rows.length) return `<div class="pi-empty">${escapeHtml(empty)}</div>`;
    return rows.map((record) => {
      const submitted = record.submission_state === "submitted";
      return `<article class="pi-submission-row"><div><strong>${escapeHtml(titleFor(record))}</strong><span>${escapeHtml(detailFor(record))}</span></div>${stateBadge(record)}${submissionButton(kind, record.id || record.user_id, submitted)}</article>`;
    }).join("");
  }

  async function mediaPanel(userId) {
    const [profilesResult, articlesResult] = await Promise.allSettled([
      request(`/rest/v1/media_profile_drafts?select=user_id,column_name,submission_state,review_state,updated_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`),
      request(`/rest/v1/media_articles?select=id,title,submission_state,review_state,updated_at&author_user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc&limit=100`),
    ]);
    const profile = profilesResult.status === "fulfilled" ? profilesResult.value?.[0] : null;
    const articles = articlesResult.status === "fulfilled" ? articlesResult.value || [] : [];
    return `<section class="pi-submission-panel" data-pi-submission-panel>
      <div class="pi-submission-head"><div><span>Review workflow</span><h2>Submit media work for approval</h2><p>Saving keeps work private. Submission places it in the Pageant Index editorial review queue.</p></div></div>
      <div class="pi-submission-group"><h3>Media column</h3>${profile ? `<article class="pi-submission-row"><div><strong>${escapeHtml(profile.column_name || "Media column")}</strong><span>Profile and publication identity</span></div>${stateBadge(profile)}${submissionButton("media-profile", profile.user_id, profile.submission_state === "submitted")}</article>` : '<div class="pi-empty">Save your media profile before submitting it.</div>'}</div>
      <div class="pi-submission-group"><h3>Article drafts</h3>${recordRows(articles, "media-article", (row) => row.title, (row) => `Updated ${new Date(row.updated_at).toLocaleDateString()}`, "No article drafts yet.")}</div>
      <div class="pi-submission-message" role="status"></div>
    </section>`;
  }

  async function organizerPanel(userId) {
    const results = await Promise.allSettled([
      request(`/rest/v1/pageant_organization_drafts?select=user_id,organization_name,submission_state,review_state,updated_at&user_id=eq.${encodeURIComponent(userId)}&limit=1`),
      request(`/rest/v1/pageant_edition_drafts?select=id,pageant_name,edition_name,edition_year,submission_state,review_state,updated_at&organizer_user_id=eq.${encodeURIComponent(userId)}&order=edition_year.desc,updated_at.desc&limit=100`),
      request(`/rest/v1/pageant_experience_requests?select=id,title,experience_type,submission_state,review_state,updated_at&organizer_user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc&limit=100`),
      request(`/rest/v1/organizer_announcement_requests?select=id,title,submission_state,review_state,updated_at&organizer_user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc&limit=100`),
    ]);
    const profile = results[0].status === "fulfilled" ? results[0].value?.[0] : null;
    const editions = results[1].status === "fulfilled" ? results[1].value || [] : [];
    const experiences = results[2].status === "fulfilled" ? results[2].value || [] : [];
    const announcements = results[3].status === "fulfilled" ? results[3].value || [] : [];
    return `<section class="pi-submission-panel" data-pi-submission-panel>
      <div class="pi-submission-head"><div><span>Official review workflow</span><h2>Submit pageant records for approval</h2><p>Drafts stay private until you explicitly submit them. Pageant Index administrators review official identity, dates, links, access rules, and public claims.</p></div></div>
      <div class="pi-submission-group"><h3>Organization profile</h3>${profile ? `<article class="pi-submission-row"><div><strong>${escapeHtml(profile.organization_name || "Pageant organization")}</strong><span>Official organization identity</span></div>${stateBadge(profile)}${submissionButton("organizer-profile", profile.user_id, profile.submission_state === "submitted")}</article>` : '<div class="pi-empty">Save the organization profile before submitting it.</div>'}</div>
      <div class="pi-submission-group"><h3>Pageant editions</h3>${recordRows(editions, "organizer-edition", (row) => [row.pageant_name, row.edition_name].filter(Boolean).join(" · "), (row) => [row.edition_year, `Updated ${new Date(row.updated_at).toLocaleDateString()}`].filter(Boolean).join(" · "), "No pageant edition drafts yet.")}</div>
      <div class="pi-submission-group"><h3>Voting, broadcast, ticket and merchandise requests</h3>${recordRows(experiences, "organizer-experience", (row) => row.title, (row) => `${String(row.experience_type || "experience").replaceAll("_", " ")} · Updated ${new Date(row.updated_at).toLocaleDateString()}`, "No public experience drafts yet.")}</div>
      <div class="pi-submission-group"><h3>Announcement requests</h3>${recordRows(announcements, "organizer-announcement", (row) => row.title, (row) => `Updated ${new Date(row.updated_at).toLocaleDateString()}`, "No announcement drafts yet.")}</div>
      <div class="pi-submission-message" role="status"></div>
    </section>`;
  }

  function bind(panel) {
    panel.querySelectorAll("[data-submit-kind]").forEach((button) => button.addEventListener("click", async () => {
      const message = panel.querySelector(".pi-submission-message");
      button.disabled = true;
      message.textContent = "Submitting for review…";
      try {
        await submitRecord(button.dataset.submitKind, button.dataset.submitId);
        message.textContent = "Submitted successfully. It is now visible in the administrator review queue.";
        panel.remove();
        await render();
      } catch (error) {
        message.textContent = error.message;
        button.disabled = false;
      }
    }));
  }

  async function render() {
    if (activeRender || document.querySelector("[data-pi-submission-panel]")) return;
    const workspace = document.querySelector("[data-pi-role-workspace], [data-pi-organizer-workspace]");
    if (!workspace) return;
    const active = session();
    if (!active?.user?.id) return;
    activeRender = true;
    try {
      const role = await currentRole();
      if (!['media', 'organizer'].includes(role)) return;
      const markup = role === "media" ? await mediaPanel(active.user.id) : await organizerPanel(active.user.id);
      const wrapper = document.createElement("div");
      wrapper.innerHTML = markup;
      const panel = wrapper.firstElementChild;
      workspace.querySelector(":scope > section")?.appendChild(panel);
      bind(panel);
    } finally {
      activeRender = false;
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
