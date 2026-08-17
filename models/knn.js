"use strict";

/* =========================================================
   K-NEAREST NEIGHBORS PLAYGROUND
   Real-world datasets + animated educational simulation
   ========================================================= */

const KNN = (() => {
  const $ = (id) => document.getElementById(id);
  const SVG_NS = "http://www.w3.org/2000/svg";

  const MIN_SAMPLES = 4;
  const MAX_SAMPLES = 20;
  const FEATURE_ORDER = ["x1", "x2", "x3", "x4"];

  /* ---------------------------------------------------------
     1. DATASET DEFINITIONS
     --------------------------------------------------------- */

  const DATASETS = {
    human: {
      title: "Human vs Alien",
      description: "Use physical measurements to decide whether an unknown sample is more similar to the Humans or the Aliens in the training data.",
      queryTitle: "Who is this — Human or Alien?",
      queryHelp: "Adjust the measurements below. You can also click the chart to change the two features currently shown on its axes.",
      queryBadge: "❓",
      classes: {
        A: { name: "Human", plural: "Humans", icon: "👤" },
        B: { name: "Alien", plural: "Aliens", icon: "👽" }
      },
      features: {
        x1: { label: "Height", unit: "cm", min: 120, max: 220, step: 1 },
        x2: { label: "Weight", unit: "kg", min: 30, max: 130, step: 1 },
        x3: { label: "Head Size", unit: "cm", min: 45, max: 90, step: 1 },
        x4: { label: "Eye Size", unit: "mm", min: 20, max: 90, step: 1 }
      },
      data: [
        { id: 1, x1: 172, x2: 68, x3: 56, x4: 28, label: "A" },
        { id: 2, x1: 165, x2: 58, x3: 54, x4: 25, label: "A" },
        { id: 3, x1: 181, x2: 82, x3: 58, x4: 31, label: "A" },
        { id: 4, x1: 175, x2: 74, x3: 57, x4: 29, label: "A" },
        { id: 5, x1: 160, x2: 52, x3: 53, x4: 24, label: "A" },
        { id: 6, x1: 148, x2: 43, x3: 74, x4: 66, label: "B" },
        { id: 7, x1: 205, x2: 57, x3: 84, x4: 78, label: "B" },
        { id: 8, x1: 135, x2: 38, x3: 70, x4: 61, label: "B" },
        { id: 9, x1: 194, x2: 49, x3: 80, x4: 72, label: "B" },
        { id: 10, x1: 155, x2: 46, x3: 76, x4: 69, label: "B" }
      ],
      query: { x1: 170, x2: 66, x3: 60, x4: 37 },
      centers: {
        A: { x1: 171, x2: 67, x3: 56, x4: 28 },
        B: { x1: 167, x2: 47, x3: 77, x4: 69 }
      },
      jitter: { x1: 16, x2: 14, x3: 7, x4: 8 }
    },

    fruit: {
      title: "Fruit Classifier",
      description: "Use simple measurements to decide whether an unknown fruit is more similar to the Apples or the Oranges in the training data.",
      queryTitle: "What fruit is this — Apple or Orange?",
      queryHelp: "Adjust the fruit measurements below and watch which labelled fruits become its nearest neighbors.",
      queryBadge: "🍎?",
      classes: {
        A: { name: "Apple", plural: "Apples", icon: "🍎" },
        B: { name: "Orange", plural: "Oranges", icon: "🍊" }
      },
      features: {
        x1: { label: "Weight", unit: "g", min: 80, max: 300, step: 1 },
        x2: { label: "Sweetness", unit: "/10", min: 0, max: 10, step: 0.1 },
        x3: { label: "Firmness", unit: "/10", min: 0, max: 10, step: 0.1 },
        x4: { label: "Roundness", unit: "/10", min: 0, max: 10, step: 0.1 }
      },
      data: [
        { id: 1, x1: 150, x2: 7.4, x3: 6.8, x4: 7.7, label: "A" },
        { id: 2, x1: 165, x2: 8.0, x3: 6.2, x4: 8.1, label: "A" },
        { id: 3, x1: 138, x2: 6.8, x3: 7.4, x4: 7.1, label: "A" },
        { id: 4, x1: 178, x2: 7.6, x3: 5.9, x4: 8.4, label: "A" },
        { id: 5, x1: 145, x2: 7.1, x3: 7.0, x4: 7.5, label: "A" },
        { id: 6, x1: 205, x2: 6.3, x3: 5.2, x4: 9.2, label: "B" },
        { id: 7, x1: 225, x2: 6.7, x3: 4.8, x4: 9.5, label: "B" },
        { id: 8, x1: 190, x2: 5.9, x3: 5.6, x4: 9.0, label: "B" },
        { id: 9, x1: 238, x2: 6.5, x3: 4.5, x4: 9.6, label: "B" },
        { id: 10, x1: 198, x2: 6.1, x3: 5.0, x4: 8.8, label: "B" }
      ],
      query: { x1: 172, x2: 7.2, x3: 6.1, x4: 8.2 },
      centers: {
        A: { x1: 155, x2: 7.4, x3: 6.7, x4: 7.8 },
        B: { x1: 211, x2: 6.3, x3: 5.0, x4: 9.2 }
      },
      jitter: { x1: 22, x2: 0.9, x3: 0.9, x4: 0.6 }
    },

    shape: {
      title: "Shape Classifier",
      description: "Use geometric measurements to decide whether an unknown shape is more similar to the Circles or the Squares in the training data.",
      queryTitle: "What shape is this — Circle or Square?",
      queryHelp: "Change the geometry below. Roundness is especially informative, but KNN can combine it with size, width and height.",
      queryBadge: "◈",
      classes: {
        A: { name: "Circle", plural: "Circles", icon: "●" },
        B: { name: "Square", plural: "Squares", icon: "■" }
      },
      features: {
        x1: { label: "Size", unit: "/100", min: 10, max: 100, step: 1 },
        x2: { label: "Roundness", unit: "%", min: 0, max: 100, step: 1 },
        x3: { label: "Width", unit: "/100", min: 10, max: 100, step: 1 },
        x4: { label: "Height", unit: "/100", min: 10, max: 100, step: 1 }
      },
      data: [
        { id: 1, x1: 48, x2: 94, x3: 49, x4: 48, label: "A" },
        { id: 2, x1: 62, x2: 90, x3: 61, x4: 63, label: "A" },
        { id: 3, x1: 38, x2: 97, x3: 39, x4: 38, label: "A" },
        { id: 4, x1: 72, x2: 88, x3: 71, x4: 73, label: "A" },
        { id: 5, x1: 55, x2: 92, x3: 56, x4: 54, label: "A" },
        { id: 6, x1: 50, x2: 24, x3: 51, x4: 50, label: "B" },
        { id: 7, x1: 65, x2: 18, x3: 64, x4: 66, label: "B" },
        { id: 8, x1: 40, x2: 30, x3: 41, x4: 39, label: "B" },
        { id: 9, x1: 75, x2: 15, x3: 76, x4: 74, label: "B" },
        { id: 10, x1: 58, x2: 22, x3: 57, x4: 59, label: "B" }
      ],
      query: { x1: 58, x2: 72, x3: 59, x4: 57 },
      centers: {
        A: { x1: 55, x2: 92, x3: 55, x4: 55 },
        B: { x1: 58, x2: 22, x3: 58, x4: 58 }
      },
      jitter: { x1: 16, x2: 9, x3: 16, x4: 16 }
    }
  };

  let datasetKey = "human";
  let data = [];
  let query = {};

  /* ---------------------------------------------------------
     2. ELEMENTS
     --------------------------------------------------------- */

  const e = {
    datasetButtons: Array.from(document.querySelectorAll("[data-knn-dataset]")),
    datasetTitle: $("knn-dataset-title"),
    datasetDescription: $("knn-dataset-description"),
    queryTitle: $("knn-query-title"),
    queryHelp: $("knn-query-help"),
    queryBadge: $("knn-query-badge"),

    featureCount: $("knn-feature-count"),
    k: $("knn-k"),
    distance: $("knn-distance"),
    speed: $("knn-speed"),
    speedLabel: $("knn-speed-label"),
    xAxis: $("knn-x-axis"),
    yAxis: $("knn-y-axis"),

    add: $("knn-add-sample"),
    remove: $("knn-remove-sample"),
    randomize: $("knn-randomize"),
    reset: $("knn-reset"),
    run: $("knn-run"),
    play: $("knn-play"),
    pause: $("knn-pause"),
    next: $("knn-next"),

    sampleCount: $("knn-sample-count"),
    total: $("knn-total-samples"),
    classA: $("knn-class-a-count"),
    classB: $("knn-class-b-count"),
    classALabel: $("knn-class-a-label"),
    classBLabel: $("knn-class-b-label"),
    currentK: $("knn-current-k"),
    activeFeatureCount: $("knn-active-feature-count"),
    activeFeatures: $("knn-active-features"),

    queryInputs: $("knn-query-inputs"),
    head: $("knn-data-head"),
    body: $("knn-data-body"),
    plot: $("knn-plot"),
    legendA: $("knn-legend-a"),
    legendB: $("knn-legend-b"),

    prediction: $("knn-prediction"),
    aVotes: $("knn-a-votes"),
    bVotes: $("knn-b-votes"),
    aVoteLabel: $("knn-a-vote-label"),
    bVoteLabel: $("knn-b-vote-label"),
    nearestDistance: $("knn-nearest-distance"),

    distanceBody: $("knn-distance-body"),
    calculations: $("knn-calculation-output"),
    live: $("knn-live-step"),

    animationStage: $("knn-animation-stage"),
    animationCounter: $("knn-animation-counter"),
    progress: $("knn-progress"),

    liveMathDistance: $("knn-live-math-distance"),
    liveMathVote: $("knn-live-math-vote"),
    liveMathPrediction: $("knn-live-math-prediction")
  };

  /* ---------------------------------------------------------
     3. ANIMATION STATE
     --------------------------------------------------------- */

  let animationSteps = [];
  let animationIndex = -1;
  let animationTimer = null;
  let isPlaying = false;
  let animationContext = null;

  const speedDelays = { 1: 1600, 2: 1200, 3: 850, 4: 550, 5: 300 };
  const speedNames = { 1: "Very slow", 2: "Slow", 3: "Normal", 4: "Fast", 5: "Very fast" };

  /* ---------------------------------------------------------
     4. GENERAL HELPERS
     --------------------------------------------------------- */

  function currentDataset() {
    return DATASETS[datasetKey];
  }

  function featureConfig(feature) {
    return currentDataset().features[feature];
  }

  function featureName(feature) {
    return featureConfig(feature).label;
  }

  function featureLabel(feature) {
    const config = featureConfig(feature);
    return config.unit ? `${config.label} (${config.unit})` : config.label;
  }

  function classInfo(label) {
    return currentDataset().classes[label];
  }

  function classDisplay(label, plural = false) {
    const info = classInfo(label);
    return `${info.icon} ${plural ? info.plural : info.name}`;
  }

  function clamp(value, minimum, maximum, fallback) {
    const number = Number.parseFloat(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(maximum, Math.max(minimum, number));
  }

  function roundForFeature(value, feature) {
    const step = featureConfig(feature).step || 1;
    const decimals = String(step).includes(".") ? String(step).split(".")[1].length : 0;
    return Number(Number(value).toFixed(decimals));
  }

  function fmt(value) {
    return Number(value).toFixed(3);
  }

  function fmtRaw(value, feature) {
    const step = featureConfig(feature).step || 1;
    const decimals = step < 1 ? 1 : 0;
    return Number(value).toFixed(decimals);
  }

  function activeFeatures() {
    const count = Number.parseInt(e.featureCount.value, 10);
    return FEATURE_ORDER.slice(0, count);
  }

  function normalizedValue(value, feature) {
    const config = featureConfig(feature);
    const range = config.max - config.min || 1;
    return (value - config.min) / range;
  }

  function classCounts() {
    return data.reduce(
      (counts, row) => {
        counts[row.label] += 1;
        return counts;
      },
      { A: 0, B: 0 }
    );
  }

  function createSvg(tag, attributes = {}) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function setLive(message) {
    e.live.textContent = message;
  }

  function getSpeedDelay() {
    return speedDelays[e.speed?.value || 3] || 850;
  }

  function updateSpeedLabel() {
    if (!e.speed || !e.speedLabel) return;
    e.speedLabel.textContent = speedNames[e.speed.value] || "Normal";
  }

  function cloneDefaultData() {
    return currentDataset().data.map((row) => ({ ...row }));
  }

  function cloneDefaultQuery() {
    return { ...currentDataset().query };
  }

  /* ---------------------------------------------------------
     5. DATASET + LABEL UI
     --------------------------------------------------------- */

  function updateDatasetUI() {
    const dataset = currentDataset();

    e.datasetButtons.forEach((button) => {
      const active = button.dataset.knnDataset === datasetKey;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    e.datasetTitle.textContent = dataset.title;
    e.datasetDescription.textContent = dataset.description;
    e.queryTitle.textContent = dataset.queryTitle;
    e.queryHelp.textContent = dataset.queryHelp;
    e.queryBadge.textContent = dataset.queryBadge;

    e.classALabel.textContent = dataset.classes.A.plural;
    e.classBLabel.textContent = dataset.classes.B.plural;
    e.aVoteLabel.textContent = `${dataset.classes.A.name} Votes`;
    e.bVoteLabel.textContent = `${dataset.classes.B.name} Votes`;
    e.legendA.textContent = classDisplay("A");
    e.legendB.textContent = classDisplay("B");
  }

  function switchDataset(nextKey) {
    if (!DATASETS[nextKey] || nextKey === datasetKey) return;

    stopAnimation();
    datasetKey = nextKey;
    data = cloneDefaultData();
    query = cloneDefaultQuery();

    e.featureCount.value = "2";
    e.k.value = "3";
    e.distance.value = "euclidean";

    updateDatasetUI();
    renderTable();
    renderQueryInputs();
    renderAxisSelectors(true);
    updateSummary();
    clearResults();
    setLive(`${currentDataset().title} loaded. Adjust the unknown sample, then run KNN or watch the animation.`);
  }

  /* ---------------------------------------------------------
     6. ACTIVE FEATURES + SUMMARY
     --------------------------------------------------------- */

  function renderActiveFeatures() {
    e.activeFeatures.replaceChildren();

    activeFeatures().forEach((feature) => {
      const chip = document.createElement("span");
      chip.className = "knn-feature-chip";
      chip.textContent = featureLabel(feature);
      e.activeFeatures.append(chip);
    });

    e.activeFeatureCount.textContent = activeFeatures().length;
  }

  function updateSummary() {
    const counts = classCounts();
    const dataset = currentDataset();

    e.total.textContent = data.length;
    e.classA.textContent = counts.A;
    e.classB.textContent = counts.B;
    e.classALabel.textContent = dataset.classes.A.plural;
    e.classBLabel.textContent = dataset.classes.B.plural;
    e.sampleCount.textContent = `${data.length} / ${MAX_SAMPLES} training samples`;

    e.add.disabled = data.length >= MAX_SAMPLES;
    e.remove.disabled = data.length <= MIN_SAMPLES;

    if (Number(e.k.value) > data.length) e.k.value = String(data.length);

    Array.from(e.k.options).forEach((option) => {
      option.disabled = Number(option.value) > data.length;
    });

    e.currentK.textContent = e.k.value;
    renderActiveFeatures();
  }

  /* ---------------------------------------------------------
     7. TRAINING DATA TABLE
     --------------------------------------------------------- */

  function renderTableHead() {
    e.head.replaceChildren();

    const row = document.createElement("tr");
    const id = document.createElement("th");
    id.textContent = "ID";
    row.append(id);

    activeFeatures().forEach((feature) => {
      const th = document.createElement("th");
      th.textContent = featureLabel(feature);
      row.append(th);
    });

    const classHeader = document.createElement("th");
    classHeader.textContent = "Class";
    row.append(classHeader);
    e.head.append(row);
  }

  function renderTable() {
    renderTableHead();
    e.body.replaceChildren();

    data.forEach((row) => {
      const tr = document.createElement("tr");

      const idCell = document.createElement("td");
      idCell.textContent = row.id;
      tr.append(idCell);

      activeFeatures().forEach((feature) => {
        const config = featureConfig(feature);
        const td = document.createElement("td");
        const input = document.createElement("input");

        input.type = "number";
        input.min = config.min;
        input.max = config.max;
        input.step = config.step;
        input.value = row[feature];
        input.setAttribute("aria-label", `${featureName(feature)} for sample ${row.id}`);

        input.addEventListener("input", () => {
          const value = Number.parseFloat(input.value);
          if (Number.isFinite(value) && value >= config.min && value <= config.max) {
            input.classList.remove("invalid");
            row[feature] = value;
            invalidate("Training data changed. Run or animate KNN again.");
          } else {
            input.classList.add("invalid");
          }
        });

        input.addEventListener("change", () => {
          row[feature] = roundForFeature(clamp(input.value, config.min, config.max, row[feature]), feature);
          input.value = row[feature];
          input.classList.remove("invalid");
          invalidate("Training data changed. Run or animate KNN again.");
        });

        td.append(input);
        tr.append(td);
      });

      const classCell = document.createElement("td");
      const select = document.createElement("select");
      select.setAttribute("aria-label", `Class for sample ${row.id}`);

      ["A", "B"].forEach((label) => {
        const option = document.createElement("option");
        option.value = label;
        option.textContent = classDisplay(label);
        option.selected = row.label === label;
        select.append(option);
      });

      select.addEventListener("change", () => {
        row.label = select.value;
        invalidate("A training label changed. Run or animate KNN again.");
      });

      classCell.append(select);
      tr.append(classCell);
      e.body.append(tr);
    });

    updateSummary();
  }

  /* ---------------------------------------------------------
     8. UNKNOWN SAMPLE INPUTS
     --------------------------------------------------------- */

  function renderQueryInputs() {
    e.queryInputs.replaceChildren();

    activeFeatures().forEach((feature) => {
      const config = featureConfig(feature);
      const control = document.createElement("label");
      control.className = "knn-query-control";

      const heading = document.createElement("span");
      heading.className = "knn-query-control-heading";

      const name = document.createElement("strong");
      name.textContent = config.label;

      const output = document.createElement("output");
      output.textContent = `${fmtRaw(query[feature], feature)}${config.unit ? ` ${config.unit}` : ""}`;

      heading.append(name, output);

      const input = document.createElement("input");
      input.type = "range";
      input.min = config.min;
      input.max = config.max;
      input.step = config.step;
      input.value = query[feature];
      input.setAttribute("aria-label", `${config.label} for unknown sample`);

      const scale = document.createElement("span");
      scale.className = "knn-query-scale";
      scale.innerHTML = `<small>${config.min}</small><small>${config.max}</small>`;

      input.addEventListener("input", () => {
        query[feature] = roundForFeature(input.value, feature);
        output.textContent = `${fmtRaw(query[feature], feature)}${config.unit ? ` ${config.unit}` : ""}`;
        invalidate("Unknown sample changed. Run or animate KNN again.", false);
      });

      control.append(heading, input, scale);
      e.queryInputs.append(control);
    });
  }

  /* ---------------------------------------------------------
     9. AXIS SELECTORS
     --------------------------------------------------------- */

  function renderAxisSelectors(resetAxes = false) {
    const features = activeFeatures();
    const previousX = resetAxes ? null : e.xAxis.value;
    const previousY = resetAxes ? null : e.yAxis.value;

    e.xAxis.replaceChildren();
    e.yAxis.replaceChildren();

    features.forEach((feature) => {
      const xOption = document.createElement("option");
      xOption.value = feature;
      xOption.textContent = featureLabel(feature);
      e.xAxis.append(xOption);

      const yOption = document.createElement("option");
      yOption.value = feature;
      yOption.textContent = featureLabel(feature);
      e.yAxis.append(yOption);
    });

    e.xAxis.value = features.includes(previousX) ? previousX : features[0];
    e.yAxis.value = features.includes(previousY) && previousY !== e.xAxis.value
      ? previousY
      : (features[1] || features[0]);
  }

  function ensureDistinctAxes(changedAxis) {
    const features = activeFeatures();
    if (features.length < 2) return;

    if (e.xAxis.value === e.yAxis.value) {
      const replacement = features.find((feature) => feature !== (changedAxis === "x" ? e.xAxis.value : e.yAxis.value));
      if (changedAxis === "x") e.yAxis.value = replacement;
      else e.xAxis.value = replacement;
    }

    renderPlot();
  }

  /* ---------------------------------------------------------
     10. DATASET EDITING
     --------------------------------------------------------- */

  function randomAround(center, spread, feature) {
    const config = featureConfig(feature);
    const value = center + (Math.random() * 2 - 1) * spread;
    return roundForFeature(clamp(value, config.min, config.max, center), feature);
  }

  function createNewSample() {
    const label = data.length % 2 === 0 ? "A" : "B";
    const center = currentDataset().centers[label];
    const jitter = currentDataset().jitter;
    const sample = {
      id: Math.max(...data.map((row) => row.id)) + 1,
      label
    };

    FEATURE_ORDER.forEach((feature) => {
      sample[feature] = randomAround(center[feature], jitter[feature] * 0.65, feature);
    });

    return sample;
  }

  function addSample() {
    if (data.length >= MAX_SAMPLES) return;
    data.push(createNewSample());
    renderTable();
    invalidate(`Training sample added. Dataset now contains ${data.length} samples.`);
  }

  function removeSample() {
    if (data.length <= MIN_SAMPLES) return;
    data.pop();
    renderTable();
    invalidate(`Last training sample removed. ${data.length} samples remain.`);
  }

  function randomizeDataset() {
    stopAnimation();

    const sampleCount = Math.max(10, data.length);
    const dataset = currentDataset();
    data = [];

    for (let i = 0; i < sampleCount; i += 1) {
      const label = i < Math.ceil(sampleCount / 2) ? "A" : "B";
      const center = dataset.centers[label];
      const sample = { id: i + 1, label };

      FEATURE_ORDER.forEach((feature) => {
        sample[feature] = randomAround(center[feature], dataset.jitter[feature], feature);
      });

      data.push(sample);
    }

    query = {};
    FEATURE_ORDER.forEach((feature) => {
      const a = dataset.centers.A[feature];
      const b = dataset.centers.B[feature];
      const middle = (a + b) / 2;
      query[feature] = randomAround(middle, dataset.jitter[feature] * 0.35, feature);
    });

    renderTable();
    renderQueryInputs();
    invalidate("New training data generated. Adjust the unknown sample or start the animation.");
  }

  /* ---------------------------------------------------------
     11. DISTANCE + KNN CALCULATION
     --------------------------------------------------------- */

  function euclideanDistance(row) {
    const sum = activeFeatures().reduce((total, feature) => {
      const difference = normalizedValue(row[feature], feature) - normalizedValue(query[feature], feature);
      return total + difference * difference;
    }, 0);
    return Math.sqrt(sum);
  }

  function manhattanDistance(row) {
    return activeFeatures().reduce((total, feature) => {
      return total + Math.abs(normalizedValue(row[feature], feature) - normalizedValue(query[feature], feature));
    }, 0);
  }

  function calculateDistance(row) {
    return e.distance.value === "manhattan" ? manhattanDistance(row) : euclideanDistance(row);
  }

  function rankNeighbors() {
    return data
      .map((row) => ({ ...row, distance: calculateDistance(row) }))
      .sort((a, b) => a.distance - b.distance);
  }

  function vote(neighbors) {
    const votes = { A: 0, B: 0 };
    neighbors.forEach((neighbor) => { votes[neighbor.label] += 1; });

    let prediction;
    if (votes.A > votes.B) prediction = "A";
    else if (votes.B > votes.A) prediction = "B";
    else prediction = neighbors[0].label;

    return { votes, prediction };
  }

  function distanceEquation(row) {
    const values = activeFeatures().map((feature) => {
      const a = normalizedValue(row[feature], feature);
      const b = normalizedValue(query[feature], feature);
      return e.distance.value === "euclidean"
        ? `(${a.toFixed(3)} − ${b.toFixed(3)})²`
        : `|${a.toFixed(3)} − ${b.toFixed(3)}|`;
    });

    return e.distance.value === "euclidean"
      ? `√(${values.join(" + ")}) = ${fmt(row.distance)}`
      : `${values.join(" + ")} = ${fmt(row.distance)}`;
  }

  function rawComparison(row) {
    return activeFeatures()
      .map((feature) => `${featureName(feature)}: ${fmtRaw(query[feature], feature)} → ${fmtRaw(row[feature], feature)}`)
      .join(" · ");
  }

  /* ---------------------------------------------------------
     12. DISTANCE TABLE
     --------------------------------------------------------- */

  function renderDistanceTable(ranked, k, options = {}) {
    const {
      revealedIds = null,
      currentId = null,
      rankedMode = true,
      selectedNeighborCount = k
    } = options;

    e.distanceBody.replaceChildren();

    const rows = rankedMode ? ranked : data.map((row) => ranked.find((item) => item.id === row.id));

    rows.forEach((row) => {
      if (!row) return;

      const isRevealed = !revealedIds || revealedIds.has(row.id);
      const rank = ranked.findIndex((item) => item.id === row.id) + 1;
      const isNeighbor = rankedMode && rank <= selectedNeighborCount;
      const tr = document.createElement("tr");

      if (isNeighbor) tr.classList.add("knn-neighbor-row");
      if (row.id === currentId) tr.classList.add("knn-current-row");
      if (!isRevealed) tr.classList.add("knn-pending-row");

      const values = [
        rankedMode && isRevealed ? rank : "—",
        row.id,
        classDisplay(row.label),
        isRevealed ? fmt(row.distance) : "…",
        isNeighbor ? "Yes" : rankedMode && isRevealed ? "No" : "—"
      ];

      values.forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });

      e.distanceBody.append(tr);
    });
  }

  /* ---------------------------------------------------------
     13. LIVE CALCULATION + LEARNING MATH
     --------------------------------------------------------- */

  function renderCalculations(ranked, k) {
    e.calculations.replaceChildren();

    ranked.slice(0, k).forEach((row, index) => {
      const box = document.createElement("div");
      box.className = "knn-calc-step";

      const title = document.createElement("strong");
      title.textContent = `Neighbor ${index + 1}: Sample ${row.id} — ${classDisplay(row.label)}`;

      const raw = document.createElement("p");
      raw.className = "knn-raw-values";
      raw.textContent = rawComparison(row);

      const equation = document.createElement("code");
      equation.textContent = distanceEquation(row);

      box.append(title, raw, equation);
      e.calculations.append(box);
    });
  }

  function renderSingleCalculation(row, sequence, total) {
    e.calculations.replaceChildren();

    const box = document.createElement("div");
    box.className = "knn-calc-step knn-calc-current";

    const title = document.createElement("strong");
    title.textContent = `Distance ${sequence} of ${total}: Unknown sample → Sample ${row.id}`;

    const raw = document.createElement("p");
    raw.className = "knn-raw-values";
    raw.textContent = rawComparison(row);

    const equation = document.createElement("code");
    equation.textContent = distanceEquation(row);

    const note = document.createElement("p");
    note.textContent = `Sample ${row.id} is labelled ${classDisplay(row.label)}. The equation uses normalized 0–1 feature values.`;

    box.append(title, raw, equation, note);
    e.calculations.append(box);
  }

  function updateLiveMath(ranked, k, voting = null) {
    if (!e.liveMathDistance || !e.liveMathVote || !e.liveMathPrediction) return;

    if (!ranked.length) {
      e.liveMathDistance.textContent = "Run KNN to substitute your current scaled values into the distance equation.";
      e.liveMathVote.textContent = "The K nearest class labels will appear here.";
      e.liveMathPrediction.textContent = "The majority vote will determine the predicted class.";
      return;
    }

    const nearest = ranked[0];
    e.liveMathDistance.textContent = `Nearest sample ${nearest.id} (${classInfo(nearest.label).name}): ${distanceEquation(nearest)}`;

    const neighbors = ranked.slice(0, k);
    const labels = neighbors.map((row) => classInfo(row.label).name).join(", ");
    e.liveMathVote.textContent = `K = ${k}: [${labels}]`;

    const result = voting || vote(neighbors);
    e.liveMathPrediction.textContent = `${classInfo("A").name}: ${result.votes.A}, ${classInfo("B").name}: ${result.votes.B} → ${classDisplay(result.prediction)}`;
  }

  /* ---------------------------------------------------------
     14. PROCESS HIGHLIGHTING
     --------------------------------------------------------- */

  function processNodes() {
    return Array.from(document.querySelectorAll("[data-knn-process-step]"));
  }

  const processOrder = ["query", "distance", "rank", "select", "vote", "prediction"];

  function highlightProcess(stepName, completeThrough = null) {
    const activeIndex = processOrder.indexOf(stepName);
    const completedIndex = completeThrough ? processOrder.indexOf(completeThrough) : activeIndex - 1;

    processNodes().forEach((node) => {
      const index = processOrder.indexOf(node.dataset.knnProcessStep);
      node.classList.toggle("is-active", index === activeIndex);
      node.classList.toggle("is-complete", index <= completedIndex);
    });
  }

  function clearProcessHighlight() {
    processNodes().forEach((node) => node.classList.remove("is-active", "is-complete"));
  }

  /* ---------------------------------------------------------
     15. SVG PLOT
     --------------------------------------------------------- */

  function renderPlot(state = {}) {
    const {
      ranked = [],
      neighborCount = 0,
      revealedIds = new Set(),
      currentSampleId = null,
      prediction = null
    } = state;

    e.plot.replaceChildren();

    const width = 640;
    const height = 430;
    const padding = 58;

    const svg = createSvg("svg", {
      viewBox: `0 0 ${width} ${height}`,
      class: "knn-svg",
      role: "img",
      "aria-label": "KNN two-dimensional neighbor visualization"
    });

    const xFeature = e.xAxis.value || activeFeatures()[0];
    const yFeature = e.yAxis.value || activeFeatures()[1] || activeFeatures()[0];
    const xConfig = featureConfig(xFeature);
    const yConfig = featureConfig(yFeature);

    const minX = xConfig.min;
    const maxX = xConfig.max;
    const minY = yConfig.min;
    const maxY = yConfig.max;

    const xScale = (value) => padding + ((value - minX) / (maxX - minX)) * (width - padding * 2);
    const yScale = (value) => height - padding - ((value - minY) / (maxY - minY)) * (height - padding * 2);
    const xInverse = (pixel) => minX + ((pixel - padding) / (width - padding * 2)) * (maxX - minX);
    const yInverse = (pixel) => minY + ((height - padding - pixel) / (height - padding * 2)) * (maxY - minY);

    for (let i = 1; i < 5; i += 1) {
      const x = padding + ((width - padding * 2) * i) / 5;
      const y = padding + ((height - padding * 2) * i) / 5;
      svg.append(
        createSvg("line", { x1: x, x2: x, y1: padding, y2: height - padding, class: "knn-grid-line" }),
        createSvg("line", { x1: padding, x2: width - padding, y1: y, y2: y, class: "knn-grid-line" })
      );
    }

    svg.append(
      createSvg("line", { x1: padding, x2: width - padding, y1: height - padding, y2: height - padding, class: "knn-axis" }),
      createSvg("line", { x1: padding, x2: padding, y1: padding, y2: height - padding, class: "knn-axis" })
    );

    const queryX = xScale(query[xFeature]);
    const queryY = yScale(query[yFeature]);
    const selectedIds = new Set(ranked.slice(0, neighborCount).map((row) => row.id));

    data.forEach((row) => {
      if (!revealedIds.has(row.id) && !selectedIds.has(row.id)) return;

      const line = createSvg("line", {
        x1: queryX,
        y1: queryY,
        x2: xScale(row[xFeature]),
        y2: yScale(row[yFeature]),
        class: [
          "knn-distance-line",
          selectedIds.has(row.id) ? "is-neighbor" : "",
          row.id === currentSampleId ? "is-current" : ""
        ].filter(Boolean).join(" ")
      });
      svg.append(line);
    });

    data.forEach((row) => {
      const group = createSvg("g", { class: "knn-point-group" });
      const cx = xScale(row[xFeature]);
      const cy = yScale(row[yFeature]);

      if (selectedIds.has(row.id)) {
        group.append(createSvg("circle", { cx, cy, r: 15, class: "knn-neighbor-ring" }));
      }

      if (row.id === currentSampleId) {
        group.append(createSvg("circle", { cx, cy, r: 19, class: "knn-current-ring" }));
      }

      const circle = createSvg("circle", {
        cx,
        cy,
        r: 8,
        class: row.label === "A" ? "knn-point-a" : "knn-point-b"
      });

      const title = createSvg("title");
      title.textContent = `Sample ${row.id} · ${classDisplay(row.label)} · ${featureName(xFeature)} ${fmtRaw(row[xFeature], xFeature)}, ${featureName(yFeature)} ${fmtRaw(row[yFeature], yFeature)}`;
      circle.append(title);

      const text = createSvg("text", { x: cx + 11, y: cy - 9, class: "knn-point-label" });
      text.textContent = row.id;

      group.append(circle, text);
      svg.append(group);
    });

    const queryClass = prediction === "A"
      ? "knn-query-point predicted-a"
      : prediction === "B"
        ? "knn-query-point predicted-b"
        : "knn-query-point";

    const queryPoint = createSvg("circle", { cx: queryX, cy: queryY, r: 11, class: queryClass });
    const queryTitle = createSvg("title");
    queryTitle.textContent = prediction
      ? `Unknown sample → ${classDisplay(prediction)}`
      : "Unknown sample — click anywhere in the plot to move it";
    queryPoint.append(queryTitle);

    const queryText = createSvg("text", { x: queryX + 14, y: queryY - 11, class: "knn-query-label" });
    queryText.textContent = prediction ? `? → ${classInfo(prediction).name}` : "?";
    svg.append(queryPoint, queryText);

    const xLabel = createSvg("text", { x: width / 2, y: height - 12, class: "knn-axis-label" });
    xLabel.textContent = featureLabel(xFeature);

    const yLabel = createSvg("text", {
      x: 18,
      y: height / 2,
      class: "knn-axis-label",
      transform: `rotate(-90 18 ${height / 2})`
    });
    yLabel.textContent = featureLabel(yFeature);
    svg.append(xLabel, yLabel);

    svg.addEventListener("click", (event) => {
      if (isPlaying) stopAnimation();

      const rect = svg.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * width;
      const svgY = ((event.clientY - rect.top) / rect.height) * height;

      if (svgX < padding || svgX > width - padding || svgY < padding || svgY > height - padding) return;

      query[xFeature] = roundForFeature(clamp(xInverse(svgX), xConfig.min, xConfig.max, query[xFeature]), xFeature);
      query[yFeature] = roundForFeature(clamp(yInverse(svgY), yConfig.min, yConfig.max, query[yFeature]), yFeature);

      renderQueryInputs();
      invalidate(`Unknown sample moved: ${featureName(xFeature)} = ${fmtRaw(query[xFeature], xFeature)}, ${featureName(yFeature)} = ${fmtRaw(query[yFeature], yFeature)}.`, false);
    });

    e.plot.append(svg);
  }

  /* ---------------------------------------------------------
     16. INSTANT PREDICTION
     --------------------------------------------------------- */

  function showFinalResult(ranked, k) {
    const neighbors = ranked.slice(0, k);
    const voting = vote(neighbors);

    e.prediction.textContent = classDisplay(voting.prediction);
    e.aVotes.textContent = voting.votes.A;
    e.bVotes.textContent = voting.votes.B;
    e.nearestDistance.textContent = fmt(ranked[0].distance);

    renderDistanceTable(ranked, k, { selectedNeighborCount: k });
    renderCalculations(ranked, k);
    updateLiveMath(ranked, k, voting);

    renderPlot({
      ranked,
      neighborCount: k,
      revealedIds: new Set(ranked.map((row) => row.id)),
      prediction: voting.prediction
    });

    highlightProcess("prediction", "vote");
    processNodes()
      .filter((node) => node.dataset.knnProcessStep === "prediction")
      .forEach((node) => node.classList.add("is-complete"));

    setLive(
      `Prediction complete. The ${k} nearest neighbors voted ${voting.votes.A} for ${classInfo("A").name} and ${voting.votes.B} for ${classInfo("B").name}. Prediction: ${classDisplay(voting.prediction)}.`
    );

    setAnimationStatus("Complete", 1, 1);
  }

  function run() {
    stopAnimation();
    const k = Number.parseInt(e.k.value, 10);

    if (k > data.length) {
      setLive("K cannot be larger than the number of training samples.");
      return;
    }

    showFinalResult(rankNeighbors(), k);
  }

  /* ---------------------------------------------------------
     17. ANIMATION TIMELINE
     --------------------------------------------------------- */

  function buildAnimationSteps() {
    const ranked = rankNeighbors();
    const k = Number.parseInt(e.k.value, 10);
    const neighbors = ranked.slice(0, k);
    const voting = vote(neighbors);

    const steps = [
      {
        type: "query",
        process: "query",
        message: `Start with the unknown sample. KNN will compare it with all ${data.length} labelled examples using ${activeFeatures().length} active features.`
      }
    ];

    data.forEach((row, index) => {
      const rankedRow = ranked.find((item) => item.id === row.id);
      steps.push({
        type: "distance",
        process: "distance",
        row: rankedRow,
        scanIndex: index,
        message: `Measuring similarity to Sample ${row.id} (${classInfo(row.label).name}). Scaled distance = ${fmt(rankedRow.distance)}.`
      });
    });

    steps.push({
      type: "rank",
      process: "rank",
      message: "All distances are known. KNN now sorts the samples from nearest to farthest."
    });

    neighbors.forEach((neighbor, index) => {
      steps.push({
        type: "select",
        process: "select",
        neighborIndex: index,
        row: neighbor,
        message: `Neighbor ${index + 1} of ${k}: Sample ${neighbor.id}, ${classInfo(neighbor.label).name}, distance ${fmt(neighbor.distance)}.`
      });
    });

    let partialVotes = { A: 0, B: 0 };
    neighbors.forEach((neighbor, index) => {
      partialVotes = { ...partialVotes };
      partialVotes[neighbor.label] += 1;

      steps.push({
        type: "vote",
        process: "vote",
        voteIndex: index,
        row: neighbor,
        votes: { ...partialVotes },
        message: `Vote ${index + 1} of ${k}: Sample ${neighbor.id} votes for ${classInfo(neighbor.label).name}. Current vote — ${classInfo("A").name}: ${partialVotes.A}, ${classInfo("B").name}: ${partialVotes.B}.`
      });
    });

    steps.push({
      type: "prediction",
      process: "prediction",
      prediction: voting.prediction,
      votes: voting.votes,
      message: `Majority vote complete. KNN predicts ${classDisplay(voting.prediction)}.`
    });

    return { steps, ranked, k, voting };
  }

  function prepareAnimation() {
    stopAnimation();
    clearResults();

    animationContext = buildAnimationSteps();
    animationSteps = animationContext.steps;
    animationIndex = -1;

    setAnimationStatus("Ready", 0, animationSteps.length);
    setLive("Animation ready. Press Play or Next Step to watch KNN classify the unknown sample.");
    clearProcessHighlight();
    updateAnimationButtons();
  }

  function setAnimationStatus(label, current, total) {
    if (e.animationStage) e.animationStage.textContent = label;
    if (e.animationCounter) e.animationCounter.textContent = total ? `${current} / ${total}` : "0 / 0";
    if (e.progress) {
      const percent = total ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
      e.progress.style.width = `${percent}%`;
    }
  }

  function renderAnimationStep(step, index) {
    const { ranked, k, voting } = animationContext;
    const revealedIds = new Set();

    animationSteps.slice(0, index + 1).forEach((item) => {
      if (item.type === "distance" && item.row) revealedIds.add(item.row.id);
    });

    let neighborCount = 0;
    animationSteps.slice(0, index + 1).forEach((item) => {
      if (item.type === "select") neighborCount = Math.max(neighborCount, item.neighborIndex + 1);
      if (item.type === "vote" || item.type === "prediction") neighborCount = k;
    });

    const currentSampleId = step.row?.id || null;

    setLive(step.message);
    setAnimationStatus(stepLabel(step.type), index + 1, animationSteps.length);
    highlightProcess(step.process);

    if (step.type === "query") {
      renderPlot({ ranked, revealedIds: new Set() });
      renderDistanceTable(ranked, k, { revealedIds: new Set(), rankedMode: false, selectedNeighborCount: 0 });
      e.calculations.innerHTML = "<p>KNN begins with the unknown sample. Distances to the labelled examples will be calculated next.</p>";
      return;
    }

    if (step.type === "distance") {
      renderPlot({ ranked, revealedIds, currentSampleId });
      renderDistanceTable(ranked, k, { revealedIds, currentId: currentSampleId, rankedMode: false, selectedNeighborCount: 0 });
      renderSingleCalculation(step.row, step.scanIndex + 1, data.length);
      if (e.liveMathDistance) e.liveMathDistance.textContent = `Current calculation: ${distanceEquation(step.row)}`;
      return;
    }

    if (step.type === "rank") {
      renderPlot({ ranked, revealedIds });
      renderDistanceTable(ranked, k, { revealedIds, rankedMode: true, selectedNeighborCount: 0 });
      e.calculations.innerHTML = `<p>Distances are now sorted. Sample ${ranked[0].id} (${classDisplay(ranked[0].label)}) is nearest at ${fmt(ranked[0].distance)}.</p>`;
      return;
    }

    if (step.type === "select") {
      renderPlot({ ranked, revealedIds, neighborCount, currentSampleId });
      renderDistanceTable(ranked, k, { revealedIds, currentId: currentSampleId, rankedMode: true, selectedNeighborCount: neighborCount });
      renderCalculations(ranked, neighborCount);
      updateLiveMath(ranked, neighborCount);
      return;
    }

    if (step.type === "vote") {
      renderPlot({ ranked, revealedIds, neighborCount: k, currentSampleId });
      renderDistanceTable(ranked, k, { revealedIds, currentId: currentSampleId, rankedMode: true, selectedNeighborCount: k });

      e.aVotes.textContent = step.votes.A;
      e.bVotes.textContent = step.votes.B;
      e.nearestDistance.textContent = fmt(ranked[0].distance);
      e.prediction.textContent = "Voting…";

      if (e.liveMathVote) {
        e.liveMathVote.textContent = `${classInfo("A").name}: ${step.votes.A}, ${classInfo("B").name}: ${step.votes.B}`;
      }
      return;
    }

    if (step.type === "prediction") {
      e.prediction.textContent = classDisplay(step.prediction);
      e.aVotes.textContent = step.votes.A;
      e.bVotes.textContent = step.votes.B;
      e.nearestDistance.textContent = fmt(ranked[0].distance);

      renderPlot({ ranked, revealedIds, neighborCount: k, prediction: step.prediction });
      renderDistanceTable(ranked, k, { revealedIds, rankedMode: true, selectedNeighborCount: k });
      renderCalculations(ranked, k);
      updateLiveMath(ranked, k, voting);
      processNodes().forEach((node) => node.classList.add("is-complete"));
    }
  }

  function stepLabel(type) {
    const labels = {
      query: "Unknown sample",
      distance: "Measuring distance",
      rank: "Ranking samples",
      select: "Selecting neighbors",
      vote: "Majority vote",
      prediction: "Prediction"
    };
    return labels[type] || "KNN";
  }

  function advanceAnimation() {
    if (!animationContext || !animationSteps.length) prepareAnimation();

    if (animationIndex >= animationSteps.length - 1) {
      pauseAnimation();
      return false;
    }

    animationIndex += 1;
    renderAnimationStep(animationSteps[animationIndex], animationIndex);
    updateAnimationButtons();

    if (animationIndex >= animationSteps.length - 1) pauseAnimation();
    return true;
  }

  function scheduleNext() {
    clearTimeout(animationTimer);
    if (!isPlaying) return;

    animationTimer = setTimeout(() => {
      const advanced = advanceAnimation();
      if (advanced && isPlaying) scheduleNext();
    }, getSpeedDelay());
  }

  function playAnimation() {
    if (!animationContext || animationIndex >= animationSteps.length - 1) prepareAnimation();
    if (isPlaying) return;

    isPlaying = true;
    updateAnimationButtons();

    if (animationIndex === -1) advanceAnimation();
    scheduleNext();
  }

  function pauseAnimation() {
    isPlaying = false;
    clearTimeout(animationTimer);
    animationTimer = null;
    updateAnimationButtons();
  }

  function stopAnimation() {
    isPlaying = false;
    clearTimeout(animationTimer);
    animationTimer = null;
    updateAnimationButtons();
  }

  function nextAnimationStep() {
    pauseAnimation();
    if (!animationContext || animationIndex >= animationSteps.length - 1) prepareAnimation();
    advanceAnimation();
  }

  function updateAnimationButtons() {
    if (!e.play || !e.pause || !e.next) return;
    e.play.disabled = isPlaying;
    e.pause.disabled = !isPlaying;
    e.next.disabled = isPlaying;
  }

  /* ---------------------------------------------------------
     18. CLEAR / INVALIDATE / RESET
     --------------------------------------------------------- */

  function clearResults(render = true) {
    e.prediction.textContent = "—";
    e.aVotes.textContent = "—";
    e.bVotes.textContent = "—";
    e.nearestDistance.textContent = "—";
    e.distanceBody.replaceChildren();
    e.calculations.innerHTML = "<p>Run KNN or start the animation to see the distance calculations.</p>";

    updateLiveMath([], Number.parseInt(e.k.value, 10));
    if (render) renderPlot();
    clearProcessHighlight();
    setAnimationStatus("Ready", 0, 0);
  }

  function invalidate(message = "Values changed. Run or animate KNN again.", rerenderQuery = true) {
    stopAnimation();
    animationContext = null;
    animationSteps = [];
    animationIndex = -1;
    clearResults();
    updateSummary();
    if (rerenderQuery) renderQueryInputs();
    setLive(message);
  }

  function changeFeatureCount() {
    renderTable();
    renderQueryInputs();
    renderAxisSelectors();
    invalidate(
      `${activeFeatures().length} features are active: ${activeFeatures().map(featureName).join(", ")}. Distances use all active features, even though the chart shows only two.` ,
      false
    );
  }

  function reset() {
    stopAnimation();

    data = cloneDefaultData();
    query = cloneDefaultQuery();

    e.featureCount.value = "2";
    e.k.value = "3";
    e.distance.value = "euclidean";
    if (e.speed) e.speed.value = "3";

    updateDatasetUI();
    renderTable();
    renderQueryInputs();
    renderAxisSelectors(true);
    updateSpeedLabel();

    animationContext = null;
    animationSteps = [];
    animationIndex = -1;

    clearResults();
    updateSummary();
    setLive(`${currentDataset().title} reset. Adjust the unknown sample, then use Instant Predict or Play Animation.`);
  }

  /* ---------------------------------------------------------
     19. EVENTS
     --------------------------------------------------------- */

  e.datasetButtons.forEach((button) => {
    button.addEventListener("click", () => switchDataset(button.dataset.knnDataset));
  });

  e.featureCount.addEventListener("change", changeFeatureCount);

  e.k.addEventListener("change", () => {
    invalidate(`K changed to ${e.k.value}. Run or animate the prediction again.`);
  });

  e.distance.addEventListener("change", () => {
    invalidate(`Distance metric changed to ${e.distance.options[e.distance.selectedIndex].text}.`);
  });

  e.xAxis.addEventListener("change", () => ensureDistinctAxes("x"));
  e.yAxis.addEventListener("change", () => ensureDistinctAxes("y"));

  if (e.speed) {
    e.speed.addEventListener("input", () => {
      updateSpeedLabel();
      if (isPlaying) scheduleNext();
    });
  }

  e.add.addEventListener("click", addSample);
  e.remove.addEventListener("click", removeSample);
  e.randomize?.addEventListener("click", randomizeDataset);
  e.run.addEventListener("click", run);
  e.play?.addEventListener("click", playAnimation);
  e.pause?.addEventListener("click", pauseAnimation);
  e.next?.addEventListener("click", nextAnimationStep);
  e.reset.addEventListener("click", reset);

  /* ---------------------------------------------------------
     20. INITIALIZATION
     --------------------------------------------------------- */

  data = cloneDefaultData();
  query = cloneDefaultQuery();
  updateDatasetUI();
  renderTable();
  renderQueryInputs();
  renderAxisSelectors(true);
  updateSpeedLabel();
  clearResults();
  updateSummary();
  updateAnimationButtons();

  return {
    run,
    reset,
    play: playAnimation,
    pause: pauseAnimation,
    next: nextAnimationStep
  };
})();
