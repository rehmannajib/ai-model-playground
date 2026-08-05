// script.js
"use strict";

const NS="http://www.w3.org/2000/svg",MIN=0,MAX=1,PMIN=-1,PMAX=1;
const $=id=>document.getElementById(id),num=v=>Number.parseFloat(v),clamp=(v,min,max,f)=>Number.isFinite(num(v))?Math.min(max,Math.max(min,num(v))):f,fmt=v=>Number(v).toFixed(3),svg=t=>document.createElementNS(NS,t);

const e={
inputs:$("architecture-inputs"),layers:$("architecture-hidden-layers"),hidden:$("hidden-layer-settings"),apply:$("apply-architecture"),
restore:$("restore-default"),desc:$("architecture-description"),controls:$("dynamic-input-controls"),activation:$("activation-function"),
bias:$("output-bias"),biasNum:$("output-bias-number"),biasDisplay:$("output-bias-display"),run:$("run-network"),reset:$("reset-network"),
svg:$("network-svg"),pred:$("prediction-value"),predText:$("prediction-description"),hc:$("result-hidden-layers"),
neurons:$("result-total-neurons"),connections:$("result-total-connections"),weighted:$("result-weighted-output"),
final:$("result-final-output"),calc:$("calculation-output"),simple:$("simple-mode"),advanced:$("advanced-mode"),
editor:$("parameter-editor"),editorTitle:$("editor-title"),editorDescription:$("editor-description"),
ps:$("parameter-slider"),pn:$("parameter-number"),pd:$("parameter-display"),close:$("close-editor"),
live:$("live-step"),tooltip:$("weight-tooltip")
};

let state={inputCount:3,hidden:[3],inputs:[.5,.75,.25],weights:[],biases:[],advanced:false,selected:null};

const act=(x,n)=>n==="sigmoid"?1/(1+Math.exp(-x)):n==="tanh"?Math.tanh(x):Math.max(0,x);
const sigmoid=x=>1/(1+Math.exp(-x));
const defaults=n=>[.5,.75,.25,.6,.35,.85,.45,.7].slice(0,n);
const makeWeight=(l,s,d)=>((((l+1)*17+(s+1)*13+(d+1)*7)%21)-10)/10;
const makeBias=(l,n)=>((((l+1)*11+(n+1)*5)%11)-5)/20;

function renderHidden(){
 const n=+e.layers.value,old=[...e.hidden.querySelectorAll("select")].map(x=>+x.value);e.hidden.replaceChildren();
 for(let i=0;i<n;i++){const l=document.createElement("label"),s=document.createElement("select");l.textContent=`Layer ${i+1} neurons`;
  for(let j=1;j<=8;j++){const o=document.createElement("option");o.value=j;o.textContent=j;if(j===(old[i]||3))o.selected=true;s.append(o)}
  l.append(s);e.hidden.append(l)}
}

function buildParams(){
 const sizes=[state.inputCount,...state.hidden,1];state.weights=[];state.biases=[];
 for(let l=0;l<sizes.length-1;l++){const W=[],B=[];
  for(let d=0;d<sizes[l+1];d++){W[d]=Array.from({length:sizes[l]},(_,s)=>makeWeight(l,s,d));B[d]=makeBias(l,d)}
  state.weights.push(W);state.biases.push(B)}
}

function renderInputs(){
 e.controls.replaceChildren();
 state.inputs.forEach((v,i)=>{
  const g=document.createElement("div"),h=document.createElement("div"),lab=document.createElement("label"),out=document.createElement("output"),row=document.createElement("div"),s=document.createElement("input"),n=document.createElement("input"),lim=document.createElement("div");
  g.className="control-group";h.className="control-head";row.className="value-row";lim.className="limits";lab.textContent=`Input x${i+1}`;out.textContent=v.toFixed(2);
  s.type="range";s.min=0;s.max=1;s.step=.01;s.value=v;n.type="number";n.min=0;n.max=1;n.step=.01;n.value=v.toFixed(2);n.className="number-input";
  const set=x=>{x=clamp(x,0,1,0);state.inputs[i]=x;s.value=x;n.value=x.toFixed(2);out.textContent=x.toFixed(2);n.classList.remove("invalid");updateInput(i,x);clearResults()};
  s.addEventListener("input",()=>set(s.value));
  n.addEventListener("input",()=>{const x=num(n.value);if(Number.isFinite(x)&&x>=0&&x<=1){state.inputs[i]=x;s.value=x;out.textContent=x.toFixed(2);n.classList.remove("invalid");updateInput(i,x);clearResults()}else n.classList.add("invalid")});
  n.addEventListener("change",()=>set(n.value));
  h.append(lab,out);row.append(s,n);lim.innerHTML="<span>Min 0</span><span>Max 1</span>";g.append(h,row,lim);e.controls.append(g);
 })
}

