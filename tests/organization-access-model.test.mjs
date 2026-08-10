import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("organizations and organizers are distinct identities", async () => {
  const signup = await read("public/organization-role.js");
  assert.match(signup, /Pageant Organizer \/ Director/);
  assert.match(signup, /Organization access is invitation-only/);
  assert.match(signup, /dataAccountRole|dataset\.accountRole|accountRole/);
  assert.match(signup, /organizer/);
});

test("organization claim explicitly separates authority from PageantIndex identity verification", async () => {
  const html = await read("organization-claim/index.html");
  const script = await read("public/organization-claim.js");
  assert.match(html, /Organization Verified/);
  assert.match(html, /separate from PageantIndex identity verification/i);
  assert.match(script, /accept-invite/);
  assert.match(script, /Admin \$\{accepted\.admin_sequence\}/);
});

test("organization workspace supports additional admins and locked competition tools", async () => {
  const script = await read("public/organization-admin.js");
  assert.match(script, /Add admin/);
  assert.match(script, /invite-admin/);
  assert.match(script, /FOUNDER ACTIVATION REQUIRED|Founder activation required/);
  assert.match(script, /Voting/);
  assert.match(script, /Tabulation/);
});

test("founder controls organization creation and paid feature activation", async () => {
  const html = await read("founder-organizations/index.html");
  const script = await read("public/founder-organizations.js");
  assert.match(html, /Organizations are created here, not by users/);
  assert.match(script, /founder-create/);
  assert.match(script, /activate-feature/);
  assert.match(script, /paymentStatus/);
});

test("server routes enforce founder and member organization flows", async () => {
  const router = await read("api/router.js");
  for (const route of [
    "organizations/founder-create",
    "organizations/inspect-invite",
    "organizations/accept-invite",
    "organizations/invite-admin",
    "organizations/workspace",
    "organizations/activate-feature",
  ]) assert.match(router, new RegExp(route.replace("/", "\\/")));
});
