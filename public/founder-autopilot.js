"use strict";

(() => {
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";

  function storedSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (value?.access_token && value?.user?.app_metadata?.role === "admin") return value;
      } catch {}
    }
    return null;
  }

  async function rest(path, token) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {headers: {apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`}});
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || `Metric request failed (${response.status}).`);
    return payload;
  }

  const set = (id, value, detail = null, alert = false) => {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = value;
    const card = node.closest("article");
    card?.classList.toggle("metric-alert", alert);
    card?.classList.toggle("metric-good", !alert && value !== "—");
    if (detail) {
      const small = card?.querySelector("small");
      if (small) small.textContent = detail;
    }
  };

  function formatMoney(minor, currency = "PHP") {
    const amount = Number(minor) / 100;
    try { return new Intl.NumberFormat("en-PH", {style: "currency", currency, maximumFractionDigits: 0}).format(amount); }
    catch { return `${currency} ${amount.toLocaleString("en-PH")}`; }
  }

  function firstDefined(source, keys) {
    for (const key of keys) if (source?.[key] !== undefined && source?.[key] !== null) return source[key];
    return undefined;
  }

  function setMoney(id, value, currency, detail) {
    set(id, value === undefined ? "—" : formatMoney(value, currency), value === undefined ? "Not exposed by the current scorecard" : detail);
  }

  async function load() {
    const session = storedSession();
    if (!session) return false;
    const [systemRows, revenueRows, health] = await Promise.all([
      rest("founder_system_scorecard?select=*", session.access_token),
      rest("founder_revenue_scorecard?select=currency,confirmed_transactions_30d,revenue_30d_minor", session.access_token),
      fetch("/api/health", {cache: "no-store"}).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]);
    const system = systemRows?.[0] || {};
    const revenue = revenueRows || [];
    const primaryRevenue = revenue.find((row) => row.currency === "PHP") || revenue[0];
    const currency = primaryRevenue?.currency || "PHP";
    const confirmedRevenue = firstDefined(primaryRevenue, ["revenue_30d_minor", "confirmed_revenue_30d_minor", "confirmed_transactions_30d_minor"]);
    const recurringRevenue = firstDefined(primaryRevenue, ["recurring_revenue_minor", "subscription_revenue_30d_minor", "mrr_minor"]);
    const votingRevenue = firstDefined(primaryRevenue, ["voting_revenue_30d_minor", "voting_revenue_minor"]);
    let ticketRevenue = firstDefined(primaryRevenue, ["ticket_ppv_revenue_30d_minor", "ticket_revenue_30d_minor"]);
    const ppvRevenue = firstDefined(primaryRevenue, ["ppv_revenue_30d_minor", "livestream_revenue_30d_minor"]);
    if (ticketRevenue !== undefined && ppvRevenue !== undefined && primaryRevenue?.ticket_ppv_revenue_30d_minor === undefined) ticketRevenue = Number(ticketRevenue) + Number(ppvRevenue);
    else if (ticketRevenue === undefined) ticketRevenue = ppvRevenue;

    const activeAccounts = firstDefined(system, ["active_subscriptions", "active_paid_accounts"]);
    const activeEvents = firstDefined(system, ["active_events", "events_active", "unique_active_events"]);
    const renewals = firstDefined(system, ["renewals_at_risk"]);
    const healthLabel = health?.status === "ok" ? "Healthy" : "Check";
    const healthDetail = health?.status === "ok" ? "Production health endpoint responding" : "Health endpoint needs attention";

    set("metric-paid-accounts", activeAccounts === undefined ? "—" : String(activeAccounts), activeAccounts === undefined ? "Not exposed by the current scorecard" : "Active paying subscriptions");
    set("metric-events-active", activeEvents === undefined ? "—" : String(activeEvents), activeEvents === undefined ? "Unique active event count not exposed" : "Unique active events");
    set("metric-renewals", renewals === undefined ? "—" : String(renewals), renewals === undefined ? "Not exposed by the current scorecard" : "Past due, grace, or due within 14 days", Number(renewals || 0) > 0);
    set("metric-platform-health-top", healthLabel, healthDetail, health?.status !== "ok");
    set("metric-confirmed-revenue", confirmedRevenue === undefined ? "—" : formatMoney(confirmedRevenue, currency), confirmedRevenue === undefined ? "Not exposed by the current scorecard" : "Confirmed revenue, last 30 days");
    set("metric-recurring-revenue", recurringRevenue === undefined ? "—" : formatMoney(recurringRevenue, currency), recurringRevenue === undefined ? "Not exposed by the current scorecard" : "Recorded recurring revenue");
    setMoney("metric-revenue", confirmedRevenue, currency, "Confirmed revenue, last 30 days");
    setMoney("metric-subscription-revenue", recurringRevenue, currency, "Recorded subscription revenue");
    setMoney("metric-voting-revenue", votingRevenue, currency, "Recorded voting revenue");
    setMoney("metric-ticket-revenue", ticketRevenue, currency, "Recorded ticket and PPV revenue");
    return true;
  }

  let attempts = 0;
  const timer = setInterval(async () => {
    attempts += 1;
    try {
      if (await load()) clearInterval(timer);
    } catch {
      if (attempts >= 12) {
        set("metric-platform-health", "Check", "Operating metrics could not be loaded", true);
        clearInterval(timer);
      }
    }
    if (attempts >= 20) clearInterval(timer);
  }, 500);
})();
