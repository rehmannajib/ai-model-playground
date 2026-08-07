"use strict";

/* =====================================================
   K-MEANS CLUSTERING PLAYGROUND
===================================================== */

const KMeansModel = (() => {

const $ = id => document.getElementById(id);

const defaults=[
{id:1,x:15,y:20},
{id:2,x:20,y:25},
{id:3,x:25,y:18},
{id:4,x:70,y:75},
{id:5,x:75,y:68},
{id:6,x:80,y:80},
{id:7,x:45,y:45},
{id:8,x:50,y:50}
];

let data=defaults.map(row=>({...row}));
let centroids=[];
let assignments=[];

function distance(a,b){
return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
}

function initializeCentroids(k){

const sorted=[...data].sort((a,b)=>a.x-b.x);

centroids=Array.from({length:k},(_,index)=>{

const position=Math.round(index*(sorted.length-1)/(k-1||1));

return{
x:sorted[position].x,
y:sorted[position].y
};

});

}

function assign(){

assignments=data.map(point=>{

let best=0;
let bestDistance=Infinity;

centroids.forEach((centroid,index)=>{

const d=distance(point,centroid);

if(d<bestDistance){
bestDistance=d;
best=index;
}

});

return best;

});

}

function update(){

centroids=centroids.map((centroid,index)=>{

const points=data.filter((_,pointIndex)=>assignments[pointIndex]===index);

if(!points.length)return centroid;

return{
x:points.reduce((sum,p)=>sum+p.x,0)/points.length,
y:points.reduce((sum,p)=>sum+p.y,0)/points.length
};

});

}

function step(){

const k=Number.parseInt($("kmeans-k")?.value??3,10);

if(!centroids.length||centroids.length!==k){
initializeCentroids(k);
}

assign();
update();

render();

}

function run(){

const k=Number.parseInt($("kmeans-k")?.value??3,10);

initializeCentroids(k);

for(let i=0;i<10;i++){
assign();
update();
}

assign();
render();

$("kmeans-live-step").textContent=
`K-Means completed with K=${k}. Centroids updated after repeated assignment/update steps.`;

}

function render(){

renderTable();
renderPlot();
renderCentroids();

}

function renderTable(){

const body=$("kmeans-result-body");

if(!body)return;

body.replaceChildren();

data.forEach((point,index)=>{

const tr=document.createElement("tr");

[
point.id,
point.x,
point.y,
assignments[index]!==undefined?assignments[index]+1:"—"
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

function renderCentroids(){

const body=$("kmeans-centroid-body");

if(!body)return;

body.replaceChildren();

centroids.forEach((centroid,index)=>{

const tr=document.createElement("tr");

[
index+1,
centroid.x.toFixed(3),
centroid.y.toFixed(3)
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

function renderPlot(){

const container=$("kmeans-plot");

if(!container)return;

container.replaceChildren();

const width=620;
const height=400;
const pad=45;

const sx=x=>pad+x/100*(width-pad*2);
const sy=y=>height-pad-y/100*(height-pad*2);

const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
svg.setAttribute("class","kmeans-svg");

data.forEach((point,index)=>{

const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");

circle.setAttribute("cx",sx(point.x));
circle.setAttribute("cy",sy(point.y));
circle.setAttribute("r",7);
circle.setAttribute("class",`kmeans-cluster-${(assignments[index]??0)%5}`);

svg.append(circle);

});

centroids.forEach((centroid,index)=>{

const text=document.createElementNS("http://www.w3.org/2000/svg","text");

text.setAttribute("x",sx(centroid.x));
text.setAttribute("y",sy(centroid.y));
text.setAttribute("class","kmeans-centroid");
text.textContent=`C${index+1}`;

svg.append(text);

});

container.append(svg);

}

function reset(){

data=defaults.map(row=>({...row}));
centroids=[];
assignments=[];

$("kmeans-result-body")?.replaceChildren();
$("kmeans-centroid-body")?.replaceChildren();

const plot=$("kmeans-plot");
if(plot)plot.innerHTML='<p class="muted">Run K-Means to see clusters.</p>';

}

function init(){

if(!$("kmeans-playground"))return;

reset();

$("kmeans-run")?.addEventListener("click",run);
$("kmeans-step")?.addEventListener("click",step);
$("kmeans-reset")?.addEventListener("click",reset);

}

init();

return{run,step,reset};

})();