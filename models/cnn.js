// models/cnn.js
"use strict";

const CNN=(()=>{

const $=id=>document.getElementById(id);
const copy=m=>m.map(r=>[...r]);
const fmt=v=>String(Math.round(v*1000)/1000);
const wait=ms=>new Promise(r=>setTimeout(r,ms));

const clamp=(v,min,max,f=0)=>{
const n=Number.parseFloat(v);
return Number.isFinite(n)?Math.min(max,Math.max(min,n)):f;
};

const e={
input:$("cnn-input-grid"),kernel:$("cnn-kernel-grid"),
feature:$("cnn-feature-map"),pool:$("cnn-pool-map"),
flatten:$("cnn-flatten-output"),calc:$("cnn-calculation-output"),

stride:$("cnn-stride"),padding:$("cnn-padding"),
pooling:$("cnn-pooling"),poolSize:$("cnn-pool-size"),
poolStride:$("cnn-pool-stride"),preset:$("cnn-kernel-preset"),

featureSize:$("cnn-feature-size"),
poolResultSize:$("cnn-pool-size-result"),
poolDescription:$("cnn-pooling-description"),

dimensionFeature:$("cnn-dimension-feature"),
dimensionPooling:$("cnn-dimension-pooling"),
dimensionEquation:$("cnn-dimension-equation"),
warning:$("cnn-config-warning"),

run:$("cnn-run"),reset:$("cnn-reset"),live:$("cnn-live-step"),
prev:$("cnn-prev-step"),next:$("cnn-next-step"),
auto:$("cnn-auto-play"),resetSteps:$("cnn-reset-steps"),

progress:$("cnn-progress-fill"),stepCount:$("cnn-step-count"),
currentTitle:$("cnn-current-title"),
currentEquation:$("cnn-current-equation"),
currentResult:$("cnn-current-result")
};

const defaultInput=[
[1,2,0,1,3],
[0,1,2,2,1],
[3,1,0,2,2],
[1,2,1,0,3],
[2,0,1,1,2]
];

const presets={
edge:[[1,0,-1],[1,0,-1],[1,0,-1]],
horizontal:[[1,1,1],[0,0,0],[-1,-1,-1]],
sharpen:[[0,-1,0],[-1,5,-1],[0,-1,0]],
blur:[[.11,.11,.11],[.11,.11,.11],[.11,.11,.11]]
};

let state={
input:copy(defaultInput),
kernel:copy(presets.edge),
feature:[],
steps:[],
current:-1,
playing:false
};

/* ---------- DIMENSIONS ---------- */

function featureDimension(){
const N=5,P=+e.padding.value,K=3,S=+e.stride.value;
return Math.floor((N+2*P-K)/S)+1;
}

function poolingDimension(featureSize){
if(e.pooling.value==="none")return featureSize;

const F=+e.poolSize.value;
const S=+e.poolStride.value;

if(featureSize<F)return 0;

return Math.floor((featureSize-F)/S)+1;
}

function updateDimensions(){
const feature=featureDimension();
const pooled=poolingDimension(feature);

e.dimensionFeature.textContent=`${feature} × ${feature}`;

if(e.pooling.value==="none"){
e.dimensionPooling.textContent="No Pooling";
e.poolSize.disabled=true;
e.poolStride.disabled=true;
e.poolDescription.textContent="Pooling is disabled. The feature map goes directly to flattening.";
}else{
e.poolSize.disabled=false;
e.poolStride.disabled=false;
e.dimensionPooling.textContent=pooled?`${pooled} × ${pooled}`:"Invalid";
e.poolDescription.textContent=
e.pooling.value==="max"
?"Max Pooling keeps the largest value in each window."
:"Average Pooling calculates the mean of each window.";
}

const N=5,P=+e.padding.value,K=3,S=+e.stride.value;

e.dimensionEquation.textContent=
`Feature map: floor((${N} + 2(${P}) - ${K}) / ${S}) + 1 = ${feature}`;

if(e.pooling.value!=="none"&&!pooled){
e.warning.hidden=false;
e.warning.textContent=
`The selected ${e.poolSize.value} × ${e.poolSize.value} pooling window cannot fit inside the ${feature} × ${feature} feature map. Choose a smaller pooling size or change stride/padding.`;
}else{
e.warning.hidden=true;
e.warning.textContent="";
}
}

/* ---------- EDITABLE MATRICES ---------- */

function createEditable(container,matrix,min,max,step,type){
container.replaceChildren();

matrix.forEach((row,r)=>row.forEach((value,c)=>{
const input=document.createElement("input");

input.type="number";
input.className="matrix-cell";
input.min=min;
input.max=max;
input.step=step;
input.value=fmt(value);
input.dataset.row=r;
input.dataset.column=c;

input.addEventListener("input",()=>{
const n=Number.parseFloat(input.value);

if(Number.isFinite(n)&&n>=min&&n<=max){
input.classList.remove("invalid");
state[type][r][c]=n;
if(type==="kernel")e.preset.value="custom";
invalidate();
}else{
input.classList.add("invalid");
}
});

input.addEventListener("change",()=>{
const safe=clamp(input.value,min,max);
input.value=fmt(safe);
input.classList.remove("invalid");
state[type][r][c]=safe;

if(type==="kernel")e.preset.value="custom";

invalidate();
});

container.append(input);
}));
}

function renderEditable(){
createEditable(e.input,state.input,0,9,1,"input");
createEditable(e.kernel,state.kernel,-3,3,.01,"kernel");
}

/* ---------- CONVOLUTION ---------- */

function paddedMatrix(){
const p=+e.padding.value;

if(!p)return copy(state.input);

const size=5+p*2;
const matrix=Array.from({length:size},()=>Array(size).fill(0));

state.input.forEach((row,r)=>
row.forEach((v,c)=>matrix[r+p][c+p]=v)
);

return matrix;
}

function calculate(){
const padded=paddedMatrix();
const stride=+e.stride.value;
const padding=+e.padding.value;
const size=featureDimension();

state.feature=[];
state.steps=[];

for(let or=0;or<size;or++){
const row=[];

for(let oc=0;oc<size;oc++){
const sr=or*stride;
const sc=oc*stride;

let sum=0;
const products=[];

for(let kr=0;kr<3;kr++){
for(let kc=0;kc<3;kc++){

const inputValue=padded[sr+kr][sc+kc];
const kernelValue=state.kernel[kr][kc];
const product=inputValue*kernelValue;

sum+=product;

products.push({
inputValue,kernelValue,
paddedRow:sr+kr,
paddedColumn:sc+kc
});

}
}

row.push(sum);

state.steps.push({
or,oc,padding,
products,sum
});
}

state.feature.push(row);
}
}

/* ---------- FEATURE MAP ---------- */

function renderFeature(blank=true){
e.feature.replaceChildren();

if(!state.feature.length)return;

e.feature.style.gridTemplateColumns=
`repeat(${state.feature[0].length},1fr)`;

state.feature.forEach((row,r)=>row.forEach((value,c)=>{
const cell=document.createElement("div");

cell.className="cnn-result-cell";
if(blank)cell.classList.add("pending");

cell.dataset.row=r;
cell.dataset.column=c;
cell.textContent=fmt(value);

e.feature.append(cell);
}));

e.featureSize.textContent=
`${state.feature.length} × ${state.feature[0].length}`;
}

/* ---------- HIGHLIGHT ---------- */

function clearHighlights(){
e.input.querySelectorAll(".matrix-cell")
.forEach(x=>x.classList.remove("highlight"));

e.kernel.querySelectorAll(".matrix-cell")
.forEach(x=>x.classList.remove("kernel-highlight"));

e.feature.querySelectorAll(".cnn-result-cell")
.forEach(x=>x.classList.remove("active"));
}

function highlight(step,index){
clearHighlights();

step.products.forEach((p,i)=>{
const row=p.paddedRow-step.padding;
const col=p.paddedColumn-step.padding;

if(row>=0&&row<5&&col>=0&&col<5){
const cell=e.input.querySelector(
`[data-row="${row}"][data-column="${col}"]`
);
if(cell)cell.classList.add("highlight");
}

const kr=Math.floor(i/3),kc=i%3;

const kernel=e.kernel.querySelector(
`[data-row="${kr}"][data-column="${kc}"]`
);

if(kernel)kernel.classList.add("kernel-highlight");
});

const feature=e.feature.querySelector(
`[data-row="${step.or}"][data-column="${step.oc}"]`
);

if(feature){
feature.classList.remove("pending");
feature.classList.add("active");
}

e.currentTitle.textContent=
`Feature Map Row ${step.or+1}, Column ${step.oc+1}`;

e.currentEquation.textContent=
step.products
.map(p=>`(${fmt(p.inputValue)} × ${fmt(p.kernelValue)})`)
.join(" + ");

e.currentResult.textContent=`= ${fmt(step.sum)}`;

updateProgress();
}

/* ---------- STEPS ---------- */

function prepare(){
calculate();
renderFeature(true);
clearSecondary();
state.current=-1;
updateProgress();
}

function showStep(index){
if(!state.steps.length)prepare();

state.current=Math.max(
0,
Math.min(index,state.steps.length-1)
);

renderFeature(true);

for(let i=0;i<=state.current;i++){
const s=state.steps[i];

const cell=e.feature.querySelector(
`[data-row="${s.or}"][data-column="${s.oc}"]`
);

if(cell)cell.classList.remove("pending");
}

highlight(state.steps[state.current],state.current);

e.live.textContent=
`Convolution step ${state.current+1} of ${state.steps.length}.`;

if(state.current===state.steps.length-1)finish();
}

function next(){
if(state.playing)return;

if(!state.steps.length)prepare();

if(state.current<state.steps.length-1)
showStep(state.current+1);
}

function previous(){
if(state.playing||!state.steps.length)return;

if(state.current>0){
showStep(state.current-1);
}else{
resetStepView();
}
}

async function autoPlay(){
if(state.playing)return;

prepare();

state.playing=true;
setButtons(true);

for(let i=0;i<state.steps.length;i++){
state.current=i;
highlight(state.steps[i],i);

e.live.textContent=
`Convolution step ${i+1} of ${state.steps.length}.`;

await wait(450);
}

state.playing=false;
setButtons(false);
finish();
}

function updateProgress(){
const total=state.steps.length;
const current=Math.max(0,state.current+1);

e.stepCount.textContent=`Step ${current} / ${total}`;

e.progress.style.width=
total?`${current/total*100}%`:"0%";
}

function setButtons(disabled){
e.run.disabled=disabled;
e.prev.disabled=disabled;
e.next.disabled=disabled;
e.reset.disabled=disabled;
e.resetSteps.disabled=disabled;
}

/* ---------- POOLING ---------- */

function pool(){
if(e.pooling.value==="none")
return copy(state.feature);

const size=+e.poolSize.value;
const stride=+e.poolStride.value;

if(!poolingDimension(state.feature.length))
return null;

const output=[];

for(
let r=0;
r+size<=state.feature.length;
r+=stride
){

const row=[];

for(
let c=0;
c+size<=state.feature[0].length;
c+=stride
){

const values=[];

for(let pr=0;pr<size;pr++)
for(let pc=0;pc<size;pc++)
values.push(state.feature[r+pr][c+pc]);

row.push(
e.pooling.value==="average"
?values.reduce((a,b)=>a+b,0)/values.length
:Math.max(...values)
);

}

if(row.length)output.push(row);
}

return output;
}

function renderResult(container,matrix){
container.replaceChildren();

if(!matrix||!matrix.length)return;

container.style.gridTemplateColumns=
`repeat(${matrix[0].length},1fr)`;

matrix.forEach(row=>row.forEach(value=>{
const cell=document.createElement("div");

cell.className="cnn-result-cell";
cell.textContent=fmt(value);

container.append(cell);
}));
}

/* ---------- FLATTEN ---------- */

function renderFlatten(matrix){
e.flatten.replaceChildren();

matrix.flat().forEach(value=>{
const cell=document.createElement("span");

cell.className="flatten-value";
cell.textContent=fmt(value);

e.flatten.append(cell);
});
}

/* ---------- CALCULATIONS ---------- */

function renderCalculations(){
e.calc.replaceChildren();

state.steps.forEach((s,i)=>{
const box=document.createElement("div");
box.className="cnn-calc-step";

const title=document.createElement("strong");
title.textContent=
`Step ${i+1}: Feature Map (${s.or+1}, ${s.oc+1})`;

const equation=document.createElement("code");
equation.textContent=
s.products
.map(p=>`(${fmt(p.inputValue)} × ${fmt(p.kernelValue)})`)
.join(" + ");

const result=document.createElement("div");
result.className="cnn-calc-result";
result.textContent=`= ${fmt(s.sum)}`;

box.append(title,equation,result);
e.calc.append(box);
});
}

/* ---------- FINISH ---------- */

function finish(){
clearHighlights();

const pooled=pool();

if(!pooled){
e.live.textContent=
"Convolution finished, but the selected pooling configuration is invalid.";

e.pool.replaceChildren();
e.poolResultSize.textContent="Invalid";

e.flatten.innerHTML=
"<span>Choose a valid pooling configuration.</span>";

return;
}

renderResult(e.pool,pooled);

e.poolResultSize.textContent=
`${pooled.length} × ${pooled[0].length}`;

renderFlatten(pooled);
renderCalculations();

const length=pooled.flat().length;

e.live.textContent=
e.pooling.value==="none"
?`Convolution complete. Pooling skipped → ${length} flattened values.`
:`Convolution and pooling complete → ${length} flattened values.`;

e.currentTitle.textContent="CNN Processing Complete";

e.currentEquation.textContent=
e.pooling.value==="none"
?"Feature map was flattened directly."
:`${e.pooling.options[e.pooling.selectedIndex].text} applied using ${e.poolSize.value} × ${e.poolSize.value} windows with stride ${e.poolStride.value}.`;

e.currentResult.textContent=
`Final matrix: ${pooled.length} × ${pooled[0].length}`;

updateProgress();
}

async function run(){
await autoPlay();
}

/* ---------- CLEAR / RESET ---------- */

function clearSecondary(){
e.pool.replaceChildren();
e.flatten.replaceChildren();
e.calc.replaceChildren();

e.poolResultSize.textContent="—";

e.flatten.innerHTML=
"<span>Complete the convolution to generate the vector.</span>";

e.calc.innerHTML=
"<p>Complete the convolution to see all calculations.</p>";
}

function resetStepView(){
state.current=-1;

if(!state.feature.length){
calculate();
}

renderFeature(true);
clearHighlights();
clearSecondary();

e.currentTitle.textContent=
"No convolution step selected";

e.currentEquation.textContent=
"Use Next or Auto Play to begin.";

e.currentResult.textContent="";

e.live.textContent=
"Ready. Use Next or Auto Play.";

updateProgress();
}

function invalidate(){
state.steps=[];
state.feature=[];
state.current=-1;

e.feature.replaceChildren();
e.featureSize.textContent="—";

clearSecondary();

e.currentTitle.textContent=
"Parameters changed";

e.currentEquation.textContent=
"Start a new convolution to use the updated values.";

e.currentResult.textContent="";

e.progress.style.width="0%";
e.stepCount.textContent="Step 0 / 0";

updateDimensions();
}

function applyPreset(){
if(e.preset.value==="custom")return;

state.kernel=copy(
presets[e.preset.value]
);

renderEditable();
invalidate();
}

function reset(){
state.playing=false;

state.input=copy(defaultInput);
state.kernel=copy(presets.edge);

e.stride.value="1";
e.padding.value="0";
e.pooling.value="max";
e.poolSize.value="2";
e.poolStride.value="2";
e.preset.value="edge";

renderEditable();
invalidate();

e.live.textContent=
"Reset complete.";
}

/* ---------- EVENTS ---------- */

function attach(){
e.run.addEventListener("click",run);
e.reset.addEventListener("click",reset);

e.prev.addEventListener("click",previous);
e.next.addEventListener("click",next);
e.auto.addEventListener("click",autoPlay);
e.resetSteps.addEventListener("click",resetStepView);

e.preset.addEventListener("change",applyPreset);

[
e.stride,
e.padding,
e.pooling,
e.poolSize,
e.poolStride
].forEach(control=>{
control.addEventListener("change",invalidate);
});
}

function init(){
if(!e.input)return;

renderEditable();
updateDimensions();
invalidate();
attach();
}

init();

return{run,reset};

})();