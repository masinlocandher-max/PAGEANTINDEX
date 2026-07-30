"use strict";

(() => {
  if (document.body.dataset.page !== "calendar") return;

  const officialLocalDates = {
    "miss-supranational-2026": {
      day: "31",
      month: "JUL",
      monthNumber: "7",
      description: "July 31, 2026",
    },
    "mister-supranational-2026": {
      day: "1",
      month: "AUG",
      monthNumber: "8",
      description: "August 1, 2026",
    },
    "ms-international-world-2026": {
      day: "17",
      month: "SEP",
      monthNumber: "9",
      description: "September 17, 2026 to September 21, 2026",
    },
  };

  function applyVenueLocalDates() {
    let found = false;
    Object.entries(officialLocalDates).forEach(([slug, date]) => {
      const card = document.querySelector(`[data-event-card][data-slug="${slug}"]`);
      if (!card) return;
      found = true;
      card.dataset.month = date.monthNumber;
      const tile = card.querySelector(".event-date-tile");
      if (tile) tile.innerHTML = `<strong>${date.day}</strong><span>${date.month}</span>`;
      const schedule = card.querySelector(".event-meta span b");
      if (schedule) schedule.textContent = date.description;
    });

    const featuredTitle = document.querySelector(".calendar-featured h2");
    if (featuredTitle) {
      const featured = Object.entries(officialLocalDates).find(([slug]) =>
        document.querySelector(`[data-slug="${slug}"] h3`)?.textContent === featuredTitle.textContent,
      );
      if (featured) {
        const [, date] = featured;
        const tile = document.querySelector(".calendar-featured-date");
        if (tile) tile.innerHTML = `<div><strong>${date.day}</strong><span>${date.month}</span></div>`;
        const summary = document.querySelector(".calendar-featured p");
        const cardLocation = document.querySelector(`[data-slug="${featured[0]}"] .event-meta span:nth-child(2) span`)?.textContent;
        if (summary && cardLocation) summary.textContent = `${date.description} · ${cardLocation}`;
      }
    }
    return found;
  }

  if (applyVenueLocalDates()) return;
  const observer = new MutationObserver(() => {
    if (applyVenueLocalDates()) observer.disconnect();
  });
  observer.observe(document.getElementById("app"), {childList:true, subtree:true});
  setTimeout(() => observer.disconnect(), 8000);
})();
