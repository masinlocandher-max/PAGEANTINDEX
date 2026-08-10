"use strict";

(() => {
  const SESSION_KEY = "pi_supabase_session";
  const requested = new URLSearchParams(location.search).get("organization") || "";
  const root = document.getElementById("organization-workspace");
  const title = document.getElementById("organization-title");
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  const currentSession = () => {
    for (const storage of [sessionStorage, localStorage]) {
      try { const value = JSON.parse(storage.getItem(SESSION_KEY) || "null"); if (value?.access_token) return value; } catch {}
    }
    return null;
  };
  const api = async (path, options = {}) => {
    const session = currentSession();
    const headers = {"Content-Type":"application/json", ...(options.headers || {})};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const response = await fetch(path, {...options, headers, cache:"no-store"});
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Request failed.");
    return payload;
  };
  const money = (minor, currency = "PHP") => minor == null ? "Fee not recorded" : new Intl.NumberFormat("en-PH", {style:"currency",currency}).format(Number(minor) / 100);

  function featureCard(feature, label, href) {
    const active = feature?.status === "active" && ["paid","waived"].includes(feature?.payment_status) && (!feature.expires_at || new Date(feature.expires_at).getTime() > Date.now());
    return `<article class="org-card org-feature ${active ? "active" : "locked"}"><h2>${label}</h2><p>${active ? "Founder activation is active for this organization." : "This is a paid PageantIndex competition feature. Organization admins cannot activate it themselves."}</p><span class="org-badge">${active ? "ACTIVE" : "LOCKED"}</span><p class="org-muted org-money">${feature?.payment_status === "paid" ? `Activation fee: ${escapeHtml(money(feature.fee_amount_minor, feature.currency))}` : feature?.payment_status === "waived" ? "Founder-authorized waiver" : "Awaiting founder activation and fee confirmation"}</p>${active ? `<a class="org-button" href="${href}">Open ${label}</a>` : '<button class="org-button" disabled>Founder activation required</button>'}</article>`;
  }

  async function load() {
    if (!currentSession()?.access_token) {
      root.innerHTML = '<article class="org-card org-wide"><h2>Sign in required</h2><p>This organization workspace is available only to invited organization administrators.</p><a class="org-button" href="/sign-in/?next=/organization-admin/">Sign in</a></article>';
      return;
    }
    const suffix = requested ? `?organization=${encodeURIComponent(requested)}` : "";
    const data = await api(`/api/organizations/workspace${suffix}`);
    const org = data.organization;
    title.textContent = org.organization_name;
    const voting = (data.features || []).find((item) => item.feature === "voting");
    const tabulation = (data.features || []).find((item) => item.feature === "tabulation");
    root.innerHTML = `
      <article class="org-card"><p class="org-kicker">Your authority</p><h2>Admin ${Number(data.membership.admin_sequence)}</h2><p>Your account is linked to this organization through an authorized invitation.</p><span class="org-badge">Organization Verified</span><p class="org-muted">This is an organization authority signal. PageantIndex identity verification remains a separate process and mark.</p></article>
      <article class="org-card"><p class="org-kicker">Organization state</p><h2>${escapeHtml(org.status)}</h2><p>${org.claimed_at ? `Claimed ${escapeHtml(new Date(org.claimed_at).toLocaleDateString("en-PH"))}` : "Awaiting initial claim"}</p><p class="org-muted">Organization ID: ${escapeHtml(org.id)}</p></article>
      ${featureCard(voting, "Voting", "/vote/")}
      ${featureCard(tabulation, "Tabulation", "/tabulation/")}
      <article class="org-card org-wide"><div class="org-actions" style="justify-content:space-between;align-items:center"><div><p class="org-kicker">Organization administrators</p><h2>Authorized admin team</h2></div><button class="org-button" id="add-admin">Add admin</button></div><div class="org-admin-list">${(data.admins || []).map((admin) => `<div class="org-admin"><div><strong>Admin ${Number(admin.admin_sequence)}</strong><p class="org-muted">Authorized through organization invitation</p></div><span class="org-badge">Organization Verified</span></div>`).join("")}</div><div class="org-divider"></div><form class="org-form" id="admin-invite-form" hidden><label>New administrator email<input name="email" type="email" required autocomplete="email"></label><button class="org-button">Generate secure admin invitation</button><p class="org-status" id="admin-invite-status" hidden></p><div class="org-copy" id="admin-invite-copy" hidden><input id="admin-invite-url" readonly><button type="button" class="org-button secondary" id="copy-admin-invite">Copy link</button></div></form></article>
      <article class="org-card org-wide"><p class="org-kicker">Official editions</p><h2>Organization records</h2>${data.editions?.length ? `<div class="org-admin-list">${data.editions.map((edition) => `<div class="org-admin"><div><strong>${escapeHtml(edition.pageant_name)}</strong><p class="org-muted">${escapeHtml(edition.edition_name || edition.edition_year || "Edition")}</p></div><span>${escapeHtml(edition.review_state)}</span></div>`).join("")}</div>` : '<p class="org-muted">No organization edition has been created yet.</p>'}</article>`;

    const form = document.getElementById("admin-invite-form");
    document.getElementById("add-admin")?.addEventListener("click", () => { form.hidden = !form.hidden; if (!form.hidden) form.querySelector("input")?.focus(); });
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = document.getElementById("admin-invite-status");
      const copy = document.getElementById("admin-invite-copy");
      status.hidden = false;
      status.className = "org-status";
      status.textContent = "Creating administrator invitation…";
      try {
        const payload = await api("/api/organizations/invite-admin", {method:"POST", body:JSON.stringify({organizationId:org.id,email:new FormData(form).get("email")})});
        status.className = "org-status success";
        status.textContent = `Invitation created for ${payload.email}.`;
        document.getElementById("admin-invite-url").value = payload.inviteUrl;
        copy.hidden = false;
      } catch (error) {
        status.className = "org-status error";
        status.textContent = error.message;
      }
    });
    document.getElementById("copy-admin-invite")?.addEventListener("click", async () => { await navigator.clipboard.writeText(document.getElementById("admin-invite-url").value); });
  }
  load().catch((error) => { root.innerHTML = `<article class="org-card org-wide"><p class="org-status error">${escapeHtml(error.message)}</p><a class="org-button secondary" href="/report/">Contact support</a></article>`; });
})();
