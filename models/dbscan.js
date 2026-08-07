"use strict";

/* =====================================================
   DBSCAN PLAYGROUND
===================================================== */

const DBSCANModel = (() => {

const $ = id => document.getElementById(id);

const defaults=[
{id:1,x:15,y:20},
{id:2,x:20,y:22},
{id:3,x:18,y:28},
{id:4,x:70,y:75},
{id:5,x:76,y:72},
{id:6,x:72,y:82},
{id:7,x:45,y:45},
{id:8,x:90,y:20}
];

let data=defaults.map(row=>({...row}));

function distance(a,b){
return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
}

function regionQuery(index,epsilon){

return data
.map((point,i)=>({i,d:distance(data[index],point)}))
.filter(item=>item.d<=epsilon)
.map(item=>item.i);

}

function run(){

const epsilon=Number.parseFloat($("dbscan-epsilon")?.value??12);
const minPts=Number.parseInt($("dbscan-minpts")?.value??2,10);

const labels=Array(data.length).fill(undefined);

let cluster=0;

for(let i=0;i<data.length;i++){

if(labels[i]!==undefined)continue;

const neighbors=regionQuery(i,epsilon);

if(neighbors.length<minPts){
labels[i]=-1;
continue;
}

cluster++;
labels[i]=cluster;

const queue=[...neighbors];

while(queue.length){

const j=queue.shift();

if(labels[j]===-1){
labels[j]=cluster;
}

if(labels[j]!==undefined)continue;

labels[j]=cluster;

const neighborsJ=regionQuery(j,epsilon);

if(neighborsJ.length>=minPts){

neighborsJ.forEach(n=>{
if(!queue.includes(n))queue.push(n);
});

}

}

}

render(labels);

const noise=labels.filter(label=>label===-1).length;

$("dbscan-cluster-count").textContent=cluster;
$("dbscan-noise-count").textContent=noise;

$("dbscan-live-step").textContent=
`DBSCAN found ${cluster} cluster(s) and ${noise} noise point(s).`;

}

function render(labels){

const body=$("dbscan-result-body");

if(body){

body.replaceChildren();

data.forEach((point,index)=>{

const tr=document.createElement("tr");

[
point.id,
point.x,
point.y,
labels[index]===-1?"Noise":`Cluster ${labels[index]}`
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

renderPlot(labels);

}

function renderPlot(labels){

const container=$("dbscan-plot");

if(!container)return;

container.replaceChildren();

const width=620;
const height=400;
const pad=45;

const sx=x=>pad+x/100*(width-pad*2);
const sy=y=>height-pad-y/100*(height-pad*2);

const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
svg.setAttribute("class","dbscan-svg");

data.forEach((point,index)=>{

const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");

circle.setAttribute("cx",sx(point.x));
circle.setAttribute("cy",sy(point.y));
circle.setAttribute("r",8);

circle.setAttribute(
"class",
labels[index]===-1
?"dbscan-noise"
:`dbscan-cluster-${(labels[index]-1)%5}`
);

svg.append(circle);

});

container.append(svg);

}

function reset(){

data=defaults.map(row=>({...row}));

if($("dbscan-epsilon"))$("dbscan-epsilon").value=12;
if($("dbscan-minpts"))$("dbscan-minpts").value=2;

["dbscan-cluster-count","dbscan-noise-count"]
.forEach(id=>{
const element=$(id);
if(element)element.textContent="—";
});

$("dbscan-result-body")?.replaceChildren();

const plot=$("dbscan-plot");
if(plot)plot.innerHTML='<p class="muted">Run DBSCAN to identify dense regions.</p>';

}

function init(){

if(!$("dbscan-playground"))return;

reset();

$("dbscan-run")?.addEventListener("click",run);
$("dbscan-reset")?.addEventListener("click",reset);

}

init();

return{run,reset};

})();