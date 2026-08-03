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
    if (!active?.access_token) throw new Error("Sign in with your media account.");
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

  async function enhance() {
    const profileForm = document.getElementById("pi-media-profile-form");
    const articleSection = document.getElementById("media-articles");
    if (!profileForm || !articleSection || profileForm.dataset.piPublishingReady === "true") return;
    profileForm.dataset.piPublishingReady = "true";

    const active = session();
    if (!active?.user?.id) return;
    const userId = active.user.id;

    const saveButton = profileForm.querySelector('button[type="submit"], button:not([type])');
    saveButton?.insertAdjacentHTML("afterend", '<button class="btn btn-secondary" type="button" id="pi-submit-media-profile">Submit media profile for review</button>');
    articleSection.insertAdjacentHTML("beforeend", '<section class="pi-workspace-section" id="pi-media-review-queue"><h2>Publishing review</h2><p class="muted">Drafts remain private. Submit an article only when the headline, body, attribution, image rights, and canonical link are ready for editorial review.</p><div id="pi-media-submission-list" class="pi-history-list"><div class="pi-empty">Loading article drafts…</div></div></section>');

    async function loadArticles() {
      const list = document.getElementById("pi-media-submission-list");
      try {
        const rows = await request(`/rest/v1/media_articles?select=id,title,submission_state,review_state,updated_at&author_user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc`) || [];
        list.innerHTML = rows.length ? rows.map((row) => `<article data-media-article-id="${row.id}"><div><strong>${escapeHtml(row.title)}</strong><span>${escapeHtml(`${row.submission_state} · ${row.review_state}`)}</span></div>${row.submission_state !== "submitted" || row.review_state === "changes_requested" ? `<button class="btn btn-secondary btn-small" type="button" data-submit-media-article="${row.id}">Submit for review</button>` : '<small>Under review</small>'}</article>`).join("") : '<div class="pi-empty">No article drafts yet.</div>';
        list.querySelectorAll("[data-submit-media-article]").forEach((button) => button.addEventListener("click", async () => {
          button.disabled = true;
          try {
            await request(`/rest/v1/media_articles?id=eq.${encodeURIComponent(button.dataset.submitMediaArticle)}&author_user_id=eq.${encodeURIComponent(userId)}`, {
              method: "PATCH",
              headers: {Prefer: "return=minimal"},
              body: JSON.stringify({submission_state: "submitted"}),
            });
            window.showToast?.("Article submitted for editorial review.");
            await loadArticles();
          } catch (error) {
            window.showToast?.(error.message, "error");
            button.disabled = false;
          }
        }));
      } catch (error) {
        list.innerHTML = `<div class="pi-empty">${escapeHtml(error.message)}</div>`;
      }
    }

    document.getElementById("pi-submit-media-profile")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        await request(`/rest/v1/media_profile_drafts?user_id=eq.${encodeURIComponent(userId)}`, {
          method: "PATCH",
          headers: {Prefer: "return=minimal"},
          body: JSON.stringify({submission_state: "submitted"}),
        });
        window.showToast?.("Media profile submitted for review.");
        button.textContent = "Submitted for review";
      } catch (error) {
        window.showToast?.(error.message, "error");
        button.disabled = false;
      }
    });

    document.getElementById("pi-media-article-form")?.addEventListener("submit", () => setTimeout(loadArticles, 500));
    await loadArticles();
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
