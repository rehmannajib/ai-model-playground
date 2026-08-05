// models/cnn.js
"use strict";

const CNN = (() => {

const $ = id => document.getElementById(id);
const clamp=(v,min,max,f=0)=>{
  const n=Number.parseFloat(v);
  return Number.isFinite(n)?Math.min(max,Math.max(min,n)):f;
};
const fmt=v=>String(Math.round(v*1000)/1000);
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

const e={
input:$("cnn-input-grid"),
kernel:$("cnn-kernel-grid"),
feature:$("cnn-feature-map"),
pool:$("cnn-pool-map"),
flatten:$("cnn-flatten-output"),
calc:$("cnn-calculation-output"),
stride:$("cnn-stride"),
padding:$("cnn-padding"),
pooling:$("cnn-pooling"),
poolSize:$("cnn-pool-size"),
preset:$("cnn-kernel-preset"),
featureSize:$("cnn-feature-size"),
poolResultSize:$("cnn-pool-size-result"),
run:$("cnn-run"),
reset:$("cnn-reset"),
live:$("cnn-live-step"),
prev:$("cnn-prev-step"),
next:$("cnn-next-step"),
auto:$("cnn-auto-play"),
resetSteps:$("cnn-reset-steps"),
progress:$("cnn-progress-fill"),
stepCount:$("cnn-step-count"),
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
steps:[],
feature:[],
current:-1,
playing:false
};

function copy(m){return m.map(r=>[...r]);}

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
}else input.classList.add("invalid");
});

