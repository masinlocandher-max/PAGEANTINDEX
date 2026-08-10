"use strict";

(() => {
  const SESSION_KEY = "pi_supabase_session";
  const card = document.getElementById("credit-invite-card");
  const token = new URLSearchParams(location.search).get("token") || "";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));

  function session() {
    for (const storage of [sessionStorage, localStorage]) {
      try { const value = JSON.parse(storage.getItem(SESSION_KEY) || "null"); if (value?.access_token) return value; } catch {}
    }
    return null;
  }

  async function inspect() {
    if (token.length < 20) throw new Error("This invitation link is incomplete.");
    const response = await fetch(`/api/credits/inspect?token=${encodeURIComponent(token)}`, {cache: "no-store"});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Invitation could not be loaded.");
    return data;
  }

  async function accept() {
    const current = session();
    if (!current?.access_token) {
      sessionStorage.setItem("pi_credit_invite_return", location.href);
      location.href = "/sign-in/";
      return;
    }
    const button = card.querySelector("button");
    if (button) { button.disabled = true; button.textContent = "Confirming…"; }
    const response = await fetch("/api/credits/accept", {
      method: "POST",
      headers: {"Content-Type": "application/json", Authorization: `Bearer ${current.access_token}`},
      body: JSON.stringify({token}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data.profileRequired) {
        card.innerHTML = `<h2>Professional profile required</h2><p>${escapeHtml(data.error)}</p><p><a href="/dashboard/">Create or complete your professional profile</a>, then reopen this invitation to confirm the credit.</p>`;
        return;
      }
      throw new Error(data.error || "The credit could not be accepted.");
    }
    card.innerHTML = `<p class="pi-policy-kicker">Confirmed relationship</p><h2>Credit accepted.</h2><p>This professional credit is now attached to your PageantIndex record and the pageant edition. Confirmed credits can be displayed publicly according to PageantIndex trust standards.</p><p><a href="/dashboard/">Open your PageantIndex dashboard</a></p>`;
    window.PageantIndexAnalytics?.track?.("professional_credit_confirmed", {result: "accepted"});
  }

  inspect().then((data) => {
    const edition = data.edition || {};
    const candidate = data.candidate;
    const eventLabel = [edition.pageantName, edition.editionName || edition.editionYear].filter(Boolean).join(" · ") || "Pageant edition";
    if (!data.active) {
      card.innerHTML = `<h2>Invitation unavailable</h2><p>This invitation is ${escapeHtml(data.status || "inactive")} or has expired. Ask the organizer for a new invitation if the relationship should still be recorded.</p>`;
      return;
    }
    card.innerHTML = `<p class="pi-policy-kicker">Pending confirmation</p><h2>${escapeHtml(data.proposedRole || "Professional credit")}</h2><p><strong>${escapeHtml(eventLabel)}</strong></p>${candidate ? `<p>Candidate: <strong>${escapeHtml(candidate.displayName)}</strong>${candidate.representation ? ` · ${escapeHtml(candidate.representation)}` : ""}</p>` : `<p>Organization-level professional credit</p>`}<p>This invitation expires ${new Intl.DateTimeFormat("en-PH", {dateStyle:"medium",timeStyle:"short"}).format(new Date(data.expiresAt))}.</p><button id="accept-credit" type="button" style="margin-top:18px;padding:13px 21px;border:0;border-radius:999px;background:#7d164b;color:#fff;font-weight:750;cursor:pointer">Accept professional credit</button><p style="margin-top:18px"><small>By accepting, you confirm that this PageantIndex relationship record accurately represents your role for the named edition.</small></p>`;
    card.querySelector("#accept-credit")?.addEventListener("click", () => accept().catch((error) => { card.insertAdjacentHTML("beforeend", `<p class="pi-report-status">${escapeHtml(error.message)}</p>`); }));
  }).catch((error) => {
    card.innerHTML = `<h2>Invitation unavailable</h2><p>${escapeHtml(error.message)}</p>`;
  });
})();
