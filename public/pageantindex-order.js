"use strict";

(() => {
  const root = document.getElementById("order-app");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const reference = params.get("reference") || "";
  const key = params.get("key") || "";
  const canceled = params.get("canceled") === "1";
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[c]);
  const money = (minor, currency = "PHP") => new Intl.NumberFormat("en-PH", {style:"currency",currency}).format(Number(minor || 0) / 100);
  const date = (value) => value ? new Intl.DateTimeFormat("en-PH", {dateStyle:"medium",timeStyle:"short"}).format(new Date(value)) : "—";

  function shell(content) {
    root.innerHTML = `<main class="pi-policy-shell"><section class="pi-policy-hero"><div class="pi-policy-inner"><span class="pi-policy-kicker">PRIVATE RECEIPT</span><h1>PageantIndex order</h1><p>Payment confirmation and access are verified against PageantIndex server records. A checkout redirect alone never marks an order as paid.</p></div></section><section class="pi-policy-body"><div class="pi-policy-inner">${content}<p class="pi-policy-note"><a href="/">Return to PageantIndex</a>. Keep this private receipt link secure because it can reveal active ticket or viewing credentials.</p></div></section></main>`;
  }

  if (!reference || !key) {
    shell(`<article class="pi-policy-card"><h2>Order link unavailable</h2><p>Open the complete receipt link provided by PageantIndex after checkout.</p></article>`);
    return;
  }

  shell(`<article class="pi-policy-card"><h2>Checking payment status…</h2><p>We are reading the authoritative order record.</p></article>`);

  fetch(`/api/orders/read?reference=${encodeURIComponent(reference)}&key=${encodeURIComponent(key)}`, {headers:{Accept:"application/json"}})
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Order could not be loaded.");
      return payload;
    })
    .then(({order, offer, credentials}) => {
      const credentialMarkup = credentials?.length ? credentials.map((credential) => `
        <article class="pi-policy-card">
          <h3>${credential.type === "ticket" ? `Ticket ${credential.index}` : "Viewing access"}</h3>
          <p>Status: <strong>${esc(credential.status)}</strong>${credential.expiresAt ? ` · Expires ${esc(date(credential.expiresAt))}` : ""}</p>
          ${credential.token ? `<p style="word-break:break-all"><strong>Credential:</strong><br>${esc(credential.token)}</p><button type="button" data-copy="${esc(credential.token)}">Copy credential</button>` : `<p>This credential is no longer active.</p>`}
        </article>`).join("") : "";
      const pendingMessage = canceled && order.status === "pending_payment"
        ? "Checkout was canceled. No payment has been confirmed for this order."
        : order.status === "pending_payment"
          ? "Payment confirmation is still pending. Refresh this receipt after your payment provider confirms the transaction."
          : "";
      shell(`
        <div class="pi-policy-grid two">
          <article class="pi-policy-card"><h2>${esc(offer?.name || "Order")}</h2><p>${esc(offer?.description || "PageantIndex purchase")}</p><h3>Reference</h3><p>${esc(order.reference)}</p><h3>Status</h3><p><strong>${esc(order.status.replaceAll("_", " "))}</strong></p>${pendingMessage ? `<div class="pi-report-status">${esc(pendingMessage)}</div>` : ""}</article>
          <article class="pi-policy-card"><h2>${money(order.amountMinor, order.currency)}</h2><p>${esc(String(order.quantity))} × ${money(order.unitAmountMinor, order.currency)}</p><h3>Created</h3><p>${esc(date(order.createdAt))}</p><h3>Paid</h3><p>${esc(date(order.paidAt))}</p>${offer?.instructions ? `<h3>Instructions</h3><p>${esc(offer.instructions)}</p>` : ""}</article>
        </div>
        ${credentialMarkup ? `<div class="pi-policy-grid two" style="margin-top:26px">${credentialMarkup}</div>` : ""}
      `);
      root.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copy);
          const original = button.textContent;
          button.textContent = "Copied";
          setTimeout(() => { button.textContent = original; }, 1200);
        } catch {
          button.textContent = "Copy unavailable";
        }
      }));
    })
    .catch((error) => shell(`<article class="pi-policy-card"><h2>Order unavailable</h2><p>${esc(error.message)}</p></article>`));
})();
