import assert from "node:assert/strict";
import {readFile, readdir} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");

function updateGrant(sql, table) {
  const pattern = new RegExp(`grant update \\(([^)]*)\\)\\s+on public\\.${table} to authenticated;`, "i");
  return sql.match(pattern)?.[1] || "";
}

test("organizer, public pageant, and result moderation scripts parse", async () => {
  for (const path of [
    "public/pageantindex-organizer-preflight.js",
    "public/pageantindex-organizer-publishing.js",
    "public/pageantindex-organizer-form-guards.js",
    "public/pageantindex-admin-results.js",
    "app/pageant-data.js",
  ]) {
    const result = spawnSync(process.execPath, ["--check", join(root, path)], {encoding: "utf8"});
    assert.equal(result.status, 0, `${path}\n${result.stderr}`);
  }
});

test("Supabase migration versions are unique and ordered", async () => {
  const files = (await readdir(join(root, "supabase/migrations")))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const versions = files.map((name) => name.match(/^(\d{14})_/)?.[1]).filter(Boolean);
  assert.equal(new Set(versions).size, versions.length, `Duplicate migration version found: ${files.join(", ")}`);
  assert.deepEqual(versions, [...versions].sort());
  for (const required of [
    "20260803171500_admin_moderation_extensions.sql",
    "20260803171900_prepare_organizer_review_hardening.sql",
    "20260803172000_harden_pageant_organizer_reviews.sql",
    "20260803173000_fix_public_pageant_column_grants.sql",
    "20260803174000_admin_rpc_compatibility.sql",
  ]) assert.ok(files.includes(required), `${required} is required`);
});

test("organizer owners cannot write review or publication controls", async () => {
  const sql = await read("supabase/migrations/20260803172000_harden_pageant_organizer_reviews.sql");
  for (const table of [
    "pageant_organization_drafts",
    "pageant_edition_drafts",
    "pageant_experience_requests",
    "organizer_announcement_requests",
    "pageant_result_drafts",
  ]) {
    const columns = updateGrant(sql, table);
    assert.ok(columns, `Missing column-scoped update grant for ${table}`);
    assert.doesNotMatch(columns, /review_state|published_at|published_announcement_id|organizer_user_id/i);
  }
  assert.doesNotMatch(sql, /grant select, insert, update, delete on public\.pageant_edition_drafts/i);
  assert.match(sql, /Public reads approved pageant editions/);
  assert.match(sql, /Public reads approved pageant experiences/);
  assert.match(sql, /Public reads approved official results/);
});

test("organizer records must belong to the signed-in organizer and owned edition", async () => {
  const sql = await read("supabase/migrations/20260803172000_harden_pageant_organizer_reviews.sql");
  assert.match(sql, /pageantindex_is_organizer\(\(select auth\.uid\(\)\)\)/);
  assert.match(sql, /edition\.organizer_user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /create roster drafts for their editions/i);
  assert.match(sql, /experience requests for their editions/i);
  assert.match(sql, /results for their editions/i);
});

test("admin RPC names match the PostgREST client payloads", async () => {
  const compatibility = await read("supabase/migrations/20260803174000_admin_rpc_compatibility.sql");
  const admin = await read("public/pageantindex-admin-moderation.js");
  const results = await read("public/pageantindex-admin-results.js");
  assert.match(compatibility, /admin_review_pageant_edition\(\s*edition_id uuid/);
  assert.match(compatibility, /admin_review_pageant_experience\(\s*request_id uuid/);
  assert.match(compatibility, /admin_review_organizer_announcement\(\s*request_id uuid/);
  assert.match(admin, /edition_id: id/);
  assert.match(admin, /request_id: id/);
  assert.match(results, /result_record_id: button\.dataset\.resultId/);
});

test("website loaders protect organizers before generic role routing", async () => {
  const loader = await read("public/seo.js");
  const order = [
    "pageantindex-organizer-preflight.js",
    "pageantindex-organizer.js",
    "pageantindex-audience.js",
    "pageantindex-organizer-publishing.js",
    "pageantindex-organizer-form-guards.js",
    "pageantindex-submission-controls.js",
    "pageantindex-ecosystem.js",
    "pageantindex-admin-moderation.js",
    "pageantindex-admin-results.js",
  ].map((name) => loader.indexOf(name));
  assert.ok(order.every((index) => index >= 0), "Every ecosystem script must be loaded");
  assert.deepEqual(order, [...order].sort((a, b) => a - b), "Organizer protection and review scripts must load in safe order");
});

test("public website and app only request approved pageant data", async () => {
  const website = await read("public/pageantindex-organizer-publishing.js");
  const app = await read("app/pageant-data.js");
  for (const source of [website, app]) {
    assert.match(source, /review_state=eq\.approved/);
    assert.match(source, /submission_state=eq\.submitted/);
    assert.match(source, /published_at=not\.is\.null/);
    assert.match(source, /pageant_edition_drafts/);
    assert.match(source, /pageant_experience_requests/);
  }
  assert.match(app, /pageant_result_drafts/);
  assert.match(await read("app/index.html"), /app\/pageant-data\.js/);
});

test("documentation describes the five-audience reviewed ecosystem", async () => {
  const readme = await read("README.md");
  assert.match(readme, /Five clear account types/);
  assert.match(readme, /Pageant Organization/);
  assert.match(readme, /official result/i);
  assert.match(readme, /Organizer owner/);
});
