"use strict";
/* Naive Bayes — two interactive categorical examples.
   Drop-in replacement for models/naive-bayes.js. No HTML changes required. */
const NaiveBayesModel = (() => {
  const root = document.getElementById("naive-bayes-playground");
  if (!root) return {run(){},reset(){}};

  const WORDS = ["Free","Winner","Offer","Meeting","Project","Invoice"];
  const definitions = {
    spam: {
      title:"Spam vs Not Spam", labels:["Spam","Not Spam"],
      features:WORDS.map(w=>({key:w, name:w, values:["No","Yes"]})),
      rows:[
        ["Yes","Yes","Yes","No","No","No","Spam"],
        ["Yes","No","Yes","No","No","No","Spam"],
        ["No","Yes","Yes","No","No","No","Spam"],
        ["Yes","Yes","No","No","No","No","Spam"],
        ["No","No","No","Yes","Yes","Yes","Not Spam"],
        ["No","No","No","Yes","Yes","No","Not Spam"],
        ["No","No","No","Yes","No","Yes","Not Spam"],
        ["No","No","Yes","Yes","Yes","Yes","Not Spam"]
      ],
      query:["Yes","Yes","No","No","No","No"]
    },
    weather: {
      title:"Weather Activity Prediction", labels:["Suitable","Not Suitable"],
      features:[
        {key:"outlook",name:"Outlook",values:["Sunny","Cloudy","Rainy"]},
        {key:"temperature",name:"Temperature",values:["Hot","Mild","Cold"]},
        {key:"humidity",name:"Humidity",values:["High","Normal"]},
        {key:"wind",name:"Wind",values:["Weak","Strong"]}
      ],
      rows:[
        ["Sunny","Mild","Normal","Weak","Suitable"],
        ["Cloudy","Hot","High","Weak","Suitable"],
        ["Cloudy","Mild","Normal","Strong","Suitable"],
        ["Sunny","Hot","Normal","Strong","Suitable"],
        ["Rainy","Mild","Normal","Weak","Suitable"],
        ["Rainy","Cold","High","Strong","Not Suitable"],
        ["Sunny","Hot","High","Weak","Not Suitable"],
        ["Rainy","Mild","High","Strong","Not Suitable"],
        ["Sunny","Cold","High","Strong","Not Suitable"],
        ["Cloudy","Cold","Normal","Weak","Suitable"]
      ],
      query:["Sunny","Mild","Normal","Weak"]
    }
  };
  let example="spam", rows=[], query=[], steps=[], position=0, playing=false, timer=null;
  let speed=900;
  const $ = id=>root.querySelector("#"+id);
  const esc = s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const opts=(values,selected)=>values.map(v=>`<option value="${esc(v)}"${v===selected?" selected":""}>${esc(v)}</option>`).join("");
  const fixed=x=>Number.isFinite(x)?x.toFixed(3):"0.000";
  const pct=x=>(100*x).toFixed(1)+"%";

  function stop(){ playing=false; clearTimeout(timer); timer=null; }
  function defaults(){
    const d=definitions[example];
    rows=d.rows.map((r,i)=>({id:i+1,values:r.slice(0,-1),label:r.at(-1)}));
    query=d.query.slice();
  }
  function drawShell(){
    const d=definitions[example];
    root.innerHTML=`
      <div class="heading"><span class="label">Naive Bayes Playground</span>
        <h2>Classify familiar examples using probability</h2>
        <p>Choose an example, configure an unknown case, then watch Naive Bayes combine prior probabilities and feature likelihoods to make its decision.</p></div>

      <section class="card knn-example-card">
        <div class="knn-example-heading"><div><span class="label">CHOOSE AN EXAMPLE</span>
          <h3>What would you like Naive Bayes to predict?</h3>
          <p>Switching examples changes the features, training data and classes. The probability algorithm stays the same.</p></div></div>
        <div class="knn-example-options nbx-example-options">
          <button type="button" class="knn-example-option ${example==="spam"?"is-active":""}" data-nbx-example="spam">
            <span class="knn-example-icon">📧</span><strong>Spam vs Not Spam</strong><small>Classify emails using their words</small></button>
          <button type="button" class="knn-example-option ${example==="weather"?"is-active":""}" data-nbx-example="weather">
            <span class="knn-example-icon">☀️🌧️</span><strong>Weather Prediction</strong><small>Predict suitability for outdoor activities</small></button>
        </div>
        <div class="knn-example-description"><strong>${esc(d.title)}</strong><span id="nbx-context"></span></div>
        <select id="nbx-example" class="nbx-hidden" aria-label="Selected example"><option value="spam">Spam</option><option value="weather">Weather</option></select>
      </section>

      <section class="card knn-controls">
        <div class="knn-settings">
          <label>Features Used by Naive Bayes
            <select id="nbx-feature-count">${[2,3,4,5,6].filter(n=>n<=d.features.length).map(n=>`<option value="${n}" ${n===d.features.length?"selected":""}>${n} Features</option>`).join("")}</select>
          </label>
          <label>Laplace Smoothing <select id="nbx-alpha"><option value="0.5">α = 0.5</option><option value="1" selected>α = 1</option><option value="2">α = 2</option></select></label>
        </div>
        <p class="knn-normalization-note"><strong>How it works:</strong> Each active feature contributes evidence. Laplace smoothing avoids zero probabilities when a feature value has not appeared in a class.</p>
        <div class="knn-control-actions">
          <button class="btn primary" id="nbx-randomize">↻ Generate New Data</button>
          <button class="btn" id="nbx-add">+ Add Training Sample</button>
          <button class="btn" id="nbx-remove-last">− Remove Last Sample</button>
          <span id="nbx-count" class="knn-sample-count"></span>
        </div>
      </section>

      <section class="card knn-feature-card">
        <span class="label">ACTIVE FEATURES</span><h3>Features used in the probability calculation</h3>
        <div id="nbx-feature-chips" class="knn-feature-chips"></div>
      </section>

      <section class="card knn-summary-card"><div class="knn-summary-grid">
        <div><span>Training Samples</span><strong id="nbx-total">—</strong></div>
        <div><span id="nbx-label-a">${esc(d.labels[0])}</span><strong id="nbx-total-a">—</strong></div>
        <div><span id="nbx-label-b">${esc(d.labels[1])}</span><strong id="nbx-total-b">—</strong></div>
        <div><span>Active Features</span><strong id="nbx-feature-total">—</strong></div>
        <div><span>Smoothing α</span><strong id="nbx-alpha-label">1</strong></div>
      </div></section>

      <section class="card knn-query-card">
        <div class="knn-query-heading"><div><span class="label">UNKNOWN SAMPLE</span>
          <h3>${example==="spam"?"Is this email spam?":"Is the weather suitable?"}</h3>
          <p class="muted">Adjust the values below, then run an instant prediction or watch the animation.</p></div>
          <div class="knn-query-badge">${example==="spam"?"📧":"🌤️"}</div></div>
        <div id="nbx-query" class="nbx-query"></div>
      </section>

      <div class="knn-workspace">
        <section class="card knn-panel knn-dataset-panel">
          <div class="knn-panel-heading"><span class="step">1</span><div><h3>Training Dataset</h3>
            <p>Edit the labelled examples used to estimate probabilities.</p></div></div>
          <div class="knn-table-wrap"><table class="knn-table nbx-table">
            <thead id="nbx-head"></thead><tbody id="nbx-body"></tbody></table></div>
        </section>
        <section class="card knn-panel">
          <div class="knn-panel-heading"><span class="step">2</span><div><h3>Live Probability Visualization</h3>
            <p>Watch the probability of each class change as new evidence is applied.</p></div></div>
          <div id="nbx-bars" class="nbx-bars"></div>
          <div id="nbx-feature-visual" class="nbx-feature-visual"></div>
          <div class="knn-legend"><span><i class="knn-dot class-a"></i>${esc(d.labels[0])}</span>
            <span><i class="knn-dot class-b"></i>${esc(d.labels[1])}</span></div>
        </section>
      </div>

      <div class="knn-toolbar card"><div><small>NAIVE BAYES PIPELINE</small>
        <strong>Unknown Sample → Priors → Feature Likelihoods → Normalize → Prediction</strong></div>
        <div class="actions knn-main-actions">
          <button id="nbx-instant" class="btn primary">Instant Predict</button>
          <button id="nbx-reset" class="btn">Reset Example</button>
        </div></div>

      <section class="card knn-animation-card">
        <div class="knn-animation-heading"><div><span class="label">STEP-BY-STEP MODE</span>
          <h3>Watch Naive Bayes think</h3><p>Play, pause or advance through every probability calculation.</p></div>
          <div class="knn-animation-status"><span id="nbx-stage">Ready</span>
            <strong id="nbx-counter">0 / 0</strong></div></div>
        <div class="knn-animation-controls">
          <button id="nbx-play" class="btn primary">▶ Play Animation</button>
          <button id="nbx-pause" class="btn" disabled>Ⅱ Pause</button>
          <button id="nbx-prev" class="btn">← Previous</button>
          <button id="nbx-next" class="btn">Next Step →</button>
          <label class="knn-speed-control">Animation Speed
            <select id="nbx-speed"><option value="1600">Slow</option><option value="900" selected>Normal</option><option value="450">Fast</option></select>
          </label>
        </div>
        <div class="knn-progress-track"><div id="nbx-progress" class="knn-progress-bar"></div></div>
        <div id="nbx-step" class="live-step knn-live-step" aria-live="polite">Configure an unknown sample and press Play Animation.</div>
      </section>

      <section class="card knn-prediction-card">
        <span class="label">PREDICTION</span><h3>Posterior probability comparison</h3>
        <div class="knn-summary-grid">
          <div><span>${esc(d.labels[0])} probability</span><strong id="nbx-prob-a">—</strong></div>
          <div><span>${esc(d.labels[1])} probability</span><strong id="nbx-prob-b">—</strong></div>
          <div><span>Predicted Class</span><strong id="nbx-predicted">—</strong></div>
        </div><div id="nbx-result" aria-live="polite"></div>
      </section>

      <section class="card knn-panel">
        <div class="knn-panel-heading"><span class="step">3</span><div>
          <h3>Live Calculation</h3><p>Follow the exact probabilities and arithmetic at each step.</p></div></div>
        <div class="nbx-formula">P(class | features) ∝ P(class) × ∏ P(feature value | class)</div>
        <div id="nbx-calculations">Run or animate to see the calculations.</div>
      </section>
      <section class="card knn-panel"><span class="label">HOW THE MODEL WORKS</span>
        <h3>Naive Bayes process</h3><div class="nbx-process">
          ${["query","prior","likelihood","normalize","prediction"].map((v,i)=>`<div data-nbx-process="${v}"><span>${i+1}</span><strong>${["Read Features","Calculate Priors","Apply Likelihoods","Normalize Scores","Choose Class"][i]}</strong></div>`).join("")}
        </div></section>`;
    $("nbx-example").value=example;
    root.querySelectorAll("[data-nbx-example]").forEach(b=>b.addEventListener("click",()=>{
      if(example===b.dataset.nbxExample)return;
      stop();example=b.dataset.nbxExample;defaults();drawShell();renderAll();
    }));
    $("nbx-feature-count").addEventListener("change",()=>{stop();renderQuery();renderTable();invalidate();renderSummary();});
    $("nbx-alpha").addEventListener("change",()=>{stop();invalidate();renderSummary();});
    $("nbx-instant").addEventListener("click",()=>{prepare();position=steps.length-1;showStep();});
    $("nbx-remove-last").addEventListener("click",()=>{
      if(rows.length<=4)return;stop();rows.pop();invalidate();renderTable();renderSummary();
    });
    $("nbx-randomize").addEventListener("click",()=>{
      stop();const d=definitions[example];
      rows=Array.from({length:10},(_,i)=>{
        const source=d.rows[Math.floor(Math.random()*d.rows.length)];
        return {id:i+1,values:source.slice(0,-1).map((v,j)=>Math.random()<0.14?
          d.features[j].values[Math.floor(Math.random()*d.features[j].values.length)]:v),label:source.at(-1)};
      });renderTable();invalidate();renderSummary();
    });
    $("nbx-reset").addEventListener("click",()=>{stop();defaults();renderAll();});
    $("nbx-play").addEventListener("click",()=>{prepare();play();});
    $("nbx-pause").addEventListener("click",()=>{if(playing){stop();}else if(steps.length){play();}else{prepare();play();}updateControls();});
    $("nbx-prev").addEventListener("click",()=>{stop();if(!steps.length)prepare();position=Math.max(0,position-1);showStep();});
    $("nbx-next").addEventListener("click",()=>{stop();if(!steps.length)prepare();position=Math.min(steps.length-1,position+1);showStep();});
    $("nbx-speed").addEventListener("change",e=>{speed=+e.target.value;});
    $("nbx-add").addEventListener("click",()=>{if(rows.length>=20)return;stop();const id=Math.max(0,...rows.map(r=>r.id))+1;rows.push({id,values:d.features.map(f=>f.values[0]),label:d.labels[0]});invalidate();renderTable();renderSummary();});
    $("nbx-body").addEventListener("change",e=>{
      const el=e.target.closest("[data-id]");if(!el)return;
      const row=rows.find(r=>r.id===+el.dataset.id);if(!row)return;
      if(el.dataset.field==="label")row.label=el.value;
      else row.values[+el.dataset.field]=el.value;
      stop();invalidate();renderSummary();
    });
    $("nbx-body").addEventListener("click",e=>{
      const el=e.target.closest("[data-remove]");if(!el)return;
      if(rows.length<=2){alert("Keep at least two training examples.");return;}
      stop();rows=rows.filter(r=>r.id!==+el.dataset.remove);invalidate();renderTable();renderSummary();
    });
    $("nbx-query").addEventListener("change",e=>{
      const el=e.target.closest("[data-query]");if(!el)return;
      query[+el.dataset.query]=el.value;stop();invalidate();
    });
  }
  function activeFeatures(){return definitions[example].features.slice(0,+$("nbx-feature-count").value);}
  function renderSummary(){
    const d=definitions[example], a=rows.filter(r=>r.label===d.labels[0]).length;
    $("nbx-total").textContent=rows.length;$("nbx-total-a").textContent=a;
    $("nbx-total-b").textContent=rows.length-a;
    $("nbx-feature-total").textContent=activeFeatures().length;
    $("nbx-alpha-label").textContent=$("nbx-alpha").value;
    $("nbx-count").textContent=`${rows.length} / 20 training samples`;
    $("nbx-add").disabled=rows.length>=20;$("nbx-remove-last").disabled=rows.length<=4;
    $("nbx-feature-chips").innerHTML=activeFeatures().map(f=>`<span class="knn-feature-chip">${esc(f.name)}</span>`).join("");
  }
  function renderQuery(){
    const d=definitions[example];
    $("nbx-context").textContent=example==="spam"
      ?"Choose which words appear in an email, then predict Spam or Not Spam."
      :"Choose the weather conditions, then predict whether they are suitable for an outdoor activity.";
    $("nbx-query").innerHTML=activeFeatures().map((f,i)=>`<label>${esc(f.name)}
      <select data-query="${i}">${opts(f.values,query[i])}</select></label>`).join("");
  }
  function renderTable(){
    const d=definitions[example];
    $("nbx-head").innerHTML="<tr><th>#</th>"+activeFeatures().map(f=>`<th>${esc(f.name)}</th>`).join("")+"<th>Class</th><th></th></tr>";
    $("nbx-body").innerHTML=rows.map((r,i)=>`<tr><td>${i+1}</td>`+
      activeFeatures().map((f,j)=>`<td><select data-id="${r.id}" data-field="${j}">${opts(f.values,r.values[j])}</select></td>`).join("")+
      `<td><select data-id="${r.id}" data-field="label">${opts(d.labels,r.label)}</select></td>
      <td><button class="nbx-remove" data-remove="${r.id}" aria-label="Remove example ${i+1}" title="Remove example">×</button></td></tr>`).join("");
  }
  function invalidate(){
    steps=[];position=0;
    $("nbx-step").innerHTML='<span class="nbx-muted">Ready for a new prediction.</span>';
    $("nbx-bars").innerHTML="";$("nbx-feature-visual").innerHTML="";
    $("nbx-prob-a").textContent="—";$("nbx-prob-b").textContent="—";$("nbx-predicted").textContent="—";
    $("nbx-stage").textContent="Ready";$("nbx-counter").textContent="0 / 0";$("nbx-progress").style.width="0%";
    root.querySelectorAll("[data-nbx-process]").forEach(x=>x.classList.remove("is-active","is-complete"));
    $("nbx-result").innerHTML="";
    $("nbx-calculations").textContent="Press Play Prediction to see the calculations.";
    updateControls();
  }
  function calculate(){
    const d=definitions[example], n=rows.length, k=d.labels.length, alpha=+$("nbx-alpha").value;
    // Smoothed class priors prevent log(0) when students edit every label.
    const counts=d.labels.map(c=>rows.filter(r=>r.label===c).length);
    const priors=counts.map(c=>(c+alpha)/(n+alpha*k));
    const logScores=priors.map(Math.log);
    const normalize=logs=>{
      const max=Math.max(...logs),exp=logs.map(v=>Math.exp(v-max)),sum=exp.reduce((a,b)=>a+b,0);
      return exp.map(v=>v/sum);
    };
    const sequence=[{
      title:"Step 1 — Prior probabilities",
      explanation:"Count how many training examples belong to each class. Apply add-one smoothing to the class priors.",
      probabilities:normalize(logScores), details:d.labels.map((c,i)=>`P(${c}) = (${counts[i]} + ${alpha}) / (${n} + ${alpha} × ${k}) = ${fixed(priors[i])}`)
    }];
    activeFeatures().forEach((f,j)=>{
      const lines=[];
      d.labels.forEach((c,i)=>{
        const count=rows.filter(r=>r.label===c&&r.values[j]===query[j]).length;
        const likelihood=(count+alpha)/(counts[i]+alpha*f.values.length);
        logScores[i]+=Math.log(likelihood);
        lines.push(`P(${f.name}=${query[j]} | ${c}) = (${count} + ${alpha}) / (${counts[i]} + ${alpha} × ${f.values.length}) = ${fixed(likelihood)}`);
      });
      sequence.push({
        title:`Step ${j+2} — ${f.name}: ${query[j]}`, feature:f.name,
        explanation:"Multiply each class score by this feature's conditional probability (computed in log space). The bars show normalized scores after this feature.",
        probabilities:normalize(logScores),details:lines
      });
    });
    const final=normalize(logScores),winner=d.labels[final[0]>=final[1]?0:1];
    sequence.push({
      title:`Step ${activeFeatures().length+2} — Final decision`,
      explanation:"Normalize the class scores so the probabilities add up to 100%, then select the class with the higher posterior probability.",
      probabilities:final,details:d.labels.map((c,i)=>`P(${c} | selected features) = ${pct(final[i])}`),
      winner
    });
    return sequence;
  }
  function prepare(){stop();steps=calculate();position=0;showStep();}
  function showStep(){
    if(!steps.length)return;
    const d=definitions[example],s=steps[position];
    $("nbx-step").innerHTML=`<h4>${esc(s.title)}</h4><p>${esc(s.explanation)}</p>`;
    $("nbx-stage").textContent=s.winner?"Prediction":position===0?"Priors":"Likelihood";
    $("nbx-counter").textContent=`${position+1} / ${steps.length}`;
    $("nbx-progress").style.width=`${100*(position+1)/steps.length}%`;
    const activeProcess=s.winner?"prediction":position===0?"prior":position===steps.length-2?"normalize":"likelihood";
    const order=["query","prior","likelihood","normalize","prediction"];
    root.querySelectorAll("[data-nbx-process]").forEach(node=>{
      const index=order.indexOf(node.dataset.nbxProcess),current=order.indexOf(activeProcess);
      node.classList.toggle("is-active",index===current);
      node.classList.toggle("is-complete",index<current);
    });
    $("nbx-bars").innerHTML=d.labels.map((label,i)=>`<div class="nbx-bar-row">
      <div class="nbx-bar-label"><strong>${esc(label)}</strong><span>${pct(s.probabilities[i])}</span></div>
      <div class="nbx-track"><div class="nbx-fill ${i===0?"first":"second"}" style="width:${(s.probabilities[i]*100).toFixed(4)}%"></div></div>
      </div>`).join("");
    $("nbx-feature-visual").innerHTML=activeFeatures().map((f,i)=>`<div class="nbx-evidence ${s.feature===f.name?"is-current":""} ${position>i?"is-done":""}"><span>${esc(f.name)}</span><strong>${esc(query[i])}</strong><small>${position>i?"Evidence applied":"Waiting"}</small></div>`).join("");
    $("nbx-prob-a").textContent=s.winner?pct(s.probabilities[0]):"—";
    $("nbx-prob-b").textContent=s.winner?pct(s.probabilities[1]):"—";
    $("nbx-predicted").textContent=s.winner?s.winner:"—";
    $("nbx-calculations").innerHTML=`<h4>${esc(s.title)}</h4>`+
      s.details.map(x=>`<div class="nbx-math-line">${esc(x)}</div>`).join("");
    $("nbx-result").innerHTML=s.winner?`<div class="nbx-winner">✓ Prediction: ${esc(s.winner)}</div>`:"";
    updateControls();
  }
  function updateControls(){
    $("nbx-pause").disabled=!playing;
    $("nbx-prev").disabled=playing||!!steps.length&&position===0;
    $("nbx-next").disabled=playing||!!steps.length&&position===steps.length-1;
  }
  function play(){
    if(!steps.length)prepare();
    if(position===steps.length-1){position=0;showStep();}
    stop();playing=true;updateControls();
    const tick=()=>{
      if(!playing)return;
      if(position>=steps.length-1){stop();updateControls();return;}
      position++;showStep();timer=setTimeout(tick,speed);
    };
    timer=setTimeout(tick,speed);
  }
  function renderAll(){renderQuery();renderTable();invalidate();renderSummary();}
  const style=document.createElement("style");
  style.textContent=`
    #naive-bayes-playground .nbx-hidden{display:none}
    #naive-bayes-playground .nbx-example-options{grid-template-columns:repeat(2,minmax(0,1fr))}
    #naive-bayes-playground .nbx-query{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:18px}
    #naive-bayes-playground .nbx-query label{display:block;font-weight:650;font-size:14px}
    #naive-bayes-playground .nbx-query select{display:block;width:100%;padding:10px;margin-top:6px;border:1px solid #cbd5e1;border-radius:9px;background:white}
    #naive-bayes-playground .nbx-table select{min-width:85px;max-width:140px;padding:7px;border:1px solid #cbd5e1;border-radius:7px;background:white}
    #naive-bayes-playground .nbx-remove{border:0;border-radius:6px;background:#fef2f2;color:#b91c1c;padding:4px 10px;font-size:20px;cursor:pointer}
    #naive-bayes-playground .nbx-bars{margin:20px 0}
    #naive-bayes-playground .nbx-bar-row{margin:18px 0}
    #naive-bayes-playground .nbx-bar-label{display:flex;justify-content:space-between;font-size:14px;margin-bottom:7px}
    #naive-bayes-playground .nbx-track{height:20px;background:#e9eef5;border-radius:99px;overflow:hidden}
    #naive-bayes-playground .nbx-fill{height:100%;border-radius:99px;transition:width .6s ease}
    #naive-bayes-playground .nbx-fill.first{background:#2563eb}
    #naive-bayes-playground .nbx-fill.second{background:#f59e0b}
    #naive-bayes-playground .nbx-feature-visual{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:22px}
    #naive-bayes-playground .nbx-evidence{padding:12px;border:1px solid #e2e8f0;border-radius:10px;display:flex;flex-direction:column;gap:4px}
    #naive-bayes-playground .nbx-evidence span{font-size:12px;color:#64748b}
    #naive-bayes-playground .nbx-evidence strong{font-size:15px}
    #naive-bayes-playground .nbx-evidence small{font-size:11px;color:#64748b}
    #naive-bayes-playground .nbx-evidence.is-done{background:#eff6ff;border-color:#bfdbfe}
    #naive-bayes-playground .nbx-evidence.is-current{outline:2px solid #2563eb}
    #naive-bayes-playground .nbx-formula{padding:15px;background:#eff6ff;border-radius:9px;overflow-wrap:anywhere;font-family:ui-monospace,monospace}
    #naive-bayes-playground .nbx-math-line{padding:10px;margin:8px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow-wrap:anywhere;font-family:ui-monospace,monospace;font-size:13px}
    #naive-bayes-playground #nbx-calculations{margin-top:16px}
    #naive-bayes-playground .nbx-winner{margin:15px 0;padding:13px;border-radius:9px;background:#ecfdf5;color:#065f46;font-weight:750}
    #naive-bayes-playground .nbx-process{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-top:18px}
    #naive-bayes-playground .nbx-process>div{display:flex;flex-direction:column;gap:8px;padding:13px;border:1px solid #e2e8f0;border-radius:10px;font-size:12px}
    #naive-bayes-playground .nbx-process span{display:grid;place-items:center;width:27px;height:27px;background:#f1f5f9;border-radius:50%}
    #naive-bayes-playground .nbx-process .is-active{background:#eff6ff;border-color:#2563eb}
    #naive-bayes-playground .nbx-process .is-complete{background:#f0fdf4;border-color:#86efac}
    #naive-bayes-playground .knn-animation-controls select{min-height:38px;border:1px solid #cbd5e1;border-radius:8px;padding:7px}
    @media(max-width:700px){#naive-bayes-playground .nbx-process{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:500px){#naive-bayes-playground .nbx-query,#naive-bayes-playground .nbx-example-options{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){#naive-bayes-playground .nbx-fill{transition:none}}
  `;
  document.head.append(style);
  defaults();drawShell();renderAll();
  // Preserve existing application calls to NaiveBayesModel.run/reset.
  return {run(){prepare();play();},reset(){stop();defaults();renderAll();}};
})();
