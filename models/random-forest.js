
"use strict";

/* ============================================
   AI PLAYGROUND — RANDOM FOREST
   Examples:
   1. Healthy vs Stressed Plant
   2. Plane vs Train Travel
============================================ */

const RandomForestModel = (() => {
  const root = document.getElementById("random-forest-playground");

  if (!root) {
    return { run() {}, reset() {} };
  }

  const $ = id => document.getElementById(id);

  const examples = {
    plant: {
      title: "Healthy vs Stressed Plant",
      classes: ["Healthy", "Stressed"],
      colors: ["#16a34a", "#ea580c"],
      features: [
        { name: "Soil moisture", unit: "%", min: 0, max: 100, step: 1 },
        { name: "Sunlight", unit: "hours/day", min: 0, max: 14, step: 0.5 },
        { name: "Leaf color", options: ["Green", "Yellow", "Brown"] },
        { name: "Temperature", unit: "°C", min: 0, max: 45, step: 1 }
      ],
      data: [
        [68, 7, 0, 23, 0],
        [55, 6, 0, 26, 0],
        [76, 8, 0, 21, 0],
        [48, 5, 0, 24, 0],
        [62, 9, 0, 28, 0],
        [57, 4, 0, 22, 0],
        [83, 6, 0, 19, 0],
        [45, 7, 0, 25, 0],
        [15, 9, 1, 35, 1],
        [22, 2, 1, 16, 1],
        [9, 11, 2, 39, 1],
        [31, 3, 1, 32, 1],
        [18, 6, 2, 28, 1],
        [34, 12, 1, 37, 1],
        [11, 4, 2, 18, 1],
        [25, 10, 1, 34, 1]
      ],
      query: [52, 6, 0, 25]
    },

    travel: {
      title: "Plane vs Train Travel",
      classes: ["Plane", "Train"],
      colors: ["#2563eb", "#8b5cf6"],
      features: [
        { name: "Distance", unit: "km", min: 50, max: 1800, step: 10 },
        { name: "Ticket price", unit: "€", min: 10, max: 350, step: 5 },
        { name: "Journey duration", unit: "hours", min: 1, max: 16, step: 0.5 },
        { name: "Transfers", unit: "", min: 0, max: 4, step: 1 }
      ],
      data: [
        [1200, 120, 2.5, 0, 0],
        [950, 90, 2, 0, 0],
        [1500, 170, 3, 0, 0],
        [1100, 85, 2.5, 1, 0],
        [1750, 210, 4, 0, 0],
        [800, 70, 2, 0, 0],
        [1400, 130, 3.5, 1, 0],
        [1050, 100, 2, 0, 0],
        [180, 25, 2, 0, 1],
        [350, 45, 3, 0, 1],
        [480, 55, 4, 0, 1],
        [650, 65, 5, 1, 1],
        [220, 35, 2.5, 0, 1],
        [540, 60, 4.5, 1, 1],
        [700, 75, 6, 1, 1],
        [320, 40, 3.5, 0, 1]
      ],
      query: [650, 80, 4, 0]
    }
  };

  let active = "plant";
  let rows = [];
  let query = [];
  let forest = [];
  let results = [];
  let step = 0;
  let timer = null;
  let seed = 21;

  const config = () => examples[active];

  const format = n =>
    Number(n).toLocaleString(undefined, {
      maximumFractionDigits: 2
    });

  const escapeHTML = value =>
    String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  function random() {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function shuffle(values) {
    const result = [...values];

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  /* ============================================
     RANDOM FOREST ALGORITHM
  ============================================ */

  function gini(data) {
    if (!data.length) return 0;

    const positive = data.filter(r => r.y === 1).length;
    const p = positive / data.length;

    return 1 - p * p - (1 - p) * (1 - p);
  }

  function majority(data) {
    const positive = data.filter(r => r.y === 1).length;
    return positive > data.length / 2 ? 1 : 0;
  }

  function buildTree(data, depth, maxDepth, featureCount) {
    const node = {
      count: data.length,
      prediction: majority(data),
      depth,
      leaf: true
    };

    if (
      depth >= maxDepth ||
      data.length < 4 ||
      gini(data) === 0
    ) {
      return node;
    }

    // Random subset of features at each split.
    const features = shuffle([0, 1, 2, 3])
      .slice(0, featureCount);

    let best = null;

    for (const feature of features) {
      const values = [...new Set(data.map(r => r.x[feature]))]
        .sort((a, b) => a - b);

      for (let i = 0; i < values.length - 1; i++) {
        const threshold = (values[i] + values[i + 1]) / 2;

        const left = data.filter(
          r => r.x[feature] <= threshold
        );

        const right = data.filter(
          r => r.x[feature] > threshold
        );

        if (!left.length || !right.length) continue;

        const impurity =
          (left.length * gini(left) +
            right.length * gini(right)) / data.length;

        if (!best || impurity < best.impurity) {
          best = {
            feature,
            threshold,
            left,
            right,
            impurity
          };
        }
      }
    }

    if (!best || best.impurity >= gini(data) - 1e-10) {
      return node;
    }

    node.leaf = false;
    node.feature = best.feature;
    node.threshold = best.threshold;

    node.left = buildTree(
      best.left, depth + 1, maxDepth, featureCount
    );

    node.right = buildTree(
      best.right, depth + 1, maxDepth, featureCount
    );

    return node;
  }

  function evaluateTree(tree, point) {
    const path = [];
    let node = tree;

    while (!node.leaf) {
      const value = point[node.feature];
      const goLeft = value <= node.threshold;

      path.push({
        feature: node.feature,
        value,
        threshold: node.threshold,
        direction: goLeft ? "Left" : "Right"
      });

      node = goLeft ? node.left : node.right;
    }

    return {
      prediction: node.prediction,
      path
    };
  }

  function growForest() {
    stopAnimation();

    seed = Math.floor(Number($("rf-seed").value)) || 21;

    const count = Number($("rf-tree-count").value);
    const depth = Number($("rf-depth").value);
    const featureCount = Number($("rf-feature-count").value);

    forest = [];

    for (let i = 0; i < count; i++) {
      // Bootstrap sampling with replacement.
      const sample = [];

      for (let j = 0; j < rows.length; j++) {
        sample.push(rows[Math.floor(random() * rows.length)]);
      }

      forest.push({
        number: i + 1,
        root: buildTree(sample, 0, depth, featureCount),
        sampleSize: sample.length,
        uniqueSamples: new Set(sample.map(r => r.id)).size
      });
    }

    predict();
  }

  function predict() {
    results = forest.map(tree => ({
      ...tree,
      ...evaluateTree(tree.root, query)
    }));

    step = 0;
    renderResults();
  }

  /* ============================================
     MAIN INTERFACE
  ============================================ */

  function buildInterface() {
    root.innerHTML = `
      <div class="rf-app">

        <div class="rf-hero">
          <span class="rf-eyebrow">AI MODEL PLAYGROUND</span>
          <h2>Random Forest</h2>
          <p>
            Explore how multiple decision trees learn from
            different samples and combine their votes
            to make a classification.
          </p>
        </div>

        <section class="rf-panel">
          <h3>1. Choose an example</h3>

          <div class="rf-examples">
            <button id="rf-plant" class="rf-example">
              <span class="rf-emoji">🌱</span>
              <strong>Healthy vs Stressed Plant</strong>
              <small>
                Moisture, sunlight, leaf color,
                and temperature
              </small>
            </button>

            <button id="rf-travel" class="rf-example">
              <span class="rf-emoji">✈️ 🚆</span>
              <strong>Plane vs Train</strong>
              <small>
                Distance, price, journey duration,
                and transfers
              </small>
            </button>
          </div>
        </section>

        <section class="rf-panel">
          <h3>2. Forest settings</h3>

          <div class="rf-settings">
            <label>
              Number of trees
              <select id="rf-tree-count">
                <option>3</option>
                <option selected>5</option>
                <option>7</option>
                <option>10</option>
              </select>
            </label>

            <label>
              Maximum tree depth
              <select id="rf-depth">
                <option>1</option>
                <option>2</option>
                <option selected>3</option>
                <option>4</option>
              </select>
            </label>

            <label>
              Features per split
              <select id="rf-feature-count">
                <option>1</option>
                <option selected>2</option>
                <option>3</option>
                <option>4</option>
              </select>
            </label>

            <label>
              Random seed
              <input
                id="rf-seed"
                type="number"
                value="21"
                min="1"
              >
            </label>
          </div>

          <div class="rf-actions">
            <button id="rf-run" class="rf-primary">
              Regrow forest
            </button>
            <button id="rf-reset">Reset example</button>
          </div>
        </section>

        <section class="rf-panel">
          <h3>3. Training data</h3>

          <p>
            Change feature values or class labels.
            The forest will rebuild automatically.
          </p>

          <div class="rf-table-wrap">
            <table id="rf-table"></table>
          </div>

          <div class="rf-actions">
            <button id="rf-add">+ Add sample</button>
            <button id="rf-random">Randomize samples</button>
          </div>

          <p id="rf-message" class="rf-note"></p>
        </section>

        <section class="rf-panel">
          <h3>4. Classify a new example</h3>

          <h4 id="rf-example-title"></h4>

          <div id="rf-query-controls" class="rf-query"></div>

          <div class="rf-result">
            <div>
              <small>Forest prediction</small>
              <div id="rf-prediction" class="rf-prediction">
                —
              </div>
              <small id="rf-confidence"></small>
            </div>

            <div class="rf-votes">
              <div class="rf-vote-label">
                <span id="rf-label-a"></span>
                <strong id="rf-a-votes">0</strong>
              </div>
              <div class="rf-track">
                <div id="rf-bar-a"></div>
              </div>

              <div class="rf-vote-label">
                <span id="rf-label-b"></span>
                <strong id="rf-b-votes">0</strong>
              </div>
              <div class="rf-track">
                <div id="rf-bar-b"></div>
              </div>
            </div>
          </div>
        </section>

        <section class="rf-panel">
          <h3>5. Watch the trees vote</h3>

          <p>
            Each tree learns from a random bootstrap
            sample. Watch its decision path and see
            how the majority vote develops.
          </p>

          <div class="rf-actions">
            <button id="rf-play" class="rf-primary">
              ▶ Play animation
            </button>
            <button id="rf-prev">← Previous</button>
            <button id="rf-next">Next →</button>
            <button id="rf-replay">Replay</button>

            <label class="rf-speed">
              Speed
              <select id="rf-speed">
                <option value="1400">Slow</option>
                <option value="800" selected>Normal</option>
                <option value="350">Fast</option>
              </select>
            </label>
          </div>

          <progress id="rf-progress" value="0" max="5">
          </progress>

          <p id="rf-step-label" aria-live="polite"></p>

          <div id="rf-tree-output" class="rf-tree-grid"></div>
        </section>

        <section class="rf-panel">
          <h3>6. Live mathematics</h3>

          <pre id="rf-math" class="rf-math"></pre>

          <p class="rf-note">
            Educational Random Forest using bootstrap
            sampling, randomized feature selection,
            Gini impurity, and majority voting.
            All training examples are fictional.
            Vote share is not a calibrated probability.
          </p>
        </section>

      </div>
    `;
  }

  /* ============================================
     TRAINING DATA TABLE
  ============================================ */

  function renderTable() {
    const c = config();

    $("rf-table").innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          ${c.features.map(f =>
            `<th>${escapeHTML(f.name)}</th>`
          ).join("")}
          <th>Class</th>
          <th></th>
        </tr>
      </thead>

      <tbody>
        ${rows.map((r, i) => `
          <tr>
            <td>${i + 1}</td>

            ${c.features.map((f, j) => `
              <td>
                ${f.options
                  ? `<select data-row="${i}" data-col="${j}">
                      ${f.options.map((v, k) => `
                        <option value="${k}"
                          ${r.x[j] === k ? "selected" : ""}>
                          ${escapeHTML(v)}
                        </option>
                      `).join("")}
                    </select>`
                  : `<input
                      type="number"
                      data-row="${i}"
                      data-col="${j}"
                      min="${f.min}"
                      max="${f.max}"
                      step="${f.step}"
                      value="${r.x[j]}"
                    >`
                }
              </td>
            `).join("")}

            <td>
              <select data-row="${i}" data-label="1">
                ${c.classes.map((name, k) => `
                  <option value="${k}"
                    ${r.y === k ? "selected" : ""}>
                    ${escapeHTML(name)}
                  </option>
                `).join("")}
              </select>
            </td>

            <td>
              <button class="rf-remove"
                data-remove="${i}"
                aria-label="Remove row ${i + 1}">
                ×
              </button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    `;

    $("rf-table").querySelectorAll("[data-col]")
      .forEach(input => {
        input.addEventListener("change", () => {
          const i = Number(input.dataset.row);
          const j = Number(input.dataset.col);
          const feature = c.features[j];
          let value = Number(input.value);

          if (!Number.isFinite(value)) {
            renderTable();
            return;
          }

          if (feature.options) {
            value = Math.round(value);
            value = Math.max(
              0,
              Math.min(feature.options.length - 1, value)
            );
          } else {
            value = Math.max(
              feature.min,
              Math.min(feature.max, value)
            );
          }

          rows[i].x[j] = value;

          growForest();
          renderTable();
        });
      });

    $("rf-table").querySelectorAll("[data-label]")
      .forEach(input => {
        input.addEventListener("change", () => {
          rows[Number(input.dataset.row)].y =
            Number(input.value);

          growForest();
        });
      });

    $("rf-table").querySelectorAll("[data-remove]")
      .forEach(button => {
        button.addEventListener("click", () => {
          if (rows.length <= 4) {
            $("rf-message").textContent =
              "Keep at least four training examples.";
            return;
          }

          rows.splice(Number(button.dataset.remove), 1);

          growForest();
          renderTable();
        });
      });
  }

  function addSample() {
    const c = config();

    const x = c.features.map(f =>
      f.options
        ? 0
        : Number(((f.min + f.max) / 2).toFixed(2))
    );

    rows.push({
      id: Date.now() + Math.random(),
      x,
      y: 0
    });

    growForest();
    renderTable();
  }

  function randomizeSamples() {
    const c = config();

    rows.forEach(row => {
      row.x = row.x.map((value, i) => {
        const f = c.features[i];

        if (f.options) {
          return Math.floor(Math.random() * f.options.length);
        }

        const variation = (f.max - f.min) * 0.12;
        const next = value + (Math.random() - 0.5) * variation;

        return Number(
          Math.max(f.min, Math.min(f.max, next))
            .toFixed(f.step < 1 ? 1 : 0)
        );
      });
    });

    growForest();
    renderTable();
  }

  /* ============================================
     QUERY CONTROLS
  ============================================ */

  function renderQueryControls() {
    const c = config();

    $("rf-example-title").textContent = c.title;

    $("rf-query-controls").innerHTML =
      c.features.map((f, i) => `
        <div class="rf-field">
          <label>
            ${escapeHTML(f.name)}
            <strong id="rf-value-${i}">
              ${f.options
                ? escapeHTML(f.options[query[i]])
                : format(query[i]) + " " + escapeHTML(f.unit)}
            </strong>
          </label>

          ${f.options
            ? `<select id="rf-query-${i}">
                ${f.options.map((name, k) => `
                  <option value="${k}"
                    ${query[i] === k ? "selected" : ""}>
                    ${escapeHTML(name)}
                  </option>
                `).join("")}
              </select>`
            : `<input
                id="rf-query-${i}"
                type="range"
                min="${f.min}"
                max="${f.max}"
                step="${f.step}"
                value="${query[i]}"
              >`
          }
        </div>
      `).join("");

    c.features.forEach((f, i) => {
      $("rf-query-" + i).addEventListener("input", event => {
        query[i] = Number(event.target.value);

        $("rf-value-" + i).textContent =
          f.options
            ? f.options[query[i]]
            : format(query[i]) + " " + f.unit;

        stopAnimation();
        predict();
      });
    });
  }

  /* ============================================
     TREE VISUALIZATION
  ============================================ */

  function treeDiagram(node) {
    const c = config();

    if (node.leaf) {
      return `
        <div class="rf-leaf"
          style="border-color:${c.colors[node.prediction]}">
          ${escapeHTML(c.classes[node.prediction])}
        </div>
      `;
    }

    const f = c.features[node.feature];

    return `
      <div class="rf-tree-rule">
        ${escapeHTML(f.name)}
        ≤ ${format(node.threshold)}?
      </div>

      <div class="rf-branches">
        <div class="rf-branch">
          <span>YES</span>
          ${node.left.leaf
            ? treeDiagram(node.left)
            : `<div class="rf-leaf rf-nested">
                ${escapeHTML(c.classes[node.left.prediction])}
              </div>`
          }
        </div>

        <div class="rf-branch">
          <span>NO</span>
          ${node.right.leaf
            ? treeDiagram(node.right)
            : `<div class="rf-leaf rf-nested">
                ${escapeHTML(c.classes[node.right.prediction])}
              </div>`
          }
        </div>
      </div>
    `;
  }

  function decisionPath(result) {
    const c = config();

    if (!result.path.length) {
      return "Leaf node — no split required";
    }

    return result.path.map(p => {
      const name = c.features[p.feature].name;
      const sign = p.direction === "Left" ? "≤" : ">";

      return `${name}: ${format(p.value)} ${sign} ${format(p.threshold)}`;
    }).join(" → ");
  }

  /* ============================================
     VOTES AND PREDICTION
  ============================================ */

  function renderResults() {
    const c = config();

    const visible = step === 0
      ? results.length
      : Math.min(results.length, step - 1);

    const shown = results.slice(0, visible);

    const votes = [
      shown.filter(r => r.prediction === 0).length,
      shown.filter(r => r.prediction === 1).length
    ];

    const finished = visible === results.length && visible > 0;

    const winner = votes[1] > votes[0] ? 1 : 0;

    $("rf-label-a").textContent = c.classes[0];
    $("rf-label-b").textContent = c.classes[1];

    $("rf-a-votes").textContent = votes[0];
    $("rf-b-votes").textContent = votes[1];

    $("rf-bar-a").style.width =
      (visible ? votes[0] / visible * 100 : 0) + "%";

    $("rf-bar-b").style.width =
      (visible ? votes[1] / visible * 100 : 0) + "%";

    $("rf-bar-a").style.background = c.colors[0];
    $("rf-bar-b").style.background = c.colors[1];

    $("rf-prediction").textContent =
      finished ? c.classes[winner] : "Counting votes…";

    $("rf-prediction").style.color =
      finished ? c.colors[winner] : "#334155";

    $("rf-confidence").textContent = finished
      ? `${format(Math.max(...votes) / results.length * 100)}% of tree votes`
      : "Each tree casts one vote.";

    $("rf-tree-output").innerHTML =
      results.map((r, i) => `
        <article class="rf-tree-card
          ${i < visible ? "rf-active" : "rf-inactive"}">

          <div class="rf-tree-header">
            <strong>Tree ${r.number}</strong>
            <span class="rf-class-pill"
              style="color:${c.colors[r.prediction]};
                     border-color:${c.colors[r.prediction]}">
              ${escapeHTML(c.classes[r.prediction])}
            </span>
          </div>

          <div class="rf-tree-diagram">
            ${treeDiagram(r.root)}
          </div>

          <p class="rf-path">
            <strong>Decision path:</strong>
            ${escapeHTML(decisionPath(r))}
          </p>

          <small>
            Bootstrap: ${r.sampleSize} draws,
            ${r.uniqueSamples} distinct samples
          </small>
        </article>
      `).join("");

    $("rf-progress").max = results.length + 1;
    $("rf-progress").value =
      step === 0 ? results.length + 1 : step;

    $("rf-step-label").textContent =
      step === 0
        ? "All trees evaluated"
        : step === 1
          ? "Forest trained. Ready to collect votes."
          : `Tree ${Math.min(step - 1, results.length)}
             of ${results.length} has voted.`;

    $("rf-math").textContent = [
      `Number of trees: ${results.length}`,
      `Maximum depth: ${$("rf-depth").value}`,
      `Features considered per split: ${$("rf-feature-count").value}`,
      "",
      "Gini impurity:",
      "Gini = 1 - p(A)² - p(B)²",
      "",
      "Split quality:",
      "Weighted Gini = (nL / n) × Gini(L)",
      "              + (nR / n) × Gini(R)",
      "",
      "Majority voting:",
      `Votes for ${c.classes[0]} = ${votes[0]}`,
      `Votes for ${c.classes[1]} = ${votes[1]}`,
      "",
      "Prediction = class with most votes",
      finished
        ? `Final prediction = ${c.classes[winner]}`
        : "Final prediction = waiting for all votes"
    ].join("\n");
  }

  /* ============================================
     STEP-BY-STEP ANIMATION
  ============================================ */

  function stopAnimation() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }

    const button = $("rf-play");

    if (button) button.textContent = "▶ Play animation";
  }

  function nextStep() {
    if (step === 0) step = 1;

    if (step < results.length + 1) {
      step++;
      renderResults();
    } else {
      stopAnimation();
    }
  }

  function playAnimation() {
    if (timer !== null) {
      stopAnimation();
      return;
    }

    if (step === 0 || step >= results.length + 1) {
      step = 1;
    }

    renderResults();

    $("rf-play").textContent = "⏸ Pause";

    timer = setInterval(() => {
      nextStep();
    }, Number($("rf-speed").value));
  }

  /* ============================================
     EXAMPLE SELECTION
  ============================================ */

  function reset(example = active) {
    stopAnimation();

    active = example;

    const c = config();

    rows = c.data.map((r, i) => ({
      id: i + 1,
      x: r.slice(0, 4),
      y: r[4]
    }));

    query = [...c.query];

    $("rf-plant").classList.toggle(
      "rf-selected", active === "plant"
    );

    $("rf-travel").classList.toggle(
      "rf-selected", active === "travel"
    );

    $("rf-tree-count").value = "5";
    $("rf-depth").value = "3";
    $("rf-feature-count").value = "2";
    $("rf-seed").value = "21";

    $("rf-message").textContent = "";

    renderTable();
    renderQueryControls();
    growForest();
  }

  /* ============================================
     STYLING
  ============================================ */

  function injectStyles() {
    if ($("rf-styles")) return;

    const style = document.createElement("style");
    style.id = "rf-styles";

    style.textContent = `
      #random-forest-playground {
        font-family: inherit;
        color: #1e293b;
      }

      #random-forest-playground * {
        box-sizing: border-box;
      }

      .rf-app {
        max-width: 1180px;
        margin: 0 auto;
      }

      .rf-hero {
        background: linear-gradient(120deg, #17355b, #326a80);
        color: white;
        padding: 28px;
        border-radius: 20px;
        margin-bottom: 22px;
      }

      .rf-eyebrow {
        font-size: 12px;
        letter-spacing: 2px;
        font-weight: 800;
        opacity: .85;
      }

      .rf-hero h2 {
        color: white;
        font-size: 32px;
        margin: 8px 0;
      }

      .rf-hero p {
        color: #e5f3fa;
        max-width: 750px;
        line-height: 1.6;
        margin: 0;
      }

      .rf-panel {
        background: white;
        border: 1px solid #dce4ec;
        border-radius: 18px;
        padding: 22px;
        margin-bottom: 20px;
        box-shadow: 0 5px 20px rgba(20, 50, 80, .04);
      }

      .rf-panel h3 {
        color: #17355b;
        margin: 0 0 14px;
        font-size: 19px;
      }

      .rf-panel p {
        line-height: 1.6;
      }

      .rf-app button,
      .rf-app input,
      .rf-app select {
        font: inherit;
      }

      .rf-app button {
        cursor: pointer;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        background: #f8fafc;
        color: #18324c;
        padding: 10px 14px;
        font-weight: 650;
      }

      .rf-app button:hover {
        background: #e9f2fb;
      }

      .rf-app button:focus-visible,
      .rf-app input:focus-visible,
      .rf-app select:focus-visible {
        outline: 3px solid #82c9ff;
        outline-offset: 2px;
      }

      .rf-app .rf-primary {
        background: #1c5e91;
        color: white;
        border-color: #1c5e91;
      }

      .rf-app .rf-primary:hover {
        background: #174c75;
      }

      .rf-examples {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .rf-example {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        text-align: left;
        min-height: 140px;
        padding: 18px !important;
        border: 2px solid #dbe5ef !important;
      }

      .rf-example.rf-selected {
        background: #eaf5ff !important;
        border-color: #2381bf !important;
      }

      .rf-emoji {
        font-size: 30px;
      }

      .rf-example small {
        color: #64748b;
        font-size: 13px;
      }

      .rf-settings {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .rf-settings label {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-weight: 650;
        font-size: 14px;
      }

      .rf-app select,
      .rf-app input[type="number"] {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: white;
        padding: 9px;
        width: 100%;
        min-width: 0;
      }

      .rf-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }

      .rf-table-wrap {
        overflow-x: auto;
      }

      .rf-app table {
        width: 100%;
        min-width: 680px;
        border-collapse: collapse;
        font-size: 13px;
      }

      .rf-app th,
      .rf-app td {
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 6px;
        text-align: left;
      }

      .rf-app th {
        background: #f1f5f9;
      }

      .rf-app td input {
        max-width: 110px;
      }

      .rf-app td select {
        max-width: 150px;
      }

      .rf-app .rf-remove {
        padding: 5px 10px;
        color: #b91c1c;
      }

      .rf-note {
        color: #64748b;
        font-size: 13px;
      }

      .rf-query {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 15px;
      }

      .rf-field {
        padding: 16px;
        background: #f6f9fc;
        border-radius: 12px;
      }

      .rf-field label {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 12px;
        font-size: 14px;
      }

      .rf-field input[type="range"] {
        width: 100%;
        accent-color: #246ca2;
      }

      .rf-result {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: center;
        margin-top: 20px;
        padding: 20px;
        border-radius: 14px;
        background: #f5f9fd;
      }

      .rf-prediction {
        font-size: 29px;
        font-weight: 800;
        margin: 8px 0;
      }

      .rf-vote-label {
        display: flex;
        justify-content: space-between;
        margin: 8px 0;
        font-size: 14px;
      }

      .rf-track {
        height: 12px;
        border-radius: 20px;
        background: #e2e8f0;
        overflow: hidden;
      }

      .rf-track div {
        height: 100%;
        transition: width .3s ease;
      }

      .rf-speed {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .rf-app progress {
        display: block;
        width: 100%;
        height: 12px;
        margin-top: 20px;
        accent-color: #2475a8;
      }

      .rf-tree-grid {
        display: grid;
        grid-template-columns: repeat(
          auto-fit,
          minmax(235px, 1fr)
        );
        gap: 14px;
        margin-top: 18px;
      }

      .rf-tree-card {
        border: 1px solid #d7e1eb;
        border-radius: 14px;
        padding: 15px;
        background: white;
        transition: opacity .25s ease;
      }

      .rf-tree-card.rf-inactive {
        opacity: .35;
      }

      .rf-tree-card.rf-active {
        border-color: #56a0d5;
        background: #f6fbff;
      }

      .rf-tree-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .rf-class-pill {
        border: 1px solid;
        border-radius: 20px;
        padding: 4px 9px;
        font-size: 12px;
        font-weight: 700;
      }

      .rf-tree-diagram {
        margin-top: 18px;
        padding: 12px;
        background: #f8fafc;
        border-radius: 12px;
        text-align: center;
      }

      .rf-tree-rule {
        display: inline-block;
        background: #dbeafe;
        color: #1e40af;
        border: 1px solid #93c5fd;
        padding: 8px 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
      }

      .rf-branches {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 12px;
      }

      .rf-branch {
        min-width: 0;
      }

      .rf-branch > span {
        display: block;
        color: #64748b;
        font-size: 11px;
        margin-bottom: 7px;
      }

      .rf-leaf {
        border: 1px solid;
        border-radius: 8px;
        padding: 8px 4px;
        background: white;
        font-size: 12px;
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .rf-nested {
        border-color: #cbd5e1;
      }

      .rf-path {
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .rf-tree-card small {
        color: #64748b;
        font-size: 11px;
      }

      .rf-math {
        white-space: pre-wrap;
        background: #122a43;
        color: #e9f4ff;
        border-radius: 12px;
        padding: 20px;
        font-size: 13px;
        line-height: 1.8;
        overflow: auto;
      }

      @media (max-width: 700px) {
        .rf-settings {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .rf-result {
          grid-template-columns: 1fr;
        }

        .rf-panel {
          padding: 15px;
        }

        .rf-hero h2 {
          font-size: 25px;
        }
      }

      @media (max-width: 480px) {
        .rf-examples,
        .rf-query {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ============================================
     EVENTS AND INITIALIZATION
  ============================================ */

  function bindEvents() {
    $("rf-plant").addEventListener(
      "click", () => reset("plant")
    );

    $("rf-travel").addEventListener(
      "click", () => reset("travel")
    );

    $("rf-run").addEventListener("click", growForest);

    $("rf-reset").addEventListener(
      "click", () => reset()
    );

    $("rf-add").addEventListener("click", addSample);

    $("rf-random").addEventListener(
      "click", randomizeSamples
    );

    [
      "rf-tree-count",
      "rf-depth",
      "rf-feature-count",
      "rf-seed"
    ].forEach(id => {
      $(id).addEventListener("change", growForest);
    });

    $("rf-play").addEventListener(
      "click", playAnimation
    );

    $("rf-prev").addEventListener("click", () => {
      stopAnimation();

      if (step === 0) step = results.length + 1;

      step = Math.max(1, step - 1);
      renderResults();
    });

    $("rf-next").addEventListener("click", () => {
      stopAnimation();
      nextStep();
    });

    $("rf-replay").addEventListener("click", () => {
      stopAnimation();
      step = 1;
      renderResults();
      playAnimation();
    });
  }

  buildInterface();
  injectStyles();
  bindEvents();
  reset();

  return {
    run: growForest,
    reset: () => reset()
  };
})();
