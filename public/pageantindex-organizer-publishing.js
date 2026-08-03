"use strict";

(() => {
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";

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

  const safeUrl = (value) => {
    try {
      const url = new URL(String(value || ""), location.origin);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
    } catch {
      return "#";
    }
  };

  async function enhanceOrganizerWorkspace() {
    const workspace = document.querySelector("[data-pi-organizer-workspace]");
    if (!workspace || workspace.dataset.piPublishingReady === "true") return;
    workspace.dataset.piPublishingReady = "true";

    const editionSection = workspace.querySelector("#pageant-editions");
    const rosterForm = workspace.querySelector("#pi-organizer-roster-form");
    if (rosterForm && !rosterForm.querySelector('[name="title_or_placement"]')) {
      rosterForm.querySelector("button")?.insertAdjacentHTML("beforebegin", `
        <input name="title_or_placement" placeholder="Title or placement">
        <select name="status"><option value="draft">Draft</option><option value="confirmed">Confirmed</option><option value="withdrawn">Withdrawn</option><option value="disqualified">Disqualified</option><option value="completed">Completed</option></select>
        <label class="pi-category-option"><input name="is_public" type="checkbox"><span>Authorized for public roster</span></label>`);
    }

    const editionForm = workspace.querySelector("#pi-organizer-edition-form .pi-form-grid");
    if (editionForm && !editionForm.querySelector('[name="application_open_at"]')) {
      editionForm.querySelector('[name="event_start_at"]')?.closest("label")?.insertAdjacentHTML("beforebegin", `
        <label>Applications open<input name="application_open_at" type="datetime-local"></label>
        <label>Applications close<input name="application_close_at" type="datetime-local"></label>`);
      editionForm.querySelector('[name="official_url"]')?.closest("label")?.insertAdjacentHTML("afterend", '<label>Official rules link<input name="rules_url" type="url"></label>');
    }

    editionSection?.insertAdjacentHTML("afterend", `
      <section id="organizer-review-tools" class="pi-workspace-section">
        <h2>Submit an edition for review</h2>
        <p class="muted">Saving an edition keeps it private. Submit only after dates, official links, venue, roster permissions, and public experiences are accurate.</p>
        <form id="pi-organizer-submit-edition-form" class="pi-inline-form">
          <select name="edition_id" required data-publishing-edition-select><option value="">Choose edition</option></select>
          <button class="btn btn-primary">Submit edition for review</button>
        </form>
      </section>
      <section id="official-results" class="pi-workspace-section">
        <h2>Official result requests</h2>
        <p class="muted">Results remain private until administrator review. Do not publish unconfirmed placements.</p>
        <div id="pi-organizer-result-list" class="pi-history-list"><div class="pi-empty">Loading result requests…</div></div>
        <form id="pi-organizer-result-form" class="pi-workspace-form"><div class="pi-form-grid">
          <label>Edition<select name="edition_id" required data-publishing-edition-select><option value="">Choose edition</option></select></label>
          <label>Candidate<input name="candidate_display_name" required maxlength="180"></label>
          <label>Representation<input name="representation" maxlength="180"></label>
          <label>Award or placement<input name="award_or_placement" required maxlength="220"></label>
          <label>Display order<input name="result_order" type="number" min="1" max="10000"></label>
          <label>Official result link<input name="official_url" type="url"></label>
        </div><button class="btn btn-primary">Submit result for review</button></form>
      </section>`);

    const active = session();
    if (!active?.user?.id) return;
    const userId = active.user.id;

    async function loadEditions() {
      const rows = await request(`/rest/v1/pageant_edition_drafts?select=id,pageant_name,edition_name,edition_year,submission_state,review_state&organizer_user_id=eq.${encodeURIComponent(userId)}&order=edition_year.desc,updated_at.desc`) || [];
      document.querySelectorAll("[data-publishing-edition-select]").forEach((select) => {
        const current = select.value;
        select.innerHTML = '<option value="">Choose edition</option>' + rows.map((row) => `<option value="${row.id}">${escapeHtml([row.pageant_name, row.edition_name || row.edition_year].filter(Boolean).join(" · "))}</option>`).join("");
        if ([...select.options].some((option) => option.value === current)) select.value = current;
      });
      return rows;
    }

    async function loadResults() {
      const list = document.getElementById("pi-organizer-result-list");
      try {
        const rows = await request(`/rest/v1/pageant_result_drafts?select=id,candidate_display_name,representation,award_or_placement,submission_state,review_state,updated_at&organizer_user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`) || [];
        list.innerHTML = rows.length ? rows.map((row) => `<article><strong>${escapeHtml(row.candidate_display_name)}</strong><span>${escapeHtml([row.award_or_placement, row.representation, row.submission_state, row.review_state].filter(Boolean).join(" · "))}</span></article>`).join("") : '<div class="pi-empty">No result requests submitted yet.</div>';
      } catch (error) {
        list.innerHTML = `<div class="pi-empty">${escapeHtml(error.message)}</div>`;
      }
    }

    document.getElementById("pi-organizer-submit-edition-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const editionId = new FormData(event.currentTarget).get("edition_id");
      try {
        await request(`/rest/v1/pageant_edition_drafts?id=eq.${encodeURIComponent(editionId)}&organizer_user_id=eq.${encodeURIComponent(userId)}`, {
          method: "PATCH",
          headers: {Prefer: "return=minimal"},
          body: JSON.stringify({submission_state: "submitted"}),
        });
        window.showToast?.("Edition submitted for administrator review.");
        await loadEditions();
      } catch (error) {
        window.showToast?.(error.message, "error");
      }
    });

    document.getElementById("pi-organizer-result-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      data.result_order = data.result_order ? Number(data.result_order) : null;
      try {
        await request("/rest/v1/pageant_result_drafts", {
          method: "POST",
          headers: {Prefer: "return=minimal"},
          body: JSON.stringify({organizer_user_id: userId, ...data, submission_state: "submitted"}),
        });
        form.reset();
        await loadResults();
        window.showToast?.("Official result submitted for review.");
      } catch (error) {
        window.showToast?.(error.message, "error");
      }
    });

    await Promise.allSettled([loadEditions(), loadResults()]);
  }

  function editionCards(items) {
    return items.length ? items.map((item) => `<article class="pi-content-card"><span>${escapeHtml([item.country_name, item.edition_year].filter(Boolean).join(" · ") || "Official pageant")}</span><h3>${escapeHtml([item.pageant_name, item.edition_name].filter(Boolean).join(" · "))}</h3><p>${escapeHtml(item.description || "Official edition information reviewed by Pageant Index.")}</p><div class="pi-card-actions">${item.official_url ? `<a href="${escapeHtml(safeUrl(item.official_url))}" rel="noopener">Official page</a>` : ""}${item.application_url ? `<a href="${escapeHtml(safeUrl(item.application_url))}" rel="noopener">Apply</a>` : ""}</div></article>`).join("") : '<div class="pi-empty">No approved pageant editions are published yet.</div>';
  }

  function experienceCards(items) {
    return items.length ? items.map((item) => `<article class="pi-content-card"><span>${escapeHtml(item.experience_type.replaceAll("_", " "))}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || "")}</p>${item.provider_url ? `<a href="${escapeHtml(safeUrl(item.provider_url))}" rel="noopener sponsored">Open official experience</a>` : ""}<small>${item.guest_access_requested ? "Guest access requested" : "Provider identity rules may apply"}</small></article>`).join("") : '<div class="pi-empty">No approved voting, broadcast, ticket, or merchandise experiences are active.</div>';
  }

  async function renderPublicPageantData() {
    if (!["/pageant-calendar/", "/experiences/"].includes(location.pathname)) return;
    if (document.querySelector("[data-pi-public-pageant-data]")) return;
    const results = await Promise.allSettled([
      request("/rest/v1/pageant_edition_drafts?select=id,organization_name,pageant_name,edition_name,edition_year,event_start_at,event_end_at,country_name,city,venue,official_url,application_url,description&review_state=eq.approved&submission_state=eq.submitted&published_at=not.is.null&order=event_start_at.asc,edition_year.desc&limit=24"),
      request("/rest/v1/pageant_experience_requests?select=id,edition_id,experience_type,title,description,guest_access_requested,provider_name,provider_url,starts_at,ends_at&review_state=eq.approved&submission_state=eq.submitted&published_at=not.is.null&order=starts_at.asc,created_at.desc&limit=24"),
    ]);
    const editions = results[0].status === "fulfilled" ? results[0].value || [] : [];
    const experiences = results[1].status === "fulfilled" ? results[1].value || [] : [];
    const main = document.querySelector("main");
    if (!main) return;
    const section = document.createElement("section");
    section.className = "section";
    section.dataset.piPublicPageantData = "true";
    section.innerHTML = location.pathname === "/pageant-calendar/"
      ? `<div class="container"><div class="section-head"><div><div class="eyebrow">Reviewed organizers</div><h2 class="section-title">Approved pageant editions</h2><p class="section-copy">Only organization-submitted information approved for publication appears here.</p></div><a class="btn btn-secondary" href="/sign-up/">Join as an organization</a></div><div class="pi-announcement-grid">${editionCards(editions)}</div></div>`
      : `<div class="container"><div class="section-head"><div><div class="eyebrow">Official experiences</div><h2 class="section-title">Approved voting, broadcasts, tickets, and merchandise</h2><p class="section-copy">Access links appear only after organizer ownership and publication review.</p></div></div><div class="pi-announcement-grid">${experienceCards(experiences)}</div></div>`;
    main.appendChild(section);
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(async () => {
      queued = false;
      await enhanceOrganizerWorkspace();
      await renderPublicPageantData();
    });
  };
  new MutationObserver(queue).observe(document.documentElement, {childList: true, subtree: true});
  queue();
})();
