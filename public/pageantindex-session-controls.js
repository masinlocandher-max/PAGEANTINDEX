"use strict";

(() => {
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";

  function readSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (value?.access_token) return value;
      } catch {}
    }
    return null;
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }

  async function signOut() {
    const session = readSession();
    try {
      if (session?.access_token) {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }
    } finally {
      clearSession();
      const onApp = location.pathname === "/app/" || location.hostname === "app.pageantindex.com";
      location.href = onApp ? "/app/" : "/sign-in/";
    }
  }

  function button(className = "") {
    const control = document.createElement("button");
    control.type = "button";
    control.className = className;
    control.dataset.piSignOut = "true";
    control.textContent = "Sign out";
    return control;
  }

  function enhanceWebsiteNavigation() {
    const session = readSession();
    if (!session) return;

    const actions = document.querySelector(".nav-actions");
    if (actions && !actions.querySelector("[data-pi-sign-out]")) {
      const accountLink = actions.querySelector('a[href="/sign-in/"]');
      if (accountLink) {
        accountLink.href = "/dashboard/";
        accountLink.textContent = "Account";
      }
      actions.appendChild(button("btn btn-secondary"));
    }

    const mobile = document.querySelector(".mobile-nav");
    if (mobile && !mobile.querySelector("[data-pi-sign-out]")) {
      const signIn = mobile.querySelector('a[href="/sign-in/"]');
      if (signIn) {
        signIn.href = "/dashboard/";
        signIn.textContent = "Account";
      }
      mobile.appendChild(button("mobile-nav-signout"));
    }
  }

  function enhanceWorkspace() {
    if (!readSession()) return;
    const workspace = document.querySelector("[data-pi-role-workspace], [data-pi-organizer-workspace]");
    if (!workspace || workspace.querySelector("[data-pi-sign-out]")) return;
    const nav = workspace.querySelector("aside nav");
    if (nav) nav.appendChild(button("pi-workspace-signout"));
    else workspace.prepend(button("btn btn-secondary pi-workspace-signout"));
  }

  function enhanceAppAccount() {
    if (!readSession()) return;
    const account = document.querySelector('[data-screen="account"]');
    if (!account || account.querySelector("[data-pi-sign-out]")) return;
    const list = account.querySelector(".audience-link-list");
    if (list) {
      const control = button();
      control.innerHTML = "Sign out<b>›</b>";
      list.appendChild(control);
    } else {
      account.appendChild(button("primary"));
    }
  }

  function enhance() {
    enhanceWebsiteNavigation();
    enhanceWorkspace();
    enhanceAppAccount();
  }

  document.addEventListener("click", (event) => {
    const control = event.target.closest?.("[data-pi-sign-out]");
    if (!control) return;
    event.preventDefault();
    control.disabled = true;
    control.textContent = "Signing out…";
    signOut().catch(() => {
      clearSession();
      location.href = "/sign-in/";
    });
  });

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
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", queue, {once: true});
  else queue();
})();
