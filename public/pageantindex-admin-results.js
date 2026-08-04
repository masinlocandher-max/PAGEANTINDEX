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
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${active.access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {}),
      },
    });
    const text = response.status === 204 ? "" : await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = {message: text}; }
    }
    if (!response.ok) throw new Error(payload?.message || payload?.hint || `Request failed (${response.status})`);
    return payload;
  }

  const buttons = (id) => `<div class="pi-admin-actions"><button type="button" data-result-review="approved" data-result-id="${id}">Approve and publish</button><button type="button" data-result-review="changes_requested" data-result-id="${id}">Request changes</button><button type="button" data-result-review="rejected" data-result-id="${id}">Reject</button></div>`;

  async function enhance() {
    if (loading || !isAdmin() || document.querySelector("[data-pi-admin-results]")) return;
    const panel = document.querySelector('[data-pi-admin-panel="pageants"]');
    if (!panel) return;
    loading = true;
    try {
      const rows = await request("/rest/v1/pageant_result_drafts?select=id,candidate_display_name,representation,award_or_placement,result_order,submission_state,review_state,updated_at&submission_state=eq.submitted&review_state=in.(pending,in_review,changes_requested)&order=updated_at.asc&limit=100") || [];
      const group = document.createElement("div");
      group.className = "pi-admin-group";
      group.dataset.piAdminResults = "true";
      group.innerHTML = `<h3>Official result requests</h3><div class="pi-admin-list">${rows.length ? rows.map((row) => `<article><div><strong>${escapeHtml(row.award_or_placement)}</strong><span>${escapeHtml([row.candidate_display_name, row.representation, row.result_order ? `Order ${row.result_order}` : ""].filter(Boolean).join(" · "))}</span></div><span class="pi-admin-state ${escapeHtml(row.review_state)}">${escapeHtml(row.review_state.replaceAll("_", " "))}</span>${buttons(row.id)}</article>`).join("") : '<div class="pi-admin-empty">No submitted official results require review.</div>'}</div>`;
      panel.appendChild(group);
      group.querySelectorAll("[data-result-review]").forEach((button) => button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          await request("/rest/v1/rpc/admin_review_pageant_result", {
            method: "POST",
            body: JSON.stringify({
              result_record_id: button.dataset.resultId,
              next_review_state: button.dataset.resultReview,
            }),
          });
          group.remove();
          loading = false;
          await enhance();
        } catch (error) {
          alert(error.message);
          button.disabled = false;
        }
      }));
    } catch (error) {
      const notice = document.createElement("div");
      notice.className = "pi-admin-empty";
      notice.dataset.piAdminResults = "true";
      notice.textContent = `Official result moderation could not load: ${error.message}`;
      panel.appendChild(notice);
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
      await enhance();
    });
  };
  new MutationObserver(queue).observe(document.documentElement, {childList: true, subtree: true});
  queue();
})();
