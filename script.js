// script.js
"use strict";

const modelButtons=
document.querySelectorAll(".model-option[data-model]");

const neuralPlayground=
document.getElementById("neural-playground");

const cnnPlayground=
document.getElementById("cnn-playground");

const neuralLearn=
document.getElementById("neural-learn");

const cnnLearn=
document.getElementById("cnn-learn");

function switchModel(model){

const neural=model==="neural";

modelButtons.forEach(button=>{
button.classList.toggle(
"active",
button.dataset.model===model
);
});

neuralPlayground.hidden=!neural;
cnnPlayground.hidden=neural;

neuralLearn.hidden=!neural;
cnnLearn.hidden=neural;

const learnLink=
document.querySelector("header nav a:last-child");

if(learnLink){
learnLink.href=
neural
?"#neural-learn"
:"#cnn-learn";
}

}

modelButtons.forEach(button=>{
button.addEventListener("click",()=>{
switchModel(button.dataset.model);
});
});

/* CNN Learning Tabs */

const cnnTabs=
document.querySelectorAll(".cnn-tab");

cnnTabs.forEach(tab=>{

tab.addEventListener("click",()=>{

cnnTabs.forEach(item=>
item.classList.toggle(
"active",
item===tab
)
);

const selected=
tab.dataset.cnnTab;

document.getElementById("cnn-beginner-panel").hidden=
selected!=="beginner";

document.getElementById("cnn-math-panel").hidden=
selected!=="math";

document.getElementById("cnn-pipeline-panel").hidden=
selected!=="pipeline";

});

});

switchModel("neural");