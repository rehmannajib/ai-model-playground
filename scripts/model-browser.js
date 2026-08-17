"use strict";

/* =====================================================
   MODEL BROWSER / SIDEBAR / MODEL SWITCHING

   This file controls:
   - the model chooser screen
   - sidebar hierarchy
   - model search
   - switching between models
   - breadcrumb
   - mobile model drawer
===================================================== */

window.AIPlayground = window.AIPlayground || {};

AIPlayground.modelBrowser = (() => {
  const MODEL_STRUCTURE = AIPlayground.config.modelStructure;
  const ALL_MODEL_IDS = AIPlayground.config.allModelIds;

  let playgroundSections = {};
  let learningSections = {};
  let currentModel = null;
  let mobileToggleButton = null;
  let mobileBackdrop = null;
  let modelWelcome = null;

  function collectSections() {
    playgroundSections = Object.fromEntries(
      ALL_MODEL_IDS.map(id => [id, document.getElementById(`${id}-playground`)])
    );

    learningSections = Object.fromEntries(
      ALL_MODEL_IDS.map(id => [id, document.getElementById(`${id}-learn`)])
    );
  }

  function getModelMeta(modelId) {
    for (const mainCategory of MODEL_STRUCTURE) {
      for (const section of mainCategory.sections) {
        for (const group of section.groups) {
          for (const model of group.models) {
            if (model.id === modelId) {
              return {
                model,
                main: mainCategory.label,
                section: section.label,
                group: group.label
              };
            }
          }
        }
      }
    }

    return null;
  }

  function hideAllModels() {
    Object.values(playgroundSections).forEach(section => {
      if (section) section.hidden = true;
    });

    Object.values(learningSections).forEach(section => {
      if (section) section.hidden = true;
    });
  }

  function updateLayoutMode(hasSelectedModel) {
    document.body.classList.toggle("model-selected-view", hasSelectedModel);
  }

  function createModelWelcome() {
    const welcome = document.createElement("section");
    welcome.className = "model-welcome";
    welcome.id = "model-welcome";

    const head = document.createElement("div");
    head.className = "model-welcome-head";
    head.innerHTML = `
      <span class="label">AI Model Playground</span>
      <h1>Choose a model to start</h1>
      <p>
        Select a model below to open its interactive playground. You can change models at any time
        using the model browser.
      </p>
    `;

    const groups = document.createElement("div");
    groups.className = "model-welcome-groups";

    const welcomeGroups = MODEL_STRUCTURE.map(category => ({
      icon: category.icon,
      title: category.label,
      models: category.sections.flatMap(section =>
        section.groups.flatMap(group => group.models)
      ).filter(model => model.available && playgroundSections[model.id])
    }));

    welcomeGroups.forEach(groupData => {
      const group = document.createElement("div");

      const title = document.createElement("div");
      title.className = "model-welcome-group-title";
      title.innerHTML = `<span>${groupData.icon}</span>${groupData.title}`;

      const grid = document.createElement("div");
      grid.className = "model-welcome-grid";

      groupData.models.forEach(modelData => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "model-welcome-card";
        card.dataset.model = modelData.id;

        const text = document.createElement("span");
        text.innerHTML = `
          <strong>${modelData.label}</strong>
          <small>${modelData.description || "Open the interactive educational simulation."}</small>
        `;

        const arrow = document.createElement("span");
        arrow.className = "model-card-arrow";
        arrow.textContent = "→";
        arrow.setAttribute("aria-hidden", "true");

        card.append(text, arrow);
        card.addEventListener("click", () => selectModel(modelData.id));
        grid.append(card);
      });

      group.append(title, grid);
      groups.append(group);
    });

    const note = document.createElement("p");
    note.className = "model-welcome-note";
    note.textContent = "You can also use the model browser to search or switch between any model.";

    welcome.append(head, groups, note);
    return welcome;
  }

  function setMobileMenu(open) {
    const sidebar = document.querySelector(".model-sidebar");
    if (!sidebar || !mobileToggleButton || !mobileBackdrop) return;

    sidebar.classList.toggle("mobile-open", open);
    mobileBackdrop.classList.toggle("open", open);
    document.body.classList.toggle("model-menu-open", open);
    mobileToggleButton.setAttribute("aria-expanded", String(open));
  }

  function renderNavigationTree(tree) {
    tree.replaceChildren();

    MODEL_STRUCTURE.forEach(mainCategory => {
      const mainGroup = document.createElement("div");
      mainGroup.className = "nav-main-group";

      const mainButton = document.createElement("button");
      mainButton.type = "button";
      mainButton.className = "nav-main-button";

      const icon = document.createElement("span");
      icon.className = "nav-main-icon";
      icon.textContent = mainCategory.icon;

      const text = document.createElement("span");
      text.textContent = mainCategory.label;

      const arrow = document.createElement("span");
      arrow.className = "nav-chevron";
      arrow.textContent = "›";

      mainButton.append(icon, text, arrow);

      const mainContent = document.createElement("div");
      mainContent.className = "nav-main-content";

      mainCategory.sections.forEach(section => {
        section.groups.forEach(group => {
          const navSection = document.createElement("div");
          navSection.className = "nav-section";

          const sectionButton = document.createElement("button");
          sectionButton.type = "button";
          sectionButton.className = "nav-section-button";

          const sectionText = document.createElement("span");
          sectionText.textContent = `${section.label} · ${group.label}`;

          const sectionArrow = document.createElement("span");
          sectionArrow.className = "nav-chevron";
          sectionArrow.textContent = "›";

          sectionButton.append(sectionText, sectionArrow);

          const modelList = document.createElement("div");
          modelList.className = "nav-model-list";

          group.models.forEach(model => {
            const modelButton = document.createElement("button");
            modelButton.type = "button";
            modelButton.className = "nav-model";
            modelButton.dataset.model = model.id;
            modelButton.dataset.search = `${mainCategory.label} ${section.label} ${group.label} ${model.label}`.toLowerCase();

            const modelName = document.createElement("span");
            modelName.textContent = model.label;
            modelButton.append(modelName);

            if (!model.available || !playgroundSections[model.id]) {
              modelButton.classList.add("coming-soon");
              modelButton.disabled = true;

              const status = document.createElement("span");
              status.className = "nav-model-status";
              status.textContent = "Coming soon";
              modelButton.append(status);
            } else {
              modelButton.addEventListener("click", () => selectModel(model.id));
            }

            modelList.append(modelButton);
          });

          sectionButton.addEventListener("click", () => {
            sectionButton.classList.toggle("open");
            modelList.classList.toggle("open");
          });

          navSection.append(sectionButton, modelList);
          mainContent.append(navSection);
        });
      });

      mainButton.addEventListener("click", () => {
        mainButton.classList.toggle("open");
        mainContent.classList.toggle("open");
      });

      mainGroup.append(mainButton, mainContent);
      tree.append(mainGroup);
    });
  }

  function switchModel(modelId) {
    if (modelWelcome) modelWelcome.hidden = true;

    Object.entries(playgroundSections).forEach(([name, section]) => {
      if (section) section.hidden = name !== modelId;
    });

    Object.entries(learningSections).forEach(([name, section]) => {
      if (section) section.hidden = name !== modelId;
    });

    const content = document.querySelector(".model-content");
    if (content) {
      requestAnimationFrame(() => {
        content.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function selectModel(modelId) {
    const meta = getModelMeta(modelId);
    if (!meta || !meta.model.available || !playgroundSections[modelId]) return;

    currentModel = modelId;
    updateLayoutMode(true);
    switchModel(modelId);
    activateNavigationPath(modelId);
    updateBreadcrumb(meta.main, meta.section, meta.group, meta.model.label);
    updateMobileButton(meta.model.label);
    setMobileMenu(false);
  }

  function showModelChooser(scroll = true) {
    currentModel = null;
    updateLayoutMode(false);
    hideAllModels();

    if (modelWelcome) modelWelcome.hidden = false;

    document.querySelectorAll(".nav-model").forEach(item => {
      item.classList.remove("active");
    });

    updateChooserBreadcrumb();
    updateMobileButton(null);
    setMobileMenu(false);

    if (scroll) {
      document.querySelector(".model-content")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  function activateNavigationPath(modelId) {
    document.querySelectorAll(".nav-model").forEach(item => {
      item.classList.toggle("active", item.dataset.model === modelId);
    });

    const button = document.querySelector(`.nav-model[data-model="${modelId}"]`);
    if (!button) return;

    const modelList = button.closest(".nav-model-list");
    modelList?.classList.add("open");

    const sectionButton = modelList?.previousElementSibling;
    sectionButton?.classList.add("open");

    const mainContent = button.closest(".nav-main-content");
    mainContent?.classList.add("open");

    const mainButton = mainContent?.previousElementSibling;
    mainButton?.classList.add("open");
  }

  function makeAllModelsButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "model-breadcrumb-home";
    button.textContent = "All Models";
    button.addEventListener("click", () => showModelChooser());
    return button;
  }

  function updateChooserBreadcrumb() {
    const breadcrumb = document.getElementById("model-breadcrumb");
    if (!breadcrumb) return;

    breadcrumb.replaceChildren();

    const current = document.createElement("strong");
    current.textContent = "Choose a model";

    breadcrumb.append(makeAllModelsButton());

    const separator = document.createElement("span");
    separator.className = "breadcrumb-separator";
    separator.textContent = "›";

    breadcrumb.append(separator, current);
  }

  function updateBreadcrumb(main, section, group, model) {
    const breadcrumb = document.getElementById("model-breadcrumb");
    if (!breadcrumb) return;

    breadcrumb.replaceChildren();
    breadcrumb.append(makeAllModelsButton());

    [main, section, group].forEach(item => {
      const separator = document.createElement("span");
      separator.className = "breadcrumb-separator";
      separator.textContent = "›";

      const span = document.createElement("span");
      span.textContent = item;

      breadcrumb.append(separator, span);
    });

    const separator = document.createElement("span");
    separator.className = "breadcrumb-separator";
    separator.textContent = "›";

    const current = document.createElement("strong");
    current.textContent = model;

    breadcrumb.append(separator, current);
  }

  function updateMobileButton(modelLabel) {
    if (!mobileToggleButton) return;

    const current = mobileToggleButton.querySelector(".mobile-current-model");
    if (current) current.textContent = modelLabel || "Choose a model";
  }

  function filterNavigation(tree, query) {
    const normalized = query.trim().toLowerCase();
    const models = tree.querySelectorAll(".nav-model");
    let visibleCount = 0;

    models.forEach(model => {
      const matches = !normalized || model.dataset.search.includes(normalized);
      model.hidden = !matches;

      if (matches) {
        visibleCount++;

        if (normalized) {
          model.closest(".nav-model-list")?.classList.add("open");
          model.closest(".nav-main-content")?.classList.add("open");

          const sectionButton = model.closest(".nav-model-list")?.previousElementSibling;
          sectionButton?.classList.add("open");

          const mainButton = model.closest(".nav-main-content")?.previousElementSibling;
          mainButton?.classList.add("open");
        }
      }
    });

    tree.querySelector(".model-search-empty")?.remove();

    if (visibleCount === 0) {
      const empty = document.createElement("div");
      empty.className = "model-search-empty";
      empty.textContent = "No matching models found.";
      tree.append(empty);
    }
  }

  function createNavigation() {
    collectSections();

    const placeholder = document.getElementById("model-navigation");
    if (!placeholder) return;

    document.body.classList.add("playground-page");

    const shell = document.createElement("div");
    shell.className = "model-browser";

    mobileToggleButton = document.createElement("button");
    mobileToggleButton.className = "model-mobile-toggle";
    mobileToggleButton.type = "button";
    mobileToggleButton.setAttribute("aria-expanded", "false");
    mobileToggleButton.setAttribute("aria-controls", "model-sidebar");
    mobileToggleButton.innerHTML = `
      <span class="model-toggle-copy">
        <strong>Models</strong>
        <span class="mobile-current-model">Choose a model</span>
      </span>
      <span class="model-toggle-icon" aria-hidden="true">☰</span>
    `;

    const sidebar = document.createElement("aside");
    sidebar.className = "model-sidebar";
    sidebar.id = "model-sidebar";

    const sidebarHeader = document.createElement("div");
    sidebarHeader.className = "model-sidebar-header";
    sidebarHeader.innerHTML = `
      <small>AI Playground</small>
      <h3>Explore Models</h3>
      <p>Choose a learning category and model.</p>
      <button class="model-sidebar-close" type="button" aria-label="Close model browser">×</button>
    `;

    const searchWrap = document.createElement("div");
    searchWrap.className = "model-search-wrap";

    const search = document.createElement("input");
    search.type = "search";
    search.className = "model-search";
    search.placeholder = "Search models...";
    search.setAttribute("aria-label", "Search AI models");
    searchWrap.append(search);

    const tree = document.createElement("nav");
    tree.className = "model-tree";
    tree.setAttribute("aria-label", "AI model navigation");

    const sidebarFooter = document.createElement("div");
    sidebarFooter.className = "model-sidebar-footer";
    sidebarFooter.textContent = "Interactive educational simulations";

    sidebar.append(sidebarHeader, searchWrap, tree, sidebarFooter);

    sidebarHeader.querySelector(".model-sidebar-close")?.addEventListener("click", () => {
      setMobileMenu(false);
    });

    const content = document.createElement("div");
    content.className = "model-content";

    const breadcrumb = document.createElement("div");
    breadcrumb.className = "model-breadcrumb";
    breadcrumb.id = "model-breadcrumb";
    content.append(breadcrumb);

    modelWelcome = createModelWelcome();
    content.append(modelWelcome);

    Object.values(playgroundSections).forEach(section => {
      if (section) content.append(section);
    });

    shell.append(sidebar, content);

    mobileBackdrop = document.createElement("div");
    mobileBackdrop.className = "model-mobile-backdrop";
    mobileBackdrop.setAttribute("aria-hidden", "true");

    placeholder.replaceWith(mobileToggleButton, shell, mobileBackdrop);

    mobileToggleButton.addEventListener("click", () => {
      const opening = !sidebar.classList.contains("mobile-open");
      setMobileMenu(opening);
    });

    mobileBackdrop.addEventListener("click", () => setMobileMenu(false));

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") setMobileMenu(false);
    });

    renderNavigationTree(tree);
    search.addEventListener("input", () => filterNavigation(tree, search.value));

    hideAllModels();
    showModelChooser(false);
  }

  return {
    createNavigation,
    selectModel,
    showModelChooser,
    getCurrentModel: () => currentModel
  };
})();
