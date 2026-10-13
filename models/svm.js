"use strict";

/* =========================================================
   AI MODEL PLAYGROUND — SUPPORT VECTOR MACHINE
   Interactive educational 2D linear margin-separator demonstration (SVM-inspired).
   Examples: Apple vs Orange, Car vs Motorbike, Study Pattern.
========================================================= */

const SVMModel = (() => {
  const $ = id => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";

  const EXAMPLES = {
    fruit: {
      title: "Apple vs Orange", icon: "🍎", note: "Compare fruit using descriptive sweetness and sourness levels. These illustrative labels overlap intentionally; the model converts categories to ordered values internally.",
      classes: ["Apple", "Orange"], icons: {Apple:"🍎", Orange:"🍊"},
      x: {key:"sweetness", label:"Sweetness", unit:"", min:0, max:3, step:1, default:2, categories:["Not Sweet","Slightly Sweet","Sweet","Very Sweet"]},
      y: {key:"sourness", label:"Sourness", unit:"", min:0, max:3, step:1, default:1, categories:["Not Sour","Slightly Sour","Sour","Very Sour"]},
      data: [
        {x:3,y:0,label:"Apple"},{x:3,y:1,label:"Apple"},{x:2,y:0,label:"Apple"},{x:2,y:1,label:"Apple"},{x:2,y:2,label:"Apple"},{x:1,y:1,label:"Apple"},
        {x:0,y:3,label:"Orange"},{x:1,y:3,label:"Orange"},{x:1,y:2,label:"Orange"},{x:2,y:3,label:"Orange"},{x:2,y:2,label:"Orange"},{x:1,y:1,label:"Orange"}
      ]
    },
    vehicle: {
      title:"Car vs Motorbike", icon:"🚗", note:"Compare vehicles using engine horsepower and seating capacity. The examples are illustrative, not a real vehicle-identification system.",
      classes:["Motorbike","Car"], icons:{Motorbike:"🏍️",Car:"🚗"},
      x:{key:"hp",label:"Engine Power",unit:"HP",min:10,max:500,step:5,default:95},
      y:{key:"seats",label:"Number of Seats",unit:"",min:1,max:7,step:1,default:2},
      data:[
        {x:18,y:1,label:"Motorbike"},{x:35,y:2,label:"Motorbike"},{x:72,y:2,label:"Motorbike"},{x:110,y:2,label:"Motorbike"},{x:145,y:2,label:"Motorbike"},{x:175,y:2,label:"Motorbike"},
        {x:65,y:4,label:"Car"},{x:90,y:5,label:"Car"},{x:125,y:5,label:"Car"},{x:165,y:4,label:"Car"},{x:220,y:5,label:"Car"},{x:285,y:7,label:"Car"}
      ]
    },
    student: {
      title:"Study Pattern", icon:"📚", note:"A simple classroom example using study hours and practice score. It demonstrates the geometry of SVM rather than making a real educational judgment.",
      classes:["Developing","Strong"], icons:{Developing:"📝",Strong:"⭐"},
      x:{key:"hours",label:"Study Hours",unit:"h",min:0,max:10,step:.5,default:5},
      y:{key:"practice",label:"Practice Score",unit:"%",min:20,max:100,step:1,default:65},
      data:[
        {x:1,y:32,label:"Developing"},{x:2,y:42,label:"Developing"},{x:2.5,y:50,label:"Developing"},{x:3.5,y:48,label:"Developing"},{x:4,y:58,label:"Developing"},{x:4.5,y:61,label:"Developing"},
        {x:5,y:72,label:"Strong"},{x:6,y:75,label:"Strong"},{x:6.5,y:82,label:"Strong"},{x:7.5,y:85,label:"Strong"},{x:8.5,y:91,label:"Strong"},{x:9,y:96,label:"Strong"}
      ]
    }
  };

  let current = "fruit";
  let data = [];
  let model = null;
  let query = {x:0,y:0};
  let animationSteps=[], animationIndex=-1, animationTimer=null, isPlaying=false;
  let visualStep="full";

  const cfg = () => EXAMPLES[current];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const fmt=(v,f)=>f.categories ? f.categories[clamp(Math.round(v),0,f.categories.length-1)] : `${Number.isInteger(f.step)?Math.round(v):Number(v.toFixed(1))}${f.unit?` ${f.unit}`:""}`;


  function injectStyles(){
    if($("svm-enhanced-styles")) return;
    const style=document.createElement("style"); style.id="svm-enhanced-styles";
    style.textContent=`
      #svm-playground .svm-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}
      #svm-playground .svm-tab{border:1px solid var(--border,#d9e1ea);background:#fff;border-radius:10px;padding:14px 16px;text-align:left;cursor:pointer;transition:.18s ease;color:inherit}
      #svm-playground .svm-tab:hover{transform:translateY(-1px);border-color:#9bb7cd}
      #svm-playground .svm-tab.active{border-color:#3f7cac;background:#f1f7fb;box-shadow:0 0 0 2px rgba(63,124,172,.08)}
      #svm-playground .svm-tab strong{display:block;font-size:16px;margin-bottom:4px} #svm-playground .svm-tab span{display:block;color:#667085;font-size:13px;line-height:1.4}
      #svm-playground .svm-note{margin:0 0 16px;padding:12px 14px;border-radius:8px;background:#f8fafc;border:1px solid #e5eaf0;color:#667085;line-height:1.55}
      #svm-playground .svm-layout{display:grid;grid-template-columns:minmax(300px,.78fr) minmax(0,1.22fr);gap:16px;align-items:start}
      #svm-playground .svm-card{padding:20px} #svm-playground .svm-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:13px}
      #svm-playground .svm-head h3{margin:2px 0 4px} #svm-playground .svm-head p{margin:0;color:#667085}
      #svm-playground .svm-table-wrap{overflow:auto;max-height:430px} #svm-playground .svm-table{width:100%;border-collapse:collapse;min-width:520px}
      #svm-playground .svm-table th,#svm-playground .svm-table td{padding:8px;border-bottom:1px solid #edf0f3;text-align:left} #svm-playground .svm-table th{position:sticky;top:0;background:#f8fafc;color:#667085;font-size:11.5px;text-transform:uppercase}
      #svm-playground .svm-table input,#svm-playground .svm-table select{min-width:90px;padding:7px 8px}
      #svm-playground .svm-stage{border:1px solid #e3e8ef;border-radius:12px;background:linear-gradient(180deg,#fbfdff,#f7fafc);padding:8px;overflow:hidden}
      #svm-playground .svm-svg{display:block;width:100%;height:auto;min-height:390px;cursor:crosshair} #svm-playground .svm-gridline{stroke:#e7edf3;stroke-width:1}
      #svm-playground .svm-boundary{stroke:#111827;stroke-width:3} #svm-playground .svm-margin{stroke:#64748b;stroke-width:1.7;stroke-dasharray:7 6}
      #svm-playground .svm-a{fill:#3f7cac;stroke:#fff;stroke-width:2} #svm-playground .svm-b{fill:#e07a5f;stroke:#fff;stroke-width:2}
      #svm-playground .svm-support{fill:none;stroke:#111827;stroke-width:2.5} #svm-playground .svm-query{fill:#fff;stroke:#111827;stroke-width:3} #svm-playground .svm-query-cross{stroke:#111827;stroke-width:2}
      #svm-playground .svm-label{fill:#475467;font-size:12px;font-weight:700}
      #svm-playground .svm-legend{display:flex;flex-wrap:wrap;gap:14px;margin:12px 0 0;color:#667085;font-size:13px}.svm-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}.svm-dot.a{background:#3f7cac}.svm-dot.b{background:#e07a5f}
      #svm-playground .svm-query-card{margin-top:16px;padding:20px} #svm-playground .svm-query-grid{display:grid;grid-template-columns:minmax(300px,.75fr) minmax(0,1.25fr);gap:18px}
      #svm-playground .svm-slider{display:grid;grid-template-columns:120px 1fr 90px;gap:10px;align-items:center;margin:12px 0} #svm-playground .svm-slider label{font-weight:700;color:#344054} #svm-playground .svm-slider input{width:100%} #svm-playground .svm-value{text-align:right;font-weight:750}
      #svm-playground .svm-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:16px} #svm-playground .svm-result{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}
      #svm-playground .svm-metric{border:1px solid #e5eaf0;border-radius:9px;background:#fff;padding:12px}.svm-metric span{display:block;color:#667085;font-size:12px;margin-bottom:4px}.svm-metric strong{font-size:18px}
      #svm-playground .svm-explain{padding:13px 15px;border-radius:9px;background:#eef6fb;border:1px solid #d8e8f3;color:#344054;line-height:1.55} #svm-playground .svm-equation{margin-top:12px;padding:12px 14px;background:#f8fafc;border:1px solid #e5eaf0;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;line-height:1.55}
      #svm-learn .svm-learn-note{margin-top:14px;padding:12px 14px;border:1px solid #e5eaf0;border-radius:8px;background:#f8fafc;line-height:1.6}
      #svm-playground .svm-section{padding:22px;margin-bottom:17px}
      #svm-playground .svm-section h3{margin:6px 0 8px}
      #svm-playground .svm-sub{color:#667085;font-size:14px}
      #svm-playground .svm-tabs{margin:18px 0 0}
      #svm-playground .svm-note{margin:16px 0 0}
      #svm-playground .svm-settings{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}
      #svm-playground .svm-settings label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:700;min-width:180px}
      #svm-playground .svm-settings select{padding:10px;border:1px solid #d9e1ea;border-radius:8px;background:#fff}
      #svm-playground .svm-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
      #svm-playground .svm-summary>div{border:1px solid #e5eaf0;padding:14px;border-radius:9px}
      #svm-playground .svm-summary span{display:block;font-size:12px;color:#667085;margin-bottom:5px}
      #svm-playground .svm-summary strong{font-size:23px}
      #svm-playground .svm-query-emoji{font-size:36px}
      #svm-playground .svm-query-card{margin-top:0}
      #svm-playground .svm-layout{margin-bottom:17px}
      #svm-playground .svm-toolbar{display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap}
      #svm-playground .svm-toolbar strong{display:block;margin-top:7px}
      #svm-playground .svm-status{text-align:right;font-size:13px;color:#667085}
      #svm-playground .svm-status strong{display:block;font-size:17px;color:#1e293b}
      #svm-playground .svm-progress-track{height:8px;border-radius:20px;background:#e2e8f0;overflow:hidden;margin:18px 0}
      #svm-playground #svm-progress{height:100%;width:0;background:#3f7cac;transition:width .35s ease}
      #svm-playground .svm-live-step{padding:15px;border:1px solid #dbeafe;background:#f1f7fb;border-radius:9px;line-height:1.6;margin:12px 0}
      #svm-playground .svm-process{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:16px}
      #svm-playground .svm-process>div{padding:10px;border:1px solid #e5eaf0;border-radius:9px;font-size:12px;display:flex;flex-direction:column;gap:8px}
      #svm-playground .svm-process span{display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:#e2e8f0}
      #svm-playground .svm-process .is-active{border-color:#3f7cac;background:#eff6ff}
      #svm-playground .svm-process .is-complete{border-color:#86efac;background:#f0fdf4}
      #svm-playground .svm-query-card #svm-query-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
      #svm-playground .svm-query-card .svm-slider{display:flex;flex-direction:column;align-items:stretch;gap:8px}
      #svm-playground .svm-query-card .svm-value{text-align:left}
      #svm-playground .svm-result{grid-template-columns:repeat(4,minmax(0,1fr))}
      #svm-playground .svm-candidate{stroke:#94a3b8;stroke-width:2;stroke-dasharray:8 5}
      #svm-playground .svm-current{stroke:#2563eb;stroke-width:3}
      #svm-playground .svm-point-hidden{opacity:.14}
      #svm-playground .svm-margin-hidden{opacity:0}
      @media(max-width:800px){#svm-playground .svm-process{grid-template-columns:repeat(3,minmax(0,1fr))}#svm-playground .svm-result,#svm-playground .svm-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:550px){#svm-playground .svm-query-card #svm-query-controls{grid-template-columns:1fr}#svm-playground .svm-process{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(prefers-reduced-motion:reduce){#svm-playground #svm-progress{transition:none}}
      @media(max-width:980px){#svm-playground .svm-layout,#svm-playground .svm-query-grid{grid-template-columns:1fr}}
      @media(max-width:720px){#svm-playground .svm-tabs{grid-template-columns:1fr}#svm-playground .svm-slider{grid-template-columns:1fr;gap:5px}#svm-playground .svm-value{text-align:left}#svm-playground .svm-result{grid-template-columns:1fr}.svm-svg{min-height:320px!important}}
    `; document.head.append(style);
  }

  function buildPlayground(){
    const root=$("svm-playground"); if(!root)return;
    root.innerHTML=`
      <div class="heading"><span class="label">Support Vector Machine Playground</span>
        <h2>Find the widest separating margin</h2>
        <p>Choose an example, edit labelled samples, and watch how the separating boundary, margins, and support vectors lead to a prediction.</p></div>
      <section class="card svm-section">
        <span class="label">CHOOSE AN EXAMPLE</span><h3>What would you like SVM to classify?</h3>
        <p class="svm-sub">Switch between real-world illustrations while keeping the same decision-boundary concept.</p>
        <div class="svm-tabs">
          <button class="svm-tab active" type="button" data-svm-example="fruit"><strong>🍎 Apple vs Orange</strong><span>Sweetness and sourness</span></button>
          <button class="svm-tab" type="button" data-svm-example="vehicle"><strong>🚗 Car vs Motorbike</strong><span>Engine horsepower and seats</span></button>
          <button class="svm-tab" type="button" data-svm-example="student"><strong>📚 Study Pattern</strong><span>Study hours and practice score</span></button>
        </div>
        <p class="svm-note" id="svm-note"></p>
      </section>
      <section class="card svm-section">
        <span class="label">MODEL SETTINGS</span><h3>Configure the demonstration</h3>
        <div class="svm-settings">
          <label>Boundary search detail<select id="svm-detail">
            <option value="5">Quick (5°)</option><option value="2">Balanced (2°)</option><option value="1" selected>Detailed (1°)</option>
          </select></label>
          <label>Animation speed<select id="svm-speed">
            <option value="1600">Slow</option><option value="900" selected>Normal</option><option value="450">Fast</option>
          </select></label>
        </div>
        <div class="svm-actions">
          <button id="svm-add" class="btn" type="button">+ Add Training Sample</button>
          <button id="svm-remove" class="btn" type="button">− Remove Last Sample</button>
          <button id="svm-randomize" class="btn" type="button">↻ Generate New Data</button>
          <span id="svm-sample-count" class="svm-sub"></span>
        </div>
      </section>
      <section class="card svm-section">
        <span class="label">TRAINING SUMMARY</span>
        <div class="svm-summary">
          <div><span>Total Samples</span><strong id="svm-total">—</strong></div>
          <div><span id="svm-a-label">Class A</span><strong id="svm-a-count">—</strong></div>
          <div><span id="svm-b-label">Class B</span><strong id="svm-b-count">—</strong></div>
          <div><span>Features</span><strong>2</strong></div>
        </div>
      </section>
      <section class="card svm-section svm-query-card">
        <div class="svm-head"><div><span class="label">UNKNOWN SAMPLE</span><h3 id="svm-query-title">Place a new point</h3>
          <p>Move the sliders or click the graph to change the unknown sample.</p></div>
          <span class="svm-query-emoji" id="svm-query-emoji">🍎?</span></div>
        <div id="svm-query-controls"></div>
      </section>
      <div class="svm-layout">
        <section class="card svm-card"><div class="svm-head"><div><span class="label">STEP 1</span>
          <h3>Training Dataset</h3><p>Edit labelled samples. Changes update the separator.</p></div></div>
          <div class="svm-table-wrap"><table class="svm-table"><thead id="svm-data-head"></thead><tbody id="svm-data-body"></tbody></table></div>
        </section>
        <section class="card svm-card"><div class="svm-head"><div><span class="label">STEP 2</span>
          <h3>Decision Boundary Visualization</h3><p>Solid line = boundary. Dashed lines = margins. Circled points = support-vector candidates. Click to move the unknown point.</p></div></div>
          <div id="svm-stage" class="svm-stage"></div>
          <div class="svm-legend"><span><i class="svm-dot a"></i><b id="svm-class-a-name"></b></span>
            <span><i class="svm-dot b"></i><b id="svm-class-b-name"></b></span>
            <span>◯ Support-vector candidate</span><span>⊕ Unknown point</span></div>
        </section>
      </div>
      <section class="card svm-section svm-toolbar">
        <div><span class="label">SVM PIPELINE</span>
          <strong>Training Points → Candidate Boundaries → Best Separator → Margins → Support Vectors → Prediction</strong></div>
        <div class="svm-actions">
          <button id="svm-classify" class="btn primary" type="button">Instant Predict</button>
          <button id="svm-reset" class="btn" type="button">Reset Example</button>
        </div>
      </section>
      <section class="card svm-section">
        <div class="svm-head"><div><span class="label">STEP-BY-STEP MODE</span><h3>Watch the SVM decision process</h3>
          <p>Follow each stage of the boundary-search demonstration.</p></div>
          <div class="svm-status"><span id="svm-animation-stage">Ready</span><strong id="svm-animation-counter">0 / 0</strong></div></div>
        <div class="svm-actions">
          <button id="svm-play" class="btn primary" type="button">▶ Play Animation</button>
          <button id="svm-pause" class="btn" type="button">Ⅱ Pause</button>
          <button id="svm-previous" class="btn" type="button">← Previous</button>
          <button id="svm-next" class="btn" type="button">Next Step →</button>
          <button id="svm-replay" class="btn" type="button">↺ Replay</button>
        </div>
        <div class="svm-progress-track"><div id="svm-progress"></div></div>
        <div id="svm-live-step" class="svm-live-step" aria-live="polite">Press Play Animation to begin.</div>
        <div class="svm-process">
          ${["data","candidates","boundary","margin","supports","prediction"].map((v,i)=>`<div data-svm-process="${v}"><span>${i+1}</span><strong>${["Read Samples","Try Separators","Select Boundary","Measure Margin","Find Support Vectors","Classify Point"][i]}</strong></div>`).join("")}
        </div>
      </section>
      <section class="card svm-section">
        <span class="label">PREDICTION RESULT</span><h3>Which side of the boundary?</h3>
        <div class="svm-result">
          <div class="svm-metric"><span>Prediction</span><strong id="svm-prediction">—</strong></div>
          <div class="svm-metric"><span>Decision Score</span><strong id="svm-score">—</strong></div>
          <div class="svm-metric"><span>Support-vector candidates</span><strong id="svm-support-count">—</strong></div>
          <div class="svm-metric"><span>Margin Width (normalized)</span><strong id="svm-margin-width">—</strong></div>
        </div>
        <div id="svm-explain" class="svm-explain">Run an instant prediction or play the animation.</div>
      </section>
      <section class="card svm-section">
        <span class="label">LIVE MATHEMATICS</span><h3>How the decision is calculated</h3>
        <div class="svm-equation">f(x) = wᵀx + b</div>
        <div id="svm-equation" class="svm-equation"></div>
        <div id="svm-math-step" class="svm-live-step">During the animation, the active calculation will appear here.</div>
      </section>`;
  }

  function buildLearn(){
    const root=$("svm-learn"); if(!root)return;
    root.innerHTML=`<div class="wrap"><div class="heading"><span class="label">Learn Support Vector Machines</span><h2>Why does SVM care about the margin?</h2><p>A linear SVM searches for a separating hyperplane whose nearest training examples are as far away as possible.</p></div><div class="tabs model-learn-tabs"><button class="tab active" data-learn-tab="beginner">Beginner</button><button class="tab" data-learn-tab="math">Mathematics</button><button class="tab" data-learn-tab="process">Margin Process</button></div><div class="learn-panel" data-learn-panel="beginner"><div class="learn-grid"><article><b>1</b><h3>Start with two classes</h3><p>Each training point has features and a known class.</p></article><article><b>2</b><h3>Try separating lines</h3><p>Many lines may separate the groups.</p></article><article><b>3</b><h3>Measure the margin</h3><p>The margin is the gap around the decision boundary.</p></article><article><b>4</b><h3>Find support vectors</h3><p>The nearest points from each class define the useful margin.</p></article><article><b>5</b><h3>Choose the widest gap</h3><p>SVM prefers a separator that maximizes that margin.</p></article><article><b>6</b><h3>Classify a new point</h3><p>The sign of the decision function tells which side it lies on.</p></article></div></div><div class="learn-panel" data-learn-panel="math" hidden><div class="math-grid"><article><h3>Decision Function</h3><p class="equation">f(x) = wᵀx + b</p></article><article><h3>Prediction</h3><p class="equation">ŷ = sign(f(x))</p></article><article><h3>Margin</h3><p class="equation">margin ∝ 1 / ‖w‖</p></article><article><h3>Hard-margin constraint</h3><p class="equation">yᵢ(wᵀxᵢ+b) ≥ 1</p></article></div><div class="svm-learn-note">This playground normalizes the two displayed features and searches many 2D linear separators to make the maximum-margin idea visible. It is an educational visualization rather than a production SVM optimizer.</div></div><div class="learn-panel" data-learn-panel="process" hidden><div class="process-grid"><article><strong>Labelled points</strong><span>Two classes</span></article><span>→</span><article><strong>Candidate separators</strong><span>Try directions</span></article><span>→</span><article><strong>Margin</strong><span>Measure nearest points</span></article><span>→</span><article><strong>Best boundary</strong><span>Keep widest valid gap</span></article><span>→</span><article><strong>Prediction</strong><span>Choose a side</span></article></div></div></div>`;
  }

  function normalize(row){
    const c=cfg();
    return {x:(row.x-c.x.min)/(c.x.max-c.x.min), y:(row.y-c.y.min)/(c.y.max-c.y.min)};
  }

  function fit(){
    if(data.length<2){model=null;return;}
    const c=cfg(), A=c.classes[0], normalized=data.map(r=>({...normalize(r),label:r.label,id:r.id}));
    let best=null;
    for(let deg=0;deg<180;deg+=Number($("svm-detail")?.value||1)){
      const t=deg*Math.PI/180, nx=Math.cos(t), ny=Math.sin(t);
      const projected=normalized.map(r=>({...r,p:r.x*nx+r.y*ny,s:r.label===A?-1:1})).sort((a,b)=>a.p-b.p);
      for(let i=0;i<projected.length-1;i++){
        const threshold=(projected[i].p+projected[i+1].p)/2;
        for(const sign of [1,-1]){
          let correct=0, minDist=Infinity;
          projected.forEach(r=>{const score=sign*(r.p-threshold); const pred=score>=0?1:-1; if(pred===r.s)correct++; minDist=Math.min(minDist,Math.abs(score));});
          const acc=correct/projected.length;
          const quality=acc*1000+minDist;
          if(!best||quality>best.quality) best={nx:nx*sign,ny:ny*sign,b:-threshold*sign,accuracy:acc,margin:minDist,quality};
        }
      }
    }
    model=best;
  }

  function decision(x,y){if(!model)return 0;const n=normalize({x,y});return model.nx*n.x+model.ny*n.y+model.b;}
  function prediction(){return decision(query.x,query.y)>=0?cfg().classes[1]:cfg().classes[0];}

  function supports(){
    if(!model)return [];
    const scored=data.map(r=>({...r,d:Math.abs(decision(r.x,r.y))}));
    const each=cfg().classes.flatMap(label=>scored.filter(r=>r.label===label).sort((a,b)=>a.d-b.d).slice(0,2));
    return each;
  }

  function renderControls(){
    const host=$("svm-query-controls"); if(!host)return; host.replaceChildren();
    [cfg().x,cfg().y].forEach((f,i)=>{
      const row=document.createElement("div");row.className="svm-slider";
      const label=document.createElement("label");label.textContent=f.label;label.htmlFor=`svm-q-${i}`;
      const input=document.createElement(f.categories ? "select" : "input");if(f.categories){f.categories.forEach((name,index)=>{const option=document.createElement("option");option.value=index;option.textContent=name;input.append(option);});}else{input.type="range";}input.id=`svm-q-${i}`;input.min=f.min;input.max=f.max;input.step=f.step;input.value=i===0?query.x:query.y;
      const value=document.createElement("div");value.className="svm-value";value.id=`svm-qv-${i}`;value.textContent=fmt(Number(input.value),f);
      input.addEventListener(f.categories ? "change" : "input",()=>{if(i===0)query.x=Number(input.value);else query.y=Number(input.value);value.textContent=fmt(Number(input.value),f);invalidateAnimation();render(false);});
      row.append(label,input,value);host.append(row);
    });
  }

  function renderTable(){
    const head=$("svm-data-head"),body=$("svm-data-body");if(!head||!body)return;head.replaceChildren();body.replaceChildren();
    const tr=document.createElement("tr");["ID",cfg().x.label,cfg().y.label,"Class"].forEach(v=>{const th=document.createElement("th");th.textContent=v;tr.append(th)});head.append(tr);
    data.forEach(row=>{
      const tr=document.createElement("tr"); const id=document.createElement("td");id.textContent=row.id;tr.append(id);
      [["x",cfg().x],["y",cfg().y]].forEach(([key,f])=>{const td=document.createElement("td"),input=document.createElement(f.categories ? "select" : "input");if(f.categories){f.categories.forEach((name,index)=>{const option=document.createElement("option");option.value=index;option.textContent=name;input.append(option);});}else{input.type="number";input.min=f.min;input.max=f.max;input.step=f.step;}input.value=row[key];input.addEventListener("change",()=>{const next=Number(input.value);if(Number.isFinite(next))row[key]=clamp(next,f.min,f.max);input.value=row[key];fit();invalidateAnimation();render(false);updateSummary()});td.append(input);tr.append(td)});
      const td=document.createElement("td"),sel=document.createElement("select");cfg().classes.forEach(label=>{const o=document.createElement("option");o.value=label;o.textContent=`${cfg().icons[label]} ${label}`;o.selected=row.label===label;sel.append(o)});sel.addEventListener("change",()=>{row.label=sel.value;fit();invalidateAnimation();render(false);updateSummary()});td.append(sel);tr.append(td);body.append(tr);
    });
  }

  function renderPlot(){
    const host=$("svm-stage");if(!host)return;host.replaceChildren();
    const W=760,H=470,P=58,c=cfg(); const sx=x=>P+(x-c.x.min)/(c.x.max-c.x.min)*(W-2*P), sy=y=>H-P-(y-c.y.min)/(c.y.max-c.y.min)*(H-2*P);
    const svg=document.createElementNS(NS,"svg");svg.setAttribute("viewBox",`0 0 ${W} ${H}`);svg.setAttribute("class","svm-svg");
    for(let i=0;i<=5;i++){const gx=P+i*(W-2*P)/5,gy=P+i*(H-2*P)/5;let l=document.createElementNS(NS,"line");l.setAttribute("x1",gx);l.setAttribute("x2",gx);l.setAttribute("y1",P);l.setAttribute("y2",H-P);l.setAttribute("class","svm-gridline");svg.append(l);l=document.createElementNS(NS,"line");l.setAttribute("x1",P);l.setAttribute("x2",W-P);l.setAttribute("y1",gy);l.setAttribute("y2",gy);l.setAttribute("class","svm-gridline");svg.append(l)}
    [c.x,c.y].forEach((feature,axis)=>{if(!feature.categories)return;feature.categories.forEach((name,i)=>{const t=document.createElementNS(NS,"text");t.setAttribute("class","svm-label");t.setAttribute("font-size","10");if(axis===0){t.setAttribute("x",sx(i));t.setAttribute("y",H-P+19);t.setAttribute("text-anchor","middle");}else{t.setAttribute("x",P-9);t.setAttribute("y",sy(i)+4);t.setAttribute("text-anchor","end");}t.textContent=name;svg.append(t);});});
    function lineFor(level,klass){
      if(!model)return;
      const intersections=[];
      const add=(x,y)=>{if(x>=0&&x<=1&&y>=0&&y<=1&&!intersections.some(p=>Math.abs(p[0]-x)+Math.abs(p[1]-y)<1e-7))intersections.push([x,y]);};
      if(Math.abs(model.ny)>1e-9){add(0,(level-model.b)/model.ny);add(1,(level-model.b-model.nx)/model.ny);}
      if(Math.abs(model.nx)>1e-9){add((level-model.b)/model.nx,0);add((level-model.b-model.ny)/model.nx,1);}
      if(intersections.length<2)return;
      const [a,b]=intersections;
      const l=document.createElementNS(NS,"line");l.setAttribute("x1",sx(c.x.min+a[0]*(c.x.max-c.x.min)));l.setAttribute("y1",sy(c.y.min+a[1]*(c.y.max-c.y.min)));l.setAttribute("x2",sx(c.x.min+b[0]*(c.x.max-c.x.min)));l.setAttribute("y2",sy(c.y.min+b[1]*(c.y.max-c.y.min)));l.setAttribute("class",klass);svg.append(l);
    }
    if(["margin","supports","prediction","full"].includes(visualStep)){
      lineFor(-model?.margin,"svm-margin");lineFor(model?.margin,"svm-margin");
    }
    if(["boundary","margin","supports","prediction","full"].includes(visualStep))lineFor(0,"svm-boundary");
    if(visualStep==="candidates"){
      // An illustrative candidate separator, not the fitted solution.
      const mid=(c.x.min+c.x.max)/2;
      const candidate=document.createElementNS(NS,"line");
      [["x1",sx(mid)],["x2",sx(mid)],["y1",P],["y2",H-P],["class","svm-candidate"]].forEach(([k,v])=>candidate.setAttribute(k,v));
      svg.append(candidate);
    }
    const ids=new Set(["supports","prediction","full"].includes(visualStep)?supports().map(r=>r.id):[]);
    data.forEach(r=>{if(ids.has(r.id)){const ring=document.createElementNS(NS,"circle");ring.setAttribute("cx",sx(r.x));ring.setAttribute("cy",sy(r.y));ring.setAttribute("r",13);ring.setAttribute("class","svm-support");svg.append(ring)}const p=document.createElementNS(NS,"circle");p.setAttribute("cx",sx(r.x));p.setAttribute("cy",sy(r.y));p.setAttribute("r",8);p.setAttribute("class",r.label===c.classes[0]?"svm-a":"svm-b");svg.append(p)});
    const q=document.createElementNS(NS,"circle");q.setAttribute("cx",sx(query.x));q.setAttribute("cy",sy(query.y));q.setAttribute("r",11);q.setAttribute("class","svm-query");svg.append(q);
    [[-7,0,7,0],[0,-7,0,7]].forEach(a=>{const l=document.createElementNS(NS,"line");l.setAttribute("x1",sx(query.x)+a[0]);l.setAttribute("y1",sy(query.y)+a[1]);l.setAttribute("x2",sx(query.x)+a[2]);l.setAttribute("y2",sy(query.y)+a[3]);l.setAttribute("class","svm-query-cross");svg.append(l)});
    const xt=document.createElementNS(NS,"text");xt.setAttribute("x",W/2);xt.setAttribute("y",H-12);xt.setAttribute("text-anchor","middle");xt.setAttribute("class","svm-label");xt.textContent=`${c.x.label}${c.x.unit?` (${c.x.unit})`:""}`;svg.append(xt);
    const yt=document.createElementNS(NS,"text");yt.setAttribute("x",18);yt.setAttribute("y",H/2);yt.setAttribute("transform",`rotate(-90 18 ${H/2})`);yt.setAttribute("text-anchor","middle");yt.setAttribute("class","svm-label");yt.textContent=`${c.y.label}${c.y.unit?` (${c.y.unit})`:""}`;svg.append(yt);
    svg.addEventListener("click",e=>{const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W,py=(e.clientY-r.top)/r.height*H;query.x=clamp(c.x.min+(px-P)/(W-2*P)*(c.x.max-c.x.min),c.x.min,c.x.max);query.y=clamp(c.y.min+(H-P-py)/(H-2*P)*(c.y.max-c.y.min),c.y.min,c.y.max);query.x=Math.round(query.x/c.x.step)*c.x.step;query.y=Math.round(query.y/c.y.step)*c.y.step;renderControls();invalidateAnimation();render(false)});
    host.append(svg);
  }

  function render(showResult=true){
    renderPlot(); const c=cfg(),s=decision(query.x,query.y),pred=prediction(),sv=supports();
    $("svm-class-a-name").textContent=c.classes[0];$("svm-class-b-name").textContent=c.classes[1];
    $("svm-support-count").textContent=sv.length;$("svm-margin-width").textContent=model?(2*model.margin).toFixed(3):"—";
    $("svm-equation").textContent=model?`Decision function: f(x) = ${model.nx.toFixed(3)}·x₁ + ${model.ny.toFixed(3)}·x₂ + ${model.b.toFixed(3)}.  f(x) ≥ 0 → ${c.classes[1]}; f(x) < 0 → ${c.classes[0]}.`:"";
    if(showResult){$("svm-prediction").textContent=`${c.icons[pred]} ${pred}`;$("svm-score").textContent=s.toFixed(3);$("svm-explain").innerHTML=`The new point has a boundary score of <strong>${Math.abs(s).toFixed(3)}</strong> (normalized feature coordinates) on the <strong>${pred}</strong> side. Circled points are the nearest examples to the chosen boundary (an SVM-inspired approximation).`}
    else{$("svm-prediction").textContent="—";$("svm-score").textContent="—";$("svm-explain").textContent="The boundary is ready. Press Classify Point to reveal the prediction, or keep moving the new point."}
  }

  function updateSummary(){
    const c=cfg(),a=data.filter(r=>r.label===c.classes[0]).length;
    $("svm-total").textContent=data.length;
    $("svm-a-count").textContent=a;$("svm-b-count").textContent=data.length-a;
    $("svm-a-label").textContent=c.classes[0];$("svm-b-label").textContent=c.classes[1];
    $("svm-sample-count").textContent=`${data.length} / 20 samples`;
    $("svm-add").disabled=data.length>=20;$("svm-remove").disabled=data.length<=4;
  }
  function pauseAnimation(){
    isPlaying=false;clearTimeout(animationTimer);animationTimer=null;updateAnimationButtons();
  }
  function invalidateAnimation(){
    pauseAnimation();animationSteps=[];animationIndex=-1;visualStep="full";
    $("svm-animation-stage").textContent="Ready";$("svm-animation-counter").textContent="0 / 0";
    $("svm-progress").style.width="0%";
    $("svm-live-step").textContent="Values changed. Press Play Animation to start again.";
    $("svm-math-step").textContent="Run or animate to see the decision calculation.";
    document.querySelectorAll("[data-svm-process]").forEach(n=>n.classList.remove("is-active","is-complete"));
  }
  function updateAnimationButtons(){
    $("svm-play").disabled=isPlaying;
    $("svm-pause").disabled=!isPlaying;
    $("svm-next").disabled=isPlaying;
    $("svm-previous").disabled=isPlaying||animationIndex<=0;
  }
  function buildAnimation(){
    pauseAnimation();
    animationSteps=[
      {stage:"data",title:"Read labelled training samples",text:`Start with ${data.length} examples of ${cfg().classes.join(" and ")}. The graph displays their two normalized features.`,
       math:`x₁ = (${cfg().x.label} − ${cfg().x.min}) / (${cfg().x.max} − ${cfg().x.min}); x₂ = (${cfg().y.label} − ${cfg().y.min}) / (${cfg().y.max} − ${cfg().y.min})`},
      {stage:"candidates",title:"Try candidate separating lines",text:"Search different directions and thresholds. This is an educational grid search over linear separators, not a trained SVM optimizer.",
       math:"Candidate score: f(x) = w₁x₁ + w₂x₂ + b. Evaluate the fraction of correctly classified training points."},
      {stage:"boundary",title:"Select the best boundary",text:`The search prioritizes training accuracy and then the smallest absolute decision score (its margin proxy). Accuracy: ${(100*model.accuracy).toFixed(1)}%.`,
       math:`f(x) = ${model.nx.toFixed(3)}x₁ + ${model.ny.toFixed(3)}x₂ + ${model.b.toFixed(3)}`},
      {stage:"margin",title:"Draw the margin",text:"The dashed lines show the closest signed-score distance around the chosen separator. This is an illustrative margin proxy.",
       math:`Boundary: f(x) = 0. Margin levels: f(x) = ±${model.margin.toFixed(3)}. Displayed width: ${(2*model.margin).toFixed(3)}.`},
      {stage:"supports",title:"Highlight support-vector candidates",text:"Circle up to two nearest samples from each class. They are visual support-vector candidates, not coefficients from a solved SVM.",
       math:`Distance proxy for a training point: |f(x)|. Candidate points have the smallest |f(x)| in each class.`},
      {stage:"prediction",title:"Classify the unknown point",text:`The point lies on the ${prediction()} side of the boundary. Its signed score is ${decision(query.x,query.y).toFixed(3)}.`,
       math:`f(unknown) = ${model.nx.toFixed(3)} × ${normalize(query).x.toFixed(3)} + ${model.ny.toFixed(3)} × ${normalize(query).y.toFixed(3)} + ${model.b.toFixed(3)} = ${decision(query.x,query.y).toFixed(3)}.`}
    ];
    animationIndex=-1;visualStep="data";render(false);updateAnimationButtons();
  }
  function showAnimationStep(){
    const step=animationSteps[animationIndex];if(!step)return;
    visualStep=step.stage;
    $("svm-animation-stage").textContent=step.title;
    $("svm-animation-counter").textContent=`${animationIndex+1} / ${animationSteps.length}`;
    $("svm-progress").style.width=`${100*(animationIndex+1)/animationSteps.length}%`;
    $("svm-live-step").textContent=step.text;
    $("svm-math-step").textContent=step.math;
    document.querySelectorAll("[data-svm-process]").forEach((n,i)=>{
      n.classList.toggle("is-active",i===animationIndex);
      n.classList.toggle("is-complete",i<animationIndex);
    });
    render(step.stage==="prediction");updateAnimationButtons();
  }
  function advanceAnimation(){
    if(!animationSteps.length)buildAnimation();
    if(animationIndex>=animationSteps.length-1){pauseAnimation();return false;}
    animationIndex++;showAnimationStep();
    if(animationIndex===animationSteps.length-1)pauseAnimation();
    return true;
  }
  function playAnimation(){
    if(!animationSteps.length||animationIndex>=animationSteps.length-1)buildAnimation();
    if(isPlaying)return;
    isPlaying=true;updateAnimationButtons();
    if(animationIndex===-1)advanceAnimation();
    function schedule(){
      if(!isPlaying)return;
      animationTimer=setTimeout(()=>{
        if(advanceAnimation()&&isPlaying)schedule();
      },Number($("svm-speed").value));
    }
    if(isPlaying)schedule();
  }
  function nextAnimation(){pauseAnimation();advanceAnimation();}
  function previousAnimation(){pauseAnimation();if(animationIndex>0){animationIndex--;showAnimationStep();}}
  function addSample(){
    if(data.length>=20)return;
    const source=data[Math.floor(Math.random()*data.length)];
    data.push({id:Math.max(...data.map(r=>r.id))+1,x:source.x,y:source.y,label:source.label});
    fit();renderTable();invalidateAnimation();render(false);updateSummary();
  }
  function removeSample(){
    if(data.length<=4)return;data.pop();fit();renderTable();invalidateAnimation();render(false);updateSummary();
  }
  function randomizeSamples(){
    const c=cfg();
    data=data.map(r=>{
      const x=clamp(r.x+(Math.random()-.5)*(c.x.max-c.x.min)*.13,c.x.min,c.x.max);
      const y=clamp(r.y+(Math.random()-.5)*(c.y.max-c.y.min)*.13,c.y.min,c.y.max);
      return {...r,x:Math.round(x/c.x.step)*c.x.step,y:Math.round(y/c.y.step)*c.y.step};
    });
    fit();renderTable();invalidateAnimation();render(false);updateSummary();
  }
  function selectExample(id){
    if(!EXAMPLES[id])return;
    current=id;const c=cfg();
    data=c.data.map((r,i)=>({id:i+1,...r}));
    query={x:c.x.default,y:c.y.default};
    document.querySelectorAll("[data-svm-example]").forEach(b=>{
      const active=b.dataset.svmExample===id;
      b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active));
    });
    $("svm-note").textContent=c.note;
    $("svm-query-title").textContent=`Test ${c.title}`;
    $("svm-query-emoji").textContent=c.icon+"?";
    fit();renderControls();renderTable();invalidateAnimation();render(false);updateSummary();
  }
  function randomPoint(){
    const c=cfg();query.x=c.x.min+Math.random()*(c.x.max-c.x.min);
    query.y=c.y.min+Math.random()*(c.y.max-c.y.min);
    query.x=Math.round(query.x/c.x.step)*c.x.step;
    query.y=Math.round(query.y/c.y.step)*c.y.step;
    renderControls();invalidateAnimation();render(false);
  }
  function reset(){selectExample(current);}
  function init(){
    if(!$("svm-playground"))return;
    injectStyles();buildPlayground();buildLearn();
    document.querySelectorAll("[data-svm-example]").forEach(b=>b.addEventListener("click",()=>selectExample(b.dataset.svmExample)));
    $("svm-classify").addEventListener("click",()=>{pauseAnimation();visualStep="full";render(true);});
    $("svm-reset").addEventListener("click",reset);
    $("svm-add").addEventListener("click",addSample);
    $("svm-remove").addEventListener("click",removeSample);
    $("svm-randomize").addEventListener("click",randomizeSamples);
    $("svm-detail").addEventListener("change",()=>{fit();invalidateAnimation();render(false);});
    $("svm-play").addEventListener("click",playAnimation);
    $("svm-pause").addEventListener("click",pauseAnimation);
    $("svm-next").addEventListener("click",nextAnimation);
    $("svm-previous").addEventListener("click",previousAnimation);
    $("svm-replay").addEventListener("click",()=>{buildAnimation();playAnimation();});
    selectExample("fruit");
  }
  init();
  return {reset,run:()=>render(true),selectExample};
})();
