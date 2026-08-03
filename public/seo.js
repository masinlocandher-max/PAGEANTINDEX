"use strict";

(() => {
  const appendStyle = (href) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  };

  appendStyle("/public/pageantindex-ecosystem.css?v=20260803");
  appendStyle("/public/pageantindex-audience.css?v=20260803-3");
  appendStyle("/public/pageantindex-organizer.css?v=20260803");
  appendStyle("/public/pageantindex-submission-controls.css?v=20260803");
  appendStyle("/public/pageantindex-admin-moderation.css?v=20260803");

  const appendScript = (src, onload) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (onload) script.onload = onload;
    document.head.appendChild(script);
  };

  appendScript("/public/pageantindex-auth-readiness.js?v=20260804", () => {
    appendScript("/public/pageantindex-config.js?v=20260803-3", () => {
      appendScript("/public/pageantindex-preflight.js?v=20260803", () => {
        appendScript("/public/pageantindex-organizer-preflight.js?v=20260803", () => {
          appendScript("/public/pageantindex-organizer.js?v=20260803", () => {
            appendScript("/public/pageantindex-audience.js?v=20260803-2", () => {
              appendScript("/public/pageantindex-organizer-publishing.js?v=20260803", () => {
                appendScript("/public/pageantindex-organizer-form-guards.js?v=20260803", () => {
                  appendScript("/public/pageantindex-submission-controls.js?v=20260803", () => {
                    appendScript("/public/pageantindex-ecosystem.js?v=20260803", () => {
                      appendScript("/public/pageantindex-admin-moderation.js?v=20260803", () => {
                        appendScript("/public/pageantindex-admin-results.js?v=20260803", () => {
                          appendScript("/public/pageantindex-session-controls.js?v=20260804");
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

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
    author: {"@type": "Organization", name: "Pageant Index Editorial"},
    publisher: {
      "@type": "Organization",
      name: "Pageant Index",
      logo: {"@type": "ImageObject", url: `${origin}/public/images/pageant-icon.png`}
    },
    mainEntityOfPage: `${origin}${location.pathname}`
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
})();
