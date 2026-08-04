"use strict";

(() => {
  const NativeMutationObserver = window.MutationObserver;

  // The ecosystem observer should stop reacting after the candidate workspace has
  // replaced the supplier workspace. Other observers continue normally.
  window.MutationObserver = class PageantIndexMutationObserver {
    constructor(callback) {
      this.target = null;
      this.observer = new NativeMutationObserver((records, nativeObserver) => {
        if (this.target?.id === "app" && document.querySelector(".pi-candidate-shell")) return;
        callback(records, nativeObserver);
      });
    }
    observe(target, options) { this.target = target; return this.observer.observe(target, options); }
    disconnect() { return this.observer.disconnect(); }
    takeRecords() { return this.observer.takeRecords(); }
  };

  function addTravelCards() {
    const grid = document.querySelector(".category-grid");
    if (!grid) return false;
    const cards = [
      {
        marker: "data-pi-hotels",
        value: "Hotel / Accommodation",
        label: "Hotels and Accommodation",
        icon: "🏨",
      },
      {
        marker: "data-pi-flights",
        value: "Flights / Airline / Travel Agency",
        label: "Flights and Travel",
        icon: "✈️",
      },
    ];
    cards.forEach(({marker, value, label, icon}) => {
      if (grid.querySelector(`[${marker}]`)) return;
      const card = document.createElement("a");
      card.className = "category-card";
      card.href = `/directory/?category=${encodeURIComponent(value)}`;
      card.setAttribute(marker, "true");
      card.innerHTML = `<span class="category-icon" aria-hidden="true"><span style="font-size:1.2rem">${icon}</span></span><span>${label}</span>`;
      grid.appendChild(card);
    });
    return true;
  }

  if (!addTravelCards()) {
    const observer = new NativeMutationObserver(() => {
      if (addTravelCards()) observer.disconnect();
    });
    observer.observe(document.getElementById("app") || document.body, {childList:true,subtree:true});
    setTimeout(() => observer.disconnect(), 12000);
  }
})();
