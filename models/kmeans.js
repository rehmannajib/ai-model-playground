"use strict";

/* =====================================================
   K-MEANS CLUSTERING — INTERACTIVE LEARNING PLAYGROUND
   -----------------------------------------------------
   Everything specific to K-Means lives in this file:
   - real-world datasets
   - point generation
   - K-Means trace generation
   - play / pause / previous / next
   - SVG visualization
   - live metrics
   - dynamic mathematics
   - dynamic process highlighting
===================================================== */

const KMeansModel = (() => {

  const $ = id => document.getElementById(id);
  const SVG_NS = "http://www.w3.org/2000/svg";

  const DATASETS = {
    customers: {
      name: "Customer Segments",
      icon: "🛍️",
      description: "Group customers using age and spending behaviour.",
      x: { label: "Age", unit: "years", min: 18, max: 70, decimals: 0 },
      y: { label: "Spending Score", unit: "/100", min: 0, max: 100, decimals: 0 },
      clearCenters: [
        [25, 78], [45, 35], [61, 78], [30, 25], [55, 55]
      ],
      overlapCenters: [
        [30, 62], [42, 45], [54, 65], [35, 35], [52, 48]
      ],
      spread: { clear: [4.5, 9], overlap: [8, 15] }
    },

    space: {
      name: "Space Objects",
      icon: "🪐",
      description: "Group fictional space objects using size and temperature.",
      x: { label: "Size Index", unit: "/100", min: 0, max: 100, decimals: 0 },
      y: { label: "Temperature", unit: "K", min: 150, max: 1200, decimals: 0 },
      clearCenters: [
        [20, 320], [52, 720], [82, 980], [72, 330], [35, 980]
      ],
      overlapCenters: [
        [30, 500], [47, 670], [65, 800], [62, 470], [40, 850]
      ],
      spread: { clear: [7, 85], overlap: [13, 150] }
    },

    numeric: {
      name: "Numeric Points",
      icon: "🔢",
      description: "Explore K-Means using simple X and Y coordinates.",
      x: { label: "X", unit: "", min: 0, max: 100, decimals: 1 },
      y: { label: "Y", unit: "", min: 0, max: 100, decimals: 1 },
      clearCenters: [
        [20, 22], [50, 72], [80, 30], [25, 78], [75, 78]
      ],
      overlapCenters: [
        [32, 38], [48, 58], [65, 42], [38, 65], [62, 63]
      ],
      spread: { clear: [8, 8], overlap: [14, 14] }
    }
  };

  let datasetKey = "customers";
  let data = [];
  let trace = [];
  let traceIndex = 0;
  let playing = false;
  let timer = null;
  let speed = 700;

  /* -----------------------------------------------------
     BASIC HELPERS
  ----------------------------------------------------- */

  function dataset() {
    return DATASETS[datasetKey];
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomNormal() {
    let u = 0;
    let v = 0;

    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function normalizedPoint(point) {
    const d = dataset();

    return {
      x: (point.x - d.x.min) / (d.x.max - d.x.min),
      y: (point.y - d.y.min) / (d.y.max - d.y.min)
    };
  }

  function rawPoint(point) {
    const d = dataset();

    return {
      x: d.x.min + point.x * (d.x.max - d.x.min),
      y: d.y.min + point.y * (d.y.max - d.y.min)
    };
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function squaredDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  function formatFeature(value, feature) {
    const number = Number(value).toFixed(feature.decimals ?? 0);
    return feature.unit ? `${number} ${feature.unit}` : number;
  }

  function formatSmall(value) {
    if (!Number.isFinite(value)) return "—";
    return value < 0.01 && value > 0 ? value.toExponential(2) : value.toFixed(3);
  }

  function copyCentroids(centroids) {
    return centroids.map(c => ({ x: c.x, y: c.y }));
  }

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  /* -----------------------------------------------------
     DATA GENERATION
  ----------------------------------------------------- */

  function generateData() {
    pause();

    const d = dataset();
    const k = Number.parseInt($("kmeans-k")?.value ?? "3", 10);
    const count = Number.parseInt($("kmeans-points")?.value ?? "36", 10);
    const pattern = $("kmeans-pattern")?.value ?? "clear";

    const points = [];

    if (pattern === "random") {
      for (let i = 0; i < count; i += 1) {
        points.push({
          id: i + 1,
          x: d.x.min + Math.random() * (d.x.max - d.x.min),
          y: d.y.min + Math.random() * (d.y.max - d.y.min)
        });
      }
    } else {
      const centers = pattern === "overlap" ? d.overlapCenters : d.clearCenters;
      const spread = d.spread[pattern];

      for (let i = 0; i < count; i += 1) {
        const center = centers[i % k];

        points.push({
          id: i + 1,
          x: clamp(center[0] + randomNormal() * spread[0], d.x.min, d.x.max),
          y: clamp(center[1] + randomNormal() * spread[1], d.y.min, d.y.max)
        });
      }
    }

    data = points;
    trace = [];
    traceIndex = 0;

    updateDatasetText();
    renderEmptyState("Data generated. Choose how you want to run K-Means.");
  }

  function setDataset(key) {
    if (!DATASETS[key]) return;

    datasetKey = key;

    document.querySelectorAll("[data-kmeans-dataset]").forEach(button => {
      const active = button.dataset.kmeansDataset === key;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    generateData();
  }

  function updateDatasetText() {
    const d = dataset();

    if ($("kmeans-dataset-title")) {
      $("kmeans-dataset-title").textContent = `${d.icon} ${d.name}`;
    }

    if ($("kmeans-dataset-description")) {
      $("kmeans-dataset-description").textContent = d.description;
    }

    if ($("kmeans-x-axis-label")) {
      $("kmeans-x-axis-label").textContent = d.x.label;
    }

    if ($("kmeans-y-axis-label")) {
      $("kmeans-y-axis-label").textContent = d.y.label;
    }
  }

  /* -----------------------------------------------------
     K-MEANS TRACE
     We precompute the algorithm states so users can move
     forward/backward and play them at any speed.
  ----------------------------------------------------- */

  function initializeCentroids(points, k) {
    if (!points.length) return [];

    const selected = [];
    const first = Math.floor(Math.random() * points.length);
    selected.push({ ...points[first] });

    while (selected.length < k) {
      let bestPoint = points[0];
      let bestDistance = -1;

      points.forEach(point => {
        const nearest = Math.min(...selected.map(c => squaredDistance(point, c)));

        if (nearest > bestDistance) {
          bestDistance = nearest;
          bestPoint = point;
        }
      });

      selected.push({ ...bestPoint });
    }

    return selected;
  }

  function calculateCentroids(points, assignments, oldCentroids, k) {
    return Array.from({ length: k }, (_, cluster) => {
      const members = points.filter((_, index) => assignments[index] === cluster);

      if (!members.length) return { ...oldCentroids[cluster] };

      return {
        x: members.reduce((sum, point) => sum + point.x, 0) / members.length,
        y: members.reduce((sum, point) => sum + point.y, 0) / members.length
      };
    });
  }

  function inertia(points, assignments, centroids) {
    return points.reduce((sum, point, index) => {
      const cluster = assignments[index];
      if (cluster === null || cluster === undefined) return sum;
      return sum + squaredDistance(point, centroids[cluster]);
    }, 0);
  }

  function generateTrace() {
    const k = Number.parseInt($("kmeans-k")?.value ?? "3", 10);
    const points = data.map(normalizedPoint);

    if (!points.length) return [];

    let centroids = initializeCentroids(points, k);
    let previousAssignments = Array(points.length).fill(null);
    const states = [];

    states.push({
      phase: "init",
      iteration: 0,
      centroids: copyCentroids(centroids),
      assignments: [...previousAssignments],
      inertia: null,
      movement: null,
      message: `K=${k}: ${k} starting centroids have been placed among the data.`
    });

    const maxIterations = 12;

    for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
      const newAssignments = [...previousAssignments];

      for (let pointIndex = 0; pointIndex < points.length; pointIndex += 1) {
        const point = points[pointIndex];
        const distances = centroids.map(c => distance(point, c));
        const chosen = distances.indexOf(Math.min(...distances));

        newAssignments[pointIndex] = chosen;

        states.push({
          phase: "assign",
          iteration,
          pointIndex,
          distances: [...distances],
          chosen,
          centroids: copyCentroids(centroids),
          assignments: [...newAssignments],
          inertia: inertia(points, newAssignments, centroids),
          movement: null,
          message: `Point ${pointIndex + 1} is being assigned to its nearest centroid.`
        });
      }

      const nextCentroids = calculateCentroids(points, newAssignments, centroids, k);
      const movement = Math.max(...centroids.map((c, index) => distance(c, nextCentroids[index])));
      const currentInertia = inertia(points, newAssignments, centroids);

      states.push({
        phase: "update",
        iteration,
        centroids: copyCentroids(centroids),
        targetCentroids: copyCentroids(nextCentroids),
        assignments: [...newAssignments],
        inertia: currentInertia,
        movement,
        message: "Each centroid is moving to the mean position of the points assigned to its cluster."
      });

      centroids = nextCentroids;

      states.push({
        phase: "moved",
        iteration,
        centroids: copyCentroids(centroids),
        assignments: [...newAssignments],
        inertia: inertia(points, newAssignments, centroids),
        movement,
        message: `Iteration ${iteration} complete. The centroids have moved to their new positions.`
      });

      const unchanged = newAssignments.every((cluster, index) => cluster === previousAssignments[index]);

      if ((unchanged && movement < 0.0005) || movement < 0.0001) {
        states.push({
          phase: "converged",
          iteration,
          centroids: copyCentroids(centroids),
          assignments: [...newAssignments],
          inertia: inertia(points, newAssignments, centroids),
          movement,
          message: `Converged after ${iteration} iteration${iteration === 1 ? "" : "s"}. Cluster assignments are stable.`
        });
        break;
      }

      previousAssignments = [...newAssignments];

      if (iteration === maxIterations) {
        states.push({
          phase: "converged",
          iteration,
          centroids: copyCentroids(centroids),
          assignments: [...newAssignments],
          inertia: inertia(points, newAssignments, centroids),
          movement,
          message: `Stopped after ${maxIterations} iterations.`
        });
      }
    }

    return states;
  }

  function ensureTrace() {
    if (!trace.length) {
      trace = generateTrace();
      traceIndex = 0;
    }

    return trace.length > 0;
  }

  /* -----------------------------------------------------
     RUN CONTROLS
  ----------------------------------------------------- */

  function instant() {
    pause();
    trace = generateTrace();

    if (!trace.length) return;

    traceIndex = trace.length - 1;
    renderState(trace[traceIndex]);
  }

  function play() {
    if (!ensureTrace()) return;

    if (traceIndex >= trace.length - 1) {
      trace = generateTrace();
      traceIndex = 0;
    }

    // Show the current state immediately before the timed animation continues.
    renderState(trace[traceIndex]);

    playing = true;
    updateRunButtons();
    scheduleNext();
  }

  function scheduleNext() {
    clearTimer();

    if (!playing) return;

    if (traceIndex >= trace.length - 1) {
      pause();
      return;
    }

    timer = setTimeout(() => {
      traceIndex += 1;
      renderState(trace[traceIndex]);
      scheduleNext();
    }, speed);
  }

  function pause() {
    playing = false;
    clearTimer();
    updateRunButtons();
  }

  function next() {
    pause();

    // The first click should show centroid initialization, not skip it.
    if (!trace.length) {
      trace = generateTrace();
      traceIndex = 0;
      if (trace.length) renderState(trace[0]);
      return;
    }

    traceIndex = Math.min(traceIndex + 1, trace.length - 1);
    renderState(trace[traceIndex]);
  }

  function previous() {
    pause();
    if (!ensureTrace()) return;

    traceIndex = Math.max(traceIndex - 1, 0);
    renderState(trace[traceIndex]);
  }

  function resetAlgorithm() {
    pause();
    trace = [];
    traceIndex = 0;
    renderEmptyState("Algorithm reset. Your current data is still available.");
  }

  function updateSpeed(value) {
    // Slider: 1 = slow, 5 = fast.
    const level = Number(value);
    speed = [1400, 1000, 700, 450, 250][level - 1] ?? 700;

    if ($("kmeans-speed-value")) {
      const labels = ["Very slow", "Slow", "Normal", "Fast", "Very fast"];
      $("kmeans-speed-value").textContent = labels[level - 1] ?? "Normal";
    }

    if (playing) scheduleNext();
  }

  function updateRunButtons() {
    if ($("kmeans-play")) $("kmeans-play").disabled = playing;
    if ($("kmeans-pause")) $("kmeans-pause").disabled = !playing;
  }

  /* -----------------------------------------------------
     VISUALIZATION
  ----------------------------------------------------- */

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });

    return element;
  }

  function renderPlot(state = null) {
    const container = $("kmeans-plot");
    if (!container) return;

    container.replaceChildren();

    const d = dataset();
    const width = 900;
    const height = 420;
    const pad = { left: 72, right: 28, top: 30, bottom: 64 };

    const sx = value => pad.left + ((value - d.x.min) / (d.x.max - d.x.min)) * (width - pad.left - pad.right);
    const sy = value => height - pad.bottom - ((value - d.y.min) / (d.y.max - d.y.min)) * (height - pad.top - pad.bottom);

    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      class: "kmeans-svg",
      role: "img",
      "aria-label": "Interactive K-Means cluster visualization"
    });

    // Grid + ticks.
    for (let i = 0; i <= 5; i += 1) {
      const xValue = d.x.min + (i / 5) * (d.x.max - d.x.min);
      const yValue = d.y.min + (i / 5) * (d.y.max - d.y.min);
      const x = sx(xValue);
      const y = sy(yValue);

      svg.append(svgElement("line", { x1: x, y1: pad.top, x2: x, y2: height - pad.bottom, class: "kmeans-grid-line" }));
      svg.append(svgElement("line", { x1: pad.left, y1: y, x2: width - pad.right, y2: y, class: "kmeans-grid-line" }));

      const xText = svgElement("text", { x, y: height - pad.bottom + 24, class: "kmeans-axis-tick", "text-anchor": "middle" });
      xText.textContent = Number(xValue).toFixed(d.x.decimals ?? 0);
      svg.append(xText);

      const yText = svgElement("text", { x: pad.left - 12, y: y + 4, class: "kmeans-axis-tick", "text-anchor": "end" });
      yText.textContent = Number(yValue).toFixed(d.y.decimals ?? 0);
      svg.append(yText);
    }

    svg.append(svgElement("line", { x1: pad.left, y1: height - pad.bottom, x2: width - pad.right, y2: height - pad.bottom, class: "kmeans-axis-line" }));
    svg.append(svgElement("line", { x1: pad.left, y1: pad.top, x2: pad.left, y2: height - pad.bottom, class: "kmeans-axis-line" }));

    const xLabel = svgElement("text", { x: (pad.left + width - pad.right) / 2, y: height - 14, class: "kmeans-axis-label", "text-anchor": "middle" });
    xLabel.textContent = d.x.label;
    svg.append(xLabel);

    const yLabel = svgElement("text", {
      x: 20,
      y: (pad.top + height - pad.bottom) / 2,
      class: "kmeans-axis-label",
      "text-anchor": "middle",
      transform: `rotate(-90 20 ${(pad.top + height - pad.bottom) / 2})`
    });
    yLabel.textContent = d.y.label;
    svg.append(yLabel);

    const assignments = state?.assignments ?? Array(data.length).fill(null);
    const centroids = state?.centroids ?? [];

    // During assignment, draw distances from the active point to every centroid.
    if (state?.phase === "assign" && Number.isInteger(state.pointIndex)) {
      const point = data[state.pointIndex];

      centroids.forEach((centroid, index) => {
        const rawCentroid = rawPoint(centroid);
        const line = svgElement("line", {
          x1: sx(point.x),
          y1: sy(point.y),
          x2: sx(rawCentroid.x),
          y2: sy(rawCentroid.y),
          class: `kmeans-distance-line ${index === state.chosen ? "nearest" : ""}`
        });
        svg.append(line);
      });
    }

    // During centroid update, show where each centroid is moving.
    if (state?.phase === "update" && state.targetCentroids) {
      centroids.forEach((centroid, index) => {
        const from = rawPoint(centroid);
        const to = rawPoint(state.targetCentroids[index]);

        svg.append(svgElement("line", {
          x1: sx(from.x), y1: sy(from.y), x2: sx(to.x), y2: sy(to.y),
          class: `kmeans-centroid-move cluster-stroke-${index % 5}`
        }));

        svg.append(svgElement("circle", {
          cx: sx(to.x), cy: sy(to.y), r: 9,
          class: `kmeans-centroid-target cluster-stroke-${index % 5}`
        }));
      });
    }

    data.forEach((point, index) => {
      const assignment = assignments[index];
      const circle = svgElement("circle", {
        cx: sx(point.x),
        cy: sy(point.y),
        r: state?.pointIndex === index ? 8.5 : 6.5,
        class: assignment === null || assignment === undefined
          ? `kmeans-point neutral ${state?.pointIndex === index ? "active-point" : ""}`
          : `kmeans-point cluster-${assignment % 5} ${state?.pointIndex === index ? "active-point" : ""}`,
        tabindex: "0"
      });

      const title = svgElement("title");
      title.textContent = `Point ${point.id}: ${d.x.label} ${formatFeature(point.x, d.x)}, ${d.y.label} ${formatFeature(point.y, d.y)}${assignment === null || assignment === undefined ? "" : `, Cluster ${assignment + 1}`}`;
      circle.append(title);
      svg.append(circle);
    });

    centroids.forEach((centroid, index) => {
      const raw = rawPoint(centroid);
      const x = sx(raw.x);
      const y = sy(raw.y);
      const size = 11;

      const diamond = svgElement("polygon", {
        points: `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`,
        class: `kmeans-centroid-marker cluster-${index % 5}`
      });

      const title = svgElement("title");
      title.textContent = `Centroid ${index + 1}: ${formatFeature(raw.x, d.x)}, ${formatFeature(raw.y, d.y)}`;
      diamond.append(title);
      svg.append(diamond);

      const label = svgElement("text", {
        x: x + 14,
        y: y - 12,
        class: "kmeans-centroid-label"
      });
      label.textContent = `C${index + 1}`;
      svg.append(label);
    });

    // Click the plot to add a point.
    svg.addEventListener("click", event => {
      if (playing) return;

      const rect = svg.getBoundingClientRect();
      const viewX = ((event.clientX - rect.left) / rect.width) * width;
      const viewY = ((event.clientY - rect.top) / rect.height) * height;

      if (viewX < pad.left || viewX > width - pad.right || viewY < pad.top || viewY > height - pad.bottom) return;

      const rawX = d.x.min + ((viewX - pad.left) / (width - pad.left - pad.right)) * (d.x.max - d.x.min);
      const rawY = d.y.min + ((height - pad.bottom - viewY) / (height - pad.top - pad.bottom)) * (d.y.max - d.y.min);

      data.push({ id: data.length + 1, x: rawX, y: rawY });
      trace = [];
      traceIndex = 0;
      renderEmptyState("Point added. Run K-Means again to include it in clustering.");
    });

    container.append(svg);
  }

  /* -----------------------------------------------------
     TABLES + METRICS
  ----------------------------------------------------- */

  function renderCentroidTable(state) {
    const body = $("kmeans-centroid-body");
    if (!body) return;

    body.replaceChildren();

    const d = dataset();

    (state?.centroids ?? []).forEach((centroid, index) => {
      const raw = rawPoint(centroid);
      const count = state.assignments?.filter(value => value === index).length ?? 0;
      const tr = document.createElement("tr");

      [
        `C${index + 1}`,
        formatFeature(raw.x, d.x),
        formatFeature(raw.y, d.y),
        count
      ].forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });

      body.append(tr);
    });
  }

  function renderPointTable(state) {
    const body = $("kmeans-result-body");
    if (!body) return;

    body.replaceChildren();

    const d = dataset();
    const limit = Math.min(data.length, 20);

    data.slice(0, limit).forEach((point, index) => {
      const cluster = state?.assignments?.[index];
      const tr = document.createElement("tr");

      [
        point.id,
        formatFeature(point.x, d.x),
        formatFeature(point.y, d.y),
        cluster === null || cluster === undefined ? "—" : `Cluster ${cluster + 1}`
      ].forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });

      body.append(tr);
    });

    if (data.length > limit) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.className = "muted";
      td.textContent = `Showing first ${limit} of ${data.length} points.`;
      tr.append(td);
      body.append(tr);
    }
  }

  function renderMetrics(state) {
    const assigned = state?.assignments?.filter(value => value !== null && value !== undefined).length ?? 0;

    if ($("kmeans-metric-iteration")) $("kmeans-metric-iteration").textContent = state ? String(state.iteration) : "0";
    if ($("kmeans-metric-assigned")) $("kmeans-metric-assigned").textContent = `${assigned}/${data.length}`;
    if ($("kmeans-metric-inertia")) $("kmeans-metric-inertia").textContent = state?.inertia === null || state?.inertia === undefined ? "—" : formatSmall(state.inertia);
    if ($("kmeans-metric-movement")) $("kmeans-metric-movement").textContent = state?.movement === null || state?.movement === undefined ? "—" : formatSmall(state.movement);

    const summary = $("kmeans-cluster-summary");
    if (!summary) return;

    summary.replaceChildren();

    const k = Number.parseInt($("kmeans-k")?.value ?? "3", 10);

    for (let cluster = 0; cluster < k; cluster += 1) {
      const count = state?.assignments?.filter(value => value === cluster).length ?? 0;
      const row = document.createElement("div");
      row.className = "kmeans-cluster-row";
      row.innerHTML = `
        <span class="kmeans-cluster-dot cluster-${cluster % 5}"></span>
        <span>Cluster ${cluster + 1}</span>
        <strong>${count}</strong>
      `;
      summary.append(row);
    }
  }

  /* -----------------------------------------------------
     DYNAMIC EDUCATIONAL CONTENT
  ----------------------------------------------------- */

  function phaseLabel(phase) {
    return ({
      init: "Initialize centroids",
      assign: "Assign points",
      update: "Update centroids",
      moved: "Repeat",
      converged: "Converged"
    })[phase] ?? "Ready";
  }

  function renderLiveExplanation(state) {
    if ($("kmeans-live-step")) {
      $("kmeans-live-step").innerHTML = `
        <span class="kmeans-live-kicker">${phaseLabel(state?.phase)}</span>
        <strong>${state?.message ?? "Ready."}</strong>
      `;
    }

    const math = $("kmeans-live-math-mini");
    const dynamicMath = $("kmeans-dynamic-math");
    const html = buildMathHtml(state);

    if (math) math.innerHTML = html;
    if (dynamicMath) dynamicMath.innerHTML = html;

    updateProcess(state);
  }

  function buildMathHtml(state) {
    if (!state) {
      return `<p class="muted">Run K-Means to see calculations using the current dataset.</p>`;
    }

    const d = dataset();

    if (state.phase === "init") {
      return `
        <h4>Initialization</h4>
        <p>K-Means begins with <strong>${state.centroids.length}</strong> centroids. In this playground the starting centroids are selected from well-spread data points.</p>
        <p class="kmeans-formula">K = ${state.centroids.length}</p>
      `;
    }

    if (state.phase === "assign") {
      const point = data[state.pointIndex];
      const normalized = normalizedPoint(point);
      const chosen = state.chosen;
      const nearest = state.distances[chosen];
      const rawCentroid = rawPoint(state.centroids[chosen]);

      return `
        <h4>Distance for Point ${point.id}</h4>
        <p>Current point: <strong>(${formatFeature(point.x, d.x)}, ${formatFeature(point.y, d.y)})</strong></p>
        <p>Nearest centroid: <strong>C${chosen + 1}</strong> at (${formatFeature(rawCentroid.x, d.x)}, ${formatFeature(rawCentroid.y, d.y)})</p>
        <p class="kmeans-formula">d = √[(x − cₓ)² + (y − cᵧ)²]</p>
        <p class="kmeans-formula">d = √[(${normalized.x.toFixed(3)} − ${state.centroids[chosen].x.toFixed(3)})² + (${normalized.y.toFixed(3)} − ${state.centroids[chosen].y.toFixed(3)})²] = <strong>${nearest.toFixed(3)}</strong></p>
        <p>The smallest distance wins, so Point ${point.id} joins <strong>Cluster ${chosen + 1}</strong>.</p>
      `;
    }

    if (state.phase === "update") {
      const cluster = 0;
      const members = data.filter((_, index) => state.assignments[index] === cluster);
      const target = rawPoint(state.targetCentroids[cluster]);

      return `
        <h4>Updating Centroid C1</h4>
        <p>C1 currently has <strong>${members.length}</strong> assigned point${members.length === 1 ? "" : "s"}.</p>
        <p class="kmeans-formula">c₁ = mean(points in Cluster 1)</p>
        <p>New C1 position = <strong>(${formatFeature(target.x, d.x)}, ${formatFeature(target.y, d.y)})</strong></p>
        <p>Maximum centroid movement this iteration: <strong>${formatSmall(state.movement)}</strong> in normalized feature space.</p>
      `;
    }

    if (state.phase === "moved") {
      return `
        <h4>Iteration ${state.iteration} Complete</h4>
        <p>All centroids have moved to the mean of their assigned points.</p>
        <p class="kmeans-formula">Inertia = Σ ||xᵢ − ccluster(i)||² = <strong>${formatSmall(state.inertia)}</strong></p>
        <p>K-Means now checks the points again using the updated centroid positions.</p>
      `;
    }

    return `
      <h4>Convergence</h4>
      <p>The cluster assignments and centroid positions are now stable.</p>
      <p class="kmeans-formula">Final inertia = <strong>${formatSmall(state.inertia)}</strong></p>
      <p>The algorithm converged after <strong>${state.iteration}</strong> iteration${state.iteration === 1 ? "" : "s"}.</p>
    `;
  }

  function updateProcess(state) {
    const order = ["init", "assign", "update", "moved", "converged"];
    const current = state ? order.indexOf(state.phase) : -1;

    document.querySelectorAll("[data-kmeans-process-step]").forEach((item, index) => {
      item.classList.toggle("active", index === current);
      item.classList.toggle("done", current > index || state?.phase === "converged");
    });

    if ($("kmeans-process-note")) {
      $("kmeans-process-note").textContent = state?.message ?? "Run K-Means to follow the process step by step.";
    }
  }

  /* -----------------------------------------------------
     MASTER RENDERERS
  ----------------------------------------------------- */

  function renderState(state) {
    renderPlot(state);
    renderCentroidTable(state);
    renderPointTable(state);
    renderMetrics(state);
    renderLiveExplanation(state);

    if ($("kmeans-progress")) {
      const denominator = Math.max(trace.length - 1, 1);
      $("kmeans-progress").value = (traceIndex / denominator) * 100;
    }

    if ($("kmeans-step-counter")) {
      $("kmeans-step-counter").textContent = trace.length
        ? `Step ${traceIndex + 1} of ${trace.length}`
        : "Ready";
    }

    updateRunButtons();
  }

  function renderEmptyState(message) {
    renderPlot(null);
    renderCentroidTable(null);
    renderPointTable(null);
    renderMetrics(null);
    renderLiveExplanation(null);

    if ($("kmeans-live-step")) {
      $("kmeans-live-step").innerHTML = `
        <span class="kmeans-live-kicker">Ready</span>
        <strong>${message}</strong>
      `;
    }

    if ($("kmeans-progress")) $("kmeans-progress").value = 0;
    if ($("kmeans-step-counter")) $("kmeans-step-counter").textContent = "Ready";

    updateRunButtons();
  }

  /* -----------------------------------------------------
     EVENTS + INITIALIZATION
  ----------------------------------------------------- */

  function init() {
    if (!$("kmeans-playground")) return;

    document.querySelectorAll("[data-kmeans-dataset]").forEach(button => {
      button.addEventListener("click", () => setDataset(button.dataset.kmeansDataset));
    });

    $("kmeans-generate")?.addEventListener("click", generateData);
    $("kmeans-instant")?.addEventListener("click", instant);
    $("kmeans-play")?.addEventListener("click", play);
    $("kmeans-pause")?.addEventListener("click", pause);
    $("kmeans-prev")?.addEventListener("click", previous);
    $("kmeans-next")?.addEventListener("click", next);
    $("kmeans-reset")?.addEventListener("click", resetAlgorithm);

    $("kmeans-speed")?.addEventListener("input", event => updateSpeed(event.target.value));

    ["kmeans-k", "kmeans-points", "kmeans-pattern"].forEach(id => {
      $(id)?.addEventListener("change", generateData);
    });

    updateSpeed($("kmeans-speed")?.value ?? 3);
    setDataset("customers");
  }

  init();

  return {
    generateData,
    instant,
    play,
    pause,
    next,
    previous,
    reset: resetAlgorithm
  };

})();
