import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");

test("audience browser scripts parse", async () => {
  for (const path of [
    "public/pageantindex-audience.js",
    "public/pageantindex-organizer-preflight.js",
    "public/pageantindex-organizer.js",
    "public/pageantindex-organizer-publishing.js",
    "public/pageantindex-organizer-form-guards.js",
    "public/pageantindex-submission-controls.js",
    "public/pageantindex-admin-moderation.js",
    "public/pageantindex-admin-results.js",
    "app/audience.js",
    "app/organizer.js",
    "app/pageant-data.js",
  ]) {
    const result = spawnSync(process.execPath, ["--check", join(root, path)], {encoding: "utf8"});
    assert.equal(result.status, 0, `${path}\n${result.stderr}`);
  }
});

test("configuration defines five distinct audience types", async () => {
  const config = await read("public/pageantindex-config.js");
  for (const role of ["enthusiast", "candidate", "supplier", "media", "organizer"]) {
    assert.match(config, new RegExp(`value: "${role}"`));
  }
  assert.match(config, /mediaRoles/);
  assert.match(config, /organizerTypes/);
  assert.match(config, /share stories to other platforms/);
  assert.match(config, /official pageant profile/);
  assert.match(config, /guestAccessDisclosure/);
  assert.match(config, /merchandise checkout/);
  assert.match(config, /pay-per-view access/);
  assert.match(config, /public voting/);
});

