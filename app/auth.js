"use strict";

(() => {
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";

  const readSession = () => {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const session = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (session?.access_token) return session;
      } catch {}
    }
    return null;
  };

  async function signIn(email, password, persistent) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {apikey: SUPABASE_KEY, "Content-Type": "application/json"},
      body: JSON.stringify({email, password}),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error_description || payload?.message || "Sign-in failed.");
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (persistent ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(payload));
  }

  function enhanceGuestAccount() {
    if (readSession()) return true;
    const screen = document.querySelector('[data-screen="account"]');
    if (!screen || screen.querySelector("#app-auth-form")) return false;
    const actions = screen.querySelector(".travel-actions");
    if (!actions) return false;
    actions.outerHTML = `<form class="panel" id="app-auth-form" style="margin-top:16px">
      <h2>Sign in securely</h2>
      <p>App sessions are stored on app.pageantindex.com, so sign in here once to use saved suppliers and account tools in the mobile-first application.</p>
      <div class="account-list">
        <label class="account-row"><strong>Email</strong><input name="email" type="email" required autocomplete="email" style="max-width:58%;border:1px solid var(--line);border-radius:9px;padding:9px"></label>
        <label class="account-row"><strong>Password</strong><input name="password" type="password" required minlength="8" autocomplete="current-password" style="max-width:58%;border:1px solid var(--line);border-radius:9px;padding:9px"></label>
        <label class="account-row"><strong>Keep me signed in</strong><input name="persistent" type="checkbox"></label>
      </div>
      <button class="primary" type="submit" style="width:100%;margin-top:12px">Sign in</button>
      <div class="app-disclosure" id="app-auth-status" aria-live="polite"></div>
      <div class="travel-actions"><a class="secondary" href="https://www.pageantindex.com/sign-up/">Create Candidate or Supplier account</a><a class="secondary" href="https://www.pageantindex.com/sign-in/">Forgot password</a></div>
    </form>`;
    document.getElementById("app-auth-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      const button = form.querySelector("button");
      const status = document.getElementById("app-auth-status");
      button.disabled = true;
      status.textContent = "Signing in…";
      try {
        await signIn(data.email, data.password, data.persistent === "on");
        status.textContent = "Signed in. Reloading your Pageant Index workspace…";
        location.reload();
      } catch (error) {
        status.textContent = error.message;
        button.disabled = false;
      }
    });
    return true;
  }

  if (!enhanceGuestAccount()) {
    const observer = new MutationObserver(() => {
      if (enhanceGuestAccount()) observer.disconnect();
    });
    observer.observe(document.getElementById("app"), {childList:true,subtree:true});
    setTimeout(() => observer.disconnect(), 12000);
  }
})();
