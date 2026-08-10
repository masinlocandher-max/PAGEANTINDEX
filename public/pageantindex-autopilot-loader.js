"use strict";
(() => {
  if (!document.querySelector('link[href^="/public/pageantindex-trust.css"]')) {
    const style=document.createElement("link"); style.rel="stylesheet"; style.href="/public/pageantindex-trust.css?v=20260810"; document.head.appendChild(style);
  }
  for (const src of ["/public/pageantindex-analytics.js?v=20260810","/public/pageantindex-trust-links.js?v=20260810"]) {
    if (document.querySelector(`script[src="${src}"]`)) continue;
    const script=document.createElement("script"); script.src=src; script.defer=true; document.head.appendChild(script);
  }
})();
