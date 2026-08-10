import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("member privacy policy is a first-class public surface", async () => {
  const html = await read("privacy/index.html");
  assert.match(html, /Member Privacy Policy/i);
  assert.match(html, /Policy version:<\/strong> 2026-08-11/);
  assert.match(html, /public information and private information are different/i);
  assert.match(html, /Your privacy rights/i);
  assert.match(html, /Children and minors/i);
  assert.match(html, /\/report\//);
});

test("signup requires versioned privacy acknowledgement", async () => {
  const signup = await read("sign-up/index.html");
  const script = await read("public/privacy-consent.js");
  assert.match(signup, /public\/privacy-consent\.js/);
  assert.match(script, /POLICY_VERSION = "2026-08-11"/);
  for (const marker of [
    "privacy_notice_acknowledged",
    "privacy_policy_version",
    "public_profile_notice_acknowledged",
    "adult_or_guardian_confirmed",
  ]) assert.match(script, new RegExp(marker));
  assert.match(script, /type=\"checkbox\"[^>]*required/);
});

test("trust desk accepts a dedicated privacy rights request", async () => {
  const html = await read("report/index.html");
  const api = await read("api/trust/_report.js");
  assert.match(html, /value="privacy_rights"/);
  assert.match(html, /Privacy rights request/);
  assert.match(api, /"privacy_rights"/);
});

test("database migration removes broad anonymous access and records member acknowledgements", async () => {
  const migration = await read("supabase/migrations/20260810192615_pageantindex_privacy_hardening.sql");
  assert.match(migration, /REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon/);
  assert.match(migration, /member_privacy_acknowledgements/);
  assert.match(migration, /pageantindex_record_signup_privacy/);
  assert.match(migration, /ALTER DEFAULT PRIVILEGES[\s\S]*REVOKE ALL ON TABLES FROM anon/);
});

test("profile creation is blocked without a recorded privacy acknowledgement", async () => {
  const migration = await read("supabase/migrations/20260810193027_enforce_member_privacy_acknowledgement.sql");
  for (const table of [
    "professional_profile_drafts",
    "candidate_profile_drafts",
    "media_profile_drafts",
    "pageant_organization_drafts",
    "enthusiast_profiles",
    "user_profiles",
  ]) assert.match(migration, new RegExp(table));
  assert.match(migration, /EXISTS \([\s\S]*member_privacy_acknowledgements/);
});

test("privacy and rights-request pages are in the public sitemap", async () => {
  const sitemap = await read("sitemap.xml");
  assert.match(sitemap, /https:\/\/www\.pageantindex\.com\/privacy\//);
  assert.match(sitemap, /https:\/\/www\.pageantindex\.com\/report\//);
});
