"use strict";
(() => {
  function updateOrganizerRole() {
    const button = document.querySelector('[data-account-role="organization"], [data-account-role="organizer"]');
    if (!button) return false;
    button.dataset.accountRole = "organizer";
    const title = button.querySelector("strong");
    const note = button.querySelector("small");
    if (title) title.textContent = "Pageant Organizer / Director";
    if (note) note.textContent = "Create your own professional organizer identity.";
    const form = document.getElementById("signup-form");
    if (form && !form.querySelector(".organization-creation-rule")) {
      const rule = document.createElement("div");
      rule.className = "organization-creation-rule";
      rule.innerHTML = "<strong>Organization access is invitation-only.</strong><p>PageantIndex creates organization records. Authorized representatives create a personal organizer account, then claim organization access through the invitation they received.</p>";
      form.querySelector(".pi-role-choice")?.after(rule);
    }
    if (!button.dataset.organizerReady) {
      button.dataset.organizerReady = "true";
      button.addEventListener("click", () => {
        const role = document.getElementById("pi-account-role");
        if (role) role.value = "organizer";
        const label = document.getElementById("pi-identity-name-label");
        if (label) label.textContent = "Organizer / professional name";
        const category = form?.querySelector('select[name="category"]');
        const target = [...(category?.options || [])].find((option) => option.value === "Pageant Directors");
        if (target) category.value = target.value;
      });
    }
    if (new URLSearchParams(location.search).get("role") === "organizer") button.click();
    return true;
  }
  const observer = new MutationObserver(() => { if (updateOrganizerRole()) observer.disconnect(); });
  observer.observe(document.documentElement, {childList: true, subtree: true});
  updateOrganizerRole();
})();
