"use strict";

(() => {
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";

  const curatedEvents = [
    {
      slug: "miss-supranational-2026",
      name: "Miss Supranational 2026",
      organization: "Supranational Organisation",
      scope: "International",
      type: "International Final",
      startsAt: "2026-07-31T19:00:00+02:00",
      endsAt: "2026-07-31T23:00:00+02:00",
      location: "Poland",
      venue: "Festival of Beauty 2026",
      status: "confirmed",
      verification: "Official source",
      sourceUrl: "https://www.misssupranational.com/miss-supranational-2026-finale-dates-announced/",
      description: "The international final of Miss Supranational 2026, presented as part of the Festival of Beauty in Poland.",
    },
    {
      slug: "mister-supranational-2026",
      name: "Mister Supranational 2026",
      organization: "Supranational Organisation",
      scope: "International",
      type: "International Final",
      startsAt: "2026-08-01T19:00:00+02:00",
      endsAt: "2026-08-01T23:00:00+02:00",
      location: "Poland",
      venue: "Festival of Beauty 2026",
      status: "confirmed",
      verification: "Official source",
      sourceUrl: "https://www.misssupranational.com/miss-supranational-2026-finale-dates-announced/",
      description: "The international final of Mister Supranational 2026 during Poland's Festival of Beauty.",
    },
    {
      slug: "reina-filipinas-2026",
      name: "Reina Filipinas 2026",
      organization: "Reina Filipinas",
      scope: "Philippines",
      type: "National Final",
      startsAt: "2026-08-07T18:00:00+08:00",
      endsAt: "2026-08-07T23:00:00+08:00",
      location: "Philippines",
      venue: "Venue to be confirmed by the organizer",
      status: "confirmed",
      verification: "Reviewed source",
      sourceUrl: "https://www.gmanetwork.com/news/lifestyle/content/991068/reina-filipinas-opens-applications-for-inaugural-pageant-sets-coronation-for-august-7/story/",
      description: "The inaugural coronation of Reina Filipinas, selecting Philippine representatives for Miss Grand International-related titles.",
    },
    {
      slug: "miss-world-75th-anniversary-2026",
      name: "Miss World 75th Anniversary Festival",
      organization: "Miss World Organization",
      scope: "International",
      type: "International Festival",
      startsAt: "2026-08-09T09:00:00+07:00",
      endsAt: "2026-09-05T23:00:00+07:00",
      featuredDate: "September 5 final",
      location: "Vietnam",
      venue: "Final week in Nha Trang",
      status: "confirmed",
      verification: "Official source",
      sourceUrl: "https://www.missworld.com/news/nha-trang-vietnam-to-host-the-final-show-of-miss-worlds-75th-anniversary-celebration",
      description: "Miss World's 75th anniversary program begins on August 9, with the final show scheduled for September 5 in Vietnam.",
    },
    {
      slug: "miss-america-2027",
      name: "Miss America 2027",
      organization: "Miss America Organization",
      scope: "United States",
      type: "National Competition",
      startsAt: "2026-08-28T09:00:00-04:00",
      endsAt: "2026-09-06T23:00:00-04:00",
      featuredDate: "September 6 final",
      location: "West Palm Beach, Florida, USA",
      venue: "The Palm Beaches",
      status: "confirmed",
      verification: "Official source",
      sourceUrl: "https://missamerica.org/2026/05/07/miss-america-announces-west-palm-beach-as-new-host-city/",
      description: "A multi-day national competition in West Palm Beach culminating in the crowning of the 99th Miss America on September 6.",
    },
    {
      slug: "ms-international-world-2026",
      name: "Ms. International World 2026",
      organization: "Ms. International World",
      scope: "International",
      type: "International Competition",
      startsAt: "2026-09-17T09:00:00-04:00",
      endsAt: "2026-09-21T23:00:00-04:00",
      location: "Fort Lauderdale, Florida, USA",
      venue: "Bahia Mar Fort Lauderdale Beach",
      status: "confirmed",
      verification: "Official source",
      sourceUrl: "https://www.msinternationalworld.com/",
      description: "The 2026 international program is scheduled at Bahia Mar Fort Lauderdale Beach from September 17 through September 21.",
    },
    {
      slug: "universal-woman-2026",
      name: "Universal Woman 2026",
      organization: "Universal Woman",
      scope: "International",
      type: "International Competition",
      startsAt: "2026-09-01T00:00:00+07:00",
      endsAt: null,
      datePrecision: "month",
      location: "Cambodia",
      venue: "Exact dates and venue pending",
      status: "announced",
      verification: "Official announcement",
      sourceUrl: "https://universalwomanofficial.com/news/",
      description: "Cambodia has been officially announced as host for the September 2026 edition. Exact dates remain pending.",
    },
    {
      slug: "miss-malaysia-tourism-2026",
      name: "Miss Malaysia Tourism Pageant 2026",
      organization: "D'Touch International",
      scope: "Malaysia",
      type: "National Tourism Pageant",
      startsAt: "2026-10-06T09:00:00+08:00",
      endsAt: "2026-10-18T18:00:00+08:00",
      featuredDate: "October 17 final",
      location: "Ipoh, Malaysia",
      venue: "Kinta Riverfront Hotel",
      status: "confirmed",
      verification: "Official source",
      sourceUrl: "https://www.missmalaysia.com.my/",
      description: "The pageant period runs October 6 to 18, with the national final scheduled for October 17 in Ipoh.",
    },
    {
      slug: "miss-universe-2026",
      name: "Miss Universe 2026: 75th Anniversary",
      organization: "Miss Universe Organization",
      scope: "International",
      type: "International Competition",
      startsAt: "2026-11-01T00:00:00-04:00",
      endsAt: null,
      datePrecision: "month",
      location: "San Juan, Puerto Rico",
      venue: "Coliseo de Puerto Rico José Miguel Agrelot",
      status: "announced",
      verification: "Official announcement",
      sourceUrl: "https://www.missuniverse.com/press-releases/miss-universe-press-release-11/",
      description: "Puerto Rico will host the 75th anniversary edition in November 2026. The exact competition date has not yet been published by the organization.",
    },
  ];

  const watchlist = [
    {name: "Miss International 2026", place: "Japan", url: "https://www.miss-international.org/en/"},
    {name: "Miss Grand International 2026", place: "Date and venue pending", url: "https://missgrand.com/"},
    {name: "Miss Earth 2026", place: "Date and venue pending", url: "https://www.missearth.tv/"},
    {name: "Miss Intercontinental 2026", place: "Sahl Hasheesh, Egypt · Dates pending", url: "https://www.missintercontinental.de/"},
  ];

  const icon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  const icons = {
    pin: icon('<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'),
    calendar: icon('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'),
    building: icon('<path d="M4 21V5l8-3 8 3v16M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M9 21v-5h6v5"/>'),
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } };
  const formatMonth = (date) => new Intl.DateTimeFormat("en", {month:"short"}).format(date).toUpperCase();
  const formatLong = (date) => new Intl.DateTimeFormat("en-PH", {month:"long",day:"numeric",year:"numeric",timeZone:"Asia/Manila"}).format(date);
  const eventStart = (event) => event.startsAt ? new Date(event.startsAt) : null;

  async function supabase(path, options = {}) {
    const session = readSession();
    const headers = {apikey: SUPABASE_KEY, "Content-Type":"application/json", Prefer:"return=representation", ...(options.headers || {})};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    let response;
    try { response = await fetch(`${SUPABASE_URL}${path}`, {...options, headers, signal: options.signal || controller.signal}); }
    finally { clearTimeout(timeout); }
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || payload?.hint || `Request failed (${response.status})`);
    return payload;
  }

  function normalizeDatabaseEvent(row) {
    return {
      slug: row.slug,
      name: row.name,
      organization: row.organization_name || "Pageant organization",
      scope: "Submitted Event",
      type: row.event_type || "Pageant Event",
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      applicationDeadline: row.application_deadline,
      location: row.venue_name || "Location published by organizer",
      venue: row.venue_name || "Venue details pending",
      status: "confirmed",
      verification: "Pageant Index reviewed",
      sourceUrl: row.official_url || "",
      description: row.description || "A reviewed pageant event submitted to Pageant Index.",
      database: true,
    };
  }

  function countdown(event) {
    const start = eventStart(event);
    if (!start) return {label:"Date pending", className:"pending"};
    const days = Math.ceil((start.getTime() - Date.now()) / 86400000);
    if (event.datePrecision === "month") return {label:"Exact date pending", className:"pending"};
    if (days > 1) return {label:`${days} days to go`, className:""};
    if (days === 1) return {label:"Tomorrow", className:"live"};
    if (days === 0) return {label:"Happening today", className:"live"};
    if (event.endsAt && new Date(event.endsAt) >= new Date()) return {label:"Happening now", className:"live"};
    return {label:"Event completed", className:"pending"};
  }

  function dateTile(event) {
    const start = eventStart(event);
    if (!start) return '<div class="event-date-tile month-only"><strong>TBA</strong><span>Date</span></div>';
    if (event.datePrecision === "month") return `<div class="event-date-tile month-only"><strong>${formatMonth(start)}</strong><span>${start.getFullYear()}</span></div>`;
    return `<div class="event-date-tile"><strong>${start.getDate()}</strong><span>${formatMonth(start)}</span></div>`;
  }

  function dateDescription(event) {
    const start = eventStart(event);
    if (!start) return "Date to be announced";
    if (event.datePrecision === "month") return `${new Intl.DateTimeFormat("en", {month:"long"}).format(start)} ${start.getFullYear()} · exact date pending`;
    const end = event.endsAt ? new Date(event.endsAt) : null;
    if (event.featuredDate) return `${formatLong(start)} onward · ${event.featuredDate}`;
    if (end && end.toDateString() !== start.toDateString()) return `${formatLong(start)} to ${formatLong(end)}`;
    return formatLong(start);
  }

  function eventCard(event) {
    const cd = countdown(event);
    return `<article class="event-card" data-event-card data-slug="${escapeHtml(event.slug)}" data-search="${escapeHtml(`${event.name} ${event.organization} ${event.location} ${event.scope} ${event.type}`.toLowerCase())}" data-month="${event.startsAt ? new Date(event.startsAt).getMonth()+1 : "pending"}" data-region="${escapeHtml(event.scope)}" data-status="${escapeHtml(event.status)}">
      <div class="event-card-top">${dateTile(event)}<div><div class="event-scope">${escapeHtml(event.scope)} · ${escapeHtml(event.type)}</div><h3>${escapeHtml(event.name)}</h3></div></div>
      <div class="event-meta"><span>${icons.calendar}<b>${escapeHtml(dateDescription(event))}</b></span><span>${icons.pin}<span>${escapeHtml(event.location)}</span></span><span>${icons.building}<span>${escapeHtml(event.venue)}</span></span></div>
      <div class="event-card-footer"><div class="event-statuses"><span class="event-badge ${event.status}">${event.status === "confirmed" ? "Confirmed" : event.status === "announced" ? "Announced" : "Details pending"}</span><span class="event-badge verified">${escapeHtml(event.verification)}</span></div><button class="event-link" type="button" data-event-details="${escapeHtml(event.slug)}">View details →</button></div>
      <div style="padding:0 22px 20px"><span class="countdown ${cd.className}">${escapeHtml(cd.label)}</span></div>
    </article>`;
  }

  function modal(title, body) {
    if (typeof window.openModal === "function") return window.openModal(title, body);
    const wrap = document.createElement("div");
    wrap.className = "modal-backdrop open";
    wrap.innerHTML = `<div class="modal-card"><button class="modal-close" aria-label="Close">×</button><h2>${escapeHtml(title)}</h2>${body}</div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (e) => { if (e.target === wrap || e.target.closest(".modal-close")) wrap.remove(); });
  }

  function showEventDetails(event) {
    if (!event) return;
    const cd = countdown(event);
    history.replaceState({}, "", `${location.pathname}?event=${encodeURIComponent(event.slug)}`);
    modal(event.name, `<div class="event-detail-panel"><div class="event-detail-heading"><div class="event-scope">${escapeHtml(event.scope)} · ${escapeHtml(event.type)}</div><h3>${escapeHtml(event.name)}</h3><p>${escapeHtml(event.description)}</p></div><div class="event-detail-grid"><div><small>Schedule</small><strong>${escapeHtml(dateDescription(event))}</strong></div><div><small>Location</small><strong>${escapeHtml(event.location)}</strong></div><div><small>Venue</small><strong>${escapeHtml(event.venue)}</strong></div><div><small>Organizer</small><strong>${escapeHtml(event.organization)}</strong></div></div><div class="event-source-warning">Calendar status: <strong>${event.status === "confirmed" ? "Confirmed" : "Announced, details pending"}</strong>. Information was last checked on July 30, 2026. Organizers may update schedules, venues, and access arrangements.</div>${event.sourceUrl ? `<a class="btn btn-primary btn-block" href="${escapeHtml(event.sourceUrl)}" target="_blank" rel="noopener noreferrer">Visit Official Source</a>` : ""}<span class="countdown ${cd.className}">${escapeHtml(cd.label)}</span></div>`);
  }

  function submissionForm() {
    return `<form class="form-grid" id="calendar-event-submission"><div class="field"><label>Pageant name *</label><input name="name" required maxlength="160"></div><div class="field"><label>Organization *</label><input name="organization_name" required maxlength="160"></div><div class="field"><label>Start date *</label><input name="starts_at" type="date" required></div><div class="field"><label>End date</label><input name="ends_at" type="date"></div><div class="field"><label>Application deadline</label><input name="application_deadline" type="date"></div><div class="field"><label>Event type *</label><select name="event_type" required><option>International</option><option>National</option><option>Regional</option><option>Provincial</option><option>Municipal</option><option>Festival</option><option>Tourism</option><option>School</option><option>Male Pageant</option><option>LGBTQIA+ Pageant</option><option>Mrs. / Ms. Pageant</option></select></div><div class="field full"><label>Venue and location *</label><input name="venue_name" required maxlength="240" placeholder="Venue, city, country"></div><div class="field full"><label>Official event link *</label><input name="official_url" type="url" required></div><div class="field"><label>Organizer email *</label><input name="organizer_email" type="email" required></div><div class="field"><label>Organizer mobile</label><input name="organizer_mobile"></div><div class="field full"><label>Event description</label><textarea name="description" maxlength="2000"></textarea></div><label class="checkbox-consent field full"><input type="checkbox" required> I confirm that the information is official and may be reviewed before publication.</label><div class="field full"><button class="btn btn-primary btn-block">Submit for Editorial Review</button></div></form>`;
  }

  function openSubmission() {
    modal("Submit a Pageant Event", submissionForm());
    setTimeout(() => {
      document.getElementById("calendar-event-submission")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const button = form.querySelector("button");
        const data = Object.fromEntries(new FormData(form));
        const session = readSession();
        if (!session?.user?.id || !session?.access_token) {
          localStorage.setItem("pi_event_submission_draft", JSON.stringify({...data, savedAt:new Date().toISOString()}));
          form.innerHTML = '<div class="empty-state"><h3>Your event draft is saved</h3><p>Sign in or create a free account to securely submit this event for editorial review.</p><a class="btn btn-primary" href="/sign-in/?tab=signup">Sign In or Create Account</a></div>';
          return;
        }
        button.disabled = true;
        button.textContent = "Submitting…";
        try {
          const payload = {
            submitted_by: session.user.id,
            name: data.name,
            slug: `${String(data.name).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${Date.now().toString().slice(-6)}`,
            organization_name: data.organization_name,
            description: data.description || null,
            event_type: data.event_type,
            starts_at: new Date(`${data.starts_at}T12:00:00+08:00`).toISOString(),
            ends_at: data.ends_at ? new Date(`${data.ends_at}T23:59:00+08:00`).toISOString() : null,
            application_deadline: data.application_deadline ? new Date(`${data.application_deadline}T23:59:00+08:00`).toISOString() : null,
            venue_name: data.venue_name,
            official_url: data.official_url,
            organizer_email: data.organizer_email,
            organizer_mobile: data.organizer_mobile || null,
            status: "pending",
          };
          await supabase("/rest/v1/events", {method:"POST", body:JSON.stringify(payload)});
          form.innerHTML = '<div class="empty-state"><h3>Event submitted</h3><p>The Pageant Index events desk will verify the official link, date, organizer, and venue before publication.</p></div>';
        } catch (error) {
          button.disabled = false;
          button.textContent = "Submit for Editorial Review";
          const errorBox = document.createElement("p");
          errorBox.className = "form-error";
          errorBox.textContent = error.name === "AbortError" ? "The secure event service did not respond. Please try again." : error.message;
          form.prepend(errorBox);
        }
      });
    }, 0);
  }

  function injectStructuredData(events) {
    document.getElementById("calendar-event-schema")?.remove();
    const script = document.createElement("script");
    script.id = "calendar-event-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context":"https://schema.org",
      "@graph":events.filter((e) => e.startsAt && e.datePrecision !== "month").map((event) => ({
        "@type":"Event",
        name:event.name,
        startDate:event.startsAt,
        ...(event.endsAt ? {endDate:event.endsAt} : {}),
        eventStatus:"https://schema.org/EventScheduled",
        eventAttendanceMode:"https://schema.org/OfflineEventAttendanceMode",
        location:{"@type":"Place",name:event.venue,address:event.location},
        organizer:{"@type":"Organization",name:event.organization,url:event.sourceUrl || "https://www.pageantindex.com/"},
        url:`https://www.pageantindex.com/pageant-calendar/?event=${encodeURIComponent(event.slug)}`,
        description:event.description,
      })),
    });
    document.head.appendChild(script);
  }

  function render(events) {
    const app = document.getElementById("app");
    const main = app?.querySelector("main");
    if (!main) return;
    const scheduled = events.filter((event) => event.startsAt).sort((a,b) => new Date(a.startsAt) - new Date(b.startsAt));
    const next = scheduled.find((event) => !event.endsAt || new Date(event.endsAt) >= new Date()) || scheduled[0];
    const countries = new Set(events.map((event) => event.location.split(",").pop().trim())).size;
    const confirmed = events.filter((event) => event.status === "confirmed").length;
    const announced = events.filter((event) => event.status === "announced").length;
    const nextCountdown = countdown(next);
    main.outerHTML = `<main class="calendar-page"><section class="calendar-hero"><div class="container"><div class="calendar-eyebrow">Pageant Index Global Calendar</div><h1>Upcoming pageants, <em>verified before published.</em></h1><p>Discover officially announced pageant finals, festivals, and competition periods across the Philippines and around the world. Exact dates remain clearly marked when organizers have not completed their announcements.</p><div class="calendar-hero-actions"><button class="btn btn-primary" id="submit-event-btn">Submit an Event</button><a class="btn btn-ghost" href="#calendar-events">Browse Calendar</a></div></div></section><section class="calendar-section"><div class="container"><div class="calendar-stats"><div class="calendar-stat"><strong>${events.length}</strong><span>Tracked events</span></div><div class="calendar-stat"><strong>${confirmed}</strong><span>Confirmed schedules</span></div><div class="calendar-stat"><strong>${announced}</strong><span>Details pending</span></div><div class="calendar-stat"><strong>${countries}</strong><span>Markets represented</span></div></div>
      ${next ? `<section class="calendar-featured" aria-label="Next pageant"><div class="calendar-featured-date">${next.datePrecision === "month" ? `<div><strong>${formatMonth(eventStart(next))}</strong><span>${eventStart(next).getFullYear()}</span></div>` : `<div><strong>${eventStart(next).getDate()}</strong><span>${formatMonth(eventStart(next))}</span></div>`}</div><div><div class="calendar-eyebrow" style="color:#ff1478;margin-bottom:7px">Next on the calendar</div><h2>${escapeHtml(next.name)}</h2><p>${escapeHtml(dateDescription(next))} · ${escapeHtml(next.location)}</p></div><span class="countdown ${nextCountdown.className}">${escapeHtml(nextCountdown.label)}</span></section>` : ""}
      <div class="calendar-toolbar" aria-label="Calendar filters"><input id="calendar-search" type="search" placeholder="Search pageant, country, organizer, or venue"><select id="calendar-month"><option value="">All months</option>${["January","February","March","April","May","June","July","August","September","October","November","December"].map((month,index)=>`<option value="${index+1}">${month}</option>`).join("")}</select><select id="calendar-region"><option value="">All markets</option>${[...new Set(events.map((event)=>event.scope))].sort().map((scope)=>`<option>${escapeHtml(scope)}</option>`).join("")}</select><select id="calendar-status"><option value="">All statuses</option><option value="confirmed">Confirmed</option><option value="announced">Announced</option></select></div>
      <div id="calendar-events" class="calendar-heading-row"><div><h2>Upcoming pageant calendar</h2><p>Schedules are checked against official organizations and reviewed sources.</p></div><span class="calendar-result-count"><b id="calendar-count">${events.length}</b> events shown</span></div><div class="calendar-grid" id="calendar-grid">${events.map(eventCard).join("")}<div class="event-empty" id="calendar-empty" hidden><h3>No events match these filters.</h3><p>Try another month, market, status, or search phrase.</p></div></div>
      <section class="calendar-watchlist"><h2>Dates we are still watching</h2><p>These editions have active official organizations or announced host information, but a complete official competition date was not available at the latest review.</p><div class="watchlist-grid">${watchlist.map((item)=>`<article class="watchlist-card"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.place)}</span><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Official organization →</a></article>`).join("")}</div></section>
      <section class="calendar-disclosure"><div><h3>Is your pageant missing?</h3><p>Organizers can submit official dates, application deadlines, venues, and verified links for editorial review. Publication is not automatic and does not affect organic rankings.</p></div><button class="btn btn-primary" id="submit-event-secondary">Submit an Event</button></section><p class="calendar-source-note">Calendar information was last reviewed on July 30, 2026. Pageant schedules can change. Users should confirm travel, ticket, application, and accreditation details with the official organizer before making commitments.</p></div></section></main>`;
    injectStructuredData(events);

    const applyFilters = () => {
      const search = document.getElementById("calendar-search").value.trim().toLowerCase();
      const month = document.getElementById("calendar-month").value;
      const region = document.getElementById("calendar-region").value;
      const status = document.getElementById("calendar-status").value;
      const cards = [...document.querySelectorAll("[data-event-card]")];
      cards.forEach((card) => card.hidden = Boolean((search && !card.dataset.search.includes(search)) || (month && card.dataset.month !== month) || (region && card.dataset.region !== region) || (status && card.dataset.status !== status)));
      const visible = cards.filter((card) => !card.hidden).length;
      document.getElementById("calendar-count").textContent = visible;
      document.getElementById("calendar-empty").hidden = visible !== 0;
    };
    ["calendar-search","calendar-month","calendar-region","calendar-status"].forEach((id) => document.getElementById(id)?.addEventListener(id === "calendar-search" ? "input" : "change", applyFilters));
    document.getElementById("submit-event-btn")?.addEventListener("click", openSubmission);
    document.getElementById("submit-event-secondary")?.addEventListener("click", openSubmission);
    document.querySelectorAll("[data-event-details]").forEach((button) => button.addEventListener("click", () => showEventDetails(events.find((event) => event.slug === button.dataset.eventDetails))));

    const selectedSlug = new URLSearchParams(location.search).get("event");
    if (selectedSlug) {
      const selected = events.find((event) => event.slug === selectedSlug);
      const safeSlug = window.CSS?.escape ? CSS.escape(selectedSlug) : selectedSlug.replace(/[^a-z0-9-]/gi, "");
      const card = document.querySelector(`[data-slug="${safeSlug}"]`);
      card?.classList.add("is-highlighted");
      setTimeout(() => { card?.scrollIntoView({behavior:"smooth",block:"center"}); if (selected) showEventDetails(selected); }, 250);
    }
  }

  async function start() {
    if (document.body.dataset.page !== "calendar") return;
    let databaseEvents = [];
    try {
      const rows = await supabase("/rest/v1/events?select=id,name,slug,organization_name,description,event_type,starts_at,ends_at,application_deadline,venue_name,official_url,organizer_email,organizer_mobile,status,published_at&status=eq.published&order=starts_at.asc");
      databaseEvents = (rows || []).map(normalizeDatabaseEvent);
    } catch (error) {
      console.info("Pageant Index calendar is using its reviewed launch dataset.", error.message);
    }
    const bySlug = new Map(databaseEvents.map((event) => [event.slug,event]));
    curatedEvents.forEach((event) => { if (!bySlug.has(event.slug)) bySlug.set(event.slug,event); });
    render([...bySlug.values()].sort((a,b) => new Date(a.startsAt || "9999-01-01") - new Date(b.startsAt || "9999-01-01")));
  }

  start();
})();
