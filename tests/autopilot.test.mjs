import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {join, resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");

test("autopilot migration covers revenue competition relationships and operations", async () => {
  const migration = await read("supabase/migrations/20260810154144_pageantindex_autopilot_core.sql");
  for (const table of [
    "analytics_events","commercial_plans","billing_accounts","subscriptions","payment_transactions",
    "voting_events","voting_candidates","vote_transactions","tabulation_events","tabulation_segments",
    "tabulation_criteria","judge_assignments","judge_scores","tabulation_results","professional_credits",
    "credit_invites","credit_disputes","support_tickets","trust_cases","notifications","onboarding_tasks",
    "crm_leads","territory_licenses",
  ]) {
    assert.match(migration, new RegExp(`create table public\\.${table}`), `Missing ${table}`);
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`), `RLS missing for ${table}`);
  }
  assert.match(migration, /security_invoker=true/);
  assert.match(migration, /Paid votes require a confirmed voting payment/);
  assert.match(migration, /Supplier must have a PageantIndex professional profile/);
});

test("transaction hardening keeps final results server generated", async () => {
  const migration = await read("supabase/migrations/20260810154439_autopilot_transaction_integrity.sql");
  assert.match(migration, /vote_transactions_payment_once_idx/);
  assert.match(migration, /professional_credits_org_unique_idx/);
  assert.match(migration, /revoke insert, update, delete on public\.tabulation_results from authenticated/);
  assert.doesNotMatch(migration, /service_role/i);
});

test("server routes enforce authenticated or server boundaries", async () => {
  const voting = await read("api/voting/cast.js");
  const finalize = await read("api/tabulation/finalize.js");
  const invite = await read("api/credits/invite.js");
  const accept = await read("api/credits/accept.js");
  const trust = await read("api/trust/report.js");
  assert.match(voting, /requestIdentityHash/);
  assert.match(voting, /confirmed payment does not match|Confirmed payment does not match/);
  assert.match(finalize, /scoring is incomplete/);
  assert.match(finalize, /tabulation_score_totals/);
  assert.match(invite, /Only the organizer can invite professionals/);
  assert.match(accept, /professional profile before accepting this credit/i);
  assert.match(trust, /caseReference/);
});

test("public analytics excludes message and verification content", async () => {
  const analytics = await read("public/pageantindex-analytics.js");
  assert.match(analytics, /analytics_events/);
  assert.match(analytics, /allowedPropertyKeys/);
  assert.doesNotMatch(analytics, /message_body|government_id|selfie|card_number|password/);
  assert.doesNotMatch(analytics, /service_role/i);
});

test("founder scorecard reports real operating state without invented KPIs", async () => {
  const html = await read("founder/index.html");
  const client = await read("public/founder-autopilot.js");
  assert.match(html, /metric-active-accounts/);
  assert.match(html, /metric-revenue/);
  assert.match(html, /metric-renewals/);
  assert.match(html, /metric-platform-health/);
  assert.match(client, /founder_system_scorecard/);
  assert.match(client, /founder_revenue_scorecard/);
  assert.doesNotMatch(client, /128|2,458|8,765|98%/);
});
