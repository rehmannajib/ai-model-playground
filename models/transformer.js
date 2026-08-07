"use strict";

/* =====================================================
   TRANSFORMER SELF-ATTENTION PLAYGROUND
===================================================== */

const TransformerModel = (() => {

const $ = id => document.getElementById(id);

function softmax(values){

const max=Math.max(...values);
const exps=values.map(value=>Math.exp(value-max));
const sum=exps.reduce((a,b)=>a+b,0);

return exps.map(value=>value/sum);

}

function embedding(token,index){

let total=0;

for(const char of token){
total+=char.charCodeAt(0);
}

return[
((total%17)+1)/10,
((total%29)+index+1)/10
];

}

function matrixVector(matrix,vector){

return[
matrix[0][0]*vector[0]+matrix[0][1]*vector[1],
matrix[1][0]*vector[0]+matrix[1][1]*vector[1]
];

}

function dot(a,b){
return a[0]*b[0]+a[1]*b[1];
}

function tokens(){

return($("transformer-tokens")?.value??"AI learns from context")
.trim()
.split(/\s+/)
.filter(Boolean)
.slice(0,8);

}

function run(){

const words=tokens();

if(!words.length)return;

const embeddings=words.map((word,index)=>embedding(word,index));

const WQ=[[1,0.2],[0.1,0.9]];
const WK=[[0.9,0.1],[0.2,1]];
const WV=[[1,0],[0,1]];

const Q=embeddings.map(v=>matrixVector(WQ,v));
const K=embeddings.map(v=>matrixVector(WK,v));
const V=embeddings.map(v=>matrixVector(WV,v));

const attention=[];

for(let i=0;i<words.length;i++){

const scores=[];

for(let j=0;j<words.length;j++){
scores.push(dot(Q[i],K[j])/Math.sqrt(2));
}

attention.push(softmax(scores));

}

const outputs=attention.map((weights,i)=>{

let out=[0,0];

weights.forEach((weight,j)=>{
out[0]+=weight*V[j][0];
out[1]+=weight*V[j][1];
});

return out;

});

renderTokens(words,embeddings);
renderAttention(words,attention);
renderOutputs(words,outputs);

$("transformer-live-step").textContent=
`${words.length} tokens processed through simplified self-attention.`;

}

function renderTokens(words,embeddings){

const body=$("transformer-token-body");

if(!body)return;

body.replaceChildren();

words.forEach((word,index)=>{

const tr=document.createElement("tr");

[
index+1,
word,
`[${embeddings[index][0].toFixed(2)}, ${embeddings[index][1].toFixed(2)}]`
].forEach(value=>{

const td=document.createElement("td");
td.textContent=value;
tr.append(td);

});

body.append(tr);

});

}

function renderAttention(words,attention){

const container=$("transformer-attention-output");

if(!container)return;

container.replaceChildren();

const table=document.createElement("table");
table.className="transformer-attention-table";

const head=document.createElement("thead");
const headRow=document.createElement("tr");

const blank=document.createElement("th");
blank.textContent="Query ↓ / Key →";
headRow.append(blank);

words.forEach(word=>{
const th=document.createElement("th");
th.textContent=word;
headRow.append(th);
});

head.append(headRow);
table.append(head);

const body=document.createElement("tbody");

words.forEach((word,i)=>{

const row=document.createElement("tr");

const label=document.createElement("th");
label.textContent=word;
row.append(label);

attention[i].forEach(weight=>{

const td=document.createElement("td");
td.textContent=weight.toFixed(3);
td.style.opacity=String(Math.max(0.25,weight));

row.append(td);

});

body.append(row);

});

table.append(body);
container.append(table);

}

function renderOutputs(words,outputs){

const body=$("transformer-output-body");

if(!body)return;

body.replaceChildren();

words.forEach((word,index)=>{

const tr=document.createElement("tr");

const token=document.createElement("td");
token.textContent=word;

const output=document.createElement("td");
output.textContent=
`[${outputs[index][0].toFixed(3)}, ${outputs[index][1].toFixed(3)}]`;

tr.append(token,output);
body.append(tr);

});

}

function reset(){

if($("transformer-tokens")){
$("transformer-tokens").value="AI learns from context";
}

$("transformer-token-body")?.replaceChildren();
$("transformer-output-body")?.replaceChildren();

const attention=$("transformer-attention-output");

if(attention){
attention.innerHTML="<p>Run self-attention to see the attention matrix.</p>";
}

}

function init(){

if(!$("transformer-playground"))return;

reset();

$("transformer-run")?.addEventListener("click",run);
$("transformer-reset")?.addEventListener("click",reset);

}

init();

return{run,reset};

})();