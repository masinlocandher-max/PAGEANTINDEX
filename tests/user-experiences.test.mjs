import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = path => readFile(join(root, path), "utf8");

const previewRoutes = [
  ["experience/index.html", "hub"],
  ["candidate/index.html", "candidate"],
  ["supplier-workspace/index.html", "supplier"],
];

const liveRoutes = [
  ["judge/index.html", "/public/live-judge.js"],
  ["vote/index.html", "/public/live-vote.js"],
  ["tickets/index.html", "/public/live-commerce.js"],
  ["tabulation/index.html", "/public/live-tabulation.js"],
  ["event/index.html", "/public/live-event.js"],
];

test("multi-user experience browser scripts parse", async () => {
  for (const path of ["public/experience.js", "public/organization-experience.js", ...liveRoutes.map(([,src]) => src.slice(1))]) {
    const result = spawnSync(process.execPath, ["--check", join(root, path)], {encoding:"utf8"});
    assert.equal(result.status, 0, `${path}\n${result.stderr}`);
  }
});

test("all primary PageantIndex user journeys have dedicated routes", async () => {
  for (const [path, role] of previewRoutes) {
    const html = await read(path);
    assert.match(html, new RegExp(`data-experience=["']${role}["']`), path);
    assert.match(html, /\/public\/experience\.css/);
    assert.match(html, /\/public\/experience\.js/);
  }
  for (const [path, script] of liveRoutes) {
    const html = await read(path);
    assert.match(html, new RegExp(script.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")), path);
    assert.doesNotMatch(html, /data-experience=/, `${path} must not fall back to the prototype experience shell`);
  }
});

test("pageant organization has a dedicated account lifecycle route", async () => {
  const html = await read("organization/index.html");
  const js = await read("public/organization-experience.js");
  assert.match(html, /\/public\/experience\.css/);
  assert.match(html, /\/public\/organization-experience\.js/);
  assert.match(html, /noindex,follow/);
  for (const phrase of [
    "Organization Profile",
    "Team & Roles",
    "Pageant Editions",
    "Verification",
    "Transfer organization ownership",
    "Owner authority",
  ]) assert.match(js, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  assert.doesNotMatch(js, /SUPABASE_URL|supabase\.co|\/rest\/v1\/|fetch\s*\(/);
});

test("prototype journeys remain non-authoritative while live competition routes use server APIs", async () => {
  const preview = await read("public/experience.js");
  assert.doesNotMatch(preview, /SUPABASE_URL|supabase\.co|\/rest\/v1\//);
  assert.doesNotMatch(preview, /fetch\s*\(/);
  assert.match(preview, /No votes or payments on this route are real/);
  assert.match(preview, /browser is not authoritative/);
  assert.match(preview, /non-scannable/);

  const liveVote = await read("public/live-vote.js");
  const liveJudge = await read("public/live-judge.js");
  const liveTabulation = await read("public/live-tabulation.js");
  assert.match(liveVote, /\/api\/voting\/cast/);
  assert.match(liveVote, /\/api\/payments\/checkout/);
  assert.match(liveJudge, /\/api\/judges\/score/);
  assert.match(liveTabulation, /\/api\/tabulation\/finalize/);
});

test("critical experience states are represented", async () => {
  const js = await read("public/experience.js");
  for (const phrase of [
    "Voting is closed",
    "Sold out",
    "Scores submitted and locked",
    "Results not yet published",
    "Opportunity closed",
    "You appear to be offline",
    "Complete every criterion",
    "Your cart is empty",
  ]) assert.match(js, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
});

test("Organizer OS and organization account are connected", async () => {
  const platform = await read("platform/index.html");
  const organizer = await read("app/organizer.js");
  assert.match(platform, /href="\/experience\/"/);
  assert.match(platform, /View all user journeys/);
  assert.match(organizer, /\/organization\//);
  assert.match(organizer, /Organization profile, team & verification/);
});
