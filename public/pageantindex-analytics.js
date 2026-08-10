"use strict";

(() => {
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  const ANALYTICS_SESSION_KEY = "pi_analytics_session";
  const allowedPropertyKeys = new Set(["destination","form","category","location","query_present","account_type","action","result","placement"]);

  function authSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (value?.access_token) return value;
      } catch {}
    }
    return null;
  }

  function analyticsSessionId() {
    try {
      let id = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
      if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem(ANALYTICS_SESSION_KEY, id);
      }
      return id;
    } catch { return null; }
  }

  function cleanProperties(input) {
    const output = {};
    Object.entries(input || {}).forEach(([key, value]) => {
      if (!allowedPropertyKeys.has(key)) return;
      if (!["string","number","boolean"].includes(typeof value)) return;
      const stringValue = String(value);
      output[key] = stringValue.length > 180 ? stringValue.slice(0, 180) : value;
    });
    return output;
  }

  async function track(eventName, properties = {}, entity = {}) {
    if (!/^[a-z0-9_]{2,80}$/.test(String(eventName))) return false;
    const session = authSession();
    const headers = {apikey: SUPABASE_KEY, "Content-Type": "application/json", Prefer: "return=minimal"};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    let referrerHost = null;
    try { referrerHost = document.referrer ? new URL(document.referrer).hostname : null; } catch {}
    const payload = {
      user_id: session?.user?.id || null,
      session_id: analyticsSessionId(),
      event_name: eventName,
      route: location.pathname,
      referrer_host: referrerHost,
      source: new URLSearchParams(location.search).get("utm_source") || null,
      entity_type: entity.type || null,
      entity_id: entity.id || null,
      properties: cleanProperties(properties),
    };
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
        method: "POST", headers, body: JSON.stringify(payload), keepalive: true,
      });
      return response.ok;
    } catch { return false; }
  }

  window.PageantIndexAnalytics = {track};

  const params = new URLSearchParams(location.search);
  track("page_view", {query_present: params.has("q")});
  if (location.pathname === "/directory/" && (params.has("q") || params.has("category") || params.has("location"))) {
    track("directory_search", {
      query_present: params.has("q"),
      category: params.get("category") || "",
      location: params.get("location") || "",
    });
  }

  let signupStarted = false;
  document.addEventListener("focusin", (event) => {
    if (!signupStarted && event.target?.closest?.("#signup-form")) {
      signupStarted = true;
      const selected = document.querySelector('#signup-form input[name="account_type"]:checked')?.value || "";
      track("signup_started", {account_type: selected});
    }
  }, {passive: true});

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (form.id === "signup-form") {
      const selected = form.querySelector('input[name="account_type"]:checked')?.value || "";
      track("signup_submitted", {account_type: selected});
    } else if (/inquiry/i.test(form.id || "")) {
      track("inquiry_submitted", {form: "inquiry"});
    } else if (/support/i.test(form.id || "")) {
      track("support_submitted", {form: "support"});
    }
  }, true);

  document.addEventListener("click", (event) => {
    const share = event.target?.closest?.("[data-share-article]");
    if (share) return void track("share_action", {action: "article_share"});
    const link = event.target?.closest?.("a");
    if (!link) return;
    const href = link.getAttribute("href") || "";
    if (/sign-up|list-your-business|advertise|tickets|vote/.test(href)) {
      let destination = href;
      try { destination = new URL(href, location.origin).pathname; } catch {}
      track("cta_click", {destination});
    }
  }, {passive: true});
})();
