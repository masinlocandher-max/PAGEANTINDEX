"use strict";

(() => {
  const root = document.getElementById("app");
  if (!root) return;
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const WEB_URL = "https://www.pageantindex.com";
  let dataPromise = null;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);

  const safeUrl = (value) => {
    try {
      const url = new URL(String(value || ""), WEB_URL);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
    } catch {
      return "#";
    }
  };

  async function request(pathname) {
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {headers: {apikey: SUPABASE_KEY}});
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }

  function loadData() {
    if (dataPromise) return dataPromise;
    dataPromise = Promise.allSettled([
      request("/rest/v1/pageant_edition_drafts?select=id,organization_name,pageant_name,edition_name,edition_year,event_start_at,country_name,city,venue,official_url,application_url,description&review_state=eq.approved&submission_state=eq.submitted&published_at=not.is.null&order=event_start_at.asc,edition_year.desc&limit=20"),
      request("/rest/v1/pageant_experience_requests?select=id,edition_id,experience_type,title,description,guest_access_requested,provider_name,provider_url,starts_at,ends_at&review_state=eq.approved&submission_state=eq.submitted&published_at=not.is.null&order=starts_at.asc,created_at.desc&limit=20"),
      request("/rest/v1/pageant_result_drafts?select=id,edition_id,candidate_display_name,representation,award_or_placement,result_order,official_url,published_at&review_state=eq.approved&submission_state=eq.submitted&published_at=not.is.null&order=result_order.asc,published_at.desc&limit=40"),
    ]).then(([editions, experiences, results]) => ({
      editions: editions.status === "fulfilled" ? editions.value || [] : [],
      experiences: experiences.status === "fulfilled" ? experiences.value || [] : [],
      results: results.status === "fulfilled" ? results.value || [] : [],
    }));
    return dataPromise;
  }

  function editionRows(items) {
    return items.length ? items.map((item) => `<article class="audience-history-row"><strong>${escapeHtml([item.pageant_name, item.edition_name].filter(Boolean).join(" · "))}</strong><span>${escapeHtml([item.organization_name, item.edition_year, item.country_name, item.city].filter(Boolean).join(" · "))}</span><div class="actions">${item.official_url ? `<a class="secondary" href="${escapeHtml(safeUrl(item.official_url))}">Official page</a>` : ""}${item.application_url ? `<a class="primary" href="${escapeHtml(safeUrl(item.application_url))}">Apply</a>` : ""}</div></article>`).join("") : '<div class="empty">No approved pageant editions are published yet.</div>';
  }

  function experienceRows(items) {
    return items.length ? items.map((item) => `<article class="audience-feed-card"><span>${escapeHtml(item.experience_type.replaceAll("_", " "))}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description || "")}</p>${item.provider_url ? `<a href="${escapeHtml(safeUrl(item.provider_url))}">Open official access</a>` : ""}<small>${item.guest_access_requested ? "Guest access requested" : "Provider identity rules may apply"}</small></article>`).join("") : '<div class="empty">No approved voting, broadcast, ticket, or merchandise experiences are active.</div>';
  }

  function resultRows(items) {
    return items.length ? items.slice(0, 12).map((item) => `<article class="audience-history-row"><strong>${escapeHtml(item.award_or_placement)}</strong><span>${escapeHtml([item.candidate_display_name, item.representation].filter(Boolean).join(" · "))}</span>${item.official_url ? `<a href="${escapeHtml(safeUrl(item.official_url))}">Official source</a>` : ""}</article>`).join("") : '<div class="empty">No approved official results are published yet.</div>';
  }

  async function enhance() {
    const shell = root.querySelector(".app-shell[data-audience-ready='true']");
    const screen = shell?.querySelector('[data-screen="pageants"]');
    if (!screen || screen.querySelector("[data-public-pageant-data]")) return;
    const data = await loadData();
    screen.insertAdjacentHTML("beforeend", `<section class="section" data-public-pageant-data><div class="section-heading"><h2>Approved pageant editions</h2><a href="${WEB_URL}/pageant-calendar/">View calendar</a></div><div class="audience-history-list">${editionRows(data.editions)}</div></section><section class="section"><div class="section-heading"><h2>Vote, watch, tickets and shop</h2><a href="${WEB_URL}/experiences/">View all</a></div><div class="audience-feed-list">${experienceRows(data.experiences)}</div></section><section class="section"><div class="section-heading"><h2>Official results</h2><span>Reviewed</span></div><div class="audience-history-list">${resultRows(data.results)}</div></section>`);
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
