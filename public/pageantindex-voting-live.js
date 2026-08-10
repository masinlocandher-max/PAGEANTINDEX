"use strict";

(() => {
  if (location.pathname !== "/vote/") return;
  const root = document.getElementById("experience-app");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const eventId = params.get("event") || "";
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
  const money = (minor, currency = "PHP") => new Intl.NumberFormat("en-PH", {style:"currency",currency}).format(Number(minor || 0) / 100);
  const stamp = (value) => new Intl.DateTimeFormat("en-PH", {dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
  let data = null;

  function shell(content) {
    root.innerHTML = `<div class="x-shell"><header class="x-top"><a class="x-brand" href="/"><img src="/public/images/pageant-icon.png" alt=""><div><strong>PageantIndex</strong><span>The Global Network for Pageantry</span></div></a><div class="x-grow"></div><span class="preview-label">Official voting</span><a class="x-action" href="/event/">Official events</a></header><main class="x-main">${content}</main><footer class="x-footer"><span>Votes count only after PageantIndex validates the official voting window and, for paid votes, provider-confirmed payment.</span><nav><a href="/trust/">Trust</a><a href="/report/">Report concern</a></nav></footer><div class="toast" id="vote-toast" role="status" aria-live="polite"></div></div>`;
  }

  function toast(message) {
    const node = document.getElementById("vote-toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(window.__piVoteToast);
    window.__piVoteToast = setTimeout(() => node.classList.remove("show"), 3200);
  }

  async function json(url, options = {}) {
    const response = await fetch(url, {...options, headers:{"Content-Type":"application/json",Accept:"application/json",...(options.headers || {})}});
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status}).`);
    return payload;
  }

  async function renderEventList() {
    shell(`<section class="panel pad-lg"><div class="panel-head"><div><h1>Official voting events</h1><p>Only organizer-approved, published PageantIndex voting events appear here.</p></div></div><div class="empty">Loading official voting events…</div></section>`);
    const payload = await json("/api/voting/event");
    const events = payload.events || [];
    shell(`${events.length ? `<section class="panel pad-lg"><div class="panel-head"><div><h1>Official voting events</h1><p>Choose a published event. PageantIndex never creates placeholder contestants or vote totals.</p></div></div><div class="hub-grid">${events.map((event) => `<a class="hub-card" href="/vote/?event=${encodeURIComponent(event.id)}"><small>${esc(event.status)}</small><h2>${esc(event.title)}</h2><p>${esc(stamp(event.starts_at))} to ${esc(stamp(event.ends_at))}</p><span>${event.vote_mode === "paid" ? `${money(event.price_per_vote_minor,event.currency)} per vote` : event.vote_mode === "mixed" ? `Free + ${money(event.price_per_vote_minor,event.currency)} paid votes` : "Free voting"} →</span></a>`).join("")}</div></section>` : `<section class="panel pad-lg"><div class="empty"><h1>No official voting event is open yet</h1><p>When an approved organizer publishes a real voting event, it will appear here automatically.</p></div></section>`}`);
  }

  function candidateCard(candidate, event) {
    const free = ["free","mixed"].includes(event.vote_mode);
    const paid = ["paid","mixed"].includes(event.vote_mode) && Number(event.price_per_vote_minor) > 0;
    return `<article class="panel pad-lg" data-candidate="${esc(candidate.id)}"><div class="candidate-face">${esc(candidate.candidateNumber || String(candidate.displayOrder + 1).padStart(2,"0"))}</div><h2 style="margin:14px 0 4px">${esc(candidate.name)}</h2><p class="helper">${esc(candidate.representation || "Representation not published")}</p>${candidate.liveTotal !== null ? `<div class="kpi" style="margin-top:16px"><small>Live confirmed votes</small><strong>${esc(candidate.liveTotal)}</strong></div>` : ""}<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px">${free ? `<button class="x-primary" type="button" data-free-vote="${esc(candidate.id)}">Cast free vote</button>` : ""}${paid ? `<button class="x-soft" type="button" data-paid-vote="${esc(candidate.id)}">Buy votes</button>` : ""}</div>${paid ? `<div class="field" data-paid-controls="${esc(candidate.id)}" hidden style="margin-top:14px"><label>Vote quantity</label><input type="number" min="1" max="100000" value="1" data-vote-qty="${esc(candidate.id)}"><span class="helper">${money(event.price_per_vote_minor,event.currency)} per confirmed vote. Checkout is handled by the configured payment provider.</span></div>` : ""}</article>`;
  }

  function renderEvent() {
    const event = data.event;
    const now = Date.now();
    const open = event.status === "open" && new Date(event.starts_at).getTime() <= now && new Date(event.ends_at).getTime() > now;
    const paymentNote = params.get("payment_success") === "1"
      ? `<div class="notice"><strong>Payment return received</strong><div>Your browser return does not count the vote. PageantIndex will add paid votes only after the payment provider's signed webhook confirms the transaction.</div></div>`
      : params.get("payment_canceled") === "1"
        ? `<div class="notice"><strong>Checkout canceled</strong><div>No paid vote was counted from the canceled checkout.</div></div>` : "";
    shell(`${paymentNote}${open ? "" : `<div class="notice"><strong>Voting is ${esc(event.status)}</strong><div>The official window is ${esc(stamp(event.starts_at))} to ${esc(stamp(event.ends_at))}.</div></div>`}<section class="x-hero"><div><h1>${esc(event.title)}</h1><p>${event.vote_mode === "free" ? "Free voting" : event.vote_mode === "paid" ? `${money(event.price_per_vote_minor,event.currency)} per paid vote` : `Free voting plus ${money(event.price_per_vote_minor,event.currency)} paid voting`}. ${event.max_free_votes_per_identity ? `Free-vote limit: ${esc(event.max_free_votes_per_identity)} per protected identity.` : ""}</p></div><div class="x-hero-side">${event.rules_url ? `<a class="x-action" href="${esc(event.rules_url)}" target="_blank" rel="noopener">Official rules</a>` : ""}</div></section><section class="grid four">${data.candidates.map((candidate) => candidateCard(candidate,event)).join("") || `<div class="empty"><h3>No public candidates are attached</h3><p>The organizer must publish the candidate roster before voting can proceed.</p></div>`}</section>`);
    if (!open) root.querySelectorAll("button[data-free-vote],button[data-paid-vote]").forEach((button) => button.disabled = true);
    bind();
  }

  async function castFree(candidateId, button) {
    button.disabled = true;
    const original = button.textContent;
    button.textContent = "Submitting…";
    try {
      const result = await json("/api/voting/cast", {method:"POST",body:JSON.stringify({votingEventId:eventId,votingCandidateId:candidateId,quantity:1})});
      button.textContent = "Vote confirmed";
      toast(`Vote confirmed. Receipt ${result.receiptId || "recorded"}.`);
      if (result.liveTotal !== null && result.liveTotal !== undefined) {
        const candidate = data.candidates.find((item) => item.id === candidateId);
        if (candidate) candidate.liveTotal = result.liveTotal;
        setTimeout(renderEvent, 650);
      }
    } catch (error) {
      button.disabled = false;
      button.textContent = original;
      toast(error.message);
    }
  }

  async function buyVotes(candidateId, button) {
    const controls = root.querySelector(`[data-paid-controls="${CSS.escape(candidateId)}"]`);
    if (controls?.hidden) {
      controls.hidden = false;
      button.textContent = "Continue to checkout";
      return;
    }
    const quantity = Number.parseInt(root.querySelector(`[data-vote-qty="${CSS.escape(candidateId)}"]`)?.value || "1", 10) || 1;
    button.disabled = true;
    button.textContent = "Opening checkout…";
    try {
      const result = await json("/api/payments/checkout", {method:"POST",body:JSON.stringify({purpose:"voting",votingEventId:eventId,votingCandidateId:candidateId,quantity})});
      location.href = result.checkoutUrl;
    } catch (error) {
      button.disabled = false;
      button.textContent = "Continue to checkout";
      toast(error.message);
    }
  }

  function bind() {
    root.querySelectorAll("[data-free-vote]").forEach((button) => button.addEventListener("click", () => castFree(button.dataset.freeVote, button)));
    root.querySelectorAll("[data-paid-vote]").forEach((button) => button.addEventListener("click", () => buyVotes(button.dataset.paidVote, button)));
  }

  async function boot() {
    try {
      if (!eventId) return renderEventList();
      shell(`<section class="panel pad-lg"><div class="empty"><h1>Loading official ballot…</h1><p>Reading the published voting event and candidate roster.</p></div></section>`);
      data = await json(`/api/voting/event?event=${encodeURIComponent(eventId)}`);
      renderEvent();
    } catch (error) {
      shell(`<section class="panel pad-lg"><div class="empty"><h1>Voting unavailable</h1><p>${esc(error.message)}</p><a class="x-action" href="/vote/">View official voting events</a></div></section>`);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, {once:true});
  else boot();
})();
