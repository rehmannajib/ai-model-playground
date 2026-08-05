// models/decision-tree.js
"use strict";

const DecisionTree=(()=>{

const $=id=>document.getElementById(id);
const fmt=v=>Number(v).toFixed(3);

const MIN_SAMPLES=4;
const MAX_SAMPLES=15;

const featureConfig={
age:{label:"Age",min:0,max:120,defaultValue:30},
income:{label:"Income",min:0,max:1000000,defaultValue:45000},
score:{label:"Score",min:0,max:100,defaultValue:60},
experience:{label:"Experience",min:0,max:60,defaultValue:5}
};

const e={
body:$("tree-data-body"),
routingBody:$("tree-routing-body"),

feature:$("tree-feature"),
threshold:$("tree-threshold"),
criterion:$("tree-criterion"),

add:$("tree-add-sample"),
remove:$("tree-remove-sample"),
sampleCount:$("tree-sample-count"),

total:$("tree-total-samples"),
classA:$("tree-class-a-count"),
classB:$("tree-class-b-count"),
selectedFeature:$("tree-selected-feature"),

run:$("tree-run"),
reset:$("tree-reset"),
live:$("tree-live-step"),
visual:$("tree-visualization"),

parent:$("tree-parent-impurity"),
left:$("tree-left-impurity"),
right:$("tree-right-impurity"),
weighted:$("tree-weighted-impurity"),
gain:$("tree-information-gain"),

calc:$("tree-calculation-output")
};

const defaults=[
{id:1,age:22,income:28000,score:42,experience:1,label:"A"},
{id:2,age:25,income:32000,score:55,experience:2,label:"A"},
{id:3,age:29,income:35000,score:61,experience:3,label:"A"},
{id:4,age:35,income:48000,score:70,experience:6,label:"B"},
{id:5,age:42,income:55000,score:82,experience:10,label:"B"},
{id:6,age:51,income:68000,score:90,experience:15,label:"B"}
];

let data=defaults.map(row=>({...row}));

function clamp(value,min,max,fallback){
const number=Number.parseFloat(value);
return Number.isFinite(number)
?Math.min(max,Math.max(min,number))
:fallback;
}

function updateSummary(){
const counts=classCounts(data);

e.total.textContent=data.length;
e.classA.textContent=counts.A;
e.classB.textContent=counts.B;
e.sampleCount.textContent=`${data.length} / ${MAX_SAMPLES} samples`;
e.selectedFeature.textContent=featureConfig[e.feature.value].label;

e.add.disabled=data.length>=MAX_SAMPLES;
e.remove.disabled=data.length<=MIN_SAMPLES;
}

function renderTable(){
e.body.replaceChildren();

data.forEach(row=>{

const tr=document.createElement("tr");

const idCell=document.createElement("td");
idCell.textContent=row.id;

const ageCell=createNumberCell(row,"age");
const incomeCell=createNumberCell(row,"income");
const scoreCell=createNumberCell(row,"score");
const experienceCell=createNumberCell(row,"experience");

const classCell=document.createElement("td");
const classSelect=document.createElement("select");

["A","B"].forEach(label=>{
const option=document.createElement("option");
option.value=label;
option.textContent=`Class ${label}`;
option.selected=row.label===label;
classSelect.append(option);
});

classSelect.addEventListener("change",()=>{
row.label=classSelect.value;
invalidate();
});

classCell.append(classSelect);

tr.append(
idCell,
ageCell,
incomeCell,
scoreCell,
experienceCell,
classCell
);

e.body.append(tr);

});

updateSummary();
}

function createNumberCell(row,feature){
const td=document.createElement("td");
const input=document.createElement("input");
const config=featureConfig[feature];

input.type="number";
input.min=config.min;
input.max=config.max;
input.value=row[feature];

input.addEventListener("input",()=>{
const value=Number.parseFloat(input.value);

if(
Number.isFinite(value)&&
value>=config.min&&
value<=config.max
){
input.classList.remove("invalid");
row[feature]=value;
invalidate();
}else{
input.classList.add("invalid");
}
});

input.addEventListener("change",()=>{
row[feature]=clamp(
input.value,
config.min,
config.max,
row[feature]
);

input.value=row[feature];
input.classList.remove("invalid");
invalidate();
});

td.append(input);
return td;
}

function createNewSample(){
const last=data[data.length-1];

return{
id:data.length?Math.max(...data.map(row=>row.id))+1:1,
age:Math.min(120,(last?.age||25)+3),
income:(last?.income||30000)+5000,
score:Math.min(100,(last?.score||50)+4),
experience:Math.min(60,(last?.experience||2)+1),
label:data.length%2===0?"A":"B"
};
}

function addSample(){
if(data.length>=MAX_SAMPLES)return;

data.push(createNewSample());

renderTable();
invalidate();

e.live.textContent=
`Sample added. Dataset now contains ${data.length} samples.`;
}

function removeSample(){
if(data.length<=MIN_SAMPLES)return;

data.pop();

renderTable();
invalidate();

e.live.textContent=
`Last sample removed. Dataset now contains ${data.length} samples.`;
}

function classCounts(rows){
return rows.reduce((counts,row)=>{
counts[row.label]++;
return counts;
},{A:0,B:0});
}

function probabilities(rows){
if(!rows.length)return[];

const counts=classCounts(rows);
return Object.values(counts)
.filter(count=>count>0)
.map(count=>count/rows.length);
}

function impurity(rows){
if(!rows.length)return 0;

const probs=probabilities(rows);

if(e.criterion.value==="entropy"){
return-probs.reduce(
(sum,p)=>sum+p*Math.log2(p),
0
);
}

return 1-probs.reduce(
(sum,p)=>sum+p*p,
0
);
}

function majority(rows){
if(!rows.length)return"No Samples";

const counts=classCounts(rows);

if(counts.A===counts.B)return"Tie";

return counts.A>counts.B?"A":"B";
}

function calculate(){
const feature=e.feature.value;
const threshold=Number.parseFloat(e.threshold.value);

if(!Number.isFinite(threshold))return null;

const left=data.filter(row=>row[feature]<=threshold);
const right=data.filter(row=>row[feature]>threshold);

const parentImpurity=impurity(data);
const leftImpurity=impurity(left);
const rightImpurity=impurity(right);

const weightedImpurity=
(left.length/data.length)*leftImpurity+
(right.length/data.length)*rightImpurity;

return{
feature,
threshold,
left,
right,
parentImpurity,
leftImpurity,
rightImpurity,
weightedImpurity,
gain:parentImpurity-weightedImpurity
};
}

function featureName(feature){
return featureConfig[feature].label;
}

function sampleChip(row){
const chip=document.createElement("span");

chip.className=
`tree-sample class-${row.label.toLowerCase()}`;

chip.textContent=row.id;

chip.title=
`ID ${row.id}
Age: ${row.age}
Income: ${row.income}
Score: ${row.score}
Experience: ${row.experience}
Class: ${row.label}`;

return chip;
}

function createLeaf(condition,rows){
const wrapper=document.createElement("div");

const branch=document.createElement("div");
branch.className="tree-branch-label";
branch.textContent=condition;

const box=document.createElement("div");
box.className="tree-leaf-box";

const prediction=document.createElement("strong");
const majorityClass=majority(rows);

prediction.textContent=
majorityClass==="Tie"
?"Prediction: Tie"
:majorityClass==="No Samples"
?"Prediction: No Samples"
:`Prediction: Class ${majorityClass}`;

const counts=classCounts(rows);

const meta=document.createElement("span");
meta.textContent=
`${rows.length} sample${rows.length===1?"":"s"} · A=${counts.A}, B=${counts.B}`;

const samples=document.createElement("div");
samples.className="tree-samples";

rows.forEach(row=>
samples.append(sampleChip(row))
);

box.append(prediction,meta,samples);
wrapper.append(branch,box);

return wrapper;
}

function renderTree(result){
e.visual.replaceChildren();

const diagram=document.createElement("div");
diagram.className="tree-diagram";

const root=document.createElement("div");
root.className="tree-root tree-node-box";

const question=document.createElement("strong");
question.textContent=
`${featureName(result.feature)} ≤ ${result.threshold}?`;

const rootMeta=document.createElement("span");
rootMeta.textContent=
`${data.length} samples · ${
e.criterion.value==="gini"
?"Gini Impurity"
:"Entropy"
}`;

root.append(question,rootMeta);

const left=createLeaf(
`YES — ${featureName(result.feature)} ≤ ${result.threshold}`,
result.left
);
left.classList.add("tree-left");

const right=createLeaf(
`NO — ${featureName(result.feature)} > ${result.threshold}`,
result.right
);
right.classList.add("tree-right");

diagram.append(root,left,right);
e.visual.append(diagram);
}

function renderStats(result){
e.parent.textContent=fmt(result.parentImpurity);
e.left.textContent=fmt(result.leftImpurity);
e.right.textContent=fmt(result.rightImpurity);
e.weighted.textContent=fmt(result.weightedImpurity);
e.gain.textContent=fmt(result.gain);
}

function renderRouting(result){
e.routingBody.replaceChildren();

data.forEach(row=>{

const tr=document.createElement("tr");

const id=document.createElement("td");
id.textContent=row.id;

const value=document.createElement("td");
value.textContent=row[result.feature];

const condition=document.createElement("td");
condition.textContent=
`${row[result.feature]} ${
row[result.feature]<=result.threshold
?"≤"
:">"
} ${result.threshold}`;

const branch=document.createElement("td");
const left=row[result.feature]<=result.threshold;

branch.textContent=left?"Left / Yes":"Right / No";
branch.className=left?"tree-route-left":"tree-route-right";

const label=document.createElement("td");
label.textContent=`Class ${row.label}`;
label.className=
row.label==="A"
?"tree-class-a"
:"tree-class-b";

tr.append(id,value,condition,branch,label);

e.routingBody.append(tr);

});
}

function addCalculation(title,equation,result){
const box=document.createElement("div");
box.className="tree-calc-step";

const heading=document.createElement("strong");
heading.textContent=title;

const code=document.createElement("code");
code.textContent=equation;

const output=document.createElement("div");
output.className="cnn-calc-result";
output.textContent=result;

box.append(heading,code,output);
e.calc.append(box);
}

function probabilityText(rows){
const counts=classCounts(rows);
const total=rows.length;

if(!total)return"No samples";

return[
`p(A)=${counts.A}/${total}=${fmt(counts.A/total)}`,
`p(B)=${counts.B}/${total}=${fmt(counts.B/total)}`
].join(", ");
}

function renderCalculations(result){
e.calc.replaceChildren();

const parentCounts=classCounts(data);
const leftCounts=classCounts(result.left);
const rightCounts=classCounts(result.right);

addCalculation(
"1. Parent node",
`${data.length} samples · A=${parentCounts.A}, B=${parentCounts.B} · ${probabilityText(data)}`,
`${criterionName()} = ${fmt(result.parentImpurity)}`
);

addCalculation(
"2. Left branch",
`${featureName(result.feature)} ≤ ${result.threshold} · ${result.left.length} samples · A=${leftCounts.A}, B=${leftCounts.B} · ${probabilityText(result.left)}`,
`${criterionName()} = ${fmt(result.leftImpurity)}`
);

addCalculation(
"3. Right branch",
`${featureName(result.feature)} > ${result.threshold} · ${result.right.length} samples · A=${rightCounts.A}, B=${rightCounts.B} · ${probabilityText(result.right)}`,
`${criterionName()} = ${fmt(result.rightImpurity)}`
);

addCalculation(
"4. Weighted impurity",
`(${result.left.length}/${data.length} × ${fmt(result.leftImpurity)}) + (${result.right.length}/${data.length} × ${fmt(result.rightImpurity)})`,
`Weighted impurity = ${fmt(result.weightedImpurity)}`
);

addCalculation(
"5. Information gain",
`${fmt(result.parentImpurity)} − ${fmt(result.weightedImpurity)}`,
`Information gain = ${fmt(result.gain)}`
);

addCalculation(
"6. Leaf predictions",
`Left majority = ${majority(result.left)} · Right majority = ${majority(result.right)}`,
"Each leaf predicts its majority class."
);
}

function criterionName(){
return e.criterion.value==="gini"
?"Gini"
:"Entropy";
}

function updateThresholdForFeature(){
const feature=e.feature.value;
const values=data.map(row=>row[feature]);

const min=Math.min(...values);
const max=Math.max(...values);

const midpoint=Math.round(
(min+max)/2
);

e.threshold.min=featureConfig[feature].min;
e.threshold.max=featureConfig[feature].max;
e.threshold.value=midpoint;

updateSummary();
invalidate();

e.live.textContent=
`${featureName(feature)} selected. Threshold set near the dataset midpoint (${midpoint}).`;
}

function run(){
const result=calculate();

if(!result){
e.live.textContent=
"Enter a valid numerical threshold.";
return;
}

renderTree(result);
renderStats(result);
renderRouting(result);
renderCalculations(result);

e.live.textContent=
`Split complete: ${featureName(result.feature)} ≤ ${result.threshold}. Information gain = ${fmt(result.gain)}.`;
}

function clearResults(){
e.visual.innerHTML=
'<p class="muted">Build the tree to see the split.</p>';

[
e.parent,
e.left,
e.right,
e.weighted,
e.gain
].forEach(element=>{
element.textContent="—";
});

e.routingBody.replaceChildren();

e.calc.innerHTML=
"<p>Build the tree to see the calculations.</p>";
}

function invalidate(){
clearResults();
updateSummary();

e.live.textContent=
"Dataset or parameters changed. Build the tree again.";
}

function reset(){
data=defaults.map(row=>({...row}));

e.feature.value="age";
e.threshold.value="30";
e.criterion.value="gini";

renderTable();
clearResults();
updateSummary();

e.live.textContent=
"Reset complete. Build the tree when ready.";
}

e.feature.addEventListener(
"change",
updateThresholdForFeature
);

e.threshold.addEventListener(
"input",
invalidate
);

e.criterion.addEventListener(
"change",
invalidate
);

e.add.addEventListener(
"click",
addSample
);

e.remove.addEventListener(
"click",
removeSample
);

e.run.addEventListener(
"click",
run
);

e.reset.addEventListener(
"click",
reset
);

renderTable();
clearResults();
updateSummary();

return{
run,
reset
};

})();