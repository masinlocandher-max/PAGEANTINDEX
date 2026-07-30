(() => {
  const normalizePath = () => {
    const path = window.location.pathname.replace(/\/+$/, "");
    return path || "/";
  };

  const injectStyles = () => {
    const style = document.createElement("style");
    style.textContent = `
      .private-package-intro,
      .private-package-lock,
      .private-package-panel {
        border: 1px solid var(--line, #eadde4);
        border-radius: 18px;
        background: rgba(255,255,255,.92);
        box-shadow: 0 18px 50px rgba(55,22,39,.08);
      }
      .private-package-intro {
        max-width: 860px;
        margin: 0 auto;
        padding: 42px;
        text-align: center;
      }
      .private-package-intro h2,
      .private-package-lock h2,
      .private-package-panel h2 {
        margin: 0 0 12px;
        font-family: "Playfair Display", Georgia, serif;
      }
      .private-package-intro p,
      .private-package-lock p,
      .private-package-panel p {
        color: var(--muted, #75656d);
      }
      .private-package-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 12px;
        margin-top: 24px;
      }
      .private-package-lock {
        margin: 24px 0;
        padding: 26px;
      }
      .private-package-lock strong {
        color: var(--pink, #ff1478);
      }
      .private-package-panel {
        margin: 28px 0 0;
        padding: 30px;
      }
      .private-package-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 22px;
      }
      .private-package-card {
        padding: 22px;
        border: 1px solid var(--line, #eadde4);
        border-radius: 16px;
        background: #fff;
      }
      .private-package-card h3 { margin: 0 0 8px; }
      .private-package-price {
        display: block;
        margin: 14px 0;
        font-size: 1.35rem;
        font-weight: 800;
      }
      .private-package-card ul {
        margin: 0 0 18px;
        padding-left: 18px;
        color: var(--muted, #75656d);
      }
      .private-package-card li { margin-bottom: 8px; }
      [data-private-package-hidden="true"] { display: none !important; }
      @media (max-width: 850px) {
        .private-package-grid { grid-template-columns: 1fr; }
        .private-package-intro { padding: 28px 22px; }
      }
    `;
    document.head.appendChild(style);
  };

  const replacePublicPricing = () => {
    const membershipSection = document.querySelector(".membership-section");
    if (!membershipSection) return;

    membershipSection.innerHTML = `
      <div class="container">
        <section class="private-package-intro" aria-labelledby="supplier-entry-title">
          <div class="eyebrow">For pageant professionals and suppliers</div>
          <h2 id="supplier-entry-title">Create your professional profile first.</h2>
          <p>Pageant Index does not publish supplier package names, prices, paid tools, or promotional options on the public website. Complete your professional profile first. Once it reaches 100% readiness, private growth options will unlock inside your dashboard.</p>
          <div class="private-package-actions">
            <a class="btn btn-primary" href="/sign-up/">Create your profile</a>
            <a class="btn btn-secondary" href="/sign-in/">Sign in to continue</a>
          </div>
        </section>
      </div>`;

    document.querySelectorAll(".plan-select").forEach((button) => button.remove());
  };

  const completionValue = () => {
    const sources = [
      document.getElementById("readiness-label")?.textContent,
      document.getElementById("readiness-score")?.textContent,
      document.getElementById("readiness-bar")?.style?.width,
    ];
    for (const value of sources) {
      const match = String(value || "").match(/(\d{1,3})\s*%/);
      if (match) return Math.min(100, Number(match[1]));
    }
    return 0;
  };

  const packageMarkup = () => `
    <section class="private-package-panel" id="private-growth-options" aria-labelledby="private-growth-title">
      <div class="eyebrow">Unlocked at 100% profile readiness</div>
      <h2 id="private-growth-title">Private visibility and growth options</h2>
      <p>These options are available only to logged-in suppliers with a completed professional profile. Verification, reviews, editorial recognition, and organic ranking cannot be purchased.</p>
      <div class="private-package-grid">
        <article class="private-package-card">
          <h3>Free Profile</h3>
          <span class="private-package-price">₱0 forever</span>
          <ul><li>Public professional profile</li><li>Essential portfolio and services</li><li>Organic discovery eligibility</li><li>Basic inquiries and statistics</li></ul>
          <button class="btn btn-secondary btn-block" type="button" disabled>Current foundation</button>
        </article>
        <article class="private-package-card">
          <h3>Pageant Index Pro</h3>
          <span class="private-package-price">₱499 monthly</span>
          <ul><li>Expanded HD portfolio</li><li>Inquiry management tools</li><li>Visitor and inquiry analytics</li><li>Priority profile review</li></ul>
          <button class="btn btn-primary btn-block private-plan-request" type="button" data-private-plan="Pageant Index Pro">Request Pro access</button>
        </article>
        <article class="private-package-card">
          <h3>Pageant Index Authority</h3>
          <span class="private-package-price">₱1,499 monthly</span>
          <ul><li>Everything in Pro</li><li>Team and multi-location tools</li><li>Enhanced profile SEO data</li><li>Quarterly profile optimization</li></ul>
          <button class="btn btn-primary btn-block private-plan-request" type="button" data-private-plan="Pageant Index Authority">Request Authority access</button>
        </article>
      </div>
    </section>`;

  const bindPrivatePlanButtons = () => {
    document.querySelectorAll(".private-plan-request").forEach((button) => {
      if (button.dataset.bound === "true") return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        const plan = button.dataset.privatePlan;
        localStorage.setItem("pi_private_plan_interest", JSON.stringify({ plan, createdAt: new Date().toISOString() }));
        if (typeof window.openModal === "function") {
          window.openModal(
            plan,
            `<p class="muted">Your completed profile qualifies you to request private onboarding for ${plan}. The Pageant Index team will review your account and contact details before activation.</p><form class="form-grid" data-modal-form><div class="field full"><label>Preferred contact email</label><input type="email" required></div><div class="field full"><label>Notes or goals</label><textarea placeholder="Tell us what you want to achieve with your profile."></textarea></div><div class="field full"><button class="btn btn-primary btn-block">Submit private request</button></div></form>`,
          );
        } else {
          window.alert(`${plan} request saved. The Pageant Index team will review your completed profile.`);
        }
      });
    });
  };

  const updateDashboardGate = () => {
    const main = document.querySelector(".product-main");
    if (!main) return;

    const completion = completionValue();
    const unlocked = completion >= 100;
    const adNav = [...document.querySelectorAll("[data-workspace-nav]")].find(
      (node) => node.textContent.trim().toLowerCase() === "advertising",
    );
    const publicAdLink = document.querySelector(".dashboard-ad-link");

    [adNav, publicAdLink].filter(Boolean).forEach((node) => {
      node.dataset.privatePackageHidden = unlocked ? "false" : "true";
    });

    let lock = document.getElementById("private-package-lock");
    let panel = document.getElementById("private-growth-options");

    if (!unlocked) {
      panel?.remove();
      if (!lock) {
        lock = document.createElement("section");
        lock.id = "private-package-lock";
        lock.className = "private-package-lock";
        main.appendChild(lock);
      }
      lock.innerHTML = `<div class="eyebrow">Private supplier options</div><h2>Complete your profile to unlock growth packages.</h2><p>Your profile is currently <strong>${completion}% complete</strong>. Package names, prices, promotional tools, and advertising options remain hidden until profile readiness reaches 100%.</p>`;
      return;
    }

    lock?.remove();
    if (!panel) {
      main.insertAdjacentHTML("beforeend", packageMarkup());
      bindPrivatePlanButtons();
    }
  };

  const protectDirectPackageAccess = () => {
    document.querySelectorAll("a[href='/advertise/'], a[href='/list-your-business/']").forEach((link) => {
      if (normalizePath() === "/dashboard") return;
      if (link.closest("footer") || link.closest("nav")) {
        link.setAttribute("href", "/sign-up/");
        link.setAttribute("title", "Create a supplier profile to access private growth options");
      }
    });
  };

  const run = () => {
    injectStyles();
    const path = normalizePath();
    if (path === "/list-your-business") replacePublicPricing();
    protectDirectPackageAccess();

    if (path === "/dashboard") {
      updateDashboardGate();
      const observer = new MutationObserver(updateDashboardGate);
      observer.observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
      document.addEventListener("input", updateDashboardGate);
      document.addEventListener("change", updateDashboardGate);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(run, 0), { once: true });
  } else {
    setTimeout(run, 0);
  }
})();
