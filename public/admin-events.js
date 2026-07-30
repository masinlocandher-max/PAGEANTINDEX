"use strict";

(() => {
  if (document.body.dataset.page !== "admin") return;
  const SUPABASE_URL = "https://uwcqvsitjtknxsaypjxj.supabase.co";
  const SUPABASE_KEY = "sb_publishable_qsC-udp3YoJQFuE-lHPivg_wa8gYMeg";
  const SESSION_KEY = "pi_supabase_session";
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } };
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
  const slugify = (value) => String(value || "").toLowerCase().trim().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  const session = readSession();

  async function request(path, options = {}) {
    const headers = {apikey:SUPABASE_KEY,"Content-Type":"application/json",Prefer:"return=representation",...(options.headers||{})};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    let response;
    try { response = await fetch(`${SUPABASE_URL}${path}`, {...options,headers,signal:options.signal||controller.signal}); }
    finally { clearTimeout(timeout); }
    const payload = response.status === 204 ? null : await response.json().catch(()=>null);
    if (!response.ok) throw new Error(payload?.message || payload?.hint || `Request failed (${response.status})`);
    return payload;
  }

  const notify = (message, type) => typeof window.showToast === "function" ? window.showToast(message,type) : alert(message);
  const formatDate = (value) => value ? new Intl.DateTimeFormat("en-PH",{month:"short",day:"numeric",year:"numeric"}).format(new Date(value)) : "—";
  const inputDate = (value) => value ? new Date(value).toISOString().slice(0,10) : "";

  function formHtml(event = null) {
    return `<form class="form-grid admin-event-form" id="admin-event-form" data-id="${esc(event?.id || "")}"><div class="field"><label>Pageant name *</label><input name="name" value="${esc(event?.name || "")}" required maxlength="160"></div><div class="field"><label>Slug *</label><input name="slug" value="${esc(event?.slug || "")}" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required></div><div class="field"><label>Organization</label><input name="organization_name" value="${esc(event?.organization_name || "")}"></div><div class="field"><label>Event type</label><input name="event_type" value="${esc(event?.event_type || "International")}"></div><div class="field"><label>Start date *</label><input name="starts_at" type="date" value="${inputDate(event?.starts_at)}" required></div><div class="field"><label>End date</label><input name="ends_at" type="date" value="${inputDate(event?.ends_at)}"></div><div class="field"><label>Application deadline</label><input name="application_deadline" type="date" value="${inputDate(event?.application_deadline)}"></div><div class="field"><label>Status</label><select name="status">${["draft","pending","published","cancelled","completed","archived"].map((status)=>`<option value="${status}" ${status===(event?.status||"draft")?"selected":""}>${status}</option>`).join("")}</select></div><div class="field full"><label>Venue and location</label><input name="venue_name" value="${esc(event?.venue_name || "")}" placeholder="Venue, city, country"></div><div class="field full"><label>Official link</label><input name="official_url" type="url" value="${esc(event?.official_url || "")}"></div><div class="field"><label>Organizer email</label><input name="organizer_email" type="email" value="${esc(event?.organizer_email || "")}"></div><div class="field"><label>Organizer mobile</label><input name="organizer_mobile" value="${esc(event?.organizer_mobile || "")}"></div><div class="field full"><label>Description</label><textarea name="description" maxlength="3000">${esc(event?.description || "")}</textarea></div><div class="field full"><button class="btn btn-primary btn-block">${event ? "Save Event" : "Create Event"}</button></div></form>`;
  }

  function openForm(event, afterSave) {
    if (typeof window.openModal !== "function") return;
    window.openModal(event ? `Edit ${event.name}` : "Add Pageant Event", formHtml(event));
    setTimeout(() => {
      const form = document.getElementById("admin-event-form");
      const nameInput = form?.elements.name;
      const slugInput = form?.elements.slug;
      nameInput?.addEventListener("input", () => { if (!event || !slugInput.dataset.touched) slugInput.value = slugify(nameInput.value); });
      slugInput?.addEventListener("input", () => slugInput.dataset.touched = "true");
      form?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const button = form.querySelector("button");
        button.disabled = true;
        button.textContent = "Saving…";
        const data = Object.fromEntries(new FormData(form));
        const payload = {
          name:data.name.trim(), slug:slugify(data.slug || data.name), organization_name:data.organization_name.trim()||null,
          event_type:data.event_type.trim()||null, starts_at:new Date(`${data.starts_at}T12:00:00+08:00`).toISOString(),
          ends_at:data.ends_at?new Date(`${data.ends_at}T23:59:00+08:00`).toISOString():null,
          application_deadline:data.application_deadline?new Date(`${data.application_deadline}T23:59:00+08:00`).toISOString():null,
          venue_name:data.venue_name.trim()||null, official_url:data.official_url.trim()||null,
          organizer_email:data.organizer_email.trim()||null, organizer_mobile:data.organizer_mobile.trim()||null,
          description:data.description.trim()||null, status:data.status,
          published_at:data.status==="published"?(event?.published_at||new Date().toISOString()):null,
        };
        try {
          if (event) await request(`/rest/v1/events?id=eq.${encodeURIComponent(event.id)}`,{method:"PATCH",body:JSON.stringify(payload)});
          else await request("/rest/v1/events",{method:"POST",body:JSON.stringify({...payload,submitted_by:session.user.id})});
          document.querySelector(".modal-close")?.click();
          notify(event ? "Event updated." : "Event created.");
          afterSave();
        } catch (error) { button.disabled=false; button.textContent=event?"Save Event":"Create Event"; notify(error.message,"error"); }
      });
    },0);
  }

  async function renderEvents() {
    const main = document.querySelector(".product-main");
    if (!main) return;
    main.innerHTML = `<header class="product-topbar"><div><h1>Pageant Calendar Administration</h1><p>Review submissions, publish verified schedules, and maintain official event links.</p></div><div><button class="btn btn-ghost" id="events-refresh">Refresh</button><button class="btn btn-primary" id="events-add">+ Add Event</button></div></header><div class="admin-events-layout"><div class="admin-events-note">Launch events displayed from the reviewed code dataset remain visible even before database seeding. Database records added here can be edited, published, cancelled, completed, or archived.</div><div id="admin-events-content"><div class="empty-state"><h3>Loading events…</h3></div></div></div>`;
    document.getElementById("events-add")?.addEventListener("click",()=>openForm(null,renderEvents));
    document.getElementById("events-refresh")?.addEventListener("click",renderEvents);
    try {
      const events = await request("/rest/v1/events?select=id,name,slug,organization_name,description,event_type,starts_at,ends_at,application_deadline,venue_name,official_url,organizer_email,organizer_mobile,status,published_at,created_at,updated_at&order=starts_at.asc");
      const counts = {all:events.length,published:events.filter(e=>e.status==="published").length,pending:events.filter(e=>e.status==="pending").length,draft:events.filter(e=>e.status==="draft").length};
      document.getElementById("admin-events-content").innerHTML = `<div class="admin-event-stats"><div class="admin-event-stat"><strong>${counts.all}</strong><span>All events</span></div><div class="admin-event-stat"><strong>${counts.published}</strong><span>Published</span></div><div class="admin-event-stat"><strong>${counts.pending}</strong><span>Pending review</span></div><div class="admin-event-stat"><strong>${counts.draft}</strong><span>Drafts</span></div></div><div class="admin-toolbar"><input id="events-search" placeholder="Search events, organizer, or venue"><select id="events-status"><option value="">All statuses</option>${["draft","pending","published","cancelled","completed","archived"].map(s=>`<option>${s}</option>`).join("")}</select></div><div class="admin-table-wrap"><table class="admin-table admin-events-table"><thead><tr><th>Event</th><th>Schedule</th><th>Location</th><th>Status</th><th>Official source</th><th>Actions</th></tr></thead><tbody id="events-tbody">${events.length?events.map((event)=>`<tr data-event-row data-search="${esc(`${event.name} ${event.organization_name||""} ${event.venue_name||""}`.toLowerCase())}" data-status="${esc(event.status)}"><td><strong>${esc(event.name)}</strong><br><small>${esc(event.organization_name||event.slug)}</small></td><td>${formatDate(event.starts_at)}${event.ends_at?`<br><small>to ${formatDate(event.ends_at)}</small>`:""}</td><td>${esc(event.venue_name||"Not supplied")}</td><td><span class="status ${event.status==="published"?"open":"pending"}">${esc(event.status)}</span></td><td>${event.official_url?`<a href="${esc(event.official_url)}" target="_blank" rel="noopener">Open source</a>`:"—"}</td><td><button class="btn btn-small btn-ghost" data-edit-event="${esc(event.id)}">Edit</button> <button class="btn btn-small btn-ghost" data-archive-event="${esc(event.id)}">Archive</button></td></tr>`).join(""):`<tr><td colspan="6"><div class="empty-state"><h3>No database events yet</h3><p>Add the first event or run the optional launch-calendar seed file.</p></div></td></tr>`}</tbody></table></div>`;
      const apply = () => { const q=document.getElementById("events-search").value.toLowerCase(); const status=document.getElementById("events-status").value; document.querySelectorAll("[data-event-row]").forEach(row=>row.hidden=Boolean((q&&!row.dataset.search.includes(q))||(status&&row.dataset.status!==status))); };
      document.getElementById("events-search")?.addEventListener("input",apply); document.getElementById("events-status")?.addEventListener("change",apply);
      document.querySelectorAll("[data-edit-event]").forEach((button)=>button.addEventListener("click",()=>openForm(events.find(e=>e.id===button.dataset.editEvent),renderEvents)));
      document.querySelectorAll("[data-archive-event]").forEach((button)=>button.addEventListener("click",async()=>{ if(!confirm("Archive this event?"))return; try{await request(`/rest/v1/events?id=eq.${encodeURIComponent(button.dataset.archiveEvent)}`,{method:"PATCH",body:JSON.stringify({status:"archived"})});notify("Event archived.");renderEvents();}catch(error){notify(error.message,"error");} }));
    } catch (error) {
      document.getElementById("admin-events-content").innerHTML = `<div class="empty-state"><h3>Events could not be loaded</h3><p>${esc(error.message)}</p></div>`;
    }
  }

  function bind() {
    const eventButton = [...document.querySelectorAll(".product-sidebar button")].find((button)=>button.textContent.trim()==="Events");
    if (!eventButton) return;
    eventButton.addEventListener("click",()=>{
      document.querySelectorAll(".product-sidebar button").forEach((button)=>button.classList.remove("active"));
      eventButton.classList.add("active");
      history.replaceState({},"",`${location.pathname}#events`);
      renderEvents();
    });
    if (location.hash === "#events") { eventButton.click(); }
  }

  setTimeout(bind,0);
})();
