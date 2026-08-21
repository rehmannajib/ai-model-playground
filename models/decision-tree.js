"use strict";

/* =========================================================
   AI MODEL PLAYGROUND — DECISION TREE
   Interactive examples:
   1) Car vs Motorbike
   2) Phone Category
   3) Loan Approval (synthetic educational example only)

   This replacement is self-contained. It rebuilds only
   #tree-playground and #tree-learn, so the other models are
   left untouched.
========================================================= */

const DecisionTree = (() => {
  const $ = id => document.getElementById(id);

  const EXAMPLES = {
    vehicle: {
      id: "vehicle",
      icon: "🚗",
      title: "Car vs Motorbike",
      short: "Car vs Motorbike",
      description: "Use physical and performance features to learn how a tree separates cars from motorbikes.",
      classes: ["Car", "Motorbike"],
      classIcons: { Car: "🚗", Motorbike: "🏍️" },
      classCss: { Car: "class-a", Motorbike: "class-b" },
      features: [
        { key: "weight", label: "Vehicle Weight", unit: "kg", min: 80, max: 2200, step: 10, default: 430 },
        { key: "width", label: "Vehicle Width", unit: "cm", min: 60, max: 210, step: 1, default: 112 },
        { key: "hp", label: "Engine Power", unit: "HP", min: 10, max: 450, step: 5, default: 95 },
        { key: "seats", label: "Number of Seats", unit: "", min: 1, max: 7, step: 1, default: 2 }
      ],
      samples: [
        { weight: 920, width: 165, hp: 82, seats: 4, label: "Car" },
        { weight: 1120, width: 174, hp: 115, seats: 5, label: "Car" },
        { weight: 1410, width: 181, hp: 155, seats: 5, label: "Car" },
        { weight: 1540, width: 188, hp: 310, seats: 2, label: "Car" },
        { weight: 1830, width: 196, hp: 225, seats: 5, label: "Car" },
        { weight: 510, width: 149, hp: 28, seats: 2, label: "Car" },
        { weight: 118, width: 70, hp: 14, seats: 2, label: "Motorbike" },
        { weight: 155, width: 76, hp: 32, seats: 2, label: "Motorbike" },
        { weight: 192, width: 79, hp: 118, seats: 2, label: "Motorbike" },
        { weight: 275, width: 91, hp: 138, seats: 2, label: "Motorbike" },
        { weight: 325, width: 98, hp: 88, seats: 2, label: "Motorbike" },
        { weight: 430, width: 158, hp: 75, seats: 2, label: "Motorbike" }
      ],
      sampleDefaults: { weight: 430, width: 112, hp: 95, seats: 2 }
    },

    phone: {
      id: "phone",
      icon: "📱",
      title: "Phone Category",
      short: "Phone Category",
      description: "A multi-class example where the tree discovers rules for Budget, Mid-range and Premium phones.",
      classes: ["Budget", "Mid-range", "Premium"],
      classIcons: { Budget: "💵", "Mid-range": "📱", Premium: "✨" },
      classCss: { Budget: "class-a", "Mid-range": "class-c", Premium: "class-b" },
      features: [
        { key: "ram", label: "RAM", unit: "GB", min: 2, max: 16, step: 1, default: 8 },
        { key: "battery", label: "Battery", unit: "mAh", min: 2500, max: 6500, step: 100, default: 4800 },
        { key: "camera", label: "Camera", unit: "MP", min: 8, max: 200, step: 1, default: 64 },
        { key: "storage", label: "Storage", unit: "GB", min: 32, max: 512, step: 32, default: 256 }
      ],
      samples: [
        { ram: 3, battery: 3400, camera: 13, storage: 64, label: "Budget" },
        { ram: 4, battery: 4100, camera: 48, storage: 64, label: "Budget" },
        { ram: 4, battery: 5000, camera: 50, storage: 128, label: "Budget" },
        { ram: 6, battery: 4500, camera: 50, storage: 128, label: "Budget" },
        { ram: 6, battery: 5000, camera: 64, storage: 128, label: "Mid-range" },
        { ram: 8, battery: 4600, camera: 64, storage: 128, label: "Mid-range" },
        { ram: 8, battery: 5000, camera: 108, storage: 256, label: "Mid-range" },
        { ram: 12, battery: 4800, camera: 108, storage: 256, label: "Mid-range" },
        { ram: 8, battery: 5200, camera: 50, storage: 256, label: "Mid-range" },
        { ram: 12, battery: 5000, camera: 200, storage: 256, label: "Premium" },
        { ram: 12, battery: 5100, camera: 200, storage: 512, label: "Premium" },
        { ram: 16, battery: 5400, camera: 200, storage: 512, label: "Premium" },
        { ram: 16, battery: 4800, camera: 108, storage: 512, label: "Premium" },
        { ram: 12, battery: 4500, camera: 200, storage: 512, label: "Premium" }
      ],
      sampleDefaults: { ram: 8, battery: 4800, camera: 64, storage: 256 }
    },

    loan: {
      id: "loan",
      icon: "🏦",
      title: "Loan Approval",
      short: "Loan Approval",
      description: "A synthetic classroom example that demonstrates binary tree decisions. It is not a real lending model or lending recommendation.",
      classes: ["Approved", "Not Approved"],
      classIcons: { Approved: "✓", "Not Approved": "×" },
      classCss: { Approved: "class-a", "Not Approved": "class-b" },
      features: [
        { key: "income", label: "Monthly Income", unit: "$", min: 1000, max: 12000, step: 250, default: 4500, unitBefore: true },
        { key: "credit", label: "Credit Score", unit: "", min: 300, max: 850, step: 10, default: 690 },
        { key: "debt", label: "Existing Debt", unit: "%", min: 0, max: 80, step: 1, default: 32 },
        { key: "employment", label: "Employment Years", unit: "years", min: 0, max: 30, step: 1, default: 4 }
      ],
      samples: [
        { income: 2600, credit: 590, debt: 48, employment: 2, label: "Not Approved" },
        { income: 3100, credit: 630, debt: 42, employment: 3, label: "Not Approved" },
        { income: 4200, credit: 610, debt: 55, employment: 6, label: "Not Approved" },
        { income: 5200, credit: 650, debt: 46, employment: 5, label: "Not Approved" },
        { income: 6800, credit: 620, debt: 58, employment: 9, label: "Not Approved" },
        { income: 3600, credit: 705, debt: 31, employment: 4, label: "Approved" },
        { income: 4500, credit: 690, debt: 27, employment: 5, label: "Approved" },
        { income: 5100, credit: 735, debt: 34, employment: 7, label: "Approved" },
        { income: 6200, credit: 720, debt: 38, employment: 8, label: "Approved" },
        { income: 7600, credit: 780, debt: 25, employment: 11, label: "Approved" },
        { income: 8800, credit: 670, debt: 29, employment: 12, label: "Approved" },
        { income: 3900, credit: 760, debt: 52, employment: 1, label: "Not Approved" }
      ],
      sampleDefaults: { income: 4500, credit: 690, debt: 32, employment: 4 }
    }
  };

  let currentExample = "vehicle";
  let data = [];
  let tree = null;
  let events = [];
  let currentStep = -1;
  let playTimer = null;
  let predictionPath = [];
  let predictionIndex = -1;
  let predictionTimer = null;
  let generatedVersion = 0;

  function config() {
    return EXAMPLES[currentExample];
  }

  function injectStyles() {
    if ($("decision-tree-enhanced-styles")) return;

    const style = document.createElement("style");
    style.id = "decision-tree-enhanced-styles";
    style.textContent = `
      #tree-playground .dt-example-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}
      #tree-playground .dt-example-btn{border:1px solid var(--border,#d9e1ea);background:#fff;border-radius:10px;padding:14px 16px;text-align:left;cursor:pointer;transition:.18s ease;color:inherit}
      #tree-playground .dt-example-btn:hover{transform:translateY(-1px);border-color:#9bb7cd}
      #tree-playground .dt-example-btn.active{border-color:#3f7cac;background:#f1f7fb;box-shadow:0 0 0 2px rgba(63,124,172,.08)}
      #tree-playground .dt-example-btn strong{display:block;font-size:clamp(15px,1.1vw,18px);margin-bottom:4px}
      #tree-playground .dt-example-btn span{display:block;color:#667085;font-size:clamp(12px,.88vw,14px);line-height:1.45}
      #tree-playground .dt-note{margin:0 0 16px;padding:12px 14px;border-radius:8px;background:#f8fafc;border:1px solid #e5eaf0;color:#667085;font-size:clamp(12.5px,.9vw,14.5px);line-height:1.55}
      #tree-playground .dt-config-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:end}
      #tree-playground .dt-config-grid label,#tree-playground .dt-input-field{display:grid;gap:7px;font-weight:650;color:#344054}
      #tree-playground select,#tree-playground input[type="number"]{width:100%}
      #tree-playground .dt-card{padding:20px}
      #tree-playground .dt-layout{display:grid;grid-template-columns:1fr;gap:16px;margin-top:16px;align-items:start}
      #tree-playground .dt-panel-head{display:flex;gap:11px;align-items:flex-start;justify-content:space-between;margin-bottom:13px}
      #tree-playground .dt-panel-head h3{margin:0 0 4px}
      #tree-playground .dt-panel-head p{margin:0;color:#667085}
      #tree-playground .dt-table-wrap{overflow:auto;max-height:420px}
      #tree-playground .dt-table{width:100%;border-collapse:collapse;min-width:620px}
      #tree-playground .dt-table th,#tree-playground .dt-table td{padding:9px;border-bottom:1px solid #edf0f3;text-align:left;vertical-align:middle}
      #tree-playground .dt-table th{position:sticky;top:0;background:#f8fafc;z-index:1;font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:.035em}
      #tree-playground .dt-table input,#tree-playground .dt-table select{min-width:84px;padding:7px 8px}
      #tree-playground .dt-sample-controls{display:grid;gap:13px}
      #tree-playground .dt-slider-row{display:grid;grid-template-columns:minmax(118px,.7fr) 1.4fr 92px;gap:10px;align-items:center}
      #tree-playground .dt-slider-row label{font-weight:650;color:#344054}
      #tree-playground .dt-slider-row input[type="range"]{width:100%}
      #tree-playground .dt-slider-value{font-variant-numeric:tabular-nums;text-align:right;font-weight:750;color:#1d2939}
      #tree-playground .dt-tree-card{margin-top:16px;padding:20px}
      #tree-playground .dt-tree-stage{width:100%;min-height:390px;overflow:auto;border:1px solid #e3e8ef;border-radius:10px;background:linear-gradient(180deg,#fbfdff,#f7fafc);padding:18px}
      #tree-playground .dt-tree-svg{display:block;width:100%;min-width:760px;height:auto;min-height:350px}
      #tree-playground .dt-edge{stroke:#aebdca;stroke-width:2;fill:none}
      #tree-playground .dt-edge-label{font-size:11px;font-weight:750;fill:#667085}
      #tree-playground .dt-node rect{fill:#fff;stroke:#9eb3c4;stroke-width:1.6;rx:10}
      #tree-playground .dt-node.split rect{fill:#f8fbfd;stroke:#3f7cac}
      #tree-playground .dt-node.leaf rect{fill:#fff;stroke:#b4c0cc}
      #tree-playground .dt-node.active rect{stroke:#111827;stroke-width:3;filter:drop-shadow(0 3px 6px rgba(15,23,42,.12))}
      #tree-playground .dt-node-path rect{stroke:#111827!important;stroke-width:3!important}
      #tree-playground .dt-node-title{font-size:12.5px;font-weight:800;fill:#1d2939}
      #tree-playground .dt-node-sub{font-size:10.5px;fill:#667085}
      #tree-playground .dt-node-result{font-size:12px;font-weight:800;fill:#1d2939}
      #tree-playground .dt-hidden-node{opacity:.14}
      #tree-playground .dt-animation-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}
      #tree-playground .dt-speed{display:flex;align-items:center;gap:8px;margin-left:auto;color:#667085;font-size:13px}
      #tree-playground .dt-speed select{width:auto;min-width:90px}
      #tree-playground .dt-metrics{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:12px}
      #tree-playground .dt-metric{padding:11px 12px;border:1px solid #e5eaf0;border-radius:9px;background:#fff}
      #tree-playground .dt-metric span{display:block;color:#667085;font-size:12px;margin-bottom:3px}
      #tree-playground .dt-metric strong{font-size:clamp(15px,1.15vw,19px);color:#1d2939}
      #tree-playground .dt-live{margin-top:12px;padding:13px 15px;border-radius:9px;background:#eef6fb;border:1px solid #d8e8f3;line-height:1.55;color:#344054}
      #tree-playground .dt-analysis-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
      #tree-playground .dt-candidate-table{width:100%;border-collapse:collapse}
      #tree-playground .dt-candidate-table th,#tree-playground .dt-candidate-table td{padding:8px;border-bottom:1px solid #edf0f3;text-align:left;font-size:13px}
      #tree-playground .dt-candidate-table th{color:#667085;font-size:11.5px;text-transform:uppercase}
      #tree-playground .dt-candidate-table tr.best{background:#f1f8f4}
      #tree-playground .dt-calc{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;line-height:1.65;font-size:13px;color:#344054;background:#f8fafc;border-radius:8px;padding:13px;min-height:175px}
      #tree-playground .dt-prediction-lab{margin-top:16px;padding:20px}
      #tree-playground .dt-prediction-grid{display:grid;grid-template-columns:minmax(330px,.82fr) minmax(0,1.18fr);gap:18px;align-items:stretch}
      #tree-playground .dt-query-panel,#tree-playground .dt-result-panel{border:1px solid #e3e8ef;border-radius:12px;background:#fbfdff;padding:18px}
      #tree-playground .dt-query-summary{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 4px}
      #tree-playground .dt-query-chip{display:inline-flex;align-items:center;gap:5px;padding:6px 9px;border:1px solid #dce5ee;border-radius:999px;background:#fff;color:#475467;font-size:12.5px;font-weight:700}
      #tree-playground .dt-prediction-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px}
      #tree-playground .dt-result-box{display:grid;place-items:center;text-align:center;min-height:154px;border:1px dashed #cbd5df;border-radius:10px;background:#fff;padding:16px;margin-bottom:14px}
      #tree-playground .dt-prediction-help{margin:0 0 14px;color:#667085;font-size:13px;line-height:1.55}
      #tree-playground .dt-result-box .icon{font-size:36px;margin-bottom:7px}
      #tree-playground .dt-result-box strong{font-size:clamp(20px,1.8vw,30px)}
      #tree-playground .dt-path-list{display:grid;gap:8px;margin:0;padding:0;list-style:none}
      #tree-playground .dt-path-list li{padding:9px 11px;border:1px solid #e5eaf0;border-radius:8px;background:#fff;color:#475467}
      #tree-playground .dt-class-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 8px;border-radius:999px;font-weight:750;font-size:12px;background:#f2f4f7;color:#344054}
      #tree-playground .dt-class-pill.class-a{background:#ecfdf3;color:#067647}
      #tree-playground .dt-class-pill.class-b{background:#fff1f3;color:#c01048}
      #tree-playground .dt-class-pill.class-c{background:#eef4ff;color:#3538cd}
      #tree-playground .dt-footer-warning{margin-top:10px;color:#667085;font-size:12px;line-height:1.5}
      #tree-learn .dt-dynamic-math{margin-top:14px;padding:12px 14px;border:1px solid #e5eaf0;border-radius:8px;background:#f8fafc;white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;line-height:1.6}
      @media(max-width:980px){
        #tree-playground .dt-layout,#tree-playground .dt-analysis-grid,#tree-playground .dt-prediction-grid{grid-template-columns:1fr}
        #tree-playground .dt-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}
      }
      @media(max-width:720px){
        #tree-playground .dt-example-tabs,#tree-playground .dt-config-grid{grid-template-columns:1fr}
        #tree-playground .dt-slider-row{grid-template-columns:1fr;gap:5px}
        #tree-playground .dt-slider-value{text-align:left}
        #tree-playground .dt-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
        #tree-playground .dt-speed{width:100%;margin-left:0}
        #tree-playground .dt-tree-stage{min-height:320px;padding:10px}
      }
    `;
    document.head.append(style);
  }

  function buildPlaygroundMarkup() {
    const root = $("tree-playground");
    if (!root) return;

    root.innerHTML = `
      <div class="heading">
        <span class="label">Decision Tree Playground</span>
        <h2>Watch a decision tree grow, one split at a time</h2>
        <p>Choose a real-world example, edit the labelled training data, compare Gini or Entropy, and follow a new sample through the learned tree.</p>
      </div>

      <div class="dt-example-tabs" aria-label="Decision Tree examples">
        <button class="dt-example-btn active" type="button" data-dt-example="vehicle">
          <strong>🚗 Car vs Motorbike</strong>
          <span>Binary classification using weight, width, engine power and seats.</span>
        </button>
        <button class="dt-example-btn" type="button" data-dt-example="phone">
          <strong>📱 Phone Category</strong>
          <span>Multi-class classification: Budget, Mid-range or Premium.</span>
        </button>
        <button class="dt-example-btn" type="button" data-dt-example="loan">
          <strong>🏦 Loan Approval</strong>
          <span>Synthetic educational example: Approved or Not Approved.</span>
        </button>
      </div>

      <p class="dt-note" id="dt-example-note"></p>

      <section class="card dt-card">
        <div class="dt-config-grid">
          <label>
            Split Criterion
            <select id="dt-criterion">
              <option value="gini" selected>Gini Impurity</option>
              <option value="entropy">Entropy</option>
            </select>
          </label>
          <label>
            Maximum Depth
            <select id="dt-max-depth">
              <option value="2">2 levels</option>
              <option value="3" selected>3 levels</option>
              <option value="4">4 levels</option>
            </select>
          </label>
          <div class="actions">
            <button id="dt-generate" class="btn" type="button">Generate New Examples</button>
            <button id="dt-restore" class="btn" type="button">Restore Dataset</button>
          </div>
        </div>
      </section>

      <div class="dt-layout">
        <section class="card dt-card">
          <div class="dt-panel-head">
            <div>
              <span class="label">Training Data</span>
              <h3 id="dt-dataset-title">Labelled Examples</h3>
              <p>Edit any value and the tree will recalculate.</p>
            </div>
            <span id="dt-sample-count" class="dt-class-pill">0 samples</span>
          </div>
          <div class="dt-table-wrap">
            <table class="dt-table">
              <thead id="dt-data-head"></thead>
              <tbody id="dt-data-body"></tbody>
            </table>
          </div>
        </section>
      </div>

      <section class="card dt-tree-card">
        <div class="dt-panel-head">
          <div>
            <span class="label">Tree Visualization</span>
            <h3>How the decision tree grows</h3>
            <p>Each step reveals the best split or a final leaf. During prediction, the selected path is highlighted.</p>
          </div>
        </div>
        <div id="dt-tree-stage" class="dt-tree-stage"></div>

        <div class="dt-animation-bar">
          <button id="dt-instant" class="btn primary" type="button">Instant Result</button>
          <button id="dt-play" class="btn" type="button">▶ Play</button>
          <button id="dt-pause" class="btn" type="button">Pause</button>
          <button id="dt-prev" class="btn" type="button">← Previous</button>
          <button id="dt-next" class="btn" type="button">Next →</button>
          <button id="dt-reset-animation" class="btn" type="button">Reset Animation</button>
          <label class="dt-speed">Speed
            <select id="dt-speed">
              <option value="1300">Slow</option>
              <option value="800" selected>Normal</option>
              <option value="420">Fast</option>
            </select>
          </label>
        </div>

        <div class="dt-metrics">
          <div class="dt-metric"><span>Step</span><strong id="dt-step-metric">0 / 0</strong></div>
          <div class="dt-metric"><span>Samples</span><strong id="dt-samples-metric">0</strong></div>
          <div class="dt-metric"><span>Tree Depth</span><strong id="dt-depth-metric">—</strong></div>
          <div class="dt-metric"><span>Current Impurity</span><strong id="dt-impurity-metric">—</strong></div>
          <div class="dt-metric"><span>Information Gain</span><strong id="dt-gain-metric">—</strong></div>
        </div>

        <div id="dt-live" class="dt-live">Ready. Choose an example and press Play, Next, or Instant Result.</div>
      </section>

      <div class="dt-analysis-grid">
        <section class="card dt-card">
          <div class="dt-panel-head">
            <div>
              <span class="label">Candidate Splits</span>
              <h3>Which split is best?</h3>
              <p>The current node compares possible thresholds and selects the largest information gain.</p>
            </div>
          </div>
          <div class="dt-table-wrap" style="max-height:330px">
            <table class="dt-candidate-table">
              <thead><tr><th>Feature</th><th>Threshold</th><th>After Split</th><th>Gain</th></tr></thead>
              <tbody id="dt-candidate-body"><tr><td colspan="4">Start the animation to compare splits.</td></tr></tbody>
            </table>
          </div>
        </section>

        <section class="card dt-card">
          <div class="dt-panel-head">
            <div>
              <span class="label">Live Calculation</span>
              <h3 id="dt-calc-title">Gini calculation</h3>
              <p>The numbers below come from the current node in your dataset.</p>
            </div>
          </div>
          <div id="dt-calculation" class="dt-calc">Start the animation to see the mathematics.</div>
        </section>
      </div>

      <section class="card dt-prediction-lab">
        <div class="dt-panel-head">
          <div>
            <span class="label">Test The Learned Tree</span>
            <h3>Run a prediction with your own sample</h3>
            <p>Set the values below and run the sample through the learned tree. You do not need to play the training animation first — prediction will reveal the completed tree automatically.</p>
          </div>
        </div>

        <div class="dt-prediction-grid">
          <div class="dt-query-panel">
            <span class="label">New Sample</span>
            <h3 id="dt-new-sample-title">Create a Vehicle</h3>
            <p class="dt-prediction-help">Move the sliders to create a test sample. The values are not added to the training data.</p>
            <div id="dt-sample-controls" class="dt-sample-controls"></div>
            <div id="dt-query-summary" class="dt-query-summary" aria-live="polite"></div>
            <div class="dt-prediction-actions">
              <button id="dt-classify" class="btn primary" type="button">▶ Run Prediction</button>
              <button id="dt-predict-instant" class="btn" type="button">Instant Result</button>
            </div>
            <p id="dt-loan-warning" class="dt-footer-warning" hidden>This is a synthetic educational illustration only. It must not be used for real lending, eligibility or credit decisions.</p>
          </div>

          <div class="dt-result-panel">
            <div id="dt-result-box" class="dt-result-box">
              <div>
                <div class="icon">?</div>
                <span class="label">Prediction</span>
                <strong>Choose values and run</strong>
              </div>
            </div>
            <span class="label">Decision Path</span>
            <h3>Why did the tree choose this class?</h3>
            <ul id="dt-path-list" class="dt-path-list">
              <li>Choose the test values on the left and press “Run Prediction”.</li>
            </ul>
          </div>
        </div>
      </section>
    `;
  }

  function buildLearnMarkup() {
    const root = $("tree-learn");
    if (!root) return;

    root.innerHTML = `
      <div class="wrap">
        <div class="heading">
          <span class="label">Learn Decision Trees</span>
          <h2>How does a decision tree choose its questions?</h2>
          <p>The tree tests feature thresholds, measures impurity, chooses the strongest split, and repeats until a stopping rule creates a leaf.</p>
        </div>

        <div class="tabs model-learn-tabs">
          <button class="tab active" data-learn-tab="beginner">Beginner</button>
          <button class="tab" data-learn-tab="math">Mathematics</button>
          <button class="tab" data-learn-tab="process">Tree Process</button>
        </div>

        <div class="learn-panel" data-learn-panel="beginner">
          <div class="learn-grid">
            <article><b>1</b><h3>Start with labelled examples</h3><p>Each row has feature values and a known class.</p></article>
            <article><b>2</b><h3>Try questions</h3><p>The tree tests questions such as “Weight ≤ 470 kg?” or “RAM ≤ 10 GB?”.</p></article>
            <article><b>3</b><h3>Measure impurity</h3><p>Gini or Entropy measures how mixed the classes are.</p></article>
            <article><b>4</b><h3>Choose the best split</h3><p>The question that reduces impurity the most becomes the node.</p></article>
            <article><b>5</b><h3>Grow more branches</h3><p>The same search is repeated separately on each child group.</p></article>
            <article><b>6</b><h3>Reach a leaf</h3><p>A leaf predicts the most common class among the samples that reach it.</p></article>
          </div>
        </div>

        <div class="learn-panel" data-learn-panel="math" hidden>
          <div class="math-grid">
            <article><h3>Gini Impurity</h3><p class="equation">Gini = 1 − Σ pᵢ²</p></article>
            <article><h3>Entropy</h3><p class="equation">H = −Σ pᵢ log₂(pᵢ)</p></article>
            <article><h3>Weighted Child Impurity</h3><p class="equation">Ichild = (nL/n)IL + (nR/n)IR</p></article>
            <article><h3>Information Gain</h3><p class="equation">Gain = Iparent − Ichild</p></article>
          </div>
          <div id="dt-learn-dynamic-math" class="dt-dynamic-math">Run the Decision Tree animation to populate this section with the current experiment.</div>
        </div>

        <div class="learn-panel" data-learn-panel="process" hidden>
          <div class="process-grid">
            <article><strong>Dataset</strong><span>Labelled examples</span></article><span>→</span>
            <article><strong>Candidate Splits</strong><span>Try feature thresholds</span></article><span>→</span>
            <article><strong>Impurity</strong><span>Gini or Entropy</span></article><span>→</span>
            <article><strong>Best Split</strong><span>Largest information gain</span></article><span>→</span>
            <article><strong>Leaves</strong><span>Final class prediction</span></article>
          </div>
        </div>
      </div>
    `;
  }

  function featureByKey(key) {
    return config().features.find(feature => feature.key === key);
  }

  function formatFeatureValue(feature, value) {
    const rounded = Number.isInteger(feature.step) ? Math.round(value) : Number(value.toFixed(2));
    const localized = Math.abs(rounded) >= 1000 ? rounded.toLocaleString() : String(rounded);
    if (!feature.unit) return localized;
    if (feature.unitBefore) return `${feature.unit}${localized}`;
    return `${localized} ${feature.unit}`;
  }

  function formatThreshold(featureKey, value) {
    const feature = featureByKey(featureKey);
    return feature ? formatFeatureValue(feature, value) : Number(value).toFixed(2);
  }

  function cloneBaseSamples() {
    return config().samples.map((row, index) => ({ id: index + 1, ...row }));
  }

  function jitterValue(value, feature, amount = 0.055) {
    const range = feature.max - feature.min;
    const jitter = (Math.random() * 2 - 1) * range * amount;
    const raw = value + jitter;
    const stepped = Math.round(raw / feature.step) * feature.step;
    return Math.min(feature.max, Math.max(feature.min, stepped));
  }

  function generateExamples() {
    generatedVersion += 1;
    data = config().samples.map((row, index) => {
      const result = { id: index + 1, label: row.label };
      config().features.forEach(feature => {
        result[feature.key] = jitterValue(row[feature.key], feature);
      });
      return result;
    });
    renderDataTable();
    rebuildTreeModel();
    setLive(`Generated a fresh ${config().title} dataset. The labels stay the same while the feature values vary slightly.`);
  }

  function restoreDataset() {
    generatedVersion = 0;
    data = cloneBaseSamples();
    renderDataTable();
    rebuildTreeModel();
    setLive(`Restored the original ${config().title} training examples.`);
  }

  function classCounts(rows) {
    const counts = {};
    config().classes.forEach(label => { counts[label] = 0; });
    rows.forEach(row => {
      counts[row.label] = (counts[row.label] || 0) + 1;
    });
    return counts;
  }

  function majorityLabel(rows) {
    const counts = classCounts(rows);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || config().classes[0];
  }

  function impurity(rows, criterion = $("dt-criterion")?.value || "gini") {
    if (!rows.length) return 0;
    const counts = classCounts(rows);
    const probabilities = Object.values(counts).filter(Boolean).map(value => value / rows.length);
    if (criterion === "entropy") {
      return -probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0);
    }
    return 1 - probabilities.reduce((sum, p) => sum + p * p, 0);
  }

  function candidateThresholds(rows, featureKey) {
    const values = [...new Set(rows.map(row => Number(row[featureKey])))].sort((a, b) => a - b);
    const thresholds = [];
    for (let i = 0; i < values.length - 1; i += 1) {
      thresholds.push((values[i] + values[i + 1]) / 2);
    }
    return thresholds;
  }

  function evaluateCandidate(rows, featureKey, threshold) {
    const left = rows.filter(row => Number(row[featureKey]) <= threshold);
    const right = rows.filter(row => Number(row[featureKey]) > threshold);
    if (!left.length || !right.length) return null;

    const parent = impurity(rows);
    const leftImpurity = impurity(left);
    const rightImpurity = impurity(right);
    const weighted = (left.length / rows.length) * leftImpurity + (right.length / rows.length) * rightImpurity;

    return {
      feature: featureKey,
      threshold,
      left,
      right,
      parentImpurity: parent,
      leftImpurity,
      rightImpurity,
      weightedImpurity: weighted,
      gain: parent - weighted
    };
  }

  function allCandidates(rows) {
    const candidates = [];
    config().features.forEach(feature => {
      candidateThresholds(rows, feature.key).forEach(threshold => {
        const result = evaluateCandidate(rows, feature.key, threshold);
        if (result) candidates.push(result);
      });
    });
    return candidates.sort((a, b) => b.gain - a.gain);
  }

  function isPure(rows) {
    return Object.values(classCounts(rows)).filter(count => count > 0).length <= 1;
  }

  function buildTree(rows, depth, maxDepth, parentId = null, branch = null) {
    const nodeId = `n${Math.random().toString(36).slice(2, 9)}`;
    const node = {
      id: nodeId,
      parentId,
      branch,
      depth,
      rows,
      counts: classCounts(rows),
      prediction: majorityLabel(rows),
      impurity: impurity(rows),
      type: "leaf",
      revealStep: events.length,
      left: null,
      right: null
    };

    const stopForDepth = depth >= maxDepth;
    const stopForSize = rows.length < 3;
    const stopForPurity = isPure(rows);

    if (stopForDepth || stopForSize || stopForPurity) {
      let reason = "Stopping rule reached";
      if (stopForPurity) reason = "Node is pure";
      else if (stopForDepth) reason = "Maximum depth reached";
      else if (stopForSize) reason = "Too few samples to split";

      events.push({
        type: "leaf",
        node,
        reason,
        rows,
        impurity: node.impurity
      });
      return node;
    }

    const candidates = allCandidates(rows);
    const best = candidates[0];

    if (!best || best.gain <= 1e-10) {
      events.push({
        type: "leaf",
        node,
        reason: "No split improves impurity",
        rows,
        impurity: node.impurity
      });
      return node;
    }

    node.type = "split";
    node.feature = best.feature;
    node.threshold = best.threshold;
    node.gain = best.gain;
    node.weightedImpurity = best.weightedImpurity;
    node.leftImpurity = best.leftImpurity;
    node.rightImpurity = best.rightImpurity;
    node.candidates = candidates;

    events.push({
      type: "split",
      node,
      candidates,
      best,
      rows,
      impurity: node.impurity
    });

    node.left = buildTree(best.left, depth + 1, maxDepth, node.id, "≤");
    node.right = buildTree(best.right, depth + 1, maxDepth, node.id, ">");
    return node;
  }

  function treeDepth(node) {
    if (!node) return 0;
    if (node.type === "leaf") return node.depth;
    return Math.max(treeDepth(node.left), treeDepth(node.right));
  }

  function rebuildTreeModel() {
    stopAllTimers();
    predictionPath = [];
    predictionIndex = -1;
    events = [];
    currentStep = -1;
    const maxDepth = Number.parseInt($("dt-max-depth")?.value || "3", 10);
    tree = buildTree(data, 0, maxDepth);
    renderAll();
  }

  function renderExampleUI() {
    const cfg = config();
    document.querySelectorAll("#tree-playground [data-dt-example]").forEach(button => {
      button.classList.toggle("active", button.dataset.dtExample === currentExample);
    });

    $("dt-example-note").textContent = cfg.description;
    $("dt-dataset-title").textContent = `${cfg.icon} ${cfg.title} — Labelled Examples`;
    $("dt-new-sample-title").textContent = currentExample === "vehicle"
      ? "Create a Vehicle"
      : currentExample === "phone"
        ? "Configure a Phone"
        : "Create a Synthetic Applicant";
    $("dt-loan-warning").hidden = currentExample !== "loan";
    renderSampleControls();
  }

  function renderDataTable() {
    const head = $("dt-data-head");
    const body = $("dt-data-body");
    if (!head || !body) return;

    head.replaceChildren();
    body.replaceChildren();

    const headerRow = document.createElement("tr");
    ["ID", ...config().features.map(feature => feature.label), "Class"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.append(th);
    });
    head.append(headerRow);

    data.forEach(row => {
      const tr = document.createElement("tr");
      const id = document.createElement("td");
      id.textContent = row.id;
      tr.append(id);

      config().features.forEach(feature => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.min = feature.min;
        input.max = feature.max;
        input.step = feature.step;
        input.value = row[feature.key];
        input.setAttribute("aria-label", `${feature.label} for sample ${row.id}`);
        input.addEventListener("change", () => {
          const value = Number.parseFloat(input.value);
          if (!Number.isFinite(value)) {
            input.value = row[feature.key];
            return;
          }
          row[feature.key] = Math.min(feature.max, Math.max(feature.min, value));
          input.value = row[feature.key];
          rebuildTreeModel();
        });
        td.append(input);
        tr.append(td);
      });

      const classTd = document.createElement("td");
      const select = document.createElement("select");
      config().classes.forEach(label => {
        const option = document.createElement("option");
        option.value = label;
        option.textContent = `${config().classIcons[label] || ""} ${label}`.trim();
        option.selected = row.label === label;
        select.append(option);
      });
      select.addEventListener("change", () => {
        row.label = select.value;
        rebuildTreeModel();
      });
      classTd.append(select);
      tr.append(classTd);
      body.append(tr);
    });

    $("dt-sample-count").textContent = `${data.length} samples`;
  }

  function renderSampleControls() {
    const container = $("dt-sample-controls");
    if (!container) return;
    container.replaceChildren();

    config().features.forEach(feature => {
      const row = document.createElement("div");
      row.className = "dt-slider-row";

      const label = document.createElement("label");
      label.htmlFor = `dt-query-${feature.key}`;
      label.textContent = feature.label;

      const range = document.createElement("input");
      range.type = "range";
      range.id = `dt-query-${feature.key}`;
      range.min = feature.min;
      range.max = feature.max;
      range.step = feature.step;
      range.value = config().sampleDefaults[feature.key];

      const value = document.createElement("div");
      value.className = "dt-slider-value";
      value.id = `dt-query-value-${feature.key}`;
      value.textContent = formatFeatureValue(feature, Number(range.value));

      range.addEventListener("input", () => {
        value.textContent = formatFeatureValue(feature, Number(range.value));
        updateQuerySummary();
        clearPredictionDisplay();
      });

      row.append(label, range, value);
      container.append(row);
    });

    updateQuerySummary();
  }

  function updateQuerySummary() {
    const summary = $("dt-query-summary");
    if (!summary) return;
    summary.replaceChildren();

    const sample = getQuerySample();
    config().features.forEach(feature => {
      const chip = document.createElement("span");
      chip.className = "dt-query-chip";
      chip.textContent = `${feature.label}: ${formatFeatureValue(feature, sample[feature.key])}`;
      summary.append(chip);
    });
  }

  function getQuerySample() {
    const sample = {};
    config().features.forEach(feature => {
      sample[feature.key] = Number($("dt-query-" + feature.key)?.value ?? feature.default);
    });
    return sample;
  }

  function nodeVisible(node) {
    return node && node.revealStep <= currentStep;
  }

  function collectVisibleNodes(node, output = []) {
    if (!node) return output;
    if (nodeVisible(node)) output.push(node);
    if (node.left) collectVisibleNodes(node.left, output);
    if (node.right) collectVisibleNodes(node.right, output);
    return output;
  }

  function countLeavesAtDepth(node, targetDepth) {
    if (!node) return 0;
    if (node.depth === targetDepth) return 1;
    if (node.depth > targetDepth) return 0;
    return countLeavesAtDepth(node.left, targetDepth) + countLeavesAtDepth(node.right, targetDepth);
  }

  function assignPositions(node, positions, width, maxDepth) {
    const levelCounts = {};
    for (let d = 0; d <= maxDepth; d += 1) {
      levelCounts[d] = countLeavesAtDepth(tree, d) || Math.pow(2, d);
    }

    function walk(current, minX, maxX) {
      if (!current) return;
      const x = (minX + maxX) / 2;
      const y = 55 + current.depth * 105;
      positions[current.id] = { x, y };
      if (current.left || current.right) {
        const mid = (minX + maxX) / 2;
        walk(current.left, minX, mid);
        walk(current.right, mid, maxX);
      }
    }

    walk(node, 90, width - 90);
  }

  function renderTree() {
    const stage = $("dt-tree-stage");
    if (!stage || !tree) return;

    const maxDepth = Math.max(1, treeDepth(tree));
    const width = Math.max(820, Math.pow(2, Math.min(maxDepth, 4)) * 165);
    const height = 125 + maxDepth * 110;
    const positions = {};
    assignPositions(tree, positions, width, maxDepth);

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("class", "dt-tree-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Animated decision tree visualization");

    function renderEdges(node) {
      if (!node) return;
      [node.left, node.right].forEach(child => {
        if (!child) return;
        const parentPos = positions[node.id];
        const childPos = positions[child.id];
        if (nodeVisible(node) && nodeVisible(child)) {
          const line = document.createElementNS(svgNS, "line");
          line.setAttribute("x1", parentPos.x);
          line.setAttribute("y1", parentPos.y + 34);
          line.setAttribute("x2", childPos.x);
          line.setAttribute("y2", childPos.y - 34);
          line.setAttribute("class", "dt-edge");
          svg.append(line);

          const label = document.createElementNS(svgNS, "text");
          label.setAttribute("x", (parentPos.x + childPos.x) / 2);
          label.setAttribute("y", (parentPos.y + childPos.y) / 2 - 3);
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("class", "dt-edge-label");
          label.textContent = child.branch || "";
          svg.append(label);
        }
        renderEdges(child);
      });
    }

    renderEdges(tree);

    function renderNodes(node) {
      if (!node) return;
      const pos = positions[node.id];
      if (nodeVisible(node)) {
        const group = document.createElementNS(svgNS, "g");
        const isCurrent = events[currentStep]?.node?.id === node.id;
        const pathActive = predictionIndex >= 0 && predictionPath.slice(0, predictionIndex + 1).some(step => step.node.id === node.id);
        group.setAttribute("class", `dt-node ${node.type}${isCurrent ? " active" : ""}${pathActive ? " dt-node-path" : ""}`);
        group.setAttribute("transform", `translate(${pos.x},${pos.y})`);

        const rect = document.createElementNS(svgNS, "rect");
        rect.setAttribute("x", "-76");
        rect.setAttribute("y", "-34");
        rect.setAttribute("width", "152");
        rect.setAttribute("height", "68");
        group.append(rect);

        const title = document.createElementNS(svgNS, "text");
        title.setAttribute("x", "0");
        title.setAttribute("y", "-9");
        title.setAttribute("text-anchor", "middle");
        title.setAttribute("class", "dt-node-title");
        if (node.type === "split") {
          const feature = featureByKey(node.feature);
          title.textContent = `${feature.label} ≤ ${formatThreshold(node.feature, node.threshold)}`;
        } else {
          title.textContent = `${config().classIcons[node.prediction] || ""} ${node.prediction}`.trim();
        }
        group.append(title);

        const sub = document.createElementNS(svgNS, "text");
        sub.setAttribute("x", "0");
        sub.setAttribute("y", "10");
        sub.setAttribute("text-anchor", "middle");
        sub.setAttribute("class", "dt-node-sub");
        sub.textContent = `${node.rows.length} samples · impurity ${node.impurity.toFixed(3)}`;
        group.append(sub);

        const result = document.createElementNS(svgNS, "text");
        result.setAttribute("x", "0");
        result.setAttribute("y", "26");
        result.setAttribute("text-anchor", "middle");
        result.setAttribute("class", "dt-node-result");
        if (node.type === "split") {
          result.textContent = `gain ${node.gain.toFixed(3)}`;
        } else {
          const counts = Object.entries(node.counts).filter(([, count]) => count > 0).map(([label, count]) => `${label}: ${count}`).join(" · ");
          result.textContent = counts;
        }
        group.append(result);
        svg.append(group);
      }

      renderNodes(node.left);
      renderNodes(node.right);
    }

    renderNodes(tree);
    stage.replaceChildren(svg);
  }

  function currentEvent() {
    return currentStep >= 0 ? events[currentStep] : null;
  }

  function renderCandidates() {
    const body = $("dt-candidate-body");
    if (!body) return;
    body.replaceChildren();
    const event = currentEvent();

    if (!event || event.type !== "split") {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.textContent = event?.type === "leaf"
        ? "This is a leaf, so no further split is required."
        : "Start the animation to compare candidate splits.";
      tr.append(td);
      body.append(tr);
      return;
    }

    event.candidates.slice(0, 8).forEach((candidate, index) => {
      const tr = document.createElement("tr");
      if (index === 0) tr.classList.add("best");
      const feature = featureByKey(candidate.feature);
      const values = [
        `${index === 0 ? "✓ " : ""}${feature.label}`,
        formatThreshold(candidate.feature, candidate.threshold),
        candidate.weightedImpurity.toFixed(3),
        candidate.gain.toFixed(3)
      ];
      values.forEach(value => {
        const td = document.createElement("td");
        td.textContent = value;
        tr.append(td);
      });
      body.append(tr);
    });
  }

  function countText(rows) {
    const counts = classCounts(rows);
    return Object.entries(counts).map(([label, count]) => `${label}=${count}`).join(", ");
  }

  function renderCalculation() {
    const output = $("dt-calculation");
    const title = $("dt-calc-title");
    const learn = $("dt-learn-dynamic-math");
    if (!output) return;

    const criterion = $("dt-criterion")?.value || "gini";
    const event = currentEvent();
    title.textContent = criterion === "entropy" ? "Entropy calculation" : "Gini calculation";

    if (!event) {
      output.textContent = "Start the animation to see the mathematics.";
      if (learn) learn.textContent = "Run the Decision Tree animation to populate this section with the current experiment.";
      return;
    }

    if (event.type === "leaf") {
      const text = [
        `Leaf node (${event.rows.length} samples)`,
        countText(event.rows),
        `Impurity = ${event.impurity.toFixed(3)}`,
        `Prediction = ${event.node.prediction}`,
        `Reason = ${event.reason}`
      ].join("\n");
      output.textContent = text;
      if (learn) learn.textContent = text;
      return;
    }

    const best = event.best;
    const feature = featureByKey(best.feature);
    const lines = [];
    lines.push(`Current node: ${event.rows.length} samples`);
    lines.push(countText(event.rows));
    lines.push(`Parent impurity = ${best.parentImpurity.toFixed(3)}`);
    lines.push("");
    lines.push(`Best question: ${feature.label} ≤ ${formatThreshold(best.feature, best.threshold)} ?`);
    lines.push(`Left:  ${best.left.length} samples · impurity ${best.leftImpurity.toFixed(3)}`);
    lines.push(`Right: ${best.right.length} samples · impurity ${best.rightImpurity.toFixed(3)}`);
    lines.push("");
    lines.push(`Weighted impurity`);
    lines.push(`= (${best.left.length}/${event.rows.length})×${best.leftImpurity.toFixed(3)} + (${best.right.length}/${event.rows.length})×${best.rightImpurity.toFixed(3)}`);
    lines.push(`= ${best.weightedImpurity.toFixed(3)}`);
    lines.push("");
    lines.push(`Information gain`);
    lines.push(`= ${best.parentImpurity.toFixed(3)} − ${best.weightedImpurity.toFixed(3)}`);
    lines.push(`= ${best.gain.toFixed(3)}`);

    const text = lines.join("\n");
    output.textContent = text;
    if (learn) learn.textContent = text;
  }

  function renderMetrics() {
    const event = currentEvent();
    $("dt-step-metric").textContent = `${Math.max(0, currentStep + 1)} / ${events.length}`;
    $("dt-samples-metric").textContent = String(data.length);
    $("dt-depth-metric").textContent = tree ? String(treeDepth(tree)) : "—";
    $("dt-impurity-metric").textContent = event ? event.impurity.toFixed(3) : "—";
    $("dt-gain-metric").textContent = event?.type === "split" ? event.best.gain.toFixed(3) : "—";
  }

  function renderLive() {
    const event = currentEvent();
    if (!event) {
      setLive(`Ready. The ${config().title} dataset contains ${data.length} labelled samples. Press Play, Next or Instant Result.`);
      return;
    }

    if (event.type === "leaf") {
      setLive(`Step ${currentStep + 1}: this branch becomes a leaf predicting “${event.node.prediction}”. ${event.reason}.`);
      return;
    }

    const best = event.best;
    const feature = featureByKey(best.feature);
    setLive(`Step ${currentStep + 1}: tested ${event.candidates.length} candidate splits for ${event.rows.length} samples. Best: ${feature.label} ≤ ${formatThreshold(best.feature, best.threshold)}, information gain ${best.gain.toFixed(3)}.`);
  }

  function setLive(text) {
    const live = $("dt-live");
    if (live) live.textContent = text;
  }

  function renderButtons() {
    const atStart = currentStep < 0;
    const atEnd = currentStep >= events.length - 1;
    $("dt-prev").disabled = atStart;
    $("dt-next").disabled = atEnd;
    $("dt-play").disabled = atEnd;
    $("dt-pause").disabled = !playTimer;
  }

  function renderAll() {
    renderTree();
    renderCandidates();
    renderCalculation();
    renderMetrics();
    renderLive();
    renderButtons();
  }

  function nextStep() {
    stopPredictionTimer();
    predictionPath = [];
    predictionIndex = -1;
    if (currentStep < events.length - 1) currentStep += 1;
    renderAll();
  }

  function previousStep() {
    stopPredictionTimer();
    predictionPath = [];
    predictionIndex = -1;
    if (currentStep >= 0) currentStep -= 1;
    renderAll();
  }

  function instantResult() {
    stopAllTimers();
    currentStep = events.length - 1;
    predictionPath = [];
    predictionIndex = -1;
    renderAll();
    setLive(`Complete tree shown. Use the “Test The Learned Tree” section below to set a new sample and press “Run Prediction”.`);
  }

  function play() {
    stopPredictionTimer();
    predictionPath = [];
    predictionIndex = -1;
    if (currentStep >= events.length - 1) currentStep = -1;
    stopPlayTimer();
    nextStep();
    const delay = Number($("dt-speed")?.value || 800);
    playTimer = window.setInterval(() => {
      if (currentStep >= events.length - 1) {
        stopPlayTimer();
        renderButtons();
        setLive(`Tree growth complete. You can now classify the new ${currentExample === "vehicle" ? "vehicle" : currentExample === "phone" ? "phone" : "synthetic applicant"}.`);
        return;
      }
      nextStep();
    }, delay);
    renderButtons();
  }

  function pause() {
    stopPlayTimer();
    renderButtons();
    setLive(`Paused at step ${Math.max(0, currentStep + 1)} of ${events.length}.`);
  }

  function resetAnimation() {
    stopAllTimers();
    currentStep = -1;
    predictionPath = [];
    predictionIndex = -1;
    clearPredictionDisplay();
    renderAll();
  }

  function stopPlayTimer() {
    if (playTimer) {
      window.clearInterval(playTimer);
      playTimer = null;
    }
  }

  function stopPredictionTimer() {
    if (predictionTimer) {
      window.clearInterval(predictionTimer);
      predictionTimer = null;
    }
  }

  function stopAllTimers() {
    stopPlayTimer();
    stopPredictionTimer();
  }

  function traverse(sample) {
    const path = [];
    let node = tree;

    while (node) {
      if (node.type === "leaf") {
        path.push({ node, text: `Leaf → predict ${node.prediction}` });
        break;
      }
      const value = sample[node.feature];
      const goLeft = value <= node.threshold;
      const feature = featureByKey(node.feature);
      path.push({
        node,
        text: `${feature.label} = ${formatFeatureValue(feature, value)} → ${goLeft ? "YES (≤)" : "NO (>)"} ${formatThreshold(node.feature, node.threshold)}`
      });
      node = goLeft ? node.left : node.right;
    }

    return path;
  }

  function renderPrediction() {
    const resultBox = $("dt-result-box");
    const pathList = $("dt-path-list");
    if (!resultBox || !pathList) return;

    if (!predictionPath.length || predictionIndex < 0) {
      resultBox.innerHTML = `<div><div class="icon">?</div><span class="label">Prediction</span><strong>Choose values and run</strong></div>`;
      pathList.replaceChildren();
      const li = document.createElement("li");
      li.textContent = "Choose the test values and press Run Prediction to follow the sample through the tree.";
      pathList.append(li);
      return;
    }

    pathList.replaceChildren();

    const sample = getQuerySample();
    const inputItem = document.createElement("li");
    inputItem.textContent = `Input → ${config().features.map(feature => `${feature.label}: ${formatFeatureValue(feature, sample[feature.key])}`).join(" | ")}`;
    pathList.append(inputItem);

    predictionPath.slice(0, predictionIndex + 1).forEach((step, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${step.text}`;
      pathList.append(li);
    });

    const finalStep = predictionPath[predictionPath.length - 1];
    const complete = predictionIndex >= predictionPath.length - 1;
    if (complete) {
      const label = finalStep.node.prediction;
      const icon = config().classIcons[label] || "✓";
      resultBox.innerHTML = `<div><div class="icon">${icon}</div><span class="label">Prediction</span><strong>${label}</strong></div>`;
      setLive(`Prediction complete: the new sample reaches a leaf predicting “${label}”. The highlighted nodes show the decision path.`);
    } else {
      resultBox.innerHTML = `<div><div class="icon">…</div><span class="label">Following Tree</span><strong>Step ${predictionIndex + 1} / ${predictionPath.length}</strong></div>`;
    }
  }

  function watchPrediction() {
    stopAllTimers();
    if (currentStep < events.length - 1) currentStep = events.length - 1;
    predictionPath = traverse(getQuerySample());
    predictionIndex = 0;
    renderAll();
    renderPrediction();

    const delay = Math.max(480, Number($("dt-speed")?.value || 800));
    predictionTimer = window.setInterval(() => {
      if (predictionIndex >= predictionPath.length - 1) {
        stopPredictionTimer();
        renderPrediction();
        renderTree();
        return;
      }
      predictionIndex += 1;
      renderPrediction();
      renderTree();
    }, delay);
  }

  function instantPrediction() {
    stopAllTimers();
    if (currentStep < events.length - 1) currentStep = events.length - 1;
    predictionPath = traverse(getQuerySample());
    predictionIndex = predictionPath.length - 1;
    renderAll();
    renderPrediction();
  }

  function clearPredictionDisplay() {
    stopPredictionTimer();
    predictionPath = [];
    predictionIndex = -1;
    renderPrediction();
    renderTree();
  }

  function changeExample(exampleId) {
    if (!EXAMPLES[exampleId]) return;
    stopAllTimers();
    currentExample = exampleId;
    data = cloneBaseSamples();
    predictionPath = [];
    predictionIndex = -1;
    renderExampleUI();
    renderDataTable();
    rebuildTreeModel();
  }

  function bindEvents() {
    document.querySelectorAll("#tree-playground [data-dt-example]").forEach(button => {
      button.addEventListener("click", () => changeExample(button.dataset.dtExample));
    });

    $("dt-criterion")?.addEventListener("change", rebuildTreeModel);
    $("dt-max-depth")?.addEventListener("change", rebuildTreeModel);
    $("dt-generate")?.addEventListener("click", generateExamples);
    $("dt-restore")?.addEventListener("click", restoreDataset);
    $("dt-instant")?.addEventListener("click", instantResult);
    $("dt-play")?.addEventListener("click", play);
    $("dt-pause")?.addEventListener("click", pause);
    $("dt-prev")?.addEventListener("click", previousStep);
    $("dt-next")?.addEventListener("click", nextStep);
    $("dt-reset-animation")?.addEventListener("click", resetAnimation);
    $("dt-classify")?.addEventListener("click", watchPrediction);
    $("dt-predict-instant")?.addEventListener("click", instantPrediction);
    $("dt-speed")?.addEventListener("change", () => {
      if (playTimer) play();
    });
  }

  function init() {
    if (!$("tree-playground")) return;
    injectStyles();
    buildPlaygroundMarkup();
    buildLearnMarkup();
    bindEvents();
    data = cloneBaseSamples();
    renderExampleUI();
    renderDataTable();
    rebuildTreeModel();
  }

  init();

  return {
    reset: restoreDataset,
    selectExample: changeExample
  };
})();
