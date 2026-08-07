"use strict";

/* =====================================================
   SIMPLE RNN PLAYGROUND
===================================================== */

const RNNModel = (() => {

const $ = id => document.getElementById(id);

const defaults=[0.2,0.5,-0.1,0.8,0.3];

function sequence(){

const text=$("rnn-sequence")?.value??defaults.join(",");

return text
.split(",")
.map(value=>Number.parseFloat(value.trim()))
.filter(Number.isFinite);

}

function parameters(){

return{
wx:Number.parseFloat($("rnn-wx")?.value??0.8),
wh:Number.parseFloat($("rnn-wh")?.value??0.5),
b:Number.parseFloat($("rnn-b")?.value??0.1),
h0:Number.parseFloat($("rnn-h0")?.value??0)
};

}

function run(){

const values=sequence();
const p=parameters();

let h=p.h0;

const steps=[];

values.forEach((x,index)=>{

const z=p.wx*x+p.wh*h+p.b;
const next=Math.tanh(z);

steps.push({
step:index+1,
x,
previous:h,
z,
hidden:next
});

h=next;

});

$("rnn-final-hidden").textContent=h.toFixed(4);

renderSteps(steps);

$("rnn-live-step").textContent=
`Sequence processed through ${steps.length} time steps. Final hidden state = ${h.toFixed(4)}.`;

}

function renderSteps(steps){

const body=$("rnn-step-body");

if(body){

body.replaceChildren();

steps.forEach(step=>{

const tr=document.createElement("tr");

[
step.step,
step.x.toFixed(3),
step.previous.toFixed(3),
step.z.toFixed(3),
step.hidden.toFixed(3)
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

const output=$("rnn-calculation-output");

if(output){

output.replaceChildren();

steps.forEach(step=>{

const box=document.createElement("div");
box.className="rnn-calc-step";

const strong=document.createElement("strong");
strong.textContent=`Time Step ${step.step}`;

const code=document.createElement("code");
code.textContent=
`h${step.step} = tanh(wx × x + wh × h_prev + b) = tanh(${step.z.toFixed(3)}) = ${step.hidden.toFixed(3)}`;

box.append(strong,code);
output.append(box);

});

}

}

function reset(){

if($("rnn-sequence"))$("rnn-sequence").value=defaults.join(", ");
if($("rnn-wx"))$("rnn-wx").value=0.8;
if($("rnn-wh"))$("rnn-wh").value=0.5;
if($("rnn-b"))$("rnn-b").value=0.1;
if($("rnn-h0"))$("rnn-h0").value=0;

$("rnn-final-hidden").textContent="—";
$("rnn-step-body")?.replaceChildren();

const output=$("rnn-calculation-output");
if(output)output.innerHTML="<p>Run the RNN to see hidden-state calculations.</p>";

}

function init(){

if(!$("rnn-playground"))return;

reset();

$("rnn-run")?.addEventListener("click",run);
$("rnn-reset")?.addEventListener("click",reset);

}

init();

return{run,reset};

})();