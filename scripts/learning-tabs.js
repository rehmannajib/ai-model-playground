"use strict";

/* =====================================================
   UNIVERSAL LEARNING TABS

   This file controls the tabs below EVERY model:
   - Beginner
   - Mathematics
   - Process / Calculation / Pipeline

   Required HTML pattern inside each .model-learn-section:

   button[data-learn-tab="beginner"]
   button[data-learn-tab="math"]
   button[data-learn-tab="process"]

   div[data-learn-panel="beginner"]
   div[data-learn-panel="math"]
   div[data-learn-panel="process"]
===================================================== */

window.AIPlayground = window.AIPlayground || {};

AIPlayground.learningTabs = (() => {
  function activateTab(section, selectedName) {
    const tabs = section.querySelectorAll("[data-learn-tab]");
    const panels = section.querySelectorAll("[data-learn-panel]");

    tabs.forEach(tab => {
      const active = tab.dataset.learnTab === selectedName;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    panels.forEach(panel => {
      panel.hidden = panel.dataset.learnPanel !== selectedName;
    });
  }

  function setupSection(section) {
    const tabs = section.querySelectorAll("[data-learn-tab]");
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.setAttribute("role", "tab");
      tab.addEventListener("click", () => {
        activateTab(section, tab.dataset.learnTab);
      });
    });

    const tabContainer = section.querySelector(".model-learn-tabs");
    if (tabContainer) tabContainer.setAttribute("role", "tablist");

    const current = section.querySelector("[data-learn-tab].active") || tabs[0];
    activateTab(section, current.dataset.learnTab);
  }

  function setupAll() {
    document.querySelectorAll(".model-learn-section").forEach(setupSection);
  }

  return {
    setupAll,
    activateTab
  };
})();
