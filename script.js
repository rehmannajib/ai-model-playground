"use strict";

/* =========================================
   MAIN MODEL SWITCHING
========================================= */

const modelButtons =
document.querySelectorAll(
".model-option[data-model]"
);


const play = {

neural:
document.getElementById(
"neural-playground"
),

cnn:
document.getElementById(
"cnn-playground"
),

tree:
document.getElementById(
"tree-playground"
),

knn:
document.getElementById(
"knn-playground"
)

};


const learn = {

neural:
document.getElementById(
"neural-learn"
),

cnn:
document.getElementById(
"cnn-learn"
),

tree:
document.getElementById(
"tree-learn"
),

knn:
document.getElementById(
"knn-learn"
)

};


const learnLink =
document.getElementById(
"learn-nav-link"
);


/* =========================================
   SWITCH BETWEEN MODELS
========================================= */

function switchModel(model){

modelButtons.forEach(
button => {

button.classList.toggle(
"active",
button.dataset.model === model
);

}
);


Object.entries(
play
)
.forEach(
([name,section]) => {

section.hidden =
name !== model;

}
);


Object.entries(
learn
)
.forEach(
([name,section]) => {

section.hidden =
name !== model;

}
);


if(
model === "cnn"
){

learnLink.href =
"#cnn-learn";

}else if(
model === "tree"
){

learnLink.href =
"#tree-learn";

}else if(
model === "knn"
){

learnLink.href =
"#knn-learn";

}else{

learnLink.href =
"#neural-learn";

}

}


modelButtons.forEach(
button => {

button.addEventListener(
"click",
() => {

switchModel(
button.dataset.model
);

}
);

}
);


/* =========================================
   GENERIC TAB FUNCTION
========================================= */

function setupTabs(
selector,
dataKey,
prefix,
names
){

document
.querySelectorAll(
selector
)
.forEach(
tab => {

tab.addEventListener(
"click",
() => {

document
.querySelectorAll(
selector
)
.forEach(
item => {

item.classList.toggle(
"active",
item === tab
);

}
);


const selected =
tab.dataset[
dataKey
];


names.forEach(
name => {

document.getElementById(
`${prefix}-${name}-panel`
).hidden =
name !== selected;

}
);

}
);

}
);

}


/* =========================================
   CNN LEARNING TABS
========================================= */

setupTabs(
".cnn-tab",
"cnnTab",
"cnn",
[
"beginner",
"math",
"pipeline"
]
);


/* =========================================
   DECISION TREE LEARNING TABS
========================================= */

setupTabs(
".tree-tab",
"treeTab",
"tree",
[
"beginner",
"math",
"split"
]
);


/* =========================================
   KNN LEARNING TABS
========================================= */

setupTabs(
".knn-tab",
"knnTab",
"knn",
[
"beginner",
"math",
"process"
]
);


/* =========================================
   DEFAULT MODEL
========================================= */

switchModel(
"neural"
);