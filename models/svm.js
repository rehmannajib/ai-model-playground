"use strict";

/* =====================================================
   SUPPORT VECTOR MACHINE PLAYGROUND
===================================================== */

const SVMModel = (() => {

const $ = id => document.getElementById(id);

const defaults=[
{id:1,x:1,y:2,label:-1},
{id:2,x:2,y:1,label:-1},
{id:3,x:2,y:3,label:-1},
{id:4,x:5,y:4,label:1},
{id:5,x:6,y:5,label:1},
{id:6,x:5,y:6,label:1}
];

let data=defaults.map(row=>({...row}));

function parameters(){

return{
w1:Number.parseFloat($("svm-w1")?.value??1),
w2:Number.parseFloat($("svm-w2")?.value??1),
b:Number.parseFloat($("svm-b")?.value??-6),
qX:Number.parseFloat($("svm-query-x")?.value??3.5),
qY:Number.parseFloat($("svm-query-y")?.value??3.5)
};

}

function score(x,y){

const p=parameters();

return p.w1*x+p.w2*y+p.b;

}

function classify(x,y){

return score(x,y)>=0?1:-1;

}

function renderTable(){

const body=$("svm-data-body");

if(!body)return;

body.replaceChildren();

data.forEach(row=>{

const tr=document.createElement("tr");

const id=document.createElement("td");
id.textContent=row.id;
tr.append(id);

["x","y"].forEach(feature=>{

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
tr.append(td);

});

const label=document.createElement("td");
const select=document.createElement("select");

[-1,1].forEach(value=>{

const option=document.createElement("option");
option.value=value;
option.textContent=value===-1?"Class A (-1)":"Class B (+1)";
option.selected=row.label===value;

select.append(option);

});

select.addEventListener("change",()=>{
row.label=Number(select.value);
clearResults();
});

label.append(select);
tr.append(label);

body.append(tr);

});

}

function supportVectors(){

return data
.map(row=>({
...row,
margin:Math.abs(score(row.x,row.y))
}))
.sort((a,b)=>a.margin-b.margin)
.slice(0,Math.min(3,data.length));

}

function run(){

const p=parameters();
const queryScore=score(p.qX,p.qY);
const prediction=queryScore>=0?1:-1;
const supports=supportVectors();

$("svm-score-result").textContent=queryScore.toFixed(3);
$("svm-class-result").textContent=prediction===-1?"Class A":"Class B";
$("svm-support-count").textContent=supports.length;

renderSupportTable(supports);
renderPlot(supports,p);
renderCalculation(queryScore,p,prediction);

$("svm-live-step").textContent=
`Decision score ${queryScore.toFixed(3)} → ${prediction===-1?"Class A":"Class B"}.`;

}

function renderSupportTable(supports){

const body=$("svm-support-body");

if(!body)return;

body.replaceChildren();

supports.forEach((row,index)=>{

const tr=document.createElement("tr");

[
index+1,
row.id,
row.label===-1?"A":"B",
row.margin.toFixed(3)
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

function renderCalculation(queryScore,p,prediction){

const output=$("svm-calculation-output");

if(!output)return;

output.replaceChildren();

const box=document.createElement("div");
box.className="svm-calc-step";

const title=document.createElement("strong");
title.textContent="Decision function";

const code=document.createElement("code");
code.textContent=
`f(x) = (${p.w1} × ${p.qX}) + (${p.w2} × ${p.qY}) + ${p.b} = ${queryScore.toFixed(3)} → ${prediction===-1?"Class A":"Class B"}`;

box.append(title,code);
output.append(box);

}

function renderPlot(supports,p){

const container=$("svm-plot");

if(!container)return;

container.replaceChildren();

const width=620;
const height=400;
const pad=50;

const xs=[...data.map(r=>r.x),p.qX];
const ys=[...data.map(r=>r.y),p.qY];

let minX=Math.min(...xs)-1;
let maxX=Math.max(...xs)+1;
let minY=Math.min(...ys)-1;
let maxY=Math.max(...ys)+1;

const sx=x=>pad+(x-minX)/(maxX-minX)*(width-pad*2);
const sy=y=>height-pad-(y-minY)/(maxY-minY)*(height-pad*2);

const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
svg.setAttribute("class","svm-svg");

if(p.w2!==0){

[-1,0,1].forEach(level=>{

const y1=(level-p.b-p.w1*minX)/p.w2;
const y2=(level-p.b-p.w1*maxX)/p.w2;

const line=document.createElementNS("http://www.w3.org/2000/svg","line");

line.setAttribute("x1",sx(minX));
line.setAttribute("x2",sx(maxX));
line.setAttribute("y1",sy(y1));
line.setAttribute("y2",sy(y2));
line.setAttribute("class",level===0?"svm-boundary":"svm-margin");

svg.append(line);

});

}

const supportIds=new Set(supports.map(row=>row.id));

data.forEach(row=>{

if(supportIds.has(row.id)){

const ring=document.createElementNS("http://www.w3.org/2000/svg","circle");
ring.setAttribute("cx",sx(row.x));
ring.setAttribute("cy",sy(row.y));
ring.setAttribute("r",13);
ring.setAttribute("class","svm-support-ring");
svg.append(ring);

}

const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");
circle.setAttribute("cx",sx(row.x));
circle.setAttribute("cy",sy(row.y));
circle.setAttribute("r",7);
circle.setAttribute("class",row.label===-1?"svm-class-a":"svm-class-b");

svg.append(circle);

});

const query=document.createElementNS("http://www.w3.org/2000/svg","circle");
query.setAttribute("cx",sx(p.qX));
query.setAttribute("cy",sy(p.qY));
query.setAttribute("r",10);
query.setAttribute("class","svm-query");
svg.append(query);

container.append(svg);

}

function clearResults(){

["svm-score-result","svm-class-result","svm-support-count"]
.forEach(id=>{
const element=$(id);
if(element)element.textContent="—";
});

$("svm-support-body")?.replaceChildren();

const plot=$("svm-plot");
if(plot)plot.innerHTML='<p class="muted">Run SVM to see the margin and support vectors.</p>';

const calc=$("svm-calculation-output");
if(calc)calc.innerHTML="<p>Run SVM to see the decision calculation.</p>";

}

function reset(){

data=defaults.map(row=>({...row}));

if($("svm-w1"))$("svm-w1").value=1;
if($("svm-w2"))$("svm-w2").value=1;
if($("svm-b"))$("svm-b").value=-6;
if($("svm-query-x"))$("svm-query-x").value=3.5;
if($("svm-query-y"))$("svm-query-y").value=3.5;

renderTable();
clearResults();

}

function init(){

if(!$("svm-playground"))return;

renderTable();
clearResults();

$("svm-run")?.addEventListener("click",run);
$("svm-reset")?.addEventListener("click",reset);

["svm-w1","svm-w2","svm-b","svm-query-x","svm-query-y"]
.forEach(id=>$(id)?.addEventListener("input",clearResults));

}

init();

return{run,reset};

})();