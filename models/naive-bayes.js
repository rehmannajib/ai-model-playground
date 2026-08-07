"use strict";

/* =====================================================
   GAUSSIAN NAIVE BAYES PLAYGROUND
===================================================== */

const NaiveBayesModel = (() => {

const $ = id => document.getElementById(id);

const FEATURES=["x1","x2","x3","x4"];

const defaults=[
{id:1,x1:20,x2:25,x3:30,x4:35,label:"A"},
{id:2,x1:25,x2:30,x3:28,x4:40,label:"A"},
{id:3,x1:30,x2:24,x3:35,x4:32,label:"A"},
{id:4,x1:70,x2:75,x3:68,x4:72,label:"B"},
{id:5,x1:75,x2:65,x3:78,x4:69,label:"B"},
{id:6,x1:68,x2:80,x3:72,x4:77,label:"B"}
];

let data=defaults.map(row=>({...row}));

function activeFeatures(){

const count=Number.parseInt($("nb-feature-count")?.value??2,10);

return FEATURES.slice(0,count);

}

function mean(values){
return values.reduce((a,b)=>a+b,0)/values.length;
}

function variance(values){

if(values.length<2)return 1;

const m=mean(values);

const value=values.reduce((sum,x)=>sum+(x-m)**2,0)/values.length;

return value===0?1e-6:value;

}

function gaussian(x,m,v){

return(1/Math.sqrt(2*Math.PI*v))*Math.exp(-((x-m)**2)/(2*v));

}

function query(){

const result={};

activeFeatures().forEach((feature,index)=>{

result[feature]=Number.parseFloat($(`nb-query-${index+1}`)?.value??50);

});

return result;

}

function modelStats(){

const stats={};

["A","B"].forEach(label=>{

const rows=data.filter(row=>row.label===label);

stats[label]={
prior:rows.length/data.length,
features:{}
};

activeFeatures().forEach(feature=>{

const values=rows.map(row=>row[feature]);

stats[label].features[feature]={
mean:mean(values),
variance:variance(values)
};

});

});

return stats;

}

function run(){

const q=query();
const stats=modelStats();

const scores={};

["A","B"].forEach(label=>{

let logScore=Math.log(stats[label].prior);

activeFeatures().forEach(feature=>{

const s=stats[label].features[feature];
const likelihood=gaussian(q[feature],s.mean,s.variance);

logScore+=Math.log(Math.max(likelihood,1e-300));

});

scores[label]=logScore;

});

const maxScore=Math.max(scores.A,scores.B);
const expA=Math.exp(scores.A-maxScore);
const expB=Math.exp(scores.B-maxScore);
const total=expA+expB;

const pA=expA/total;
const pB=expB/total;

const prediction=pA>=pB?"A":"B";

$("nb-prior-a").textContent=stats.A.prior.toFixed(3);
$("nb-prior-b").textContent=stats.B.prior.toFixed(3);
$("nb-prob-a").textContent=pA.toFixed(3);
$("nb-prob-b").textContent=pB.toFixed(3);
$("nb-prediction").textContent=`Class ${prediction}`;

renderStatistics(stats);
renderCalculation(q,stats,pA,pB,prediction);

$("nb-live-step").textContent=
`Posterior probabilities: Class A = ${pA.toFixed(3)}, Class B = ${pB.toFixed(3)}. Prediction: Class ${prediction}.`;

}

function renderStatistics(stats){

const body=$("nb-stat-body");

if(!body)return;

body.replaceChildren();

["A","B"].forEach(label=>{

activeFeatures().forEach(feature=>{

const row=document.createElement("tr");
const s=stats[label].features[feature];

[
`Class ${label}`,
feature.toUpperCase(),
s.mean.toFixed(3),
s.variance.toFixed(3)
].forEach(value=>{
const td=document.createElement("td");
td.textContent=value;
row.append(td);
});

body.append(row);

});

});

}

function renderCalculation(q,stats,pA,pB,prediction){

const output=$("nb-calculation-output");

if(!output)return;

output.replaceChildren();

["A","B"].forEach(label=>{

const box=document.createElement("div");
box.className="nb-calc-step";

const strong=document.createElement("strong");
strong.textContent=`Class ${label}`;

const code=document.createElement("code");

const parts=activeFeatures().map(feature=>{

const s=stats[label].features[feature];
return `N(${q[feature]}; μ=${s.mean.toFixed(2)}, σ²=${s.variance.toFixed(2)})`;

});

code.textContent=`Prior ${stats[label].prior.toFixed(3)} × ${parts.join(" × ")}`;

box.append(strong,code);
output.append(box);

});

const result=document.createElement("div");
result.className="nb-calc-step";
result.textContent=`Normalized posterior: A=${pA.toFixed(3)}, B=${pB.toFixed(3)} → Class ${prediction}`;

output.append(result);

}

function clearResults(){

["nb-prior-a","nb-prior-b","nb-prob-a","nb-prob-b","nb-prediction"]
.forEach(id=>{
const element=$(id);
if(element)element.textContent="—";
});

$("nb-stat-body")?.replaceChildren();

const calc=$("nb-calculation-output");
if(calc)calc.innerHTML="<p>Run Naive Bayes to see probability calculations.</p>";

}

function reset(){

data=defaults.map(row=>({...row}));
clearResults();

}

function init(){

if(!$("naive-bayes-playground"))return;

clearResults();

$("nb-run")?.addEventListener("click",run);
$("nb-reset")?.addEventListener("click",reset);

}

init();

return{run,reset};

})();