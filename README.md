# AI Model Playground

AI Model Playground is a free, browser-based educational platform designed to help students, researchers, and beginners understand how Artificial Intelligence and Machine Learning models work through interactive visual simulations.

The goal is simple:

> Instead of only reading how an AI model works, users should be able to see the inputs, calculations, transformations, and outputs visually.

This project is built for education only. It does not train models, upload datasets, or send user data to external AI services.

---

## Current Status

The project currently includes two working interactive modules:

### Neural Network Playground

Users can:

- Configure the number of input neurons
- Configure the number of hidden layers
- Configure neurons in each hidden layer
- Change input values using sliders or direct number entry
- Select activation functions
  - ReLU
  - Sigmoid
  - Tanh
- Change output bias
- Run a forward pass
- Watch values move through the network
- View hidden-layer activations
- View the final output
- See connection weights
- See neuron biases
- Switch between Simple and Advanced modes
- Edit individual weights in Advanced mode
- Edit hidden-neuron biases
- See stronger weights represented by thicker connections
- Distinguish positive and negative weights
- View step-by-step mathematical calculations

The architecture is generated dynamically, allowing users to experiment with different network structures.

---

## CNN Playground

The CNN Playground demonstrates the core stages of a simplified Convolutional Neural Network:

```text
Input
   ↓
Kernel / Filter
   ↓
Convolution
   ↓
Feature Map
   ↓
Pooling
   ↓
Flatten
```

Users can:

- Edit a 5 × 5 input image matrix
- Edit a 3 × 3 convolution kernel
- Select predefined filters
  - Vertical Edge Detection
  - Horizontal Edge Detection
  - Sharpen
  - Blur
  - Custom Filter
- Change stride
- Change padding
- Select Max Pooling or Average Pooling
- Run the complete CNN simulation
- Move through convolution manually
- Use Previous Step
- Use Next Step
- Use Auto Play
- Reset the convolution steps
- Watch the active input region highlighted
- Watch the kernel position visually
- See each feature-map value appear
- View the current convolution equation
- View all convolution calculations
- See the resulting pooled feature map
- See the flattened feature vector

Example convolution calculation:

```text
(1 × 1) + (2 × 0) + (0 × -1)
+ (0 × 1) + (1 × 0) + (2 × -1)
+ (3 × 1) + (1 × 0) + (0 × -1)

= Feature Map Value
```

---

## Learning Modes

The playground is designed to support different levels of understanding.

### Beginner Mode

Explains the concepts using simple language.

### Mathematics Mode

Shows the equations behind the model.

For a neural network:

```text
z = Σ(xᵢ × wᵢ) + b
```

```text
a = f(z)
```

For CNN convolution:

```text
y(i,j) = Σₘ Σₙ x(i+m,j+n) × k(m,n)
```

Feature-map size:

```text
O = floor((N + 2P − K) / S) + 1
```

### Calculation Mode

Displays the actual numerical calculations performed using the current user-selected values.

---

## Project Goals

The long-term goal is to create a professional visual learning platform covering major AI and Machine Learning models and concepts.

Planned modules include:

- Neural Networks
- Convolutional Neural Networks
- RNNs
- LSTMs
- Transformers
- Attention
- Autoencoders
- GANs
- Reinforcement Learning
- Q-Learning
- Deep Q Networks
- Decision Trees
- Random Forest
- XGBoost
- Logistic Regression
- Linear Regression
- K-Nearest Neighbors
- Support Vector Machines
- Naive Bayes
- PCA
- K-Means
- DBSCAN
- Embeddings
- Tokenization
- Gradient Descent
- Backpropagation
- Loss Functions
- Activation Functions

---

## Project Philosophy

The platform follows a visual learning approach:

```text
Input
   ↓
Model Operation
   ↓
Intermediate Calculations
   ↓
Transformation
   ↓
Output
```

Every model should eventually include:

- Interactive visualization
- Beginner explanation
- Mathematical explanation
- Step-by-step calculations
- Adjustable parameters
- Guided experimentation
- Real-world applications
- Common mistakes
- Code examples
- Interactive quizzes

---

## Technology

The project currently uses:

- HTML5
- CSS3
- Vanilla JavaScript
- SVG
- Browser-based numerical simulation

No frontend framework is required at this stage.

The project intentionally starts with standard web technologies so the underlying software engineering concepts remain understandable and transparent.

Future versions may introduce:

- Canvas
- TensorFlow.js
- ONNX Runtime Web
- Node.js
- Express
- Additional visualization libraries where appropriate

---

## Project Structure

```text
ai-model-playground/
│
├── index.html
├── style.css
├── script.js
│
├── models/
│   ├── neural-network.js
│   └── cnn.js
│
├── .gitignore
├── LICENSE
└── README.md
```

### `index.html`

Contains the structure of the website and model interfaces.

