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
    ["supplier", "Supplier"],
  ];

  const SUPPLIER_CATEGORIES = [
    "Pasarela / Runway Coach",
    "Q&A Coach",
    "Pageant Coach / Mentor",
    "Hair and Makeup Artist (HMUA)",
    "Fashion / Gown Designer",
    "National Costume Designer",
    "Photographer",
    "Videographer",
    "Pageant Camp / Training Center",
    "Stylist / Image Consultant",
    "Choreographer",
    "Host / Emcee",
    "Pageant Director / Organizer",
    "Events and Production",
    "Stage, Lights and Sound",
    "Livestreaming / Media Production",
    "Voting and Tabulation",
    "Crown and Sash Supplier",
    "Jewelry and Accessories",
    "Beauty and Wellness",
    "PR, Marketing and Digital Services",
    "Talent Agency / Management",
    "Sponsor / Brand Partner",
    "Venue",
    "Hotel / Accommodation",
    "Flights / Airline / Travel Agency",
    "Transportation / Tour Services",
    "Other",
  ];

  const countryOptions = (selected = "") => COUNTRIES
    .map(([name, flag]) => `<option value="${name}" ${selected === name ? "selected" : ""}>${flag} ${name}</option>`)
    .join("");

  const typeOptions = (selected = "") => ACCOUNT_TYPES
    .map(([value, label]) => `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`)
    .join("");

  const supplierCategoryOptions = (selected = "") => SUPPLIER_CATEGORIES
    .map((category) => `<option value="${category}" ${selected === category ? "selected" : ""}>${category}${category === "Other" ? " (please specify)" : ""}</option>`)
    .join("");

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
    document.querySelectorAll(".brand-type small").forEach((small) => {
      small.textContent = "THE GLOBAL NETWORK FOR PAGEANTRY";
    });
    document.querySelectorAll(".footer-brand p").forEach((p) => {
      p.textContent = "The global network connecting candidates, suppliers, pageant organizations, travel, hotels, and opportunities.";
    });
    document.querySelectorAll(".footer-bottom span").forEach((span, index) => {
      span.textContent = index === 0
        ? "© 2026 Pageant Index. All rights reserved."
        : "The global network for pageantry.";
    });
    document.querySelectorAll("a[aria-label*='Philippines']").forEach((a) => {
      a.setAttribute("aria-label", "Pageant Index home");
    });
  }

  function addTravelCategories() {
    const categoryGrid = document.querySelector(".category-grid");
    if (categoryGrid && !categoryGrid.querySelector('[data-global-hotels]')) {
      const hotel = document.createElement("a");
      hotel.className = "category-card";
      hotel.href = "/directory/?category=Hotel%20%2F%20Accommodation";
      hotel.dataset.globalHotels = "true";
      hotel.innerHTML = '<span class="category-icon" aria-hidden="true"><span style="font-size:1.2rem">🏨</span></span><span>Hotels and Accommodation</span>';
      categoryGrid.appendChild(hotel);
    }
    if (categoryGrid && !categoryGrid.querySelector('[data-global-flights]')) {
      const flight = document.createElement("a");
      flight.className = "category-card";
      flight.href = "/directory/?category=Flights%20%2F%20Airline%20%2F%20Travel%20Agency";
      flight.dataset.globalFlights = "true";
      flight.innerHTML = '<span class="category-icon" aria-hidden="true"><span style="font-size:1.2rem">✈️</span></span><span>Flights and Travel</span>';
      categoryGrid.appendChild(flight);
    }
  }

  function convertLocationFields() {
    document.querySelectorAll("select").forEach((select) => {
      const text = [...select.options].map((option) => option.textContent).join(" ");
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

    document.querySelectorAll("#live-location").forEach((element) => {
      element.textContent = "Country";
    });
  }

  function buildOtherSupplierField() {
    const field = document.createElement("div");
    field.className = "field";
    field.dataset.otherSupplierField = "true";
    field.hidden = true;
    field.innerHTML = '<label>Please specify your supplier category *</label><input name="supplier_category_other" maxlength="120" placeholder="Enter your service or business category">';
    return field;
  }

  function configureSupplierCategory(select, otherField, active) {
    const otherInput = otherField?.querySelector("input");
    const showOther = active && select?.value === "Other";
    if (otherField) otherField.hidden = !showOther;
    if (otherInput) otherInput.required = showOther;
  }

  function upgradeSignup() {
    const form = document.getElementById("signup-form");
    if (!form || form.dataset.globalUpgraded) return;
    form.dataset.globalUpgraded = "true";

    const submit = form.querySelector('button[type="submit"]');
    const typeField = document.createElement("div");
    typeField.className = "field";
    typeField.innerHTML = `<label>I am a *</label><select name="account_type" required><option value="">Choose one</option>${typeOptions()}</select>`;

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
      <div class="field"><label>Candidate status *</label><select name="candidate_stage"><option value="">Choose one</option><option>Aspiring candidate</option><option>Current candidate</option><option>Titleholder</option><option>Former candidate or titleholder</option></select></div>
      <div class="field"><label>Pageant or title represented</label><input name="pageant_title" maxlength="150" placeholder="Optional for aspiring candidates"></div>
      <div class="field"><label>Primary goal *</label><select name="candidate_goal"><option value="">Choose one</option><option>Find pageants</option><option>Find suppliers</option><option>Build my candidate profile</option><option>Find flights or hotels</option><option>Find sponsors or opportunities</option></select></div>`;
    submit.before(candidateFields);

    const business = form.elements.business;
    const category = form.elements.category;
    const otherSupplierField = buildOtherSupplierField();

    if (category) {
      category.innerHTML = `<option value="">Choose supplier category</option>${supplierCategoryOptions()}`;
      category.name = "supplier_category";
      const categoryLabel = category.closest(".field")?.querySelector("label");
      if (categoryLabel) categoryLabel.textContent = "Supplier category *";
      category.closest(".field")?.after(otherSupplierField);
    } else {
      submit.before(otherSupplierField);
    }

    if (business) {
      const label = business.closest(".field")?.querySelector("label");
      if (label) label.textContent = "Business or professional name *";
    }

    const accountType = form.elements.account_type;
    const toggleAccountFields = () => {
      const isCandidate = accountType.value === "candidate";
      const isSupplier = accountType.value === "supplier";

      candidateFields.hidden = !isCandidate;
      candidateFields.querySelectorAll("select, input").forEach((field) => {
        field.required = isCandidate && field.name !== "pageant_title";
      });

      if (business) {
        business.closest(".field").hidden = !isSupplier;
        business.required = isSupplier;
      }

      if (category) {
        category.closest(".field").hidden = !isSupplier;
        category.required = isSupplier;
        configureSupplierCategory(category, otherSupplierField, isSupplier);
      } else {
        otherSupplierField.hidden = true;
      }
    };

    accountType.addEventListener("change", toggleAccountFields);
    category?.addEventListener("change", () => {
      configureSupplierCategory(category, otherSupplierField, accountType.value === "supplier");
    });
    toggleAccountFields();
  }

  function makeProfileFieldsMandatory() {
    const form = document.getElementById("profile-editor-form");
    if (!form || form.dataset.simpleTypesUpgraded) return;
    form.dataset.simpleTypesUpgraded = "true";

    form.querySelectorAll("input, textarea, select").forEach((field) => {
      if (["link"].includes(field.name)) return;
      field.required = true;
    });

    const first = form.querySelector(".field");
    const typeField = document.createElement("div");
    typeField.className = "field";
    typeField.innerHTML = `<label>Profile type *</label><select name="account_type" required><option value="">Choose one</option>${typeOptions()}</select>`;
    first.before(typeField);

    const countryField = document.createElement("div");
    countryField.className = "field";
    countryField.innerHTML = `<label>Country *</label><select name="country" required><option value="">Select country</option>${countryOptions()}</select>`;
    typeField.after(countryField);

    const category = form.elements.category;
    const business = form.elements.business;
    const otherSupplierField = buildOtherSupplierField();

    if (category) {
      category.innerHTML = `<option value="">Choose supplier category</option>${supplierCategoryOptions()}`;
      category.name = "supplier_category";
      const categoryLabel = category.closest(".field")?.querySelector("label");
      if (categoryLabel) categoryLabel.textContent = "Supplier category *";
      category.closest(".field")?.after(otherSupplierField);
    }

    const accountType = form.elements.account_type;
    const toggleProfileFields = () => {
      const isSupplier = accountType.value === "supplier";
      if (business) {
        business.closest(".field").hidden = !isSupplier;
        business.required = isSupplier;
      }
      if (category) {
        category.closest(".field").hidden = !isSupplier;
        category.required = isSupplier;
        configureSupplierCategory(category, otherSupplierField, isSupplier);
      }
    };

    accountType.addEventListener("change", toggleProfileFields);
    category?.addEventListener("change", () => {
      configureSupplierCategory(category, otherSupplierField, accountType.value === "supplier");
    });
    toggleProfileFields();
  }

  function removeMadeUpUI() {
    document.querySelectorAll(".stat-grid, .mini-chart, .inquiry-list").forEach((element) => {
      const text = element.textContent || "";
      if (/(1,248|128 verified|Maria Santos|Cebu Queen Org|Juan Dela Cruz|92%|Alon)/i.test(text)) {
        element.remove();
      }
    });

    document.querySelectorAll(".dash-head h1").forEach((heading) => {
      heading.textContent = "Welcome to your Pageant Index workspace.";
    });
    document.querySelectorAll(".dash-head p").forEach((paragraph) => {
      paragraph.textContent = "Complete your verified profile to begin receiving real opportunities and inquiries.";
    });
    document.querySelectorAll(".panel").forEach((panel) => {
      if (/(Subscription|Professional Plan|Renews August|Review score)/i.test(panel.textContent)) {
        panel.remove();
      }
    });
  }

  function init() {
    replaceText();
    upgradeBrand();
    addTravelCategories();
    convertLocationFields();
    upgradeSignup();
    makeProfileFieldsMandatory();
    removeMadeUpUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }

  const observer = new MutationObserver(() => init());
  observer.observe(document.documentElement, {childList: true, subtree: true});
})();
