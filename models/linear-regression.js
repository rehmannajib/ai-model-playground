"use strict";

/* =====================================================
   LINEAR REGRESSION PLAYGROUND
===================================================== */

const LinearRegressionModel = (() => {

const $ = id => document.getElementById(id);

const defaults = [
{id:1,x:1,y:2},
{id:2,x:2,y:3},
{id:3,x:3,y:5},
{id:4,x:4,y:4},
{id:5,x:5,y:6},
{id:6,x:6,y:7}
];

let data = defaults.map(row => ({...row}));

function mean(values){
return values.reduce((a,b)=>a+b,0)/values.length;
}

function calculateModel(){

const xs=data.map(row=>row.x);
const ys=data.map(row=>row.y);

const meanX=mean(xs);
const meanY=mean(ys);

let numerator=0;
let denominator=0;

data.forEach(row=>{
numerator+=(row.x-meanX)*(row.y-meanY);
denominator+=(row.x-meanX)**2;
});

const slope=denominator===0?0:numerator/denominator;
const intercept=meanY-slope*meanX;

let sse=0;
let sst=0;

const predictions=data.map(row=>{
const prediction=slope*row.x+intercept;
const residual=row.y-prediction;

sse+=residual**2;
sst+=(row.y-meanY)**2;

return{
...row,
prediction,
residual
};
});

const mse=sse/data.length;
const r2=sst===0?1:1-sse/sst;

return{
slope,
intercept,
mse,
r2,
predictions
};

}

function renderTable(){

const body=$("lr-data-body");

if(!body)return;

body.replaceChildren();

data.forEach(row=>{

const tr=document.createElement("tr");

const id=document.createElement("td");
id.textContent=row.id;

const xCell=document.createElement("td");
const xInput=document.createElement("input");

xInput.type="number";
xInput.value=row.x;

xInput.addEventListener("input",()=>{
const value=Number.parseFloat(xInput.value);

if(Number.isFinite(value)){
row.x=value;
clearResults();
}
});

xCell.append(xInput);

const yCell=document.createElement("td");
const yInput=document.createElement("input");

yInput.type="number";
yInput.value=row.y;

yInput.addEventListener("input",()=>{
const value=Number.parseFloat(yInput.value);

if(Number.isFinite(value)){
row.y=value;
clearResults();
}
});

yCell.append(yInput);

tr.append(id,xCell,yCell);
body.append(tr);

});

updateSampleCount();

}

function updateSampleCount(){

const element=$("lr-sample-count");

if(element){
element.textContent=`${data.length} samples`;
}

}

function renderResults(result){

const slope=$("lr-slope-result");
const intercept=$("lr-intercept-result");
const mse=$("lr-mse-result");
const r2=$("lr-r2-result");

if(slope)slope.textContent=result.slope.toFixed(3);
if(intercept)intercept.textContent=result.intercept.toFixed(3);
if(mse)mse.textContent=result.mse.toFixed(3);
if(r2)r2.textContent=result.r2.toFixed(3);

renderPredictionTable(result);
renderCalculation(result);
renderPlot(result);

}

function renderPredictionTable(result){

const body=$("lr-result-body");

if(!body)return;

body.replaceChildren();

result.predictions.forEach(row=>{

const tr=document.createElement("tr");

[
row.id,
row.x.toFixed(2),
row.y.toFixed(2),
row.prediction.toFixed(3),
row.residual.toFixed(3)
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

function renderCalculation(result){

const output=$("lr-calculation-output");

if(!output)return;

output.replaceChildren();

const equations=[
["Best-fit equation",`ŷ = ${result.slope.toFixed(3)}x + ${result.intercept.toFixed(3)}`],
["Mean Squared Error",`MSE = ${result.mse.toFixed(3)}`],
["Coefficient of Determination",`R² = ${result.r2.toFixed(3)}`]
];

equations.forEach(([title,text])=>{

const box=document.createElement("div");
box.className="lr-calc-step";

const strong=document.createElement("strong");
strong.textContent=title;

const code=document.createElement("code");
code.textContent=text;

box.append(strong,code);
output.append(box);

});

}

function renderPlot(result){

const container=$("lr-plot");

if(!container)return;

container.replaceChildren();

const width=620;
const height=400;
const pad=50;

const xs=data.map(row=>row.x);
const ys=data.map(row=>row.y);

let minX=Math.min(...xs);
let maxX=Math.max(...xs);
let minY=Math.min(...ys);
let maxY=Math.max(...ys);

if(minX===maxX)maxX=minX+1;
if(minY===maxY)maxY=minY+1;

const marginX=(maxX-minX)*0.15;
const marginY=(maxY-minY)*0.15;

minX-=marginX;
maxX+=marginX;
minY-=marginY;
maxY+=marginY;

const sx=x=>pad+(x-minX)/(maxX-minX)*(width-pad*2);
const sy=y=>height-pad-(y-minY)/(maxY-minY)*(height-pad*2);

const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
svg.setAttribute("viewBox",`0 0 ${width} ${height}`);
svg.setAttribute("class","lr-svg");

const axisX=document.createElementNS("http://www.w3.org/2000/svg","line");
axisX.setAttribute("x1",pad);
axisX.setAttribute("x2",width-pad);
axisX.setAttribute("y1",height-pad);
axisX.setAttribute("y2",height-pad);
axisX.setAttribute("class","lr-axis");

const axisY=document.createElementNS("http://www.w3.org/2000/svg","line");
axisY.setAttribute("x1",pad);
axisY.setAttribute("x2",pad);
axisY.setAttribute("y1",pad);
axisY.setAttribute("y2",height-pad);
axisY.setAttribute("class","lr-axis");

svg.append(axisX,axisY);

const line=document.createElementNS("http://www.w3.org/2000/svg","line");

const y1=result.slope*minX+result.intercept;
const y2=result.slope*maxX+result.intercept;

line.setAttribute("x1",sx(minX));
line.setAttribute("x2",sx(maxX));
line.setAttribute("y1",sy(y1));
line.setAttribute("y2",sy(y2));
line.setAttribute("class","lr-fit-line");

svg.append(line);

data.forEach(row=>{

const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");

circle.setAttribute("cx",sx(row.x));
circle.setAttribute("cy",sy(row.y));
circle.setAttribute("r",7);
circle.setAttribute("class","lr-point");

svg.append(circle);

});

container.append(svg);

}

function run(){

if(data.length<2)return;

const result=calculateModel();

renderResults(result);

const live=$("lr-live-step");

if(live){
live.textContent=`Regression complete: ŷ = ${result.slope.toFixed(3)}x + ${result.intercept.toFixed(3)}.`;
}

}

function addSample(){

if(data.length>=20)return;

const last=data[data.length-1];

data.push({
id:Math.max(...data.map(row=>row.id))+1,
x:last.x+1,
y:last.y+1
});

renderTable();
clearResults();

}

function removeSample(){

if(data.length<=2)return;

data.pop();
renderTable();
clearResults();

}

function clearResults(){

["lr-slope-result","lr-intercept-result","lr-mse-result","lr-r2-result"]
.forEach(id=>{
const element=$(id);
if(element)element.textContent="—";
});

const resultBody=$("lr-result-body");
if(resultBody)resultBody.replaceChildren();

const calculation=$("lr-calculation-output");
if(calculation)calculation.innerHTML="<p>Run regression to see the calculations.</p>";

const plot=$("lr-plot");
if(plot)plot.innerHTML='<p class="muted">Run regression to visualize the best-fit line.</p>';

}

function reset(){

data=defaults.map(row=>({...row}));

renderTable();
clearResults();

const live=$("lr-live-step");

if(live){
live.textContent="Reset complete. Run Linear Regression when ready.";
}

}

function init(){

if(!$("linear-regression-playground"))return;

renderTable();
clearResults();

$("lr-run")?.addEventListener("click",run);
$("lr-reset")?.addEventListener("click",reset);
$("lr-add-sample")?.addEventListener("click",addSample);
$("lr-remove-sample")?.addEventListener("click",removeSample);

}

init();

return{run,reset};

})();