"use strict";
(() => {
  document.body.classList.add("pi-v2");
  const header = document.querySelector(".site-header");
  if (header) header.outerHTML = `<header class="pi-launch-header"><div class="inner"><a class="pi-wordmark" href="/"><img src="/public/images/pageant-icon.png" alt=""><div><strong>PageantIndex</strong><span>The Global Network for Pageantry</span></div></a><nav><a href="/directory/">Search the Index</a><a href="/#how-it-works">How it works</a><a href="/#trust">Trust & confirmations</a></nav><div class="pi-header-actions"><a class="pi-button secondary" href="/sign-in/">Sign in</a><a class="pi-button primary" href="/sign-up/">Create profile</a></div></div></header>`;
  document.querySelector(".announcement-bar")?.remove();
  const hero = document.querySelector(".page-hero");
  if (hero) {
    const h1 = hero.querySelector("h1");
    const p = hero.querySelector("p");
    if (h1) h1.textContent = "Claim a PageantIndex profile.";
    if (p) p.textContent = "If a profile already represents you, your business, or your pageant organization, submit a private ownership claim instead of creating a duplicate identity.";
  }
  const card = document.querySelector(".form-card");
  if (card) {
    const h2 = card.querySelector("h2");
    const p = card.querySelector(".section-copy");
    if (h2) h2.textContent = "Request profile ownership";
    if (p) p.textContent = "PageantIndex reviews ownership evidence privately. Claim approval controls account access; it does not create verification or relationship-confirmation status.";
  }
  const footer = document.querySelector(".site-footer");
  if (footer) footer.outerHTML = `<footer class="pi-launch-footer"><div class="pi-container inner"><span>© 2026 PageantIndex. One global platform, one relationship graph.</span><span>Philippines is the first actively populated market.</span></div></footer>`;
  document.title = "Claim a Profile | PageantIndex";
})();
