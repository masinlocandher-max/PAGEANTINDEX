"use strict";

(() => {
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";

  function session() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (value?.access_token) return value;
      } catch {}
    }
    return null;
  }

  async function patch(pathname, body) {
    const active = session();
    if (!active?.access_token) throw new Error("Sign in with your organization account.");
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${active.access_token}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || payload?.hint || `Request failed (${response.status})`);
  }

  function enhance() {
    const workspace = document.querySelector("[data-pi-organizer-workspace]");
    const profileForm = document.getElementById("pi-organizer-profile-form");
    if (!workspace || !profileForm || profileForm.dataset.piSubmissionReady === "true") return;
    profileForm.dataset.piSubmissionReady = "true";
    const saveButton = profileForm.querySelector('button[type="submit"], button:not([type])');
    saveButton?.insertAdjacentHTML("afterend", '<button class="btn btn-secondary" type="button" id="pi-submit-organization-review">Submit organization for review</button>');
    document.getElementById("pi-submit-organization-review")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const active = session();
        await patch(`/rest/v1/pageant_organization_drafts?user_id=eq.${encodeURIComponent(active.user.id)}`, {submission_state: "submitted"});
        window.showToast?.("Organization profile submitted for administrator review.");
        button.textContent = "Submitted for review";
      } catch (error) {
        window.showToast?.(error.message, "error");
        button.disabled = false;
      }
    });
  }

  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      enhance();
    });
  };
  new MutationObserver(queue).observe(document.documentElement, {childList: true, subtree: true});
  queue();
})();
