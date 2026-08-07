"use strict";

/* =====================================================
   PCA PLAYGROUND
===================================================== */

const PCAModel = (() => {

const $ = id => document.getElementById(id);

const defaults=[
{x:2,y:1},
{x:3,y:2},
{x:4,y:3},
{x:5,y:3.5},
{x:6,y:5},
{x:7,y:5.5}
];

let data=defaults.map(row=>({...row}));

function mean(values){
return values.reduce((a,b)=>a+b,0)/values.length;
}

function run(){

const meanX=mean(data.map(row=>row.x));
const meanY=mean(data.map(row=>row.y));

const centered=data.map(row=>({
x:row.x-meanX,
y:row.y-meanY
}));

let cxx=0;
let cyy=0;
let cxy=0;

centered.forEach(row=>{
cxx+=row.x*row.x;
cyy+=row.y*row.y;
cxy+=row.x*row.y;
});

cxx/=data.length;
cyy/=data.length;
cxy/=data.length;

const trace=cxx+cyy;
const determinant=cxx*cyy-cxy*cxy;

const term=Math.sqrt(Math.max(0,trace*trace/4-determinant));

const lambda1=trace/2+term;
const lambda2=trace/2-term;

let vx=cxy;
let vy=lambda1-cxx;

if(Math.abs(vx)+Math.abs(vy)<1e-9){
vx=1;
vy=0;
}

const norm=Math.sqrt(vx*vx+vy*vy);

vx/=norm;
vy/=norm;

const totalVariance=lambda1+lambda2;
const explained=totalVariance?lambda1/totalVariance:1;

const projections=centered.map(row=>row.x*vx+row.y*vy);

$("pca-pc1-x").textContent=vx.toFixed(3);
$("pca-pc1-y").textContent=vy.toFixed(3);
$("pca-lambda1").textContent=lambda1.toFixed(3);
$("pca-lambda2").textContent=lambda2.toFixed(3);
$("pca-explained").textContent=(explained*100).toFixed(1)+"%";

renderTable(projections);
renderCalculation(meanX,meanY,cxx,cyy,cxy,vx,vy);
renderPlot(meanX,meanY,vx,vy);

$("pca-live-step").textContent=
`PC1 explains ${(explained*100).toFixed(1)}% of the variance.`;

}

function renderTable(projections){

const body=$("pca-result-body");

if(!body)return;

body.replaceChildren();

data.forEach((row,index)=>{

const tr=document.createElement("tr");

[
index+1,
row.x,
row.y,
projections[index].toFixed(3)
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

function renderCalculation(meanX,meanY,cxx,cyy,cxy,vx,vy){

const output=$("pca-calculation-output");

if(!output)return;

output.innerHTML="";

const box=document.createElement("div");
box.className="pca-calc-step";

const strong=document.createElement("strong");
strong.textContent="Covariance matrix";

const code=document.createElement("code");
code.textContent=
`[[${cxx.toFixed(3)}, ${cxy.toFixed(3)}], [${cxy.toFixed(3)}, ${cyy.toFixed(3)}]]`;

const pc=document.createElement("code");
pc.textContent=`PC1 direction = (${vx.toFixed(3)}, ${vy.toFixed(3)})`;

box.append(strong,code,pc);
output.append(box);

}

function renderPlot(meanX,meanY,vx,vy){

const container=$("pca-plot");

if(!container)return;

container.replaceChildren();

const width=620;
const height=400;
const pad=50;

const xs=data.map(r=>r.x);
const ys=data.map(r=>r.y);

let minX=Math.min(...xs)-1;
let maxX=Math.max(...xs)+1;
let minY=Math.min(...ys)-1;
let maxY=Math.max(...ys)+1;

const sx=x=>pad+(x-minX)/(maxX-minX)*(width-pad*2);
const sy=y=>height-pad-(y-minY)/(maxY-minY)*(height-pad*2);

const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
svg.setAttribute("class","pca-svg");

data.forEach(row=>{

const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");

circle.setAttribute("cx",sx(row.x));
circle.setAttribute("cy",sy(row.y));
circle.setAttribute("r",7);
circle.setAttribute("class","pca-point");

svg.append(circle);

});

const scale=5;

const line=document.createElementNS("http://www.w3.org/2000/svg","line");

line.setAttribute("x1",sx(meanX-vx*scale));
line.setAttribute("y1",sy(meanY-vy*scale));
line.setAttribute("x2",sx(meanX+vx*scale));
line.setAttribute("y2",sy(meanY+vy*scale));
line.setAttribute("class","pca-pc1");

svg.append(line);

container.append(svg);

}

function reset(){

data=defaults.map(row=>({...row}));

["pca-pc1-x","pca-pc1-y","pca-lambda1","pca-lambda2","pca-explained"]
.forEach(id=>{
const element=$(id);
if(element)element.textContent="—";
});

$("pca-result-body")?.replaceChildren();

const plot=$("pca-plot");
if(plot)plot.innerHTML='<p class="muted">Run PCA to visualize the principal direction.</p>';

}

function init(){

if(!$("pca-playground"))return;

reset();

$("pca-run")?.addEventListener("click",run);
$("pca-reset")?.addEventListener("click",reset);

}

init();

return{run,reset};

})();