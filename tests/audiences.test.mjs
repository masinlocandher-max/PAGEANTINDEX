import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");

test("audience browser scripts parse", async () => {
  for (const path of ["public/pageantindex-audience.js", "app/audience.js"]) {
    const result = spawnSync(process.execPath, ["--check", join(root, path)], {encoding: "utf8"});
    assert.equal(result.status, 0, `${path}\n${result.stderr}`);
  }
});

test("configuration defines four distinct audience types", async () => {
  const config = await read("public/pageantindex-config.js");
  for (const role of ["enthusiast", "candidate", "supplier", "media"]) {
    assert.match(config, new RegExp(`value: "${role}"`));
  }
  assert.match(config, /mediaRoles/);
  assert.match(config, /mediaTypes/);
  assert.match(config, /share stories to other platforms/);
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

test("website signup and workspaces support every role", async () => {
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
  const migration = await read("supabase/migrations/20260803170000_expand_audiences_media_content.sql");
  assert.match(website, /data-share-article/);
  assert.match(app, /data-app-share/);
  assert.match(migration, /create table if not exists public\.media_articles/);
  assert.match(migration, /review_state = 'approved'/);
  assert.match(migration, /is_shareable boolean/);
  assert.match(migration, /admin_review_media_article/);
});

test("candidate current and previous pageants have a protected model", async () => {
  const migration = await read("supabase/migrations/20260803170000_expand_audiences_media_content.sql");
  assert.match(migration, /create table if not exists public\.candidate_pageant_history/);
  assert.match(migration, /participation_type in \('current','previous'\)/);
  assert.match(migration, /is_public boolean not null default false/);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
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
});

test("sitemap includes audience and public experience routes", async () => {
  const sitemap = await read("sitemap.xml");
  for (const path of ["candidates", "media", "announcements", "experiences"]) {
    assert.match(sitemap, new RegExp(`pageantindex\\.com/${path}/`));
  }
});
