"use strict";

(() => {
  const root = document.getElementById("live-commerce-app");
  if (!root) return;
  const type = document.body.dataset.commerceType || "ticket";
  const params = new URLSearchParams(location.search);
  const edition = params.get("edition") || "";
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  const money = (minor, currency="PHP") => new Intl.NumberFormat("en-PH", {style:"currency",currency}).format(Number(minor||0)/100);
  const dateTime = (value) => value ? new Intl.DateTimeFormat("en-PH", {dateStyle:"medium",timeStyle:"short"}).format(new Date(value)) : "";

  function canBuy(offer) {
    const now = Date.now();
    if (offer.status !== "active") return false;
    if (offer.saleStartsAt && new Date(offer.saleStartsAt).getTime() > now) return false;
    if (offer.saleEndsAt && new Date(offer.saleEndsAt).getTime() <= now) return false;
    if (offer.unitsAvailable !== null && Number(offer.unitsAvailable) <= 0) return false;
    return Number(offer.priceMinor) > 0;
  }

  function renderOffer(offer) {
    const label = [offer.edition?.pageantName, offer.edition?.editionName || offer.edition?.editionYear].filter(Boolean).join(" · ");
    const available = offer.unitsAvailable === null ? "Availability set by organizer" : `${Number(offer.unitsAvailable).toLocaleString("en-PH")} available`;
    const action = canBuy(offer)
      ? `<form data-commerce-checkout data-offer="${offer.id}" style="display:grid;gap:12px;margin-top:22px"><div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 90px;gap:10px"><input name="buyerName" maxlength="180" placeholder="Name" aria-label="Buyer name" style="padding:12px;border:1px solid #dccfd7;border-radius:10px"><input name="buyerEmail" type="email" maxlength="320" placeholder="Email for receipt" aria-label="Buyer email" style="padding:12px;border:1px solid #dccfd7;border-radius:10px"><input name="quantity" type="number" min="1" max="${offer.unitsAvailable ?? 1000}" value="1" aria-label="Quantity" style="padding:12px;border:1px solid #dccfd7;border-radius:10px"></div><button type="submit" style="width:max-content;border:0;border-radius:999px;padding:12px 18px;background:#7d164b;color:#fff;font-weight:800;cursor:pointer">Secure checkout · ${escapeHtml(money(offer.priceMinor,offer.currency))} each</button><small style="color:#786873">Payment is processed on PayMongo's hosted checkout when the merchant account is configured.</small></form>`
      : `<p class="pi-report-status">${offer.status === "sold_out" || offer.unitsAvailable === 0 ? "Sold out" : offer.status === "scheduled" ? `Sales open ${escapeHtml(dateTime(offer.saleStartsAt))}` : "Sales are not currently open"}.</p>`;
    return `<article class="pi-policy-card"><p class="pi-policy-kicker">${escapeHtml(label || "Official PageantIndex offer")}</p><h2>${escapeHtml(offer.name)}</h2><p>${escapeHtml(offer.description || "")}</p><p><strong>${escapeHtml(money(offer.priceMinor,offer.currency))}</strong> · ${escapeHtml(available)}</p>${offer.edition?.venue ? `<p>${escapeHtml(offer.edition.venue)}${offer.edition.eventStartAt ? ` · ${escapeHtml(dateTime(offer.edition.eventStartAt))}` : ""}</p>` : ""}${action}</article>`;
  }

  async function load() {
    const query = new URLSearchParams({type});
    if (edition) query.set("edition",edition);
    const response = await fetch(`/api/commerce/public?${query.toString()}`, {cache:"no-store"});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Offers could not be loaded.");
    if (!data.offers?.length) {
      root.innerHTML = `<div class="pi-policy-card"><h2>No ${escapeHtml(type)} offers are public yet.</h2><p>PageantIndex does not display invented inventory, prices, tickets, or sales. Approved organizer offers will appear here automatically.</p></div>`;
      return;
    }
    root.innerHTML = `<div class="pi-policy-grid">${data.offers.map(renderOffer).join("")}</div>`;
  }

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest?.("[data-commerce-checkout]");
    if (!form) return;
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const values = Object.fromEntries(new FormData(form));
    button.disabled = true;
    const original = button.textContent;
    button.textContent = "Opening secure checkout…";
    try {
      const response = await fetch("/api/payments/checkout", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({purpose:"offer",offerId:form.dataset.offer,buyerName:values.buyerName,buyerEmail:values.buyerEmail,quantity:Number.parseInt(values.quantity||"1",10)||1})});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Secure checkout is unavailable.");
      location.href = data.checkoutUrl;
    } catch (error) {
      const message = document.createElement("p");
      message.className = "pi-report-status";
      message.textContent = error.message;
      form.appendChild(message);
      button.disabled = false;
      button.textContent = original;
    }
  });

  load().catch((error) => { root.innerHTML = `<div class="pi-policy-card"><h2>Offers unavailable</h2><p>${escapeHtml(error.message)}</p></div>`; });
})();
