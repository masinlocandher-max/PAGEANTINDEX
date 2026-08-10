"use strict";

(() => {
  const root = document.getElementById("live-vote-app");
  const toast = document.getElementById("live-vote-toast");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const requestedEvent = params.get("event") || "";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  const money = (minor, currency="PHP") => new Intl.NumberFormat("en-PH", {style:"currency",currency}).format(Number(minor||0)/100);
  const dateTime = (value) => value ? new Intl.DateTimeFormat("en-PH", {dateStyle:"medium",timeStyle:"short"}).format(new Date(value)) : "";

  function notify(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { toast.hidden = true; }, 5000);
  }

  function eventCard(event) {
    const open = event.status === "open" && new Date(event.startsAt).getTime() <= Date.now() && new Date(event.endsAt).getTime() > Date.now();
    const pageant = [event.edition?.pageantName, event.edition?.editionName || event.edition?.editionYear].filter(Boolean).join(" · ");
    const freeEnabled = ["free","mixed"].includes(event.voteMode);
    const paidEnabled = ["paid","mixed"].includes(event.voteMode) && event.pricePerVoteMinor > 0;
    return `<article style="overflow:hidden;border:1px solid #eadde5;border-radius:28px;background:#fff;box-shadow:0 24px 70px rgba(48,10,31,.07)">
      <header style="padding:30px;border-bottom:1px solid #eadde5;background:#fbf6f9">
        <p style="margin:0;color:#a51b61;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(pageant || "Official PageantIndex voting")}</p>
        <h2 style="margin:8px 0 10px;font-size:clamp(2rem,4vw,3.5rem);line-height:1">${escapeHtml(event.title)}</h2>
        <p style="margin:0;color:#786873;line-height:1.65">${open ? `Voting closes ${escapeHtml(dateTime(event.endsAt))}.` : `Voting status: ${escapeHtml(event.status)}.`}${event.rulesUrl ? ` <a href="${escapeHtml(event.rulesUrl)}" target="_blank" rel="noreferrer">Read official rules</a>.` : ""}</p>
      </header>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1px;background:#eadde5">
        ${event.candidates.map((candidate) => `<section style="padding:26px;background:#fff">
          <p style="margin:0;color:#b41567;font-size:.68rem;font-weight:850;letter-spacing:.12em;text-transform:uppercase">${candidate.candidateNumber ? `Candidate ${escapeHtml(candidate.candidateNumber)}` : "Official candidate"}</p>
          <h3 style="margin:10px 0 6px;font-size:1.35rem">${escapeHtml(candidate.displayName)}</h3>
          <p style="min-height:22px;margin:0 0 18px;color:#786873">${escapeHtml(candidate.representation || "")}</p>
          ${candidate.liveTotal !== null ? `<p style="font-size:.8rem;color:#5d4854">${Number(candidate.liveTotal).toLocaleString("en-PH")} confirmed votes</p>` : ""}
          <div style="display:flex;flex-wrap:wrap;gap:9px">
            ${freeEnabled ? `<button data-free-vote data-event="${event.id}" data-candidate="${candidate.id}" ${open ? "" : "disabled"} style="border:0;border-radius:999px;padding:11px 16px;background:#170912;color:#fff;font-weight:800;cursor:pointer">Free vote</button>` : ""}
            ${paidEnabled ? `<div style="display:flex;gap:8px;align-items:center"><input data-paid-qty type="number" min="1" max="100000" value="1" aria-label="Number of paid votes" style="width:70px;padding:10px;border:1px solid #eadde5;border-radius:10px"><button data-paid-vote data-event="${event.id}" data-candidate="${candidate.id}" ${open ? "" : "disabled"} style="border:0;border-radius:999px;padding:11px 16px;background:#f5e9ef;color:#7d174b;font-weight:800;cursor:pointer">Buy votes · ${escapeHtml(money(event.pricePerVoteMinor,event.currency))} each</button></div>` : ""}
          </div>
        </section>`).join("")}
      </div>
      <footer style="display:flex;flex-wrap:wrap;gap:10px 18px;padding:18px 30px;border-top:1px solid #eadde5;color:#786873;font-size:.78rem">
        <span>Opens: ${escapeHtml(dateTime(event.startsAt))}</span><span>Closes: ${escapeHtml(dateTime(event.endsAt))}</span><span>${event.showLiveTotals ? "Live totals shown" : "Totals hidden until organizer release"}</span>
      </footer>
    </article>`;
  }

  async function load() {
    const query = requestedEvent ? `?event=${encodeURIComponent(requestedEvent)}` : "";
    const response = await fetch(`/api/voting/public${query}`, {cache:"no-store"});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Voting could not be loaded.");
    if (!data.events?.length) {
      root.innerHTML = `<div class="pi-policy-card"><h2>No public voting event is open yet.</h2><p>PageantIndex does not display sample candidates or invented vote totals. When an approved organizer publishes a voting event, it will appear here automatically.</p></div>`;
      return;
    }
    root.innerHTML = data.events.map(eventCard).join("<div style='height:24px'></div>");
  }

  document.addEventListener("click", async (event) => {
    const free = event.target.closest?.("[data-free-vote]");
    if (free) {
      free.disabled = true;
      const original = free.textContent;
      free.textContent = "Submitting…";
      try {
        const response = await fetch("/api/voting/cast", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({votingEventId:free.dataset.event,votingCandidateId:free.dataset.candidate,quantity:1})});
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Vote could not be submitted.");
        notify("Your vote was recorded in the official PageantIndex ledger.");
        window.PageantIndexAnalytics?.track?.("vote_confirmed", {action:"free"});
        await load();
      } catch (error) {
        notify(error.message);
        free.disabled = false;
        free.textContent = original;
      }
      return;
    }
    const paid = event.target.closest?.("[data-paid-vote]");
    if (paid) {
      const quantity = Number.parseInt(paid.parentElement?.querySelector("[data-paid-qty]")?.value || "1",10) || 1;
      paid.disabled = true;
      const original = paid.textContent;
      paid.textContent = "Opening secure checkout…";
      try {
        const response = await fetch("/api/payments/checkout", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({purpose:"voting",votingEventId:paid.dataset.event,votingCandidateId:paid.dataset.candidate,quantity})});
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Secure checkout is unavailable.");
        location.href = data.checkoutUrl;
      } catch (error) {
        notify(error.message);
        paid.disabled = false;
        paid.textContent = original;
      }
    }
  });

  if (params.get("payment_success") === "1") notify("Payment returned successfully. PageantIndex confirms paid votes only after the payment webhook is verified.");
  if (params.get("payment_canceled") === "1") notify("Checkout was canceled. No paid votes were added.");
  load().catch((error) => { root.innerHTML = `<div class="pi-policy-card"><h2>Voting unavailable</h2><p>${escapeHtml(error.message)}</p></div>`; });
})();
