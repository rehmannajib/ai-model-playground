"use strict";

/* =====================================================
   CNN EDUCATIONAL PLAYGROUND
===================================================== */

const CNN = (() => {

  const $ = id => document.getElementById(id);

  const elements = {
    inputGrid: $("cnn-input-grid"),
    kernelGrid: $("cnn-kernel-grid"),
    featureMap: $("cnn-feature-map"),
    poolMap: $("cnn-pool-map"),
    flatten: $("cnn-flatten-output"),
    calculations: $("cnn-calculation-output"),

    stride: $("cnn-stride"),
    padding: $("cnn-padding"),
    pooling: $("cnn-pooling"),
    poolSize: $("cnn-pool-size"),
    preset: $("cnn-kernel-preset"),

    featureSize: $("cnn-feature-size"),
    poolSizeResult: $("cnn-pool-size-result"),

    run: $("cnn-run"),
    reset: $("cnn-reset"),
    live: $("cnn-live-step")
  };


  const INPUT_SIZE = 5;
  const KERNEL_SIZE = 3;

  const INPUT_MIN = 0;
  const INPUT_MAX = 9;

  const KERNEL_MIN = -3;
  const KERNEL_MAX = 3;


  const defaultInput = [
    [1,2,0,1,3],
    [0,1,2,2,1],
    [3,1,0,2,2],
    [1,2,1,0,3],
    [2,0,1,1,2]
  ];


  const presets = {

    edge: [
      [1,0,-1],
      [1,0,-1],
      [1,0,-1]
    ],

    horizontal: [
      [1,1,1],
      [0,0,0],
      [-1,-1,-1]
    ],

    sharpen: [
      [0,-1,0],
      [-1,5,-1],
      [0,-1,0]
    ],

    blur: [
      [0.11,0.11,0.11],
      [0.11,0.11,0.11],
      [0.11,0.11,0.11]
    ]

  };


  let state = {
    input: copyMatrix(defaultInput),
    kernel: copyMatrix(presets.edge),
    running: false
  };


  function copyMatrix(matrix) {
    return matrix.map(row => [...row]);
  }


  function number(value, fallback = 0) {
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }


  function clamp(value, minimum, maximum, fallback = 0) {
    const parsed = number(value, fallback);

    return Math.min(
      maximum,
      Math.max(minimum, parsed)
    );
  }


  function format(value) {
    const rounded =
      Math.round(value * 1000) / 1000;

    return String(rounded);
  }


  function wait(milliseconds) {
    return new Promise(resolve => {
      window.setTimeout(resolve, milliseconds);
    });
  }


  /* ===================================================
     INPUT GRID
  =================================================== */

  function createEditableGrid(
    container,
    matrix,
    minimum,
    maximum,
    step,
    type
  ) {

    container.replaceChildren();

    matrix.forEach((row, rowIndex) => {

      row.forEach((value, columnIndex) => {

        const input =
          document.createElement("input");

        input.type = "number";
        input.className = "matrix-cell";

        input.min = String(minimum);
        input.max = String(maximum);
        input.step = String(step);

        input.value = format(value);

        input.dataset.row =
          String(rowIndex);

        input.dataset.column =
          String(columnIndex);

        input.setAttribute(
          "aria-label",
          `${type} row ${rowIndex + 1}, column ${columnIndex + 1}`
        );


        input.addEventListener(
          "input",
          () => {

            const parsed =
              Number.parseFloat(input.value);

            if (
              Number.isFinite(parsed) &&
              parsed >= minimum &&
              parsed <= maximum
            ) {

              input.classList.remove("invalid");

              updateStateCell(
                type,
                rowIndex,
                columnIndex,
                parsed
              );

              clearResults();

            } else {

              input.classList.add("invalid");

            }

          }
        );


        input.addEventListener(
          "change",
          () => {

            const safe =
              clamp(
                input.value,
                minimum,
                maximum,
                0
              );

            input.value =
              format(safe);

            input.classList.remove(
              "invalid"
            );

            updateStateCell(
              type,
              rowIndex,
              columnIndex,
              safe
            );

            clearResults();

          }
        );


        container.appendChild(input);

      });

    });

  }


  function updateStateCell(
    type,
    row,
    column,
    value
  ) {

    if (type === "input") {
      state.input[row][column] = value;
    }

    if (type === "kernel") {
      state.kernel[row][column] = value;

      elements.preset.value =
        "custom";
    }

  }


  function renderEditableMatrices() {

    createEditableGrid(
      elements.inputGrid,
      state.input,
      INPUT_MIN,
      INPUT_MAX,
      1,
      "input"
    );


    createEditableGrid(
      elements.kernelGrid,
      state.kernel,
      KERNEL_MIN,
      KERNEL_MAX,
      0.01,
      "kernel"
    );

  }


  /* ===================================================
     PADDING
  =================================================== */

  function padMatrix(
    matrix,
    amount
  ) {

    if (amount === 0) {
      return copyMatrix(matrix);
    }


    const width =
      matrix[0].length +
      amount * 2;


    const padded = [];


    for (
      let row = 0;
      row < matrix.length + amount * 2;
      row += 1
    ) {

      const values =
        Array(width).fill(0);

      padded.push(values);

    }


    matrix.forEach(
      (row, rowIndex) => {

        row.forEach(
          (value, columnIndex) => {

            padded[
              rowIndex + amount
            ][
              columnIndex + amount
            ] = value;

          }
        );

      }
    );


    return padded;

  }


  /* ===================================================
     CONVOLUTION
  =================================================== */

  function calculateConvolution() {

    const stride =
      Number.parseInt(
        elements.stride.value,
        10
      );


    const padding =
      Number.parseInt(
        elements.padding.value,
        10
      );


    const padded =
      padMatrix(
        state.input,
        padding
      );


    const outputSize =
      Math.floor(
        (
          padded.length -
          KERNEL_SIZE
        ) /
        stride
      ) + 1;


    const featureMap = [];

    const calculations = [];


    for (
      let outputRow = 0;
      outputRow < outputSize;
      outputRow += 1
    ) {

      const featureRow = [];


      for (
        let outputColumn = 0;
        outputColumn < outputSize;
        outputColumn += 1
      ) {

        const startRow =
          outputRow * stride;

        const startColumn =
          outputColumn * stride;


        let sum = 0;

        const products = [];


        for (
          let kernelRow = 0;
          kernelRow < KERNEL_SIZE;
          kernelRow += 1
        ) {

          for (
            let kernelColumn = 0;
            kernelColumn < KERNEL_SIZE;
            kernelColumn += 1
          ) {

            const inputValue =
              padded[
                startRow +
                kernelRow
              ][
                startColumn +
                kernelColumn
              ];


            const kernelValue =
              state.kernel[
                kernelRow
              ][
                kernelColumn
              ];


            const product =
              inputValue *
              kernelValue;


            sum += product;


            products.push({
              inputValue,
              kernelValue,
              product
            });

          }

        }


        featureRow.push(sum);


        calculations.push({
          outputRow,
          outputColumn,
          startRow,
          startColumn,
          padding,
          products,
          sum
        });

      }


      featureMap.push(
        featureRow
      );

    }


    return {
      featureMap,
      calculations,
      stride,
      padding
    };

  }


  /* ===================================================
     POOLING
  =================================================== */

  function calculatePooling(
    featureMap
  ) {

    const size =
      Number.parseInt(
        elements.poolSize.value,
        10
      );


    const type =
      elements.pooling.value;


    if (
      featureMap.length <
      size
    ) {

      return {
        matrix: copyMatrix(featureMap),
        type,
        size: 1
      };

    }


    const pooled = [];


    for (
      let row = 0;
      row + size <= featureMap.length;
      row += size
    ) {

      const pooledRow = [];


      for (
        let column = 0;
        column + size <= featureMap[0].length;
        column += size
      ) {

        const values = [];


        for (
          let poolRow = 0;
          poolRow < size;
          poolRow += 1
        ) {

          for (
            let poolColumn = 0;
            poolColumn < size;
            poolColumn += 1
          ) {

            values.push(
              featureMap[
                row + poolRow
              ][
                column + poolColumn
              ]
            );

          }

        }


        let result;


        if (type === "average") {

          result =
            values.reduce(
              (total, value) =>
                total + value,
              0
            ) /
            values.length;

        } else {

          result =
            Math.max(...values);

        }


        pooledRow.push(
          result
        );

      }


      if (pooledRow.length) {
        pooled.push(pooledRow);
      }

    }


    return {
      matrix: pooled,
      type,
      size
    };

  }


  /* ===================================================
     FLATTEN
  =================================================== */

  function flattenMatrix(matrix) {

    return matrix.reduce(
      (result, row) =>
        result.concat(row),
      []
    );

  }


  /* ===================================================
     DISPLAY MATRIX
  =================================================== */

  function renderResultMatrix(
    container,
    matrix
  ) {

    container.replaceChildren();


    if (
      !matrix.length ||
      !matrix[0].length
    ) {

      const message =
        document.createElement("p");

      message.textContent =
        "No values.";

      container.appendChild(message);

      return;

    }


    container.style.gridTemplateColumns =
      `repeat(${matrix[0].length}, 1fr)`;


    matrix.forEach(
      (row, rowIndex) => {

        row.forEach(
          (value, columnIndex) => {

            const cell =
              document.createElement("div");

            cell.className =
              "cnn-result-cell";

            cell.textContent =
              format(value);

            cell.dataset.row =
              String(rowIndex);

            cell.dataset.column =
              String(columnIndex);

            container.appendChild(cell);

          }
        );

      }
    );

  }


  function renderFlattened(
    values
  ) {

    elements.flatten.replaceChildren();


    values.forEach(
      (value, index) => {

        const element =
          document.createElement("span");

        element.className =
          "flatten-value";

        element.textContent =
          format(value);

        element.setAttribute(
          "aria-label",
          `Flattened value ${index + 1}`
        );

        elements.flatten.appendChild(
          element
        );

      }
    );

  }


  /* ===================================================
     CALCULATIONS
  =================================================== */

  function renderCalculations(
    calculations
  ) {

    elements.calculations.replaceChildren();


    calculations.forEach(
      (calculation, index) => {

        const wrapper =
          document.createElement("div");

        wrapper.className =
          "cnn-calc-step";


        const heading =
          document.createElement("strong");

        heading.textContent =
          `Feature map cell ${
            index + 1
          } — row ${
            calculation.outputRow + 1
          }, column ${
            calculation.outputColumn + 1
          }`;


        const equation =
          document.createElement("code");


        equation.textContent =
          calculation.products
            .map(item =>
              `(${format(item.inputValue)} × ${format(item.kernelValue)})`
            )
            .join(" + ");


        const result =
          document.createElement("div");

        result.className =
          "cnn-calc-result";

        result.textContent =
          `= ${format(calculation.sum)}`;


        wrapper.append(
          heading,
          equation,
          result
        );


        elements.calculations.appendChild(
          wrapper
        );

      }
    );

  }


  /* ===================================================
     ANIMATION
  =================================================== */

  function clearHighlights() {

    elements.inputGrid
      .querySelectorAll(".matrix-cell")
      .forEach(cell => {
        cell.classList.remove(
          "highlight"
        );
      });


    elements.featureMap
      .querySelectorAll(".cnn-result-cell")
      .forEach(cell => {
        cell.classList.remove(
          "active"
        );
      });

  }


  function highlightInputWindow(
    calculation
  ) {

    clearHighlights();


    const padding =
      calculation.padding;


    for (
      let kernelRow = 0;
      kernelRow < KERNEL_SIZE;
      kernelRow += 1
    ) {

      for (
        let kernelColumn = 0;
        kernelColumn < KERNEL_SIZE;
        kernelColumn += 1
      ) {

        const paddedRow =
          calculation.startRow +
          kernelRow;


        const paddedColumn =
          calculation.startColumn +
          kernelColumn;


        const originalRow =
          paddedRow -
          padding;


        const originalColumn =
          paddedColumn -
          padding;


        if (
          originalRow >= 0 &&
          originalRow < INPUT_SIZE &&
          originalColumn >= 0 &&
          originalColumn < INPUT_SIZE
        ) {

          const cell =
            elements.inputGrid
              .querySelector(
                `[data-row="${originalRow}"][data-column="${originalColumn}"]`
              );


          if (cell) {
            cell.classList.add(
              "highlight"
            );
          }

        }

      }

    }


    const featureCell =
      elements.featureMap
        .querySelector(
          `[data-row="${calculation.outputRow}"][data-column="${calculation.outputColumn}"]`
        );


    if (featureCell) {
      featureCell.classList.add(
        "active"
      );
    }

  }


  async function animateConvolution(
    calculations
  ) {

    elements.run.disabled = true;
    elements.reset.disabled = true;


    for (
      let index = 0;
      index < calculations.length;
      index += 1
    ) {

      const calculation =
        calculations[index];


      elements.live.textContent =
        `Convolution ${
          index + 1
        } of ${
          calculations.length
        }: moving the 3 × 3 filter across the input.`;


      highlightInputWindow(
        calculation
      );


      await wait(350);

    }


    clearHighlights();


    elements.live.textContent =
      "Convolution complete. Applying pooling...";


    await wait(450);


    elements.run.disabled = false;
    elements.reset.disabled = false;

  }


  /* ===================================================
     RUN CNN
  =================================================== */

  async function run() {

    if (state.running) {
      return;
    }


    state.running = true;


    const convolution =
      calculateConvolution();


    renderResultMatrix(
      elements.featureMap,
      convolution.featureMap
    );


    elements.featureSize.textContent =
      `${convolution.featureMap.length} × ${
        convolution.featureMap[0].length
      }`;


    await animateConvolution(
      convolution.calculations
    );


    const pooling =
      calculatePooling(
        convolution.featureMap
      );


    renderResultMatrix(
      elements.poolMap,
      pooling.matrix
    );


    if (
      pooling.matrix.length &&
      pooling.matrix[0].length
    ) {

      elements.poolSizeResult.textContent =
        `${pooling.matrix.length} × ${
          pooling.matrix[0].length
        }`;

    } else {

      elements.poolSizeResult.textContent =
        "—";

    }


    const flattened =
      flattenMatrix(
        pooling.matrix
      );


    renderFlattened(
      flattened
    );


    renderCalculations(
      convolution.calculations
    );


    elements.live.textContent =
      `CNN simulation complete: ${
        convolution.featureMap.length
      } × ${
        convolution.featureMap[0].length
      } feature map → ${
        flattened.length
      } flattened value${
        flattened.length === 1
          ? ""
          : "s"
      }.`;


    state.running = false;

  }


  /* ===================================================
     PRESETS
  =================================================== */

  function applyPreset() {

    const preset =
      elements.preset.value;


    if (
      preset === "custom"
    ) {
      return;
    }


    state.kernel =
      copyMatrix(
        presets[preset]
      );


    renderEditableMatrices();

    clearResults();

  }


  /* ===================================================
     CLEAR / RESET
  =================================================== */

  function clearResults() {

    elements.featureMap.replaceChildren();
    elements.poolMap.replaceChildren();
    elements.flatten.replaceChildren();
    elements.calculations.replaceChildren();


    elements.featureSize.textContent =
      "—";

    elements.poolSizeResult.textContent =
      "—";


    const flattenMessage =
      document.createElement("span");

    flattenMessage.textContent =
      "Run the CNN to generate the flattened vector.";

    elements.flatten.appendChild(
      flattenMessage
    );


    const calculationMessage =
      document.createElement("p");

    calculationMessage.textContent =
      "Run the CNN to see the calculations.";

    elements.calculations.appendChild(
      calculationMessage
    );


    elements.live.textContent =
      "Ready. Change the image or kernel and run the CNN.";

  }


  function reset() {

    state.input =
      copyMatrix(
        defaultInput
      );


    state.kernel =
      copyMatrix(
        presets.edge
      );


    elements.stride.value =
      "1";

    elements.padding.value =
      "0";

    elements.pooling.value =
      "max";

    elements.preset.value =
      "edge";


    renderEditableMatrices();

    clearResults();

  }


  /* ===================================================
     EVENTS
  =================================================== */

  function attachEvents() {

    elements.run.addEventListener(
      "click",
      run
    );


    elements.reset.addEventListener(
      "click",
      reset
    );


    elements.preset.addEventListener(
      "change",
      applyPreset
    );


    [
      elements.stride,
      elements.padding,
      elements.pooling,
      elements.poolSize
    ].forEach(control => {

      control.addEventListener(
        "change",
        clearResults
      );

    });

  }


  /* ===================================================
     INITIALIZE
  =================================================== */

  function init() {

    if (
      !elements.inputGrid ||
      !elements.kernelGrid
    ) {
      return;
    }


    renderEditableMatrices();

    clearResults();

    attachEvents();

  }


  init();


  return {
    run,
    reset
  };

})();