"use strict";

/* =====================================================
   RANDOM FOREST PLAYGROUND
===================================================== */

const RandomForestModel = (() => {

const $ = id => document.getElementById(id);

const FEATURES=["x1","x2","x3","x4"];

const defaults=[
{id:1,x1:20,x2:25,x3:35,x4:30,label:"A"},
{id:2,x1:30,x2:20,x3:40,x4:35,label:"A"},
{id:3,x1:35,x2:32,x3:30,x4:38,label:"A"},
{id:4,x1:60,x2:65,x3:58,x4:70,label:"B"},
{id:5,x1:70,x2:55,x3:72,x4:65,label:"B"},
{id:6,x1:75,x2:78,x3:68,x4:80,label:"B"}
];

let data=defaults.map(row=>({...row}));

function activeFeatures(){

const count=Number.parseInt($("rf-feature-count")?.value??2,10);

return FEATURES.slice(0,count);

}

function query(){

const q={};

activeFeatures().forEach((feature,index)=>{

q[feature]=Number.parseFloat($(`rf-query-${index+1}`)?.value??50);

});

return q;

}

function median(values){

const sorted=[...values].sort((a,b)=>a-b);
const middle=Math.floor(sorted.length/2);

return sorted.length%2
?sorted[middle]
:(sorted[middle-1]+sorted[middle])/2;

}

function majority(rows){

const counts={A:0,B:0};

rows.forEach(row=>counts[row.label]++);

return counts.A>=counts.B?"A":"B";

}

function buildTree(index){

const features=activeFeatures();
const feature=features[index%features.length];

const threshold=median(data.map(row=>row[feature]));

const left=data.filter(row=>row[feature]<=threshold);
const right=data.filter(row=>row[feature]>threshold);

return{
index:index+1,
feature,
threshold,
leftClass:majority(left.length?left:data),
rightClass:majority(right.length?right:data)
};

}

function run(){

const treeCount=Number.parseInt($("rf-tree-count")?.value??5,10);
const q=query();

const trees=Array.from({length:treeCount},(_,index)=>buildTree(index));

const predictions=trees.map(tree=>{

const branch=q[tree.feature]<=tree.threshold?"left":"right";
const prediction=branch==="left"?tree.leftClass:tree.rightClass;

return{
...tree,
branch,
prediction
};

});

const votes={A:0,B:0};

predictions.forEach(tree=>votes[tree.prediction]++);

const prediction=votes.A>=votes.B?"A":"B";

$("rf-a-votes").textContent=votes.A;
$("rf-b-votes").textContent=votes.B;
$("rf-prediction").textContent=`Class ${prediction}`;

renderTrees(predictions,q);

$("rf-live-step").textContent=
`${treeCount} trees voted: A=${votes.A}, B=${votes.B}. Forest prediction: Class ${prediction}.`;

}

function renderTrees(trees,q){

const container=$("rf-tree-output");

if(!container)return;

container.replaceChildren();

trees.forEach(tree=>{

const card=document.createElement("div");
card.className="rf-tree-card";

const title=document.createElement("strong");
title.textContent=`Tree ${tree.index}`;

const rule=document.createElement("code");
rule.textContent=
`${tree.feature.toUpperCase()} ≤ ${tree.threshold.toFixed(2)}? Query=${q[tree.feature]} → ${tree.branch} → Class ${tree.prediction}`;

card.append(title,rule);
container.append(card);

});

}

function clearResults(){

["rf-a-votes","rf-b-votes","rf-prediction"]
.forEach(id=>{
const element=$(id);
if(element)element.textContent="—";
});

const output=$("rf-tree-output");
if(output)output.innerHTML="<p>Run the forest to see each tree vote.</p>";

}

function reset(){

data=defaults.map(row=>({...row}));

if($("rf-tree-count"))$("rf-tree-count").value=5;
if($("rf-feature-count"))$("rf-feature-count").value=2;

clearResults();

}

function init(){

if(!$("random-forest-playground"))return;

clearResults();

$("rf-run")?.addEventListener("click",run);
$("rf-reset")?.addEventListener("click",reset);

}

init();

return{run,reset};

})();