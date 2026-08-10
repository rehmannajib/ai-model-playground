"use strict";

/* =====================================================
   AI MODEL PLAYGROUND
   TWO-PAGE NAVIGATION + MODEL BROWSER
===================================================== */

const PERSONAL_WEBSITE = "https://najibrehman.weebly.com/";

const BRAND_ICON = `
<span class="brand-icon brand-icon-svg" aria-hidden="true">
  <svg viewBox="0 0 24 24" role="img">
    <circle cx="7" cy="7" r="2"></circle>
    <circle cx="17" cy="7" r="2"></circle>
    <circle cx="7" cy="17" r="2"></circle>
    <circle cx="17" cy="17" r="2"></circle>
    <circle cx="12" cy="12" r="2.2"></circle>
    <path d="M8.7 8.7 10.5 10.5M15.3 8.7 13.5 10.5M8.7 15.3 10.5 13.5M15.3 15.3 13.5 13.5"></path>
  </svg>
</span>`;


/* =====================================================
   LOAD THE NEW CSS ON THE RENAMED PLAYGROUND PAGE
===================================================== */

function ensurePageSplitStyles() {
  if (document.querySelector('link[href="page-split.css"]')) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "page-split.css";
  document.head.append(link);
}


/* =====================================================
   SHARED HEADER
===================================================== */

function setupSharedHeader() {
  const brand = document.querySelector(".site-header .brand");
  const nav = document.querySelector(".site-header .header nav");

  if (brand) {
    brand.href = "index.html";
    brand.setAttribute("aria-label", "AI Model Playground home");
    brand.innerHTML = `${BRAND_ICON}<span>AI Model Playground</span>`;
  }

  if (nav) {
    nav.className = "main-nav";
    nav.setAttribute("aria-label", "Main navigation");
    nav.replaceChildren();

    const items = [
      { label: "Home", href: "index.html" },
      { label: "Playground", href: "playground.html", active: true },
      { label: "Go Back to My Website", href: PERSONAL_WEBSITE }
    ];

    items.forEach(item => {
      const link = document.createElement("a");
      link.textContent = item.label;
      link.href = item.href;

      if (item.active) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }

      nav.append(link);
    });
  }
}


/* =====================================================
   MODEL NAVIGATION CONFIGURATION
===================================================== */

