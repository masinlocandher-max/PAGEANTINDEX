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
    const amount = Number(minor || 0) / 100;
    try { return new Intl.NumberFormat("en-PH", {style: "currency", currency, maximumFractionDigits: 0}).format(amount); }
    catch { return `${currency} ${amount.toLocaleString("en-PH")}`; }
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
    const primaryRevenue = revenue.find((row) => row.currency === "PHP") || revenue[0] || {currency: "PHP", revenue_30d_minor: 0};
    set("metric-active-accounts", String(system.active_subscriptions ?? 0), "Active paying subscriptions");
    set("metric-revenue", formatMoney(primaryRevenue.revenue_30d_minor, primaryRevenue.currency), "Confirmed revenue, last 30 days");
    set("metric-renewals", String(system.renewals_at_risk ?? 0), "Past due, grace, or due within 14 days", Number(system.renewals_at_risk || 0) > 0);
    set("metric-voting", String(system.open_voting_events ?? 0), "Voting events currently open");
    set("metric-tabulation", String(system.live_tabulation_events ?? 0), "Tabulation events currently live");
    set("metric-support-risk", String(system.high_support_cases ?? 0), "High or critical routine cases", Number(system.high_support_cases || 0) > 0);
    set("metric-platform-health", health?.status === "ok" ? "Healthy" : "Check", health?.status === "ok" ? "Production health endpoint responding" : "Health endpoint needs attention", health?.status !== "ok");
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
