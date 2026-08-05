"use strict";

/* =========================================
   DECISION TREE PLAYGROUND
========================================= */

const DecisionTree = (() => {

const $ = id =>
document.getElementById(id);


const MIN_SAMPLES = 4;
const MAX_SAMPLES = 15;


/* =========================================
   DECISION TREE - FEATURE DEFINITIONS
========================================= */

const FEATURE_ORDER = [
"age",
"income",
"score",
"experience"
];


const FEATURE_CONFIG = {

age:{
label:"Age",
min:0,
max:120
},

income:{
label:"Income",
min:0,
max:1000000
},

score:{
label:"Score",
min:0,
max:100
},

experience:{
label:"Experience",
min:0,
max:60
}

};


/* =========================================
   DECISION TREE - DEFAULT DATA
========================================= */

const defaults = [

{
id:1,
age:22,
income:28000,
score:42,
experience:1,
label:"A"
},

{
id:2,
age:25,
income:32000,
score:55,
experience:2,
label:"A"
},

{
id:3,
age:29,
income:35000,
score:61,
experience:3,
label:"A"
},

{
id:4,
age:35,
income:48000,
score:70,
experience:6,
label:"B"
},

{
id:5,
age:42,
income:55000,
score:82,
experience:10,
label:"B"
},

{
id:6,
age:51,
income:68000,
score:90,
experience:15,
label:"B"
}

];


/* =========================================
   DECISION TREE - HTML ELEMENTS
========================================= */

const e = {

featureCount:
$("tree-feature-count"),

feature:
$("tree-feature"),

threshold:
$("tree-threshold"),

criterion:
$("tree-criterion"),

head:
$("tree-data-head"),

body:
$("tree-data-body"),

routingBody:
$("tree-routing-body"),

comparisonBody:
$("tree-comparison-body"),

comparisonPanel:
$("tree-comparison-panel"),

activeFeatures:
$("tree-active-features"),

add:
$("tree-add-sample"),

remove:
$("tree-remove-sample"),

sampleCount:
$("tree-sample-count"),

total:
$("tree-total-samples"),

classA:
$("tree-class-a-count"),

classB:
$("tree-class-b-count"),

activeFeatureCount:
$("tree-active-feature-count"),

selectedFeature:
$("tree-selected-feature"),

run:
$("tree-run"),

best:
$("tree-best-split"),

reset:
$("tree-reset"),

live:
$("tree-live-step"),

visual:
$("tree-visualization"),

parent:
$("tree-parent-impurity"),

left:
$("tree-left-impurity"),

right:
$("tree-right-impurity"),

weighted:
$("tree-weighted-impurity"),

gain:
$("tree-information-gain"),

calc:
$("tree-calculation-output"),

bestCard:
$("tree-best-result-card"),

bestFeature:
$("tree-best-feature"),

bestThreshold:
$("tree-best-threshold"),

bestGain:
$("tree-best-gain"),

splitsTested:
$("tree-splits-tested")

};


let data =
defaults.map(
row => ({...row})
);


/* =========================================
   DECISION TREE - HELPERS
========================================= */

function fmt(value){

return Number(
value
).toFixed(3);

}


function formatThreshold(value){

if(
Math.abs(value) >= 1000
){

return Math.round(
value
).toLocaleString();

}

return Number(
value.toFixed(2)
).toString();

}


function clamp(
value,
minimum,
maximum,
fallback
){

const number =
Number.parseFloat(
value
);

if(
!Number.isFinite(number)
){

return fallback;

}

return Math.min(
maximum,
Math.max(
minimum,
number
)
);

}


function featureName(feature){

return FEATURE_CONFIG[
feature
].label;

}


/* =========================================
   DECISION TREE - ACTIVE FEATURES
========================================= */

function activeFeatures(){

const count =
Number.parseInt(
e.featureCount.value,
10
);

return FEATURE_ORDER.slice(
0,
count
);

}


function renderActiveFeatures(){

const features =
activeFeatures();


e.activeFeatures
.replaceChildren();


features.forEach(
feature => {

const chip =
document.createElement(
"span"
);

chip.className =
"tree-feature-chip";

chip.textContent =
featureName(feature);

e.activeFeatures
.append(chip);

}
);


e.activeFeatureCount
.textContent =
String(
features.length
);

}


/* =========================================
   DECISION TREE - FEATURE SELECTOR
========================================= */

function rebuildFeatureSelector(){

const features =
activeFeatures();

const previous =
e.feature.value;


e.feature
.replaceChildren();


features.forEach(
feature => {

const option =
document.createElement(
"option"
);

option.value =
feature;

option.textContent =
featureName(feature);

e.feature.append(
option
);

}
);


if(
features.includes(
previous
)
){

e.feature.value =
previous;

}else{

e.feature.value =
features[0];

}


updateThresholdForFeature(
false
);

}


/* =========================================
   DECISION TREE - DATASET TABLE
========================================= */

function renderTable(){

renderTableHead();


e.body
.replaceChildren();


data.forEach(
row => {

const tr =
document.createElement(
"tr"
);


const id =
document.createElement(
"td"
);

id.textContent =
row.id;

tr.append(
id
);


activeFeatures()
.forEach(
feature => {

tr.append(
createNumberCell(
row,
feature
)
);

}
);


const classCell =
document.createElement(
"td"
);


const select =
document.createElement(
"select"
);


["A","B"]
.forEach(
label => {

const option =
document.createElement(
"option"
);

option.value =
label;

option.textContent =
`Class ${label}`;

option.selected =
row.label === label;

select.append(
option
);

}
);


select.addEventListener(
"change",
() => {

row.label =
select.value;

invalidate();

}
);


classCell.append(
select
);


tr.append(
classCell
);


e.body.append(
tr
);

}
);


updateSummary();

}


function renderTableHead(){

e.head
.replaceChildren();


const row =
document.createElement(
"tr"
);


const id =
document.createElement(
"th"
);

id.textContent =
"ID";

row.append(
id
);


activeFeatures()
.forEach(
feature => {

const th =
document.createElement(
"th"
);

th.textContent =
featureName(feature);

row.append(
th
);

}
);


const classHeader =
document.createElement(
"th"
);

classHeader.textContent =
"Class";

row.append(
classHeader
);


e.head.append(
row
);

}


function createNumberCell(
row,
feature
){

const cell =
document.createElement(
"td"
);


const input =
document.createElement(
"input"
);


const config =
FEATURE_CONFIG[
feature
];


input.type =
"number";

input.min =
config.min;

input.max =
config.max;

input.value =
row[feature];


input.addEventListener(
"input",
() => {

const value =
Number.parseFloat(
input.value
);


if(
Number.isFinite(value) &&
value >= config.min &&
value <= config.max
){

input.classList
.remove(
"invalid"
);

row[feature] =
value;

invalidate();

}else{

input.classList
.add(
"invalid"
);

}

}
);


input.addEventListener(
"change",
() => {

row[feature] =
clamp(
input.value,
config.min,
config.max,
row[feature]
);


input.value =
row[feature];


input.classList
.remove(
"invalid"
);


invalidate();

}
);


cell.append(
input
);


return cell;

}


/* =========================================
   DECISION TREE - ADD / REMOVE SAMPLE
========================================= */

function createNewSample(){

const last =
data[
data.length - 1
];


return {

id:
Math.max(
...data.map(
row => row.id
)
) + 1,

age:
Math.min(
120,
(last?.age || 25) + 3
),

income:
(last?.income || 30000)
+ 5000,

score:
Math.min(
100,
(last?.score || 50) + 4
),

experience:
Math.min(
60,
(last?.experience || 2) + 1
),

label:
data.length % 2 === 0
? "A"
: "B"

};

}


function addSample(){

if(
data.length >=
MAX_SAMPLES
){

return;

}


data.push(
createNewSample()
);


renderTable();

invalidate();


e.live.textContent =
`Sample added. Dataset now contains ${data.length} samples.`;

}


function removeSample(){

if(
data.length <=
MIN_SAMPLES
){

return;

}


data.pop();


renderTable();

invalidate();


e.live.textContent =
`Last sample removed. ${data.length} samples remain.`;

}


/* =========================================
   DECISION TREE - CLASS COUNTS
========================================= */

function classCounts(rows){

return rows.reduce(
(counts,row) => {

counts[
row.label
]++;

return counts;

},
{
A:0,
B:0
}
);

}


/* =========================================
   DECISION TREE - SUMMARY
========================================= */

function updateSummary(){

const counts =
classCounts(
data
);


e.total.textContent =
data.length;


e.classA.textContent =
counts.A;


e.classB.textContent =
counts.B;


e.sampleCount.textContent =
`${data.length} / ${MAX_SAMPLES} samples`;


e.selectedFeature
.textContent =
featureName(
e.feature.value
);


e.add.disabled =
data.length >=
MAX_SAMPLES;


e.remove.disabled =
data.length <=
MIN_SAMPLES;


renderActiveFeatures();

}


/* =========================================
   DECISION TREE - IMPURITY
========================================= */

function probabilities(rows){

if(
!rows.length
){

return [];

}


const counts =
classCounts(
rows
);


return Object.values(
counts
)
.filter(
value => value > 0
)
.map(
value =>
value /
rows.length
);

}


function impurity(
rows,
criterion =
e.criterion.value
){

if(
!rows.length
){

return 0;

}


const probs =
probabilities(
rows
);


if(
criterion ===
"entropy"
){

return -probs.reduce(
(sum,p) =>
sum +
p *
Math.log2(p),
0
);

}


return 1 -
probs.reduce(
(sum,p) =>
sum +
p * p,
0
);

}


/* =========================================
   DECISION TREE - EVALUATE SPLIT
========================================= */

function evaluateSplit(
feature,
threshold
){

const left =
data.filter(
row =>
row[feature]
<= threshold
);


const right =
data.filter(
row =>
row[feature]
> threshold
);


if(
!left.length ||
!right.length
){

return null;

}


const parentImpurity =
impurity(
data
);


const leftImpurity =
impurity(
left
);


const rightImpurity =
impurity(
right
);


const weightedImpurity =

(
left.length /
data.length
)
*
leftImpurity

+

(
right.length /
data.length
)
*
rightImpurity;


return {

feature,

threshold,

left,

right,

parentImpurity,

leftImpurity,

rightImpurity,

weightedImpurity,

gain:
parentImpurity -
weightedImpurity

};

}


/* =========================================
   DECISION TREE - MANUAL SPLIT
========================================= */

function calculateManualSplit(){

const feature =
e.feature.value;


const threshold =
Number.parseFloat(
e.threshold.value
);


if(
!Number.isFinite(
threshold
)
){

return null;

}


return evaluateSplit(
feature,
threshold
);

}


/* =========================================
   DECISION TREE - CANDIDATE THRESHOLDS
========================================= */

function candidateThresholds(
feature
){

const values =
[
...new Set(
data.map(
row =>
Number(
row[feature]
)
)
)
]
.sort(
(a,b) =>
a-b
);


const thresholds =
[];


for(
let index = 0;
index <
values.length - 1;
index++
){

const left =
values[index];

const right =
values[
index + 1
];


if(
left !== right
){

thresholds.push(
(
left +
right
) / 2
);

}

}


return thresholds;

}


/* =========================================
   DECISION TREE - FIND BEST SPLIT
========================================= */

function findBestSplit(){

const candidates =
[];


activeFeatures()
.forEach(
feature => {

candidateThresholds(
feature
)
.forEach(
threshold => {

const result =
evaluateSplit(
feature,
threshold
);


if(
result
){

candidates.push(
result
);

}

}
);

}
);


if(
!candidates.length
){

e.live.textContent =
"No valid split could be found for the current dataset.";

return;

}


candidates.sort(
(a,b) => {

if(
Math.abs(
b.gain -
a.gain
) > 1e-12
){

return (
b.gain -
a.gain
);

}


if(
a.weightedImpurity !==
b.weightedImpurity
){

return (
a.weightedImpurity -
b.weightedImpurity
);

}


return (
FEATURE_ORDER.indexOf(
a.feature
)
-
FEATURE_ORDER.indexOf(
b.feature
)
);

}
);


const best =
candidates[0];


e.feature.value =
best.feature;


e.threshold.value =
formatThreshold(
best.threshold
);


updateSummary();


renderResult(
best
);


renderCandidateComparison(
candidates
);


e.bestCard.hidden =
false;


e.bestFeature
.textContent =
featureName(
best.feature
);


e.bestThreshold
.textContent =
formatThreshold(
best.threshold
);


e.bestGain
.textContent =
fmt(
best.gain
);


e.splitsTested
.textContent =
candidates.length;


e.live.textContent =
`Best split found after testing ${candidates.length} candidate splits: ${featureName(best.feature)} ≤ ${formatThreshold(best.threshold)} with information gain ${fmt(best.gain)}.`;

}


/* =========================================
   DECISION TREE - MAJORITY CLASS
========================================= */

function majority(rows){

if(
!rows.length
){

return "No Samples";

}


const counts =
classCounts(
rows
);


if(
counts.A ===
counts.B
){

return "Tie";

}


return (
counts.A >
counts.B
)
? "A"
: "B";

}


/* =========================================
   DECISION TREE - SAMPLE CHIP
========================================= */

function sampleChip(row){

const chip =
document.createElement(
"span"
);


chip.className =
`tree-sample class-${row.label.toLowerCase()}`;


chip.textContent =
row.id;


const values =
activeFeatures()
.map(
feature =>
`${featureName(feature)}: ${row[feature]}`
)
.join("\n");


chip.title =
`ID ${row.id}\n${values}\nClass: ${row.label}`;


return chip;

}


/* =========================================
   DECISION TREE - LEAF
========================================= */

function createLeaf(
condition,
rows
){

const wrapper =
document.createElement(
"div"
);


const branch =
document.createElement(
"div"
);

branch.className =
"tree-branch-label";

branch.textContent =
condition;


const box =
document.createElement(
"div"
);

box.className =
"tree-leaf-box";


const prediction =
document.createElement(
"strong"
);


const predicted =
majority(
rows
);


if(
predicted ===
"Tie"
){

prediction.textContent =
"Prediction: Tie";

}else if(
predicted ===
"No Samples"
){

prediction.textContent =
"Prediction: No Samples";

}else{

prediction.textContent =
`Prediction: Class ${predicted}`;

}


const counts =
classCounts(
rows
);


const meta =
document.createElement(
"span"
);


meta.textContent =
`${rows.length} sample${rows.length === 1 ? "" : "s"} · A=${counts.A}, B=${counts.B}`;


const samples =
document.createElement(
"div"
);

samples.className =
"tree-samples";


rows.forEach(
row =>
samples.append(
sampleChip(row)
)
);


box.append(
prediction,
meta,
samples
);


wrapper.append(
branch,
box
);


return wrapper;

}


/* =========================================
   DECISION TREE - VISUALIZATION
========================================= */

function renderTree(result){

e.visual
.replaceChildren();


const diagram =
document.createElement(
"div"
);

diagram.className =
"tree-diagram";


const root =
document.createElement(
"div"
);

root.className =
"tree-root tree-node-box";


const title =
document.createElement(
"strong"
);


title.textContent =
`${featureName(result.feature)} ≤ ${formatThreshold(result.threshold)}?`;


const meta =
document.createElement(
"span"
);


meta.textContent =
`${data.length} samples · ${
e.criterion.value === "gini"
? "Gini Impurity"
: "Entropy"
}`;


root.append(
title,
meta
);


const left =
createLeaf(
`YES — ${featureName(result.feature)} ≤ ${formatThreshold(result.threshold)}`,
result.left
);

left.classList.add(
"tree-left"
);


const right =
createLeaf(
`NO — ${featureName(result.feature)} > ${formatThreshold(result.threshold)}`,
result.right
);

right.classList.add(
"tree-right"
);


diagram.append(
root,
left,
right
);


e.visual.append(
diagram
);

}


/* =========================================
   DECISION TREE - SPLIT QUALITY
========================================= */

function renderStats(result){

e.parent.textContent =
fmt(
result.parentImpurity
);


e.left.textContent =
fmt(
result.leftImpurity
);


e.right.textContent =
fmt(
result.rightImpurity
);


e.weighted.textContent =
fmt(
result.weightedImpurity
);


e.gain.textContent =
fmt(
result.gain
);

}


/* =========================================
   DECISION TREE - ROUTING TABLE
========================================= */

function renderRouting(result){

e.routingBody
.replaceChildren();


data.forEach(
row => {

const tr =
document.createElement(
"tr"
);


const id =
document.createElement(
"td"
);

id.textContent =
row.id;


const value =
document.createElement(
"td"
);

value.textContent =
row[
result.feature
];


const condition =
document.createElement(
"td"
);


const isLeft =
row[
result.feature
]
<=
result.threshold;


condition.textContent =
`${row[result.feature]} ${isLeft ? "≤" : ">"} ${formatThreshold(result.threshold)}`;


const branch =
document.createElement(
"td"
);

branch.textContent =
isLeft
? "Left / Yes"
: "Right / No";

branch.className =
isLeft
? "tree-route-left"
: "tree-route-right";


const label =
document.createElement(
"td"
);

label.textContent =
`Class ${row.label}`;

label.className =
row.label === "A"
? "tree-class-a"
: "tree-class-b";


tr.append(
id,
value,
condition,
branch,
label
);


e.routingBody.append(
tr
);

}
);

}


/* =========================================
   DECISION TREE - CALCULATIONS
========================================= */

function probabilityText(rows){

const counts =
classCounts(
rows
);


if(
!rows.length
){

return "No samples";

}


return (
`p(A)=${counts.A}/${rows.length}=${fmt(counts.A/rows.length)}, ` +
`p(B)=${counts.B}/${rows.length}=${fmt(counts.B/rows.length)}`
);

}


function criterionName(){

return (
e.criterion.value ===
"gini"
)
? "Gini"
: "Entropy";

}


function addCalculation(
title,
equation,
result
){

const box =
document.createElement(
"div"
);

box.className =
"tree-calc-step";


const heading =
document.createElement(
"strong"
);

heading.textContent =
title;


const code =
document.createElement(
"code"
);

code.textContent =
equation;


const output =
document.createElement(
"div"
);

output.className =
"cnn-calc-result";

output.textContent =
result;


box.append(
heading,
code,
output
);


e.calc.append(
box
);

}


function renderCalculations(result){

e.calc
.replaceChildren();


const parentCounts =
classCounts(
data
);

const leftCounts =
classCounts(
result.left
);

const rightCounts =
classCounts(
result.right
);


addCalculation(

"1. Parent node",

`${data.length} samples · A=${parentCounts.A}, B=${parentCounts.B} · ${probabilityText(data)}`,

`${criterionName()} = ${fmt(result.parentImpurity)}`

);


addCalculation(

"2. Left branch",

`${featureName(result.feature)} ≤ ${formatThreshold(result.threshold)} · ${result.left.length} samples · A=${leftCounts.A}, B=${leftCounts.B}`,

`${criterionName()} = ${fmt(result.leftImpurity)}`

);


addCalculation(

"3. Right branch",

`${featureName(result.feature)} > ${formatThreshold(result.threshold)} · ${result.right.length} samples · A=${rightCounts.A}, B=${rightCounts.B}`,

`${criterionName()} = ${fmt(result.rightImpurity)}`

);


addCalculation(

"4. Weighted child impurity",

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


/* =========================================
   DECISION TREE - CANDIDATE COMPARISON
========================================= */

function renderCandidateComparison(
candidates
){

e.comparisonBody
.replaceChildren();


const top =
candidates.slice(
0,
Math.min(
10,
candidates.length
)
);


top.forEach(
(candidate,index) => {

const row =
document.createElement(
"tr"
);


[
index + 1,

featureName(
candidate.feature
),

formatThreshold(
candidate.threshold
),

candidate.left.length,

candidate.right.length,

fmt(
candidate.weightedImpurity
),

fmt(
candidate.gain
)

]
.forEach(
value => {

const cell =
document.createElement(
"td"
);

cell.textContent =
value;

row.append(
cell
);

}
);


if(
index === 0
){

row.classList.add(
"tree-best-row"
);

}


e.comparisonBody.append(
row
);

}
);


e.comparisonPanel.hidden =
false;

}


/* =========================================
   DECISION TREE - RENDER COMPLETE RESULT
========================================= */

function renderResult(result){

renderTree(
result
);

renderStats(
result
);

renderRouting(
result
);

renderCalculations(
result
);

}


/* =========================================
   DECISION TREE - BUILD MANUAL SPLIT
========================================= */

function runManual(){

const result =
calculateManualSplit();


if(
!result
){

e.live.textContent =
"The selected threshold does not create two valid branches. Try another threshold.";

return;

}


renderResult(
result
);


e.bestCard.hidden =
true;


e.comparisonPanel.hidden =
true;


e.live.textContent =
`Manual split: ${featureName(result.feature)} ≤ ${formatThreshold(result.threshold)}. Information gain = ${fmt(result.gain)}.`;

}


/* =========================================
   DECISION TREE - AUTO THRESHOLD
========================================= */

function updateThresholdForFeature(
invalidateResults = true
){

const feature =
e.feature.value;


const values =
data.map(
row =>
row[
feature
]
);


const minimum =
Math.min(
...values
);


const maximum =
Math.max(
...values
);


const midpoint =
(
minimum +
maximum
) / 2;


const config =
FEATURE_CONFIG[
feature
];


e.threshold.min =
config.min;


e.threshold.max =
config.max;


e.threshold.value =
formatThreshold(
midpoint
);


updateSummary();


if(
invalidateResults
){

invalidate();

}

}


/* =========================================
   DECISION TREE - FEATURE COUNT
========================================= */

function changeFeatureCount(){

rebuildFeatureSelector();


renderTable();


invalidate();


e.live.textContent =
`${activeFeatures().length} features active: ${activeFeatures().map(featureName).join(", ")}.`;

}


/* =========================================
   DECISION TREE - CLEAR RESULTS
========================================= */

function clearResults(){

e.visual.innerHTML =
'<p class="muted">Build the tree to see the split.</p>';


[
e.parent,
e.left,
e.right,
e.weighted,
e.gain
]
.forEach(
element => {

element.textContent =
"—";

}
);


e.routingBody
.replaceChildren();


e.calc.innerHTML =
"<p>Build the tree to see the calculations.</p>";


e.bestCard.hidden =
true;


e.comparisonPanel.hidden =
true;

}


/* =========================================
   DECISION TREE - INVALIDATE
========================================= */

function invalidate(){

clearResults();

updateSummary();

}


/* =========================================
   DECISION TREE - RESET
========================================= */

function reset(){

data =
defaults.map(
row => ({
...row
})
);


e.featureCount.value =
"2";


rebuildFeatureSelector();


e.feature.value =
"age";


e.threshold.value =
"30";


e.criterion.value =
"gini";


renderTable();


clearResults();


updateSummary();


e.live.textContent =
"Reset complete. Two features are active: Age and Income.";

}


/* =========================================
   DECISION TREE - EVENTS
========================================= */

e.featureCount
.addEventListener(
"change",
changeFeatureCount
);


e.feature
.addEventListener(
"change",
() => {

updateThresholdForFeature();


e.live.textContent =
`${featureName(e.feature.value)} selected for the manual split.`;

}
);


e.threshold
.addEventListener(
"input",
() => {

invalidate();


e.live.textContent =
"Threshold changed. Build the manual split again.";

}
);


e.criterion
.addEventListener(
"change",
() => {

invalidate();


e.live.textContent =
`Criterion changed to ${e.criterion.options[e.criterion.selectedIndex].text}.`;

}
);


e.add
.addEventListener(
"click",
addSample
);


e.remove
.addEventListener(
"click",
removeSample
);


e.run
.addEventListener(
"click",
runManual
);


e.best
.addEventListener(
"click",
findBestSplit
);


e.reset
.addEventListener(
"click",
reset
);


/* =========================================
   DECISION TREE - INITIALIZATION
========================================= */

rebuildFeatureSelector();

renderTable();

clearResults();

updateSummary();

renderActiveFeatures();


return {

run:
runManual,

findBestSplit,

reset

};

})();