### `style.css`

Contains the visual design, layout, responsive behavior, accessibility styles, and model visualization styles.

### `script.js`

Handles shared website behavior such as switching between model playgrounds.

### `models/neural-network.js`

Contains the Neural Network simulation and visualization logic.

### `models/cnn.js`

Contains the CNN convolution, pooling, flattening, animation, and calculation logic.

---

## Security Approach

The current version runs entirely inside the user's browser.

No API keys are used.

No user data is sent to a server.

No account or authentication system is currently required.

Dynamic content is created using safe DOM methods such as:

```javascript
document.createElement()
```

```javascript
textContent
```

rather than inserting untrusted strings directly using `innerHTML` wherever dynamic user-controlled values are involved.

Input values are also restricted and validated before use.

Examples:

```text
Neural Network inputs: 0 to 1
Weights: -1 to 1
Bias values: -1 to 1
CNN pixel values: 0 to 9
CNN kernel values: -3 to 3
```

---

## Accessibility

The project aims to support accessible interaction from the beginning.

Current accessibility considerations include:

- Semantic HTML
- Labels for controls
- Keyboard-accessible buttons and form fields
- Visible focus indicators
- Responsive layouts
- Text explanations in addition to visual information
- Reduced-motion support
- Numerical labels instead of relying only on color
- Positive and negative weight differences represented visually

---

## Responsive Design

The interface is designed to adapt across:

- Desktop computers
- Laptops
- Tablets
- Mobile devices

Complex model visualizations may become horizontally scrollable on smaller screens to preserve readability.

---

## Educational Scope

AI Model Playground is a simulation and learning environment.

It is not intended to provide production AI predictions.

It does not currently:

- Train neural networks
- Upload training datasets
- Store personal data
- Call external AI APIs
- Provide medical, financial, or other high-stakes predictions

The numerical values used in the playground are simplified examples designed to demonstrate the mechanics of AI models.

---

## Development Roadmap

### Phase 1 — Foundation

- [x] Git repository
- [x] HTML structure
- [x] CSS styling
- [x] JavaScript integration
- [x] Responsive design
- [x] Git version control
- [x] Local development using Live Server

### Phase 2 — Neural Network Playground

- [x] Dynamic inputs
- [x] Dynamic hidden layers
- [x] Dynamic neuron counts
- [x] Forward propagation
- [x] Activation functions
- [x] Weight visualization
- [x] Editable weights
- [x] Editable biases
- [x] Simple Mode
- [x] Advanced Mode
- [x] Mathematical calculations
- [x] Animated forward pass

### Phase 3 — CNN Playground

- [x] Editable image matrix
- [x] Editable kernel
- [x] Filter presets
- [x] Convolution
- [x] Stride
- [x] Padding
- [x] Feature map
- [x] Max pooling
- [x] Average pooling
- [x] Flattening
- [x] Step-by-step convolution
- [x] Previous / Next navigation
- [x] Auto Play
- [x] Live equations

### Phase 4 — Next Models

Planned:

- [ ] Decision Tree
- [ ] Linear Regression
- [ ] Logistic Regression
- [ ] KNN
- [ ] K-Means
- [ ] SVM
- [ ] Transformer
- [ ] Attention

### Phase 5 — Advanced Learning Features

Planned:

- [ ] Guided experiments
- [ ] Interactive quizzes
- [ ] Python code examples
- [ ] JavaScript code examples
- [ ] AI glossary
- [ ] Model comparison
- [ ] AI timeline
- [ ] Responsible AI section
- [ ] Accessibility documentation

---

## Future Architecture

As more models are added, each model will be separated into its own JavaScript module.

Example:

```text
models/
├── neural-network.js
├── cnn.js
├── decision-tree.js
├── linear-regression.js
├── logistic-regression.js
├── knn.js
├── svm.js
├── kmeans.js
├── transformer.js
└── attention.js
```

This approach keeps the project maintainable as the number of visualizers grows.

---

## Development Workflow

Changes are developed locally using VS Code and Live Server.

The normal Git workflow is:

```bash
git status
```

```bash
git add .
```

```bash
git commit -m "Describe the completed change"
```

```bash
git push origin main
```

This ensures each working milestone is preserved in the repository history.

---

## Contributing

The project is currently under active development.

Future contributions may include:

- New AI model visualizations
- Accessibility improvements
- Educational explanations
- Mathematical walkthroughs
- Bug fixes
- Mobile UX improvements
- Performance improvements

---

## Responsible Use

AI Model Playground is intended to improve understanding of AI systems.

The project aims to clearly distinguish simplified educational simulations from real-world AI systems, which can involve significantly larger architectures, trained parameters, datasets, optimization procedures, and computational resources.

---

## License

See the `LICENSE` file in this repository for licensing information.

---

## AI Model Playground

**Learn AI by seeing it work.**
