"use strict";

(() => {
  const root = document.getElementById("app");
  if (!root) return;
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  const WEB_URL = "https://www.pageantindex.com";

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

  async function request(pathname) {
    const active = session();
    const headers = {apikey: SUPABASE_KEY};
    if (active?.access_token) headers.Authorization = `Bearer ${active.access_token}`;
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {headers});
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  }

  async function role() {
    const active = session();
    if (!active?.user?.id) return active?.user?.user_metadata?.account_type || "guest";
    try {
      const rows = await request(`/rest/v1/user_profiles?select=account_type&user_id=eq.${encodeURIComponent(active.user.id)}&limit=1`);
      return rows?.[0]?.account_type || active.user.user_metadata?.account_type || "guest";
    } catch {
      return active.user.user_metadata?.account_type || "guest";
    }
  }

  async function enhanceOrganizerApp() {
    const shell = root.querySelector(".app-shell[data-audience-ready='true']");
    if (!shell || shell.dataset.organizerReady === "true") return;
    if (await role() !== "organizer") return;
    shell.dataset.organizerReady = "true";

    const active = session();
    let editions = [];
    try {
      editions = await request(`/rest/v1/pageant_edition_drafts?select=id,pageant_name,edition_name,edition_year,submission_state,review_state&organizer_user_id=eq.${encodeURIComponent(active.user.id)}&order=edition_year.desc,updated_at.desc`);
    } catch {}

    const pageants = shell.querySelector('[data-screen="pageants"]');
    if (pageants) pageants.innerHTML = `<div class="hero"><h1>Your official pageants.</h1><p>Manage pageant editions and candidate rosters through the secure organization workspace.</p></div><div class="audience-history-list">${editions.length ? editions.map((edition) => `<article class="audience-history-row"><strong>${escapeHtml([edition.pageant_name, edition.edition_name].filter(Boolean).join(" · "))}</strong><span>${escapeHtml([edition.edition_year, edition.submission_state, edition.review_state].filter(Boolean).join(" · "))}</span></article>`).join("") : '<div class="empty">No edition drafts yet.</div>'}</div><div class="panel section"><h2>Organization workspace</h2><p>Prepare editions, rosters, voting, livestreams, pay-per-view, tickets, merchandise, announcements, and results for review.</p><a class="primary" href="${WEB_URL}/dashboard/">Manage organization</a></div>`;

    const account = shell.querySelector('[data-screen="account"]');
    if (account) account.innerHTML = `<div class="hero"><h1>Organization account.</h1><p>Official pageant tools with administrator review and clear public trust boundaries.</p></div><div class="audience-account-card"><span>Account type</span><h2>Pageant Organization</h2><p>Manage official pageant information without being classified as a supplier.</p></div><div class="section"><div class="section-heading"><h2>Organization tools</h2></div><div class="audience-link-list"><a href="${WEB_URL}/dashboard/#organization-profile">Organization profile<b>›</b></a><a href="${WEB_URL}/dashboard/#pageant-editions">Pageant editions<b>›</b></a><a href="${WEB_URL}/dashboard/#candidate-rosters">Candidate rosters<b>›</b></a><a href="${WEB_URL}/dashboard/#public-experiences">Voting, watch and shop<b>›</b></a><a href="${WEB_URL}/dashboard/#announcement-requests">Announcement requests<b>›</b></a><a href="${WEB_URL}/directory/">Find suppliers<b>›</b></a></div></div><div class="travel-note">Public voting, pay-per-view, livestreams, tickets, and merchandise must be reviewed before publication. Guest access should remain available unless identity verification is specifically required.</div>`;
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(async () => {
      queued = false;
      await enhanceOrganizerApp();
    });
  };
  new MutationObserver(queue).observe(root, {childList: true, subtree: true});
  queue();
})();
