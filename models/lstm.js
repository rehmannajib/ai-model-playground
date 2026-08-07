"use strict";

/* =====================================================
   SIMPLE LSTM PLAYGROUND
===================================================== */

const LSTMModel = (() => {

const $ = id => document.getElementById(id);

const sigmoid=z=>1/(1+Math.exp(-z));

const defaults=[0.2,0.5,-0.1,0.8];

function sequence(){

return($("lstm-sequence")?.value??defaults.join(","))
.split(",")
.map(value=>Number.parseFloat(value.trim()))
.filter(Number.isFinite);

}

function run(){

const values=sequence();

let h=0;
let c=0;

const steps=[];

values.forEach((x,index)=>{

const forget=sigmoid(0.7*x+0.5*h+0.1);
const input=sigmoid(0.6*x+0.4*h+0.1);
const candidate=Math.tanh(0.8*x+0.3*h);
const output=sigmoid(0.5*x+0.5*h+0.1);

c=forget*c+input*candidate;
h=output*Math.tanh(c);

steps.push({
step:index+1,
x,
forget,
input,
candidate,
output,
cell:c,
hidden:h
});

});

$("lstm-final-cell").textContent=c.toFixed(4);
$("lstm-final-hidden").textContent=h.toFixed(4);

renderSteps(steps);

$("lstm-live-step").textContent=
`LSTM processed ${steps.length} steps. Final cell=${c.toFixed(4)}, hidden=${h.toFixed(4)}.`;

}

function renderSteps(steps){

const body=$("lstm-step-body");

if(body){

body.replaceChildren();

steps.forEach(step=>{

const tr=document.createElement("tr");

[
step.step,
step.x.toFixed(2),
step.forget.toFixed(3),
step.input.toFixed(3),
step.output.toFixed(3),
step.cell.toFixed(3),
step.hidden.toFixed(3)
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

const output=$("lstm-calculation-output");

if(output){

output.replaceChildren();

steps.forEach(step=>{

const box=document.createElement("div");
box.className="lstm-calc-step";

const strong=document.createElement("strong");
strong.textContent=`Time Step ${step.step}`;

const code=document.createElement("code");
code.textContent=
`f=${step.forget.toFixed(3)}, i=${step.input.toFixed(3)}, candidate=${step.candidate.toFixed(3)}, o=${step.output.toFixed(3)}, c=${step.cell.toFixed(3)}, h=${step.hidden.toFixed(3)}`;

box.append(strong,code);
output.append(box);

});

}

}

function reset(){

if($("lstm-sequence"))$("lstm-sequence").value=defaults.join(", ");

$("lstm-final-cell").textContent="—";
$("lstm-final-hidden").textContent="—";
$("lstm-step-body")?.replaceChildren();

const output=$("lstm-calculation-output");
if(output)output.innerHTML="<p>Run the LSTM to see gate calculations.</p>";

}

function init(){

if(!$("lstm-playground"))return;

reset();

$("lstm-run")?.addEventListener("click",run);
$("lstm-reset")?.addEventListener("click",reset);

}

init();

return{run,reset};

})();