"use strict";
(() => {
  if (location.pathname !== "/dashboard/") return;

  const SESSION_KEY = "pi_supabase_session";
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";

  function session() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (value?.access_token) return value;
      } catch {}
    }
    return null;
  }

  function destination(role) {
    if (role === "candidate") return "/candidate/";
    if (role === "organizer") return "/organization/";
    return "";
  }

  const active = session();
  if (!active) return;

  const metadataRole = active.user?.user_metadata?.account_type || active.user?.app_metadata?.account_type || "";
  const immediate = destination(metadataRole);
  if (immediate) {
    location.replace(immediate);
    return;
  }

  const userId = active.user?.id;
  if (!userId) return;

  fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=account_type&user_id=eq.${encodeURIComponent(userId)}&limit=1`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${active.access_token}`,
      Accept: "application/json",
    },
  })
    .then(response => response.ok ? response.json() : [])
    .then(rows => {
      const target = destination(rows?.[0]?.account_type || "");
      if (target) location.replace(target);
    })
    .catch(() => {});
})();
