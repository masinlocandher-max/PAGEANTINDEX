import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");

const browserScripts = [
  "public/pageantindex-config.js",
  "public/pageantindex-preflight.js",
  "public/pageantindex-ecosystem.js",
  "public/seo.js",
  "app/app.js",
  "app/auth.js",
];

test("global ecosystem browser scripts parse", async () => {
  for (const path of browserScripts) {
    const result = spawnSync(process.execPath, ["--check", join(root, path)], {encoding: "utf8"});
    assert.equal(result.status, 0, `${path}\n${result.stderr}`);
  }
});

test("shared configuration preserves simple account types and complete supplier categories", async () => {
  const config = await read("public/pageantindex-config.js");
  assert.match(config, /value: "candidate", label: "Candidate"/);
  assert.match(config, /value: "supplier", label: "Supplier"/);
  assert.doesNotMatch(config, /general-user|business-organization|creative-supplier/);
  assert.match(config, /"Photographer"/);
  assert.match(config, /"Videographer"/);
  assert.match(config, /"Hotel \/ Accommodation"/);
  assert.match(config, /"Flights \/ Airline \/ Travel Agency"/);
  const codeList = config.match(/const COUNTRY_CODES = "([A-Z,]+)"/)?.[1].split(",") || [];
  assert.ok(codeList.length >= 240, `Expected complete country coverage, found ${codeList.length}`);
});

test("supplier onboarding supports primary and additional categories", async () => {
  const ecosystem = await read("public/pageantindex-ecosystem.js");
  assert.match(ecosystem, /supplier_primary_category/);
  assert.match(ecosystem, /supplier_additional_categories/);
  assert.match(ecosystem, /Photographer and Videographer remain separate/);
  assert.match(ecosystem, /selectedAdditionalCategories/);
  assert.match(ecosystem, /supplier_category_other/);
});

test("candidate and supplier records have separate protected models", async () => {
  const foundation = await read("supabase/migrations/20260803172117_pageantindex_foundation.sql");
  const profiles = await read("supabase/migrations/20260803172305_pageantindex_profiles.sql");
  const operations = await read("supabase/migrations/20260803172919_pageantindex_organization_operations.sql");
  assert.match(foundation, /create table if not exists public\.user_profiles/);
  assert.match(foundation, /'enthusiast','candidate','supplier','media','organizer'/);
  assert.match(profiles, /create table if not exists public\.candidate_profile_drafts/);
  assert.match(profiles, /create table if not exists public\.professional_profile_drafts/);
  assert.match(profiles, /additional_categories text\[\]/);
  assert.match(foundation, /alter table public\.user_profiles enable row level security/);
  assert.match(profiles, /alter table public\.candidate_profile_drafts enable row level security/);
  assert.match(operations, /create table if not exists public\.saved_supplier_profiles/);
  assert.match(operations, /create table if not exists public\.saved_pageant_events/);
  assert.match(operations, /event_id uuid not null references public\.pageant_edition_drafts/);
  assert.doesNotMatch(operations, /references public\.events/);
});

test("published supplier model contains global directory fields", async () => {
  const migration = await read("supabase/migrations/20260803172117_pageantindex_foundation.sql");
  assert.match(migration, /add column if not exists primary_category/);
  assert.match(migration, /add column if not exists additional_categories/);
  assert.match(migration, /add column if not exists country_code/);
  assert.match(migration, /add column if not exists country_name/);
  assert.match(migration, /suppliers_global_discovery_idx/);
});

test("mobile-first application uses real data and contains no prototype people or metrics", async () => {
  const app = await read("app/app.js");
  assert.match(app, /rest\/v1\/suppliers/);
  assert.match(app, /rest\/v1\/saved_supplier_profiles/);
  assert.match(app, /status=eq\.published/);
  assert.doesNotMatch(app, /Mark Nicdao|Jigs Mayuga|Furne One|Emil Ocampo|Maria Santos|Kevin B\./);
  assert.doesNotMatch(app, /2,458|8,765|128 reviews|98%|★ 5\.0/);
  assert.match(app, /does not display invented ratings, reviews, businesses, or activity/);
});

test("mobile-first layout retains mobile and desktop optimization", async () => {
  const html = await read("app/index.html");
  const css = await read("app/app.css");
  assert.match(html, /viewport-fit=cover/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /@media\(min-width:720px\)/);
  assert.match(css, /@media\(min-width:980px\)/);
  assert.match(css, /bottom-nav/);
  assert.match(css, /desktop-sidebar/);
});

test("global identity is static in critical metadata", async () => {
  const paths = [
    "index.html",
    "directory/index.html",
    "categories/index.html",
    "locations/index.html",
    "pageant-calendar/index.html",
    "sign-in/index.html",
    "sign-up/index.html",
    "list-your-business/index.html",
    "manifest.webmanifest",
  ];
  for (const path of paths) {
    const content = await read(path);
    assert.doesNotMatch(content, /PageantIndex Philippines|Pageant Index Philippines|across the Philippines/,
      `${path} still contains Philippines-only brand positioning`);
  }
  const home = await read("index.html");
  assert.match(home, /The Global Network for Pageantry/);
  assert.match(home, /"areaServed": "Worldwide"/);
});

test("shared loader and app-host routing are configured", async () => {
  const seo = await read("public/seo.js");
  assert.match(seo, /pageantindex-config\.js/);
  assert.match(seo, /pageantindex-preflight\.js/);
  assert.match(seo, /pageantindex-ecosystem\.js/);
  const deploymentConfig = JSON.parse(await read("vercel.json"));
  assert.ok(deploymentConfig.rewrites.some((rewrite) => rewrite.destination === "/app/index.html"));
  assert.ok(deploymentConfig.rewrites.some((rewrite) => rewrite.has?.some((condition) => condition.type === "host" && condition.value === "app.pageantindex.com")));
});
