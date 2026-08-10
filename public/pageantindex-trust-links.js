"use strict";

(() => {
  function addLinks() {
    const footer = document.querySelector(".site-footer");
    if (!footer || footer.querySelector("[data-pi-trust-links]")) return;
    const holder = document.createElement("div");
    holder.dataset.piTrustLinks = "true";
    holder.className = "pi-trust-links";
    holder.innerHTML = '<a href="/trust/">Trust & verification standards</a><a href="/report/">Report a concern</a><a href="/ranking-methodology/">Ranking methodology</a><a href="/about/#privacy">Privacy</a>';
    const bottom = footer.querySelector(".footer-bottom") || footer.lastElementChild || footer;
    bottom.insertAdjacentElement("beforebegin", holder);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addLinks, {once: true});
  else addLinks();
  new MutationObserver(addLinks).observe(document.documentElement, {childList: true, subtree: true});
})();
