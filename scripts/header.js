"use strict";

/* =====================================================
   SHARED HEADER
   Controls the Playground page header navigation.
===================================================== */

window.AIPlayground = window.AIPlayground || {};

AIPlayground.header = (() => {

  function ensurePageSplitStyles() {

    if (document.querySelector('link[href="page-split.css"]')) {
      return;
    }

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = "page-split.css";

    document.head.append(link);
  }


  function setup() {

    const { brandIcon } = AIPlayground.config;

    const brand =
      document.querySelector(".site-header .brand");

    const nav =
      document.querySelector(".site-header .header nav");


    /* ===============================
       BRAND
    =============================== */

    if (brand) {

      brand.href = "index.html";

      brand.setAttribute(
        "aria-label",
        "AI Model Playground home"
      );

      brand.innerHTML = `
        ${brandIcon}
        <span>AI Model Playground</span>
      `;
    }


    /* ===============================
       NAVIGATION
    =============================== */

    if (nav) {

      nav.className = "main-nav";

      nav.setAttribute(
        "aria-label",
        "Main navigation"
      );

      nav.replaceChildren();


      const items = [

        {
          label: "Home",
          href: "index.html"
        },

        {
          label: "Playground",
          href: "playground.html",
          active: true
        },

        {
          label: "About Author",
          href: "about.html"
        }

      ];


      items.forEach(item => {

        const link =
          document.createElement("a");

        link.textContent = item.label;
        link.href = item.href;


        if (item.active) {

          link.classList.add("active");

          link.setAttribute(
            "aria-current",
            "page"
          );

        }


        nav.append(link);

      });

    }

  }


  return {

    ensurePageSplitStyles,
    setup

  };

})();