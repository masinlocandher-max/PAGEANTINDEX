"use strict";

(() => {
  const config = window.PageantIndexConfig;
  if (!config) return;

  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  const page = document.body.dataset.page || "home";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  })[character]);

  const readSession = () => {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        if (value?.access_token) return value;
      } catch {}
    }
    return null;
  };

  const saveSession = (session, persistent = false) => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    (persistent ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session));
  };

  async function request(pathname, options = {}, token = null) {
    const session = readSession();
    const headers = {
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    };
    const accessToken = token || session?.access_token;
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(`${SUPABASE_URL}${pathname}`, {...options, headers});
    const text = response.status === 204 ? "" : await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); } catch { payload = {message: text}; }
    }
    if (!response.ok) throw new Error(payload?.message || payload?.error_description || payload?.hint || `Request failed (${response.status})`);
    return payload;
  }

  const countryOptions = (selected = "") => config.countries
    .map(({code, name, flag}) => `<option value="${code}" ${selected === code ? "selected" : ""}>${flag} ${escapeHtml(name)}</option>`)
    .join("");

  const categoryOptions = (selected = "") => config.supplierCategories
    .map((category) => `<option value="${escapeHtml(category)}" ${selected === category ? "selected" : ""}>${escapeHtml(category)}</option>`)
    .join("");

  function additionalCategoryMarkup(selected = []) {
    const values = new Set(Array.isArray(selected) ? selected : []);
    return config.supplierCategories.map((category) => `
      <label class="pi-category-option">
        <input type="checkbox" name="supplier_additional_categories" value="${escapeHtml(category)}" ${values.has(category) ? "checked" : ""}>
        <span>${escapeHtml(category)}</span>
      </label>`).join("");
  }

  function selectedAdditionalCategories(form) {
    return [...form.querySelectorAll('input[name="supplier_additional_categories"]:checked')]
      .map((input) => input.value)
      .filter(Boolean);
  }

  function countryName(code) {
    return config.countries.find((country) => country.code === code)?.name || code || "";
  }

  function updateGlobalBranding() {
    document.documentElement.lang = "en";
    document.querySelectorAll(".brand-type small").forEach((small) => {
      small.textContent = config.tagline.toUpperCase();
    });
    document.querySelectorAll(".footer-brand p").forEach((paragraph) => {
      paragraph.textContent = "Connecting candidates, suppliers, pageant organizations, travel providers, hotels, and opportunities worldwide.";
    });
    const replacements = [
      ["Pageant Index Philippines", "Pageant Index"],
      ["PAGEANT INDEX PHILIPPINES", "PAGEANT INDEX"],
      ["Philippine pageantry", "global pageantry"],
      ["Philippine pageant", "global pageant"],
      ["across the Philippines", "around the world"],
      ["All Philippines", "All countries"],
      ["Nationwide", "International"],
      ["nationwide", "international"],
    ];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!node.parentElement || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(node.parentElement.tagName)) return;
      let value = node.nodeValue;
      replacements.forEach(([from, to]) => { value = value.replaceAll(from, to); });
      node.nodeValue = value;
    });
    document.title = document.title.replaceAll("Pageant Index Philippines", "Pageant Index");
  }

  function addTravelCategories() {
    const grid = document.querySelector(".category-grid");
    if (!grid) return;
    const categories = [
      ["Hotel / Accommodation", "Hotels and Accommodation", "🏨", "pi-hotels"],
      ["Flights / Airline / Travel Agency", "Flights and Travel", "✈️", "pi-flights"],
    ];
    categories.forEach(([value, label, icon, key]) => {
      if (grid.querySelector(`[data-${key}]`)) return;
      const card = document.createElement("a");
      card.className = "category-card";
      card.href = `/directory/?category=${encodeURIComponent(value)}`;
      card.dataset[key] = "true";
      card.innerHTML = `<span class="category-icon" aria-hidden="true"><span style="font-size:1.2rem">${icon}</span></span><span>${label}</span>`;
      grid.appendChild(card);
    });
  }

  function convertDirectoryLocationFilters() {
    document.querySelectorAll("select").forEach((select) => {
      if (select.dataset.piCountryUpgraded) return;
      const optionsText = [...select.options].map((option) => option.textContent).join(" ");
      if (!/(Metro Manila|Zambales|All locations|All Philippines|Cebu|Davao)/i.test(optionsText)) return;
      select.dataset.piCountryUpgraded = "true";
      select.innerHTML = `<option value="">🌐 All countries</option>${countryOptions()}`;
      select.setAttribute("aria-label", select.getAttribute("aria-label") || "Country");
    });
  }

  function signupFieldsMarkup() {
    return `
      <section class="pi-ecosystem-fields" data-pi-account-fields>
        <div class="field pi-field-full">
          <label>I am a *</label>
          <div class="pi-profile-type-switch">
            <label><input type="radio" name="account_type" value="candidate" required><span>Candidate</span></label>
            <label><input type="radio" name="account_type" value="supplier" required><span>Supplier</span></label>
          </div>
        </div>
        <div class="field"><label>Country *</label><select name="country_code" required><option value="">Select country</option>${countryOptions()}</select></div>
        <div class="field"><label>City *</label><input name="city" required maxlength="100" autocomplete="address-level2"></div>
        <div class="field pi-field-full"><label>State, province, or region</label><input name="region" maxlength="120" autocomplete="address-level1"></div>
      </section>
      <section class="pi-ecosystem-fields" data-pi-candidate-fields hidden>
        <div class="field"><label>Candidate status *</label><select name="candidate_status"><option value="">Choose one</option>${config.candidateStatuses.map((value) => `<option>${escapeHtml(value)}</option>`).join("")}</select></div>
        <div class="field"><label>Pageant or title represented</label><input name="candidate_pageant_title" maxlength="160" placeholder="Optional for aspiring candidates"></div>
        <div class="field pi-field-full"><label>Primary goal *</label><select name="candidate_goal"><option value="">Choose one</option>${config.candidateGoals.map((value) => `<option>${escapeHtml(value)}</option>`).join("")}</select></div>
      </section>
      <section class="pi-ecosystem-fields" data-pi-supplier-fields hidden>
        <div class="field"><label>Primary supplier category *</label><select name="supplier_primary_category"><option value="">Choose primary category</option>${categoryOptions()}</select></div>
        <div class="field"><label>Business or professional name *</label><input name="supplier_business_name" maxlength="160"></div>
        <div class="field pi-field-full"><label>Additional categories</label><div class="pi-category-grid">${additionalCategoryMarkup()}</div><span class="pi-helper">Choose every additional service you genuinely provide. Photographer and Videographer remain separate and may both be selected.</span></div>
        <div class="field pi-field-full" data-pi-other-category hidden><label>Please specify the other category *</label><input name="supplier_category_other" maxlength="120"></div>
        <div class="pi-travel-disclosure">${escapeHtml(config.travelDisclosure)}</div>
      </section>`;
  }

  function enhanceSignupForm() {
    const form = document.getElementById("signup-form");
    if (!form || form.dataset.piEcosystemReady) return;
    form.dataset.piEcosystemReady = "true";
    form.noValidate = true;
    const grid = form.querySelector(".form-grid") || form;
    grid.insertAdjacentHTML("beforeend", signupFieldsMarkup());

    const legacyBusiness = form.elements.business?.closest(".field");
    const legacyCategory = form.elements.category?.closest(".field");
    if (legacyBusiness) legacyBusiness.hidden = true;
    if (legacyCategory) legacyCategory.hidden = true;
    if (form.elements.business) form.elements.business.required = false;
    if (form.elements.category) form.elements.category.required = false;

    const ownershipConsent = [...form.querySelectorAll("label.checkbox-consent")].find((label) => label.textContent.includes("authorized"));
    if (ownershipConsent) {
      ownershipConsent.innerHTML = '<input type="checkbox" name="terms_and_privacy" required> I agree to the Pageant Index Terms, Privacy Policy, profile standards, and review process.';
    }

    const candidateFields = form.querySelector("[data-pi-candidate-fields]");
    const supplierFields = form.querySelector("[data-pi-supplier-fields]");
    const otherField = form.querySelector("[data-pi-other-category]");
    const accountRadios = [...form.querySelectorAll('input[name="account_type"]')];
    const primaryCategory = form.elements.supplier_primary_category;
    const additionalChecks = [...form.querySelectorAll('input[name="supplier_additional_categories"]')];

    const updateOther = () => {
      const hasOther = primaryCategory.value === "Other" || additionalChecks.some((input) => input.checked && input.value === "Other");
      otherField.hidden = !hasOther;
      otherField.querySelector("input").required = hasOther;
    };

    const updateType = () => {
      const type = accountRadios.find((input) => input.checked)?.value || "";
      candidateFields.hidden = type !== "candidate";
      supplierFields.hidden = type !== "supplier";
      candidateFields.querySelectorAll("input,select").forEach((field) => {
        field.required = type === "candidate" && field.name !== "candidate_pageant_title";
      });
      supplierFields.querySelectorAll("input,select").forEach((field) => {
        if (field.name === "supplier_category_other" || field.name === "supplier_additional_categories") return;
        field.required = type === "supplier";
      });
      updateOther();
    };

    accountRadios.forEach((input) => input.addEventListener("change", updateType));
    primaryCategory.addEventListener("change", updateOther);
    additionalChecks.forEach((input) => input.addEventListener("change", updateOther));
    updateType();

    form.addEventListener("submit", handleEcosystemSignup, true);
  }

  async function upsertCoreProfile(user, payload, token) {
    await request("/rest/v1/user_profiles?on_conflict=user_id", {
      method: "POST",
      headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
      body: JSON.stringify({
        user_id: user.id,
        account_type: payload.account_type,
        full_name_private: payload.name,
        display_name: payload.account_type === "supplier" ? payload.supplier_business_name : payload.name,
        country_code: payload.country_code,
        country_name: countryName(payload.country_code),
        city: payload.city,
        region: payload.region || null,
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
      }),
    }, token);

    if (payload.account_type === "candidate") {
      await request("/rest/v1/candidate_profile_drafts?on_conflict=user_id", {
        method: "POST",
        headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
        body: JSON.stringify({
          user_id: user.id,
          display_name: payload.name,
          candidate_status: payload.candidate_status,
          pageant_title: payload.candidate_pageant_title || null,
          primary_goal: payload.candidate_goal,
          country_code: payload.country_code,
          country_name: countryName(payload.country_code),
          city: payload.city,
          region: payload.region || null,
        }),
      }, token);
    } else {
      const additional = payload.supplier_additional_categories.filter((category) => category !== payload.supplier_primary_category);
      await request("/rest/v1/professional_profile_drafts?on_conflict=user_id", {
        method: "POST",
        headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
        body: JSON.stringify({
          user_id: user.id,
          business_name: payload.supplier_business_name,
          category: payload.supplier_primary_category,
          primary_category: payload.supplier_primary_category,
          additional_categories: additional,
          category_other: payload.supplier_category_other || null,
          country_code: payload.country_code,
          country_name: countryName(payload.country_code),
          city: payload.city,
          region: payload.region || null,
          location: [payload.city, payload.region, countryName(payload.country_code)].filter(Boolean).join(", "),
          public_email: payload.email,
        }),
      }, token);
    }
  }

  async function handleEcosystemSignup(event) {
    const form = event.currentTarget;
    if (form.dataset.piSubmitting === "true") return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const firstInvalid = [...form.elements].find((field) => typeof field.checkValidity === "function" && !field.checkValidity());
    if (firstInvalid) {
      firstInvalid.focus();
      firstInvalid.reportValidity?.();
      window.showToast?.("Please complete the required information.", "error");
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    if (data.password !== data.confirm) {
      window.showToast?.("Passwords do not match.", "error");
      return;
    }

    const payload = {
      ...data,
      supplier_additional_categories: selectedAdditionalCategories(form),
    };
    const button = form.querySelector('button[type="submit"]');
    const status = document.getElementById("signup-message");
    form.dataset.piSubmitting = "true";
    button.disabled = true;
    if (status) status.textContent = "Creating your secure Pageant Index account…";

    try {
      const response = await request("/auth/v1/signup", {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          data: {
            full_name: payload.name,
            account_type: payload.account_type,
            country_code: payload.country_code,
            country_name: countryName(payload.country_code),
            city: payload.city,
            region: payload.region || null,
            candidate_status: payload.account_type === "candidate" ? payload.candidate_status : null,
            candidate_pageant_title: payload.account_type === "candidate" ? payload.candidate_pageant_title || null : null,
            candidate_goal: payload.account_type === "candidate" ? payload.candidate_goal : null,
            business_name: payload.account_type === "supplier" ? payload.supplier_business_name : null,
            supplier_primary_category: payload.account_type === "supplier" ? payload.supplier_primary_category : null,
            supplier_additional_categories: payload.account_type === "supplier" ? payload.supplier_additional_categories : [],
            supplier_category_other: payload.account_type === "supplier" ? payload.supplier_category_other || null : null,
          },
        }),
      });

      if (response?.access_token && response?.user) {
        saveSession(response, false);
        await upsertCoreProfile(response.user, payload, response.access_token);
      }
      const message = response?.access_token ? "Account created successfully." : "Check your email to confirm your account.";
      if (status) status.textContent = message;
      window.showToast?.(message);
      setTimeout(() => {
        location.href = response?.access_token ? "/dashboard/" : "/sign-in/";
      }, 700);
    } catch (error) {
      if (status) status.textContent = error.message;
      window.showToast?.(error.message, "error");
      form.dataset.piSubmitting = "false";
      button.disabled = false;
    }
  }

  function supplierDashboardFields(userMetadata = {}) {
    const primary = userMetadata.supplier_primary_category || userMetadata.category || "";
    const additional = userMetadata.supplier_additional_categories || [];
    return `
      <section class="pi-ecosystem-fields pi-field-full" data-pi-dashboard-fields>
        <div class="field"><label>Country *</label><select name="country_code" required><option value="">Select country</option>${countryOptions(userMetadata.country_code || "")}</select></div>
        <div class="field"><label>City *</label><input name="city" required maxlength="100" value="${escapeHtml(userMetadata.city || "")}"></div>
        <div class="field pi-field-full"><label>State, province, or region</label><input name="region" maxlength="120" value="${escapeHtml(userMetadata.region || "")}"></div>
        <div class="field"><label>Primary category *</label><select name="supplier_primary_category" required><option value="">Choose primary category</option>${categoryOptions(primary)}</select></div>
        <div class="field pi-field-full"><label>Additional categories</label><div class="pi-category-grid">${additionalCategoryMarkup(additional)}</div><span class="pi-helper">Select all additional services offered. Photographer and Videographer remain separate categories.</span></div>
        <div class="field pi-field-full" data-pi-other-category hidden><label>Please specify the other category *</label><input name="supplier_category_other" maxlength="120" value="${escapeHtml(userMetadata.supplier_category_other || "")}"></div>
        <div class="pi-travel-disclosure">${escapeHtml(config.travelDisclosure)}</div>
      </section>`;
  }

  async function enhanceSupplierDashboard(user) {
    const form = document.getElementById("profile-editor-form");
    if (!form || form.dataset.piSupplierDashboard) return;
    form.dataset.piSupplierDashboard = "true";
    form.insertAdjacentHTML("afterbegin", supplierDashboardFields(user.user_metadata || {}));
    const primary = form.elements.supplier_primary_category;
    const oldCategory = form.elements.category;
    if (oldCategory) {
      oldCategory.closest(".field").hidden = true;
      oldCategory.required = false;
    }
    const location = form.elements.location;
    if (location) {
      location.closest(".field").hidden = true;
      location.required = false;
    }
    const otherField = form.querySelector("[data-pi-other-category]");
    const updateOther = () => {
      const hasOther = primary.value === "Other" || selectedAdditionalCategories(form).includes("Other");
      otherField.hidden = !hasOther;
      otherField.querySelector("input").required = hasOther;
    };
    primary.addEventListener("change", updateOther);
    form.querySelectorAll('input[name="supplier_additional_categories"]').forEach((input) => input.addEventListener("change", updateOther));
    updateOther();

    try {
      const rows = await request(`/rest/v1/professional_profile_drafts?select=primary_category,additional_categories,category_other,country_code,country_name,city,region&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
      const draft = rows?.[0];
      if (draft) {
        form.elements.country_code.value = draft.country_code || form.elements.country_code.value;
        form.elements.city.value = draft.city || form.elements.city.value;
        form.elements.region.value = draft.region || form.elements.region.value;
        primary.value = draft.primary_category || primary.value;
        const values = new Set(draft.additional_categories || []);
        form.querySelectorAll('input[name="supplier_additional_categories"]').forEach((input) => { input.checked = values.has(input.value); });
        form.elements.supplier_category_other.value = draft.category_other || "";
        updateOther();
      }
    } catch (error) {
      console.warn("Pageant Index ecosystem profile fields could not be loaded.", error.message);
    }

    const persist = async () => {
      const countryCode = form.elements.country_code.value;
      const primaryCategory = primary.value;
      const additional = selectedAdditionalCategories(form).filter((category) => category !== primaryCategory);
      const payload = {
        user_id: user.id,
        business_name: form.elements.business?.value.trim() || user.user_metadata?.business_name || "",
        category: primaryCategory,
        primary_category: primaryCategory,
        additional_categories: additional,
        category_other: form.elements.supplier_category_other.value.trim() || null,
        country_code: countryCode,
        country_name: countryName(countryCode),
        city: form.elements.city.value.trim(),
        region: form.elements.region.value.trim() || null,
        location: [form.elements.city.value.trim(), form.elements.region.value.trim(), countryName(countryCode)].filter(Boolean).join(", "),
      };
      await request("/rest/v1/professional_profile_drafts?on_conflict=user_id", {
        method: "POST",
        headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
        body: JSON.stringify(payload),
      });
      await request("/rest/v1/user_profiles?on_conflict=user_id", {
        method: "POST",
        headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
        body: JSON.stringify({
          user_id: user.id,
          account_type: "supplier",
          display_name: payload.business_name,
          country_code: countryCode,
          country_name: countryName(countryCode),
          city: payload.city,
          region: payload.region,
        }),
      });
    };

    ["save-profile-draft", "submit-profile-review"].forEach((id) => {
      document.getElementById(id)?.addEventListener("click", () => persist().catch((error) => window.showToast?.(error.message, "error")));
    });
  }

  function candidateDashboardMarkup(user, profile = {}) {
    const metadata = user.user_metadata || {};
    const selectedCountry = profile.country_code || metadata.country_code || "";
    return `<main class="pi-candidate-shell">
      <header class="pi-candidate-topbar"><div><h1>Candidate Workspace</h1><small>${escapeHtml(config.tagline)}</small></div><button type="button" class="btn btn-ghost" data-pi-signout>Sign out</button></header>
      <div class="pi-candidate-layout">
        <aside class="pi-candidate-sidebar"><nav>${["Profile","Saved Suppliers","Saved Pageants","Travel"].map((label, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-pi-candidate-tab="${label.toLowerCase().replaceAll(" ", "-")}">${label}</button>`).join("")}</nav></aside>
        <section class="pi-candidate-main">
          <section data-pi-candidate-panel="profile">
            <div class="pi-candidate-grid">
              <div class="pi-panel"><h2>Your candidate profile</h2><p class="muted">Keep your identity and pageant journey accurate. Your private account name is not automatically published.</p>
                <form class="pi-candidate-form" id="pi-candidate-profile-form">
                  <div class="field"><label>Public display name *</label><input name="display_name" required maxlength="160" value="${escapeHtml(profile.display_name || metadata.full_name || "")}"></div>
                  <div class="field"><label>Candidate status *</label><select name="candidate_status" required><option value="">Choose one</option>${config.candidateStatuses.map((value) => `<option ${value === (profile.candidate_status || metadata.candidate_status) ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></div>
                  <div class="field"><label>Country *</label><select name="country_code" required><option value="">Select country</option>${countryOptions(selectedCountry)}</select></div>
                  <div class="field"><label>City *</label><input name="city" required maxlength="100" value="${escapeHtml(profile.city || metadata.city || "")}"></div>
                  <div class="field full"><label>State, province, or region</label><input name="region" maxlength="120" value="${escapeHtml(profile.region || metadata.region || "")}"></div>
                  <div class="field full"><label>Pageant or title represented</label><input name="pageant_title" maxlength="160" value="${escapeHtml(profile.pageant_title || metadata.candidate_pageant_title || "")}" placeholder="Optional for aspiring candidates"></div>
                  <div class="field full"><label>Primary goal *</label><select name="primary_goal" required><option value="">Choose one</option>${config.candidateGoals.map((value) => `<option ${value === (profile.primary_goal || metadata.candidate_goal) ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></div>
                  <div class="field full"><button class="btn btn-primary" type="submit">Save candidate profile</button></div>
                </form>
              </div>
              <aside class="pi-panel"><h2>Profile privacy</h2><p class="muted">Your email, legal name, and private account information remain hidden from public profiles. Only information you submit for publication should appear publicly.</p><div class="pi-travel-disclosure">${escapeHtml(config.travelDisclosure)}</div></aside>
            </div>
          </section>
          <section data-pi-candidate-panel="saved-suppliers" hidden><div class="pi-panel"><h2>Saved suppliers</h2><div class="pi-empty">No suppliers saved yet. Browse the verified directory and save professionals you may want to contact.</div><a class="btn btn-primary" href="/directory/" style="margin-top:16px">Browse suppliers</a></div></section>
          <section data-pi-candidate-panel="saved-pageants" hidden><div class="pi-panel"><h2>Saved pageants</h2><div class="pi-empty">No pageants saved yet. Published events and pageant opportunities will appear here after you save them.</div><a class="btn btn-primary" href="/pageant-calendar/" style="margin-top:16px">Open pageant calendar</a></div></section>
          <section data-pi-candidate-panel="travel" hidden><div class="pi-panel"><h2>Flights, hotels, and travel providers</h2><p class="muted">Find travel agencies, airlines, hotels, accommodation providers, transportation, and tour services listed in Pageant Index.</p><div class="pi-travel-disclosure">${escapeHtml(config.travelDisclosure)}</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><a class="btn btn-primary" href="/directory/?category=Flights%20%2F%20Airline%20%2F%20Travel%20Agency">Find flights and travel</a><a class="btn btn-secondary" href="/directory/?category=Hotel%20%2F%20Accommodation">Find hotels</a></div></div></section>
        </section>
      </div>
      <nav class="pi-mobile-nav">${["Profile","Suppliers","Pageants","Travel"].map((label, index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-pi-mobile-tab="${["profile","saved-suppliers","saved-pageants","travel"][index]}">${label}</button>`).join("")}</nav>
    </main>`;
  }

  async function renderCandidateDashboard(user) {
    let profile = {};
    try {
      const rows = await request(`/rest/v1/candidate_profile_drafts?select=display_name,candidate_status,pageant_title,primary_goal,country_code,country_name,city,region&user_id=eq.${encodeURIComponent(user.id)}&limit=1`);
      profile = rows?.[0] || {};
    } catch (error) {
      console.warn("Candidate profile could not be loaded.", error.message);
    }
    document.getElementById("app").innerHTML = candidateDashboardMarkup(user, profile);
    const activate = (name) => {
      document.querySelectorAll("[data-pi-candidate-panel]").forEach((panel) => { panel.hidden = panel.dataset.piCandidatePanel !== name; });
      document.querySelectorAll("[data-pi-candidate-tab]").forEach((button) => button.classList.toggle("active", button.dataset.piCandidateTab === name));
      document.querySelectorAll("[data-pi-mobile-tab]").forEach((button) => button.classList.toggle("active", button.dataset.piMobileTab === name));
    };
    document.querySelectorAll("[data-pi-candidate-tab]").forEach((button) => button.addEventListener("click", () => activate(button.dataset.piCandidateTab)));
    document.querySelectorAll("[data-pi-mobile-tab]").forEach((button) => button.addEventListener("click", () => activate(button.dataset.piMobileTab)));
    document.querySelector("[data-pi-signout]")?.addEventListener("click", async () => {
      try { await request("/auth/v1/logout", {method: "POST"}); } catch {}
      localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); location.href = "/sign-in/";
    });
    document.getElementById("pi-candidate-profile-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      const button = form.querySelector("button");
      button.disabled = true;
      try {
        await request("/rest/v1/candidate_profile_drafts?on_conflict=user_id", {
          method: "POST",
          headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
          body: JSON.stringify({
            user_id: user.id,
            display_name: data.display_name.trim(),
            candidate_status: data.candidate_status,
            pageant_title: data.pageant_title.trim() || null,
            primary_goal: data.primary_goal,
            country_code: data.country_code,
            country_name: countryName(data.country_code),
            city: data.city.trim(),
            region: data.region.trim() || null,
          }),
        });
        await request("/rest/v1/user_profiles?on_conflict=user_id", {
          method: "POST",
          headers: {Prefer: "resolution=merge-duplicates,return=minimal"},
          body: JSON.stringify({user_id:user.id,account_type:"candidate",display_name:data.display_name.trim(),country_code:data.country_code,country_name:countryName(data.country_code),city:data.city.trim(),region:data.region.trim()||null}),
        });
        window.showToast?.("Candidate profile saved.");
      } catch (error) {
        window.showToast?.(error.message, "error");
      } finally { button.disabled = false; }
    });
  }

  async function enhanceDashboardByAccountType() {
    if (page !== "dashboard") return;
    const session = readSession();
    if (!session?.access_token) return;
    let user = session.user;
    try { user = await request("/auth/v1/user", {method: "GET"}, session.access_token); } catch {}
    const accountType = user?.user_metadata?.account_type || "supplier";
    if (accountType === "candidate") await renderCandidateDashboard(user);
    else await enhanceSupplierDashboard(user);
  }

  async function enhanceAdmin() {
    if (page !== "admin" || document.querySelector("[data-pi-admin-users]")) return;
    const session = readSession();
    if (session?.user?.app_metadata?.role !== "admin") return;
    const layout = document.querySelector(".admin-suppliers-layout");
    if (!layout) return;
    try {
      const [users, candidates] = await Promise.all([
        request("/rest/v1/user_profiles?select=user_id,account_type,display_name,country_code,country_name,city,region,updated_at&order=updated_at.desc&limit=100"),
        request("/rest/v1/candidate_profile_drafts?select=user_id,display_name,candidate_status,pageant_title,primary_goal,country_code,country_name,city,updated_at&order=updated_at.desc&limit=100"),
      ]);
      const section = document.createElement("section");
      section.className = "admin-primary pi-admin-section";
      section.dataset.piAdminUsers = "true";
      section.innerHTML = `<div class="panel-title"><h2>Candidate and supplier accounts</h2><span>${users.length} accounts</span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Account</th><th>Type</th><th>Country</th><th>City / region</th><th>Updated</th></tr></thead><tbody>${users.length ? users.map((row) => `<tr><td><strong>${escapeHtml(row.display_name || "Profile incomplete")}</strong></td><td>${escapeHtml(row.account_type)}</td><td>${escapeHtml(config.flagFromCode(row.country_code))} ${escapeHtml(row.country_name || "Not supplied")}</td><td>${escapeHtml([row.city,row.region].filter(Boolean).join(", ") || "Not supplied")}</td><td>${escapeHtml(row.updated_at ? new Date(row.updated_at).toLocaleString("en") : "")}</td></tr>`).join("") : '<tr><td colspan="5">No account profiles yet.</td></tr>'}</tbody></table></div><div class="panel-title"><h2>Candidate profile drafts</h2><span>${candidates.length} candidates</span></div><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Candidate</th><th>Status</th><th>Pageant / title</th><th>Goal</th><th>Country</th></tr></thead><tbody>${candidates.length ? candidates.map((row) => `<tr><td><strong>${escapeHtml(row.display_name)}</strong></td><td>${escapeHtml(row.candidate_status)}</td><td>${escapeHtml(row.pageant_title || "Not applicable")}</td><td>${escapeHtml(row.primary_goal)}</td><td>${escapeHtml(config.flagFromCode(row.country_code))} ${escapeHtml(row.country_name || "")}</td></tr>`).join("") : '<tr><td colspan="5">No candidate drafts yet.</td></tr>'}</tbody></table></div>`;
      layout.appendChild(section);
    } catch (error) {
      console.warn("Admin ecosystem queues could not be loaded.", error.message);
    }
  }

  let scheduled = false;
  function run() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(async () => {
      scheduled = false;
      updateGlobalBranding();
      addTravelCategories();
      convertDirectoryLocationFilters();
      enhanceSignupForm();
      await enhanceDashboardByAccountType();
      await enhanceAdmin();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, {once:true});
  else run();
  const observer = new MutationObserver(run);
  observer.observe(document.getElementById("app") || document.body, {childList:true,subtree:true});
})();
