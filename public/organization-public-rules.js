"use strict";
(() => {
  const apply = () => {
    document.querySelectorAll('a[href="/sign-up/?role=organization"]').forEach((link) => {
      link.href = "/organizations/";
      if (/create organization/i.test(link.textContent || "")) link.textContent = "Organization access by invitation";
    });
    if (document.body.dataset.page === "organizations") {
      const hero = document.querySelector(".pi-institutional-hero");
      const heading = hero?.querySelector("h1");
      const copy = hero?.querySelector("p");
      if (heading) heading.textContent = "Authoritative records for pageant organizations.";
      if (copy) copy.textContent = "Organizations are institutional records created by PageantIndex and administered by people the organization authorizes. Organization access is never a self-claimed credential.";
      const primary = hero?.querySelector('.pi-button-primary');
      if (primary) { primary.href = "/organization-claim/"; primary.textContent = "Use organization invitation"; }
      const secondary = hero?.querySelector('.pi-button-dark-outline');
      if (secondary) { secondary.href = "/sign-up/?role=organizer"; secondary.textContent = "Create organizer profile"; }
    }
    return Boolean(document.getElementById("app")?.children.length);
  };
  const observer = new MutationObserver(() => { if (apply()) observer.disconnect(); });
  observer.observe(document.documentElement, {childList:true,subtree:true});
  apply();
})();
