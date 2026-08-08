"use strict";
(() => {
  const body = document.body;
  if (!body) return;
  const page = body.dataset.page || "";
  const configs = {
    directory:{selector:".directory-intro",marker:"Search the global pageant industry.",script:"/public/launch-v2.js"},
    dashboard:{selector:".product-topbar, .admin-auth-shell",marker:"Profile Dashboard",script:"/public/launch-v2.js"},
    signin:{selector:".auth-card",marker:"Welcome back",script:"/public/launch-v2.js"},
    signup:{selector:".auth-card",marker:"Create your PageantIndex profile",script:"/public/launch-v2.js"},
    claim:{selector:".page-hero, .form-card",marker:"Claim a PageantIndex profile.",script:"/public/claim-v2.js"},
  };
  const config = configs[page];
  if (!config) return;
  let retried = false;
  let observer;

  const currentText = () => document.body?.innerText || "";
  const ready = () => Boolean(document.querySelector(config.selector));
  const satisfied = () => currentText().includes(config.marker);

  function retryOnce() {
    if (retried || !ready() || satisfied()) return;
    retried = true;
    const script = document.createElement("script");
    script.src = `${config.script}?ready=${Date.now()}`;
    script.async = true;
    script.dataset.launchV2Retry = "true";
    document.body.appendChild(script);
    observer?.disconnect();
  }

  if (ready()) {
    setTimeout(retryOnce, 80);
    return;
  }
  observer = new MutationObserver(() => retryOnce());
  observer.observe(document.documentElement, {childList:true,subtree:true});
  setTimeout(() => observer?.disconnect(), 12000);
})();
