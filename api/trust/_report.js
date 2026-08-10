import {cleanText, isHttpsUrl, sendJson, serviceRequest} from "../_lib/server.js";

const REPORT_TYPES = new Set(["impersonation","copyright","harassment","fraud","safety","privacy","privacy_rights","minor_safety","other"]);

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, {error: "Method not allowed."});
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    if (body.website) return sendJson(res, 202, {accepted: true});
    const reportType = cleanText(body.reportType, 40);
    const summary = cleanText(body.summary, 6000);
    const contactEmail = cleanText(body.contactEmail, 320) || null;
    const subjectType = cleanText(body.subjectType, 80) || null;
    const rawUrls = Array.isArray(body.evidenceUrls) ? body.evidenceUrls : String(body.evidenceUrls || "").split(/\r?\n/);
    const evidenceUrls = rawUrls.map((value) => cleanText(value, 1000)).filter(Boolean).filter(isHttpsUrl).slice(0, 5);
    if (!REPORT_TYPES.has(reportType)) return sendJson(res, 400, {error: "Choose a valid report type."});
    if (summary.length < 10) return sendJson(res, 400, {error: "Please provide enough detail for review."});
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return sendJson(res, 400, {error: "Enter a valid contact email."});

    const rows = await serviceRequest("trust_cases", {
      method: "POST",
      headers: {Prefer: "return=representation"},
      body: JSON.stringify({
        submitted_by_user_id: null,
        report_type: reportType,
        subject_type: subjectType,
        contact_email: contactEmail,
        summary,
        evidence_urls: evidenceUrls,
        severity: "normal",
        status: "open",
      }),
    });
    const created = rows?.[0];
    if (!created?.case_reference) throw new Error("The report was stored but no case reference was returned.");
    return sendJson(res, 201, {accepted: true, caseReference: created.case_reference});
  } catch (error) {
    return sendJson(res, error instanceof SyntaxError ? 400 : 503, {error: error instanceof SyntaxError ? "Invalid request." : error.message});
  }
}
