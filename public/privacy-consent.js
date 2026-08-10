"use strict";

(() => {
  const POLICY_VERSION = "2026-08-11";
  const POLICY_URL = "/privacy/";

  function enhanceSignup() {
    const form = document.getElementById("signup-form");
    if (!form || form.dataset.privacyReady === "true") return Boolean(form);
    form.dataset.privacyReady = "true";

    const submit = form.querySelector('button[type="submit"], button:not([type])');
    if (!submit) return true;

    const privacy = document.createElement("label");
    privacy.className = "checkbox-consent privacy-acknowledgement";
    privacy.innerHTML = `<input name="privacy_notice_acknowledged" type="checkbox" value="yes" required> I have read the <a href="${POLICY_URL}" target="_blank" rel="noopener">Member Privacy Policy</a>. I understand which account information stays private and that profile information I choose or authorize for publication may become public and may be indexed by search engines after review.`;

    const age = document.createElement("label");
    age.className = "checkbox-consent privacy-age-confirmation";
    age.innerHTML = `<input name="adult_or_guardian_confirmed" type="checkbox" value="yes" required> I am at least 18 years old, or I am a parent, legal guardian, or otherwise authorized representative permitted to create or manage this account.`;

    submit.before(privacy, age);

    const note = document.querySelector(".auth-privacy");
    if (note) note.innerHTML = `Privacy notice version ${POLICY_VERSION}. <a href="${POLICY_URL}">Read the Member Privacy Policy</a>.`;
    return true;
  }

  const observer = new MutationObserver(() => {
    if (enhanceSignup()) observer.disconnect();
  });
  observer.observe(document.documentElement, {childList: true, subtree: true});
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceSignup, {once: true});
  } else {
    enhanceSignup();
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const method = String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
    if (method === "POST" && url.includes("/auth/v1/signup")) {
      const form = document.getElementById("signup-form");
      const privacyChecked = form?.querySelector('input[name="privacy_notice_acknowledged"]')?.checked;
      const adultChecked = form?.querySelector('input[name="adult_or_guardian_confirmed"]')?.checked;
      if (!privacyChecked || !adultChecked) {
        throw new Error("Please review and acknowledge the Member Privacy Policy and age/guardian requirement before creating an account.");
      }
      let body = {};
      try {
        body = JSON.parse(String(init.body || "{}"));
      } catch {
        throw new Error("Account privacy acknowledgement could not be recorded. Please try again.");
      }
      body.data = {
        ...(body.data || {}),
        privacy_notice_acknowledged: true,
        privacy_policy_version: POLICY_VERSION,
        public_profile_notice_acknowledged: true,
        adult_or_guardian_confirmed: true,
      };
      init = {...init, body: JSON.stringify(body)};
    }
    return originalFetch(input, init);
  };
})();
