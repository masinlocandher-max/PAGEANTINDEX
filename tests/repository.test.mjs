import assert from "node:assert/strict";
import {readdir, readFile, stat} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {dirname, extname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function filesUnder(directory, extension) {
  const entries = await readdir(directory, {withFileTypes: true});
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return filesUnder(path, extension);
    return extname(entry.name) === extension ? [path] : [];
  }));
  return nested.flat();
}

test("browser JavaScript parses", async () => {
  const scripts = await filesUnder(join(root, "public"), ".js");
  for (const script of scripts) {
    const result = spawnSync(process.execPath, ["--check", script], {encoding: "utf8"});
    assert.equal(result.status, 0, `${script}\n${result.stderr}`);
  }
});

test("HTML shells include metadata and valid local references", async () => {
  const pages = await filesUnder(root, ".html");
  assert.ok(pages.length >= 20, "Expected the complete static route set");
  for (const page of pages) {
    const html = await readFile(page, "utf8");
    assert.match(html, /<title>[^<]+<\/title>/i, `${page} is missing a title`);
    assert.match(html, /<meta\s+name=["']description["'][^>]+content=["'][^"']+/i, `${page} is missing a meta description`);
    const references = [...html.matchAll(/(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);
    for (const reference of references) {
      if (!reference.startsWith("/") || reference.startsWith("//")) continue;
      const clean = reference.split(/[?#]/)[0];
      const target = clean.endsWith("/") ? join(root, clean, "index.html") : join(root, clean);
      await assert.doesNotReject(stat(target), `${page} references missing ${clean}`);
    }
  }
});

test("public workflows persist honestly", async () => {
  const app = await readFile(join(root, "public", "app.js"), "utf8");
  assert.match(app, /rest\/v1\/intake_submissions/);
  assert.match(app, /rest\/v1\/professional_profile_drafts/);
  assert.match(app, /validateStoredSession/);
  assert.match(app, /Professional sign-in required/);
  assert.doesNotMatch(app, /pi_inquiries|pi_campaign_request/);
  assert.doesNotMatch(app, /Password recovery will activate/);
  assert.doesNotMatch(app, /Welcome back, Alon|Mariel Santos|128 verified reviews/);
  assert.doesNotMatch(app, /p\.rating|p\.reviews|function inquiryForm/);
  assert.doesNotMatch(app, /\son[a-z]+=/i);
  assert.match(app, /safeHttpUrl/);
  assert.doesNotMatch(app, /service_role/i);
});

test("Supabase migrations preserve trust boundaries", async () => {
  const migration = await readFile(
    join(root, "supabase", "migrations", "20260731215441_add_pageantindex_intake_and_profile_drafts.sql"),
    "utf8",
  );
  assert.match(migration, /alter table public\.intake_submissions enable row level security/i);
  assert.match(migration, /alter table public\.professional_profile_drafts enable row level security/i);
  assert.match(migration, /app_metadata' ->> 'role'\) = 'admin'/i);
  assert.match(migration, /'pageant-profile-drafts'[\s\S]+false/i);
  assert.doesNotMatch(migration, /user_metadata/i);
  assert.doesNotMatch(migration, /for select\s+to anon[\s\S]+intake_submissions/i);
});

test("future schema cannot grant owner-controlled trust", async () => {
  const schema = await readFile(join(root, "supabase", "schema.sql"), "utf8");
  assert.match(schema, /Future platform reference schema/);
  assert.match(schema, /app_metadata/);
  assert.match(schema, /revoke update on public\.profiles from authenticated/i);
  assert.match(schema, /inquiry_id is not null/);
  assert.doesNotMatch(schema, /select role from public\.users/i);
  assert.doesNotMatch(schema, /reviewer_user_id=auth\.uid\(\) or public\.can_moderate/i);
  assert.doesNotMatch(schema, /verification_admin_update/i);
});

test("Vercel applies baseline security headers", async () => {
  const config = JSON.parse(await readFile(join(root, "vercel.json"), "utf8"));
  const headers = Object.fromEntries(config.headers[0].headers.map(({key, value}) => [key, value]));
  assert.match(headers["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.match(headers["Content-Security-Policy"], /uwcqvsitjtknxsaypjxj\.supabase\.co/);
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.match(headers["Strict-Transport-Security"], /includeSubDomains/);
});
