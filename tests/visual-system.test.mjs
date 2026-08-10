import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("global experience carries the PageantIndex positioning and relationship system", async () => {
  const pages = await read("public/global-pages.js");
  assert.match(pages, /The Global Network for Pageantry\./);
  assert.match(pages, /One industry\. Connected\./);
  assert.match(pages, /Your pageant history, structured\./);
  assert.match(pages, /Build your pageant identity/);
  assert.match(pages, /Identity Verified/);
  assert.match(pages, /Organization Confirmed/);
  assert.match(pages, /Candidate Confirmed/);
  assert.match(pages, /Professional Credit Confirmed/);
  assert.doesNotMatch(pages, /star rating|★★★★★/i);
});

test("visual tokens, responsive recomposition, focus, and reduced motion are explicit", async () => {
  const css = await read("public/global-system.css");
  for (const token of ["#ffffff", "#111014", "#f31676", "#c9a45b", "#e8e5e9"]) {
    assert.match(css.toLowerCase(), new RegExp(token));
  }
  for (const breakpoint of ["1280px", "1060px", "768px", "430px"]) {
    assert.match(css, new RegExp(`max-width: ${breakpoint}`));
  }
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /translateY\(100%\)/);
});

test("live competition and commerce routes preserve their production scripts", async () => {
  const routes = {
    "event/index.html": "live-event.js",
    "vote/index.html": "live-vote.js",
    "tickets/index.html": "live-commerce.js",
    "livestream/index.html": "live-commerce.js",
    "merchandise/index.html": "live-commerce.js",
    "judge/index.html": "live-judge.js",
    "tabulation/index.html": "live-tabulation.js",
    "report/index.html": "pageantindex-report.js",
  };
  for (const [path, script] of Object.entries(routes)) {
    const html = await read(path);
    assert.match(html, new RegExp(script.replace(".", "\\.")));
    assert.match(html, /operational-system\.css/);
  }
});

test("founder console excludes routine support and exposes strategic sections", async () => {
  const html = await read("founder/index.html");
  assert.match(html, /Confirmed revenue/);
  assert.match(html, /Renewals at risk/);
  assert.match(html, /STRATEGIC PIPELINE/);
  assert.match(html, /TERRITORY \/ FRANCHISE PIPELINE/);
  assert.match(html, /CRITICAL ESCALATIONS/);
  assert.match(html, /Routine support never appears/);
  assert.doesNotMatch(html, /Support risk/);
});

test("public record shells expose the intended identity types", async () => {
  const routes = {
    "directory/index.html": "directory",
    "candidates/index.html": "candidates",
    "candidate-profile/index.html": "candidate",
    "organizations/index.html": "organizations",
    "organization-profile/index.html": "organization",
    "sign-up/index.html": "signup",
  };
  for (const [path, page] of Object.entries(routes)) {
    const html = await read(path);
    assert.match(html, new RegExp(`data-page="${page}"`));
    assert.match(html, /public\/app\.js/);
  }
});

test("all global page renderers execute without fabricated backing data", async () => {
  const source = await read("public/global-pages.js");
  const window = {};
  const context = {
    window,
    path: "/",
    page: "home",
    profiles: [],
    categories: [["Photography"], ["Pageant Directors"]],
    locations: [],
    escapeHtml: (value) => String(value ?? ""),
    safeHttpUrl: (value, fallback) => value || fallback,
    submitIntake: async () => {},
    URLSearchParams,
    crypto,
    console,
  };
  vm.runInNewContext(source, context);
  const pages = window.PageantIndexGlobal;
  for (const render of [
    pages.home,
    pages.directory,
    pages.professionalProfile,
    pages.candidates,
    pages.candidateProfile,
    pages.organizations,
    pages.organizationProfile,
    pages.events,
    pages.edition,
    pages.judge,
    pages.tabulation,
    pages.trust,
    pages.report,
  ]) {
    assert.equal(typeof render(), "string");
  }
  for (const kind of ["voting", "tickets", "livestream", "merchandise"]) assert.equal(typeof pages.commerce(kind), "string");
  for (const mode of ["signin", "signup"]) assert.equal(typeof pages.account(mode), "string");
});
