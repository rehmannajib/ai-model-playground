"use strict";

/* =========================================
   K-NEAREST NEIGHBORS PLAYGROUND
========================================= */

const KNN = (() => {

const $ = id =>
document.getElementById(id);

const MIN_SAMPLES = 4;
const MAX_SAMPLES = 20;


/* =========================================
   KNN - FEATURES
========================================= */

const FEATURE_ORDER = [
"x1",
"x2",
"x3",
"x4"
];

const FEATURE_CONFIG = {

x1:{
label:"Feature 1",
min:0,
max:100
},

x2:{
label:"Feature 2",
min:0,
max:100
},

x3:{
label:"Feature 3",
min:0,
max:100
},

x4:{
label:"Feature 4",
min:0,
max:100
}

};


/* =========================================
   KNN - DEFAULT DATA
========================================= */

const defaults = [

{id:1,x1:15,x2:20,x3:25,x4:30,label:"A"},
{id:2,x1:22,x2:28,x3:31,x4:36,label:"A"},
{id:3,x1:28,x2:18,x3:34,x4:26,label:"A"},
{id:4,x1:35,x2:30,x3:38,x4:40,label:"A"},

{id:5,x1:65,x2:70,x3:68,x4:72,label:"B"},
{id:6,x1:72,x2:62,x3:75,x4:68,label:"B"},
{id:7,x1:78,x2:80,x3:70,x4:82,label:"B"},
{id:8,x1:60,x2:78,x3:64,x4:75,label:"B"}

];


const defaultQuery = {
x1:45,
x2:45,
x3:50,
x4:50
};


/* =========================================
   KNN - ELEMENTS
========================================= */

const e = {

featureCount:
$("knn-feature-count"),

k:
$("knn-k"),

distance:
$("knn-distance"),

add:
$("knn-add-sample"),

remove:
$("knn-remove-sample"),

reset:
$("knn-reset"),

run:
$("knn-run"),

sampleCount:
$("knn-sample-count"),

total:
$("knn-total-samples"),

classA:
$("knn-class-a-count"),

classB:
$("knn-class-b-count"),

currentK:
$("knn-current-k"),

activeFeatureCount:
$("knn-active-feature-count"),

activeFeatures:
$("knn-active-features"),

queryInputs:
$("knn-query-inputs"),

head:
$("knn-data-head"),

body:
$("knn-data-body"),

plot:
$("knn-plot"),

prediction:
$("knn-prediction"),

aVotes:
$("knn-a-votes"),

bVotes:
$("knn-b-votes"),

nearestDistance:
$("knn-nearest-distance"),

distanceBody:
$("knn-distance-body"),

calculations:
$("knn-calculation-output"),

live:
$("knn-live-step")

};


let data =
defaults.map(
row => ({...row})
);

let query = {
...defaultQuery
};


/* =========================================
   KNN - HELPERS
========================================= */

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


function fmt(value){

return Number(
value
).toFixed(3);

}


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


function featureName(feature){

return FEATURE_CONFIG[
feature
].label;

}


function classCounts(){

return data.reduce(
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
   KNN - ACTIVE FEATURES
========================================= */

function renderActiveFeatures(){

e.activeFeatures
.replaceChildren();


activeFeatures()
.forEach(
feature => {

const chip =
document.createElement(
"span"
);

chip.className =
"knn-feature-chip";

chip.textContent =
featureName(feature);

e.activeFeatures
.append(
chip
);

}
);


e.activeFeatureCount
.textContent =
activeFeatures().length;

}


/* =========================================
   KNN - SUMMARY
========================================= */

function updateSummary(){

const counts =
classCounts();


e.total.textContent =
data.length;

e.classA.textContent =
counts.A;

e.classB.textContent =
counts.B;

e.currentK.textContent =
e.k.value;

e.sampleCount.textContent =
`${data.length} / ${MAX_SAMPLES} training samples`;

e.add.disabled =
data.length >=
MAX_SAMPLES;

e.remove.disabled =
data.length <=
MIN_SAMPLES;


if(
Number(e.k.value) >
data.length
){

e.k.value =
String(
data.length
);

}


Array.from(
e.k.options
)
.forEach(
option => {

option.disabled =
Number(option.value) >
data.length;

}
);


e.currentK.textContent =
e.k.value;


renderActiveFeatures();

}


/* =========================================
   KNN - TABLE HEADER
========================================= */

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


/* =========================================
   KNN - TRAINING TABLE
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


const idCell =
document.createElement(
"td"
);

idCell.textContent =
row.id;

tr.append(
idCell
);


activeFeatures()
.forEach(
feature => {

const td =
document.createElement(
"td"
);

const input =
document.createElement(
"input"
);

input.type =
"number";

input.min =
FEATURE_CONFIG[
feature
].min;

input.max =
FEATURE_CONFIG[
feature
].max;

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
value >= FEATURE_CONFIG[feature].min &&
value <= FEATURE_CONFIG[feature].max
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
FEATURE_CONFIG[feature].min,
FEATURE_CONFIG[feature].max,
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


td.append(
input
);

tr.append(
td
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


/* =========================================
   KNN - UNKNOWN SAMPLE INPUTS
========================================= */

function renderQueryInputs(){

e.queryInputs
.replaceChildren();


activeFeatures()
.forEach(
feature => {

const label =
document.createElement(
"label"
);


label.textContent =
featureName(feature);


const input =
document.createElement(
"input"
);

input.type =
"number";

input.min =
FEATURE_CONFIG[
feature
].min;

input.max =
FEATURE_CONFIG[
feature
].max;

input.value =
query[
feature
];


input.addEventListener(
"input",
() => {

const value =
Number.parseFloat(
input.value
);


if(
Number.isFinite(value) &&
value >= FEATURE_CONFIG[feature].min &&
value <= FEATURE_CONFIG[feature].max
){

input.classList
.remove(
"invalid"
);

query[feature] =
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

query[feature] =
clamp(
input.value,
FEATURE_CONFIG[feature].min,
FEATURE_CONFIG[feature].max,
query[feature]
);

input.value =
query[feature];

input.classList
.remove(
"invalid"
);

invalidate();

}
);


label.append(
input
);


e.queryInputs.append(
label
);

}
);

}


/* =========================================
   KNN - ADD SAMPLE
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

x1:
Math.min(
100,
(last?.x1 || 40) + 4
),

x2:
Math.min(
100,
(last?.x2 || 40) + 3
),

x3:
Math.min(
100,
(last?.x3 || 45) + 4
),

x4:
Math.min(
100,
(last?.x4 || 45) + 3
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
`Training sample added. Dataset now contains ${data.length} samples.`;

}


/* =========================================
   KNN - REMOVE SAMPLE
========================================= */

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
`Last training sample removed. ${data.length} samples remain.`;

}


/* =========================================
   KNN - EUCLIDEAN DISTANCE
========================================= */

function euclideanDistance(row){

const sum =
activeFeatures()
.reduce(
(total,feature) => {

const difference =
row[feature] -
query[feature];

return total +
difference *
difference;

},
0
);


return Math.sqrt(
sum
);

}


/* =========================================
   KNN - MANHATTAN DISTANCE
========================================= */

function manhattanDistance(row){

return activeFeatures()
.reduce(
(total,feature) => {

return total +
Math.abs(
row[feature] -
query[feature]
);

},
0
);

}


/* =========================================
   KNN - DISTANCE
========================================= */

function calculateDistance(row){

if(
e.distance.value ===
"manhattan"
){

return manhattanDistance(
row
);

}


return euclideanDistance(
row
);

}


/* =========================================
   KNN - RANK NEIGHBORS
========================================= */

function rankNeighbors(){

return data
.map(
row => ({

...row,

distance:
calculateDistance(
row
)

})
)
.sort(
(a,b) =>
a.distance -
b.distance
);

}


/* =========================================
   KNN - VOTING
========================================= */

function vote(neighbors){

const votes = {
A:0,
B:0
};


neighbors.forEach(
neighbor => {

votes[
neighbor.label
]++;

}
);


let prediction;


if(
votes.A >
votes.B
){

prediction =
"A";

}else if(
votes.B >
votes.A
){

prediction =
"B";

}else{

prediction =
neighbors[0]
.label;

}


return {
votes,
prediction
};

}


/* =========================================
   KNN - DISTANCE TABLE
========================================= */

function renderDistanceTable(
ranked,
k
){

e.distanceBody
.replaceChildren();


ranked.forEach(
(row,index) => {

const tr =
document.createElement(
"tr"
);


if(
index < k
){

tr.classList.add(
"knn-neighbor-row"
);

}


const values = [

index + 1,

row.id,

`Class ${row.label}`,

fmt(
row.distance
),

index < k
? "Yes"
: "No"

];


values.forEach(
value => {

const td =
document.createElement(
"td"
);

td.textContent =
value;

tr.append(
td
);

}
);


e.distanceBody.append(
tr
);

}
);

}


/* =========================================
   KNN - CALCULATIONS
========================================= */

function renderCalculations(
ranked,
k
){

e.calculations
.replaceChildren();


ranked.slice(
0,
k
)
.forEach(
(row,index) => {

const box =
document.createElement(
"div"
);

box.className =
"knn-calc-step";


const title =
document.createElement(
"strong"
);

title.textContent =
`Neighbor ${index + 1}: Sample ${row.id} — Class ${row.label}`;


const equation =
document.createElement(
"code"
);


if(
e.distance.value ===
"euclidean"
){

const parts =
activeFeatures()
.map(
feature => {

return `(${row[feature]} − ${query[feature]})²`;

}
);


equation.textContent =
`√(${parts.join(" + ")}) = ${fmt(row.distance)}`;

}else{

const parts =
activeFeatures()
.map(
feature => {

return `|${row[feature]} − ${query[feature]}|`;

}
);


equation.textContent =
`${parts.join(" + ")} = ${fmt(row.distance)}`;

}


box.append(
title,
equation
);


e.calculations.append(
box
);

}
);

}


/* =========================================
   KNN - SVG PLOT
========================================= */

function renderPlot(
ranked,
k
){

e.plot
.replaceChildren();


const width =
600;

const height =
420;

const padding =
50;


const svg =
document.createElementNS(
"http://www.w3.org/2000/svg",
"svg"
);


svg.setAttribute(
"viewBox",
`0 0 ${width} ${height}`
);

svg.setAttribute(
"class",
"knn-svg"
);


const xFeature =
activeFeatures()[0];

const yFeature =
activeFeatures()[1];


const allX = [
...data.map(
row =>
row[xFeature]
),
query[xFeature]
];


const allY = [
...data.map(
row =>
row[yFeature]
),
query[yFeature]
];


let minX =
Math.min(
...allX
);

let maxX =
Math.max(
...allX
);

let minY =
Math.min(
...allY
);

let maxY =
Math.max(
...allY
);


if(
minX === maxX
){

maxX += 1;

}

if(
minY === maxY
){

maxY += 1;

}


const marginX =
(maxX - minX) *
0.12 || 5;


const marginY =
(maxY - minY) *
0.12 || 5;


minX -= marginX;
maxX += marginX;

minY -= marginY;
maxY += marginY;


const xScale =
value =>
padding +
(
(value-minX) /
(maxX-minX)
) *
(
width -
padding*2
);


const yScale =
value =>
height -
padding -
(
(value-minY) /
(maxY-minY)
) *
(
height -
padding*2
);


/* Axes */

const xAxis =
document.createElementNS(
"http://www.w3.org/2000/svg",
"line"
);

xAxis.setAttribute(
"x1",
padding
);

xAxis.setAttribute(
"x2",
width-padding
);

xAxis.setAttribute(
"y1",
height-padding
);

xAxis.setAttribute(
"y2",
height-padding
);

xAxis.setAttribute(
"class",
"knn-axis"
);


const yAxis =
document.createElementNS(
"http://www.w3.org/2000/svg",
"line"
);

yAxis.setAttribute(
"x1",
padding
);

yAxis.setAttribute(
"x2",
padding
);

yAxis.setAttribute(
"y1",
padding
);

yAxis.setAttribute(
"y2",
height-padding
);

yAxis.setAttribute(
"class",
"knn-axis"
);


svg.append(
xAxis,
yAxis
);


/* Neighbor IDs */

const neighborIds =
new Set(
ranked
.slice(
0,
k
)
.map(
row =>
row.id
)
);


/* Training Points */

data.forEach(
row => {

const group =
document.createElementNS(
"http://www.w3.org/2000/svg",
"g"
);


if(
neighborIds.has(
row.id
)
){

const ring =
document.createElementNS(
"http://www.w3.org/2000/svg",
"circle"
);

ring.setAttribute(
"cx",
xScale(
row[xFeature]
)
);

ring.setAttribute(
"cy",
yScale(
row[yFeature]
)
);

ring.setAttribute(
"r",
13
);

ring.setAttribute(
"class",
"knn-neighbor-ring"
);

group.append(
ring
);

}


const circle =
document.createElementNS(
"http://www.w3.org/2000/svg",
"circle"
);

circle.setAttribute(
"cx",
xScale(
row[xFeature]
)
);

circle.setAttribute(
"cy",
yScale(
row[yFeature]
)
);

circle.setAttribute(
"r",
7
);

circle.setAttribute(
"class",
row.label === "A"
? "knn-point-a"
: "knn-point-b"
);


const text =
document.createElementNS(
"http://www.w3.org/2000/svg",
"text"
);

text.setAttribute(
"x",
xScale(
row[xFeature]
) + 10
);

text.setAttribute(
"y",
yScale(
row[yFeature]
) - 8
);

text.setAttribute(
"class",
"knn-point-label"
);

text.textContent =
row.id;


group.append(
circle,
text
);


svg.append(
group
);

}
);


/* Query */

const queryPoint =
document.createElementNS(
"http://www.w3.org/2000/svg",
"circle"
);

queryPoint.setAttribute(
"cx",
xScale(
query[xFeature]
)
);

queryPoint.setAttribute(
"cy",
yScale(
query[yFeature]
)
);

queryPoint.setAttribute(
"r",
10
);

queryPoint.setAttribute(
"class",
"knn-query-point"
);


const queryText =
document.createElementNS(
"http://www.w3.org/2000/svg",
"text"
);

queryText.setAttribute(
"x",
xScale(
query[xFeature]
) + 13
);

queryText.setAttribute(
"y",
yScale(
query[yFeature]
) - 10
);

queryText.setAttribute(
"class",
"knn-query-label"
);

queryText.textContent =
"?"


svg.append(
queryPoint,
queryText
);


/* Axis Labels */

const xLabel =
document.createElementNS(
"http://www.w3.org/2000/svg",
"text"
);

xLabel.setAttribute(
"x",
width/2
);

xLabel.setAttribute(
"y",
height-10
);

xLabel.setAttribute(
"class",
"knn-axis-label"
);

xLabel.textContent =
featureName(
xFeature
);


const yLabel =
document.createElementNS(
"http://www.w3.org/2000/svg",
"text"
);

yLabel.setAttribute(
"x",
18
);

yLabel.setAttribute(
"y",
height/2
);

yLabel.setAttribute(
"class",
"knn-axis-label"
);

yLabel.setAttribute(
"transform",
`rotate(-90 18 ${height/2})`
);

yLabel.textContent =
featureName(
yFeature
);


svg.append(
xLabel,
yLabel
);


e.plot.append(
svg
);

}


/* =========================================
   KNN - RUN
========================================= */

function run(){

const k =
Number.parseInt(
e.k.value,
10
);


if(
k >
data.length
){

e.live.textContent =
"K cannot be larger than the number of training samples.";

return;

}


const ranked =
rankNeighbors();


const neighbors =
ranked.slice(
0,
k
);


const voting =
vote(
neighbors
);


e.prediction.textContent =
`Class ${voting.prediction}`;


e.aVotes.textContent =
voting.votes.A;


e.bVotes.textContent =
voting.votes.B;


e.nearestDistance.textContent =
fmt(
ranked[0].distance
);


renderDistanceTable(
ranked,
k
);


renderCalculations(
ranked,
k
);


renderPlot(
ranked,
k
);


e.live.textContent =
`KNN prediction complete. The ${k} nearest neighbors voted ${voting.votes.A} for Class A and ${voting.votes.B} for Class B. Prediction: Class ${voting.prediction}.`;

}


/* =========================================
   KNN - CLEAR RESULTS
========================================= */

function clearResults(){

e.prediction.textContent =
"—";

e.aVotes.textContent =
"—";

e.bVotes.textContent =
"—";

e.nearestDistance.textContent =
"—";


e.distanceBody
.replaceChildren();


e.plot.innerHTML =
'<p class="muted">Run a prediction to visualize neighbors.</p>';


e.calculations.innerHTML =
"<p>Run KNN to see the distance calculations.</p>";

}


/* =========================================
   KNN - INVALIDATE
========================================= */

function invalidate(){

clearResults();

updateSummary();

}


/* =========================================
   KNN - FEATURE COUNT
========================================= */

function changeFeatureCount(){

renderTable();

renderQueryInputs();

invalidate();


e.live.textContent =
`${activeFeatures().length} features are now active: ${activeFeatures().map(featureName).join(", ")}.`;

}


/* =========================================
   KNN - RESET
========================================= */

function reset(){

data =
defaults.map(
row => ({
...row
})
);


query = {
...defaultQuery
};


e.featureCount.value =
"2";

e.k.value =
"3";

e.distance.value =
"euclidean";


renderTable();

renderQueryInputs();

clearResults();

updateSummary();


e.live.textContent =
"Reset complete. Two features and K = 3 are active.";

}


/* =========================================
   KNN - EVENTS
========================================= */

e.featureCount
.addEventListener(
"change",
changeFeatureCount
);


e.k
.addEventListener(
"change",
() => {

invalidate();

e.live.textContent =
`K changed to ${e.k.value}. Run the prediction again.`;

}
);


e.distance
.addEventListener(
"change",
() => {

invalidate();

e.live.textContent =
`Distance metric changed to ${e.distance.options[e.distance.selectedIndex].text}.`;

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
run
);


e.reset
.addEventListener(
"click",
reset
);


/* =========================================
   KNN - INITIALIZATION
========================================= */

renderTable();

renderQueryInputs();

clearResults();

updateSummary();


return {

run,

reset

};

})();