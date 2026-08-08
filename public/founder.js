"use strict";

const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
const SESSION_KEY = "pi_supabase_session";
let session = null;
let inboxMessages = [];

function parseStored(storage) {
  try { return JSON.parse(storage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function readStoredSession() { return parseStored(sessionStorage) || parseStored(localStorage); }
function sessionPersistent() { return Boolean(localStorage.getItem(SESSION_KEY)); }
function saveSession(next, persist = false) {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  (persist ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(next));
  session = next;
}
function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
  session = null;
}
function toast(message, type = "") {
  const node = document.getElementById("founder-toast");
  node.textContent = message;
  node.className = `toast show ${type}`.trim();
  clearTimeout(window.__founderToastTimer);
  window.__founderToastTimer = setTimeout(() => { node.className = "toast"; }, 3400);
}
async function authRequest(path, options = {}, accessToken = null) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || payload?.error_description || `Request failed (${response.status}).`);
  return payload;
}
async function validateSession() {
  let stored = readStoredSession();
  if (!stored?.access_token) return null;
  const persist = sessionPersistent();
  try {
    if (Number(stored.expires_at || 0) * 1000 < Date.now() + 60000 && stored.refresh_token) {
      stored = await authRequest("/auth/v1/token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({refresh_token: stored.refresh_token}),
      });
    }
    const user = await authRequest("/auth/v1/user", {method: "GET"}, stored.access_token);
    const verified = {...stored, user};
    saveSession(verified, persist);
    return verified;
  } catch {
    clearSession();
    return null;
  }
}
function apiHeaders() {
  return {Authorization: `Bearer ${session?.access_token || ""}`, "Content-Type": "application/json"};
}
async function apiFetch(path, options = {}) {
  const response = await fetch(path, {...options, headers: {...apiHeaders(), ...(options.headers || {})}});
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status}).`);
  return payload;
}
async function supabaseRequest(path) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    headers: {apikey: SUPABASE_KEY, Authorization: `Bearer ${session.access_token}`},
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.message || `Data request failed (${response.status}).`);
  return payload;
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
}
function compactDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "").slice(0, 16);
  return new Intl.DateTimeFormat("en-PH", {month: "short", day: "numeric", hour: "numeric", minute: "2-digit"}).format(date);
}

function showFounderLogin(message) {
  const lock = document.getElementById("founder-lock");
  const card = lock.querySelector(".lock-card");
  card.innerHTML = `
    <img src="/public/images/pageant-icon.png" alt="" />
    <span>PAGEANTINDEX</span>
    <h1>Founder access only</h1>
    <p>${escapeHtml(message)}</p>
    <form id="founder-login-form" class="founder-login-form">
      <input name="email" type="email" autocomplete="email" placeholder="Admin email" required />
      <input name="password" type="password" autocomplete="current-password" placeholder="Password" required />
      <label><input name="remember" type="checkbox" /> Keep me signed in</label>
      <button class="primary-button" type="submit">Open Command Center</button>
    </form>
    <a class="quiet-link" href="/">Return to public site</a>`;
  const form = document.getElementById("founder-login-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const data = Object.fromEntries(new FormData(form));
      const signedIn = await authRequest("/auth/v1/token?grant_type=password", {
        method: "POST",
        body: JSON.stringify({email: data.email, password: data.password}),
      });
      const user = await authRequest("/auth/v1/user", {method: "GET"}, signedIn.access_token);
      if (user?.app_metadata?.role !== "admin") {
        clearSession();
        throw new Error("This account does not have founder dashboard access.");
      }
      saveSession({...signedIn, user}, data.remember === "on");
      location.reload();
    } catch (error) {
      toast(error.message, "error");
      button.disabled = false;
    }
  });
}

async function loadStatus() {
  const status = await apiFetch("/api/founder/status");
  const gptMetric = document.getElementById("metric-gpt");
  const emailMetric = document.getElementById("metric-email");
  const gptDetail = document.getElementById("metric-gpt-detail");
  const emailDetail = document.getElementById("metric-email-detail");
  const gptPill = document.getElementById("gpt-pill");
  const openaiLabel = document.getElementById("openai-connection-label");
  const gmailLabel = document.getElementById("gmail-connection-label");
  const gmailButton = document.getElementById("connect-gmail");

  gptMetric.textContent = status.openai.connected ? "Connected" : "Needs setup";
  gptDetail.textContent = status.openai.connected ? status.openai.model : "Add server-side OpenAI credentials";
  gptPill.textContent = status.openai.connected ? "Connected" : "Not connected";
  gptPill.className = `connection-pill ${status.openai.connected ? "connected" : "error"}`;
  openaiLabel.textContent = status.openai.connected ? `Connected • ${status.openai.model}` : "Not connected";

  emailMetric.textContent = status.gmail.connected ? "Connected" : "Not connected";
  emailDetail.textContent = status.gmail.accountEmail || "Connect a Gmail account";
  gmailLabel.textContent = status.gmail.connected ? `Connected • ${status.gmail.accountEmail}` : "Not connected";
  gmailButton.textContent = status.gmail.connected ? "Reconnect Gmail" : "Connect Gmail";
  if (status.gmail.connected) await loadInbox();
}

async function connectGmail() {
  const button = document.getElementById("connect-gmail");
  button.disabled = true;
  try {
    const data = await apiFetch("/api/integrations/google/start");
    location.href = data.authorizationUrl;
  } catch (error) {
    toast(error.message, "error");
    button.disabled = false;
  }
}

function renderInbox(messages, accountEmail) {
  const list = document.getElementById("mail-list");
  document.getElementById("inbox-account").textContent = accountEmail
    ? `Connected to ${accountEmail}. Showing recent non-promotional messages.`
    : "Recent inbox";
  if (!messages.length) {
    list.innerHTML = `<div class="empty-state">No recent messages matched the founder inbox filter.</div>`;
    return;
  }
  list.innerHTML = messages.map((message) => `
    <article class="mail-row ${message.unread ? "unread" : ""}">
      <div class="mail-from" title="${escapeHtml(message.from)}">${escapeHtml(message.from || "Unknown sender")}</div>
      <div class="mail-content">
        <strong>${escapeHtml(message.subject)}</strong>
        <p>${escapeHtml(message.snippet)}</p>
      </div>
      <time class="mail-date">${escapeHtml(compactDate(message.date))}</time>
    </article>`).join("");
}
async function loadInbox() {
  const refresh = document.getElementById("refresh-inbox");
  refresh.disabled = true;
  try {
    const data = await apiFetch("/api/founder/gmail");
    inboxMessages = data.messages || [];
    renderInbox(inboxMessages, data.accountEmail);
  } catch (error) {
    inboxMessages = [];
    document.getElementById("mail-list").innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  } finally {
    refresh.disabled = false;
  }
}

function commercialIntake(records) {
  const ignore = new Set(["newsletter", "report"]);
  return records.filter((record) => !ignore.has(String(record.submission_type || "").toLowerCase()));
}
function renderOpportunities(records) {
  const list = document.getElementById("opportunity-list");
  if (!records.length) {
    list.innerHTML = `<div class="empty-state">No recent founder-level opportunities are waiting here.</div>`;
    return;
  }
  list.innerHTML = records.slice(0, 8).map((record) => `
    <article class="opportunity-row">
      <span class="opportunity-type">${escapeHtml(String(record.submission_type || "opportunity").replaceAll("_", " "))}</span>
      <div class="opportunity-contact">
        <strong>${escapeHtml(record.contact_name || "Unnamed contact")}</strong>
        <small>${escapeHtml(record.contact_email || record.contact_mobile || "No contact shown")}</small>
      </div>
      <span class="opportunity-meta">${escapeHtml(record.status || "new")}</span>
      <time class="opportunity-date">${escapeHtml(compactDate(record.created_at))}</time>
    </article>`).join("");
}
async function loadOperations() {
  try {
    const [intake, drafts] = await Promise.all([
      supabaseRequest("/rest/v1/intake_submissions?select=id,submission_type,contact_name,contact_email,contact_mobile,status,created_at&order=created_at.desc&limit=100"),
      supabaseRequest("/rest/v1/professional_profile_drafts?select=user_id,review_state,submission_state,updated_at&order=updated_at.desc&limit=100"),
    ]);
    const opportunities = commercialIntake(intake || []);
    const pendingReviews = (drafts || []).filter((row) => ["pending", "in_review", "submitted"].includes(String(row.review_state || row.submission_state)));
    document.getElementById("metric-opportunities").textContent = String(opportunities.length);
    document.getElementById("metric-reviews").textContent = String(pendingReviews.length);
    renderOpportunities(opportunities);
  } catch (error) {
    document.getElementById("metric-opportunities").textContent = "—";
    document.getElementById("metric-reviews").textContent = "—";
    document.getElementById("opportunity-list").innerHTML = `<div class="empty-state">Operations queue unavailable: ${escapeHtml(error.message)}</div>`;
  }
}

async function askAssistant(event) {
  event.preventDefault();
  const input = document.getElementById("assistant-input");
  const output = document.getElementById("assistant-output");
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const message = input.value.trim();
  if (!message) return;
  button.disabled = true;
  output.textContent = "Thinking about what deserves founder attention…";
  try {
    const includeEmailContext = document.getElementById("include-email-context").checked;
    const data = await apiFetch("/api/founder/assistant", {
      method: "POST",
      body: JSON.stringify({message, includeEmailContext, emails: includeEmailContext ? inboxMessages : []}),
    });
    output.textContent = data.text || "No response returned.";
  } catch (error) {
    output.textContent = error.message;
    toast(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

function initNavigation() {
  document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-scroll]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(button.dataset.scroll)?.scrollIntoView({behavior: "smooth", block: "start"});
    });
  });
  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      document.getElementById("assistant-input").value = button.dataset.prompt;
      document.getElementById("assistant-input").focus();
    });
  });
}

async function bootstrap() {
  session = await validateSession();
  if (!session?.user || session.user.app_metadata?.role !== "admin") {
    showFounderLogin(session?.user ? "This account does not have founder dashboard access." : "Sign in with your authorized PageantIndex admin account.");
    return;
  }

  document.getElementById("founder-lock").hidden = true;
  document.getElementById("founder-shell").hidden = false;
  document.getElementById("founder-email").textContent = session.user.email || "Founder";
  initNavigation();
  document.getElementById("connect-gmail").addEventListener("click", connectGmail);
  document.getElementById("refresh-inbox").addEventListener("click", loadInbox);
  document.getElementById("assistant-form").addEventListener("submit", askAssistant);

  const query = new URLSearchParams(location.search);
  if (query.get("gmail") === "connected") toast("Gmail connected to Founder Command Center.");
  if (query.get("gmail") === "declined") toast("Gmail connection was cancelled.", "error");
  if (query.get("gmail") === "error") toast(query.get("reason") || "Gmail connection failed.", "error");
  if (query.has("gmail")) history.replaceState({}, "", "/founder/");

  await Promise.allSettled([loadStatus(), loadOperations()]);
}

bootstrap();
