"use strict";

/* =====================================================
   MODEL HIERARCHY
===================================================== */

const MODEL_STRUCTURE = [

{
label:"Machine Learning",
icon:"ML",

sections:[

{
label:"Supervised Learning",

groups:[

{
label:"Regression",
models:[
{id:"linear-regression",label:"Linear Regression"},
{id:"gradient-boosting",label:"Gradient Boosting"}
]
},

{
label:"Classification",
models:[
{id:"logistic-regression",label:"Logistic Regression"},
{id:"knn",label:"K-Nearest Neighbors"},
{id:"svm",label:"Support Vector Machine"},
{id:"naive-bayes",label:"Naive Bayes"},
{id:"tree",label:"Decision Tree"}
]
},

{
label:"Ensemble Learning",
models:[
{id:"random-forest",label:"Random Forest"}
]
}

]

},

{
label:"Unsupervised Learning",

groups:[

{
label:"Clustering",
models:[
{id:"kmeans",label:"K-Means"},
{id:"dbscan",label:"DBSCAN"}
]
},

{
label:"Dimensionality Reduction",
models:[
{id:"pca",label:"Principal Component Analysis"}
]
}

]

}

]

},


{
label:"Deep Learning",
icon:"DL",

sections:[

{
label:"Basic Neural Networks",

groups:[

{
label:"Feedforward Networks",
models:[
{id:"neural",label:"Neural Network / MLP"}
]
}

]

},

{
label:"Computer Vision",

groups:[

{
label:"Vision Models",
models:[
{id:"cnn",label:"Convolutional Neural Network"}
]
}

]

},

{
label:"Sequence Models",

groups:[

{
label:"Sequential Architectures",
models:[
{id:"rnn",label:"Recurrent Neural Network"},
{id:"lstm",label:"LSTM"}
]
}

]

},

{
label:"Modern Architectures",

groups:[

{
label:"Attention-Based Models",
models:[
{id:"transformer",label:"Transformer"}
]
}

]

}

]

}

];


/* =====================================================
   PLAYGROUND SECTIONS
===================================================== */

const PLAYGROUND_SECTIONS = {

neural:
document.getElementById("neural-playground"),

cnn:
document.getElementById("cnn-playground"),

tree:
document.getElementById("tree-playground"),

knn:
document.getElementById("knn-playground"),

"linear-regression":
document.getElementById("linear-regression-playground"),

"logistic-regression":
document.getElementById("logistic-regression-playground"),

svm:
document.getElementById("svm-playground"),

"naive-bayes":
document.getElementById("naive-bayes-playground"),

"random-forest":
document.getElementById("random-forest-playground"),

"gradient-boosting":
document.getElementById("gradient-boosting-playground"),

kmeans:
document.getElementById("kmeans-playground"),

dbscan:
document.getElementById("dbscan-playground"),

pca:
document.getElementById("pca-playground"),

rnn:
document.getElementById("rnn-playground"),

lstm:
document.getElementById("lstm-playground"),

transformer:
document.getElementById("transformer-playground")

};


/* =====================================================
   LEARNING SECTIONS
===================================================== */

const LEARNING_SECTIONS = {};

document
.querySelectorAll(
".model-learn-section[data-learn-model]"
)
.forEach(
section => {

LEARNING_SECTIONS[
section.dataset.learnModel
] = section;

}
);


const learnLink =
document.getElementById(
"learn-nav-link"
);


/* =====================================================
   CREATE NAVIGATION
===================================================== */

function createModelNavigation(){

const placeholder =
document.getElementById(
"model-navigation"
);

if(!placeholder){
return;
}


const mobileButton =
document.createElement(
"button"
);

mobileButton.type =
"button";

mobileButton.className =
"model-mobile-toggle";

mobileButton.innerHTML =
"<span>☰ Choose AI Model</span><strong>Browse</strong>";


const browser =
document.createElement(
"div"
);

browser.className =
"model-browser";


const sidebar =
document.createElement(
"aside"
);

sidebar.className =
"model-sidebar";


const sidebarHeader =
document.createElement(
"div"
);

sidebarHeader.className =
"model-sidebar-header";

sidebarHeader.innerHTML = `

<small>AI Playground</small>

<h3>Explore Models</h3>

<p>
Choose a learning type, category and model.
</p>

`;


const searchWrap =
document.createElement(
"div"
);

searchWrap.className =
"model-search-wrap";


const search =
document.createElement(
"input"
);

search.type =
"search";

search.className =
"model-search";

search.placeholder =
"Search models...";


searchWrap.append(
search
);


const tree =
document.createElement(
"nav"
);

tree.className =
"model-tree";


const sidebarFooter =
document.createElement(
"div"
);

sidebarFooter.className =
"model-sidebar-footer";

sidebarFooter.textContent =
"16 interactive AI & ML models";


sidebar.append(
sidebarHeader,
searchWrap,
tree,
sidebarFooter
);


const content =
document.createElement(
"div"
);

content.className =
"model-content";


const breadcrumb =
document.createElement(
"div"
);

breadcrumb.className =
"model-breadcrumb";

breadcrumb.id =
"model-breadcrumb";


content.append(
breadcrumb
);


Object.values(
PLAYGROUND_SECTIONS
)
.forEach(
section => {

if(section){
content.append(section);
}

}
);


browser.append(
sidebar,
content
);


placeholder.replaceWith(
mobileButton,
browser
);


mobileButton.addEventListener(
"click",
() => {

sidebar.classList.toggle(
"mobile-open"
);

}
);


renderNavigationTree(
tree
);


search.addEventListener(
"input",
() => {

filterNavigation(
tree,
search.value
);

}
);

}


