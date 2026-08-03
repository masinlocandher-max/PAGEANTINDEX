"use strict";

(() => {
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  const PENDING_KEY = "pi_pending_signup_v1";
  const PENDING_TTL = 24 * 60 * 60 * 1000;
  const originalFetch = window.fetch.bind(window);

  function websiteOrigin() {
    if (location.hostname === "pageantindex.com" || location.hostname.endsWith(".pageantindex.com")) {
      return "https://www.pageantindex.com";
    }
    return location.origin;
  }

  function redirectUrl(kind) {
    return `${websiteOrigin()}/sign-in/?auth=${encodeURIComponent(kind)}`;
  }

  function parseSignupPayload(form) {
    const payload = {};
    for (const [key, value] of new FormData(form).entries()) {
      if (["password", "confirm"].includes(key)) continue;
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        payload[key] = Array.isArray(payload[key]) ? [...payload[key], value] : [payload[key], value];
      } else {
        payload[key] = value;
      }
    }
    return payload;
  }

  function rememberPendingSignup(form) {
    if (!(form instanceof HTMLFormElement) || form.id !== "signup-form") return;
    const payload = parseSignupPayload(form);
    const email = String(payload.email || "").trim().toLowerCase();
    if (!email) return;
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify({email, payload, createdAt: Date.now()}));
    } catch {}
  }

  function pendingSignup(email = "") {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
      if (!pending || Date.now() - Number(pending.createdAt || 0) > PENDING_TTL) {
        localStorage.removeItem(PENDING_KEY);
        return null;
      }
      if (email && String(pending.email || "").toLowerCase() !== String(email).toLowerCase()) return null;
      return pending;
    } catch {
      return null;
    }
  }

  function normalizeRole(value) {
    return value === "professional" ? "supplier" : value;
  }

  function arrayValue(value) {
    if (Array.isArray(value)) return value.filter(Boolean);
    return value ? [value] : [];
  }

  function previousPageants(value) {
    return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 20);
  }

  async function api(pathname, options = {}, token = "") {
    const headers = {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await originalFetch(`${SUPABASE_URL}${pathname}`, {...options, headers});
    const text = response.status === 204 ? "" : await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = {message: text}; }
    }
    if (!response.ok) {
      throw new Error(payload?.message || payload?.error_description || payload?.hint || `Request failed (${response.status})`);
    }
    return payload;
  }

  async function upsert(table, record, token) {
    return api(`/rest/v1/${table}?on_conflict=user_id`, {
      method: "POST",
      headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
      body: JSON.stringify(record),
    }, token);
  }

  async function recordExists(table, ownerColumn, userId, token) {
    const rows = await api(
      `/rest/v1/${table}?select=${encodeURIComponent(ownerColumn)}&${encodeURIComponent(ownerColumn)}=eq.${encodeURIComponent(userId)}&limit=1`,
      {},
      token,
    ).catch(() => []);
    return Boolean(rows?.length);
  }

  function roleData(user, pendingRecord) {
    const metadata = user?.user_metadata || {};
    const pending = pendingRecord?.payload || {};
    const role = normalizeRole(pending.account_type || metadata.account_type || "");
    const countryCode = pending.country_code || metadata.country_code || null;
    const countryName = pending.country_name || metadata.country_name || countryCode || null;
    const fullName = pending.name || metadata.full_name || null;
    const displayName = role === "supplier"
      ? pending.supplier_business_name || pending.business_name || metadata.business_name || fullName
      : role === "media"
        ? pending.media_column_name || metadata.column_name || fullName
        : role === "organizer"
          ? pending.organizer_name || metadata.organization_name || fullName
          : fullName;
    return {metadata, pending, role, countryCode, countryName, fullName, displayName};
  }

  async function ensureRoleRecords(user, token) {
    if (!user?.id || !token) return "";
    const pendingRecord = pendingSignup(user.email);
    const existingProfiles = await api(
      `/rest/v1/user_profiles?select=account_type,display_name&user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
      {},
      token,
    ).catch(() => []);
    const existingProfile = existingProfiles?.[0] || null;

    // A normal sign-in must never replace an established profile with empty
    // confirmation metadata. Only finish onboarding when the profile is absent
    // or a fresh, password-free pending signup payload is still available.
    if (existingProfile && !pendingRecord) return existingProfile.account_type || "";

    const data = roleData(user, pendingRecord);
    if (!["enthusiast", "candidate", "supplier", "media", "organizer"].includes(data.role)) {
      return existingProfile?.account_type || "";
    }

    if (!existingProfile) {
      const now = new Date().toISOString();
      await upsert("user_profiles", {
        user_id: user.id,
        account_type: data.role,
        full_name_private: data.fullName,
        display_name: data.displayName,
        country_code: data.countryCode,
        country_name: data.countryName,
        city: data.pending.city || data.metadata.city || null,
        region: data.pending.region || data.metadata.region || null,
        terms_accepted_at: now,
        privacy_accepted_at: now,
      }, token);
    }

    if (data.role === "enthusiast" && (pendingRecord || !await recordExists("enthusiast_profiles", "user_id", user.id, token))) {
      await upsert("enthusiast_profiles", {
        user_id: user.id,
        display_name: data.displayName || "",
        interests: arrayValue(data.pending.enthusiast_interests),
      }, token);
    }

    if (data.role === "candidate" && (pendingRecord || !await recordExists("candidate_profile_drafts", "user_id", user.id, token))) {
      await upsert("candidate_profile_drafts", {
        user_id: user.id,
        display_name: data.displayName || "",
        candidate_status: data.pending.candidate_status || null,
        pageant_title: data.pending.candidate_pageant_title || data.pending.candidate_current_title || null,
        current_pageant: data.pending.candidate_current_pageant || null,
        current_title: data.pending.candidate_current_title || null,
        primary_goal: data.pending.candidate_goal || null,
        country_code: data.countryCode,
        country_name: data.countryName,
        city: data.pending.city || data.metadata.city || null,
        region: data.pending.region || data.metadata.region || null,
      }, token);
      const historyExists = await recordExists("candidate_pageant_history", "user_id", user.id, token);
      if (pendingRecord && !historyExists) {
        const history = [];
        if (data.pending.candidate_current_pageant) history.push({
          user_id: user.id,
          pageant_name: data.pending.candidate_current_pageant,
          title_or_placement: data.pending.candidate_current_title || null,
          participation_type: "current",
        });
        previousPageants(data.pending.candidate_previous_pageants).forEach((pageantName) => history.push({
          user_id: user.id,
          pageant_name: pageantName,
          participation_type: "previous",
        }));
        if (history.length) await api("/rest/v1/candidate_pageant_history", {
          method: "POST",
          headers: {Prefer: "return=minimal"},
          body: JSON.stringify(history),
        }, token);
      }
    }

    if (data.role === "supplier" && (pendingRecord || !await recordExists("professional_profile_drafts", "user_id", user.id, token))) {
      const primary = data.pending.supplier_primary_category || data.pending.category || data.metadata.category || null;
      const additional = arrayValue(data.pending.supplier_additional_categories).filter((category) => category !== primary);
      await upsert("professional_profile_drafts", {
        user_id: user.id,
        business_name: data.displayName || "",
        category: primary,
        primary_category: primary,
        additional_categories: additional,
        category_other: data.pending.supplier_category_other || null,
        location: [data.pending.city || data.metadata.city, data.pending.region || data.metadata.region, data.countryName].filter(Boolean).join(", ") || null,
        country_code: data.countryCode,
        country_name: data.countryName,
        city: data.pending.city || data.metadata.city || null,
        region: data.pending.region || data.metadata.region || null,
        public_email: user.email || null,
      }, token);
    }

    if (data.role === "media" && (pendingRecord || !await recordExists("media_profile_drafts", "user_id", user.id, token))) {
      await upsert("media_profile_drafts", {
        user_id: user.id,
        column_name: data.displayName || "",
        role: data.pending.media_role || null,
        media_type: data.pending.media_type || null,
        official_url: data.pending.media_official_url || null,
        bio: data.pending.media_bio || null,
        country_code: data.countryCode,
        country_name: data.countryName,
        city: data.pending.city || data.metadata.city || null,
        region: data.pending.region || data.metadata.region || null,
      }, token);
    }

    if (data.role === "organizer" && (pendingRecord || !await recordExists("pageant_organization_drafts", "user_id", user.id, token))) {
      await upsert("pageant_organization_drafts", {
        user_id: user.id,
        organization_name: data.displayName || "",
        organization_type: data.pending.organizer_type || null,
        official_url: data.pending.organizer_official_url || null,
        public_email: data.pending.organizer_public_email || user.email || null,
        bio: data.pending.organizer_bio || null,
        country_code: data.countryCode,
        country_name: data.countryName,
        city: data.pending.city || data.metadata.city || null,
        region: data.pending.region || data.metadata.region || null,
      }, token);
    }

    if (pendingRecord) {
      try { localStorage.removeItem(PENDING_KEY); } catch {}
    }
    return data.role;
  }

  function saveSession(payload, user) {
    const expiresIn = Number(payload.expires_in || 0);
    const session = {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token || null,
      token_type: payload.token_type || "bearer",
      expires_in: expiresIn || null,
      expires_at: expiresIn ? Math.floor(Date.now() / 1000) + expiresIn : null,
      user,
    };
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function cleanAuthUrl() {
    const url = new URL(location.href);
    url.hash = "";
    url.searchParams.delete("auth");
    history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  function authMessage(message, error = false) {
    const apply = () => {
      const target = document.getElementById("signin-message") || document.getElementById("signup-message");
      if (!target) return false;
      target.textContent = message;
      if (error) target.setAttribute("data-error", "true");
      else target.removeAttribute("data-error");
      return true;
    };
    if (apply()) return;
    const observer = new MutationObserver(() => {
      if (apply()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList: true, subtree: true});
    setTimeout(() => observer.disconnect(), 10000);
  }

  function renderPasswordReset(accessToken) {
    const render = () => {
      const signInForm = document.getElementById("signin-form");
      const section = signInForm?.closest(".official-auth");
      if (!section || section.dataset.piRecoveryReady === "true") return false;
      section.dataset.piRecoveryReady = "true";
      section.innerHTML = `<h2>Choose a new password</h2>
        <p class="muted">Use at least 10 characters. Your recovery link works once and should not be shared.</p>
        <form id="pi-password-reset-form">
          <div class="field"><label>New password</label><input name="password" type="password" minlength="10" autocomplete="new-password" required></div>
          <div class="field"><label>Confirm new password</label><input name="confirm" type="password" minlength="10" autocomplete="new-password" required></div>
          <button class="btn btn-primary" type="submit">Update password</button>
          <p class="form-status" id="pi-password-reset-status" role="status"></p>
        </form>`;
      document.getElementById("pi-password-reset-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = Object.fromEntries(new FormData(form));
        const status = document.getElementById("pi-password-reset-status");
        const button = form.querySelector("button");
        if (values.password !== values.confirm) {
          status.textContent = "Passwords do not match.";
          return;
        }
        button.disabled = true;
        status.textContent = "Updating your password…";
        try {
          await api("/auth/v1/user", {
            method: "PUT",
            body: JSON.stringify({password: values.password}),
          }, accessToken);
          status.innerHTML = `Password updated. <a href="/dashboard/">Continue to your workspace</a>.`;
          form.querySelectorAll("input").forEach((input) => { input.disabled = true; });
          button.remove();
        } catch (error) {
          status.textContent = error.message;
          button.disabled = false;
        }
      });
      return true;
    };
    if (render()) return;
    const observer = new MutationObserver(() => {
      if (render()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList: true, subtree: true});
    setTimeout(() => observer.disconnect(), 12000);
  }

  async function consumeAuthCallback() {
    const queryType = new URLSearchParams(location.search).get("auth");
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const error = hash.get("error_description") || hash.get("error");
    if (error) {
      cleanAuthUrl();
      authMessage(decodeURIComponent(error.replaceAll("+", " ")), true);
      return;
    }
    const accessToken = hash.get("access_token");
    if (!accessToken) {
      if (queryType === "recovery") authMessage("This recovery link is missing or has expired. Request a new link.", true);
      return;
    }
    try {
      const callbackType = hash.get("type") || queryType;
      const user = await api("/auth/v1/user", {}, accessToken);
      const session = saveSession(Object.fromEntries(hash.entries()), user);
      const role = await ensureRoleRecords(user, session.access_token);
      cleanAuthUrl();
      if (callbackType === "recovery") {
        renderPasswordReset(session.access_token);
        return;
      }
      authMessage("Email confirmed. Opening your Pageant Index workspace…");
      setTimeout(() => {
        location.href = role === "enthusiast" ? "https://app.pageantindex.com/" : "/dashboard/";
      }, 700);
    } catch (callbackError) {
      cleanAuthUrl();
      authMessage(callbackError.message || "This authentication link could not be completed.", true);
    }
  }

  window.fetch = async (input, init) => {
    let requestInput = input;
    let url;
    try {
      url = new URL(typeof input === "string" ? input : input.url, location.href);
    } catch {
      return originalFetch(input, init);
    }
    const isSupabaseAuth = url.origin === SUPABASE_URL && url.pathname.startsWith("/auth/v1/");
    if (isSupabaseAuth && ["/auth/v1/signup", "/auth/v1/recover"].includes(url.pathname) && !url.searchParams.has("redirect_to")) {
      url.searchParams.set("redirect_to", redirectUrl(url.pathname.endsWith("recover") ? "recovery" : "confirmed"));
      requestInput = input instanceof Request ? new Request(url.href, input) : url.href;
    }
    const response = await originalFetch(requestInput, init);
    if (isSupabaseAuth && url.pathname === "/auth/v1/token" && response.ok) {
      try {
        const session = await response.clone().json();
        if (session?.access_token && session?.user) await ensureRoleRecords(session.user, session.access_token);
      } catch {}
    }
    return response;
  };

  document.addEventListener("submit", (event) => rememberPendingSignup(event.target), true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", consumeAuthCallback, {once: true});
  } else {
    consumeAuthCallback();
  }
})();
