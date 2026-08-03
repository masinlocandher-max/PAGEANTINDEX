"use strict";

(() => {
  const ecosystemStyle = document.createElement("link");
  ecosystemStyle.rel = "stylesheet";
  ecosystemStyle.href = "/public/pageantindex-ecosystem.css?v=20260803";
  document.head.appendChild(ecosystemStyle);

  const configScript = document.createElement("script");
  configScript.src = "/public/pageantindex-config.js?v=20260803";
  configScript.onload = () => {
    const ecosystemScript = document.createElement("script");
    ecosystemScript.src = "/public/pageantindex-ecosystem.js?v=20260803";
    ecosystemScript.defer = true;
    document.head.appendChild(ecosystemScript);
  };
  document.head.appendChild(configScript);

  const origin = "https://www.pageantindex.com";
  const articleData = {
    "/articles/choose-pageant-photographer/": {
      headline: "How to Choose a Pageant Photographer",
      description: "A practical guide to portfolios, usage rights, delivery timelines, direction style, and event coverage.",
      image: "/public/images/guide-photographer.webp",
      published: "2026-07-25"
    },
    "/articles/coronation-production-checklist/": {
      headline: "Complete Coronation Production Checklist",
      description: "A production-ready checklist covering stage, lights, audio, livestream, rehearsals, safety, and contingencies.",
      image: "/public/images/guide-production.webp",
      published: "2026-07-22"
    },
    "/articles/hiring-pageant-coach/": {
      headline: "Questions to Ask Before Hiring a Pageant Coach",
      description: "What to clarify about coaching scope, ethics, preparation methods, boundaries, and expected outcomes.",
      image: "/public/images/guide-coach.webp",
      published: "2026-07-18"
    },
    "/articles/choose-gown-designer/": {
      headline: "How to Choose a Pageant Gown Designer",
      description: "How to evaluate design fit, timelines, budget, construction quality, fittings, and ownership terms.",
      image: "/public/images/guide-designer.webp",
      published: "2026-07-15"
    }
  };
  const item = articleData[location.pathname];
  if (!item) return;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: item.headline,
    description: item.description,
    image: `${origin}${item.image}`,
    datePublished: item.published,
    dateModified: "2026-08-03",
    inLanguage: "en",
    author: { "@type": "Organization", name: "Pageant Index Editorial" },
    publisher: {
      "@type": "Organization",
      name: "Pageant Index",
      logo: {
        "@type": "ImageObject",
        url: `${origin}/public/images/pageant-icon.png`
      }
    },
    mainEntityOfPage: `${origin}${location.pathname}`
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
})();