/* =====================================================
   BUILD NAVIGATION TREE
===================================================== */

function renderNavigationTree(
tree
){

tree.replaceChildren();


MODEL_STRUCTURE.forEach(
mainCategory => {

const mainGroup =
document.createElement(
"div"
);

mainGroup.className =
"nav-main-group";


const mainButton =
document.createElement(
"button"
);

mainButton.type =
"button";

mainButton.className =
"nav-main-button";


const mainIcon =
document.createElement(
"span"
);

mainIcon.className =
"nav-main-icon";

mainIcon.textContent =
mainCategory.icon;


const mainLabel =
document.createElement(
"span"
);

mainLabel.className =
"nav-main-label";

mainLabel.textContent =
mainCategory.label;


const mainChevron =
document.createElement(
"span"
);

mainChevron.className =
"nav-chevron";

mainChevron.textContent =
"›";


mainButton.append(
mainIcon,
mainLabel,
mainChevron
);


const mainContent =
document.createElement(
"div"
);

mainContent.className =
"nav-main-content";


mainCategory.sections.forEach(
section => {

const learningSection =
document.createElement(
"div"
);

learningSection.className =
"nav-learning-section";


const learningButton =
document.createElement(
"button"
);

learningButton.type =
"button";

learningButton.className =
"nav-learning-button";


const dot =
document.createElement(
"span"
);

dot.className =
"nav-level-dot";


const learningLabel =
document.createElement(
"span"
);

learningLabel.textContent =
section.label;


const learningChevron =
document.createElement(
"span"
);

learningChevron.className =
"nav-chevron";

learningChevron.textContent =
"›";


learningButton.append(
dot,
learningLabel,
learningChevron
);


const learningContent =
document.createElement(
"div"
);

learningContent.className =
"nav-learning-content";


section.groups.forEach(
group => {

const category =
document.createElement(
"div"
);

category.className =
"nav-category";


const categoryButton =
document.createElement(
"button"
);

categoryButton.type =
"button";

categoryButton.className =
"nav-category-button";


const categoryLabel =
document.createElement(
"span"
);

categoryLabel.textContent =
group.label;


const categoryChevron =
document.createElement(
"span"
);

categoryChevron.className =
"nav-chevron";

categoryChevron.textContent =
"›";


categoryButton.append(
categoryLabel,
categoryChevron
);


const modelList =
document.createElement(
"div"
);

modelList.className =
"nav-model-list";


group.models.forEach(
model => {

const modelButton =
document.createElement(
"button"
);

modelButton.type =
"button";

modelButton.className =
"nav-model";

modelButton.dataset.model =
model.id;

modelButton.dataset.search =
`${mainCategory.label} ${section.label} ${group.label} ${model.label}`
.toLowerCase();


const modelDot =
document.createElement(
"span"
);

modelDot.className =
"nav-model-dot";


const modelText =
document.createElement(
"span"
);

modelText.className =
"nav-model-text";

modelText.textContent =
model.label;


modelButton.append(
modelDot,
modelText
);


modelButton.addEventListener(
"click",
() => {

switchModel(
model.id
);


document
.querySelectorAll(
".nav-model"
)
.forEach(
item => {

item.classList.toggle(
"active",
item.dataset.model ===
model.id
);

}
);


updateBreadcrumb(
mainCategory.label,
section.label,
group.label,
model.label
);


sidebarClose();

}
);


modelList.append(
modelButton
);

}
);


categoryButton.addEventListener(
"click",
() => {

categoryButton.classList.toggle(
"open"
);

modelList.classList.toggle(
"open"
);

}
);


category.append(
categoryButton,
modelList
);


learningContent.append(
category
);

}
);


learningButton.addEventListener(
"click",
() => {

learningButton.classList.toggle(
"open"
);

learningContent.classList.toggle(
"open"
);

}
);


learningSection.append(
learningButton,
learningContent
);


mainContent.append(
learningSection
);

}
);


mainButton.addEventListener(
"click",
() => {

mainButton.classList.toggle(
"open"
);

mainContent.classList.toggle(
"open"
);

}
);


mainGroup.append(
mainButton,
mainContent
);


tree.append(
mainGroup
);

}
);


openDefaultNavigation();

}


