"use strict";
(() => {
  if (document.body.dataset.page !== "signup") return;
  const roleMap = {professional:"supplier",supplier:"supplier",candidate:"candidate",organization:"organizer",organizer:"organizer"};
  const requested = roleMap[new URLSearchParams(location.search).get("role") || ""] || "";
  let complete = false;
  let observer;

  function apply() {
    if (complete) return true;
    const form = document.getElementById("signup-form");
    if (!form) return false;
    const radios = [...form.querySelectorAll('input[name="account_type"]')];
    if (!radios.some(input => input.value === "organizer")) return false;

    const launchRoles = new Set(["supplier","candidate","organizer"]);
    radios.forEach(input => {
      const label = input.closest("label");
      if (!label) return;
      const visible = launchRoles.has(input.value);
      label.hidden = !visible;
      input.disabled = !visible;
      const span = label.querySelector("span");
      if (span) {
        if (input.value === "supplier") span.textContent = "Professional / Supplier";
        if (input.value === "candidate") span.textContent = "Candidate / Titleholder";
        if (input.value === "organizer") span.textContent = "Pageant Organization";
      }
    });

    document.querySelector(".pi-role-picker")?.remove();
    const roleHeading = form.querySelector(".pi-profile-type-switch")?.closest(".field")?.querySelector("label");
    if (roleHeading) roleHeading.textContent = "Create profile as *";

    const chosen = form.querySelector(`input[name="account_type"][value="${requested || "supplier"}"]`);
    if (chosen) {
      chosen.checked = true;
      chosen.dispatchEvent(new Event("change", {bubbles:true}));
    }

    const intro = document.querySelector(".official-auth .muted");
    const descriptions = {
      supplier:"Create a free professional identity, publish your portfolio, and build pageant credits that can be confirmed by candidates or organizations.",
      candidate:"Create a candidate or titleholder identity and preserve your pageant history and personal supplier relationships.",
      organizer:"Create or claim a pageant organization identity, manage authorized admins and editions, and confirm official supplier roles.",
    };
    if (intro) intro.textContent = descriptions[chosen?.value || "supplier"];

    const note = document.getElementById("signup-message");
    if (note) note.textContent = "Basic profiles are free. Verification and relationship confirmations are separate trust layers.";

    complete = true;
    observer?.disconnect();
    return true;
  }

  if (apply()) return;
  observer = new MutationObserver(() => apply());
  observer.observe(document.getElementById("app") || document.body, {childList:true,subtree:true});
  setTimeout(() => observer?.disconnect(), 12000);
})();