function geometry(){
 const sizes=[state.inputCount,...state.hidden,1],w=Math.max(700,sizes.length*230),h=Math.max(440,Math.max(...sizes)*88+100),p=[];
 sizes.forEach((count,l)=>{const x=95+l*((w-190)/(sizes.length-1)),gap=count>1?(h-150)/(count-1):0;p.push(Array.from({length:count},(_,i)=>({x,y:count===1?h/2:75+i*gap})))});
 return{w,h,p}
}

function renderNetwork(){
 e.svg.replaceChildren();const {w,h,p}=geometry();e.svg.setAttribute("viewBox",`0 0 ${w} ${h}`);e.svg.style.minWidth=`${w}px`;

 for(let l=0;l<p.length-1;l++)for(let s=0;s<p[l].length;s++)for(let d=0;d<p[l+1].length;d++){
  const line=svg("line"),v=state.weights[l][d][s];Object.entries({x1:p[l][s].x,y1:p[l][s].y,x2:p[l+1][d].x,y2:p[l+1][d].y}).forEach(([k,x])=>line.setAttribute(k,x));
  line.classList.add("connection");if(v<0)line.classList.add("negative");line.style.strokeWidth=String(1.5+Math.abs(v)*4);Object.assign(line.dataset,{layer:l,source:s,dest:d});
  line.addEventListener("mouseenter",ev=>showTooltip(ev,`Weight: ${v.toFixed(2)}`));line.addEventListener("mousemove",moveTooltip);line.addEventListener("mouseleave",hideTooltip);line.addEventListener("click",()=>openWeight(l,s,d));e.svg.append(line)
 }

 p.forEach((layer,l)=>{
  const label=svg("text");label.setAttribute("x",layer[0].x);label.setAttribute("y",28);label.setAttribute("text-anchor","middle");label.classList.add("layer-label");label.textContent=l===0?"Input":l===p.length-1?"Output":`Hidden ${l}`;e.svg.append(label);
  layer.forEach((pos,n)=>{
   const c=svg("circle"),t=svg("text");c.setAttribute("cx",pos.x);c.setAttribute("cy",pos.y);c.setAttribute("r",l===p.length-1?38:32);c.classList.add("node",l===0?"input":l===p.length-1?"output":"hidden");Object.assign(c.dataset,{layer:l,neuron:n});
   if(l>0&&l<p.length-1){c.addEventListener("click",()=>openBias(l-1,n));c.addEventListener("mouseenter",ev=>showTooltip(ev,`Bias: ${state.biases[l-1][n].toFixed(2)}`));c.addEventListener("mousemove",moveTooltip);c.addEventListener("mouseleave",hideTooltip)}
   t.setAttribute("x",pos.x);t.setAttribute("y",pos.y+5);t.setAttribute("text-anchor","middle");t.classList.add("node-text");Object.assign(t.dataset,{layer:l,neuron:n});t.textContent=l===0?state.inputs[n].toFixed(2):"—";
   e.svg.append(c,t);
   if(l>0&&l<p.length-1){const b=svg("text");b.setAttribute("x",pos.x);b.setAttribute("y",pos.y+51);b.setAttribute("text-anchor","middle");b.classList.add("bias-label");b.textContent=`b=${state.biases[l-1][n].toFixed(2)}`;e.svg.append(b)}
  })
 })
}

function showTooltip(ev,text){e.tooltip.textContent=text;e.tooltip.hidden=false;moveTooltip(ev)}
function moveTooltip(ev){e.tooltip.style.left=`${ev.clientX+12}px`;e.tooltip.style.top=`${ev.clientY+12}px`}
function hideTooltip(){e.tooltip.hidden=true}
function updateInput(i,v){const t=e.svg.querySelector(`.node-text[data-layer="0"][data-neuron="${i}"]`);if(t)t.textContent=v.toFixed(2)}

