import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");

test("shared authentication readiness script parses", async () => {
  const path = join(root, "public/pageantindex-auth-readiness.js");
  const result = spawnSync(process.execPath, ["--check", path], {encoding: "utf8"});
  assert.equal(result.status, 0, result.stderr);
});

test("signup and recovery requests have explicit approved redirect destinations", async () => {
  const auth = await read("public/pageantindex-auth-readiness.js");
  assert.match(auth, /\/auth\/v1\/signup/);
  assert.match(auth, /\/auth\/v1\/recover/);
  assert.match(auth, /redirect_to/);
  assert.match(auth, /\/sign-in\/\?auth=/);
  assert.match(auth, /confirmed/);
  assert.match(auth, /recovery/);
});

test("pending onboarding never stores passwords and expires quickly", async () => {
  const auth = await read("public/pageantindex-auth-readiness.js");
  assert.match(auth, /PENDING_TTL = 24 \* 60 \* 60 \* 1000/);
  assert.match(auth, /\["password", "confirm"\]\.includes\(key\)/);
  assert.match(auth, /localStorage\.setItem\(PENDING_KEY/);
  assert.doesNotMatch(auth, /localStorage\.setItem\([^\n]+password/i);
  assert.doesNotMatch(auth, /sessionStorage\.setItem\([^\n]+password/i);
});

test("confirmation restores each role without overwriting normal sign-ins", async () => {
  const auth = await read("public/pageantindex-auth-readiness.js");
  for (const table of [
    "user_profiles",
    "enthusiast_profiles",
    "candidate_profile_drafts",
    "candidate_pageant_history",
    "professional_profile_drafts",
    "media_profile_drafts",
    "pageant_organization_drafts",
  ]) assert.match(auth, new RegExp(table));
  assert.match(auth, /if \(existingProfile && !pendingRecord\) return existingProfile\.account_type/);
  assert.match(auth, /recordExists/);
  assert.match(auth, /resolution=merge-duplicates/);
});

test("password recovery consumes the session and updates the authenticated user", async () => {
  const auth = await read("public/pageantindex-auth-readiness.js");
  assert.match(auth, /renderPasswordReset/);
  assert.match(auth, /\/auth\/v1\/user/);
  assert.match(auth, /method: "PUT"/);
  assert.match(auth, /minlength="10"/);
  assert.match(auth, /Passwords do not match/);
});

test("auth readiness loads before website and app authentication", async () => {
  const loader = await read("public/seo.js");
  const app = await read("app/index.html");
  const websiteAuth = loader.indexOf("pageantindex-auth-readiness.js");
  const websiteAudience = loader.indexOf("pageantindex-audience.js");
  const appAuthReadiness = app.indexOf("pageantindex-auth-readiness.js");
  const appAuth = app.indexOf("/app/auth.js");
  assert.ok(websiteAuth >= 0 && websiteAudience > websiteAuth);
  assert.ok(appAuthReadiness >= 0 && appAuth > appAuthReadiness);
});

test("authentication client contains no privileged server credential", async () => {
  const auth = await read("public/pageantindex-auth-readiness.js");
  assert.doesNotMatch(auth, /service_role/i);
  assert.doesNotMatch(auth, /SUPABASE_SERVICE/i);
});
