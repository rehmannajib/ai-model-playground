"use strict";

/* =====================================================
   LOGISTIC REGRESSION PLAYGROUND
===================================================== */

const LogisticRegressionModel = (() => {

const $ = id => document.getElementById(id);

const sigmoid = z => 1/(1+Math.exp(-z));

const defaults=[
{id:1,x1:1,x2:2,label:0},
{id:2,x1:2,x2:1,label:0},
{id:3,x1:2,x2:3,label:0},
{id:4,x1:4,x2:4,label:1},
{id:5,x1:5,x2:4,label:1},
{id:6,x1:4,x2:6,label:1}
];

let data=defaults.map(row=>({...row}));

function values(){

return{
b0:Number.parseFloat($("log-b0")?.value??-4),
b1:Number.parseFloat($("log-b1")?.value??0.8),
b2:Number.parseFloat($("log-b2")?.value??0.8),
threshold:Number.parseFloat($("log-threshold")?.value??0.5),
q1:Number.parseFloat($("log-query-x1")?.value??3.5),
q2:Number.parseFloat($("log-query-x2")?.value??3.5)
};

}

function predict(x1,x2){

const p=values();
const z=p.b0+p.b1*x1+p.b2*x2;
const probability=sigmoid(z);

return{
z,
probability,
classValue:probability>=p.threshold?1:0
};

}

function renderTable(){

const body=$("log-data-body");

if(!body)return;

body.replaceChildren();

data.forEach(row=>{

const tr=document.createElement("tr");

const id=document.createElement("td");
id.textContent=row.id;

["x1","x2"].forEach(feature=>{

const td=document.createElement("td");
const input=document.createElement("input");

input.type="number";
input.value=row[feature];

input.addEventListener("input",()=>{
const value=Number.parseFloat(input.value);
if(Number.isFinite(value)){
row[feature]=value;
clearResults();
}
});

td.append(input);
tr.append(id.parentNode?document.createTextNode(""):null);
if(feature==="x1")tr.append(id);
tr.append(td);

});

const labelCell=document.createElement("td");
const select=document.createElement("select");

[0,1].forEach(label=>{
const option=document.createElement("option");
option.value=label;
option.textContent=`Class ${label}`;
option.selected=row.label===label;
select.append(option);
});

select.addEventListener("change",()=>{
row.label=Number(select.value);
clearResults();
});

labelCell.append(select);
tr.append(labelCell);

body.append(tr);

});

}

function run(){

const p=values();
const result=predict(p.q1,p.q2);

$("log-z-result").textContent=result.z.toFixed(3);
$("log-probability-result").textContent=result.probability.toFixed(3);
$("log-class-result").textContent=`Class ${result.classValue}`;

renderSamples();
renderCalculation(result,p);
renderPlot(result,p);

$("log-live-step").textContent=
`Probability = ${result.probability.toFixed(3)}. With threshold ${p.threshold}, the prediction is Class ${result.classValue}.`;

}

function renderSamples(){

const body=$("log-result-body");

if(!body)return;

body.replaceChildren();

data.forEach(row=>{

const prediction=predict(row.x1,row.x2);

const tr=document.createElement("tr");

[
row.id,
row.label,
prediction.probability.toFixed(3),
prediction.classValue
].forEach(value=>{
const td=document.createElement("td");
td.textContent=value;
tr.append(td);
});

body.append(tr);

});

}

function renderCalculation(result,p){

const output=$("log-calculation-output");

if(!output)return;

output.replaceChildren();

const steps=[
["Linear score",`z = ${p.b0} + (${p.b1} × ${p.q1}) + (${p.b2} × ${p.q2}) = ${result.z.toFixed(3)}`],
["Sigmoid",`p = 1 / (1 + e^(-${result.z.toFixed(3)})) = ${result.probability.toFixed(3)}`],
["Threshold",`${result.probability.toFixed(3)} ${result.probability>=p.threshold?"≥":"<"} ${p.threshold} → Class ${result.classValue}`]
];

steps.forEach(([title,text])=>{

const box=document.createElement("div");
box.className="log-calc-step";

const strong=document.createElement("strong");
strong.textContent=title;

const code=document.createElement("code");
code.textContent=text;

box.append(strong,code);
output.append(box);

});

}

function renderPlot(result,p){

const container=$("log-plot");

if(!container)return;

container.replaceChildren();

const width=620;
const height=400;
const pad=50;

const allX=[...data.map(row=>row.x1),p.q1];
const allY=[...data.map(row=>row.x2),p.q2];

let minX=Math.min(...allX)-1;
let maxX=Math.max(...allX)+1;
let minY=Math.min(...allY)-1;
let maxY=Math.max(...allY)+1;

const sx=x=>pad+(x-minX)/(maxX-minX)*(width-pad*2);
const sy=y=>height-pad-(y-minY)/(maxY-minY)*(height-pad*2);

const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
svg.setAttribute("class","log-svg");

if(p.b2!==0){

const logit=Math.log(p.threshold/(1-p.threshold));

const yAtMin=(logit-p.b0-p.b1*minX)/p.b2;
const yAtMax=(logit-p.b0-p.b1*maxX)/p.b2;

const boundary=document.createElementNS("http://www.w3.org/2000/svg","line");
boundary.setAttribute("x1",sx(minX));
boundary.setAttribute("x2",sx(maxX));
boundary.setAttribute("y1",sy(yAtMin));
boundary.setAttribute("y2",sy(yAtMax));
boundary.setAttribute("class","log-boundary");

svg.append(boundary);

}

data.forEach(row=>{

const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");

circle.setAttribute("cx",sx(row.x1));
circle.setAttribute("cy",sy(row.x2));
circle.setAttribute("r",7);
circle.setAttribute("class",row.label===0?"log-point-0":"log-point-1");

svg.append(circle);

});

const query=document.createElementNS("http://www.w3.org/2000/svg","circle");

query.setAttribute("cx",sx(p.q1));
query.setAttribute("cy",sy(p.q2));
query.setAttribute("r",10);
query.setAttribute("class","log-query-point");

svg.append(query);

container.append(svg);

}

function clearResults(){

["log-z-result","log-probability-result","log-class-result"]
.forEach(id=>{
const element=$(id);
if(element)element.textContent="—";
});

$("log-result-body")?.replaceChildren();

const plot=$("log-plot");
if(plot)plot.innerHTML='<p class="muted">Run Logistic Regression to see the boundary.</p>';

const calc=$("log-calculation-output");
if(calc)calc.innerHTML="<p>Run the model to see the probability calculation.</p>";

}

function reset(){

data=defaults.map(row=>({...row}));

if($("log-b0"))$("log-b0").value=-4;
if($("log-b1"))$("log-b1").value=0.8;
if($("log-b2"))$("log-b2").value=0.8;
if($("log-threshold"))$("log-threshold").value=0.5;
if($("log-query-x1"))$("log-query-x1").value=3.5;
if($("log-query-x2"))$("log-query-x2").value=3.5;

renderTable();
clearResults();

}

function init(){

if(!$("logistic-regression-playground"))return;

renderTable();
clearResults();

$("log-run")?.addEventListener("click",run);
$("log-reset")?.addEventListener("click",reset);

[
"log-b0",
"log-b1",
"log-b2",
"log-threshold",
"log-query-x1",
"log-query-x2"
].forEach(id=>{
$(id)?.addEventListener("input",clearResults);
});

}

init();

return{run,reset};

})();