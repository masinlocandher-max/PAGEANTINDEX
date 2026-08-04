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

test("Supabase migration versions match the live ordered history", async () => {
  const files = (await readdir(join(root, "supabase/migrations")))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const versions = files.map((name) => name.match(/^(\d{14})_/)?.[1]).filter(Boolean);
  assert.equal(new Set(versions).size, versions.length, `Duplicate migration version found: ${files.join(", ")}`);
  assert.deepEqual(versions, [...versions].sort());
  for (const required of [
    "20260803172117_pageantindex_foundation.sql",
    "20260803172305_pageantindex_profiles.sql",
    "20260803172436_pageantindex_media_content.sql",
    "20260803172616_pageantindex_organization_core.sql",
    "20260803172919_pageantindex_organization_operations.sql",
    "20260803173041_pageantindex_admin_functions.sql",
    "20260803173134_revoke_anonymous_admin_rpc_access.sql",
    "20260803173310_isolate_admin_review_implementations.sql",
    "20260803173435_optimize_pageantindex_rls_and_indexes.sql",
  ]) assert.ok(files.includes(required), `${required} is required`);

  assert.ok(!files.some((name) => name.includes("global_candidate_supplier_ecosystem")), "Broken events dependency must not return");
  const operations = await read("supabase/migrations/20260803172919_pageantindex_organization_operations.sql");
  assert.match(operations, /references public\.pageant_edition_drafts\(id\)/);
  assert.doesNotMatch(operations, /references public\.events\(id\)/);
});

test("organizer owners cannot write review or publication controls", async () => {
  const core = await read("supabase/migrations/20260803172616_pageantindex_organization_core.sql");
  const operations = await read("supabase/migrations/20260803172919_pageantindex_organization_operations.sql");
  for (const [table, sql] of [
    ["pageant_organization_drafts", core],
    ["pageant_edition_drafts", core],
    ["pageant_experience_requests", operations],
    ["organizer_announcement_requests", operations],
    ["pageant_result_drafts", operations],
  ]) {
    const columns = updateGrant(sql, table);
    assert.ok(columns, `Missing column-scoped update grant for ${table}`);
    assert.doesNotMatch(columns, /review_state|published_at|published_announcement_id|organizer_user_id/i);
  }
  assert.doesNotMatch(core + operations, /grant select, insert, update, delete on public\.pageant_edition_drafts/i);
  assert.match(core, /Public reads approved pageant editions/);
  assert.match(operations, /Public reads approved pageant experiences/);
  assert.match(operations, /Public reads approved official results/);
});

test("organizer records belong to the signed-in organizer and owned edition", async () => {
  const core = await read("supabase/migrations/20260803172616_pageantindex_organization_core.sql");
  const operations = await read("supabase/migrations/20260803172919_pageantindex_organization_operations.sql");
  assert.match(core, /pageantindex_is_organizer\(\)/);
  assert.match(core, /organizer_user_id = \(select auth\.uid\(\)\)/);
  assert.match(operations, /edition\.organizer_user_id = \(select auth\.uid\(\)\)/);
  assert.match(operations, /create roster drafts for their editions/i);
  assert.match(operations, /experience requests for their editions/i);
  assert.match(operations, /results for their editions/i);
});

test("admin RPC names match clients and privileged logic is isolated", async () => {
  const migration = await read("supabase/migrations/20260803173041_pageantindex_admin_functions.sql");
  const revoke = await read("supabase/migrations/20260803173134_revoke_anonymous_admin_rpc_access.sql");
  const isolation = await read("supabase/migrations/20260803173310_isolate_admin_review_implementations.sql");
  const admin = await read("public/pageantindex-admin-moderation.js");
  const results = await read("public/pageantindex-admin-results.js");
  assert.match(migration, /admin_review_pageant_edition\(\s*edition_id uuid/);
  assert.match(migration, /admin_review_pageant_experience\(\s*request_id uuid/);
  assert.match(migration, /admin_review_organizer_announcement\(\s*request_id uuid/);
  assert.match(migration, /private\.pageantindex_admin_review/);
  assert.match(migration, /security definer/i);
  assert.match(migration, /security invoker/i);
  assert.match(migration, /submission_state = 'submitted'/);
  assert.match(revoke, /from anon/);
  assert.match(isolation, /not exposed through the public Data API/i);
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

test("RLS optimization separates anonymous and authenticated public reads", async () => {
  const sql = await read("supabase/migrations/20260803173435_optimize_pageantindex_rls_and_indexes.sql");
  assert.match(sql, /for select to anon/);
  assert.match(sql, /for select to authenticated/);
  assert.match(sql, /Authenticated users read pageant editions/);
  assert.match(sql, /Authenticated users read official results/);
  assert.match(sql, /saved_pageant_events_event_idx/);
  assert.match(sql, /saved_supplier_profiles_supplier_idx/);
});

test("documentation describes the live five-audience ecosystem", async () => {
  const readme = await read("README.md");
  assert.match(readme, /Five clear account types/);
  assert.match(readme, /Pageant Organization/);
  assert.match(readme, /official result/i);
  assert.match(readme, /Organizer owner/);
  assert.match(readme, /20260803172117_pageantindex_foundation\.sql/);
  assert.match(readme, /20260803173435_optimize_pageantindex_rls_and_indexes\.sql/);
});
