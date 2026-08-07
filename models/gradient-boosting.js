"use strict";

/* =====================================================
   GRADIENT BOOSTING REGRESSION PLAYGROUND
===================================================== */

const GradientBoostingModel = (() => {

const $ = id => document.getElementById(id);

const defaults=[
{x:1,y:2},
{x:2,y:3},
{x:3,y:4},
{x:4,y:7},
{x:5,y:8},
{x:6,y:9}
];

let data=defaults.map(row=>({...row}));

function mean(values){
return values.reduce((a,b)=>a+b,0)/values.length;
}

function stumpPrediction(rows,threshold){

const left=rows.filter(row=>row.x<=threshold);
const right=rows.filter(row=>row.x>threshold);

const leftValue=left.length?mean(left.map(row=>row.residual)):0;
const rightValue=right.length?mean(right.map(row=>row.residual)):0;

return{
threshold,
leftValue,
rightValue
};

}

function run(){

const rounds=Number.parseInt($("gb-rounds")?.value??3,10);
const learningRate=Number.parseFloat($("gb-learning-rate")?.value??0.5);

let predictions=Array(data.length).fill(mean(data.map(row=>row.y)));

const stages=[];

for(let round=0;round<rounds;round++){

const rows=data.map((row,index)=>({
...row,
residual:row.y-predictions[index]
}));

const threshold=mean(data.map(row=>row.x));

const stump=stumpPrediction(rows,threshold);

predictions=predictions.map((prediction,index)=>{

const update=data[index].x<=threshold
?stump.leftValue
:stump.rightValue;

return prediction+learningRate*update;

});

stages.push({
round:round+1,
...stump,
predictions:[...predictions]
});

}

const mse=mean(
data.map((row,index)=>(row.y-predictions[index])**2)
);

$("gb-mse-result").textContent=mse.toFixed(3);
$("gb-round-result").textContent=rounds;

renderStages(stages);
renderResults(predictions);

$("gb-live-step").textContent=
`${rounds} boosting rounds completed. Final MSE = ${mse.toFixed(3)}.`;

}

function renderStages(stages){

const output=$("gb-stage-output");

if(!output)return;

output.replaceChildren();

stages.forEach(stage=>{

const box=document.createElement("div");
box.className="gb-stage-card";

const strong=document.createElement("strong");
strong.textContent=`Round ${stage.round}`;

const code=document.createElement("code");
code.textContent=
`Threshold ${stage.threshold.toFixed(2)} | Left update ${stage.leftValue.toFixed(3)} | Right update ${stage.rightValue.toFixed(3)}`;

box.append(strong,code);
output.append(box);

});

}

function renderResults(predictions){

const body=$("gb-result-body");

if(!body)return;

body.replaceChildren();

data.forEach((row,index)=>{

const tr=document.createElement("tr");

[
row.x,
row.y,
predictions[index].toFixed(3),
(row.y-predictions[index]).toFixed(3)
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

function clearResults(){

["gb-mse-result","gb-round-result"]
.forEach(id=>{
const element=$(id);
if(element)element.textContent="—";
});

$("gb-result-body")?.replaceChildren();

const output=$("gb-stage-output");
if(output)output.innerHTML="<p>Run boosting to see sequential learners.</p>";

}

function reset(){

data=defaults.map(row=>({...row}));

if($("gb-rounds"))$("gb-rounds").value=3;
if($("gb-learning-rate"))$("gb-learning-rate").value=0.5;

clearResults();

}

function init(){

if(!$("gradient-boosting-playground"))return;

clearResults();

$("gb-run")?.addEventListener("click",run);
$("gb-reset")?.addEventListener("click",reset);

}

init();

return{run,reset};

})();