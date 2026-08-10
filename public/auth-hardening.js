"use strict";

(() => {
  const MIN_LENGTH = 12;
  const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
  const MESSAGE = "Use at least 12 characters with an uppercase letter, lowercase letter, number, and symbol.";

  function applyPasswordRules() {
    document.querySelectorAll('input[type="password"][autocomplete="new-password"]').forEach((input) => {
      input.minLength = MIN_LENGTH;
      input.pattern = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{12,}";
      input.title = MESSAGE;
      input.setAttribute("aria-describedby", `${input.id || input.name || "password"}-security-note`);
      const field = input.closest(".field");
      if (field && !field.querySelector(".password-security-note")) {
        const note = document.createElement("small");
        note.className = "password-security-note muted";
        note.id = `${input.id || input.name || "password"}-security-note`;
        note.textContent = MESSAGE;
        field.appendChild(note);
      }
    });
  }

  const observer = new MutationObserver(applyPasswordRules);
  observer.observe(document.documentElement, {childList: true, subtree: true});
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyPasswordRules, {once: true});
  else applyPasswordRules();

  const previousFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    const isSignup = method === "POST" && url.includes("/auth/v1/signup");
    const isPasswordUpdate = method === "PUT" && url.includes("/auth/v1/user");
    if (isSignup || isPasswordUpdate) {
      let body = {};
      try { body = JSON.parse(String(init.body || "{}")); } catch {}
      if (body.password && !STRONG_PASSWORD.test(String(body.password))) throw new Error(MESSAGE);
    }
    return previousFetch(input, init);
  };
})();
