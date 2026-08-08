"use strict";
(() => {
  const style = document.createElement("style");
  style.textContent = `
    @media(max-width:820px){
      .pi-launch-header.pi-mobile-open{height:auto}
      .pi-launch-header.pi-mobile-open .inner{flex-wrap:wrap;padding-bottom:12px}
      .pi-launch-header.pi-mobile-open nav{display:grid!important;order:4;width:100%;grid-template-columns:1fr;border-top:1px solid var(--pi-line);padding-top:9px;gap:0}
      .pi-launch-header.pi-mobile-open nav a{padding:11px 2px;border-bottom:1px solid var(--pi-line);font-size:.72rem}
      .pi-launch-header.pi-mobile-open nav a:last-child{border-bottom:0}
      .pi-header-menu svg{width:20px;height:20px;display:block}
    }`;
  document.head.appendChild(style);

  function enhanceButtons(root = document) {
    root.querySelectorAll?.(".pi-header-menu").forEach(button => {
      if (button.dataset.piNavReady) return;
      button.dataset.piNavReady = "true";
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
    });
  }

  enhanceButtons();
  const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
    if (node.nodeType === 1) enhanceButtons(node);
  })));
  observer.observe(document.documentElement, {childList:true,subtree:true});

  document.addEventListener("click", event => {
    const button = event.target.closest?.(".pi-header-menu");
    if (!button) return;
    const header = button.closest(".pi-launch-header");
    if (!header) return;
    const open = !header.classList.contains("pi-mobile-open");
    header.classList.toggle("pi-mobile-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  document.addEventListener("click", event => {
    const link = event.target.closest?.(".pi-launch-header nav a");
    if (!link) return;
    const header = link.closest(".pi-launch-header");
    header?.classList.remove("pi-mobile-open");
    header?.querySelector(".pi-header-menu")?.setAttribute("aria-expanded", "false");
  });
})();
