"use strict";

(() => {
  if (document.body.dataset.page !== "admin") return;
  let reloaded = false;

  function initializeWhenReady() {
    if (reloaded || !document.querySelector(".product-sidebar")) return false;
    reloaded = true;
    const script = document.createElement("script");
    script.src = "/public/admin-events.js?workspace=ready";
    script.defer = true;
    document.body.appendChild(script);
    return true;
  }

  if (initializeWhenReady()) return;
  const observer = new MutationObserver(() => {
    if (initializeWhenReady()) observer.disconnect();
  });
  observer.observe(document.getElementById("app"), {childList:true, subtree:true});
  setTimeout(() => observer.disconnect(), 10000);
})();
