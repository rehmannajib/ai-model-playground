"use strict";

/* =========================================================
   COMPLETE LOGISTIC REGRESSION PLAYGROUND
   Examples:
   1. Student Pass / Fail: Marks + Attendance
   2. Vehicle Purchase: Income + Vehicle Price
   3. Diabetes Classification (synthetic educational example):
      HbA1c + Age + Weight

   IMPORTANT:
   The diabetes example uses synthetic data for teaching only.
   It is not a diagnostic tool and must not be used for medical decisions.
   ========================================================= */

const LogisticRegressionModel = (() => {
  const $ = (id) => document.getElementById(id);
  const SVG_NS = "http://www.w3.org/2000/svg";

  const DATASETS = {
    student: {
      icon: "🎓",
      title: "Student Pass / Fail",
      subtitle: "Marks + Attendance → probability of passing",
      description:
        "A student can attend every class and still fail if the marks are too low. Likewise, strong marks may not be enough when attendance is extremely low. This synthetic example lets Logistic Regression learn from both features.",
      features: [
        { key: "marks", label: "Marks", unit: "%", min: 30, max: 100, step: 1 },
        { key: "attendance", label: "Attendance", unit: "%", min: 30, max: 100, step: 1 }
      ],
      plotAxes: [0, 1],
      class0: { label: "Fail", icon: "✕" },
      class1: { label: "Pass", icon: "✓" },
      query: [60, 80],
      data: [
        { id: 1, values: [35, 95], label: 0 },
        { id: 2, values: [42, 88], label: 0 },
        { id: 3, values: [50, 70], label: 0 },
        { id: 4, values: [58, 55], label: 0 },
        { id: 5, values: [65, 45], label: 0 },
        { id: 6, values: [82, 35], label: 0 },
        { id: 7, values: [55, 92], label: 1 },
        { id: 8, values: [62, 85], label: 1 },
        { id: 9, values: [68, 78], label: 1 },
        { id: 10, values: [74, 72], label: 1 },
        { id: 11, values: [82, 68], label: 1 },
        { id: 12, values: [90, 60], label: 1 }
      ],
      generator() {
        const rows = [];
        for (let i = 0; i < 16; i++) {
          const marks = Math.round(32 + Math.random() * 66);
          const attendance = Math.round(32 + Math.random() * 66);
          const score =
            -8.2 +
            0.075 * marks +
            0.070 * attendance +
            randn() * 0.75;

          rows.push({
            id: i + 1,
            values: [marks, attendance],
            label: score >= 0 ? 1 : 0
          });
        }
        return rows;
      },
      note:
        "Synthetic educational data. It does not represent an actual school grading policy."
    },

    vehicle: {
      icon: "🚗",
      title: "Vehicle Purchase Decision",
      subtitle: "Monthly Income + Vehicle Price → probability of purchase",
      description:
        "Explore how a purchase probability changes with income and vehicle price. The purpose is to demonstrate binary classification, not real consumer behaviour.",
      features: [
        { key: "income", label: "Monthly Income", unit: "k", min: 2, max: 15, step: 0.5 },
        { key: "price", label: "Vehicle Price", unit: "k", min: 8, max: 65, step: 1 }
      ],
      plotAxes: [0, 1],
      class0: { label: "Not Buy", icon: "✕" },
      class1: { label: "Buy", icon: "✓" },
      query: [8, 32],
      data: [
        { id: 1, values: [3.0, 35], label: 0 },
        { id: 2, values: [4.0, 42], label: 0 },
        { id: 3, values: [5.0, 48], label: 0 },
        { id: 4, values: [5.5, 31], label: 0 },
        { id: 5, values: [6.5, 39], label: 0 },
        { id: 6, values: [7.0, 27], label: 1 },
        { id: 7, values: [8.0, 30], label: 1 },
        { id: 8, values: [9.0, 34], label: 1 },
        { id: 9, values: [10.0, 38], label: 1 },
        { id: 10, values: [11.5, 43], label: 1 },
        { id: 11, values: [12.5, 50], label: 1 },
        { id: 12, values: [14.0, 54], label: 1 }
      ],
      generator() {
        const rows = [];
        for (let i = 0; i < 16; i++) {
          const income = roundTo(2.5 + Math.random() * 12, 0.5);
          const price = Math.round(10 + Math.random() * 52);
          const score =
            -1.4 +
            0.85 * income -
            0.105 * price +
            randn() * 0.75;

          rows.push({
            id: i + 1,
            values: [income, price],
            label: score >= 0 ? 1 : 0
          });
        }
        return rows;
      },
      note:
        "Synthetic educational data. It does not represent real purchasing behaviour."
    },

    diabetes: {
      icon: "🩺",
      title: "Diabetes Classification",
      subtitle: "HbA1c + Age + Weight → illustrative probability",
      description:
        "This is a synthetic educational classifier showing how Logistic Regression can combine three numerical features. The output is only a model demonstration and is not a medical diagnosis.",
      features: [
        { key: "hba1c", label: "HbA1c", unit: "%", min: 4.0, max: 9.5, step: 0.1 },
        { key: "age", label: "Age", unit: "years", min: 20, max: 75, step: 1 },
        { key: "weight", label: "Weight", unit: "kg", min: 50, max: 120, step: 1 }
      ],
      /* Plot HbA1c against Weight. Age is held at the new-sample value
         while drawing the probability-map slice. */
      plotAxes: [0, 2],
      class0: { label: "No Diabetes", icon: "○" },
      class1: { label: "Diabetes", icon: "●" },
      query: [5.9, 48, 82],
      data: [
        { id: 1, values: [4.7, 25, 60], label: 0 },
        { id: 2, values: [5.0, 32, 68], label: 0 },
        { id: 3, values: [5.2, 40, 72], label: 0 },
        { id: 4, values: [5.4, 51, 78], label: 0 },
        { id: 5, values: [5.6, 58, 84], label: 0 },
        { id: 6, values: [5.9, 43, 88], label: 0 },
        { id: 7, values: [6.0, 64, 96], label: 1 },
        { id: 8, values: [6.3, 47, 91], label: 1 },
        { id: 9, values: [6.6, 53, 98], label: 1 },
        { id: 10, values: [7.0, 38, 103], label: 1 },
        { id: 11, values: [7.5, 61, 108], label: 1 },
        { id: 12, values: [8.2, 69, 112], label: 1 },
        { id: 13, values: [5.8, 31, 71], label: 0 },
        { id: 14, values: [6.4, 34, 76], label: 1 }
      ],
      generator() {
        const rows = [];
        for (let i = 0; i < 18; i++) {
          const hba1c = roundTo(4.3 + Math.random() * 4.7, 0.1);
          const age = Math.round(22 + Math.random() * 51);
          const weight = Math.round(52 + Math.random() * 66);

          /* Synthetic relationship for visualization only.
             These are NOT diagnostic thresholds. */
          const score =
            -2.2 +
            1.05 * (hba1c - 5.8) +
            0.025 * (age - 45) +
            0.028 * (weight - 80) +
            randn() * 0.65;

          rows.push({
            id: i + 1,
            values: [hba1c, age, weight],
            label: score >= 0 ? 1 : 0
          });
        }
        return rows;
      },
      note:
        "Synthetic educational data only. The Diabetes / No Diabetes label is a model demonstration, not a medical diagnosis or screening result."
    }
  };

  let currentKey = "student";
  let data = cloneRows(DATASETS[currentKey].data);
  let query = [...DATASETS[currentKey].query];
  let scaler = null;
  let weights = [];
  let fitted = false;
  let lastMetrics = null;

  let animationHistory = [];
  let animationIndex = 0;
  let timer = null;

  /* =========================================================
     HELPERS
     ========================================================= */

  function config() {
    return DATASETS[currentKey];
  }

  function featureCount() {
    return config().features.length;
  }

  function zeroWeights() {
    return Array(featureCount() + 1).fill(0);
  }

  function cloneRows(rows) {
    return rows.map((row) => ({
      id: row.id,
      values: [...row.values],
      label: row.label
    }));
  }

  function randn() {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function roundTo(value, step) {
    return Math.round(value / step) * step;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function std(values, avg) {
    const variance =
      values.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
      Math.max(1, values.length);
    return Math.sqrt(variance) || 1;
  }

  function sigmoid(z) {
    if (z >= 0) {
      const e = Math.exp(-z);
      return 1 / (1 + e);
    }
    const e = Math.exp(z);
    return e / (1 + e);
  }

  function safeLogit(probability) {
    const p = clamp(probability, 0.001, 0.999);
    return Math.log(p / (1 - p));
  }

  function computeScaler(rows = data) {
    const means = [];
    const stds = [];

    for (let j = 0; j < featureCount(); j++) {
      const values = rows.map((row) => row.values[j]);
      const avg = mean(values);
      means.push(avg);
      stds.push(std(values, avg));
    }

    return { means, stds };
  }

  function standardize(values, currentScaler = scaler) {
    return values.map(
      (value, j) =>
        (value - currentScaler.means[j]) / currentScaler.stds[j]
    );
  }

  function predict(values, currentWeights = weights, currentScaler = scaler) {
    const x = standardize(values, currentScaler);
    let z = currentWeights[0];

    for (let j = 0; j < x.length; j++) {
      z += currentWeights[j + 1] * x[j];
    }

    return {
      standardized: x,
      z,
      probability: sigmoid(z)
    };
  }

  function thresholdValue() {
    return clamp(
      Number.parseFloat($("log-threshold")?.value ?? 0.5),
      0.2,
      0.8
    );
  }

  function learningRateValue() {
    return clamp(
      Number.parseFloat($("log-learning-rate")?.value ?? 0.16),
      0.01,
      0.5
    );
  }

  function animationStepsValue() {
    return clamp(
      Number.parseInt($("log-animation-steps")?.value ?? 90, 10),
      20,
      220
    );
  }

  function classText(label) {
    const c = config();
    return label === 1
      ? `${c.class1.icon} ${c.class1.label}`
      : `${c.class0.icon} ${c.class0.label}`;
  }

  function formatFeature(value, feature) {
    const decimals = feature.step < 1 ? 1 : 0;
    return `${Number(value).toFixed(decimals)} ${feature.unit}`;
  }

  function metricsFor(currentWeights = weights, currentScaler = scaler) {
    const threshold = thresholdValue();

    let tp = 0;
    let tn = 0;
    let fp = 0;
    let fn = 0;
    let loss = 0;

    const predictions = data.map((row) => {
      const result = predict(row.values, currentWeights, currentScaler);
      const predicted = result.probability >= threshold ? 1 : 0;
      const p = clamp(result.probability, 1e-9, 1 - 1e-9);

      loss +=
        -(
          row.label * Math.log(p) +
          (1 - row.label) * Math.log(1 - p)
        );

      if (row.label === 1 && predicted === 1) tp += 1;
      if (row.label === 0 && predicted === 0) tn += 1;
      if (row.label === 0 && predicted === 1) fp += 1;
      if (row.label === 1 && predicted === 0) fn += 1;

      return {
        ...row,
        z: result.z,
        probability: result.probability,
        predicted,
        correct: predicted === row.label
      };
    });

    return {
      predictions,
      tp,
      tn,
      fp,
      fn,
      accuracy: (tp + tn) / data.length,
      logLoss: loss / data.length
    };
  }

  function gradient(currentWeights, currentScaler) {
    const gradients = Array(featureCount() + 1).fill(0);

    data.forEach((row) => {
      const result = predict(row.values, currentWeights, currentScaler);
      const error = result.probability - row.label;

      gradients[0] += error;

      result.standardized.forEach((xj, j) => {
        gradients[j + 1] += error * xj;
      });
    });

    return gradients.map((value) => value / data.length);
  }

  function gradientStep(currentWeights, currentScaler, rate) {
    const g = gradient(currentWeights, currentScaler);

    return {
      gradient: g,
      weights: currentWeights.map(
        (value, index) => value - rate * g[index]
      )
    };
  }

  function trainForSteps(rate, steps) {
    const currentScaler = computeScaler();
    let currentWeights = zeroWeights();

    for (let i = 0; i < steps; i++) {
      currentWeights = gradientStep(
        currentWeights,
        currentScaler,
        rate
      ).weights;
    }

    return {
      scaler: currentScaler,
      weights: currentWeights,
      metrics: metricsFor(currentWeights, currentScaler),
      query: predict(query, currentWeights, currentScaler)
    };
  }

  /* =========================================================
     TRAINING
     ========================================================= */

  function instantFit() {
    stopTimer();

    scaler = computeScaler();
    weights = zeroWeights();

    /* Keep Instant Fit stable and near-converged regardless of the
       animation learning-rate selector. */
    const rate = 0.16;

    for (let i = 0; i < 1800; i++) {
      weights = gradientStep(weights, scaler, rate).weights;
    }

    fitted = true;
    animationHistory = [];
    animationIndex = 0;

    renderEverything();

    $("log-live-step").textContent =
      `Best fit complete. Accuracy ${(lastMetrics.accuracy * 100).toFixed(1)}%, log loss ${lastMetrics.logLoss.toFixed(3)}.`;
  }

  function prepareAnimation() {
    stopTimer();

    scaler = computeScaler();
    weights = zeroWeights();

    const steps = animationStepsValue();
    const rate = learningRateValue();

    animationHistory = [];
    let currentWeights = [...weights];

    for (let step = 0; step <= steps; step++) {
      animationHistory.push({
        step,
        weights: [...currentWeights],
        gradient: gradient(currentWeights, scaler),
        metrics: metricsFor(currentWeights, scaler)
      });

      if (step < steps) {
        currentWeights = gradientStep(
          currentWeights,
          scaler,
          rate
        ).weights;
      }
    }

    animationIndex = 0;
    fitted = true;
    applyAnimationFrame(0);
  }

  function applyAnimationFrame(index) {
    if (!animationHistory.length) return;

    animationIndex = clamp(index, 0, animationHistory.length - 1);

    const frame = animationHistory[animationIndex];
    weights = [...frame.weights];
    lastMetrics = frame.metrics;
    fitted = true;

    renderEverything();

    const progress =
      (animationIndex / Math.max(1, animationHistory.length - 1)) * 100;

    $("log-progress").style.width = `${progress}%`;
    $("log-step-display").textContent =
      `${animationIndex} / ${animationHistory.length - 1}`;

    if (animationIndex === 0) {
      $("log-live-step").textContent =
        `Training starts with all coefficients at 0. Learning rate = ${learningRateValue().toFixed(2)}.`;
    } else if (animationIndex === animationHistory.length - 1) {
      $("log-live-step").textContent =
        `Animation complete. Accuracy ${(lastMetrics.accuracy * 100).toFixed(1)}%, log loss ${lastMetrics.logLoss.toFixed(3)}.`;
    } else {
      $("log-live-step").textContent =
        `Step ${animationIndex}: learning rate ${learningRateValue().toFixed(2)} controls how far the coefficients move along the current gradient.`;
    }

    syncButtons();
  }

  function play() {
    if (!animationHistory.length) prepareAnimation();

    if (animationIndex >= animationHistory.length - 1) {
      applyAnimationFrame(0);
    }

    stopTimer();

    const speed = $("log-speed")?.value || "normal";
    const delay =
      speed === "slow" ? 800 :
      speed === "fast" ? 160 :
      390;

    timer = window.setInterval(() => {
      if (animationIndex >= animationHistory.length - 1) {
        stopTimer();
        syncButtons();
        return;
      }

      applyAnimationFrame(animationIndex + 1);
    }, delay);

    syncButtons();
  }

  function pause() {
    stopTimer();
    syncButtons();
  }

  function previous() {
    if (!animationHistory.length) prepareAnimation();
    stopTimer();
    applyAnimationFrame(Math.max(0, animationIndex - 1));
  }

  function next() {
    if (!animationHistory.length) prepareAnimation();
    stopTimer();
    applyAnimationFrame(
      Math.min(animationHistory.length - 1, animationIndex + 1)
    );
  }

  function resetAnimation() {
    stopTimer();

    scaler = computeScaler();
    weights = zeroWeights();
    fitted = false;
    lastMetrics = null;

    animationHistory = [];
    animationIndex = 0;

    clearResults();
    renderPlot();
    renderSettingsImpact();

    $("log-progress").style.width = "0%";
    $("log-step-display").textContent = "0 / 0";
    $("log-live-step").textContent =
      "Ready. Fit instantly or play the training animation.";

    syncButtons();
  }

  function stopTimer() {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function syncButtons() {
    const playing = Boolean(timer);

    if ($("log-play")) $("log-play").disabled = playing;
    if ($("log-pause")) $("log-pause").disabled = !playing;

    if ($("log-prev")) {
      $("log-prev").disabled =
        playing ||
        !animationHistory.length ||
        animationIndex <= 0;
    }

    if ($("log-next")) {
      $("log-next").disabled =
        playing ||
        (
          animationHistory.length > 0 &&
          animationIndex >= animationHistory.length - 1
        );
    }
  }

  function invalidate(message = "Training data changed. Fit the model again.") {
    stopTimer();

    scaler = computeScaler();
    weights = zeroWeights();
    fitted = false;
    lastMetrics = null;

    animationHistory = [];
    animationIndex = 0;

    clearResults();
    renderPlot();
    renderSettingsImpact();

    $("log-progress").style.width = "0%";
    $("log-step-display").textContent = "0 / 0";
    $("log-live-step").textContent = message;

    syncButtons();
  }

  /* =========================================================
     DATASET
     ========================================================= */

  function renderTrainingTable() {
    const body = $("log-data-body");
    if (!body) return;

    body.replaceChildren();

    data.forEach((row) => {
      const tr = document.createElement("tr");

      const idCell = document.createElement("td");
      idCell.textContent = row.id;
      tr.append(idCell);

      config().features.forEach((feature, j) => {
        const td = document.createElement("td");
        const input = document.createElement("input");

        input.type = "number";
        input.min = feature.min;
        input.max = feature.max;
        input.step = feature.step;
        input.value = row.values[j];

        input.addEventListener("change", () => {
          const parsed = Number.parseFloat(input.value);

          row.values[j] = Number.isFinite(parsed)
            ? roundTo(
                clamp(parsed, feature.min, feature.max),
                feature.step
              )
            : row.values[j];

          input.value = row.values[j];

          invalidate(
            `${feature.label} changed. Fit the model again to learn from the edited data.`
          );
        });

        td.append(input);
        tr.append(td);
      });

      const classCell = document.createElement("td");
      const select = document.createElement("select");

      [0, 1].forEach((label) => {
        const option = document.createElement("option");
        option.value = String(label);
        option.textContent = classText(label);
        option.selected = row.label === label;
        select.append(option);
      });

      select.addEventListener("change", () => {
        row.label = Number(select.value);
        invalidate("A known class label changed. Fit the model again.");
      });

      classCell.append(select);
      tr.append(classCell);

      const actionCell = document.createElement("td");
      const remove = document.createElement("button");

      remove.type = "button";
      remove.className = "log-row-remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remove sample ${row.id}`);

      remove.addEventListener("click", () => {
        if (data.length <= 6) return;

        data = data.filter((item) => item.id !== row.id);
        renumberData();
        renderTrainingTable();
        invalidate("Sample removed. Fit the model again.");
      });

      actionCell.append(remove);
      tr.append(actionCell);

      body.append(tr);
    });

    $("log-sample-count").textContent = `${data.length} samples`;
  }

  function addSample() {
    if (data.length >= 26) return;

    const values = config().features.map((feature, j) => {
      const previous =
        data[data.length - 1]?.values[j] ??
        query[j];

      return roundTo(
        clamp(
          previous + feature.step * 2,
          feature.min,
          feature.max
        ),
        feature.step
      );
    });

    const positives = data.filter((row) => row.label === 1).length;
    const negatives = data.length - positives;

    data.push({
      id: data.length + 1,
      values,
      label: positives < negatives ? 1 : 0
    });

    renderTrainingTable();
    invalidate("New labelled sample added. Edit it, then fit the model again.");
  }

  function renumberData() {
    data.forEach((row, index) => {
      row.id = index + 1;
    });
  }

  function generateData() {
    data = config().generator();
    renumberData();
    renderTrainingTable();
    invalidate("New synthetic examples generated. Fit the model again.");
  }

  function restoreData() {
    data = cloneRows(config().data);
    query = [...config().query];

    renderTrainingTable();
    syncQueryControls();
    invalidate("Original dataset restored.");
  }

  function changeDataset(key) {
    if (!DATASETS[key] || key === currentKey) return;

    stopTimer();

    currentKey = key;
    data = cloneRows(config().data);
    query = [...config().query];

    scaler = computeScaler();
    weights = zeroWeights();
    fitted = false;
    lastMetrics = null;

    animationHistory = [];
    animationIndex = 0;

    buildInterface();
    renderTrainingTable();
    syncQueryControls();
    clearResults();
    renderPlot();
    renderSettingsImpact();
    updateLearnSection();
    bindEvents();
  }

  /* =========================================================
     PLOT
     ========================================================= */

  function renderPlot() {
    const container = $("log-plot");
    if (!container) return;

    container.replaceChildren();

    const c = config();
    const [xIndex, yIndex] = c.plotAxes;
    const xFeature = c.features[xIndex];
    const yFeature = c.features[yIndex];

    const width = 760;
    const height = 430;
    const left = 78;
    const right = 28;
    const top = 28;
    const bottom = 64;

    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;

    const sx = (value) =>
      left +
      ((value - xFeature.min) / (xFeature.max - xFeature.min)) *
        plotWidth;

    const sy = (value) =>
      height -
      bottom -
      ((value - yFeature.min) / (yFeature.max - yFeature.min)) *
        plotHeight;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", "log-complete-svg");
    svg.setAttribute("role", "img");

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", left);
    rect.setAttribute("y", top);
    rect.setAttribute("width", plotWidth);
    rect.setAttribute("height", plotHeight);
    rect.setAttribute("rx", "8");
    rect.setAttribute("class", "log-plot-bg");
    svg.append(rect);

    if (fitted && scaler) {
      const cols = 30;
      const rows = 20;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const values = [...query];

          values[xIndex] =
            xFeature.min +
            ((col + 0.5) / cols) *
              (xFeature.max - xFeature.min);

          values[yIndex] =
            yFeature.min +
            ((row + 0.5) / rows) *
              (yFeature.max - yFeature.min);

          const p = predict(values).probability;

          const cell = document.createElementNS(SVG_NS, "rect");

          cell.setAttribute(
            "x",
            left + (col / cols) * plotWidth
          );

          cell.setAttribute(
            "y",
            top + ((rows - row - 1) / rows) * plotHeight
          );

          cell.setAttribute(
            "width",
            plotWidth / cols + 0.8
          );

          cell.setAttribute(
            "height",
            plotHeight / rows + 0.8
          );

          const strength =
            0.04 + Math.abs(p - 0.5) * 0.30;

          cell.setAttribute(
            "fill",
            p >= 0.5
              ? `rgba(37,99,235,${strength.toFixed(3)})`
              : `rgba(220,38,38,${strength.toFixed(3)})`
          );

          svg.append(cell);
        }
      }

      /* Draw the threshold boundary by sampling across X.
         This also works when the model has a third feature because
         all non-plotted dimensions stay fixed at the query values. */
      const target = safeLogit(thresholdValue());
      const pathPoints = [];

      for (let col = 0; col <= 80; col++) {
        const rawX =
          xFeature.min +
          (col / 80) *
            (xFeature.max - xFeature.min);

        const values = [...query];
        values[xIndex] = rawX;

        const xStd =
          (rawX - scaler.means[xIndex]) /
          scaler.stds[xIndex];

        let knownContribution = weights[0];

        for (let j = 0; j < featureCount(); j++) {
          if (j === yIndex) continue;

          if (j === xIndex) {
            knownContribution +=
              weights[j + 1] * xStd;
          } else {
            const vStd =
              (values[j] - scaler.means[j]) /
              scaler.stds[j];

            knownContribution +=
              weights[j + 1] * vStd;
          }
        }

        const wy = weights[yIndex + 1];

        if (Math.abs(wy) < 1e-8) continue;

        const yStd =
          (target - knownContribution) / wy;

        const rawY =
          scaler.means[yIndex] +
          yStd * scaler.stds[yIndex];

        if (
          rawY >= yFeature.min &&
          rawY <= yFeature.max
        ) {
          pathPoints.push([sx(rawX), sy(rawY)]);
        }
      }

      if (pathPoints.length >= 2) {
        const path = document.createElementNS(SVG_NS, "path");

        path.setAttribute(
          "d",
          pathPoints
            .map(
              ([x, y], index) =>
                `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`
            )
            .join(" ")
        );

        path.setAttribute("class", "log-decision-boundary");
        svg.append(path);
      }
    }

    drawGrid(
      svg,
      width,
      height,
      left,
      right,
      top,
      bottom
    );

    data.forEach((row) => {
      const point = document.createElementNS(SVG_NS, "circle");

      point.setAttribute(
        "cx",
        sx(row.values[xIndex])
      );

      point.setAttribute(
        "cy",
        sy(row.values[yIndex])
      );

      point.setAttribute("r", "8");

      point.setAttribute(
        "class",
        row.label === 1
          ? "log-point-positive"
          : "log-point-negative"
      );

      const title = document.createElementNS(SVG_NS, "title");

      title.textContent =
        `Sample ${row.id}: ` +
        c.features
          .map(
            (feature, j) =>
              `${feature.label} ${formatFeature(row.values[j], feature)}`
          )
          .join(", ") +
        ` → ${classText(row.label)}`;

      point.append(title);
      svg.append(point);
    });

    const qOuter = document.createElementNS(SVG_NS, "circle");
    qOuter.setAttribute("cx", sx(query[xIndex]));
    qOuter.setAttribute("cy", sy(query[yIndex]));
    qOuter.setAttribute("r", "13");
    qOuter.setAttribute("class", "log-query-outer");

    const qInner = document.createElementNS(SVG_NS, "circle");
    qInner.setAttribute("cx", sx(query[xIndex]));
    qInner.setAttribute("cy", sy(query[yIndex]));
    qInner.setAttribute("r", "5");
    qInner.setAttribute("class", "log-query-inner");

    svg.append(qOuter, qInner);

    addAxisLabel(
      svg,
      `${xFeature.label} (${xFeature.unit})`,
      width / 2,
      height - 18,
      false
    );

    addAxisLabel(
      svg,
      `${yFeature.label} (${yFeature.unit})`,
      22,
      height / 2,
      true
    );

    svg.addEventListener("click", (event) => {
      const bounds = svg.getBoundingClientRect();

      const localX =
        ((event.clientX - bounds.left) / bounds.width) *
        width;

      const localY =
        ((event.clientY - bounds.top) / bounds.height) *
        height;

      if (
        localX < left ||
        localX > width - right ||
        localY < top ||
        localY > height - bottom
      ) {
        return;
      }

      const rawX =
        xFeature.min +
        ((localX - left) / plotWidth) *
          (xFeature.max - xFeature.min);

      const rawY =
        yFeature.max -
        ((localY - top) / plotHeight) *
          (yFeature.max - yFeature.min);

      query[xIndex] = roundTo(
        clamp(rawX, xFeature.min, xFeature.max),
        xFeature.step
      );

      query[yIndex] = roundTo(
        clamp(rawY, yFeature.min, yFeature.max),
        yFeature.step
      );

      syncQueryControls();

      if (fitted) {
        renderPrediction();
        renderSettingsImpact();
      }

      renderPlot();
    });

    container.append(svg);

    const note = $("log-plot-slice-note");

    if (note) {
      const hiddenFeatures = c.features
        .map((feature, index) => ({ feature, index }))
        .filter(
          (item) =>
            item.index !== xIndex &&
            item.index !== yIndex
        );

      if (hiddenFeatures.length) {
        note.textContent =
          `The map shows ${xFeature.label} × ${yFeature.label}. ` +
          hiddenFeatures
            .map(
              ({ feature, index }) =>
                `${feature.label} is fixed at ${formatFeature(query[index], feature)}`
            )
            .join(", ") +
          ". The model still uses all features.";
      } else {
        note.textContent =
          `The map shows both model inputs: ${xFeature.label} × ${yFeature.label}.`;
      }
    }
  }

  function drawGrid(
    svg,
    width,
    height,
    left,
    right,
    top,
    bottom
  ) {
    for (let i = 0; i <= 6; i++) {
      const x =
        left +
        (i / 6) *
          (width - left - right);

      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", x);
      line.setAttribute("x2", x);
      line.setAttribute("y1", top);
      line.setAttribute("y2", height - bottom);
      line.setAttribute("class", "log-grid-line");
      svg.append(line);
    }

    for (let i = 0; i <= 5; i++) {
      const y =
        top +
        (i / 5) *
          (height - top - bottom);

      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", left);
      line.setAttribute("x2", width - right);
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      line.setAttribute("class", "log-grid-line");
      svg.append(line);
    }
  }

  function addAxisLabel(svg, text, x, y, rotate) {
    const label = document.createElementNS(SVG_NS, "text");

    label.setAttribute("x", x);
    label.setAttribute("y", y);
    label.setAttribute("class", "log-axis-label");
    label.setAttribute("text-anchor", "middle");

    if (rotate) {
      label.setAttribute(
        "transform",
        `rotate(-90 ${x} ${y})`
      );
    }

    label.textContent = text;
    svg.append(label);
  }

  /* =========================================================
     RESULTS
     ========================================================= */

  function renderEverything() {
    if (!fitted || !scaler) return;

    lastMetrics = metricsFor();

    renderPlot();
    renderMetrics();
    renderTrainingPredictions();
    renderCalculation();
    renderPrediction();
    renderSettingsImpact();
    updateLearnSection();
  }

  function renderMetrics() {
    if (!lastMetrics) return;

    $("log-accuracy").textContent =
      `${(lastMetrics.accuracy * 100).toFixed(1)}%`;

    $("log-loss").textContent =
      lastMetrics.logLoss.toFixed(3);

    $("log-tp").textContent = lastMetrics.tp;
    $("log-tn").textContent = lastMetrics.tn;
    $("log-fp").textContent = lastMetrics.fp;
    $("log-fn").textContent = lastMetrics.fn;

    const coefficientGrid = $("log-coefficient-grid");

    if (coefficientGrid) {
      coefficientGrid.innerHTML = weights
        .map((value, index) => {
          const label =
            index === 0
              ? "β₀ Intercept"
              : `β${index} ${config().features[index - 1].label}`;

          return `
            <div class="card log-metric">
              <span>${label}</span>
              <strong>${value.toFixed(3)}</strong>
            </div>
          `;
        })
        .join("");
    }
  }

  function renderTrainingPredictions() {
    const body = $("log-result-body");
    if (!body || !lastMetrics) return;

    body.replaceChildren();

    lastMetrics.predictions.forEach((row) => {
      const tr = document.createElement("tr");

      [
        row.id,
        classText(row.label),
        row.z.toFixed(3),
        row.probability.toFixed(3),
        classText(row.predicted),
        row.correct ? "✓" : "✕"
      ].forEach((value, index) => {
        const td = document.createElement("td");
        td.textContent = value;

        if (index === 5) {
          td.className =
            row.correct
              ? "log-correct"
              : "log-wrong";
        }

        tr.append(td);
      });

      body.append(tr);
    });
  }

  function renderCalculation() {
    const output = $("log-calculation-output");

    if (!output || !fitted || !scaler) return;

    const g = gradient(weights, scaler);

    const standardization = config().features
      .map(
        (feature, j) =>
          `<code>${feature.label}: x* = (x − ${scaler.means[j].toFixed(2)}) / ${scaler.stds[j].toFixed(2)}</code>`
      )
      .join("");

    const coefficientText = weights
      .map(
        (value, index) =>
          index === 0
            ? `β₀=${value.toFixed(3)}`
            : `β${index}=${value.toFixed(3)}`
      )
      .join(", ");

    const gradientText = g
      .map(
        (value, index) =>
          `<code>∂L/∂β${index} = ${value.toFixed(4)}</code>`
      )
      .join("");

    output.innerHTML = `
      <div class="log-calc-grid">
        <article>
          <strong>1. Standardize each feature</strong>
          ${standardization}
          <p>Standardization lets features with different units contribute on comparable scales.</p>
        </article>

        <article>
          <strong>2. Linear score</strong>
          <code>z = β₀ + β₁x₁* + β₂x₂*${featureCount() === 3 ? " + β₃x₃*" : ""}</code>
          <code>${coefficientText}</code>
        </article>

        <article>
          <strong>3. Sigmoid</strong>
          <code>p = 1 / (1 + e⁻ᶻ)</code>
          <p>The sigmoid converts the linear score into a probability between 0 and 1.</p>
        </article>

        <article>
          <strong>4. Current gradient</strong>
          ${gradientText}
        </article>

        <article>
          <strong>5. Gradient-descent update</strong>
          <code>β ← β − learning rate × gradient</code>
          <code>Selected learning rate = ${learningRateValue().toFixed(2)}</code>
        </article>

        <article>
          <strong>6. Classification</strong>
          <code>Class 1 if p ≥ ${thresholdValue().toFixed(2)}</code>
          <p>Changing the threshold changes the class cutoff, not the probability itself.</p>
        </article>
      </div>
    `;
  }

  function renderPrediction() {
    if (!fitted || !scaler) {
      $("log-query-probability").textContent = "—";
      $("log-query-class").textContent = "Fit the model first";
      $("log-query-z").textContent = "—";
      $("log-query-equation").textContent =
        "After training, change the values to see how the probability and final class respond.";
      return;
    }

    const result = predict(query);
    const threshold = thresholdValue();
    const predicted =
      result.probability >= threshold ? 1 : 0;

    $("log-query-probability").textContent =
      `${(result.probability * 100).toFixed(1)}%`;

    $("log-query-class").textContent =
      classText(predicted);

    $("log-query-z").textContent =
      result.z.toFixed(3);

    const terms = result.standardized
      .map(
        (value, j) =>
          `${weights[j + 1].toFixed(3)}(${value.toFixed(3)})`
      )
      .join(" + ");

    $("log-query-equation").textContent =
      `z = ${weights[0].toFixed(3)} + ${terms} = ${result.z.toFixed(3)}; ` +
      `p = ${result.probability.toFixed(3)}; ` +
      `${result.probability.toFixed(3)} ${result.probability >= threshold ? "≥" : "<"} ${threshold.toFixed(2)} ` +
      `→ ${classText(predicted)}.`;
  }

  function clearResults() {
    [
      "log-accuracy",
      "log-loss",
      "log-tp",
      "log-tn",
      "log-fp",
      "log-fn"
    ].forEach((id) => {
      if ($(id)) $(id).textContent = "—";
    });

    if ($("log-coefficient-grid")) {
      $("log-coefficient-grid").innerHTML =
        `<div class="card log-metric"><span>Coefficients</span><strong>—</strong></div>`;
    }

    if ($("log-result-body")) {
      $("log-result-body").replaceChildren();
    }

    if ($("log-calculation-output")) {
      $("log-calculation-output").innerHTML =
        `<p class="muted">Fit the model or start the animation to see the calculations.</p>`;
    }

    renderPrediction();
  }

  /* =========================================================
     NEW SAMPLE CONTROLS
     ========================================================= */

  function syncQueryControls() {
    config().features.forEach((feature, j) => {
      const slider = $(`log-query-${j}`);
      const number = $(`log-query-${j}-number`);
      const output = $(`log-query-${j}-value`);

      [slider, number].forEach((input) => {
        if (!input) return;

        input.min = feature.min;
        input.max = feature.max;
        input.step = feature.step;
        input.value = query[j];
      });

      if (output) {
        output.textContent =
          formatFeature(query[j], feature);
      }
    });
  }

  function updateQuery(index, rawValue) {
    const feature = config().features[index];
    const parsed = Number.parseFloat(rawValue);

    if (!Number.isFinite(parsed)) return;

    query[index] = roundTo(
      clamp(parsed, feature.min, feature.max),
      feature.step
    );

    syncQueryControls();

    if (fitted) {
      renderPrediction();
      renderSettingsImpact();
    }

    renderPlot();
  }

  /* =========================================================
     LEARNING RATE + THRESHOLD EFFECT
     ========================================================= */

  function renderSettingsImpact() {
    const learningBody = $("log-learning-impact-body");
    const thresholdBody = $("log-threshold-impact-body");
    const learningText = $("log-learning-impact-text");
    const thresholdText = $("log-threshold-impact-text");

    if (!learningBody || !thresholdBody) return;

    /* Compare three learning rates after the same small number
       of gradient-descent steps. This shows the path/speed effect
       rather than pretending that learning rate directly defines
       the final model. */
    const currentRate = learningRateValue();

    const rates = Array.from(
      new Set([
        0.06,
        Number(currentRate.toFixed(2)),
        0.32
      ])
    ).sort((a, b) => a - b);

    learningBody.innerHTML = rates
      .map((rate) => {
        const comparison = trainForSteps(rate, 25);

        return `
          <tr class="${Math.abs(rate - currentRate) < 1e-9 ? "is-current" : ""}">
            <td>${rate.toFixed(2)}${Math.abs(rate - currentRate) < 1e-9 ? " (selected)" : ""}</td>
            <td>${comparison.metrics.logLoss.toFixed(3)}</td>
            <td>${(comparison.metrics.accuracy * 100).toFixed(1)}%</td>
            <td>${(comparison.query.probability * 100).toFixed(1)}%</td>
          </tr>
        `;
      })
      .join("");

    if (learningText) {
      learningText.textContent =
        "All rows start from the same zero coefficients and run exactly 25 training steps. A larger learning rate moves farther each step, so intermediate loss and probabilities can differ. With enough stable training, reasonable rates may converge to similar solutions.";
    }

    if (!fitted || !scaler) {
      thresholdBody.innerHTML =
        `<tr><td colspan="3">Fit the model to compare decision thresholds using the same predicted probability.</td></tr>`;

      if (thresholdText) {
        thresholdText.textContent =
          "The threshold never changes the model's probability; it only changes where the probability is converted into Class 0 or Class 1.";
      }

      return;
    }

    const probability = predict(query).probability;
    const currentThreshold = thresholdValue();

    const thresholds = Array.from(
      new Set([
        0.30,
        Number(currentThreshold.toFixed(2)),
        0.50,
        0.70
      ])
    ).sort((a, b) => a - b);

    thresholdBody.innerHTML = thresholds
      .map((threshold) => {
        const predicted =
          probability >= threshold ? 1 : 0;

        return `
          <tr class="${Math.abs(threshold - currentThreshold) < 1e-9 ? "is-current" : ""}">
            <td>${threshold.toFixed(2)}${Math.abs(threshold - currentThreshold) < 1e-9 ? " (selected)" : ""}</td>
            <td>${(probability * 100).toFixed(1)}%</td>
            <td>${classText(predicted)}</td>
          </tr>
        `;
      })
      .join("");

    if (thresholdText) {
      thresholdText.textContent =
        `For the current new sample, Logistic Regression still predicts ${(probability * 100).toFixed(1)}% regardless of the threshold. Only the final class can flip as the cutoff changes.`;
    }
  }

  function updateThreshold() {
    const value = thresholdValue();

    $("log-threshold").value = value.toFixed(2);
    $("log-threshold-value").textContent =
      value.toFixed(2);

    if (fitted) {
      lastMetrics = metricsFor();

      renderMetrics();
      renderTrainingPredictions();
      renderPrediction();
      renderPlot();
      renderCalculation();
    }

    renderSettingsImpact();
    updateLearnSection();

    if ($("log-live-step")) {
      $("log-live-step").textContent =
        `Decision threshold changed to ${value.toFixed(2)}. The learned probabilities did not change; only the class cutoff and confusion matrix may change.`;
    }
  }

  function updateLearningRate() {
    animationHistory = [];
    animationIndex = 0;

    $("log-progress").style.width = "0%";
    $("log-step-display").textContent = "0 / 0";

    renderSettingsImpact();

    $("log-live-step").textContent =
      `Learning rate changed to ${learningRateValue().toFixed(2)}. This changes the size of future gradient-descent steps. Press Play or Next to retrain with this rate.`;

    syncButtons();
  }

  /* =========================================================
     INTERFACE
     ========================================================= */

  function buildInterface() {
    const root = $("logistic-regression-playground");
    if (!root) return;

    const c = config();
    const [xIndex, yIndex] = c.plotAxes;
    const xFeature = c.features[xIndex];
    const yFeature = c.features[yIndex];

    const newSampleControls = c.features
      .map(
        (feature, j) => `
          <label class="log-query-control">
            <div class="log-control-head">
              <strong>${feature.label}</strong>
              <output id="log-query-${j}-value">${formatFeature(query[j], feature)}</output>
            </div>

            <div class="log-query-input-row">
              <input id="log-query-${j}" type="range">
              <input id="log-query-${j}-number" class="log-number-input" type="number">
            </div>
          </label>
        `
      )
      .join("");

    const trainingHeaders = c.features
      .map(
        (feature) =>
          `<th>${feature.label}</th>`
      )
      .join("");

    root.innerHTML = `
      <div class="heading log-heading">
        <span class="label">Logistic Regression Playground</span>
        <h2>Learn a probability, then choose a class</h2>
        <p>
          Explore labelled examples, watch Logistic Regression learn its coefficients,
          see how learning rate changes training, and test how the decision threshold
          changes the final class.
        </p>
      </div>

      <section class="card log-example-card">
        <div class="log-section-head">
          <div>
            <span class="label">Choose an Example</span>
            <h3>What should Logistic Regression classify?</h3>
          </div>
        </div>

        <div class="log-example-options">
          ${Object.entries(DATASETS)
            .map(
              ([key, item]) => `
                <button
                  class="log-example-option ${key === currentKey ? "is-active" : ""}"
                  type="button"
                  data-log-dataset="${key}">
                  <span>${item.icon}</span>
                  <strong>${item.title}</strong>
                  <small>${item.subtitle}</small>
                </button>
              `
            )
            .join("")}
        </div>

        <div class="log-example-description">
          <strong>${c.icon} ${c.title}</strong>
          <span>${c.description}</span>
        </div>
      </section>

      <section class="card log-settings-card">
        <div class="log-settings-grid">
          <label>
            <span>Decision Threshold</span>
            <div class="log-inline-control">
              <input
                id="log-threshold"
                type="range"
                min="0.20"
                max="0.80"
                step="0.05"
                value="0.50">
              <output id="log-threshold-value">0.50</output>
            </div>
          </label>

          <label>
            <span>Learning Rate</span>
            <select id="log-learning-rate">
              <option value="0.06">0.06 — Small steps</option>
              <option value="0.16" selected>0.16 — Normal</option>
              <option value="0.32">0.32 — Large steps</option>
            </select>
          </label>

          <label>
            <span>Animation Steps</span>
            <select id="log-animation-steps">
              <option value="50">50</option>
              <option value="90" selected>90</option>
              <option value="150">150</option>
            </select>
          </label>

          <div class="log-dataset-actions">
            <button id="log-generate" class="btn" type="button">
              Generate New Examples
            </button>
            <button id="log-restore" class="btn" type="button">
              Restore Dataset
            </button>
          </div>
        </div>
      </section>

      <div id="log-live-step" class="live-step">
        Ready. Fit instantly or play the training animation.
      </div>

      <div class="log-main-grid">
        <section class="card log-data-card">
          <div class="log-section-head">
            <div>
              <span class="label">1. Training Data</span>
              <h3>${c.icon} ${c.title} — Labelled Examples</h3>
              <p>Edit a value or known class and fit the model again.</p>
            </div>
            <span id="log-sample-count" class="log-count">${data.length} samples</span>
          </div>

          <div class="log-table-wrap log-training-wrap">
            <table class="log-table">
              <thead>
                <tr>
                  <th>ID</th>
                  ${trainingHeaders}
                  <th>Known Class</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="log-data-body"></tbody>
            </table>
          </div>

          <div class="log-table-actions">
            <button id="log-add-sample" class="btn primary" type="button">
              + Add Sample
            </button>
            <span>${c.note}</span>
          </div>
        </section>

        <section class="card log-plot-card">
          <div class="log-section-head">
            <div>
              <span class="label">2. Probability Map</span>
              <h3>${xFeature.label} × ${yFeature.label}</h3>
              <p>Fit the model to reveal the probability regions and decision boundary.</p>
            </div>
          </div>

          <div class="log-legend">
            <span><i class="log-dot negative"></i>${c.class0.label}</span>
            <span><i class="log-dot positive"></i>${c.class1.label}</span>
            <span><i class="log-line"></i>Decision boundary</span>
            <span><i class="log-query-symbol"></i>New sample</span>
          </div>

          <div id="log-plot" class="log-plot"></div>
          <p id="log-plot-slice-note" class="log-plot-note"></p>
        </section>
      </div>

      <section class="card log-animation-card">
        <div class="log-animation-top">
          <div>
            <span class="label">3. Train the Model</span>
            <h3>Watch gradient descent learn the coefficients</h3>
            <p>
              Learning rate controls how far the coefficients move at each step.
              Use the comparison section below to see the effect numerically.
            </p>
          </div>

          <label class="log-speed-label">
            Speed
            <select id="log-speed">
              <option value="slow">Slow</option>
              <option value="normal" selected>Normal</option>
              <option value="fast">Fast</option>
            </select>
          </label>
        </div>

        <div class="log-animation-actions">
          <button id="log-instant" class="btn primary" type="button">
            Instant Fit
          </button>
          <button id="log-play" class="btn primary" type="button">
            ▶ Play
          </button>
          <button id="log-pause" class="btn" type="button" disabled>
            Pause
          </button>
          <button id="log-prev" class="btn" type="button" disabled>
            ← Previous
          </button>
          <button id="log-next" class="btn" type="button">
            Next →
          </button>
          <button id="log-reset-animation" class="btn" type="button">
            Reset Animation
          </button>
        </div>

        <div class="log-progress-row">
          <div class="log-progress-track">
            <div id="log-progress"></div>
          </div>
          <strong id="log-step-display">0 / 0</strong>
        </div>
      </section>

      <section class="log-metrics-row">
        <div class="card log-metric">
          <span>Accuracy</span>
          <strong id="log-accuracy">—</strong>
        </div>

        <div class="card log-metric">
          <span>Log Loss</span>
          <strong id="log-loss">—</strong>
        </div>
      </section>

      <div id="log-coefficient-grid" class="log-coefficient-grid">
        <div class="card log-metric">
          <span>Coefficients</span>
          <strong>—</strong>
        </div>
      </div>

      <section class="card log-impact-card">
        <div class="log-section-head">
          <div>
            <span class="label">4. What Changes When You Change the Settings?</span>
            <h3>Learning rate vs decision threshold</h3>
            <p>
              These two controls affect different parts of Logistic Regression.
            </p>
          </div>
        </div>

        <div class="log-impact-grid">
          <article>
            <h4>Learning Rate: changes the training path</h4>
            <p id="log-learning-impact-text"></p>

            <div class="log-table-wrap">
              <table class="log-table log-impact-table">
                <thead>
                  <tr>
                    <th>Learning Rate</th>
                    <th>Log Loss after 25 steps</th>
                    <th>Accuracy after 25 steps</th>
                    <th>New-sample Probability</th>
                  </tr>
                </thead>
                <tbody id="log-learning-impact-body"></tbody>
              </table>
            </div>
          </article>

          <article>
            <h4>Decision Threshold: changes the final class cutoff</h4>
            <p id="log-threshold-impact-text"></p>

            <div class="log-table-wrap">
              <table class="log-table log-impact-table">
                <thead>
                  <tr>
                    <th>Threshold</th>
                    <th>Same Probability</th>
                    <th>Final Class</th>
                  </tr>
                </thead>
                <tbody id="log-threshold-impact-body"></tbody>
              </table>
            </div>
          </article>
        </div>
      </section>

      <section class="card log-confusion-card">
        <div class="log-section-head">
          <div>
            <span class="label">5. Classification Summary</span>
            <h3>Confusion Matrix</h3>
            <p>
              Changing the decision threshold may change these counts even though
              the learned probabilities remain the same.
            </p>
          </div>
        </div>

        <div class="log-confusion-grid">
          <div><span>True Positive</span><strong id="log-tp">—</strong></div>
          <div><span>True Negative</span><strong id="log-tn">—</strong></div>
          <div><span>False Positive</span><strong id="log-fp">—</strong></div>
          <div><span>False Negative</span><strong id="log-fn">—</strong></div>
        </div>
      </section>

      <section class="card log-results-card">
        <div class="log-section-head">
          <div>
            <span class="label">6. First Understand the Training Predictions</span>
            <h3>Known labels vs model predictions</h3>
            <p>
              Inspect what the model did on labelled examples before experimenting
              with a new sample.
            </p>
          </div>
        </div>

        <div class="log-table-wrap">
          <table class="log-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Known Class</th>
                <th>Score z</th>
                <th>Probability</th>
                <th>Predicted Class</th>
                <th>Correct?</th>
              </tr>
            </thead>
            <tbody id="log-result-body"></tbody>
          </table>
        </div>
      </section>

      <section class="card log-calculation-card">
        <div class="log-section-head">
          <div>
            <span class="label">7. Live Mathematics</span>
            <h3>How is Logistic Regression learning?</h3>
            <p>The calculations use the current dataset and coefficients.</p>
          </div>
        </div>

        <div id="log-calculation-output">
          <p class="muted">
            Fit the model or start the animation to see the calculations.
          </p>
        </div>
      </section>

      <section class="card log-query-card">
        <div class="log-section-head">
          <div>
            <span class="label">8. Now Try a New Prediction</span>
            <h3>${c.icon} Change the inputs after understanding the fitted examples</h3>
            <p>
              The trained coefficients stay fixed. Only the new sample changes,
              so you can see how its probability and class respond.
            </p>
          </div>
        </div>

        <div class="log-query-grid">
          <div class="log-query-controls">
            ${newSampleControls}

            <p class="log-query-tip">
              You can also click the probability map to change the two displayed
              features. Any additional feature is changed with its slider.
            </p>

            ${
              currentKey === "diabetes"
                ? `<div class="log-medical-warning">
                     <strong>Educational model only.</strong>
                     This synthetic Diabetes / No Diabetes example is not a diagnosis,
                     screening tool, or substitute for clinical evaluation.
                   </div>`
                : ""
            }
          </div>

          <div class="log-query-result" aria-live="polite">
            <span>Predicted Probability</span>
            <strong id="log-query-probability">—</strong>

            <span>Predicted Class</span>
            <strong id="log-query-class">Fit the model first</strong>

            <span>Linear Score z</span>
            <strong id="log-query-z">—</strong>
          </div>
        </div>

        <div id="log-query-equation" class="log-query-equation">
          After training, change the values to see how the probability
          and final class respond.
        </div>
      </section>
    `;
  }

  /* =========================================================
     LEARN TABS
     ========================================================= */

  function updateLearnSection() {
    const section = $("logistic-regression-learn");
    if (!section) return;

    const c = config();

    const beginner =
      section.querySelector('[data-learn-panel="beginner"]');

    const math =
      section.querySelector('[data-learn-panel="math"]');

    const process =
      section.querySelector('[data-learn-panel="process"]');

    if (beginner) {
      beginner.innerHTML = `
        <div class="learn-grid">
          <article>
            <b>1</b>
            <h3>Start with labelled examples</h3>
            <p>Each sample is labelled ${c.class0.label} or ${c.class1.label}.</p>
          </article>

          <article>
            <b>2</b>
            <h3>Use the features</h3>
            <p>${c.features.map((feature) => feature.label).join(", ")} are combined numerically.</p>
          </article>

          <article>
            <b>3</b>
            <h3>Learn coefficients</h3>
            <p>Gradient descent changes β values to reduce log loss.</p>
          </article>

          <article>
            <b>4</b>
            <h3>Apply the sigmoid</h3>
            <p>The linear score becomes a probability between 0 and 1.</p>
          </article>

          <article>
            <b>5</b>
            <h3>Choose a threshold</h3>
            <p>The current cutoff is ${thresholdValue().toFixed(2)}.</p>
          </article>

          <article>
            <b>6</b>
            <h3>Predict the class</h3>
            <p>The same probability can produce a different class if the threshold changes.</p>
          </article>
        </div>
      `;
    }

    if (math) {
      math.innerHTML = `
        <div class="math-grid">
          <article>
            <h3>Linear Score</h3>
            <p class="equation">
              z = β₀ + ${c.features.map((_, j) => `β${j + 1}x${j + 1}*`).join(" + ")}
            </p>
            <p>
              ${
                fitted
                  ? `Current coefficients: ${weights.map((value, j) => `β${j}=${value.toFixed(3)}`).join(", ")}`
                  : "Fit the model to see the learned coefficients."
              }
            </p>
          </article>

          <article>
            <h3>Sigmoid</h3>
            <p class="equation">p = 1/(1+e⁻ᶻ)</p>
            <p>The sigmoid gives the probability of Class 1.</p>
          </article>

          <article>
            <h3>Decision Threshold</h3>
            <p class="equation">ŷ = 1 if p ≥ ${thresholdValue().toFixed(2)}</p>
            <p>Changing this cutoff does not retrain the model.</p>
          </article>
        </div>
      `;
    }

    if (process) {
      process.innerHTML = `
        <div class="process-grid">
          <article>
            <strong>Labelled Data</strong>
            <span>${c.features.map((feature) => feature.label).join(" + ")}</span>
          </article>

          <span>→</span>

          <article>
            <strong>Standardize</strong>
            <span>Comparable scales</span>
          </article>

          <span>→</span>

          <article>
            <strong>Gradient Descent</strong>
            <span>Learning rate controls step size</span>
          </article>

          <span>→</span>

          <article>
            <strong>Sigmoid</strong>
            <span>Probability 0–1</span>
          </article>

          <span>→</span>

          <article>
            <strong>Threshold</strong>
            <span>${thresholdValue().toFixed(2)}</span>
          </article>

          <span>→</span>

          <article>
            <strong>Class</strong>
            <span>${c.class0.label} / ${c.class1.label}</span>
          </article>
        </div>
      `;
    }
  }

  /* =========================================================
     STYLES
     ========================================================= */

  function injectStyles() {
    if ($("logistic-regression-complete-styles")) return;

    const style = document.createElement("style");
    style.id = "logistic-regression-complete-styles";

    style.textContent = `
      #logistic-regression-playground .card { overflow:hidden; }

      .log-heading { margin-bottom:24px; }

      .log-example-card,
      .log-settings-card,
      .log-data-card,
      .log-plot-card,
      .log-animation-card,
      .log-impact-card,
      .log-confusion-card,
      .log-results-card,
      .log-calculation-card,
      .log-query-card {
        padding:22px;
        margin-bottom:18px;
      }

      .log-section-head {
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:18px;
        margin-bottom:16px;
      }

      .log-section-head h3,
      .log-animation-top h3 {
        margin:4px 0;
        font-size:clamp(18px,1.25vw,21px);
      }

      .log-section-head p,
      .log-animation-top p {
        margin:0;
        color:var(--muted);
        font-size:clamp(14px,.95vw,15.5px);
      }

      .log-example-options {
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:12px;
      }

      .log-example-option {
        display:grid;
        grid-template-columns:auto 1fr;
        column-gap:10px;
        row-gap:2px;
        align-items:center;
        min-height:88px;
        padding:14px;
        text-align:left;
        border:1px solid var(--border);
        border-radius:11px;
        background:#fff;
        color:var(--text);
      }

      .log-example-option:hover {
        border-color:#9fb8da;
        background:#fbfdff;
      }

      .log-example-option.is-active {
        border-color:var(--blue);
        background:var(--soft-blue);
      }

      .log-example-option > span {
        grid-row:1 / 3;
        font-size:22px;
      }

      .log-example-option strong { font-size:15px; }
      .log-example-option small {
        color:var(--muted);
        line-height:1.35;
      }

      .log-example-description {
        display:flex;
        gap:12px;
        align-items:baseline;
        margin-top:12px;
        padding:12px 14px;
        border-radius:9px;
        background:var(--soft);
      }

      .log-example-description span { color:var(--muted); }

      .log-settings-grid {
        display:grid;
        grid-template-columns:1.2fr .85fr .75fr auto;
        gap:14px;
        align-items:end;
      }

      .log-settings-grid label {
        display:grid;
        gap:7px;
        font-weight:650;
        color:var(--text-soft);
      }

      .log-settings-grid select,
      .log-table input,
      .log-table select,
      .log-number-input,
      .log-speed-label select {
        width:100%;
        min-height:40px;
        border:1px solid var(--border-strong);
        border-radius:8px;
        background:#fff;
        color:var(--text);
        padding:7px 9px;
      }

      .log-inline-control {
        display:grid;
        grid-template-columns:1fr 54px;
        gap:10px;
        align-items:center;
      }

      .log-inline-control output {
        color:var(--blue);
        font-weight:800;
        text-align:right;
      }

      .log-dataset-actions,
      .log-table-actions,
      .log-animation-actions {
        display:flex;
        flex-wrap:wrap;
        gap:9px;
      }

      .log-main-grid {
        display:grid;
        grid-template-columns:minmax(0,1.06fr) minmax(0,.94fr);
        gap:18px;
        align-items:stretch;
      }

      .log-main-grid > .card { margin-bottom:18px; }

      .log-count {
        flex:0 0 auto;
        padding:5px 9px;
        border-radius:999px;
        background:var(--soft-blue);
        color:var(--blue);
        font-size:12px;
        font-weight:800;
      }

      .log-table-wrap {
        width:100%;
        overflow:auto;
        border:1px solid var(--border);
        border-radius:9px;
      }

      .log-training-wrap { max-height:390px; }

      .log-table {
        width:100%;
        border-collapse:collapse;
        font-size:clamp(13px,.9vw,14.5px);
      }

      .log-table th {
        position:sticky;
        top:0;
        z-index:1;
        padding:9px 10px;
        background:#f8fafc;
        border-bottom:1px solid var(--border);
        color:var(--text-soft);
        text-align:left;
        font-size:11.5px;
        letter-spacing:.03em;
        text-transform:uppercase;
      }

      .log-table td {
        padding:7px 9px;
        border-bottom:1px solid #edf1f6;
        vertical-align:middle;
      }

      .log-table input,
      .log-table select {
        min-height:34px;
        padding:5px 7px;
      }

      .log-row-remove {
        width:30px;
        height:30px;
        border:1px solid var(--border);
        border-radius:7px;
        background:#fff;
        color:var(--muted);
        font-weight:800;
      }

      .log-row-remove:hover {
        color:var(--red);
        border-color:#f2b8b8;
        background:#fffafa;
      }

      .log-table-actions {
        align-items:center;
        margin-top:12px;
      }

      .log-table-actions span {
        flex:1 1 280px;
        color:var(--muted);
        font-size:12.5px;
      }

      .log-legend {
        display:flex;
        flex-wrap:wrap;
        gap:13px;
        margin-bottom:9px;
        color:var(--muted);
        font-size:12px;
      }

      .log-legend span {
        display:inline-flex;
        align-items:center;
        gap:6px;
      }

      .log-dot {
        width:10px;
        height:10px;
        border-radius:50%;
        display:inline-block;
      }

      .log-dot.negative { background:#dc2626; }
      .log-dot.positive { background:#2563eb; }

      .log-line {
        width:22px;
        border-top:3px dashed #0f172a;
      }

      .log-query-symbol {
        width:13px;
        height:13px;
        border-radius:50%;
        border:3px solid #7c3aed;
        background:#fff;
      }

      .log-plot {
        width:100%;
        min-height:390px;
        border:1px solid var(--border);
        border-radius:10px;
        background:#fbfdff;
        overflow:hidden;
      }

      .log-complete-svg {
        display:block;
        width:100%;
        height:auto;
        min-height:390px;
        cursor:crosshair;
      }

      .log-plot-bg {
        fill:#fff;
        stroke:#dbe4ef;
      }

      .log-grid-line {
        stroke:#dce5ef;
        stroke-width:1;
        opacity:.7;
        pointer-events:none;
      }

      .log-axis-label {
        fill:#475569;
        font-size:13px;
        font-weight:700;
        pointer-events:none;
      }

      .log-point-negative {
        fill:#dc2626;
        stroke:#fff;
        stroke-width:2.5;
      }

      .log-point-positive {
        fill:#2563eb;
        stroke:#fff;
        stroke-width:2.5;
      }

      .log-decision-boundary {
        fill:none;
        stroke:#0f172a;
        stroke-width:3.2;
        stroke-dasharray:9 6;
        pointer-events:none;
      }

      .log-query-outer {
        fill:#fff;
        stroke:#7c3aed;
        stroke-width:4;
        pointer-events:none;
      }

      .log-query-inner {
        fill:#7c3aed;
        pointer-events:none;
      }

      .log-plot-note {
        margin:9px 0 0;
        color:var(--muted);
        font-size:12.5px;
      }

      .log-animation-top {
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:18px;
        margin-bottom:14px;
      }

      .log-speed-label {
        min-width:115px;
        display:grid;
        gap:5px;
        color:var(--muted);
        font-size:12px;
      }

      .log-progress-row {
        display:grid;
        grid-template-columns:1fr auto;
        gap:12px;
        align-items:center;
        margin-top:13px;
      }

      .log-progress-track {
        height:8px;
        overflow:hidden;
        border-radius:999px;
        background:#e9eef5;
      }

      #log-progress {
        width:0;
        height:100%;
        background:var(--blue);
        transition:width .18s ease;
      }

      #log-step-display {
        min-width:66px;
        color:var(--text-soft);
        font-size:13px;
        text-align:right;
      }

      .log-metrics-row {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
        margin-bottom:12px;
      }

      .log-coefficient-grid {
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:12px;
        margin-bottom:18px;
      }

      .log-metric { padding:14px 16px; }

      .log-metric span {
        display:block;
        color:var(--muted);
        font-size:12px;
      }

      .log-metric strong {
        display:block;
        margin-top:4px;
        font-size:clamp(20px,1.5vw,24px);
      }

      .log-impact-grid {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:16px;
      }

      .log-impact-grid article {
        min-width:0;
        padding:16px;
        border:1px solid var(--border);
        border-radius:10px;
        background:#fbfdff;
      }

      .log-impact-grid h4 {
        margin:0 0 7px;
        font-size:16px;
      }

      .log-impact-grid p {
        margin:0 0 12px;
        color:var(--muted);
        font-size:13px;
      }

      .log-impact-table tr.is-current td {
        background:var(--soft-blue);
        font-weight:700;
      }

      .log-confusion-grid {
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:10px;
      }

      .log-confusion-grid > div {
        padding:14px;
        border:1px solid var(--border);
        border-radius:9px;
        background:#fbfdff;
      }

      .log-confusion-grid span {
        display:block;
        color:var(--muted);
        font-size:12px;
      }

      .log-confusion-grid strong {
        display:block;
        margin-top:3px;
        font-size:21px;
      }

      .log-correct {
        color:var(--green);
        font-weight:800;
      }

      .log-wrong {
        color:var(--red);
        font-weight:800;
      }

      .log-calc-grid {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:12px;
      }

      .log-calc-grid article {
        padding:14px;
        border:1px solid var(--border);
        border-radius:9px;
        background:#fbfdff;
      }

      .log-calc-grid strong,
      .log-calc-grid code {
        display:block;
      }

      .log-calc-grid code {
        margin-top:7px;
        padding:7px 9px;
        border-radius:7px;
        background:#f1f5f9;
        color:#1e293b;
        overflow-wrap:anywhere;
      }

      .log-calc-grid p {
        margin:7px 0 0;
        color:var(--muted);
        font-size:13px;
      }

      .log-query-grid {
        display:grid;
        grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);
        gap:18px;
        align-items:stretch;
      }

      .log-query-controls {
        display:grid;
        gap:18px;
      }

      .log-query-control {
        display:grid;
        gap:8px;
      }

      .log-query-input-row {
        display:grid;
        grid-template-columns:minmax(0,1fr) 110px;
        gap:12px;
        align-items:center;
      }

      .log-query-input-row input[type="range"] {
        width:100%;
      }

      .log-control-head {
        display:flex;
        justify-content:space-between;
        gap:12px;
        align-items:center;
      }

      .log-control-head output {
        color:var(--blue);
        font-weight:800;
      }

      .log-query-tip {
        margin:0;
        color:var(--muted);
        font-size:12.5px;
      }

      .log-query-result {
        display:grid;
        grid-template-columns:1fr auto;
        gap:10px 14px;
        align-content:center;
        padding:18px;
        border:1px solid #cfe0f6;
        border-radius:11px;
        background:var(--soft-blue);
      }

      .log-query-result span {
        color:var(--muted);
        font-size:13px;
      }

      .log-query-result strong {
        text-align:right;
      }

      #log-query-probability {
        color:var(--blue);
        font-size:24px;
      }

      .log-query-equation {
        margin-top:14px;
        padding:12px 14px;
        border-radius:9px;
        background:#f8fafc;
        color:var(--text-soft);
        font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
        font-size:13px;
        overflow-wrap:anywhere;
      }

      .log-medical-warning {
        padding:12px 14px;
        border:1px solid #f0c36c;
        border-radius:9px;
        background:#fffaf0;
        color:#7c4a03;
        font-size:13px;
      }

      .log-medical-warning strong {
        display:block;
        margin-bottom:3px;
      }

      @media (max-width:1050px) {
        .log-settings-grid {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .log-coefficient-grid {
          grid-template-columns:repeat(2,minmax(0,1fr));
        }

        .log-impact-grid {
          grid-template-columns:1fr;
        }
      }

      @media (max-width:900px) {
        .log-example-options,
        .log-main-grid {
          grid-template-columns:1fr;
        }
      }

      @media (max-width:700px) {
        .log-example-card,
        .log-settings-card,
        .log-data-card,
        .log-plot-card,
        .log-animation-card,
        .log-impact-card,
        .log-confusion-card,
        .log-results-card,
        .log-calculation-card,
        .log-query-card {
          padding:16px;
        }

        .log-settings-grid,
        .log-metrics-row,
        .log-coefficient-grid,
        .log-confusion-grid,
        .log-calc-grid,
        .log-query-grid {
          grid-template-columns:1fr;
        }

        .log-animation-top {
          flex-direction:column;
        }

        .log-speed-label { width:100%; }

        .log-query-input-row {
          grid-template-columns:1fr;
        }

        .log-plot,
        .log-complete-svg {
          min-height:320px;
        }
      }
    `;

    document.head.append(style);
  }

  /* =========================================================
     EVENTS / INIT
     ========================================================= */

  function bindEvents() {
    document
      .querySelectorAll("[data-log-dataset]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          changeDataset(
            button.dataset.logDataset
          );
        });
      });

    $("log-generate")?.addEventListener(
      "click",
      generateData
    );

    $("log-restore")?.addEventListener(
      "click",
      restoreData
    );

    $("log-add-sample")?.addEventListener(
      "click",
      addSample
    );

    $("log-instant")?.addEventListener(
      "click",
      instantFit
    );

    $("log-play")?.addEventListener(
      "click",
      play
    );

    $("log-pause")?.addEventListener(
      "click",
      pause
    );

    $("log-prev")?.addEventListener(
      "click",
      previous
    );

    $("log-next")?.addEventListener(
      "click",
      next
    );

    $("log-reset-animation")?.addEventListener(
      "click",
      resetAnimation
    );

    $("log-threshold")?.addEventListener(
      "input",
      updateThreshold
    );

    $("log-learning-rate")?.addEventListener(
      "change",
      updateLearningRate
    );

    $("log-animation-steps")?.addEventListener(
      "change",
      () => {
        animationHistory = [];
        animationIndex = 0;
        $("log-progress").style.width = "0%";
        $("log-step-display").textContent = "0 / 0";

        $("log-live-step").textContent =
          `Animation length changed to ${animationStepsValue()} steps. Press Play or Next to start a new training run.`;

        syncButtons();
      }
    );

    config().features.forEach((feature, j) => {
      $(`log-query-${j}`)?.addEventListener(
        "input",
        (event) => {
          updateQuery(j, event.target.value);
        }
      );

      $(`log-query-${j}-number`)?.addEventListener(
        "change",
        (event) => {
          updateQuery(j, event.target.value);
        }
      );
    });

    syncButtons();
  }

  function init() {
    if (!$("logistic-regression-playground")) return;

    injectStyles();

    scaler = computeScaler();
    weights = zeroWeights();

    buildInterface();
    renderTrainingTable();
    syncQueryControls();
    clearResults();
    renderPlot();
    renderSettingsImpact();
    updateLearnSection();
    bindEvents();
  }

  init();

  return {
    instantFit,
    resetAnimation
  };
})();