function showEditor(v){e.editor.hidden=false;e.ps.value=v;e.pn.value=Number(v).toFixed(2);e.pd.textContent=Number(v).toFixed(2)}
function openWeight(l,s,d){if(!state.advanced)return;state.selected={type:"weight",l,s,d};e.editorTitle.textContent="Edit connection weight";e.editorDescription.textContent=`Layer ${l+1}: neuron ${s+1} → neuron ${d+1}`;showEditor(state.weights[l][d][s])}
function openBias(l,n){if(!state.advanced)return;state.selected={type:"bias",l,n};e.editorTitle.textContent="Edit neuron bias";e.editorDescription.textContent=`Hidden layer ${l+1}, neuron ${n+1}`;showEditor(state.biases[l][n])}
function setParameter(v){if(!state.selected)return;const x=clamp(v,-1,1,0);state.selected.type==="weight"?state.weights[state.selected.l][state.selected.d][state.selected.s]=x:state.biases[state.selected.l][state.selected.n]=x;e.ps.value=x;e.pn.value=x.toFixed(2);e.pd.textContent=x.toFixed(2);renderNetwork();clearResults()}

function forward(){
 let cur=[...state.inputs],all=[[...cur]],sums=[],details=[];
 for(let l=0;l<state.weights.length;l++){
  const outputLayer=l===state.weights.length-1,next=[],zs=[],layerDetails=[];
  for(let d=0;d<state.weights[l].length;d++){
   const b=outputLayer?clamp(e.bias.value,-1,1,.1):state.biases[l][d],parts=[];let z=b;
   state.weights[l][d].forEach((w,s)=>{parts.push({input:cur[s],weight:w});z+=cur[s]*w});
   const a=outputLayer?sigmoid(z):act(z,e.activation.value);zs.push(z);next.push(a);layerDetails.push({parts,bias:b,z,a,outputLayer})
  }
  sums.push(zs);details.push(layerDetails);all.push(next);cur=next
 }
 return{all,sums,details,final:cur[0]}
}

function stats(){const sizes=[state.inputCount,...state.hidden,1];return{neurons:sizes.reduce((a,b)=>a+b,0),connections:sizes.slice(0,-1).reduce((t,n,i)=>t+n*sizes[i+1],0)}}

function updateResults(r){
 r.all.forEach((layer,l)=>{if(!l)return;layer.forEach((v,n)=>{const t=e.svg.querySelector(`.node-text[data-layer="${l}"][data-neuron="${n}"]`);if(t)t.textContent=fmt(v)})});
 const st=stats(),z=r.sums.at(-1)[0];e.pred.textContent=fmt(r.final);e.predText.textContent=r.final>=.75?"Relatively high output.":r.final>=.5?"Moderately high output.":r.final>=.25?"Moderately low output.":"Relatively low output.";
 e.hc.textContent=state.hidden.length;e.neurons.textContent=st.neurons;e.connections.textContent=st.connections;e.weighted.textContent=fmt(z);e.final.textContent=fmt(r.final);renderCalculation(r)
}

function renderCalculation(r){
 e.calc.replaceChildren();
 r.details.forEach((layer,l)=>layer.forEach((d,n)=>{
  const box=document.createElement("div");box.className="calc-step";
  const title=document.createElement("strong"),eq=document.createElement("code"),a=document.createElement("div");
  const outputLayer=d.outputLayer;title.textContent=outputLayer?"Output neuron":`Hidden ${l+1}, neuron ${n+1}`;
  eq.textContent=`z = ${d.parts.map(p=>`(${fmt(p.input)} × ${fmt(p.weight)})`).join(" + ")} + ${fmt(d.bias)} = ${fmt(d.z)}`;
  a.className="calc-activation";a.textContent=outputLayer?`sigmoid(${fmt(d.z)}) = ${fmt(d.a)}`:`${e.activation.value}(${fmt(d.z)}) = ${fmt(d.a)}`;
  box.append(title,eq,a);e.calc.append(box)
 }))
}

