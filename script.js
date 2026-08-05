"use strict";

const modelButtons =
  document.querySelectorAll(".model-option[data-model]");

const neuralPlayground =
  document.getElementById("neural-playground");

const cnnPlayground =
  document.getElementById("cnn-playground");

const neuralLearn =
  document.getElementById("neural-learn");

const cnnLearn =
  document.getElementById("cnn-learn");


function switchModel(model){

  modelButtons.forEach(button=>{

    button.classList.toggle(
      "active",
      button.dataset.model === model
    );

  });


  const neuralSelected =
    model === "neural";


  neuralPlayground.hidden =
    !neuralSelected;

  cnnPlayground.hidden =
    neuralSelected;


  neuralLearn.hidden =
    !neuralSelected;

  cnnLearn.hidden =
    neuralSelected;

}


modelButtons.forEach(button=>{

  button.addEventListener(
    "click",
    ()=>{

      switchModel(
        button.dataset.model
      );

    }
  );

});


/* CNN learning tabs */

const cnnTabs =
  document.querySelectorAll(".cnn-tab");


cnnTabs.forEach(tab=>{

  tab.addEventListener(
    "click",
    ()=>{

      cnnTabs.forEach(item=>{

        item.classList.toggle(
          "active",
          item === tab
        );

      });


      const selected =
        tab.dataset.cnnTab;


      document.getElementById(
        "cnn-beginner-panel"
      ).hidden =
        selected !== "beginner";


      document.getElementById(
        "cnn-math-panel"
      ).hidden =
        selected !== "math";


      document.getElementById(
        "cnn-pipeline-panel"
      ).hidden =
        selected !== "pipeline";

    }
  );

});


switchModel("neural");