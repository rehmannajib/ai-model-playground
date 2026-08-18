"use strict";

/* =========================================================
   K-MEANS PLAYGROUND
   Phase 2: Color clustering + pattern clustering + numeric points
   ========================================================= */

const KMeansPlayground = (() => {
  const $ = (id) => document.getElementById(id);
  const SVG_NS = "http://www.w3.org/2000/svg";
  const MAX_ITERATIONS = 12;

  const CLUSTER_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed"];

  const DATASETS = {
    colors: {
      title: "🎨 Color Clustering",
      description: "Group unlabeled RGB colors by similarity and watch the centroid colors change.",
      visualTitle: "Interactive Color Map",
      visualDescription: "Each unlabeled RGB sample is projected onto a Hue × Brightness palette. K-Means still uses all three normalized RGB values for clustering.",
      hint: "Tip: click anywhere on the palette to choose a new color. After clustering, it is assigned automatically to the nearest learned centroid.",
      manualTitle: "Add a color to the dataset",
      manualHelp: "Adjust Red, Green and Blue. The preview changes immediately, then Add Color stores it as an unlabeled sample.",
      manualButton: "+ Add Color",
      testTitle: "Which cluster is this new color closest to?",
      testHelp: "This color is not used to create the clusters. After K-Means converges, compare it with the learned centroid colors.",
      kind: "color",
      features: [
        { key: "r", short: "R", label: "Red", min: 0, max: 255, step: 1 },
        { key: "g", short: "G", label: "Green", min: 0, max: 255, step: 1 },
        { key: "b", short: "B", label: "Blue", min: 0, max: 255, step: 1 }
      ],
      manualDefault: { r: 220, g: 90, b: 120 },
      testDefault: { r: 205, g: 105, b: 145 }
    },
    patterns: {
      title: "🧩 Pattern Clustering",
      description: "Group unlabeled visual textures by line density, orientation, dot density and contrast.",
      visualTitle: "Interactive Pattern Map",
      visualDescription: "Each pattern is placed on an Orientation × Density map. K-Means still uses all four normalized pattern features when clustering.",
      hint: "Tip: click the pattern map to move the new test pattern by orientation and density. Use the sliders to change dots and contrast.",
      manualTitle: "Add a pattern to the dataset",
      manualHelp: "Adjust line density, orientation, dot density and contrast. The preview changes instantly, then Add Pattern stores it as an unlabeled sample.",
      manualButton: "+ Add Pattern",
      testTitle: "Which cluster is this new pattern closest to?",
      testHelp: "This pattern is not used to create the clusters. After K-Means converges, compare it with the learned pattern centroids.",
      kind: "pattern",
      features: [
        { key: "density", short: "Density", label: "Line Density", min: 10, max: 90, step: 1 },
        { key: "angle", short: "Angle", label: "Orientation", min: 0, max: 180, step: 1 },
        { key: "dots", short: "Dots", label: "Dot Density", min: 0, max: 100, step: 1 },
        { key: "contrast", short: "Contrast", label: "Contrast", min: 20, max: 100, step: 1 }
      ],
      manualDefault: { density: 68, angle: 28, dots: 18, contrast: 82 },
      testDefault: { density: 55, angle: 62, dots: 42, contrast: 72 }
    },
    numeric: {
      title: "🔢 Numeric Points",
      description: "Cluster ordinary X and Y points and watch centroids move across the graph.",
      visualTitle: "Numeric Point Dataset",
      visualDescription: "Every point begins unlabeled. K-Means groups nearby positions using their normalized X and Y coordinates.",
      hint: "Tip: click directly inside the graph to add a point, or enter X and Y values above.",
      manualTitle: "Add a numeric point",
      manualHelp: "Enter X and Y coordinates, then add the point to the current unlabeled dataset.",
      manualButton: "+ Add Point",
      testTitle: "Which cluster is this new point closest to?",
      testHelp: "The new point does not change the learned clusters. It is compared with the final centroids after K-Means converges.",
      kind: "numeric",
      features: [
        { key: "x", short: "X", label: "X", min: 0, max: 100, step: 1 },
        { key: "y", short: "Y", label: "Y", min: 0, max: 100, step: 1 }
      ],
      manualDefault: { x: 50, y: 50 },
      testDefault: { x: 58, y: 62 }
    }
  };

  let datasetKey = "colors";
  let data = [];
  let manualValues = {};
  let testValues = {};

  let trace = [];
  let traceIndex = 0;
  let playing = false;
  let timer = null;
  let speed = 700;
  let finalState = null;
  let testAssignment = null;

  function dataset() {
    return DATASETS[datasetKey];
  }

  function features() {
    return dataset().features;
  }

  function copyObject(object) {
    return JSON.parse(JSON.stringify(object));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value)));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function round(value, digits = 0) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function vectorFromValues(values) {
    return features().map((feature) => Number(values[feature.key]));
  }

  function normalizeVector(values) {
    return features().map((feature) => {
      const range = feature.max - feature.min || 1;
      return (Number(values[feature.key]) - feature.min) / range;
    });
  }

  function rawFromVector(vector) {
    const result = {};
    features().forEach((feature, index) => {
      result[feature.key] = feature.min + vector[index] * (feature.max - feature.min);
    });
    return result;
  }

  function euclidean(a, b) {
    return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
  }

  function squaredDistance(a, b) {
    return a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0);
  }

  function formatRaw(value, feature) {
    return feature.step < 1 ? Number(value).toFixed(1) : String(Math.round(value));
  }

  function formatValues(values) {
    return features()
      .map((feature) => `${feature.short} ${formatRaw(values[feature.key], feature)}`)
      .join(" · ");
  }

  function colorString(values) {
    return `rgb(${Math.round(values.r)}, ${Math.round(values.g)}, ${Math.round(values.b)})`;
  }

  function contrastColor(values) {
    const luminance = (0.299 * values.r + 0.587 * values.g + 0.114 * values.b) / 255;
    return luminance > 0.58 ? "#0f172a" : "#ffffff";
  }

  function rgbToHsv(values) {
    const r = Number(values.r) / 255;
    const g = Number(values.g) / 255;
    const b = Number(values.b) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === r) h = 60 * (((g - b) / delta) % 6);
      else if (max === g) h = 60 * (((b - r) / delta) + 2);
      else h = 60 * (((r - g) / delta) + 4);
    }
    if (h < 0) h += 360;

    const s = max === 0 ? 0 : delta / max;
    return { h, s, v: max };
  }

  function hsvToRgb(h, s, v) {
    const hue = ((Number(h) % 360) + 360) % 360;
    const saturation = clamp(s, 0, 1);
    const value = clamp(v, 0, 1);
    const c = value * saturation;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = value - c;

    let rp = 0, gp = 0, bp = 0;
    if (hue < 60) [rp, gp, bp] = [c, x, 0];
    else if (hue < 120) [rp, gp, bp] = [x, c, 0];
    else if (hue < 180) [rp, gp, bp] = [0, c, x];
    else if (hue < 240) [rp, gp, bp] = [0, x, c];
    else if (hue < 300) [rp, gp, bp] = [x, 0, c];
    else [rp, gp, bp] = [c, 0, x];

    return {
      r: Math.round((rp + m) * 255),
      g: Math.round((gp + m) * 255),
      b: Math.round((bp + m) * 255)
    };
  }

  function setDataset(nextKey) {
    if (!DATASETS[nextKey]) return;

    pause();
    datasetKey = nextKey;
    manualValues = copyObject(dataset().manualDefault);
    testValues = copyObject(dataset().testDefault);
    trace = [];
    traceIndex = 0;
    finalState = null;
    testAssignment = null;

    document.querySelectorAll("[data-kmeans-dataset]").forEach((button) => {
      const active = button.dataset.kmeansDataset === datasetKey;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    $("kmeans-playground")?.classList.toggle("kmeans-color-mode", dataset().kind === "color");
    $("kmeans-playground")?.classList.toggle("kmeans-pattern-mode", dataset().kind === "pattern");
    $("kmeans-playground")?.classList.toggle("kmeans-numeric-mode", dataset().kind === "numeric");

    $("kmeans-dataset-title").textContent = dataset().title;
    $("kmeans-dataset-description").textContent = dataset().description;
    $("kmeans-manual-title").textContent = dataset().manualTitle;
    $("kmeans-manual-help").textContent = dataset().manualHelp;
    $("kmeans-add-manual").textContent = dataset().manualButton;
    $("kmeans-visual-title").textContent = dataset().visualTitle;
    $("kmeans-visual-description").textContent = dataset().visualDescription;
    $("kmeans-plot-hint").textContent = dataset().hint;
    $("kmeans-test-title").textContent = dataset().testTitle;
    $("kmeans-test-help").textContent = dataset().testHelp;

    const axisChip = $("kmeans-axis-chip");
    if (axisChip) axisChip.hidden = dataset().kind !== "numeric";
    if (dataset().kind === "numeric") {
      $("kmeans-x-axis-label").textContent = "X";
      $("kmeans-y-axis-label").textContent = "Y";
    }

    updatePatternOptions();
    renderManualControls();
    renderTestControls();
    generateData();
  }

  function updatePatternOptions() {
    const select = $("kmeans-pattern");
    if (!select) return;

    const selected = select.value;
    const options = dataset().kind === "color"
      ? [
          ["clear", "Distinct Color Families"],
          ["overlap", "Similar / Overlapping Colors"],
          ["random", "Random Colors"]
        ]
      : dataset().kind === "pattern"
        ? [
            ["clear", "Distinct Pattern Families"],
            ["overlap", "Similar / Overlapping Patterns"],
            ["random", "Random Patterns"]
          ]
        : [
            ["clear", "Clear Groups"],
            ["overlap", "Overlapping Groups"],
            ["random", "Random Scatter"]
          ];

    select.replaceChildren();
    options.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    });
    select.value = options.some(([value]) => value === selected) ? selected : "clear";
  }

  function colorAnchors(k, pattern) {
    const distinct = [
      { r: 225, g: 68, b: 82 },
      { r: 65, g: 118, b: 225 },
      { r: 72, g: 182, b: 102 },
      { r: 235, g: 185, b: 55 },
      { r: 158, g: 84, b: 205 }
    ];

    if (pattern === "overlap") {
      const base = { r: 135, g: 130, b: 145 };
      const offsets = [
        { r: 35, g: -10, b: -5 },
        { r: -10, g: 10, b: 35 },
        { r: -20, g: 35, b: -10 },
        { r: 25, g: 20, b: -20 },
        { r: 20, g: -25, b: 25 }
      ];
      return offsets.slice(0, k).map((offset) => ({
        r: clamp(base.r + offset.r, 0, 255),
        g: clamp(base.g + offset.g, 0, 255),
        b: clamp(base.b + offset.b, 0, 255)
      }));
    }

    return distinct.slice(0, k);
  }

  function patternAnchors(k, pattern) {
    if (pattern === "overlap") {
      const base = { density: 55, angle: 75, dots: 45, contrast: 68 };
      const offsets = [
        { density: 14, angle: -18, dots: -12, contrast: 10 },
        { density: -10, angle: 16, dots: 18, contrast: 4 },
        { density: 9, angle: 28, dots: 8, contrast: -8 },
        { density: -14, angle: -30, dots: 4, contrast: -4 },
        { density: 18, angle: 40, dots: -4, contrast: 8 }
      ];
      return offsets.slice(0, k).map((offset) => ({
        density: clamp(base.density + offset.density, 10, 90),
        angle: clamp(base.angle + offset.angle, 0, 180),
        dots: clamp(base.dots + offset.dots, 0, 100),
        contrast: clamp(base.contrast + offset.contrast, 20, 100)
      }));
    }

    return [
      { density: 78, angle: 22, dots: 8, contrast: 88 },
      { density: 28, angle: 92, dots: 86, contrast: 76 },
      { density: 72, angle: 90, dots: 48, contrast: 92 },
      { density: 32, angle: 142, dots: 18, contrast: 52 },
      { density: 84, angle: 58, dots: 68, contrast: 82 }
    ].slice(0, k);
  }

  function applyPatternStyle(element, values) {
    if (!element || !values) return;
    const density = clamp(values.density, 10, 90);
    const angle = clamp(values.angle, 0, 180);
    const dots = clamp(values.dots, 0, 100);
    const contrast = clamp(values.contrast, 20, 100);

    const lineGap = Math.max(5, 19 - density * 0.14);
    const lineWidth = 1 + contrast * 0.025;
    const dotGap = Math.max(8, 28 - dots * 0.18);
    const dotSize = 1 + dots * 0.025;
    const alpha = 0.22 + contrast * 0.0065;
    const bg = 98 - contrast * 0.18;

    element.style.backgroundColor = `hsl(210 16% ${bg}%)`;
    element.style.backgroundImage = `
      radial-gradient(circle, rgba(15,23,42,${Math.min(.9, alpha)}) 0 ${dotSize}px, transparent ${dotSize + .8}px),
      repeating-linear-gradient(${angle}deg, rgba(15,23,42,${Math.min(.92, alpha)}) 0 ${lineWidth}px, transparent ${lineWidth}px ${lineGap}px)
    `;
    element.style.backgroundSize = `${dotGap}px ${dotGap}px, auto`;
  }

  function patternSummary(values) {
    return `Density ${Math.round(values.density)} · Angle ${Math.round(values.angle)}° · Dots ${Math.round(values.dots)} · Contrast ${Math.round(values.contrast)}`;
  }

  function numericAnchors(k, pattern) {
    if (pattern === "overlap") {
      return [
        { x: 38, y: 58 },
        { x: 58, y: 58 },
        { x: 48, y: 42 },
        { x: 62, y: 42 },
        { x: 36, y: 40 }
      ].slice(0, k);
    }

    return [
      { x: 20, y: 75 },
      { x: 78, y: 78 },
      { x: 52, y: 25 },
      { x: 18, y: 25 },
      { x: 82, y: 28 }
    ].slice(0, k);
  }

  function generateData() {
    pause();

    const count = Number.parseInt($("kmeans-points")?.value ?? "18", 10);
    const k = Number.parseInt($("kmeans-k")?.value ?? "3", 10);
    const pattern = $("kmeans-pattern")?.value ?? "clear";
    data = [];

    if (dataset().kind === "color") {
      if (pattern === "random") {
        for (let i = 0; i < count; i += 1) {
          data.push({
            id: i + 1,
            values: {
              r: Math.round(randomBetween(0, 255)),
              g: Math.round(randomBetween(0, 255)),
              b: Math.round(randomBetween(0, 255))
            }
          });
        }
      } else {
        const anchors = colorAnchors(k, pattern);
        const spread = pattern === "overlap" ? 48 : 30;
        for (let i = 0; i < count; i += 1) {
          const center = anchors[i % anchors.length];
          data.push({
            id: i + 1,
            values: {
              r: Math.round(clamp(center.r + randomBetween(-spread, spread), 0, 255)),
              g: Math.round(clamp(center.g + randomBetween(-spread, spread), 0, 255)),
              b: Math.round(clamp(center.b + randomBetween(-spread, spread), 0, 255))
            }
          });
        }
      }
    } else if (dataset().kind === "pattern") {
      if (pattern === "random") {
        for (let i = 0; i < count; i += 1) {
          data.push({
            id: i + 1,
            values: {
              density: Math.round(randomBetween(10, 90)),
              angle: Math.round(randomBetween(0, 180)),
              dots: Math.round(randomBetween(0, 100)),
              contrast: Math.round(randomBetween(20, 100))
            }
          });
        }
      } else {
        const anchors = patternAnchors(k, pattern);
        const spread = pattern === "overlap"
          ? { density: 18, angle: 34, dots: 22, contrast: 18 }
          : { density: 10, angle: 16, dots: 14, contrast: 11 };
        for (let i = 0; i < count; i += 1) {
          const center = anchors[i % anchors.length];
          data.push({
            id: i + 1,
            values: {
              density: Math.round(clamp(center.density + randomBetween(-spread.density, spread.density), 10, 90)),
              angle: Math.round(clamp(center.angle + randomBetween(-spread.angle, spread.angle), 0, 180)),
              dots: Math.round(clamp(center.dots + randomBetween(-spread.dots, spread.dots), 0, 100)),
              contrast: Math.round(clamp(center.contrast + randomBetween(-spread.contrast, spread.contrast), 20, 100))
            }
          });
        }
      }
    } else {
      if (pattern === "random") {
        for (let i = 0; i < count; i += 1) {
          data.push({ id: i + 1, values: { x: round(randomBetween(5, 95)), y: round(randomBetween(5, 95)) } });
        }
      } else {
        const anchors = numericAnchors(k, pattern);
        const spread = pattern === "overlap" ? 18 : 11;
        for (let i = 0; i < count; i += 1) {
          const center = anchors[i % anchors.length];
          data.push({
            id: i + 1,
            values: {
              x: round(clamp(center.x + randomBetween(-spread, spread), 0, 100)),
              y: round(clamp(center.y + randomBetween(-spread, spread), 0, 100))
            }
          });
        }
      }
    }

    reindexData();
    invalidateAlgorithm("Example data generated. You can add your own samples, change K, or run K-Means.");
  }

  function reindexData() {
    data.forEach((point, index) => { point.id = index + 1; });
  }

  function renderManualControls() {
    const container = $("kmeans-manual-inputs");
    if (!container) return;
    container.replaceChildren();

    features().forEach((feature) => {
      const label = document.createElement("label");
      label.className = "kmeans-input-control";

      const heading = document.createElement("span");
      heading.className = "kmeans-input-heading";
      const name = document.createElement("strong");
      name.textContent = feature.label;
      const output = document.createElement("output");
      output.textContent = formatRaw(manualValues[feature.key], feature);
      heading.append(name, output);

      const input = document.createElement("input");
      input.dataset.kmeansManualFeature = feature.key;
      input.min = feature.min;
      input.max = feature.max;
      input.step = feature.step;
      input.value = manualValues[feature.key];
      input.type = dataset().kind === "numeric" ? "number" : "range";

      input.addEventListener("input", () => {
        manualValues[feature.key] = clamp(input.value, feature.min, feature.max);
        output.textContent = formatRaw(manualValues[feature.key], feature);
        updateManualPreview();
      });

      label.append(heading, input);
      container.append(label);
    });

    updateManualPreview();
  }

  function updateManualPreview() {
    const preview = $("kmeans-manual-preview");
    if (!preview) return;

    if (dataset().kind === "color") {
      preview.className = "kmeans-sample-preview color-preview";
      preview.style.background = colorString(manualValues);
      preview.style.color = contrastColor(manualValues);
      preview.textContent = `RGB(${Math.round(manualValues.r)}, ${Math.round(manualValues.g)}, ${Math.round(manualValues.b)})`;
    } else if (dataset().kind === "pattern") {
      preview.className = "kmeans-sample-preview pattern-preview";
      preview.removeAttribute("style");
      applyPatternStyle(preview, manualValues);
      preview.innerHTML = `<span>Pattern Preview</span><small>${patternSummary(manualValues)}</small>`;
    } else {
      preview.className = "kmeans-sample-preview numeric-preview";
      preview.removeAttribute("style");
      preview.textContent = `(${Math.round(manualValues.x)}, ${Math.round(manualValues.y)})`;
    }
  }

  function addManualSample() {
    pause();
    const values = {};
    features().forEach((feature) => {
      values[feature.key] = clamp(manualValues[feature.key], feature.min, feature.max);
    });
    data.push({ id: data.length + 1, values });
    invalidateAlgorithm(`${dataset().kind === "color" ? "Color" : dataset().kind === "pattern" ? "Pattern" : "Point"} added. The dataset now contains ${data.length} samples.`);
  }

  function clearData() {
    pause();
    data = [];
    invalidateAlgorithm("All samples cleared. Add your own samples or generate a new example dataset.");
  }

  function renderTestControls() {
    const container = $("kmeans-test-inputs");
    if (!container) return;
    container.replaceChildren();

    features().forEach((feature) => {
      const label = document.createElement("label");
      label.className = "kmeans-input-control";

      const heading = document.createElement("span");
      heading.className = "kmeans-input-heading";
      const name = document.createElement("strong");
      name.textContent = feature.label;
      const output = document.createElement("output");
      output.textContent = formatRaw(testValues[feature.key], feature);
      heading.append(name, output);

      const input = document.createElement("input");
      input.min = feature.min;
      input.max = feature.max;
      input.step = feature.step;
      input.value = testValues[feature.key];
      input.type = dataset().kind === "numeric" ? "number" : "range";

      input.addEventListener("input", () => {
        testValues[feature.key] = clamp(input.value, feature.min, feature.max);
        output.textContent = formatRaw(testValues[feature.key], feature);
        testAssignment = null;
        updateTestPreview();
        renderTestResult();
        renderVisualization(finalState);
      });

      label.append(heading, input);
      container.append(label);
    });

    updateTestPreview();
    renderTestResult();
  }

  function updateTestPreview() {
    const preview = $("kmeans-test-preview");
    if (!preview) return;

    if (dataset().kind === "color") {
      preview.className = "kmeans-sample-preview color-preview";
      preview.style.background = colorString(testValues);
      preview.style.color = contrastColor(testValues);
      preview.textContent = `RGB(${Math.round(testValues.r)}, ${Math.round(testValues.g)}, ${Math.round(testValues.b)})`;
    } else if (dataset().kind === "pattern") {
      preview.className = "kmeans-sample-preview pattern-preview";
      preview.removeAttribute("style");
      applyPatternStyle(preview, testValues);
      preview.innerHTML = `<span>New Pattern</span><small>${patternSummary(testValues)}</small>`;
    } else {
      preview.className = "kmeans-sample-preview numeric-preview";
      preview.removeAttribute("style");
      preview.textContent = `(${Math.round(testValues.x)}, ${Math.round(testValues.y)})`;
    }
  }

  function assignTestSample() {
    if (!finalState?.centroids?.length) return;

    const vector = normalizeVector(testValues);
    const distances = finalState.centroids.map((centroid) => euclidean(vector, centroid));
    const cluster = distances.indexOf(Math.min(...distances));
    testAssignment = { cluster, distances };
    renderTestResult();
    renderVisualization(finalState);
  }

  function renderTestResult() {
    const result = $("kmeans-test-result");
    if (!result) return;

    const button = $("kmeans-test-assign");
    if (button) button.disabled = !finalState?.centroids?.length;

    if (!finalState?.centroids?.length) {
      result.innerHTML = "Run K-Means first. The learned centroids will then be used to place this new sample.";
      return;
    }

    if (!testAssignment) {
      result.innerHTML = "Clusters are ready. Adjust the new sample, then choose <strong>Assign to Nearest Cluster</strong>.";
      return;
    }

    const centroidRaw = rawFromVector(finalState.centroids[testAssignment.cluster]);
    const distanceLines = testAssignment.distances
      .map((distance, index) => `<span>C${index + 1}: ${distance.toFixed(3)}</span>`)
      .join("");

    if (dataset().kind === "color") {
      result.innerHTML = `
        <div class="kmeans-test-result-main">
          <span class="kmeans-test-centroid-swatch" style="background:${colorString(centroidRaw)}"></span>
          <div>
            <small>NEAREST LEARNED CENTROID</small>
            <strong>Cluster ${testAssignment.cluster + 1}</strong>
            <p>Centroid RGB(${Math.round(centroidRaw.r)}, ${Math.round(centroidRaw.g)}, ${Math.round(centroidRaw.b)})</p>
          </div>
        </div>
        <div class="kmeans-test-distances">${distanceLines}</div>
      `;
    } else if (dataset().kind === "pattern") {
      result.innerHTML = `
        <div class="kmeans-test-result-main">
          <span id="kmeans-test-pattern-centroid" class="kmeans-test-pattern-centroid"></span>
          <div>
            <small>NEAREST LEARNED CENTROID</small>
            <strong>Cluster ${testAssignment.cluster + 1}</strong>
            <p>${patternSummary(centroidRaw)}</p>
          </div>
        </div>
        <div class="kmeans-test-distances">${distanceLines}</div>
      `;
      applyPatternStyle($("kmeans-test-pattern-centroid"), centroidRaw);
    } else {
      result.innerHTML = `
        <div class="kmeans-test-result-main">
          <span class="kmeans-test-cluster-dot" style="background:${CLUSTER_COLORS[testAssignment.cluster]}"></span>
          <div>
            <small>NEAREST LEARNED CENTROID</small>
            <strong>Cluster ${testAssignment.cluster + 1}</strong>
            <p>Centroid (${centroidRaw.x.toFixed(1)}, ${centroidRaw.y.toFixed(1)})</p>
          </div>
        </div>
        <div class="kmeans-test-distances">${distanceLines}</div>
      `;
    }
  }

  function normalizedPoints() {
    return data.map((point) => normalizeVector(point.values));
  }

  function chooseInitialCentroids(points, k) {
    if (!points.length) return [];
    const selected = [0];

    while (selected.length < k) {
      let bestIndex = -1;
      let bestDistance = -1;

      points.forEach((point, index) => {
        if (selected.includes(index)) return;
        const nearest = Math.min(...selected.map((selectedIndex) => euclidean(point, points[selectedIndex])));
        if (nearest > bestDistance) {
          bestDistance = nearest;
          bestIndex = index;
        }
      });

      if (bestIndex < 0) break;
      selected.push(bestIndex);
    }

    return selected.map((index) => [...points[index]]);
  }

  function meanCentroids(points, assignments, oldCentroids, k) {
    return Array.from({ length: k }, (_, cluster) => {
      const members = points.filter((_, index) => assignments[index] === cluster);
      if (!members.length) return [...oldCentroids[cluster]];

      return oldCentroids[cluster].map((_, dimension) => (
        members.reduce((sum, point) => sum + point[dimension], 0) / members.length
      ));
    });
  }

  function inertia(points, assignments, centroids) {
    return points.reduce((sum, point, index) => {
      const cluster = assignments[index];
      if (cluster === null || cluster === undefined) return sum;
      return sum + squaredDistance(point, centroids[cluster]);
    }, 0);
  }

  function centroidMovement(from, to) {
    return Math.max(...from.map((centroid, index) => euclidean(centroid, to[index])), 0);
  }

  function copyCentroids(centroids) {
    return centroids.map((centroid) => [...centroid]);
  }

  function generateTrace() {
    const k = Number.parseInt($("kmeans-k")?.value ?? "3", 10);

    if (data.length < k) {
      renderEmptyState(`K = ${k} needs at least ${k} samples. Add more data first.`);
      return [];
    }

    const points = normalizedPoints();
    let centroids = chooseInitialCentroids(points, k);
    let previousAssignments = Array(data.length).fill(null);
    const states = [{
      phase: "init",
      iteration: 0,
      centroids: copyCentroids(centroids),
      assignments: Array(data.length).fill(null),
      inertia: null,
      movement: null,
      message: `K-Means placed ${k} starting centroids across the current unlabeled dataset.`
    }];

    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
      const assignments = Array(data.length).fill(null);

      points.forEach((point, pointIndex) => {
        const distances = centroids.map((centroid) => euclidean(point, centroid));
        const chosen = distances.indexOf(Math.min(...distances));
        assignments[pointIndex] = chosen;

        states.push({
          phase: "assign",
          iteration,
          pointIndex,
          distances,
          chosen,
          centroids: copyCentroids(centroids),
          assignments: [...assignments],
          inertia: null,
          movement: null,
          message: `Sample ${data[pointIndex].id} is closest to Centroid ${chosen + 1}, so it joins Cluster ${chosen + 1}.`
        });
      });

      const targetCentroids = meanCentroids(points, assignments, centroids, k);
      states.push({
        phase: "update",
        iteration,
        centroids: copyCentroids(centroids),
        centroidTargets: copyCentroids(targetCentroids),
        assignments: [...assignments],
        inertia: inertia(points, assignments, centroids),
        movement: null,
        message: "Every sample is assigned. K-Means now calculates the mean position of each cluster."
      });

      const movement = centroidMovement(centroids, targetCentroids);
      centroids = targetCentroids;
      const currentInertia = inertia(points, assignments, centroids);

      states.push({
        phase: "moved",
        iteration,
        centroids: copyCentroids(centroids),
        assignments: [...assignments],
        inertia: currentInertia,
        movement,
        message: `Centroids moved. Maximum movement = ${movement.toFixed(3)}. K-Means checks the samples again.`
      });

      const unchanged = assignments.every((cluster, index) => cluster === previousAssignments[index]);
      if ((unchanged && movement < 0.001) || movement < 0.0001) {
        states.push({
          phase: "converged",
          iteration,
          centroids: copyCentroids(centroids),
          assignments: [...assignments],
          inertia: currentInertia,
          movement,
          message: `Converged after ${iteration} iteration${iteration === 1 ? "" : "s"}. The cluster assignments are stable.`
        });
        break;
      }

      previousAssignments = [...assignments];

      if (iteration === MAX_ITERATIONS) {
        states.push({
          phase: "converged",
          iteration,
          centroids: copyCentroids(centroids),
          assignments: [...assignments],
          inertia: currentInertia,
          movement,
          message: `Stopped after ${MAX_ITERATIONS} iterations.`
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
    finalState = null;
    testAssignment = null;
    renderEmptyState("Algorithm reset. Your current data is still available.");
  }

  function updateSpeed(value) {
    const level = Number(value);
    speed = [1400, 1000, 700, 450, 250][level - 1] ?? 700;
    const labels = ["Very slow", "Slow", "Normal", "Fast", "Very fast"];
    if ($("kmeans-speed-value")) $("kmeans-speed-value").textContent = labels[level - 1] ?? "Normal";
    if (playing) scheduleNext();
  }

  function updateRunButtons() {
    if ($("kmeans-play")) $("kmeans-play").disabled = playing;
    if ($("kmeans-pause")) $("kmeans-pause").disabled = !playing;
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  function renderVisualization(state = null) {
    if (dataset().kind === "color") renderColorBoard(state);
    else if (dataset().kind === "pattern") renderPatternBoard(state);
    else renderNumericPlot(state);
  }

  function renderColorBoard(state = null) {
    const container = $("kmeans-plot");
    if (!container) return;
    container.replaceChildren();

    const assignments = state?.assignments ?? Array(data.length).fill(null);
    const centroids = state?.centroids ?? [];
    const width = 960;
    const height = 410;
    const pad = { left: 52, right: 34, top: 26, bottom: 52 };

    const xFromHue = (hue) => pad.left + (hue / 360) * (width - pad.left - pad.right);
    const yFromValue = (value) => pad.top + (1 - value) * (height - pad.top - pad.bottom);
    const hueFromX = (x) => ((x - pad.left) / (width - pad.left - pad.right)) * 360;
    const valueFromY = (y) => 1 - ((y - pad.top) / (height - pad.top - pad.bottom));

    const shell = document.createElement("div");
    shell.className = "kmeans-palette-shell";

    const mapWrap = document.createElement("div");
    mapWrap.className = "kmeans-palette-map-wrap";

    const palette = document.createElement("div");
    palette.className = "kmeans-palette-map";
    palette.setAttribute("role", "application");
    palette.setAttribute("aria-label", "Hue and brightness color map. Click to choose a new color sample.");

    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      class: "kmeans-palette-svg",
      role: "img",
      "aria-label": "K-Means color samples projected on a hue and brightness map"
    });

    // Light guide lines help users understand that the palette is still a coordinate space.
    [0, 60, 120, 180, 240, 300, 360].forEach((hue) => {
      const x = xFromHue(hue);
      svg.append(svgElement("line", {
        x1: x, x2: x, y1: pad.top, y2: height - pad.bottom, class: "kmeans-palette-grid-line"
      }));
    });
    [0.25, 0.5, 0.75, 1].forEach((value) => {
      const y = yFromValue(value);
      svg.append(svgElement("line", {
        x1: pad.left, x2: width - pad.right, y1: y, y2: y, class: "kmeans-palette-grid-line"
      }));
    });

    // Draw assignment lines first, so points and centroids remain visually dominant.
    if (centroids.length) {
      data.forEach((point, index) => {
        const cluster = assignments[index];
        if (cluster === null || cluster === undefined || !centroids[cluster]) return;
        const pointHsv = rgbToHsv(point.values);
        const centroidRaw = rawFromVector(centroids[cluster]);
        const centroidHsv = rgbToHsv(centroidRaw);
        svg.append(svgElement("line", {
          x1: xFromHue(pointHsv.h),
          y1: yFromValue(pointHsv.v),
          x2: xFromHue(centroidHsv.h),
          y2: yFromValue(centroidHsv.v),
          class: `kmeans-palette-cluster-link cluster-stroke-${cluster % 5}`
        }));
      });
    }

    // During centroid update, show the target movement on the map.
    if (state?.phase === "update" && state.centroidTargets?.length) {
      state.centroids.forEach((centroid, index) => {
        const fromRaw = rawFromVector(centroid);
        const toRaw = rawFromVector(state.centroidTargets[index]);
        const from = rgbToHsv(fromRaw);
        const to = rgbToHsv(toRaw);
        svg.append(svgElement("line", {
          x1: xFromHue(from.h), y1: yFromValue(from.v),
          x2: xFromHue(to.h), y2: yFromValue(to.v),
          class: `kmeans-palette-centroid-move cluster-stroke-${index % 5}`
        }));
        svg.append(svgElement("circle", {
          cx: xFromHue(to.h), cy: yFromValue(to.v), r: 10,
          class: `kmeans-palette-centroid-target cluster-stroke-${index % 5}`
        }));
      });
    }

    data.forEach((point, index) => {
      const hsv = rgbToHsv(point.values);
      const cluster = assignments[index];
      const active = state?.pointIndex === index;
      const x = xFromHue(hsv.h);
      const y = yFromValue(hsv.v);

      const group = svgElement("g", { class: "kmeans-palette-point-group" });

      if (cluster !== null && cluster !== undefined) {
        group.append(svgElement("circle", {
          cx: x, cy: y, r: active ? 15 : 13,
          class: `kmeans-palette-cluster-ring cluster-stroke-${cluster % 5}`
        }));
      }

      if (active) {
        group.append(svgElement("circle", {
          cx: x, cy: y, r: 19, class: "kmeans-palette-active-ring"
        }));
      }

      const circle = svgElement("circle", {
        cx: x,
        cy: y,
        r: active ? 9 : 7.5,
        fill: colorString(point.values),
        class: "kmeans-palette-point"
      });
      const title = svgElement("title");
      title.textContent = `Sample ${point.id}: RGB(${Math.round(point.values.r)}, ${Math.round(point.values.g)}, ${Math.round(point.values.b)})${cluster === null || cluster === undefined ? " · Unlabeled" : ` · Cluster ${cluster + 1}`}`;
      circle.append(title);

      const number = svgElement("text", {
        x: x + 11, y: y - 10, class: "kmeans-palette-point-label"
      });
      number.textContent = point.id;

      group.append(circle, number);
      svg.append(group);
    });

    centroids.forEach((centroid, index) => {
      const raw = rawFromVector(centroid);
      const hsv = rgbToHsv(raw);
      const x = xFromHue(hsv.h);
      const y = yFromValue(hsv.v);
      const size = 12;

      const outer = svgElement("polygon", {
        points: `${x},${y - size - 3} ${x + size + 3},${y} ${x},${y + size + 3} ${x - size - 3},${y}`,
        class: "kmeans-palette-centroid-outer"
      });
      const diamond = svgElement("polygon", {
        points: `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`,
        fill: colorString(raw),
        class: `kmeans-palette-centroid cluster-stroke-${index % 5}`
      });
      const label = svgElement("text", {
        x: x + 17, y: y - 14, class: "kmeans-palette-centroid-label"
      });
      label.textContent = `C${index + 1}`;
      svg.append(outer, diamond, label);
    });

    // The new/test color is always visible. A palette click moves this marker.
    const testHsv = rgbToHsv(testValues);
    const testX = xFromHue(testHsv.h);
    const testY = yFromValue(testHsv.v);
    const testGroup = svgElement("g", { class: "kmeans-palette-test-group" });
    testGroup.append(svgElement("circle", {
      cx: testX, cy: testY, r: 13, class: "kmeans-palette-test-ring"
    }));
    testGroup.append(svgElement("circle", {
      cx: testX, cy: testY, r: 8, fill: colorString(testValues), class: "kmeans-palette-test-point"
    }));
    const testLabel = svgElement("text", {
      x: testX + 15, y: testY - 12, class: "kmeans-palette-test-label"
    });
    testLabel.textContent = testAssignment ? `New → C${testAssignment.cluster + 1}` : "New";
    testGroup.append(testLabel);
    svg.append(testGroup);

    // Keep axis labels outside the palette so they never cover the color map.
    palette.append(svg);

    const paletteArea = document.createElement("div");
    paletteArea.className = "kmeans-palette-axis-layout";

    const brightnessLabel = document.createElement("div");
    brightnessLabel.className = "kmeans-palette-y-axis-label";
    brightnessLabel.innerHTML = `<span>Brightness</span><strong>↑</strong>`;

    const paletteColumn = document.createElement("div");
    paletteColumn.className = "kmeans-palette-column";

    const hueAxisLabel = document.createElement("div");
    hueAxisLabel.className = "kmeans-palette-x-axis-label";
    hueAxisLabel.innerHTML = `<span>Hue</span><strong>→</strong>`;

    paletteColumn.append(palette, hueAxisLabel);
    paletteArea.append(brightnessLabel, paletteColumn);

    palette.addEventListener("click", (event) => {
      const rect = palette.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * width;
      const py = ((event.clientY - rect.top) / rect.height) * height;
      if (px < pad.left || px > width - pad.right || py < pad.top || py > height - pad.bottom) return;

      const hue = clamp(hueFromX(px), 0, 359.999);
      const value = clamp(valueFromY(py), 0.08, 1);
      const selected = hsvToRgb(hue, 1, value);
      testValues = { r: selected.r, g: selected.g, b: selected.b };
      testAssignment = null;
      renderTestControls();

      if (finalState?.centroids?.length) {
        assignTestSample();
      } else {
        renderVisualization(null);
      }
    });

    const footer = document.createElement("div");
    footer.className = "kmeans-palette-footer";
    footer.innerHTML = `
      <div class="kmeans-palette-help">
        <strong>Click the palette</strong>
        <span>to choose the new color shown by the white ring.</span>
      </div>
      <div class="kmeans-palette-projection-note">
        <span>Map:</span> Hue × Brightness
        <span>Clustering:</span> full normalized RGB
      </div>
    `;

    if (centroids.length) {
      const centroidLegend = document.createElement("div");
      centroidLegend.className = "kmeans-palette-centroid-legend";
      centroids.forEach((centroid, index) => {
        const raw = rawFromVector(centroid);
        const chip = document.createElement("div");
        chip.className = `kmeans-palette-centroid-chip cluster-border-${index % 5}`;
        chip.innerHTML = `
          <span style="background:${colorString(raw)}"></span>
          <strong>C${index + 1}</strong>
          <small>RGB(${Math.round(raw.r)}, ${Math.round(raw.g)}, ${Math.round(raw.b)})</small>
        `;
        centroidLegend.append(chip);
      });
      shell.append(centroidLegend);
    }

    mapWrap.append(paletteArea, footer);
    shell.prepend(mapWrap);
    container.append(shell);
  }

  function renderPatternBoard(state = null) {
    const container = $("kmeans-plot");
    if (!container) return;
    container.replaceChildren();

    const assignments = state?.assignments ?? Array(data.length).fill(null);
    const centroids = state?.centroids ?? [];
    const width = 920;
    const height = 390;
    const pad = { left: 64, right: 36, top: 30, bottom: 54 };

    const sx = (angle) => pad.left + (clamp(angle, 0, 180) / 180) * (width - pad.left - pad.right);
    const sy = (density) => height - pad.bottom - ((clamp(density, 10, 90) - 10) / 80) * (height - pad.top - pad.bottom);
    const markerLeft = (angle) => (sx(angle) / width) * 100;
    const markerTop = (density) => (sy(density) / height) * 100;
    const angleFromX = (x) => ((x - pad.left) / (width - pad.left - pad.right)) * 180;
    const densityFromY = (y) => 10 + ((height - pad.bottom - y) / (height - pad.top - pad.bottom)) * 80;

    const shell = document.createElement("div");
    shell.className = "kmeans-pattern-shell";

    const axisLayout = document.createElement("div");
    axisLayout.className = "kmeans-pattern-axis-layout";

    const yLabel = document.createElement("div");
    yLabel.className = "kmeans-pattern-y-axis-label";
    yLabel.innerHTML = `<strong>↑</strong><span>Line Density</span>`;

    const column = document.createElement("div");
    column.className = "kmeans-pattern-column";

    const map = document.createElement("div");
    map.className = "kmeans-pattern-map";
    map.setAttribute("role", "application");
    map.setAttribute("aria-label", "Pattern orientation and line density map. Click to move the new test pattern.");

    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      class: "kmeans-pattern-svg",
      role: "img",
      "aria-label": "K-Means pattern samples projected on orientation and line density"
    });

    [0, 30, 60, 90, 120, 150, 180].forEach((angle) => {
      const x = sx(angle);
      svg.append(svgElement("line", { x1:x, x2:x, y1:pad.top, y2:height-pad.bottom, class:"kmeans-pattern-grid-line" }));
      const t = svgElement("text", { x, y:height-19, class:"kmeans-pattern-tick" });
      t.textContent = `${angle}°`;
      svg.append(t);
    });
    [10, 30, 50, 70, 90].forEach((density) => {
      const y = sy(density);
      svg.append(svgElement("line", { x1:pad.left, x2:width-pad.right, y1:y, y2:y, class:"kmeans-pattern-grid-line" }));
      const t = svgElement("text", { x:pad.left-15, y:y+4, class:"kmeans-pattern-tick kmeans-pattern-y-tick" });
      t.textContent = density;
      svg.append(t);
    });

    if (centroids.length) {
      data.forEach((point, index) => {
        const cluster = assignments[index];
        if (cluster === null || cluster === undefined || !centroids[cluster]) return;
        const raw = rawFromVector(centroids[cluster]);
        svg.append(svgElement("line", {
          x1:sx(point.values.angle), y1:sy(point.values.density),
          x2:sx(raw.angle), y2:sy(raw.density),
          class:`kmeans-pattern-link cluster-stroke-${cluster % 5}`
        }));
      });
    }

    if (state?.phase === "update" && state.centroidTargets?.length) {
      state.centroids.forEach((centroid, index) => {
        const fromRaw = rawFromVector(centroid);
        const toRaw = rawFromVector(state.centroidTargets[index]);
        svg.append(svgElement("line", {
          x1:sx(fromRaw.angle), y1:sy(fromRaw.density),
          x2:sx(toRaw.angle), y2:sy(toRaw.density),
          class:`kmeans-pattern-centroid-move cluster-stroke-${index % 5}`
        }));
      });
    }

    map.append(svg);

    data.forEach((point, index) => {
      const cluster = assignments[index];
      const marker = document.createElement("div");
      marker.className = "kmeans-pattern-marker";
      if (cluster !== null && cluster !== undefined) marker.classList.add(`cluster-border-${cluster % 5}`);
      if (state?.pointIndex === index) marker.classList.add("is-active");
      marker.style.left = `${markerLeft(point.values.angle)}%`;
      marker.style.top = `${markerTop(point.values.density)}%`;
      marker.title = `Sample ${point.id} · ${patternSummary(point.values)}${cluster === null || cluster === undefined ? " · Unlabeled" : ` · Cluster ${cluster + 1}`}`;

      const tile = document.createElement("span");
      tile.className = "kmeans-pattern-marker-tile";
      applyPatternStyle(tile, point.values);
      const label = document.createElement("b");
      label.textContent = point.id;
      marker.append(tile, label);
      map.append(marker);
    });

    centroids.forEach((centroid, index) => {
      const raw = rawFromVector(centroid);
      const marker = document.createElement("div");
      marker.className = `kmeans-pattern-centroid cluster-border-${index % 5}`;
      marker.style.left = `${markerLeft(raw.angle)}%`;
      marker.style.top = `${markerTop(raw.density)}%`;
      marker.title = `Centroid ${index + 1} · ${patternSummary(raw)}`;
      const tile = document.createElement("span");
      applyPatternStyle(tile, raw);
      const label = document.createElement("strong");
      label.textContent = `C${index + 1}`;
      marker.append(tile, label);
      map.append(marker);
    });

    const testMarker = document.createElement("div");
    testMarker.className = "kmeans-pattern-test-marker";
    testMarker.style.left = `${markerLeft(testValues.angle)}%`;
    testMarker.style.top = `${markerTop(testValues.density)}%`;
    const testTile = document.createElement("span");
    applyPatternStyle(testTile, testValues);
    const testLabel = document.createElement("strong");
    testLabel.textContent = testAssignment ? `New → C${testAssignment.cluster + 1}` : "New";
    testMarker.append(testTile, testLabel);
    map.append(testMarker);

    map.addEventListener("click", (event) => {
      if (event.target.closest(".kmeans-pattern-marker, .kmeans-pattern-centroid, .kmeans-pattern-test-marker")) return;
      const rect = map.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * width;
      const y = ((event.clientY - rect.top) / rect.height) * height;
      if (x < pad.left || x > width-pad.right || y < pad.top || y > height-pad.bottom) return;

      testValues.angle = Math.round(clamp(angleFromX(x), 0, 180));
      testValues.density = Math.round(clamp(densityFromY(y), 10, 90));
      testAssignment = null;
      renderTestControls();
      if (finalState?.centroids?.length) assignTestSample();
      else renderVisualization(null);
    });

    const xLabel = document.createElement("div");
    xLabel.className = "kmeans-pattern-x-axis-label";
    xLabel.innerHTML = `<span>Orientation</span><strong>→</strong>`;
    column.append(map, xLabel);
    axisLayout.append(yLabel, column);

    const note = document.createElement("div");
    note.className = "kmeans-pattern-footer";
    note.innerHTML = `
      <div><strong>Click the map</strong><span> to move the new pattern by orientation and line density.</span></div>
      <div><span>Map:</span> Orientation × Density <span>Clustering:</span> all 4 normalized pattern features</div>
    `;

    shell.append(axisLayout, note);

    if (centroids.length) {
      const legend = document.createElement("div");
      legend.className = "kmeans-pattern-centroid-legend";
      centroids.forEach((centroid, index) => {
        const raw = rawFromVector(centroid);
        const card = document.createElement("div");
        card.className = `kmeans-pattern-centroid-card cluster-border-${index % 5}`;
        const tile = document.createElement("span");
        tile.className = "kmeans-pattern-centroid-card-tile";
        applyPatternStyle(tile, raw);
        const text = document.createElement("div");
        text.innerHTML = `<strong>C${index + 1}</strong><small>${patternSummary(raw)}</small>`;
        card.append(tile, text);
        legend.append(card);
      });
      shell.append(legend);
    }

    container.append(shell);
  }

  function renderNumericPlot(state = null) {
    const container = $("kmeans-plot");
    if (!container) return;
    container.replaceChildren();

    const width = 900;
    const height = 420;
    const pad = { left: 68, right: 28, top: 28, bottom: 58 };
    const sx = (value) => pad.left + (value / 100) * (width - pad.left - pad.right);
    const sy = (value) => height - pad.bottom - (value / 100) * (height - pad.top - pad.bottom);
    const assignments = state?.assignments ?? Array(data.length).fill(null);
    const centroids = state?.centroids ?? [];

    const svg = svgElement("svg", {
      viewBox: `0 0 ${width} ${height}`,
      class: "kmeans-svg",
      role: "img",
      "aria-label": "Interactive K-Means numeric cluster visualization"
    });

    for (let value = 0; value <= 100; value += 20) {
      const x = sx(value);
      const y = sy(value);
      svg.append(
        svgElement("line", { x1: x, x2: x, y1: pad.top, y2: height - pad.bottom, class: "kmeans-grid-line" }),
        svgElement("line", { x1: pad.left, x2: width - pad.right, y1: y, y2: y, class: "kmeans-grid-line" })
      );

      const xText = svgElement("text", { x, y: height - 28, "text-anchor": "middle", class: "kmeans-axis-tick" });
      xText.textContent = value;
      const yText = svgElement("text", { x: 50, y: y + 4, "text-anchor": "end", class: "kmeans-axis-tick" });
      yText.textContent = value;
      svg.append(xText, yText);
    }

    svg.append(
      svgElement("line", { x1: pad.left, x2: width - pad.right, y1: height - pad.bottom, y2: height - pad.bottom, class: "kmeans-axis" }),
      svgElement("line", { x1: pad.left, x2: pad.left, y1: pad.top, y2: height - pad.bottom, class: "kmeans-axis" })
    );

    if (state?.phase === "update" && state.centroidTargets) {
      state.centroids.forEach((centroid, index) => {
        const from = rawFromVector(centroid);
        const to = rawFromVector(state.centroidTargets[index]);
        svg.append(svgElement("line", {
          x1: sx(from.x), y1: sy(from.y), x2: sx(to.x), y2: sy(to.y), class: `kmeans-centroid-move cluster-stroke-${index % 5}`
        }));
        svg.append(svgElement("circle", {
          cx: sx(to.x), cy: sy(to.y), r: 8, class: `kmeans-centroid-target cluster-stroke-${index % 5}`
        }));
      });
    }

    data.forEach((point, index) => {
      const assignment = assignments[index];
      const circle = svgElement("circle", {
        cx: sx(point.values.x),
        cy: sy(point.values.y),
        r: state?.pointIndex === index ? 8.5 : 6.5,
        class: assignment === null || assignment === undefined
          ? `kmeans-point neutral ${state?.pointIndex === index ? "active-point" : ""}`
          : `kmeans-point cluster-${assignment % 5} ${state?.pointIndex === index ? "active-point" : ""}`
      });
      const title = svgElement("title");
      title.textContent = `Point ${point.id}: X ${point.values.x}, Y ${point.values.y}${assignment === null || assignment === undefined ? "" : `, Cluster ${assignment + 1}`}`;
      circle.append(title);
      svg.append(circle);
    });

    centroids.forEach((centroid, index) => {
      const raw = rawFromVector(centroid);
      const x = sx(raw.x);
      const y = sy(raw.y);
      const size = 10;
      svg.append(svgElement("polygon", {
        points: `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`,
        class: `kmeans-centroid-marker cluster-${index % 5}`
      }));
      const label = svgElement("text", { x: x + 13, y: y - 11, class: "kmeans-centroid-label" });
      label.textContent = `C${index + 1}`;
      svg.append(label);
    });

    if (finalState && testAssignment) {
      const testCircle = svgElement("circle", {
        cx: sx(testValues.x), cy: sy(testValues.y), r: 10, class: "kmeans-test-point"
      });
      const testLabel = svgElement("text", { x: sx(testValues.x) + 13, y: sy(testValues.y) - 10, class: "kmeans-test-point-label" });
      testLabel.textContent = `New → C${testAssignment.cluster + 1}`;
      svg.append(testCircle, testLabel);
    }

    const xLabel = svgElement("text", { x: width / 2, y: height - 8, "text-anchor": "middle", class: "kmeans-axis-label" });
    xLabel.textContent = "X";
    const yLabel = svgElement("text", {
      x: 17, y: height / 2, "text-anchor": "middle", class: "kmeans-axis-label", transform: `rotate(-90 17 ${height / 2})`
    });
    yLabel.textContent = "Y";
    svg.append(xLabel, yLabel);

    svg.addEventListener("click", (event) => {
      if (playing) return;
      const rect = svg.getBoundingClientRect();
      const viewX = ((event.clientX - rect.left) / rect.width) * width;
      const viewY = ((event.clientY - rect.top) / rect.height) * height;
      if (viewX < pad.left || viewX > width - pad.right || viewY < pad.top || viewY > height - pad.bottom) return;

      const x = round(clamp(((viewX - pad.left) / (width - pad.left - pad.right)) * 100, 0, 100));
      const y = round(clamp(((height - pad.bottom - viewY) / (height - pad.top - pad.bottom)) * 100, 0, 100));
      data.push({ id: data.length + 1, values: { x, y } });
      invalidateAlgorithm(`Point (${x}, ${y}) added from the graph. Run K-Means again.`);
    });

    container.append(svg);
  }

  function renderTableHeads() {
    const centroidHead = $("kmeans-centroid-head");
    const resultHead = $("kmeans-result-head");
    if (centroidHead) {
      centroidHead.innerHTML = `<tr><th>Centroid</th>${features().map((feature) => `<th>${feature.short}</th>`).join("")}<th>Samples</th></tr>`;
    }
    if (resultHead) {
      resultHead.innerHTML = `<tr><th>ID</th>${features().map((feature) => `<th>${feature.short}</th>`).join("")}<th>Cluster</th></tr>`;
    }
  }

  function renderCentroidTable(state) {
    const body = $("kmeans-centroid-body");
    if (!body) return;
    body.replaceChildren();
    renderTableHeads();

    if (!state?.centroids?.length) return;

    state.centroids.forEach((centroid, index) => {
      const raw = rawFromVector(centroid);
      const count = state.assignments?.filter((cluster) => cluster === index).length ?? 0;
      const tr = document.createElement("tr");

      const first = document.createElement("td");
      if (dataset().kind === "color") {
        first.innerHTML = `<span class="kmeans-table-swatch" style="background:${colorString(raw)}"></span><strong>C${index + 1}</strong>`;
      } else if (dataset().kind === "pattern") {
        const swatch = document.createElement("span");
        swatch.className = "kmeans-table-pattern-swatch";
        applyPatternStyle(swatch, raw);
        first.append(swatch, document.createTextNode(`C${index + 1}`));
      } else {
        first.innerHTML = `<span class="kmeans-cluster-dot cluster-${index % 5}"></span><strong>C${index + 1}</strong>`;
      }
      tr.append(first);

      features().forEach((feature) => {
        const td = document.createElement("td");
        td.textContent = formatRaw(raw[feature.key], feature);
        tr.append(td);
      });

      const countCell = document.createElement("td");
      countCell.textContent = count;
      tr.append(countCell);
      body.append(tr);
    });
  }

  function renderPointTable(state) {
    const body = $("kmeans-result-body");
    if (!body) return;
    body.replaceChildren();
    renderTableHeads();

    data.forEach((point, index) => {
      const cluster = state?.assignments?.[index];
      const tr = document.createElement("tr");
      if (state?.pointIndex === index) tr.classList.add("kmeans-current-row");

      const id = document.createElement("td");
      if (dataset().kind === "color") {
        id.innerHTML = `<span class="kmeans-table-swatch" style="background:${colorString(point.values)}"></span>${point.id}`;
      } else if (dataset().kind === "pattern") {
        const swatch = document.createElement("span");
        swatch.className = "kmeans-table-pattern-swatch";
        applyPatternStyle(swatch, point.values);
        id.append(swatch, document.createTextNode(point.id));
      } else {
        id.textContent = point.id;
      }
      tr.append(id);

      features().forEach((feature) => {
        const td = document.createElement("td");
        td.textContent = formatRaw(point.values[feature.key], feature);
        tr.append(td);
      });

      const clusterCell = document.createElement("td");
      clusterCell.textContent = cluster === null || cluster === undefined ? "—" : `Cluster ${cluster + 1}`;
      tr.append(clusterCell);
      body.append(tr);
    });
  }

  function renderMetrics(state) {
    const assignedCount = state?.assignments?.filter((value) => value !== null && value !== undefined).length ?? 0;
    $("kmeans-metric-iteration").textContent = state?.iteration ?? 0;
    $("kmeans-metric-assigned").textContent = `${assignedCount}/${data.length}`;
    $("kmeans-metric-inertia").textContent = Number.isFinite(state?.inertia) ? state.inertia.toFixed(3) : "—";
    $("kmeans-metric-movement").textContent = Number.isFinite(state?.movement) ? state.movement.toFixed(3) : "—";
    $("kmeans-data-count").textContent = `${data.length} sample${data.length === 1 ? "" : "s"}`;

    const summary = $("kmeans-cluster-summary");
    if (!summary) return;
    summary.replaceChildren();
    const k = Number.parseInt($("kmeans-k")?.value ?? "3", 10);

    for (let cluster = 0; cluster < k; cluster += 1) {
      const count = state?.assignments?.filter((value) => value === cluster).length ?? 0;
      const row = document.createElement("div");
      row.className = "kmeans-cluster-row";
      row.innerHTML = `<span class="kmeans-cluster-dot cluster-${cluster % 5}"></span><span>Cluster ${cluster + 1}</span><strong>${count}</strong>`;
      summary.append(row);
    }
  }

  function phaseLabel(phase) {
    return ({
      init: "Initialize centroids",
      assign: "Measure & assign",
      update: "Calculate means",
      moved: "Move centroids",
      converged: "Converged"
    })[phase] ?? "Ready";
  }

  function buildMathHtml(state) {
    if (!state) return `<p class="muted">Run K-Means to see calculations using the current dataset.</p>`;

    if (state.phase === "init") {
      return `<h4>Initialization</h4><p>K-Means begins with <strong>${state.centroids.length}</strong> centroids selected from well-spread samples.</p><p class="kmeans-formula">K = ${state.centroids.length}</p>`;
    }

    if (state.phase === "assign") {
      const point = data[state.pointIndex];
      const normalized = normalizeVector(point.values);
      const chosen = state.chosen;
      const centroid = state.centroids[chosen];
      const terms = normalized.map((value, index) => `(${value.toFixed(3)} − ${centroid[index].toFixed(3)})²`).join(" + ");
      return `
        <h4>Distance for Sample ${point.id}</h4>
        <p>Raw sample: <strong>${formatValues(point.values)}</strong></p>
        <p class="kmeans-formula">d = √[${terms}] = <strong>${state.distances[chosen].toFixed(3)}</strong></p>
        <p>The smallest distance is to <strong>Centroid ${chosen + 1}</strong>, so the sample joins Cluster ${chosen + 1}.</p>
      `;
    }

    if (state.phase === "update" && state.centroidTargets) {
      const cluster = 0;
      const members = data.filter((_, index) => state.assignments[index] === cluster);
      const targetRaw = rawFromVector(state.centroidTargets[cluster]);
      const featureSummary = features().map((feature) => `${feature.short}̄ = ${formatRaw(targetRaw[feature.key], feature)}`).join(" · ");
      return `
        <h4>Centroid Update</h4>
        <p>Cluster 1 currently contains <strong>${members.length}</strong> sample${members.length === 1 ? "" : "s"}.</p>
        <p class="kmeans-formula">c₁ = mean(samples in Cluster 1)</p>
        <p class="kmeans-formula">${featureSummary}</p>
      `;
    }

    if (state.phase === "moved") {
      return `<h4>Centroids Moved</h4><p>Maximum centroid movement: <strong>${state.movement.toFixed(3)}</strong></p><p>Current inertia: <strong>${state.inertia.toFixed(3)}</strong></p><p>K-Means repeats the assignment step using the new centroid positions.</p>`;
    }

    if (state.phase === "converged") {
      return `<h4>Clusters Stabilized</h4><p>K-Means converged after <strong>${state.iteration}</strong> iteration${state.iteration === 1 ? "" : "s"}.</p><p class="kmeans-formula">Final inertia = ${state.inertia.toFixed(3)}</p><p>You can now test a new sample against the learned centroids.</p>`;
    }

    return `<p class="muted">Continue the animation to see the next calculation.</p>`;
  }

  function updateProcess(state) {
    const order = ["init", "assign", "update", "moved", "converged"];
    const current = state ? order.indexOf(state.phase) : -1;
    document.querySelectorAll("[data-kmeans-process-step]").forEach((item, index) => {
      item.classList.toggle("active", index === current);
      item.classList.toggle("done", current > index || state?.phase === "converged");
    });
    if ($("kmeans-process-note")) $("kmeans-process-note").textContent = state?.message ?? "Run K-Means to follow the process step by step.";
  }

  function renderLiveExplanation(state) {
    if ($("kmeans-live-step")) {
      $("kmeans-live-step").innerHTML = `<span class="kmeans-live-kicker">${phaseLabel(state?.phase)}</span><strong>${state?.message ?? "Ready."}</strong>`;
    }
    const html = buildMathHtml(state);
    if ($("kmeans-live-math-mini")) $("kmeans-live-math-mini").innerHTML = html;
    if ($("kmeans-dynamic-math")) $("kmeans-dynamic-math").innerHTML = html;
    updateProcess(state);
  }

  function renderState(state) {
    renderVisualization(state);
    renderCentroidTable(state);
    renderPointTable(state);
    renderMetrics(state);
    renderLiveExplanation(state);

    if (state?.phase === "converged") {
      finalState = copyObject(state);
      testAssignment = null;
      renderTestResult();
    } else if (state?.phase !== "converged") {
      finalState = null;
      testAssignment = null;
      renderTestResult();
    }

    if ($("kmeans-progress")) {
      const denominator = Math.max(trace.length - 1, 1);
      $("kmeans-progress").value = (traceIndex / denominator) * 100;
    }
    if ($("kmeans-step-counter")) {
      $("kmeans-step-counter").textContent = trace.length ? `Step ${traceIndex + 1} of ${trace.length}` : "Ready";
    }
    updateRunButtons();
  }

  function renderEmptyState(message) {
    renderVisualization(null);
    renderCentroidTable(null);
    renderPointTable(null);
    renderMetrics(null);
    renderLiveExplanation(null);
    finalState = null;
    testAssignment = null;
    renderTestResult();

    if ($("kmeans-live-step")) {
      $("kmeans-live-step").innerHTML = `<span class="kmeans-live-kicker">Ready</span><strong>${message}</strong>`;
    }
    if ($("kmeans-progress")) $("kmeans-progress").value = 0;
    if ($("kmeans-step-counter")) $("kmeans-step-counter").textContent = "Ready";
    updateRunButtons();
  }

  function invalidateAlgorithm(message) {
    pause();
    trace = [];
    traceIndex = 0;
    finalState = null;
    testAssignment = null;
    renderEmptyState(message);
  }

  function init() {
    if (!$("kmeans-playground")) return;

    document.querySelectorAll("[data-kmeans-dataset]").forEach((button) => {
      button.addEventListener("click", () => setDataset(button.dataset.kmeansDataset));
    });

    $("kmeans-generate")?.addEventListener("click", generateData);
    $("kmeans-add-manual")?.addEventListener("click", addManualSample);
    $("kmeans-clear-data")?.addEventListener("click", clearData);
    $("kmeans-test-assign")?.addEventListener("click", assignTestSample);
    $("kmeans-instant")?.addEventListener("click", instant);
    $("kmeans-play")?.addEventListener("click", play);
    $("kmeans-pause")?.addEventListener("click", pause);
    $("kmeans-prev")?.addEventListener("click", previous);
    $("kmeans-next")?.addEventListener("click", next);
    $("kmeans-reset")?.addEventListener("click", resetAlgorithm);

    $("kmeans-speed")?.addEventListener("input", (event) => updateSpeed(event.target.value));

    $("kmeans-k")?.addEventListener("change", () => {
      invalidateAlgorithm(`K changed to ${$("kmeans-k").value}. Your current data was kept; run K-Means again.`);
    });

    $("kmeans-points")?.addEventListener("change", () => {
      if ($("kmeans-live-step")) {
        $("kmeans-live-step").innerHTML = `<span class="kmeans-live-kicker">Generator setting</span><strong>${$("kmeans-points").value} samples will be created the next time you choose Generate Example Data.</strong>`;
      }
    });

    $("kmeans-pattern")?.addEventListener("change", () => {
      if ($("kmeans-live-step")) {
        $("kmeans-live-step").innerHTML = `<span class="kmeans-live-kicker">Generator setting</span><strong>The example style will be applied the next time you choose Generate Example Data.</strong>`;
      }
    });

    updateSpeed($("kmeans-speed")?.value ?? 3);
    setDataset("colors");
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
