"use strict";

(() => {
  const form = document.getElementById("pi-trust-report");
  const status = document.getElementById("pi-report-status");
  if (!form || !status) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.hidden = false;
    status.textContent = "Submitting your report securely…";
    const data = Object.fromEntries(new FormData(form));
    const payload = {
      reportType: data.reportType,
      subjectType: data.subjectType,
      contactEmail: data.contactEmail,
      summary: data.summary,
      website: data.website,
      evidenceUrls: String(data.evidenceUrls || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
    };
    try {
      const response = await fetch("/api/trust/report", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)});
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "The report could not be submitted.");
      form.reset();
      status.innerHTML = result.caseReference
        ? `<strong>Report received.</strong><br>Your case reference is <strong>${String(result.caseReference).replace(/[^A-Z0-9-]/gi, "")}</strong>. Keep this reference for follow-up.`
        : "Report received.";
      window.PageantIndexAnalytics?.track?.("trust_report_submitted", {result: "accepted"});
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false;
      window.PageantIndexAnalytics?.track?.("trust_report_submitted", {result: "error"});
    }
  });
})();
