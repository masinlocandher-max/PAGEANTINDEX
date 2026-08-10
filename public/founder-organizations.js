"use strict";

(() => {
  const SESSION_KEY = "pi_supabase_session";
  const form = document.getElementById("founder-organization-form");
  const list = document.getElementById("founder-organization-list");
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[char]));
  const session = () => {
    for (const storage of [sessionStorage, localStorage]) {
      try { const value = JSON.parse(storage.getItem(SESSION_KEY) || "null"); if (value?.access_token) return value; } catch {}
    }
    return null;
  };
  const api = async (path, options = {}) => {
    const current = session();
    const headers = {"Content-Type":"application/json", ...(options.headers || {})};
    if (current?.access_token) headers.Authorization = `Bearer ${current.access_token}`;
    const response = await fetch(path, {...options, headers, cache:"no-store"});
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Request failed.");
    return payload;
  };
  const pesos = (minor) => new Intl.NumberFormat("en-PH", {style:"currency",currency:"PHP",maximumFractionDigits:0}).format(Number(minor || 0) / 100);

  async function activate(organizationId, feature, card) {
    const fee = card.querySelector('[name="fee"]');
    const payment = card.querySelector('[name="payment"]');
    const reference = card.querySelector('[name="reference"]');
    const status = card.querySelector(".org-status");
    const amount = Math.round(Number(fee.value || 0) * 100);
    status.hidden = false;
    status.className = "org-status";
    status.textContent = `Activating ${feature}…`;
    try {
      await api("/api/organizations/activate-feature", {method:"POST",body:JSON.stringify({subjectType:"organization",subjectId:organizationId,feature,feeAmountMinor:amount,currency:"PHP",paymentStatus:payment.value,commercialReference:reference.value})});
      status.className = "org-status success";
      status.textContent = `${feature === "voting" ? "Voting" : "Tabulation"} activated.`;
      await load();
    } catch (error) {
      status.className = "org-status error";
      status.textContent = error.message;
    }
  }

  async function load() {
    const current = session();
    if (!current?.access_token || current.user?.app_metadata?.role !== "admin") {
      list.innerHTML = '<p class="org-status error">Founder session required. Sign in through the PageantIndex founder/admin account first.</p>';
      form.querySelectorAll("input,button").forEach((node) => node.disabled = true);
      return;
    }
    const data = await api("/api/organizations/founder-workspace");
    const features = new Map((data.features || []).map((item) => [`${item.organization_id}:${item.feature}`, item]));
    list.innerHTML = data.organizations?.length ? data.organizations.map((org) => {
      const voting = features.get(`${org.id}:voting`);
      const tab = features.get(`${org.id}:tabulation`);
      const control = (item, feature, label) => `<div class="org-card org-feature ${item?.status === "active" ? "active" : "locked"}" data-org="${org.id}" data-feature="${feature}"><h3>${label}</h3><span class="org-badge">${escapeHtml(item?.status || "locked")}</span><p class="org-muted">${item?.payment_status === "paid" ? `Fee ${escapeHtml(pesos(item.fee_amount_minor))}` : item?.payment_status === "waived" ? "Founder waiver" : "Fee not yet confirmed"}</p><form class="org-form feature-activation"><label>Fee (PHP)<input name="fee" type="number" min="0" step="1" value="${item?.fee_amount_minor ? Number(item.fee_amount_minor)/100 : ""}" required></label><label>Payment status<select name="payment"><option value="paid">Paid</option><option value="waived">Founder waiver</option></select></label><label>Commercial reference<input name="reference" maxlength="180" value="${escapeHtml(item?.commercial_reference || "")}"></label><button class="org-button">Activate ${label}</button><p class="org-status" hidden></p></form></div>`;
      return `<section class="org-card org-wide"><div class="org-actions" style="justify-content:space-between;align-items:flex-start"><div><h3>${escapeHtml(org.organization_name)}</h3><p class="org-muted">${escapeHtml(org.status)} · ${escapeHtml(org.slug)}</p></div><span class="org-badge">${org.status === "claimed" ? "CLAIMED" : "AWAITING ADMIN 1"}</span></div><div class="org-grid" style="margin-top:16px">${control(voting,"voting","Voting")}${control(tab,"tabulation","Tabulation")}</div></section>`;
    }).join("") : '<p class="org-status">No organizations have been provisioned yet.</p>';
    document.querySelectorAll(".feature-activation").forEach((activationForm) => activationForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const card = activationForm.closest("[data-org]");
      await activate(card.dataset.org, card.dataset.feature, card);
    }));
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("founder-create-status");
    const copy = document.getElementById("founder-claim-copy");
    status.hidden = false;
    status.className = "org-status";
    status.textContent = "Creating institutional organization record…";
    try {
      const payload = Object.fromEntries(new FormData(form));
      const created = await api("/api/organizations/founder-create", {method:"POST",body:JSON.stringify(payload)});
      status.className = "org-status success";
      status.textContent = `${created.organization.name} created. The record is unclaimed until Admin 1 accepts the private link.`;
      document.getElementById("founder-claim-url").value = created.claimUrl;
      copy.hidden = false;
      await load();
    } catch (error) {
      status.className = "org-status error";
      status.textContent = error.message;
    }
  });
  document.getElementById("copy-founder-claim")?.addEventListener("click", async () => navigator.clipboard.writeText(document.getElementById("founder-claim-url").value));
  load().catch((error) => { list.innerHTML = `<p class="org-status error">${escapeHtml(error.message)}</p>`; });
})();
