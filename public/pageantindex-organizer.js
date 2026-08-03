"use strict";

(() => {
  const config = window.PageantIndexConfig;
  if (!config) return;

  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);

  const optionList = (values, selected = "") => values.map((value) => `<option value="${escapeHtml(value)}" ${selected === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
  const countryName = (code) => config.countries.find((country) => country.code === code)?.name || code || "";

  function readSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const session = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (session?.access_token) return session;
      } catch {}
    }
    return null;
  }

  function saveSession(session) {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  async function request(pathname, options = {}, explicitToken = null) {
    const token = explicitToken || readSession()?.access_token;
    const headers = {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {...options, headers});
    const text = response.status === 204 ? "" : await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = {message: text}; }
    }
    if (!response.ok) throw new Error(payload?.message || payload?.error_description || payload?.hint || `Request failed (${response.status})`);
    return payload;
  }

  function addOrganizerSignupFields() {
    const form = document.getElementById("signup-form");
    if (!form || form.querySelector("[data-pi-organizer-fields]")) return;
    const anchor = form.querySelector("[data-pi-media-fields]") || form.querySelector("[data-pi-supplier-fields]");
    if (!anchor) return;
    anchor.insertAdjacentHTML("afterend", `
      <section class="pi-ecosystem-fields" data-pi-organizer-fields hidden>
        <div class="field"><label>Official organization name *</label><input name="organizer_name" maxlength="220"></div>
        <div class="field"><label>Organization type *</label><select name="organizer_type"><option value="">Choose one</option>${optionList(config.organizerTypes)}</select></div>
        <div class="field"><label>Official website or social page</label><input name="organizer_official_url" type="url" placeholder="https://"></div>
        <div class="field"><label>Public contact email *</label><input name="organizer_public_email" type="email"></div>
        <div class="field pi-field-full"><label>About the organization *</label><textarea name="organizer_bio" maxlength="4000"></textarea></div>
        <div class="field pi-field-full"><div class="pi-role-note"><strong>Official pageant management</strong><span>Organizations can prepare pageant editions, candidate rosters, announcements, results, voting, livestreams, tickets, merchandise, and approved partners. Publication remains subject to Pageant Index review.</span></div></div>
      </section>`);

    const update = () => {
      const active = form.querySelector('input[name="account_type"]:checked')?.value === "organizer";
      const section = form.querySelector("[data-pi-organizer-fields]");
      section.hidden = !active;
      section.querySelectorAll("input,select,textarea").forEach((field) => {
        field.disabled = !active;
        field.required = active && field.name !== "organizer_official_url";
      });
    };
    form.querySelectorAll('input[name="account_type"]').forEach((input) => input.addEventListener("change", update));
    update();
  }

  async function handleOrganizerSignup(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== "signup-form") return;
    if (form.querySelector('input[name="account_type"]:checked')?.value !== "organizer") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    addOrganizerSignupFields();

    const invalid = [...form.elements].find((field) => !field.disabled && typeof field.checkValidity === "function" && !field.checkValidity());
    if (invalid) {
      invalid.focus();
      invalid.reportValidity?.();
      window.showToast?.("Please complete the required organization information.", "error");
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data.password !== data.confirm) return window.showToast?.("Passwords do not match.", "error");
    const button = form.querySelector('button[type="submit"]');
    const message = document.getElementById("signup-message");
    button.disabled = true;
    if (message) message.textContent = "Creating your secure organization account…";

    try {
      const response = await request("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          data: {
            full_name: data.name,
            account_type: "organizer",
            organization_name: data.organizer_name,
            country_code: data.country_code,
            country_name: countryName(data.country_code),
            city: data.city,
            region: data.region || null,
          },
        }),
      });
      if (response?.access_token && response?.user) {
        saveSession(response);
        const token = response.access_token;
        const now = new Date().toISOString();
        await request("/rest/v1/user_profiles?on_conflict=user_id", {
          method: "POST",
          headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
          body: JSON.stringify({
            user_id: response.user.id,
            account_type: "organizer",
            full_name_private: data.name,
            display_name: data.organizer_name,
            country_code: data.country_code,
            country_name: countryName(data.country_code),
            city: data.city,
            region: data.region || null,
            terms_accepted_at: now,
            privacy_accepted_at: now,
          }),
        }, token);
        await request("/rest/v1/pageant_organization_drafts?on_conflict=user_id", {
          method: "POST",
          headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
          body: JSON.stringify({
            user_id: response.user.id,
            organization_name: data.organizer_name,
            organization_type: data.organizer_type,
            official_url: data.organizer_official_url || null,
            public_email: data.organizer_public_email,
            bio: data.organizer_bio,
            country_code: data.country_code,
            country_name: countryName(data.country_code),
            city: data.city,
            region: data.region || null,
          }),
        }, token);
      }
      const confirmed = Boolean(response?.access_token);
      const text = confirmed ? "Organization account created." : "Check your email to confirm your organization account.";
      if (message) message.textContent = text;
      window.showToast?.(text);
      setTimeout(() => { location.href = confirmed ? "/dashboard/" : "/sign-in/"; }, 700);
    } catch (error) {
      if (message) message.textContent = error.message;
      window.showToast?.(error.message, "error");
      button.disabled = false;
    }
  }

  function organizerWorkspace(profile = {}) {
    return `<main class="pi-role-workspace" data-pi-organizer-workspace>
      <aside><div class="pi-workspace-brand">Pageant Index<small>Organization Workspace</small></div><nav>
        <a href="#organization-profile">Organization</a><a href="#pageant-editions">Pageant editions</a>
        <a href="#candidate-rosters">Candidate rosters</a><a href="#public-experiences">Voting, watch and shop</a>
        <a href="#announcement-requests">Announcements</a><a href="/directory/">Find suppliers</a>
      </nav></aside>
      <section><header><div><h1>Manage your official pageant presence.</h1><p>Prepare accurate pageant editions, rosters, experiences, announcements, and results for administrator review.</p></div><a class="btn btn-secondary" href="/pageant-calendar/">Public calendar</a></header>
        <form id="pi-organizer-profile-form" class="pi-workspace-form"><section id="organization-profile"><h2>Organization profile</h2><div class="pi-form-grid">
          <label>Organization name<input name="organization_name" required value="${escapeHtml(profile.display_name || "")}"></label>
          <label>Organization type<select name="organization_type" required><option value="">Choose one</option>${optionList(config.organizerTypes)}</select></label>
          <label>Official link<input name="official_url" type="url"></label><label>Public email<input name="public_email" type="email" required></label>
          <label class="full">About the organization<textarea name="bio" required maxlength="4000"></textarea></label>
        </div><button class="btn btn-primary">Save organization profile</button></section></form>
        <section id="pageant-editions" class="pi-workspace-section"><h2>Pageant editions</h2><div id="pi-organizer-edition-list" class="pi-history-list"><div class="pi-empty">Loading editions…</div></div>
          <form id="pi-organizer-edition-form" class="pi-workspace-form"><div class="pi-form-grid">
            <label>Pageant name<input name="pageant_name" required maxlength="220"></label><label>Edition name<input name="edition_name" maxlength="160" placeholder="2027 Edition"></label>
            <label>Edition year<input name="edition_year" type="number" min="1900" max="2100"></label><label>Venue<input name="venue" maxlength="220"></label>
            <label>Event starts<input name="event_start_at" type="datetime-local"></label><label>Event ends<input name="event_end_at" type="datetime-local"></label>
            <label>Application link<input name="application_url" type="url"></label><label>Official link<input name="official_url" type="url"></label>
            <label class="full">Description<textarea name="description" maxlength="5000"></textarea></label>
          </div><button class="btn btn-primary">Add edition draft</button></form></section>
        <section id="candidate-rosters" class="pi-workspace-section"><h2>Candidate rosters</h2><p class="muted">Choose an edition and add confirmed candidate information only with proper authorization.</p><form id="pi-organizer-roster-form" class="pi-inline-form">
          <select name="edition_id" required data-organizer-edition-select><option value="">Choose edition</option></select><input name="candidate_display_name" required placeholder="Candidate display name">
          <input name="representation" placeholder="Country, city, organization or title"><input name="candidate_number" placeholder="Number"><button class="btn btn-secondary">Add candidate</button>
        </form><div id="pi-organizer-roster-list" class="pi-history-list"></div></section>
        <section id="public-experiences" class="pi-workspace-section"><h2>Voting, broadcasts, tickets and merchandise</h2><form id="pi-organizer-experience-form" class="pi-form-grid">
          <label>Edition<select name="edition_id" required data-organizer-edition-select><option value="">Choose edition</option></select></label>
          <label>Experience<select name="experience_type" required><option value="voting">Voting</option><option value="livestream">Livestream</option><option value="pay_per_view">Pay-per-view</option><option value="tickets">Tickets</option><option value="merchandise">Merchandise</option></select></label>
          <label class="full">Title<input name="title" required maxlength="220"></label><label class="full">Description<textarea name="description" maxlength="3000"></textarea></label>
          <label>Provider name<input name="provider_name" maxlength="220"></label><label>Provider link<input name="provider_url" type="url"></label>
          <label class="full pi-category-option"><input name="guest_access_requested" type="checkbox" checked><span>Request guest access without forced Pageant Index registration</span></label>
          <button class="btn btn-primary" type="submit">Save experience request</button>
        </form></section>
        <section id="announcement-requests" class="pi-workspace-section"><h2>Announcement requests</h2><form id="pi-organizer-announcement-form" class="pi-form-grid">
          <label>Edition<select name="edition_id" data-organizer-edition-select><option value="">General organization announcement</option></select></label>
          <label>Official link<input name="target_url" type="url"></label><label class="full">Title<input name="title" required maxlength="220"></label>
          <label class="full">Summary<textarea name="summary" required maxlength="1000"></textarea></label><button class="btn btn-primary">Save announcement request</button>
        </form></section>
      </section></main>`;
  }

  async function currentRole() {
    const session = readSession();
    if (!session?.user?.id) return session?.user?.user_metadata?.account_type || null;
    try {
      const rows = await request(`/rest/v1/user_profiles?select=account_type,display_name&user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`);
      return rows?.[0] || {account_type: session.user.user_metadata?.account_type, display_name: session.user.user_metadata?.organization_name};
    } catch {
      return {account_type: session.user.user_metadata?.account_type, display_name: session.user.user_metadata?.organization_name};
    }
  }

  async function replaceOrganizerDashboard() {
    if (location.pathname !== "/dashboard/" || document.querySelector("[data-pi-organizer-workspace]")) return;
    const shell = document.querySelector(".product-shell");
    if (!shell || shell.dataset.piOrganizerChecked === "true") return;
    shell.dataset.piOrganizerChecked = "true";
    const profile = await currentRole();
    if (profile?.account_type !== "organizer") return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = organizerWorkspace(profile);
    shell.replaceWith(wrapper.firstElementChild);
    bindOrganizerWorkspace();
  }

  async function bindOrganizerWorkspace() {
    const session = readSession();
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const profileForm = document.getElementById("pi-organizer-profile-form");
    try {
      const rows = await request(`/rest/v1/pageant_organization_drafts?select=*&user_id=eq.${encodeURIComponent(userId)}&limit=1`);
      const draft = rows?.[0];
      if (draft) Object.entries(draft).forEach(([key, value]) => { if (profileForm.elements[key] && value != null) profileForm.elements[key].value = value; });
    } catch {}
    profileForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(profileForm));
      try {
        await request("/rest/v1/pageant_organization_drafts?on_conflict=user_id", {method: "POST", headers: {Prefer: "resolution=merge-duplicates,return=minimal"}, body: JSON.stringify({user_id: userId, ...data})});
        window.showToast?.("Organization profile saved.");
      } catch (error) { window.showToast?.(error.message, "error"); }
    });

    let editions = [];
    const renderEditions = async () => {
      const list = document.getElementById("pi-organizer-edition-list");
      try {
        editions = await request(`/rest/v1/pageant_edition_drafts?select=id,pageant_name,edition_name,edition_year,submission_state,review_state&organizer_user_id=eq.${encodeURIComponent(userId)}&order=edition_year.desc,updated_at.desc`) || [];
        list.innerHTML = editions.length ? editions.map((edition) => `<article><strong>${escapeHtml([edition.pageant_name, edition.edition_name].filter(Boolean).join(" · "))}</strong><span>${escapeHtml([edition.edition_year, edition.submission_state, edition.review_state].filter(Boolean).join(" · "))}</span></article>`).join("") : '<div class="pi-empty">No edition drafts yet.</div>';
        document.querySelectorAll("[data-organizer-edition-select]").forEach((select) => {
          const current = select.value;
          const first = select.querySelector("option")?.outerHTML || '<option value="">Choose edition</option>';
          select.innerHTML = first + editions.map((edition) => `<option value="${edition.id}">${escapeHtml([edition.pageant_name, edition.edition_year].filter(Boolean).join(" · "))}</option>`).join("");
          if ([...select.options].some((option) => option.value === current)) select.value = current;
        });
      } catch (error) { list.innerHTML = `<div class="pi-empty">${escapeHtml(error.message)}</div>`; }
    };

    document.getElementById("pi-organizer-edition-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      for (const key of ["event_start_at", "event_end_at"]) if (data[key]) data[key] = new Date(data[key]).toISOString(); else data[key] = null;
      data.edition_year = data.edition_year ? Number(data.edition_year) : null;
      try {
        await request("/rest/v1/pageant_edition_drafts", {method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify({organizer_user_id: userId, ...data})});
        event.currentTarget.reset();
        await renderEditions();
        window.showToast?.("Edition draft added.");
      } catch (error) { window.showToast?.(error.message, "error"); }
    });

    document.getElementById("pi-organizer-roster-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      try {
        await request("/rest/v1/pageant_candidate_roster_drafts", {method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify({organizer_user_id: userId, ...data})});
        event.currentTarget.reset();
        window.showToast?.("Candidate added to the draft roster.");
      } catch (error) { window.showToast?.(error.message, "error"); }
    });

    document.getElementById("pi-organizer-experience-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      data.guest_access_requested = form.elements.guest_access_requested.checked;
      try {
        await request("/rest/v1/pageant_experience_requests", {method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify({organizer_user_id: userId, ...data})});
        form.reset();
        form.elements.guest_access_requested.checked = true;
        window.showToast?.("Experience request saved for review.");
      } catch (error) { window.showToast?.(error.message, "error"); }
    });

    document.getElementById("pi-organizer-announcement-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.currentTarget));
      if (!data.edition_id) delete data.edition_id;
      try {
        await request("/rest/v1/organizer_announcement_requests", {method: "POST", headers: {Prefer: "return=minimal"}, body: JSON.stringify({organizer_user_id: userId, ...data})});
        event.currentTarget.reset();
        window.showToast?.("Announcement request saved for review.");
      } catch (error) { window.showToast?.(error.message, "error"); }
    });
    renderEditions();
  }

  function observe() {
    let queued = false;
    const run = () => {
      queued = false;
      addOrganizerSignupFields();
      replaceOrganizerDashboard();
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(run);
    };
    new MutationObserver(queue).observe(document.documentElement, {childList: true, subtree: true});
    queue();
  }

  document.addEventListener("submit", handleOrganizerSignup, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observe, {once: true});
  else observe();
})();
