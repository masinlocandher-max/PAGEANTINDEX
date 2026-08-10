import commercePublic from "./commerce/_public.js";
import creditsAccept from "./credits/_accept.js";
import creditsInspect from "./credits/_inspect.js";
import creditsInvite from "./credits/_invite.js";
import eventsPublic from "./events/_public.js";
import judgesAccept from "./judges/_accept.js";
import judgesInspect from "./judges/_inspect.js";
import judgesInvite from "./judges/_invite.js";
import judgesScore from "./judges/_score.js";
import judgesWorkspace from "./judges/_workspace.js";
import ordersRead from "./orders/_read.js";
import ordersStatus from "./orders/_status.js";
import organizationsAcceptInvite from "./organizations/_acceptInvite.js";
import organizationsActivateFeature from "./organizations/_activateFeature.js";
import organizationsFounderCreate from "./organizations/_founderCreate.js";
import organizationsInspectInvite from "./organizations/_inspectInvite.js";
import organizationsInviteAdmin from "./organizations/_inviteAdmin.js";
import organizationsWorkspace from "./organizations/_workspace.js";
import tabulationConfigure from "./tabulation/_configure.js";
import tabulationFinalize from "./tabulation/_finalize.js";
import tabulationWorkspace from "./tabulation/_workspace.js";
import ticketsRedeem from "./tickets/_redeem.js";
import trustReport from "./trust/_report.js";
import votingCast from "./voting/_cast.js";
import votingPublic from "./voting/_public.js";

const ROUTES = Object.freeze({
  "commerce/public": commercePublic,
  "credits/accept": creditsAccept,
  "credits/inspect": creditsInspect,
  "credits/invite": creditsInvite,
  "events/public": eventsPublic,
  "judges/accept": judgesAccept,
  "judges/inspect": judgesInspect,
  "judges/invite": judgesInvite,
  "judges/score": judgesScore,
  "judges/workspace": judgesWorkspace,
  "orders/read": ordersRead,
  "orders/status": ordersStatus,
  "organizations/accept-invite": organizationsAcceptInvite,
  "organizations/activate-feature": organizationsActivateFeature,
  "organizations/founder-create": organizationsFounderCreate,
  "organizations/inspect-invite": organizationsInspectInvite,
  "organizations/invite-admin": organizationsInviteAdmin,
  "organizations/workspace": organizationsWorkspace,
  "tabulation/configure": tabulationConfigure,
  "tabulation/finalize": tabulationFinalize,
  "tabulation/workspace": tabulationWorkspace,
  "tickets/redeem": ticketsRedeem,
  "trust/report": trustReport,
  "voting/cast": votingCast,
  "voting/public": votingPublic,
});

export default async function handler(req, res) {
  const rawRoute = req.query?.route;
  const route = (Array.isArray(rawRoute) ? rawRoute.join("/") : String(rawRoute || ""))
    .replace(/^\/+|\/+$/g, "");
  const routeHandler = ROUTES[route];
  if (!routeHandler) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({error: "API route not found."}));
  }
  try {
    return await routeHandler(req, res);
  } catch (error) {
    if (res.writableEnded) return;
    console.error("PageantIndex API router failure", {route, message: error?.message});
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.end(JSON.stringify({error: "PageantIndex API request failed."}));
  }
}