input.addEventListener("change",()=>{
const safe=clamp(input.value,min,max,0);
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

function paddedMatrix(){
const p=+e.padding.value;
if(!p)return copy(state.input);

const size=state.input.length+p*2;
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
const kernelSize=3;
const outSize=Math.floor((padded.length-kernelSize)/stride)+1;

const feature=[];
const steps=[];

for(let or=0;or<outSize;or++){
const row=[];

for(let oc=0;oc<outSize;oc++){
const sr=or*stride,sc=oc*stride;
let sum=0;
const products=[];

for(let kr=0;kr<3;kr++){
for(let kc=0;kc<3;kc++){
const inputValue=padded[sr+kr][sc+kc];
const kernelValue=state.kernel[kr][kc];
const product=inputValue*kernelValue;
sum+=product;

products.push({
inputValue,
kernelValue,
product,
paddedRow:sr+kr,
paddedColumn:sc+kc
});
}
}

row.push(sum);
steps.push({
or,oc,sr,sc,padding,products,sum
});
}

feature.push(row);
}

state.feature=feature;
state.steps=steps;
}

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

function clearHighlights(){
document.querySelectorAll("#cnn-input-grid .matrix-cell")
.forEach(x=>x.classList.remove("highlight"));

document.querySelectorAll("#cnn-kernel-grid .matrix-cell")
.forEach(x=>x.classList.remove("kernel-highlight"));

document.querySelectorAll("#cnn-feature-map .cnn-result-cell")
.forEach(x=>x.classList.remove("active"));
}

function highlight(step,index){
clearHighlights();

step.products.forEach((p,i)=>{
const originalRow=p.paddedRow-step.padding;
const originalColumn=p.paddedColumn-step.padding;

if(
originalRow>=0&&
originalRow<5&&
originalColumn>=0&&
originalColumn<5
){
const input=e.input.querySelector(
`[data-row="${originalRow}"][data-column="${originalColumn}"]`
);
if(input)input.classList.add("highlight");
}

const kr=Math.floor(i/3);
const kc=i%3;
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
step.products.map(p=>
`(${fmt(p.inputValue)} × ${fmt(p.kernelValue)})`
).join(" + ");

e.currentResult.textContent=`= ${fmt(step.sum)}`;

e.live.textContent=
`Convolution step ${index+1} of ${state.steps.length}.`;

updateProgress();
}

function updateProgress(){
const total=state.steps.length;
const completed=Math.max(0,state.current+1);

e.stepCount.textContent=`Step ${completed} / ${total}`;
e.progress.style.width=
total?`${(completed/total)*100}%`:"0%";
}

function showStep(index){
if(!state.steps.length)prepare();

index=Math.max(0,Math.min(index,state.steps.length-1));
state.current=index;

for(let i=0;i<=index;i++){
const s=state.steps[i];
const cell=e.feature.querySelector(
`[data-row="${s.or}"][data-column="${s.oc}"]`
);
if(cell)cell.classList.remove("pending");
}

highlight(state.steps[index],index);

if(index===state.steps.length-1){
finish();
}
}

function prepare(){
calculate();
renderFeature(true);
state.current=-1;
clearSecondaryResults();
updateProgress();
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
state.current--;

renderFeature(true);

for(let i=0;i<=state.current;i++){
const s=state.steps[i];
const cell=e.feature.querySelector(
`[data-row="${s.or}"][data-column="${s.oc}"]`
);
if(cell)cell.classList.remove("pending");
}

highlight(state.steps[state.current],state.current);

}else{
resetStepView();
}
}

async function autoPlay(){
if(state.playing)return;

prepare();
state.playing=true;
toggleControls(true);

for(let i=0;i<state.steps.length;i++){
if(!state.playing)break;
state.current=i;
highlight(state.steps[i],i);
await wait(500);
}

state.playing=false;
toggleControls(false);

if(state.current===state.steps.length-1)
finish();
}

function toggleControls(disabled){
e.run.disabled=disabled;
e.prev.disabled=disabled;
e.next.disabled=disabled;
e.reset.disabled=disabled;
e.resetSteps.disabled=disabled;
}

function pool(){
const size=+e.poolSize.value;
const type=e.pooling.value;
const result=[];

for(let r=0;r+size<=state.feature.length;r+=size){
const row=[];

for(let c=0;c+size<=state.feature[0].length;c+=size){
const values=[];

for(let pr=0;pr<size;pr++)
for(let pc=0;pc<size;pc++)
values.push(state.feature[r+pr][c+pc]);

row.push(
type==="average"
?values.reduce((a,b)=>a+b,0)/values.length
:Math.max(...values)
);
}

if(row.length)result.push(row);
}

return result.length?result:copy(state.feature);
}

function renderResult(container,matrix){
container.replaceChildren();

if(!matrix.length)return;

container.style.gridTemplateColumns=
`repeat(${matrix[0].length},1fr)`;

matrix.forEach(row=>row.forEach(value=>{
const cell=document.createElement("div");
cell.className="cnn-result-cell";
cell.textContent=fmt(value);
container.append(cell);
}));
}

function flatten(matrix){
return matrix.flat();
}

function renderFlatten(values){
e.flatten.replaceChildren();

values.forEach(v=>{
const cell=document.createElement("span");
cell.className="flatten-value";
cell.textContent=fmt(v);
e.flatten.append(cell);
});
}

function renderCalculations(){
e.calc.replaceChildren();

state.steps.forEach((s,i)=>{
const box=document.createElement("div");
box.className="cnn-calc-step";

const title=document.createElement("strong");
title.textContent=
`Step ${i+1}: Feature Map (${s.or+1}, ${s.oc+1})`;

const equation=document.createElement("code");
equation.textContent=s.products
.map(p=>`(${fmt(p.inputValue)} × ${fmt(p.kernelValue)})`)
.join(" + ");

const result=document.createElement("div");
result.className="cnn-calc-result";
result.textContent=`= ${fmt(s.sum)}`;

box.append(title,equation,result);
e.calc.append(box);
});
}

function finish(){
clearHighlights();

const pooled=pool();
renderResult(e.pool,pooled);

e.poolResultSize.textContent=
`${pooled.length} × ${pooled[0].length}`;

const vector=flatten(pooled);
renderFlatten(vector);
renderCalculations();

e.live.textContent=
`Convolution complete → pooling complete → ${vector.length} flattened value${vector.length===1?"":"s"}.`;

e.currentTitle.textContent="Convolution Complete";
e.currentEquation.textContent=
"All kernel positions have been processed.";
e.currentResult.textContent=
`Feature map: ${state.feature.length} × ${state.feature[0].length}`;

updateProgress();
}

async function run(){
await autoPlay();
}

function clearSecondaryResults(){
e.pool.replaceChildren();
e.flatten.replaceChildren();
e.calc.replaceChildren();

e.poolResultSize.textContent="—";

const flat=document.createElement("span");
flat.textContent="Complete the convolution to generate the vector.";
e.flatten.append(flat);

const calc=document.createElement("p");
calc.textContent="Complete the convolution to see all calculations.";
e.calc.append(calc);
}

function resetStepView(){
state.current=-1;

renderFeature(true);
clearHighlights();
clearSecondaryResults();

e.currentTitle.textContent="No convolution step selected";
e.currentEquation.textContent=
"Use Next Step or Auto Play to begin.";
e.currentResult.textContent="";

e.live.textContent=
"Ready. Use Next Step or Auto Play.";

updateProgress();
}

function invalidate(){
state.steps=[];
state.feature=[];
state.current=-1;

e.feature.replaceChildren();
e.featureSize.textContent="—";

clearSecondaryResults();

e.currentTitle.textContent="Parameters changed";
e.currentEquation.textContent=
"Start a new convolution to use the updated values.";
e.currentResult.textContent="";

e.progress.style.width="0%";
e.stepCount.textContent="Step 0 / 0";
}

function applyPreset(){
if(e.preset.value==="custom")return;
state.kernel=copy(presets[e.preset.value]);
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
e.preset.value="edge";

renderEditable();
invalidate();

e.live.textContent=
"Reset complete. Use Next Step or Run CNN.";
}

function attach(){
e.run.addEventListener("click",run);
e.reset.addEventListener("click",reset);
e.prev.addEventListener("click",previous);
e.next.addEventListener("click",next);
e.auto.addEventListener("click",autoPlay);
e.resetSteps.addEventListener("click",resetStepView);
e.preset.addEventListener("change",applyPreset);

[e.stride,e.padding,e.pooling,e.poolSize]
.forEach(control=>
control.addEventListener("change",invalidate)
);
}

function init(){
if(!e.input)return;
renderEditable();
invalidate();
attach();
}

init();

return{run,reset};

})();