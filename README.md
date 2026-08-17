# AI Model Playground

AI Model Playground is a browser-based educational project for exploring Artificial Intelligence and Machine Learning through interactive visual simulations. It is designed to help learners connect intuitive explanations, mathematical expressions, model parameters, intermediate steps, and outputs.

The playground is an educational simulation. It is not intended for production model training or real-world prediction.

## Available Models

### Machine Learning

- Linear Regression
- Gradient Boosting
- Logistic Regression
- K-Nearest Neighbors (KNN)
- Support Vector Machine (SVM)
- Naive Bayes
- Decision Tree
- Random Forest
- K-Means
- DBSCAN
- Principal Component Analysis (PCA)

### Deep Learning

- Neural Network / MLP
- Convolutional Neural Network (CNN)
- Recurrent Neural Network (RNN)
- Long Short-Term Memory (LSTM)
- Transformer

## Learning Structure

Each model is presented as an interactive educational simulation and includes a consistent learning area with:

- Beginner explanation
- Mathematics
- Process / calculation / pipeline

The shared tab behavior is controlled centrally, so individual models do not need their own tab-navigation code.

## Project Structure

```text
ai-model-playground/
│
├── index.html                  # Home page and About Author
├── playground.html             # Model interfaces and learning content
├── style.css                   # Main site and model styling
├── page-split.css              # Two-page, model-browser and responsive refinements
│
├── scripts/
│   ├── model-config.js         # Model list, labels, descriptions and categories
│   ├── header.js               # Shared Playground header
│   ├── learning-tabs.js        # Beginner / Mathematics / Process tabs
│   ├── model-browser.js        # Model chooser, sidebar, search and switching
│   └── app.js                  # Shared application startup
│
├── models/
│   ├── linear-regression.js
│   ├── gradient-boosting.js
│   ├── logistic-regression.js
│   ├── knn.js
│   ├── svm.js
│   ├── naive-bayes.js
│   ├── decision-tree.js
│   ├── random-forest.js
│   ├── kmeans.js
│   ├── dbscan.js
│   ├── pca.js
│   ├── neural-network.js
│   ├── cnn.js
│   ├── rnn.js
│   ├── lstm.js
│   └── transformer.js
│
├── LICENSE
├── README.md
└── .gitignore
```

## Where to Make Changes

- Change the **Home page or About Author**: `index.html`
- Change the **model interface or learning text**: `playground.html`
- Change the **model list, category, name or chooser description**: `scripts/model-config.js`
- Change **Beginner / Mathematics / Process tab behavior**: `scripts/learning-tabs.js`
- Change the **model chooser, sidebar, search or switching**: `scripts/model-browser.js`
- Change the **Playground header**: `scripts/header.js`
- Change a **specific model's behavior/calculation**: its file inside `models/`
- Change the **general design**: `style.css` and `page-split.css`

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- SVG / browser-based visualization

No frontend framework or external AI service is required for the current version.

## GitHub Workflow

After testing locally:

```bash
git status
git add .
git commit -m "Update AI Model Playground"
git push origin main
```

If GitHub Pages is enabled for the repository, the published website will update from the configured Pages branch after the push is processed.

## Educational Scope

The models use simplified examples intended to demonstrate how algorithms work. The project does not provide medical, financial, or other high-stakes predictions and should not be treated as a production ML system.

## Author

Developed by Najib Ur Rehman.
