"use strict";

(() => {
  const COUNTRIES = [
    ["Philippines", "🇵🇭"], ["United States", "🇺🇸"], ["United Kingdom", "🇬🇧"],
    ["Canada", "🇨🇦"], ["Australia", "🇦🇺"], ["India", "🇮🇳"],
    ["Indonesia", "🇮🇩"], ["Thailand", "🇹🇭"], ["Vietnam", "🇻🇳"],
    ["Malaysia", "🇲🇾"], ["Singapore", "🇸🇬"], ["Japan", "🇯🇵"],
    ["South Korea", "🇰🇷"], ["Brazil", "🇧🇷"], ["Mexico", "🇲🇽"],
    ["Colombia", "🇨🇴"], ["Venezuela", "🇻🇪"], ["South Africa", "🇿🇦"],
    ["Nigeria", "🇳🇬"], ["France", "🇫🇷"], ["Spain", "🇪🇸"],
    ["Italy", "🇮🇹"], ["United Arab Emirates", "🇦🇪"], ["Other", "🌐"],
  ];
  const ACCOUNT_TYPES = [
    ["candidate", "Candidate"],
    ["creative-supplier", "Creative or Supplier"],
    ["business-organization", "Business or Pageant Organization"],
    ["general-user", "Pageant Enthusiast or Client"],
  ];
  const countryOptions = (selected = "") => COUNTRIES.map(([name, flag]) => `<option value="${name}" ${selected === name ? "selected" : ""}>${flag} ${name}</option>`).join("");
  const typeOptions = (selected = "") => ACCOUNT_TYPES.map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`).join("");

  function replaceText(root = document) {
    const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!node.parentElement || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)) return;
      node.nodeValue = node.nodeValue
        .replaceAll("Pageant Index Philippines", "Pageant Index")
        .replaceAll("PAGEANT INDEX PHILIPPINES", "PAGEANT INDEX")
        .replaceAll("Philippine pageantry", "global pageantry")
        .replaceAll("Philippine pageant", "global pageant")
        .replaceAll("across the Philippines", "around the world")
        .replaceAll("nationwide", "international")
        .replaceAll("Nationwide", "International")
        .replaceAll("province, or city", "country, city, or specialty")
        .replaceAll("province or city", "country or city")
        .replaceAll("All Philippines", "All countries");
    });
    document.title = document.title.replace("Pageant Index Philippines", "Pageant Index");
  }

  function upgradeBrand() {
    document.querySelectorAll(".brand-type small").forEach((small) => small.textContent = "THE GLOBAL NETWORK FOR PAGEANTRY");
    document.querySelectorAll(".footer-brand p").forEach((p) => p.textContent = "The global network connecting candidates, creatives, suppliers, businesses, pageant organizations, flights, hotels, and opportunities.");
    document.querySelectorAll(".footer-bottom span").forEach((span, index) => {
      span.textContent = index === 0 ? "© 2026 Pageant Index. All rights reserved." : "The global network for pageantry.";
    });
    document.querySelectorAll("a[aria-label*='Philippines']").forEach((a) => a.setAttribute("aria-label", "Pageant Index home"));
  }

  function addTravelCategory() {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid && !categoryGrid.querySelector('[data-global-travel]')) {
      const a = document.createElement("a");
      a.className = "category-card";
      a.href = "/directory/?category=Flights%20and%20Hotels";
      a.dataset.globalTravel = "true";
      a.innerHTML = '<span class="category-icon" aria-hidden="true"><span style="font-size:1.2rem">✈️</span></span><span>Flights and Hotels</span>';
      categoryGrid.appendChild(a);
    }
    document.querySelectorAll("select").forEach((select) => {
      const hasCategories = [...select.options].some((o) => o.textContent.includes("Photography"));
      if (hasCategories && ![...select.options].some((o) => o.value === "Flights and Hotels")) {
        select.add(new Option("Flights and Hotels", "Flights and Hotels"));
      }
    });
  }

  function convertLocationFields() {
    document.querySelectorAll("select").forEach((select) => {
      const text = [...select.options].map((o) => o.textContent).join(" ");
      if (!/(Metro Manila|Zambales|All locations|All Philippines)/i.test(text)) return;
      const selected = select.value;
      select.innerHTML = `<option value="">🌐 All countries</option>${countryOptions(selected)}`;
      select.setAttribute("aria-label", select.getAttribute("aria-label") || "Country");
    });
    document.querySelectorAll(".field").forEach((field) => {
      const label = field.querySelector("label");
      const input = field.querySelector("input");
      if (!label || !input || !/(City and province|Province or region|Location)/i.test(label.textContent)) return;
      label.textContent = "Country *";
      const select = document.createElement("select");
      select.name = input.name || "country";
      select.id = input.id;
      select.required = true;
      select.innerHTML = `<option value="">Select country</option>${countryOptions(input.value)}`;
      input.replaceWith(select);
    });
    document.querySelectorAll("#live-location").forEach((el) => el.textContent = "Country");
  }

  function upgradeSignup() {
    const form = document.getElementById("signup-form");
    if (!form || form.dataset.globalUpgraded) return;
    form.dataset.globalUpgraded = "true";
    const submit = form.querySelector('button[type="submit"]');
    const typeField = document.createElement("div");
    typeField.className = "field";
    typeField.innerHTML = `<label>Account type *</label><select name="account_type" required><option value="">Choose one</option>${typeOptions()}</select>`;
    const countryField = document.createElement("div");
    countryField.className = "field";
    countryField.innerHTML = `<label>Country *</label><select name="country" required><option value="">Select country</option>${countryOptions()}</select>`;
    const cityField = document.createElement("div");
    cityField.className = "field";
    cityField.innerHTML = '<label>City *</label><input name="city" required maxlength="100" autocomplete="address-level2">';
    submit.before(typeField, countryField, cityField);

    const candidateFields = document.createElement("section");
    candidateFields.id = "candidate-fields";
    candidateFields.className = "form-grid";
    candidateFields.hidden = true;
    candidateFields.innerHTML = `
      <div class="field"><label>Pageant stage *</label><select name="candidate_stage"><option value="">Choose stage</option><option>Aspiring candidate</option><option>Current candidate</option><option>Titleholder</option><option>Former candidate or titleholder</option></select></div>
      <div class="field"><label>Pageant or title represented</label><input name="pageant_title" maxlength="150" placeholder="Leave blank if not yet applicable"></div>
      <div class="field"><label>Age eligibility confirmation *</label><label class="checkbox-consent"><input type="checkbox" name="age_confirmed"> I confirm I meet the age requirements of the pageants I join.</label></div>
      <div class="field"><label>Candidate goals *</label><select name="candidate_goal"><option value="">Choose primary goal</option><option>Find pageants</option><option>Find creatives and suppliers</option><option>Build a candidate profile</option><option>Access travel and accommodation</option><option>Find sponsors or opportunities</option></select></div>`;
    submit.before(candidateFields);

    const accountType = form.elements.account_type;
    const toggleCandidate = () => {
      const active = accountType.value === "candidate";
      candidateFields.hidden = !active;
      candidateFields.querySelectorAll("select, input").forEach((field) => {
        if (["pageant_title"].includes(field.name)) return;
        field.required = active;
      });
      const business = form.elements.business;
      if (business) {
        business.closest(".field").hidden = ["candidate", "general-user"].includes(accountType.value);
        business.required = ["creative-supplier", "business-organization"].includes(accountType.value);
      }
      const category = form.elements.category;
      if (category) {
        category.closest(".field").hidden = ["candidate", "general-user"].includes(accountType.value);
        category.required = ["creative-supplier", "business-organization"].includes(accountType.value);
      }
    };
    accountType.addEventListener("change", toggleCandidate);
    toggleCandidate();
  }

  function makeProfileFieldsMandatory() {
    document.querySelectorAll("#profile-editor-form input, #profile-editor-form textarea, #profile-editor-form select").forEach((field) => {
      if (["link"].includes(field.name)) return;
      field.required = true;
    });
    const form = document.getElementById("profile-editor-form");
    if (form && !form.querySelector('[name="account_type"]')) {
      const first = form.querySelector(".field");
      const typeField = document.createElement("div");
      typeField.className = "field";
      typeField.innerHTML = `<label>Profile type *</label><select name="account_type" required><option value="">Choose one</option>${typeOptions()}</select>`;
      first.before(typeField);
      const countryField = document.createElement("div");
      countryField.className = "field";
      countryField.innerHTML = `<label>Country *</label><select name="country" required><option value="">Select country</option>${countryOptions()}</select>`;
      first.before(countryField);
    }
  }

  function removeMadeUpUI() {
    document.querySelectorAll(".stat-grid, .mini-chart, .inquiry-list").forEach((el) => {
      const text = el.textContent || "";
      if (/(1,248|128 verified|Maria Santos|Cebu Queen Org|Juan Dela Cruz|92%|Alon)/i.test(text)) el.remove();
    });
    document.querySelectorAll(".dash-head h1").forEach((h) => h.textContent = "Welcome to your Pageant Index workspace.");
    document.querySelectorAll(".dash-head p").forEach((p) => p.textContent = "Complete your verified profile to begin receiving real opportunities and inquiries.");
    document.querySelectorAll(".panel").forEach((panel) => {
      if (/(Subscription|Professional Plan|Renews August|Review score)/i.test(panel.textContent)) panel.remove();
    });
  }

  function init() {
    replaceText();
    upgradeBrand();
    addTravelCategory();
    convertLocationFields();
    upgradeSignup();
    makeProfileFieldsMandatory();
    removeMadeUpUI();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
  else setTimeout(init, 0);
  const observer = new MutationObserver(() => init());
  observer.observe(document.documentElement, {childList: true, subtree: true});
})();