/* =====================================================
   SWITCH MODEL
===================================================== */

function switchModel(
model
){

Object.entries(
PLAYGROUND_SECTIONS
)
.forEach(
([name,section]) => {

if(section){

section.hidden =
name !== model;

}

}
);


Object.entries(
LEARNING_SECTIONS
)
.forEach(
([name,section]) => {

section.hidden =
name !== model;

}
);


if(
learnLink &&
LEARNING_SECTIONS[model]
){

learnLink.href =
`#${LEARNING_SECTIONS[model].id}`;

}

}


/* =====================================================
   DEFAULT NAVIGATION
===================================================== */

function openDefaultNavigation(){

const neural =
document.querySelector(
'.nav-model[data-model="neural"]'
);

if(!neural){
return;
}


neural.classList.add(
"active"
);


openNavigationPath(
neural
);


updateBreadcrumb(
"Deep Learning",
"Basic Neural Networks",
"Feedforward Networks",
"Neural Network / MLP"
);

}


/* =====================================================
   OPEN PATH
===================================================== */

function openNavigationPath(
model
){

const modelList =
model.closest(
".nav-model-list"
);

modelList?.classList.add(
"open"
);


modelList
?.previousElementSibling
?.classList.add(
"open"
);


const learningContent =
model.closest(
".nav-learning-content"
);

learningContent?.classList.add(
"open"
);


learningContent
?.previousElementSibling
?.classList.add(
"open"
);


const mainContent =
model.closest(
".nav-main-content"
);

mainContent?.classList.add(
"open"
);


mainContent
?.previousElementSibling
?.classList.add(
"open"
);

}


/* =====================================================
   BREADCRUMB
===================================================== */

function updateBreadcrumb(
main,
learning,
category,
model
){

const breadcrumb =
document.getElementById(
"model-breadcrumb"
);

if(!breadcrumb){
return;
}


breadcrumb.replaceChildren();


[
main,
learning,
category
]
.forEach(
item => {

const text =
document.createElement(
"span"
);

text.textContent =
item;


const separator =
document.createElement(
"span"
);

separator.className =
"breadcrumb-separator";

separator.textContent =
"›";


breadcrumb.append(
text,
separator
);

}
);


const current =
document.createElement(
"strong"
);

current.textContent =
model;


breadcrumb.append(
current
);

}


/* =====================================================
   SEARCH
===================================================== */

function filterNavigation(
tree,
query
){

const normalized =
query
.trim()
.toLowerCase();


let visible =
0;


tree
.querySelectorAll(
".nav-model"
)
.forEach(
model => {

const matches =
!normalized ||
model.dataset.search.includes(
normalized
);


model.hidden =
!matches;


if(matches){

visible++;


if(normalized){

openNavigationPath(
model
);

}

}

}
);


tree
.querySelector(
".model-search-empty"
)
?.remove();


if(
visible === 0
){

const empty =
document.createElement(
"div"
);

empty.className =
"model-search-empty";

empty.textContent =
"No matching models found.";


tree.append(
empty
);

}

}


/* =====================================================
   MOBILE CLOSE
===================================================== */

function sidebarClose(){

document
.querySelector(
".model-sidebar"
)
?.classList.remove(
"mobile-open"
);

}


/* =====================================================
   GENERIC LEARN TABS
===================================================== */

function initializeLearningTabs(){

document
.querySelectorAll(
".model-learn-section"
)
.forEach(
section => {

const buttons =
section.querySelectorAll(
"[data-learn-tab]"
);


const panels =
section.querySelectorAll(
"[data-learn-panel]"
);


buttons.forEach(
button => {

button.addEventListener(
"click",
() => {

const selected =
button.dataset.learnTab;


buttons.forEach(
item => {

item.classList.toggle(
"active",
item === button
);

}
);


panels.forEach(
panel => {

panel.hidden =
panel.dataset.learnPanel !==
selected;

}
);

}
);

}
);

}
);

}


/* =====================================================
   INITIALIZE
===================================================== */

createModelNavigation();

initializeLearningTabs();

switchModel(
"neural"
);