"use strict";

/* =========================================================
   LINEAR REGRESSION — COMPLETE INTERACTIVE PLAYGROUND
   - House Price: simple linear regression
   - Fuel Consumption: multiple linear regression (HP + Speed)
   - Salary vs Experience: simple linear regression
   ========================================================= */

const LinearRegressionModel = (() => {
  const root = document.getElementById("linear-regression-playground");
  if (!root) return {};

  const $ = (id) => document.getElementById(id);
  const SVG_NS = "http://www.w3.org/2000/svg";

  const EXAMPLES = {
    house: {
      icon: "🏠",
      title: "House Price",
      mode: "simple",
      short: "Area → estimated price",
      description: "Learn a simple regression relationship between house area and price using a synthetic educational dataset.",
      features: [
        { key: "x1", label: "House Area", unit: "m²", min: 50, max: 300, step: 5, queryDefault: 165 }
      ],
      target: { label: "House Price", unit: "€k", decimals: 0 },
      data: [
        [62,178],[78,205],[92,231],[108,255],[126,294],[145,326],
        [162,348],[185,402],[205,431],[228,486],[252,525],[282,585]
      ]
    },

    fuel: {
      icon: "🚗",
      title: "Fuel Consumption",
      mode: "multiple",
      short: "Engine power + speed → fuel use",
      description: "Use engine power and average speed together to estimate fuel consumption. The values are synthetic and are included only to teach multiple linear regression.",
      features: [
        { key: "x1", label: "Engine Power", unit: "HP", min: 60, max: 320, step: 5, queryDefault: 150 },
        { key: "x2", label: "Average Speed", unit: "km/h", min: 30, max: 140, step: 5, queryDefault: 100 }
      ],
      target: { label: "Fuel Consumption", unit: "L/100 km", decimals: 1 },
      data: [
        [70,55,5.0],[90,70,5.4],[110,80,5.9],[125,95,6.4],
        [145,90,6.8],[160,105,7.5],[180,115,8.1],[205,100,8.3],
        [225,120,9.2],[250,110,9.6],[275,125,10.5],[300,135,11.4]
      ]
    },

    salary: {
      icon: "💼",
      title: "Salary vs Experience",
      mode: "simple",
      short: "Experience → annual salary",
      description: "Learn a simple regression relationship between years of experience and annual salary using a synthetic educational dataset.",
      features: [
        { key: "x1", label: "Experience", unit: "years", min: 0, max: 20, step: 0.5, queryDefault: 8 }
      ],
      target: { label: "Annual Salary", unit: "€k", decimals: 0 },
      data: [
        [0.5,31],[1.5,35],[2.5,39],[4,46],[5,49],[6.5,57],
        [8,63],[9.5,67],[11,75],[13,82],[15.5,94],[18,104]
      ]
    }
  };

  const state = {
    exampleKey: "house",
    data: [],
    query: {},
    queryShown: false,
    showResiduals: true,
    addPointMode: false,
    history: [],
    frameIndex: 0,
    timer: null,
    playing: false,
    currentResult: null,
    exactResult: null
  };

  function cfg() { return EXAMPLES[state.exampleKey]; }
  function featureCount() { return cfg().features.length; }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function mean(a){ return a.reduce((s,v)=>s+v,0)/a.length; }
  function short(v,d=3){
    if(!Number.isFinite(v)) return "—";
    if(Math.abs(v)>=1000) return v.toLocaleString(undefined,{maximumFractionDigits:2});
    return v.toFixed(d);
  }
  function formatFeature(feature,value){
    const decimals = feature.step < 1 ? 1 : 0;
    return `${Number(value).toFixed(decimals)} ${feature.unit}`;
  }
  function formatTarget(value){
    return `${Number(value).toFixed(cfg().target.decimals)} ${cfg().target.unit}`;
  }
  function formatAxis(value){
    const a=Math.abs(value);
    if(a>=1000) return Math.round(value).toLocaleString();
    if(a>=100) return Math.round(value).toString();
    if(a>=10) return value.toFixed(0);
    return value.toFixed(1).replace(/\.0$/,"");
  }

  /* =========================================================
     UI
     ========================================================= */

  function buildUI(){
    root.innerHTML = `
      <div class="lr-heading-block">
        <span class="label">Linear Regression Playground</span>
        <h2>Watch regression learn a relationship, then test a new value</h2>
        <p>Fit the training examples first. After you understand the model's predictions and errors, change a new input and see how the learned equation responds.</p>
      </div>

      <section class="card lr-example-card">
        <span class="label">Choose an Example</span>
        <h3>Explore simple and multiple linear regression</h3>
        <div class="lr-example-grid">
          <button class="lr-example-option is-active" data-lr-example="house" type="button"><span>🏠</span><strong>House Price</strong><small>Area → Price</small></button>
          <button class="lr-example-option" data-lr-example="fuel" type="button"><span>🚗</span><strong>Fuel Consumption</strong><small>HP + Speed → Fuel Use</small></button>
          <button class="lr-example-option" data-lr-example="salary" type="button"><span>💼</span><strong>Salary vs Experience</strong><small>Experience → Salary</small></button>
        </div>
        <div class="lr-example-note"><strong id="lr-example-title"></strong><span id="lr-example-description"></span></div>
      </section>

      <section class="card lr-config-card">
        <div class="lr-config-grid">
          <label>Animation Learning Rate
            <select id="lr-learning-rate">
              <option value="0.05">0.05 — Slow</option>
              <option value="0.10">0.10</option>
              <option value="0.18" selected>0.18 — Recommended</option>
              <option value="0.28">0.28 — Fast</option>
            </select>
          </label>
          <label>Animation Steps
            <select id="lr-animation-steps"><option>25</option><option selected>40</option><option>60</option></select>
          </label>
          <label class="lr-check-label"><input id="lr-show-residuals" type="checkbox" checked><span>Show residual error lines</span></label>
          <div class="lr-config-actions"><button id="lr-generate" class="btn" type="button">Generate New Data</button><button id="lr-reset-data" class="btn" type="button">Restore Dataset</button></div>
        </div>
      </section>

      <!-- Plot is intentionally beside the training data. Students see the fitted model before trying a new prediction. -->
      <div class="lr-training-grid">
        <section class="card lr-data-card">
          <div class="lr-section-heading-row">
            <div><span class="label">Training Data</span><h3 id="lr-data-title"></h3><p>Edit values, then fit the model again.</p></div>
            <span id="lr-sample-count" class="lr-count-badge"></span>
          </div>
          <div class="lr-table-wrap">
            <table class="lr-table"><thead><tr id="lr-data-head"></tr></thead><tbody id="lr-data-body"></tbody></table>
          </div>
          <div class="lr-data-actions">
            <button id="lr-add-sample" class="btn primary" type="button">+ Add Sample</button>
            <button id="lr-remove-sample" class="btn" type="button">− Remove Last</button>
            <button id="lr-click-add" class="btn" type="button">＋ Click Plot to Add</button>
          </div>
        </section>

        <section class="card lr-visual-card">
          <div class="lr-section-heading-row">
            <div><span class="label">Model Visualization</span><h3 id="lr-plot-title">Regression Plot</h3><p id="lr-graph-note"></p></div>
          </div>
          <div id="lr-plot" class="lr-plot"></div>
          <div class="lr-axis-caption"><span id="lr-axis-y-caption"></span><span id="lr-axis-x-caption"></span></div>
          <div id="lr-plot-legend" class="lr-legend"></div>
        </section>
      </div>

      <section class="card lr-animation-card">
        <div class="lr-animation-controls">
          <button id="lr-run" class="btn primary" type="button">Instant Best Fit</button>
          <button id="lr-play" class="btn primary" type="button">▶ Play Animation</button>
          <button id="lr-pause" class="btn" type="button" disabled>Pause</button>
          <button id="lr-prev" class="btn" type="button" disabled>← Previous</button>
          <button id="lr-next" class="btn" type="button">Next →</button>
          <button id="lr-reset-animation" class="btn" type="button">Reset Animation</button>
          <label class="lr-speed-control">Speed <select id="lr-speed"><option value="slow">Slow</option><option value="normal" selected>Normal</option><option value="fast">Fast</option></select></label>
        </div>
        <div class="lr-progress-track"><div id="lr-progress" class="lr-progress-fill"></div></div>
        <div id="lr-live-step" class="live-step lr-live-step">Ready. Fit the training data first.</div>
      </section>

      <section class="lr-metrics-grid">
        <div class="card"><span>Step</span><strong id="lr-step-result">0 / 40</strong></div>
        <div class="card"><span>Intercept b₀</span><strong id="lr-intercept-result">—</strong></div>
        <div class="card"><span id="lr-coef1-label">Slope b₁</span><strong id="lr-coef1-result">—</strong></div>
        <div class="card"><span id="lr-coef2-label">Second coefficient</span><strong id="lr-coef2-result">—</strong></div>
        <div class="card"><span>MSE</span><strong id="lr-mse-result">—</strong></div>
        <div class="card"><span>R²</span><strong id="lr-r2-result">—</strong></div>
      </section>

      <div class="lr-analysis-grid">
        <section class="card lr-analysis-card"><span class="label">What Is Happening Now?</span><h3 id="lr-current-title">Ready to fit the model</h3><div id="lr-current-explanation" class="lr-current-explanation"></div></section>
        <section class="card lr-analysis-card"><span class="label">Live Calculation</span><h3>Current numbers</h3><div id="lr-calculation-output" class="lr-calculation-output"><p>Run the model to see the calculation.</p></div></section>
      </div>

      <!-- First predictions: the training observations and residuals. -->
      <section class="card lr-residual-card">
        <div class="lr-section-heading-row">
          <div><span class="label">1. Training Predictions</span><h3>Understand what the fitted model did first</h3><p>Compare every observed value with its fitted prediction before trying a new value.</p></div>
        </div>
        <div class="lr-table-wrap lr-result-table-wrap"><table class="lr-table"><thead><tr id="lr-result-head"></tr></thead><tbody id="lr-result-body"></tbody></table></div>
      </section>

      <!-- New prediction comes AFTER training predictions. -->
      <section class="card lr-query-card lr-query-after-results">
        <div class="lr-query-intro"><span class="label">2. Try a New Prediction</span><h3 id="lr-query-title"></h3><p id="lr-query-help"></p></div>
        <div id="lr-query-controls" class="lr-query-controls"></div>
        <div class="lr-query-actions"><button id="lr-predict" class="btn primary" type="button">Predict New Value</button><span id="lr-query-change-note">Fit the model first, then change the values.</span></div>
        <div class="lr-new-prediction-grid">
          <div class="lr-prediction-result"><span>Predicted <b id="lr-prediction-label"></b></span><strong id="lr-query-prediction">—</strong><small id="lr-prediction-equation">Fit the model first.</small></div>
          <div class="lr-query-summary"><span class="label">What changed?</span><p id="lr-query-explanation">After fitting the model, change the input and press Predict New Value. The model coefficients stay fixed; only the input changes.</p></div>
        </div>
      </section>
    `;
  }

  function buildLearnUI(){
    const learn=document.getElementById("linear-regression-learn");
    if(!learn) return;
    learn.dataset.learnModel="linear-regression";
    learn.innerHTML=`
      <div class="wrap">
        <div class="heading"><span class="label">Learn Linear Regression</span><h2>Connect the plot with the equation</h2><p>The fuel example also shows how multiple linear regression combines two inputs.</p></div>
        <div class="tabs model-learn-tabs"><button class="tab active" data-learn-tab="beginner" type="button">Beginner</button><button class="tab" data-learn-tab="math" type="button">Mathematics</button><button class="tab" data-learn-tab="process" type="button">Process</button></div>
        <div class="learn-panel" data-learn-panel="beginner"><div class="learn-grid">
          <article><b>1</b><h3>Training examples</h3><p>Each row contains known inputs and a known output.</p></article>
          <article><b>2</b><h3>Fit coefficients</h3><p>The model learns how much each input contributes to the prediction.</p></article>
          <article><b>3</b><h3>Training predictions</h3><p>Compare fitted predictions with the observed outputs.</p></article>
          <article><b>4</b><h3>Residual errors</h3><p>The difference between observed and predicted values is the residual.</p></article>
          <article><b>5</b><h3>Try a new input</h3><p>Keep the learned coefficients fixed and change only the new input values.</p></article>
          <article><b>6</b><h3>Interpret the result</h3><p>See how the equation converts the new inputs into a new numerical prediction.</p></article>
        </div></div>
        <div class="learn-panel" data-learn-panel="math" hidden><div class="lr-learn-math-grid">
          <article class="card"><h3>Model equation</h3><p id="lr-learn-equation" class="equation">ŷ = b₀ + b₁x</p><small>Simple regression has one input; multiple regression has more than one.</small></article>
          <article class="card"><h3>Residual</h3><p class="equation">eᵢ = yᵢ − ŷᵢ</p><small>Residual is the vertical prediction error for a known sample.</small></article>
          <article class="card"><h3>Mean Squared Error</h3><p class="equation">MSE = (1/n)Σ(yᵢ−ŷᵢ)²</p><small id="lr-learn-mse">Fit the model to calculate MSE.</small></article>
          <article class="card"><h3>Coefficient meaning</h3><p id="lr-learn-coefs" class="equation">b₁ changes ŷ when x changes</p><small>With two inputs, b₁ and b₂ measure separate contributions while the other input is held fixed.</small></article>
          <article class="card"><h3>Gradient descent</h3><p class="equation">θ ← θ − α∇MSE</p><small>Animation updates all coefficients to reduce MSE.</small></article>
          <article class="card"><h3>New prediction</h3><p id="lr-learn-prediction" class="equation">Fit the model, then test a new input.</p><small>The coefficients stay learned; the new feature values are substituted into the equation.</small></article>
        </div></div>
        <div class="learn-panel" data-learn-panel="process" hidden><div class="lr-process-flow">
          <article><strong>Training Data</strong><span>Known inputs + outputs</span></article><span>→</span><article><strong>Fit Model</strong><span>Learn coefficients</span></article><span>→</span><article><strong>Check Training Predictions</strong><span>Inspect residuals</span></article><span>→</span><article><strong>New Input</strong><span>Change one or two values</span></article><span>→</span><article><strong>Prediction</strong><span>Use the fixed learned equation</span></article>
        </div><div class="card lr-learn-current-card"><span class="label">Current Experiment</span><h3 id="lr-learn-current-title"></h3><p id="lr-learn-current-text"></p></div></div>
      </div>`;
  }

  /* =========================================================
     STYLES
     ========================================================= */

  function injectStyles(){
    if(document.getElementById("lr-complete-styles")) return;
    const style=document.createElement("style");
    style.id="lr-complete-styles";
    style.textContent=`
      #linear-regression-playground{--lr-accent:#2563eb;--lr-ink:#0f172a;--lr-muted:#64748b;--lr-border:#dbe3ee;--lr-soft:#f8fafc;display:block}
      #linear-regression-playground .lr-heading-block{max-width:950px;margin-bottom:24px}
      #linear-regression-playground .lr-heading-block h2{font-size:clamp(30px,3.1vw,46px);line-height:1.08;margin:7px 0 12px}
      #linear-regression-playground .lr-heading-block p,#linear-regression-playground .lr-section-heading-row p{color:var(--lr-muted)}
      #linear-regression-playground .lr-example-card,#linear-regression-playground .lr-config-card,#linear-regression-playground .lr-data-card,#linear-regression-playground .lr-visual-card,#linear-regression-playground .lr-animation-card,#linear-regression-playground .lr-analysis-card,#linear-regression-playground .lr-residual-card,#linear-regression-playground .lr-query-card{padding:22px}
      #linear-regression-playground .lr-example-card,#linear-regression-playground .lr-config-card,#linear-regression-playground .lr-training-grid,#linear-regression-playground .lr-animation-card,#linear-regression-playground .lr-metrics-grid,#linear-regression-playground .lr-analysis-grid,#linear-regression-playground .lr-residual-card,#linear-regression-playground .lr-query-card{margin-bottom:18px}
      #linear-regression-playground .lr-example-card h3,#linear-regression-playground .lr-section-heading-row h3,#linear-regression-playground .lr-query-intro h3{margin:4px 0 4px}
      #linear-regression-playground .lr-example-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:15px}
      #linear-regression-playground .lr-example-option{min-height:88px;padding:14px 16px;border:1px solid var(--lr-border);border-radius:11px;background:#fff;text-align:left;display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;gap:2px 10px;color:var(--lr-ink)}
      #linear-regression-playground .lr-example-option>span{grid-row:1/3;font-size:25px}.lr-example-option small{color:#64748b}
      #linear-regression-playground .lr-example-option.is-active{border-color:#6ca1e8;background:#eff6ff;box-shadow:0 0 0 2px rgba(37,99,235,.08)}
      #linear-regression-playground .lr-example-note{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding:10px 12px;background:#f8fafc;border-radius:9px;color:#64748b}.lr-example-note strong{color:#0f172a}
      #linear-regression-playground .lr-config-grid{display:grid;grid-template-columns:1fr 1fr 1.2fr auto;gap:14px;align-items:end}.lr-config-grid label{display:grid;gap:6px;font-weight:700;color:#334155}.lr-config-grid select{min-height:40px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;padding:7px 9px}.lr-check-label{grid-template-columns:auto 1fr!important;align-items:center}.lr-config-actions{display:flex;gap:8px;flex-wrap:wrap}
      #linear-regression-playground .lr-training-grid{display:grid;grid-template-columns:minmax(430px,.95fr) minmax(0,1.35fr);gap:18px;align-items:stretch}
      #linear-regression-playground .lr-section-heading-row{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}.lr-section-heading-row p{margin:0}
      #linear-regression-playground .lr-count-badge{padding:5px 9px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:800}
      #linear-regression-playground .lr-table-wrap{overflow:auto;max-height:390px;border:1px solid #e2e8f0;border-radius:9px}.lr-table{width:100%;border-collapse:collapse;font-size:13px}.lr-table th{position:sticky;top:0;z-index:1;background:#f8fafc;color:#475569;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em}.lr-table th,.lr-table td{padding:8px 9px;border-bottom:1px solid #e8eef5}.lr-table input{width:100%;min-width:80px;height:34px;border:1px solid #cbd5e1;border-radius:6px;padding:5px 7px}.lr-row-delete{border:0;background:transparent;color:#94a3b8;font-size:20px}.lr-data-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      #linear-regression-playground .lr-plot{width:100%;height:420px;min-height:320px;margin-top:12px;border:1px solid #dbe3ee;border-radius:10px;background:#fbfdff;overflow:hidden;position:relative}.lr-svg{display:block;width:100%;height:100%;touch-action:none}.lr-gridline{stroke:#e8eef6;stroke-width:1}.lr-axis{stroke:#94a3b8;stroke-width:1.2}.lr-tick{fill:#64748b;font-size:11px}.lr-point{fill:#2563eb;stroke:#fff;stroke-width:2}.lr-fit-line{stroke:#0f766e;stroke-width:4;stroke-linecap:round}.lr-residual-line{stroke:#dc2626;stroke-width:1.5;stroke-dasharray:4 4;opacity:.55}.lr-query-marker{fill:#fff;stroke:#7c3aed;stroke-width:4}.lr-query-guide{stroke:#7c3aed;stroke-width:1.3;stroke-dasharray:5 4;opacity:.65}.lr-heat-cell{stroke:none}.lr-fuel-point{fill:#fff;stroke:#0f172a;stroke-width:2}.lr-fuel-label{fill:#0f172a;font-size:10px;font-weight:800;paint-order:stroke;stroke:#fff;stroke-width:3px}.lr-centre-note{fill:#64748b;font-size:12px}.lr-axis-caption{display:flex;justify-content:space-between;gap:12px;margin-top:7px;color:#64748b;font-size:12px;flex-wrap:wrap}.lr-legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:9px;color:#64748b;font-size:12px}.lr-add-hint{position:absolute;right:12px;top:10px;padding:5px 8px;border-radius:7px;background:#fff;border:1px solid #fed7aa;color:#9a3412;font-size:12px;font-weight:700;pointer-events:none}
      #linear-regression-playground .lr-animation-controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.lr-speed-control{margin-left:auto;display:flex;gap:7px;align-items:center;font-size:12px;color:#64748b}.lr-speed-control select{min-height:34px;border:1px solid #cbd5e1;border-radius:7px;background:#fff}.lr-progress-track{height:6px;margin:13px 0 11px;background:#e8eef6;border-radius:999px;overflow:hidden}.lr-progress-fill{height:100%;width:0;background:#2563eb;border-radius:999px}.lr-live-step{margin:0}
      #linear-regression-playground .lr-metrics-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}.lr-metrics-grid .card{padding:13px 14px;box-shadow:none}.lr-metrics-grid span{display:block;color:#64748b;font-size:11px;text-transform:uppercase}.lr-metrics-grid strong{display:block;margin-top:4px;font-size:17px}
      #linear-regression-playground .lr-analysis-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.lr-analysis-card h3{margin:5px 0 10px}.lr-current-explanation,.lr-calculation-output{min-height:135px;padding:14px;border-radius:9px;background:#f8fafc;color:#334155;font-size:14px;line-height:1.6}.lr-calculation-output code{display:block;white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.65}
      #linear-regression-playground .lr-result-table-wrap{max-height:360px}.lr-residual-positive{color:#b91c1c;font-weight:700}.lr-residual-negative{color:#1d4ed8;font-weight:700}
      #linear-regression-playground .lr-query-after-results{border-top:3px solid #2563eb}.lr-query-intro p{margin:0;color:#64748b}.lr-query-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}.lr-query-control{padding:14px;border:1px solid #e2e8f0;border-radius:10px;background:#fbfdff}.lr-query-label-row{display:flex;justify-content:space-between;gap:12px;margin-bottom:8px}.lr-query-label-row label{font-weight:800}.lr-query-label-row strong{color:#1d4ed8}.lr-query-control input[type=range]{width:100%}.lr-query-number{width:100%;margin-top:8px;height:38px;border:1px solid #cbd5e1;border-radius:7px;padding:6px 9px}.lr-query-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}.lr-query-actions span{color:#64748b;font-size:13px}.lr-new-prediction-grid{display:grid;grid-template-columns:minmax(220px,.7fr) 1.3fr;gap:14px;margin-top:14px}.lr-prediction-result,.lr-query-summary{padding:17px;border:1px solid #dbe3ee;border-radius:10px;background:#f8fafc}.lr-prediction-result span,.lr-prediction-result small{display:block;color:#64748b}.lr-prediction-result strong{display:block;margin:7px 0;font-size:clamp(26px,2.5vw,38px);color:#0f172a}.lr-query-summary p{margin:6px 0 0;color:#475569}
      #linear-regression-learn .lr-learn-math-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.lr-learn-math-grid article{padding:19px}.lr-process-flow{display:flex;gap:8px;align-items:stretch;overflow-x:auto}.lr-process-flow article{min-width:160px;flex:1;padding:17px;border:1px solid #e2e8f0;border-radius:10px;background:#fff}.lr-process-flow article strong,.lr-process-flow article span{display:block}.lr-process-flow article span{margin-top:4px;color:#64748b;font-size:13px}.lr-process-flow>span{align-self:center;color:#94a3b8}.lr-learn-current-card{margin-top:15px;padding:20px}
      @media(max-width:1100px){#linear-regression-playground .lr-training-grid{grid-template-columns:1fr}#linear-regression-playground .lr-config-grid{grid-template-columns:1fr 1fr}#linear-regression-playground .lr-metrics-grid{grid-template-columns:repeat(3,1fr)}#linear-regression-learn .lr-learn-math-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:720px){#linear-regression-playground .lr-example-grid,#linear-regression-playground .lr-config-grid,#linear-regression-playground .lr-analysis-grid,#linear-regression-playground .lr-query-controls,#linear-regression-playground .lr-new-prediction-grid{grid-template-columns:1fr}#linear-regression-playground .lr-metrics-grid{grid-template-columns:repeat(2,1fr)}#linear-regression-playground .lr-plot{height:340px}#linear-regression-playground .lr-speed-control{margin-left:0;width:100%}#linear-regression-learn .lr-learn-math-grid{grid-template-columns:1fr}}
    `;
    document.head.append(style);
  }

  /* =========================================================
     DATA
     ========================================================= */

  function resetDataFromExample(){
    const c=cfg();
    state.data=c.data.map((row,i)=> c.mode==="multiple"
      ? {id:i+1,x1:row[0],x2:row[1],y:row[2]}
      : {id:i+1,x1:row[0],y:row[1]});
    state.query={};
    c.features.forEach(f=>state.query[f.key]=f.queryDefault);
    state.queryShown=false;
    state.currentResult=null;
    state.exactResult=calculateExact(state.data);
    state.history=[];
    state.frameIndex=0;
    stopAnimation();
  }

  function renumber(){ state.data.forEach((r,i)=>r.id=i+1); }

  /* =========================================================
     MATRIX + REGRESSION MATH
     ========================================================= */

  function solveLinearSystem(A,b){
    const n=A.length;
    const M=A.map((row,i)=>[...row,b[i]]);
    for(let col=0;col<n;col++){
      let pivot=col;
      for(let r=col+1;r<n;r++) if(Math.abs(M[r][col])>Math.abs(M[pivot][col])) pivot=r;
      if(Math.abs(M[pivot][col])<1e-12) return Array(n).fill(0);
      [M[col],M[pivot]]=[M[pivot],M[col]];
      const div=M[col][col];
      for(let j=col;j<=n;j++) M[col][j]/=div;
      for(let r=0;r<n;r++){
        if(r===col) continue;
        const factor=M[r][col];
        for(let j=col;j<=n;j++) M[r][j]-=factor*M[col][j];
      }
    }
    return M.map(row=>row[n]);
  }

  function calculateExact(rows){
    if(featureCount()===1){
      const xs=rows.map(r=>r.x1), ys=rows.map(r=>r.y);
      const mx=mean(xs), my=mean(ys);
      let num=0,den=0;
      rows.forEach(r=>{num+=(r.x1-mx)*(r.y-my);den+=(r.x1-mx)**2;});
      const b1=den===0?0:num/den;
      const b0=my-b1*mx;
      return evaluateCoefficients([b0,b1],rows,{meanX:mx,meanY:my,numerator:num,denominator:den,exact:true});
    }

    // Normal equations for [1, x1, x2].
    let n=rows.length,sx1=0,sx2=0,sy=0,sx1x1=0,sx2x2=0,sx1x2=0,sx1y=0,sx2y=0;
    rows.forEach(r=>{sx1+=r.x1;sx2+=r.x2;sy+=r.y;sx1x1+=r.x1*r.x1;sx2x2+=r.x2*r.x2;sx1x2+=r.x1*r.x2;sx1y+=r.x1*r.y;sx2y+=r.x2*r.y;});
    const A=[[n,sx1,sx2],[sx1,sx1x1,sx1x2],[sx2,sx1x2,sx2x2]];
    const B=[sy,sx1y,sx2y];
    const beta=solveLinearSystem(A,B);
    return evaluateCoefficients(beta,rows,{normalA:A,normalB:B,exact:true});
  }

  function evaluateCoefficients(beta,rows=state.data,extras={}){
    const ys=rows.map(r=>r.y), my=mean(ys);
    let sse=0,sst=0;
    const predictions=rows.map(r=>{
      const prediction=beta[0]+beta[1]*r.x1+(featureCount()>1?beta[2]*r.x2:0);
      const residual=r.y-prediction;
      const squaredError=residual*residual;
      sse+=squaredError; sst+=(r.y-my)**2;
      return {...r,prediction,residual,squaredError};
    });
    const mse=sse/rows.length;
    return {beta:[...beta],predictions,sse,mse,rmse:Math.sqrt(mse),r2:sst===0?1:1-sse/sst,...extras};
  }

  function predict(query,result=state.currentResult||state.exactResult){
    if(!result) return null;
    return result.beta[0]+result.beta[1]*query.x1+(featureCount()>1?result.beta[2]*query.x2:0);
  }

  function buildGradientHistory(){
    const rows=state.data;
    const c=cfg();
    const steps=parseInt($("lr-animation-steps").value,10)||40;
    const lr=parseFloat($("lr-learning-rate").value)||0.18;
    const fCount=featureCount();

    const mins=[],ranges=[];
    c.features.forEach((f,idx)=>{
      const values=rows.map(r=>r[`x${idx+1}`]);
      const mn=Math.min(...values),mx=Math.max(...values);
      mins.push(mn); ranges.push(Math.max(mx-mn,1e-9));
    });
    const ys=rows.map(r=>r.y), minY=Math.min(...ys), maxY=Math.max(...ys), yRange=Math.max(maxY-minY,1e-9);
    const norm=rows.map(r=>({xs:c.features.map((f,idx)=>(r[`x${idx+1}`]-mins[idx])/ranges[idx]),y:(r.y-minY)/yRange}));

    let nb=mean(norm.map(r=>r.y));
    let nm=Array(fCount).fill(0);
    const frames=[];

    function toRaw(){
      const beta=[minY+yRange*nb];
      for(let j=0;j<fCount;j++){
        const bj=yRange*nm[j]/ranges[j];
        beta.push(bj);
        beta[0]-=bj*mins[j];
      }
      return beta;
    }
    function push(step,grads=null){ frames.push({step,learningRate:lr,grads,result:evaluateCoefficients(toRaw())}); }
    push(0);

    for(let step=1;step<=steps;step++){
      let lastGrads=null;
      for(let inner=0;inner<4;inner++){
        let gb=0; const gm=Array(fCount).fill(0);
        norm.forEach(r=>{
          let p=nb; for(let j=0;j<fCount;j++) p+=nm[j]*r.xs[j];
          const e=p-r.y;
          gb+=(2/norm.length)*e;
          for(let j=0;j<fCount;j++) gm[j]+=(2/norm.length)*r.xs[j]*e;
        });
        nb-=lr*gb; for(let j=0;j<fCount;j++) nm[j]-=lr*gm[j];
        lastGrads=[gb,...gm];
      }
      push(step,lastGrads);
    }
    frames.push({step:steps+1,exact:true,learningRate:lr,grads:Array(fCount+1).fill(0),result:calculateExact(rows)});
    state.history=frames; state.frameIndex=0; return frames;
  }

  /* =========================================================
     RENDER EXAMPLE + TABLES
     ========================================================= */

  function renderExampleUI(){
    const c=cfg();
    document.querySelectorAll("[data-lr-example]").forEach(b=>b.classList.toggle("is-active",b.dataset.lrExample===state.exampleKey));
    $("lr-example-title").textContent=`${c.icon} ${c.title}`;
    $("lr-example-description").textContent=c.description;
    $("lr-data-title").textContent=`${c.icon} ${c.title} — Training Samples`;
    $("lr-plot-title").textContent=c.mode==="multiple"?"HP × Speed Fuel-Consumption Map":"Regression Line";
    $("lr-graph-note").textContent=c.mode==="multiple"?"X = Engine Power, Y = Average Speed. After fitting, the background shows predicted fuel consumption across the two-input space.":"Training points and the fitted best-fit line. Residuals show vertical prediction errors.";
    $("lr-axis-x-caption").textContent=`X: ${c.features[0].label} (${c.features[0].unit})`;
    $("lr-axis-y-caption").textContent=c.mode==="multiple"?`Y: ${c.features[1].label} (${c.features[1].unit})`:`Y: ${c.target.label} (${c.target.unit})`;
    $("lr-coef1-label").textContent=c.mode==="multiple"?"HP coefficient b₁":"Slope b₁";
    $("lr-coef2-label").textContent=c.mode==="multiple"?"Speed coefficient b₂":"Second coefficient";
    $("lr-query-title").textContent=c.title==="House Price"?"Estimate a House Price":c.title==="Fuel Consumption"?"Estimate Fuel Consumption":"Estimate an Annual Salary";
    $("lr-query-help").textContent=c.mode==="multiple"?"Change engine power and average speed. The learned coefficients stay fixed while the new vehicle moves to a different position on the fuel map.":`Change ${c.features[0].label.toLowerCase()}. The fitted slope and intercept stay fixed while only the new input changes.`;
    $("lr-prediction-label").textContent=c.target.label;
    $("lr-click-add").disabled=c.mode==="multiple";
    $("lr-click-add").title=c.mode==="multiple"?"For the two-input fuel example, add a row in the table so you can also specify its observed fuel consumption.":"Click the plot to add a training sample.";
    $("lr-show-residuals").disabled=c.mode==="multiple";
    $("lr-show-residuals").title=c.mode==="multiple"?"The fuel example uses an HP × Speed map rather than vertical residual lines.":"Show or hide vertical residual lines.";
    $("lr-plot-legend").innerHTML=c.mode==="multiple"?"<span>● Training vehicle</span><span>Background = predicted L/100 km</span><span>◇ New vehicle after prediction</span>":"<span>● Training sample</span><span>━ Regression line</span><span>┊ Residual</span><span>◇ New prediction</span>";
    renderQueryControls();
    renderDataHead();
    renderResultHead();
    updateLearn();
  }

  function renderDataHead(){
    const h=$("lr-data-head"); h.replaceChildren();
    ["ID",...cfg().features.map(f=>`${f.label} (${f.unit})`),`${cfg().target.label} (${cfg().target.unit})`,""].forEach(t=>{const th=document.createElement("th");th.textContent=t;h.append(th);});
  }

  function renderResultHead(){
    const h=$("lr-result-head"); h.replaceChildren();
    ["ID",...cfg().features.map(f=>`${f.label} (${f.unit})`),`Observed ${cfg().target.label}`,`Predicted ${cfg().target.label}`,"Residual","Squared Error"].forEach(t=>{const th=document.createElement("th");th.textContent=t;h.append(th);});
  }

  function renderDataTable(){
    const body=$("lr-data-body"); body.replaceChildren();
    state.data.forEach(row=>{
      const tr=document.createElement("tr");
      const id=document.createElement("td");id.textContent=row.id;tr.append(id);
      cfg().features.forEach((f,idx)=>{
        const td=document.createElement("td"),input=document.createElement("input");
        input.type="number";input.step=f.step;input.value=row[`x${idx+1}`];
        input.addEventListener("change",()=>{const v=parseFloat(input.value);if(Number.isFinite(v)){row[`x${idx+1}`]=v;invalidateFit("Training data changed. Fit the model again.");}else input.value=row[`x${idx+1}`];});
        td.append(input);tr.append(td);
      });
      const ytd=document.createElement("td"),y=document.createElement("input"); y.type="number";y.step=cfg().target.decimals?"0.1":"1";y.value=row.y;
      y.addEventListener("change",()=>{const v=parseFloat(y.value);if(Number.isFinite(v)){row.y=v;invalidateFit("Training data changed. Fit the model again.");}else y.value=row.y;}); ytd.append(y);tr.append(ytd);
      const dtd=document.createElement("td"),del=document.createElement("button");del.type="button";del.className="lr-row-delete";del.textContent="×";del.addEventListener("click",()=>{if(state.data.length<=4)return;state.data=state.data.filter(r=>r.id!==row.id);renumber();renderDataTable();invalidateFit("Sample removed. Fit the model again.");});dtd.append(del);tr.append(dtd);
      body.append(tr);
    });
    $("lr-sample-count").textContent=`${state.data.length} samples`;
  }

  function renderQueryControls(){
    const box=$("lr-query-controls"); box.replaceChildren();
    cfg().features.forEach((f,idx)=>{
      const wrap=document.createElement("div");wrap.className="lr-query-control";
      wrap.innerHTML=`<div class="lr-query-label-row"><label for="lr-query-${idx}-range">${f.label}</label><strong id="lr-query-${idx}-display">${formatFeature(f,state.query[f.key])}</strong></div><input id="lr-query-${idx}-range" type="range" min="${f.min}" max="${f.max}" step="${f.step}" value="${state.query[f.key]}"><input id="lr-query-${idx}-number" class="lr-query-number" type="number" min="${f.min}" max="${f.max}" step="${f.step}" value="${state.query[f.key]}">`;
      box.append(wrap);
      const range=wrap.querySelector(`#lr-query-${idx}-range`), num=wrap.querySelector(`#lr-query-${idx}-number`), disp=wrap.querySelector(`#lr-query-${idx}-display`);
      const update=(v)=>{const n=clamp(parseFloat(v),f.min,f.max);if(!Number.isFinite(n))return;state.query[f.key]=n;range.value=n;num.value=n;disp.textContent=formatFeature(f,n);state.queryShown=false;clearQueryResult();renderPlot(state.currentResult);$("lr-query-change-note").textContent="Values changed. Press Predict New Value to apply the learned equation.";};
      range.addEventListener("input",e=>update(e.target.value));num.addEventListener("change",e=>update(e.target.value));
    });
  }

  /* =========================================================
     PLOTS
     ========================================================= */

  function svgEl(name,attrs={}){const el=document.createElementNS(SVG_NS,name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}

  function renderPlot(result=state.currentResult){
    if(cfg().mode==="multiple") renderFuelMap(result); else renderSimplePlot(result);
  }

  function renderSimplePlot(result){
    const box=$("lr-plot"); box.replaceChildren();
    const W=860,H=420,p={l:64,r:24,t:24,b:50};
    const f=cfg().features[0];
    const xs=state.data.map(r=>r.x1),ys=state.data.map(r=>r.y);
    if(result){state.data.forEach(r=>ys.push(result.beta[0]+result.beta[1]*r.x1));if(state.queryShown)ys.push(predict(state.query,result));}
    let minX=Math.min(f.min,...xs),maxX=Math.max(f.max,...xs),minY=Math.min(...ys),maxY=Math.max(...ys); const my=(maxY-minY)*.13||1;minY-=my;maxY+=my;
    const sx=x=>p.l+(x-minX)/(maxX-minX)*(W-p.l-p.r), sy=y=>H-p.b-(y-minY)/(maxY-minY)*(H-p.t-p.b);
    const ux=px=>minX+(px-p.l)/(W-p.l-p.r)*(maxX-minX), uy=py=>minY+(H-p.b-py)/(H-p.t-p.b)*(maxY-minY);
    const svg=svgEl("svg",{viewBox:`0 0 ${W} ${H}`,class:"lr-svg",role:"img","aria-label":`${cfg().title} regression plot`});
    for(let i=0;i<=6;i++){
      const xv=minX+i/6*(maxX-minX),yv=minY+i/6*(maxY-minY),px=sx(xv),py=sy(yv);
      svg.append(svgEl("line",{x1:px,x2:px,y1:p.t,y2:H-p.b,class:"lr-gridline"}),svgEl("line",{x1:p.l,x2:W-p.r,y1:py,y2:py,class:"lr-gridline"}));
      const xt=svgEl("text",{x:px,y:H-27,"text-anchor":"middle",class:"lr-tick"});xt.textContent=formatAxis(xv);svg.append(xt);
      const yt=svgEl("text",{x:p.l-9,y:py+4,"text-anchor":"end",class:"lr-tick"});yt.textContent=formatAxis(yv);svg.append(yt);
    }
    svg.append(svgEl("line",{x1:p.l,x2:W-p.r,y1:H-p.b,y2:H-p.b,class:"lr-axis"}),svgEl("line",{x1:p.l,x2:p.l,y1:p.t,y2:H-p.b,class:"lr-axis"}));
    if(result){
      const y1=result.beta[0]+result.beta[1]*minX,y2=result.beta[0]+result.beta[1]*maxX;
      svg.append(svgEl("line",{x1:sx(minX),y1:sy(y1),x2:sx(maxX),y2:sy(y2),class:"lr-fit-line"}));
      if(state.showResiduals) result.predictions.forEach(r=>svg.append(svgEl("line",{x1:sx(r.x1),x2:sx(r.x1),y1:sy(r.y),y2:sy(r.prediction),class:"lr-residual-line"})));
    }
    state.data.forEach(r=>svg.append(svgEl("circle",{cx:sx(r.x1),cy:sy(r.y),r:6.5,class:"lr-point"})));
    if(result&&state.queryShown){const qy=predict(state.query,result),qx=state.query.x1;svg.append(svgEl("line",{x1:sx(qx),x2:sx(qx),y1:H-p.b,y2:sy(qy),class:"lr-query-guide"}),svgEl("circle",{cx:sx(qx),cy:sy(qy),r:8,class:"lr-query-marker"}));}
    svg.addEventListener("click",e=>{if(!state.addPointMode)return;const rect=svg.getBoundingClientRect(),px=(e.clientX-rect.left)/rect.width*W,py=(e.clientY-rect.top)/rect.height*H;if(px<p.l||px>W-p.r||py<p.t||py>H-p.b)return;addPointFromPlot(ux(px),uy(py));});
    box.append(svg);
    if(state.addPointMode){const hint=document.createElement("div");hint.className="lr-add-hint";hint.textContent="Click inside the plot to add a training sample";box.append(hint);}
  }

  function heatColor(t){
    // Educational low→high scale. t is 0..1.
    const hue=210-(210*t); // blue to red through middle hues
    return `hsl(${hue} 78% ${88-20*t}%)`;
  }

  function renderFuelMap(result){
    const box=$("lr-plot");box.replaceChildren();
    const W=860,H=420,p={l:64,r:26,t:24,b:50};
    const fx=cfg().features[0],fy=cfg().features[1];
    const sx=x=>p.l+(x-fx.min)/(fx.max-fx.min)*(W-p.l-p.r), sy=y=>H-p.b-(y-fy.min)/(fy.max-fy.min)*(H-p.t-p.b);
    const svg=svgEl("svg",{viewBox:`0 0 ${W} ${H}`,class:"lr-svg",role:"img","aria-label":"Engine power by speed fuel-consumption map"});

    if(result){
      const cols=22,rows=14,vals=[];
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=fx.min+(i+.5)/cols*(fx.max-fx.min),y=fy.min+(j+.5)/rows*(fy.max-fy.min);vals.push(predict({x1:x,x2:y},result));}
      const mn=Math.min(...vals),mx=Math.max(...vals);let k=0;
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
        const x0=fx.min+i/cols*(fx.max-fx.min),x1=fx.min+(i+1)/cols*(fx.max-fx.min),y0=fy.min+j/rows*(fy.max-fy.min),y1=fy.min+(j+1)/rows*(fy.max-fy.min),v=vals[k++],t=(v-mn)/(mx-mn||1);
        svg.append(svgEl("rect",{x:sx(x0),y:sy(y1),width:Math.max(1,sx(x1)-sx(x0)+.5),height:Math.max(1,sy(y0)-sy(y1)+.5),fill:heatColor(t),class:"lr-heat-cell"}));
      }
    }

    for(let i=0;i<=6;i++){
      const xv=fx.min+i/6*(fx.max-fx.min),yv=fy.min+i/6*(fy.max-fy.min),px=sx(xv),py=sy(yv);
      svg.append(svgEl("line",{x1:px,x2:px,y1:p.t,y2:H-p.b,class:"lr-gridline"}),svgEl("line",{x1:p.l,x2:W-p.r,y1:py,y2:py,class:"lr-gridline"}));
      const xt=svgEl("text",{x:px,y:H-27,"text-anchor":"middle",class:"lr-tick"});xt.textContent=formatAxis(xv);svg.append(xt);
      const yt=svgEl("text",{x:p.l-9,y:py+4,"text-anchor":"end",class:"lr-tick"});yt.textContent=formatAxis(yv);svg.append(yt);
    }
    svg.append(svgEl("line",{x1:p.l,x2:W-p.r,y1:H-p.b,y2:H-p.b,class:"lr-axis"}),svgEl("line",{x1:p.l,x2:p.l,y1:p.t,y2:H-p.b,class:"lr-axis"}));

    state.data.forEach(r=>{
      svg.append(svgEl("circle",{cx:sx(r.x1),cy:sy(r.x2),r:7,class:"lr-fuel-point"}));
      const t=svgEl("text",{x:sx(r.x1)+9,y:sy(r.x2)-7,class:"lr-fuel-label"});t.textContent=`${r.y.toFixed(1)}`;svg.append(t);
    });

    if(result&&state.queryShown){
      const x=state.query.x1,y=state.query.x2;
      const marker=svgEl("rect",{x:sx(x)-8,y:sy(y)-8,width:16,height:16,transform:`rotate(45 ${sx(x)} ${sy(y)})`,class:"lr-query-marker"});svg.append(marker);
      const t=svgEl("text",{x:sx(x)+13,y:sy(y)-10,class:"lr-fuel-label"});t.textContent=`New: ${formatTarget(predict(state.query,result))}`;svg.append(t);
    }
    box.append(svg);
  }

  /* =========================================================
     RESULTS
     ========================================================= */

  function renderResult(result,meta={}){
    state.currentResult=result;
    $("lr-intercept-result").textContent=short(result.beta[0],4);
    $("lr-coef1-result").textContent=short(result.beta[1],5);
    $("lr-coef2-result").textContent=featureCount()>1?short(result.beta[2],5):"Not used";
    $("lr-mse-result").textContent=short(result.mse,3);
    $("lr-r2-result").textContent=short(result.r2,3);
    renderPlot(result);renderResidualTable(result);renderCalculation(result,meta);updateLearn(result,meta);
  }

  function renderResidualTable(result){
    const body=$("lr-result-body");body.replaceChildren();
    result.predictions.forEach(r=>{
      const tr=document.createElement("tr");
      const vals=[r.id,...cfg().features.map((f,idx)=>formatFeature(f,r[`x${idx+1}`])),formatTarget(r.y),formatTarget(r.prediction),r.residual.toFixed(cfg().target.decimals?2:1),r.squaredError.toFixed(2)];
      vals.forEach((v,i)=>{const td=document.createElement("td");td.textContent=v;if(i===vals.length-2)td.className=r.residual>=0?"lr-residual-positive":"lr-residual-negative";tr.append(td);});body.append(tr);
    });
  }

  function equationText(result,query=null){
    if(featureCount()===1){
      const base=`ŷ = ${short(result.beta[0],3)} + ${short(result.beta[1],5)}(${cfg().features[0].label})`;
      if(!query)return base;
      return `${base}\n= ${short(result.beta[0],3)} + ${short(result.beta[1],5)}(${short(query.x1,2)})\n= ${formatTarget(predict(query,result))}`;
    }
    const base=`ŷ = ${short(result.beta[0],3)} + ${short(result.beta[1],5)}(HP) + ${short(result.beta[2],5)}(Speed)`;
    if(!query)return base;
    return `${base}\n= ${short(result.beta[0],3)} + ${short(result.beta[1],5)}(${short(query.x1,1)}) + ${short(result.beta[2],5)}(${short(query.x2,1)})\n= ${formatTarget(predict(query,result))}`;
  }

  function renderCalculation(result,meta={}){
    const out=$("lr-calculation-output");out.replaceChildren();const code=document.createElement("code");
    if(meta.frame){
      const g=meta.frame.grads||[];
      code.textContent=[`Gradient-descent step ${meta.frame.step}`,`Learning rate α = ${meta.frame.learningRate}`,"",`Current equation:`,equationText(result),"",`Gradient b₀ = ${short(g[0]??0,6)}`,`Gradient b₁ = ${short(g[1]??0,6)}`,...(featureCount()>1?[`Gradient b₂ = ${short(g[2]??0,6)}`]:[]),"",`MSE = ${short(result.mse,3)}`,`R² = ${short(result.r2,3)}`].join("\n");
    }else if(featureCount()===1){
      code.textContent=[`Exact least-squares fit`,`x̄ = ${short(result.meanX,3)}`,`ȳ = ${short(result.meanY,3)}`,"",`b₁ = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²`,`   = ${short(result.beta[1],5)}`,`b₀ = ȳ − b₁x̄ = ${short(result.beta[0],4)}`,"",equationText(result),`MSE = ${short(result.mse,3)}   R² = ${short(result.r2,3)}`].join("\n");
    }else{
      code.textContent=[`Multiple linear regression`,equationText(result),"",`The three coefficients are solved together from:`,`(XᵀX)β = Xᵀy`,"",`b₀ = ${short(result.beta[0],4)}`,`b₁ (HP) = ${short(result.beta[1],5)}`,`b₂ (Speed) = ${short(result.beta[2],5)}`,"",`MSE = ${short(result.mse,3)}   R² = ${short(result.r2,3)}`].join("\n");
    }
    out.append(code);
  }

  function clearQueryResult(){
    $("lr-query-prediction").textContent="—";
    $("lr-prediction-equation").textContent=state.currentResult?"Values changed. Press Predict New Value.":"Fit the model first.";
    $("lr-query-explanation").textContent="The learned coefficients do not change when you test a new sample. Only the new feature values are substituted into the fitted equation.";
  }

  function runPrediction(){
    if(!state.currentResult){instantFit();}
    state.queryShown=true;
    const result=state.currentResult;
    const y=predict(state.query,result);
    $("lr-query-prediction").textContent=formatTarget(y);
    $("lr-prediction-equation").textContent=equationText(result,state.query);
    const inputs=cfg().features.map((f,idx)=>`${f.label} = ${formatFeature(f,state.query[`x${idx+1}`])}`).join("; ");
    $("lr-query-explanation").textContent=`The model kept b₀${featureCount()>0?", b₁":""}${featureCount()>1?" and b₂":""} fixed and substituted the new inputs: ${inputs}. This produced ${formatTarget(y)}.`;
    $("lr-query-change-note").textContent="Now change a value and predict again to compare the result.";
    $("lr-live-step").textContent=`New prediction: ${inputs} → ${formatTarget(y)}.`;
    renderPlot(result);updateLearn(result);
  }

  function updateLearn(result=state.currentResult,meta={}){
    const title=$("lr-learn-current-title"),text=$("lr-learn-current-text");
    if(title)title.textContent=`${cfg().icon} ${cfg().title}`;
    const eq=$("lr-learn-equation");if(eq)eq.textContent=featureCount()===1?"ŷ = b₀ + b₁x":"ŷ = b₀ + b₁(HP) + b₂(Speed)";
    const c=$("lr-learn-coefs");if(c)c.textContent=featureCount()===1?"b₁ = change in output per unit of x":"b₁ = HP contribution; b₂ = Speed contribution";
    if(!result){if(text)text.textContent="Fit the model first. Then inspect training predictions before testing a new input.";return;}
    const mse=$("lr-learn-mse");if(mse)mse.textContent=`Current MSE = ${short(result.mse,3)}; R² = ${short(result.r2,3)}.`;
    const pred=$("lr-learn-prediction");if(pred)pred.textContent=state.queryShown?equationText(result,state.query).replace(/\n/g," "):"Fit complete. Scroll to Try a New Prediction and change the input values.";
    if(text)text.textContent=featureCount()===1?`Current equation: ${equationText(result)}. Review the training residuals, then try a new ${cfg().features[0].label.toLowerCase()}.`:`Current equation: ${equationText(result)}. Review the fitted vehicle predictions, then change HP and speed to estimate a new fuel-consumption value.`;
  }

  /* =========================================================
     ANIMATION
     ========================================================= */

  function renderFrame(index){
    if(!state.history.length)buildGradientHistory();
    state.frameIndex=clamp(index,0,state.history.length-1);
    const frame=state.history[state.frameIndex],total=state.history.length-1;
    $("lr-progress").style.width=`${total?state.frameIndex/total*100:0}%`;
    $("lr-step-result").textContent=`${state.frameIndex} / ${total}`;
    $("lr-prev").disabled=state.frameIndex<=0;$("lr-next").disabled=state.frameIndex>=total;
    renderResult(frame.result,{frame});
    if(frame.exact){$("lr-current-title").textContent="Exact least-squares solution";$("lr-current-explanation").textContent=featureCount()===1?"The final frame shows the exact best-fit line.":"The final frame shows the exact multiple-regression surface represented as a fuel-consumption map.";$("lr-live-step").textContent="Training complete. Review the training predictions below, then try a new prediction.";}
    else if(state.frameIndex===0){$("lr-current-title").textContent="Start with simple coefficients";$("lr-current-explanation").textContent="Gradient descent begins with small coefficients and repeatedly adjusts them to reduce mean squared error.";$("lr-live-step").textContent="Step 0: initial model. Press Next or Play Animation.";}
    else{$("lr-current-title").textContent=`Update coefficients — step ${frame.step}`;$("lr-current-explanation").textContent=`All active coefficients move in the direction that reduces MSE. Current MSE = ${short(frame.result.mse,3)}.`;$("lr-live-step").textContent=`Step ${frame.step}: MSE ${short(frame.result.mse,3)}, R² ${short(frame.result.r2,3)}.`;}
  }

  function playAnimation(){
    if(!state.history.length||state.frameIndex>=state.history.length-1){buildGradientHistory();state.frameIndex=0;renderFrame(0);}
    stopAnimation(false);state.playing=true;$("lr-play").disabled=true;$("lr-pause").disabled=false;
    const delay={slow:900,normal:480,fast:190}[$("lr-speed").value]||480;
    state.timer=setInterval(()=>{if(state.frameIndex>=state.history.length-1){stopAnimation();return;}renderFrame(state.frameIndex+1);},delay);
  }
  function stopAnimation(update=true){if(state.timer)clearInterval(state.timer);state.timer=null;state.playing=false;if(update&&$("lr-play")){$("lr-play").disabled=false;$("lr-pause").disabled=true;}}
  function pauseAnimation(){stopAnimation();$("lr-live-step").textContent=`Paused at step ${state.frameIndex}.`;}
  function instantFit(){stopAnimation();state.exactResult=calculateExact(state.data);state.queryShown=false;renderResult(state.exactResult,{exact:true});$("lr-step-result").textContent="Exact";$("lr-progress").style.width="100%";$("lr-current-title").textContent=featureCount()===1?"Exact ordinary least-squares fit":"Exact multiple linear regression fit";$("lr-current-explanation").textContent=featureCount()===1?"The model solved the best slope and intercept directly.":"The model solved intercept, HP coefficient and speed coefficient together.";$("lr-live-step").textContent="Fit complete. First inspect Training Predictions below. Then try a new prediction.";clearQueryResult();}
  function resetAnimation(){stopAnimation();state.queryShown=false;buildGradientHistory();renderFrame(0);clearQueryResult();}

  /* =========================================================
     ACTIONS
     ========================================================= */

  function switchExample(key){if(!EXAMPLES[key]||key===state.exampleKey)return;state.exampleKey=key;resetDataFromExample();renderExampleUI();renderDataTable();clearFit();renderPlot(null);$("lr-live-step").textContent=`${cfg().title} loaded. Fit the training data first.`;}

  function addSample(){
    if(state.data.length>=30)return;const c=cfg(),last=state.data[state.data.length-1],exact=calculateExact(state.data);const row={id:state.data.length+1};
    c.features.forEach((f,idx)=>{row[`x${idx+1}`]=clamp((last?.[`x${idx+1}`]??f.queryDefault)+f.step*2,f.min,f.max);});
    row.y=Number(predict(row,exact).toFixed(c.target.decimals));state.data.push(row);renderDataTable();invalidateFit("Sample added. Edit its observed output if needed, then fit again.");
  }
  function removeLast(){if(state.data.length<=4)return;state.data.pop();renderDataTable();invalidateFit("Last sample removed. Fit the model again.");}
  function addPointFromPlot(x,y){if(cfg().mode!=="simple"||state.data.length>=30)return;state.data.push({id:state.data.length+1,x1:Number(x.toFixed(2)),y:Number(y.toFixed(cfg().target.decimals))});state.addPointMode=false;$("lr-click-add").classList.remove("is-active");$("lr-click-add").textContent="＋ Click Plot to Add";renderDataTable();invalidateFit("New training point added from the plot. Fit again.");}
  function toggleClickAdd(){if(cfg().mode!=="simple")return;state.addPointMode=!state.addPointMode;$("lr-click-add").classList.toggle("is-active",state.addPointMode);$("lr-click-add").textContent=state.addPointMode?"Cancel Plot Add":"＋ Click Plot to Add";renderPlot(state.currentResult);}
  function generateNewData(){
    const c=cfg();state.data=c.data.map((row,i)=>{const out={id:i+1};c.features.forEach((f,idx)=>{const base=row[idx],noise=(Math.random()-.5)*f.step*4;out[`x${idx+1}`]=Number(clamp(base+noise,f.min,f.max).toFixed(f.step<1?1:0));});const targetBase=row[c.features.length],scale=c.target.decimals?.8:10;out.y=Number((targetBase+(Math.random()-.5)*scale*2).toFixed(c.target.decimals));return out;});renderDataTable();invalidateFit("New synthetic training examples generated. Fit the model again.");
  }
  function restoreDataset(){resetDataFromExample();renderExampleUI();renderDataTable();clearFit();renderPlot(null);$("lr-live-step").textContent="Original dataset restored. Fit the training data first.";}

  function invalidateFit(message){stopAnimation();state.currentResult=null;state.exactResult=calculateExact(state.data);state.history=[];state.frameIndex=0;state.queryShown=false;clearFit();renderPlot(null);$("lr-live-step").textContent=message;}
  function clearFit(){
    ["lr-intercept-result","lr-coef1-result","lr-mse-result","lr-r2-result"].forEach(id=>$(id).textContent="—");$("lr-coef2-result").textContent=featureCount()>1?"—":"Not used";$("lr-step-result").textContent=`0 / ${$("lr-animation-steps")?.value||40}`;$("lr-progress").style.width="0%";$("lr-result-body").replaceChildren();$("lr-current-title").textContent="Ready to fit the model";$("lr-current-explanation").textContent=featureCount()===1?"The model will learn an intercept and one slope.":"The fuel model will learn an intercept plus separate HP and speed coefficients.";$("lr-calculation-output").innerHTML="<p>Run the model or start the animation to see the calculation.</p>";$("lr-prev").disabled=true;$("lr-next").disabled=false;clearQueryResult();updateLearn(null);
  }

  /* =========================================================
     EVENTS + INIT
     ========================================================= */

  function bindEvents(){
    document.querySelectorAll("[data-lr-example]").forEach(b=>b.addEventListener("click",()=>switchExample(b.dataset.lrExample)));
    $("lr-run").addEventListener("click",instantFit);$("lr-play").addEventListener("click",playAnimation);$("lr-pause").addEventListener("click",pauseAnimation);
    $("lr-prev").addEventListener("click",()=>{stopAnimation();if(!state.history.length)buildGradientHistory();renderFrame(state.frameIndex-1);});
    $("lr-next").addEventListener("click",()=>{stopAnimation();if(!state.history.length)buildGradientHistory();renderFrame(state.frameIndex+1);});
    $("lr-reset-animation").addEventListener("click",resetAnimation);
    $("lr-learning-rate").addEventListener("change",()=>{state.history=[];state.frameIndex=0;$("lr-live-step").textContent="Learning rate changed. Restart the animation.";});
    $("lr-animation-steps").addEventListener("change",()=>{state.history=[];state.frameIndex=0;clearFit();renderPlot(null);});
    $("lr-speed").addEventListener("change",()=>{if(state.playing)playAnimation();});
    $("lr-show-residuals").addEventListener("change",e=>{state.showResiduals=e.target.checked;renderPlot(state.currentResult);});
    $("lr-generate").addEventListener("click",generateNewData);$("lr-reset-data").addEventListener("click",restoreDataset);$("lr-add-sample").addEventListener("click",addSample);$("lr-remove-sample").addEventListener("click",removeLast);$("lr-click-add").addEventListener("click",toggleClickAdd);$("lr-predict").addEventListener("click",runPrediction);
  }

  function init(){buildUI();buildLearnUI();injectStyles();resetDataFromExample();renderExampleUI();renderDataTable();clearFit();renderPlot(null);bindEvents();}
  init();

  return {run:instantFit,reset:restoreDataset,play:playAnimation,pause:pauseAnimation};
})();
