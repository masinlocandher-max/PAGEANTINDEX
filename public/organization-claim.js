"use strict";

(() => {
  const SESSION_KEY = "pi_supabase_session";
  const token = new URLSearchParams(location.search).get("token") || "";
  const card = document.getElementById("claim-card");
  const title = document.getElementById("claim-title");
  const summary = document.getElementById("claim-summary");

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

  async function load() {
    if (token.length < 20) throw new Error("This organization invitation is incomplete or invalid.");
    const invite = await api(`/api/organizations/inspect-invite?token=${encodeURIComponent(token)}`);
    title.textContent = invite.inviteKind === "founder_claim" ? `Claim ${invite.organization.organization_name}` : `Join ${invite.organization.organization_name}`;
    summary.textContent = invite.inviteKind === "founder_claim"
      ? "You were selected as the first administrator of this PageantIndex organization record."
      : "An existing organization administrator invited you to join the organization administration team.";
    const current = session();
    if (!current?.access_token) {
      card.innerHTML = `<h2>Create your personal organizer account first</h2><p>This invitation was issued to <strong>${escapeHtml(invite.invitedEmail)}</strong>. Organization records are not user accounts. Create your own PageantIndex organizer account, then return to this invitation to accept organization access.</p><div class="org-actions"><a class="org-button" href="/sign-up/?role=organizer">Create organizer account</a><a class="org-button secondary" href="/sign-in/">I already have an account</a></div><p class="org-muted">Keep this invitation link. It expires on ${escapeHtml(new Date(invite.expiresAt).toLocaleString("en-PH"))}.</p>`;
      return;
    }
    card.innerHTML = `<h2>Accept organization access</h2><p><strong>${escapeHtml(invite.organization.organization_name)}</strong> will verify your authority as an organization administrator. This creates an organization relationship signal, not a PageantIndex identity-verification mark.</p><button class="org-button" id="accept-organization">Accept invitation</button><p class="org-status" id="claim-status" hidden></p>`;
    document.getElementById("accept-organization")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const status = document.getElementById("claim-status");
      button.disabled = true;
      status.hidden = false;
      status.textContent = "Confirming organization authority…";
      try {
        const accepted = await api("/api/organizations/accept-invite", {method:"POST", body:JSON.stringify({token})});
        status.className = "org-status success";
        status.textContent = `Organization access confirmed. You are Admin ${accepted.admin_sequence}.`;
        setTimeout(() => location.href = `/organization-admin/?organization=${encodeURIComponent(accepted.organization_id)}`, 600);
      } catch (error) {
        status.className = "org-status error";
        status.textContent = error.message;
        button.disabled = false;
      }
    });
  }
  load().catch((error) => {
    title.textContent = "Invitation unavailable";
    summary.textContent = "PageantIndex could not validate this organization invitation.";
    card.innerHTML = `<p class="org-status error">${escapeHtml(error.message)}</p><a class="org-button secondary" href="/report/">Contact the Trust Desk</a>`;
  });
})();