const MODEL_STRUCTURE = [
  {
    id: "machine-learning",
    label: "Machine Learning",
    icon: "ML",
    sections: [
      {
        id: "supervised",
        label: "Supervised Learning",
        groups: [
          {
            id: "regression",
            label: "Regression",
            models: [
              { id: "linear-regression", label: "Linear Regression", available: false },
              { id: "gradient-boosting", label: "Gradient Boosting", available: false }
            ]
          },
          {
            id: "classification",
            label: "Classification",
            models: [
              { id: "logistic-regression", label: "Logistic Regression", available: false },
              { id: "knn", label: "K-Nearest Neighbors", available: true },
              { id: "svm", label: "Support Vector Machine", available: false },
              { id: "naive-bayes", label: "Naive Bayes", available: false },
              { id: "tree", label: "Decision Tree", available: true }
            ]
          },
          {
            id: "ensemble",
            label: "Ensemble Learning",
            models: [
              { id: "random-forest", label: "Random Forest", available: false }
            ]
          }
        ]
      },
      {
        id: "unsupervised",
        label: "Unsupervised Learning",
        groups: [
          {
            id: "clustering",
            label: "Clustering",
            models: [
              { id: "kmeans", label: "K-Means", available: false },
              { id: "dbscan", label: "DBSCAN", available: false }
            ]
          },
          {
            id: "dimensionality",
            label: "Dimensionality Reduction",
            models: [
              { id: "pca", label: "PCA", available: false }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "deep-learning",
    label: "Deep Learning",
    icon: "DL",
    sections: [
      {
        id: "neural-networks",
        label: "Basic Neural Networks",
        groups: [
          {
            id: "basic-neural",
            label: "Neural Networks",
            models: [
              { id: "neural", label: "Neural Network / MLP", available: true }
            ]
          }
        ]
      },
      {
        id: "computer-vision",
        label: "Computer Vision",
        groups: [
          {
            id: "vision-models",
            label: "Vision Models",
            models: [
              { id: "cnn", label: "Convolutional Neural Network", available: true }
            ]
          }
        ]
      },
      {
        id: "sequence-models",
        label: "Sequence Models",
        groups: [
          {
            id: "sequence",
            label: "Sequential Architectures",
            models: [
              { id: "rnn", label: "RNN", available: false },
              { id: "lstm", label: "LSTM", available: false }
            ]
          }
        ]
      },
      {
        id: "modern-ai",
        label: "Modern Architectures",
        groups: [
          {
            id: "transformers",
            label: "Attention-Based Models",
            models: [
              { id: "transformer", label: "Transformer", available: false }
            ]
          }
        ]
      }
    ]
  }
];


/* =====================================================
   CURRENT PLAYGROUND + LEARNING SECTIONS
===================================================== */

const PLAYGROUND_SECTIONS = {
  neural: document.getElementById("neural-playground"),
  cnn: document.getElementById("cnn-playground"),
  tree: document.getElementById("tree-playground"),
  knn: document.getElementById("knn-playground")
};

const LEARNING_SECTIONS = {
  neural: document.getElementById("neural-learn"),
  cnn: document.getElementById("cnn-learn"),
  tree: document.getElementById("tree-learn"),
  knn: document.getElementById("knn-learn")
};

let currentModel = null;
let mobileToggleButton = null;
let mobileBackdrop = null;
let modelWelcome = null;


/* =====================================================
   MODEL LOOKUP
===================================================== */

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


/* =====================================================
   HIDE ALL MODELS ON FIRST LOAD
===================================================== */

function hideAllModels() {
  Object.values(PLAYGROUND_SECTIONS).forEach(section => {
    if (section) section.hidden = true;
  });

  Object.values(LEARNING_SECTIONS).forEach(section => {
    if (section) section.hidden = true;
  });
}


/* =====================================================
   WELCOME / CHOOSE MODEL SCREEN
===================================================== */

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

  const welcomeGroups = [
    {
      icon: "DL",
      title: "Deep Learning",
      models: [
        {
          id: "neural",
          label: "Neural Network / MLP",
          description: "Explore layers, neurons, weights, biases and forward propagation."
        },
        {
          id: "cnn",
          label: "Convolutional Neural Network",
          description: "Explore convolution, filters, feature maps, pooling and flattening."
        }
      ]
    },
    {
      icon: "ML",
      title: "Machine Learning",
      models: [
        {
          id: "tree",
          label: "Decision Tree",
          description: "Explore features, thresholds, splits, impurity and routing decisions."
        },
        {
          id: "knn",
          label: "K-Nearest Neighbors",
          description: "Explore distances, nearest neighbors, K values and majority voting."
        }
      ]
    }
  ];

  welcomeGroups.forEach(groupData => {
    const group = document.createElement("div");

    const title = document.createElement("div");
    title.className = "model-welcome-group-title";
    title.innerHTML = `<span>${groupData.icon}</span>${groupData.title}`;

    const grid = document.createElement("div");
    grid.className = "model-welcome-grid";

    groupData.models.forEach(modelData => {
      if (!PLAYGROUND_SECTIONS[modelData.id]) return;

      const card = document.createElement("button");
      card.type = "button";
      card.className = "model-welcome-card";
      card.dataset.model = modelData.id;

      const text = document.createElement("span");
      text.innerHTML = `
        <strong>${modelData.label}</strong>
        <small>${modelData.description}</small>
      `;

      const arrow = document.createElement("span");
      arrow.className = "model-card-arrow";
      arrow.textContent = "→";
      arrow.setAttribute("aria-hidden", "true");

      card.append(text, arrow);

      card.addEventListener("click", () => {
        selectModel(modelData.id);
      });

      grid.append(card);
    });

    group.append(title, grid);
    groups.append(group);
  });

  const note = document.createElement("p");
  note.className = "model-welcome-note";
  note.textContent = "Additional AI and Machine Learning models will appear in the model browser as they become available.";

  welcome.append(head, groups, note);
  return welcome;
}


/* =====================================================
   CREATE NAVIGATION SHELL
===================================================== */

function createModelNavigation() {
  const placeholder = document.getElementById("model-navigation");
  if (!placeholder) return;

  document.body.classList.add("playground-page");

  const shell = document.createElement("div");
  shell.className = "model-browser";

  mobileToggleButton = document.createElement("button");
  mobileToggleButton.className = "model-mobile-toggle";
  mobileToggleButton.type = "button";
  mobileToggleButton.setAttribute("aria-expanded", "false");
  mobileToggleButton.innerHTML = `
    <span>
      <strong>Choose / Change Model</strong>
      <span class="mobile-current-model">No model selected</span>
    </span>
    <span aria-hidden="true">☰</span>
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

  const content = document.createElement("div");
  content.className = "model-content";

  const breadcrumb = document.createElement("div");
  breadcrumb.className = "model-breadcrumb";
  breadcrumb.id = "model-breadcrumb";
  content.append(breadcrumb);

  modelWelcome = createModelWelcome();
  content.append(modelWelcome);

  Object.values(PLAYGROUND_SECTIONS).forEach(section => {
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

  mobileBackdrop.addEventListener("click", () => {
    setMobileMenu(false);
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") setMobileMenu(false);
  });

  renderNavigationTree(tree);

  search.addEventListener("input", () => {
    filterNavigation(tree, search.value);
  });

  hideAllModels();
  showModelChooser(false);
}


/* =====================================================
   MOBILE DRAWER
===================================================== */

function setMobileMenu(open) {
  const sidebar = document.querySelector(".model-sidebar");
  if (!sidebar || !mobileToggleButton || !mobileBackdrop) return;

  sidebar.classList.toggle("mobile-open", open);
  mobileBackdrop.classList.toggle("open", open);
  document.body.classList.toggle("model-menu-open", open);
  mobileToggleButton.setAttribute("aria-expanded", String(open));
}


/* =====================================================
   BUILD HIERARCHY
===================================================== */

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

          if (!model.available || !PLAYGROUND_SECTIONS[model.id]) {
            modelButton.classList.add("coming-soon");
            modelButton.disabled = true;

            const status = document.createElement("span");
            status.className = "nav-model-status";
            status.textContent = "Coming soon";
            modelButton.append(status);
          } else {
            modelButton.addEventListener("click", () => {
              selectModel(model.id);
            });
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


/* =====================================================
   SELECT MODEL
===================================================== */

function selectModel(modelId) {
  const meta = getModelMeta(modelId);
  if (!meta || !meta.model.available || !PLAYGROUND_SECTIONS[modelId]) return;

  currentModel = modelId;
  switchModel(modelId);
  activateNavigationPath(modelId);
  updateBreadcrumb(meta.main, meta.section, meta.group, meta.model.label);
  updateMobileButton(meta.model.label);
  setMobileMenu(false);
}


/* =====================================================
   SWITCH MODEL
===================================================== */

function switchModel(modelId) {
  if (modelWelcome) modelWelcome.hidden = true;

  Object.entries(PLAYGROUND_SECTIONS).forEach(([name, section]) => {
    if (section) section.hidden = name !== modelId;
  });

  Object.entries(LEARNING_SECTIONS).forEach(([name, section]) => {
    if (section) section.hidden = name !== modelId;
  });

  const content = document.querySelector(".model-content");

  if (content) {
    requestAnimationFrame(() => {
      content.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}


/* =====================================================
   SHOW ALL MODELS / WELCOME SCREEN
===================================================== */

function showModelChooser(scroll = true) {
  currentModel = null;
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


/* =====================================================
   ACTIVE NAVIGATION PATH
===================================================== */

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


/* =====================================================
   BREADCRUMB
===================================================== */

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


/* =====================================================
   MOBILE BUTTON TEXT
===================================================== */

function updateMobileButton(modelLabel) {
  if (!mobileToggleButton) return;

  const current = mobileToggleButton.querySelector(".mobile-current-model");
  if (current) {
    current.textContent = modelLabel || "No model selected";
  }
}


/* =====================================================
   SEARCH NAVIGATION
===================================================== */

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


/* =====================================================
   NEURAL NETWORK LEARNING TABS
===================================================== */

function setupNeuralTabs() {
  const root = document.getElementById("neural-learn");
  if (!root) return;

  const tabs = root.querySelectorAll(".tab[data-tab]");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(item => item.classList.toggle("active", item === tab));

      const selected = tab.dataset.tab;
      const panels = {
        beginner: document.getElementById("beginner-panel"),
        math: document.getElementById("math-panel"),
        calc: document.getElementById("calc-panel")
      };

      Object.entries(panels).forEach(([name, panel]) => {
        if (panel) panel.hidden = name !== selected;
      });
    });
  });
}


/* =====================================================
   GENERIC LEARNING TABS
===================================================== */

function setupTabs(selector, dataKey, prefix, names) {
  const tabs = document.querySelectorAll(selector);

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(item => item.classList.toggle("active", item === tab));

      const selected = tab.dataset[dataKey];

      names.forEach(name => {
        const panel = document.getElementById(`${prefix}-${name}-panel`);
        if (panel) panel.hidden = name !== selected;
      });
    });
  });
}


/* =====================================================
   INITIALIZE
===================================================== */

ensurePageSplitStyles();
setupSharedHeader();
setupNeuralTabs();

setupTabs(".cnn-tab", "cnnTab", "cnn", ["beginner", "math", "pipeline"]);
setupTabs(".tree-tab", "treeTab", "tree", ["beginner", "math", "split"]);
setupTabs(".knn-tab", "knnTab", "knn", ["beginner", "math", "process"]);

createModelNavigation();

/* IMPORTANT:
   No model is loaded automatically.
   The Playground opens on the model chooser screen.
*/