const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function animate(r){
 e.run.disabled=true;
 for(let l=0;l<state.weights.length;l++){
  e.live.textContent=l===state.weights.length-1?"Calculating the output layer...":`Calculating hidden layer ${l+1}...`;
  const lines=e.svg.querySelectorAll(`.connection[data-layer="${l}"]`),nodes=e.svg.querySelectorAll(`.node[data-layer="${l+1}"]`);
  lines.forEach(x=>x.classList.add("active"));await wait(450);nodes.forEach(x=>x.classList.add("active"));
  r.all[l+1].forEach((v,n)=>{const t=e.svg.querySelector(`.node-text[data-layer="${l+1}"][data-neuron="${n}"]`);if(t)t.textContent=fmt(v)});
  await wait(550);lines.forEach(x=>x.classList.remove("active"));nodes.forEach(x=>x.classList.remove("active"))
 }
 e.live.textContent=`Forward pass complete. Final output = ${fmt(r.final)}`;e.run.disabled=false
}

async function run(){const r=forward();await animate(r);updateResults(r)}

function clearResults(){
 [e.hc,e.neurons,e.connections,e.weighted,e.final].forEach(x=>x.textContent="—");e.pred.textContent="—";e.predText.textContent="Run the network to calculate an output.";e.calc.innerHTML="<p>Run the network to see the complete calculations.</p>";e.live.textContent="Ready. Change the values and run the network.";
 e.svg.querySelectorAll(".node-text").forEach(t=>{if(+t.dataset.layer>0)t.textContent="—"})
}

function setBias(v){const x=clamp(v,-1,1,.1);e.bias.value=x;e.biasNum.value=x.toFixed(2);e.biasDisplay.textContent=x.toFixed(2);e.biasNum.classList.remove("invalid");clearResults()}
function applyArchitecture(){state.inputCount=+e.inputs.value;state.hidden=[...e.hidden.querySelectorAll("select")].map(x=>+x.value);state.inputs=defaults(state.inputCount);buildParams();renderInputs();renderNetwork();e.desc.textContent=[`${state.inputCount} Input${state.inputCount===1?"":"s"}`,...state.hidden.map((n,i)=>`Hidden ${i+1}: ${n}`),"1 Output"].join(" → ");clearResults()}
function reset(){state.inputs=defaults(state.inputCount);e.activation.value="relu";setBias(.1);renderInputs();renderNetwork();clearResults()}
function restore(){e.inputs.value=3;e.layers.value=1;renderHidden();e.hidden.querySelector("select").value=3;applyArchitecture()}
function setMode(advanced){state.advanced=advanced;e.simple.classList.toggle("active",!advanced);e.advanced.classList.toggle("active",advanced);e.editor.hidden=true;state.selected=null;e.live.textContent=advanced?"Advanced mode: click a connection or hidden neuron to edit it.":"Simple mode: weights and biases remain fixed."}

e.layers.addEventListener("change",renderHidden);e.apply.addEventListener("click",applyArchitecture);e.restore.addEventListener("click",restore);e.run.addEventListener("click",run);e.reset.addEventListener("click",reset);
e.simple.addEventListener("click",()=>setMode(false));e.advanced.addEventListener("click",()=>setMode(true));e.close.addEventListener("click",()=>e.editor.hidden=true);
e.bias.addEventListener("input",()=>setBias(e.bias.value));e.biasNum.addEventListener("input",()=>{const v=num(e.biasNum.value);if(Number.isFinite(v)&&v>=-1&&v<=1){e.bias.value=v;e.biasDisplay.textContent=v.toFixed(2);e.biasNum.classList.remove("invalid");clearResults()}else e.biasNum.classList.add("invalid")});e.biasNum.addEventListener("change",()=>setBias(e.biasNum.value));
e.ps.addEventListener("input",()=>setParameter(e.ps.value));e.pn.addEventListener("input",()=>{const v=num(e.pn.value);if(Number.isFinite(v)&&v>=-1&&v<=1)setParameter(v);else e.pn.classList.add("invalid")});e.pn.addEventListener("change",()=>setParameter(e.pn.value));
document.querySelectorAll(".tab").forEach(tab=>tab.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===tab));["beginner","math","calc"].forEach(name=>$(name+"-panel").hidden=name!==tab.dataset.tab)}));

renderHidden();setBias(.1);applyArchitecture();