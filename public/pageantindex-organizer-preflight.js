"use strict";

(() => {
  if (location.pathname !== "/dashboard/") return;
  const SESSION_KEY = "pi_supabase_session";

  function isOrganizerSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const session = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (session?.user?.user_metadata?.account_type === "organizer") return true;
      } catch {}
    }
    return false;
  }

  if (!isOrganizerSession()) return;

  const protect = () => {
    const shell = document.querySelector(".product-shell");
    if (!shell) return false;
    shell.dataset.piRoleChecked = "true";
    return true;
  };

  if (protect()) return;
  const observer = new MutationObserver(() => {
    if (protect()) observer.disconnect();
  });
  observer.observe(document.documentElement, {childList: true, subtree: true});
})();
