import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {spawnSync} from "node:child_process";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = path => readFile(join(root, path), "utf8");

const routes = [
  ["experience/index.html", "hub"],
  ["candidate/index.html", "candidate"],
  ["judge/index.html", "judge"],
  ["vote/index.html", "vote"],
  ["tickets/index.html", "tickets"],
  ["supplier-workspace/index.html", "supplier"],
  ["tabulation/index.html", "tabulation"],
  ["event/index.html", "event"],
];

test("multi-user experience browser script parses", async () => {
  const result = spawnSync(process.execPath, ["--check", join(root, "public/experience.js")], {encoding:"utf8"});
  assert.equal(result.status, 0, result.stderr);
});

test("all primary PageantIndex user journeys have dedicated routes", async () => {
  for (const [path, role] of routes) {
    const html = await read(path);
    assert.match(html, new RegExp(`data-experience=["']${role}["']`), path);
    assert.match(html, /\/public\/experience\.css/);
    assert.match(html, /\/public\/experience\.js/);
    assert.match(html, /noindex,follow/);
  }
});

test("front-end preview does not connect competition or payment flows to production", async () => {
  const js = await read("public/experience.js");
  assert.doesNotMatch(js, /SUPABASE_URL|supabase\.co|\/rest\/v1\//);
  assert.doesNotMatch(js, /fetch\s*\(/);
  assert.match(js, /No votes or payments on this route are real/);
  assert.match(js, /browser is not authoritative/);
  assert.match(js, /non-scannable/);
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

test("Organizer OS links to the complete experience map", async () => {
  const html = await read("platform/index.html");
  assert.match(html, /href="\/experience\/"/);
  assert.match(html, /View all user journeys/);
});
