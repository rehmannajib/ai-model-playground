// script.js
"use strict";

const modelButtons=document.querySelectorAll(".model-option[data-model]");
const play={neural:document.getElementById("neural-playground"),cnn:document.getElementById("cnn-playground"),tree:document.getElementById("tree-playground")};
const learn={neural:document.getElementById("neural-learn"),cnn:document.getElementById("cnn-learn"),tree:document.getElementById("tree-learn")};
const learnLink=document.getElementById("learn-nav-link");

function switchModel(model){
modelButtons.forEach(button=>button.classList.toggle("active",button.dataset.model===model));

Object.entries(play).forEach(([name,section])=>section.hidden=name!==model);
Object.entries(learn).forEach(([name,section])=>section.hidden=name!==model);

learnLink.href=model==="cnn"?"#cnn-learn":model==="tree"?"#tree-learn":"#neural-learn";
}

modelButtons.forEach(button=>button.addEventListener("click",()=>switchModel(button.dataset.model)));

function setupTabs(selector,dataKey,prefix,names){
document.querySelectorAll(selector).forEach(tab=>{
tab.addEventListener("click",()=>{
document.querySelectorAll(selector).forEach(item=>item.classList.toggle("active",item===tab));
const selected=tab.dataset[dataKey];
names.forEach(name=>document.getElementById(`${prefix}-${name}-panel`).hidden=name!==selected);
});
});
}

setupTabs(".cnn-tab","cnnTab","cnn",["beginner","math","pipeline"]);
setupTabs(".tree-tab","treeTab","tree",["beginner","math","split"]);

switchModel("neural");