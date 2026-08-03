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

  async function request(pathname, body) {
    const active = session();
    if (!active?.access_token || !active?.user?.id) throw new Error("Sign in with your organization account.");
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {
      method: "POST",
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

  const isoOrNull = (value) => value ? new Date(value).toISOString() : null;

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!["pi-organizer-edition-form", "pi-organizer-roster-form"].includes(form.id)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const active = session();
    const button = form.querySelector('button[type="submit"], button:not([type])');
    if (button) button.disabled = true;

    try {
      const data = Object.fromEntries(new FormData(form));
      if (form.id === "pi-organizer-edition-form") {
        for (const key of ["application_open_at", "application_close_at", "event_start_at", "event_end_at"]) {
          data[key] = isoOrNull(data[key]);
        }
        data.edition_year = data.edition_year ? Number(data.edition_year) : null;
        await request("/rest/v1/pageant_edition_drafts", {
          organizer_user_id: active.user.id,
          ...data,
          submission_state: "draft",
        });
        window.showToast?.("Edition draft added.");
      } else {
        data.is_public = Boolean(form.elements.is_public?.checked);
        await request("/rest/v1/pageant_candidate_roster_drafts", {
          organizer_user_id: active.user.id,
          ...data,
        });
        window.showToast?.("Candidate added to the draft roster.");
      }
      form.reset();
      setTimeout(() => location.reload(), 450);
    } catch (error) {
      window.showToast?.(error.message, "error");
      if (button) button.disabled = false;
    }
  }, true);
})();