test("public menu remains concise and covers the ecosystem", async () => {
  const config = await read("public/pageantindex-config.js");
  for (const label of ["Home", "Suppliers", "Candidates", "Pageants", "Media", "Announcements", "Experiences"]) {
    assert.match(config, new RegExp(`label: "${label}"`));
  }
  assert.match(config, /const appMenu = \[/);
  for (const id of ["discover", "pageants", "media", "updates", "account"]) {
    assert.match(config, new RegExp(`id: "${id}"`));
  }
});

test("website signup and workspaces support enthusiast candidate supplier and media", async () => {
  const audience = await read("public/pageantindex-audience.js");
  assert.match(audience, /data-pi-enthusiast-fields/);
  assert.match(audience, /data-pi-media-fields/);
  assert.match(audience, /candidate_current_pageant/);
  assert.match(audience, /candidate_previous_pageants/);
  assert.match(audience, /media_profile_drafts/);
  assert.match(audience, /media_articles/);
  assert.match(audience, /candidate_pageant_history/);
  assert.match(audience, /role === "supplier"/);
});

test("organizers have a distinct official pageant workflow", async () => {
  const organizer = await read("public/pageantindex-organizer.js");
  const publishing = await read("public/pageantindex-organizer-publishing.js");
  const app = await read("app/organizer.js");
  const appData = await read("app/pageant-data.js");
  const core = await read("supabase/migrations/20260803172616_pageantindex_organization_core.sql");
  const operations = await read("supabase/migrations/20260803172919_pageantindex_organization_operations.sql");
  assert.match(organizer, /data-pi-organizer-fields/);
  assert.match(organizer, /pageant_organization_drafts/);
  assert.match(organizer, /pageant_edition_drafts/);
  assert.match(organizer, /pageant_candidate_roster_drafts/);
  assert.match(organizer, /pageant_experience_requests/);
  assert.match(organizer, /organizer_announcement_requests/);
  assert.match(publishing, /Submit edition for review/);
  assert.match(publishing, /pageant_result_drafts/);
  assert.match(publishing, /renderPublicPageantData/);
  assert.match(app, /Organization tools/);
  assert.match(appData, /Approved pageant editions/);
  assert.match(core, /create table if not exists public\.pageant_organization_drafts/);
  assert.match(core, /create table if not exists public\.pageant_edition_drafts/);
  assert.match(operations, /create table if not exists public\.pageant_candidate_roster_drafts/);
  assert.match(operations, /experience_type in \('voting','livestream','pay_per_view','tickets','merchandise'\)/);
  assert.match(operations, /guest_access_requested boolean not null default true/);
  assert.match(operations, /create table if not exists public\.pageant_result_drafts/);
  assert.match(core, /Public reads approved pageant editions/);
  assert.match(operations, /Public reads approved pageant experiences/);
});

test("owners can explicitly submit reviewed media and organizer drafts", async () => {
  const controls = await read("public/pageantindex-submission-controls.js");
  const loader = await read("public/seo.js");
  for (const term of [
    "media_profile_drafts", "media_articles", "pageant_organization_drafts",
    "pageant_edition_drafts", "pageant_experience_requests",
    "organizer_announcement_requests", "submission_state: \"submitted\"",
  ]) assert.match(controls, new RegExp(term));
  assert.match(controls, /Submit media work for approval/);
  assert.match(controls, /Submit pageant records for approval/);
  assert.match(loader, /pageantindex-submission-controls\.js/);
  assert.match(loader, /pageantindex-submission-controls\.css/);
});

test("admin moderation covers every reviewed audience and content type", async () => {
  const admin = await read("public/pageantindex-admin-moderation.js");
  const adminResults = await read("public/pageantindex-admin-results.js");
  const migration = await read("supabase/migrations/20260803173041_pageantindex_admin_functions.sql");
  const loader = await read("public/seo.js");
  for (const term of [
    "media_profile_drafts", "media_articles", "pageant_organization_drafts",
    "pageant_edition_drafts", "organizer_announcement_requests",
    "pageant_experience_requests", "announcements", "featured_ads",
  ]) assert.match(admin, new RegExp(term));
  assert.match(admin, /Audience and content moderation/);
  assert.match(admin, /Approve and publish/);
  assert.match(adminResults, /pageant_result_drafts/);
  assert.match(adminResults, /admin_review_pageant_result/);
  assert.match(migration, /admin_review_pageant_edition/);
  assert.match(migration, /admin_review_pageant_experience/);
  assert.match(migration, /admin_review_organizer_announcement/);
  assert.match(migration, /private\.pageantindex_admin_review/);
  assert.match(migration, /security invoker/i);
  assert.match(loader, /pageantindex-organizer-preflight\.js/);
  assert.match(loader, /pageantindex-organizer-publishing\.js/);
  assert.match(loader, /pageantindex-organizer-form-guards\.js/);
  assert.match(loader, /pageantindex-admin-moderation\.js/);
  assert.match(loader, /pageantindex-admin-results\.js/);
  assert.match(loader, /pageantindex-admin-moderation\.css/);
});

test("common supplier announcements and featured content are visible to all audiences", async () => {
  const website = await read("public/pageantindex-audience.js");
  const app = await read("app/audience.js");
  for (const source of [website, app]) {
    assert.match(source, /announcements/);
    assert.match(source, /featured_ads/);
    assert.match(source, /Supplier directory|Find Suppliers|Find suppliers/);
  }
});

test("media articles are reviewed and shareable", async () => {
  const website = await read("public/pageantindex-audience.js");
  const app = await read("app/audience.js");
  const media = await read("supabase/migrations/20260803172436_pageantindex_media_content.sql");
  const admin = await read("supabase/migrations/20260803173041_pageantindex_admin_functions.sql");
  assert.match(website, /data-share-article/);
  assert.match(app, /data-app-share/);
  assert.match(media, /create table if not exists public\.media_articles/);
  assert.match(media, /review_state = 'approved'/);
  assert.match(media, /is_shareable boolean/);
  assert.match(admin, /admin_review_media_article/);
});

test("candidate current and previous pageants have a protected model", async () => {
  const migration = await read("supabase/migrations/20260803172305_pageantindex_profiles.sql");
  assert.match(migration, /create table if not exists public\.candidate_pageant_history/);
  assert.match(migration, /participation_type in \('current','previous'\)/);
  assert.match(migration, /is_public boolean not null default false/);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
  assert.doesNotMatch(migration, /private_notes/);
});

test("public audience routes exist with useful metadata", async () => {
  const routes = {
    "candidates/index.html": "Candidates | Pageant Index",
    "media/index.html": "Media | Pageant Index",
    "announcements/index.html": "Announcements | Pageant Index",
    "experiences/index.html": "Voting, Pay-Per-View and Merch | Pageant Index",
  };
  for (const [path, title] of Object.entries(routes)) {
    const html = await read(path);
    assert.match(html, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(html, /<meta name="viewport"/);
    assert.match(html, /public\/seo\.js/);
  }
});

test("mobile-first app keeps five universal tabs and responsive layouts", async () => {
  const app = await read("app/audience.js");
  const css = await read("app/audience.css");
  const html = await read("app/index.html");
  assert.match(app, /config\.appMenu/);
  assert.match(app, /data-screen="media"/);
  assert.match(app, /data-screen="updates"/);
  assert.match(css, /@media\(min-width:720px\)/);
  assert.match(css, /@media\(min-width:980px\)/);
  assert.match(html, /app\/audience\.css/);
  assert.match(html, /app\/audience\.js/);
  assert.match(html, /app\/organizer\.js/);
  assert.match(html, /app\/pageant-data\.js/);
});

test("sitemap includes audience and public experience routes", async () => {
  const sitemap = await read("sitemap.xml");
  for (const path of ["candidates", "media", "announcements", "experiences"]) {
    assert.match(sitemap, new RegExp(`pageantindex\\.com/${path}/`));
  }
});
