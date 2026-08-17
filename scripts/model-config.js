"use strict";

/* =====================================================
   AI MODEL PLAYGROUND - CENTRAL CONFIGURATION
   Edit this file when you want to:
   - rename a model
   - add a model
   - remove a model
   - reorganize model categories
===================================================== */

window.AIPlayground = window.AIPlayground || {};

AIPlayground.config = {

  brandIcon: `
    <span class="brand-icon brand-icon-svg" aria-hidden="true">
      <svg viewBox="0 0 24 24" role="img">
        <circle cx="7" cy="7" r="2"></circle>
        <circle cx="17" cy="7" r="2"></circle>
        <circle cx="7" cy="17" r="2"></circle>
        <circle cx="17" cy="17" r="2"></circle>
        <circle cx="12" cy="12" r="2.2"></circle>
        <path d="M8.7 8.7 10.5 10.5M15.3 8.7 13.5 10.5M8.7 15.3 10.5 13.5M15.3 15.3 13.5 13.5"></path>
      </svg>
    </span>`,

  modelStructure: [
    {
      id: "machine-learning",
      label: "Machine Learning",
      icon: "ML",
      sections: [
        {
          id: "supervised",
          label: "Supervised Learning",
          groups: [
            {
              id: "regression",
              label: "Regression",
              models: [
                { id: "linear-regression", label: "Linear Regression", description: "Fit a best-fit line and explore slope, intercept, residuals, MSE and R².", available: true },
                { id: "gradient-boosting", label: "Gradient Boosting", description: "See how weak learners are added sequentially to correct prediction errors.", available: true }
              ]
            },
            {
              id: "classification",
              label: "Classification",
              models: [
                { id: "logistic-regression", label: "Logistic Regression", description: "Explore probabilities, the sigmoid function and binary decision boundaries.", available: true },
                { id: "knn", label: "K-Nearest Neighbors", description: "Classify a point by comparing it with its nearest labeled neighbors.", available: true },
                { id: "svm", label: "Support Vector Machine", description: "Explore margins, support vectors and separating decision boundaries.", available: true },
                { id: "naive-bayes", label: "Naive Bayes", description: "Combine feature probabilities using Bayes’ rule to compare classes.", available: true },
                { id: "tree", label: "Decision Tree", description: "Follow feature splits from the root to a final prediction.", available: true }
              ]
            },
            {
              id: "ensemble",
              label: "Ensemble Learning",
              models: [
                { id: "random-forest", label: "Random Forest", description: "Combine multiple decision trees and inspect ensemble voting.", available: true }
              ]
            }
          ]
        },
        {
          id: "unsupervised",
          label: "Unsupervised Learning",
          groups: [
            {
              id: "clustering",
              label: "Clustering",
              models: [
                { id: "kmeans", label: "K-Means", description: "Group points by repeatedly assigning them to moving cluster centroids.", available: true },
                { id: "dbscan", label: "DBSCAN", description: "Discover density-based clusters, core points and noise without choosing K.", available: true }
              ]
            },
            {
              id: "dimensionality",
              label: "Dimensionality Reduction",
              models: [
                { id: "pca", label: "PCA", description: "See how principal components capture variance and reduce dimensions.", available: true }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "deep-learning",
      label: "Deep Learning",
      icon: "DL",
      sections: [
        {
          id: "neural-networks",
          label: "Basic Neural Networks",
          groups: [
            {
              id: "basic-neural",
              label: "Neural Networks",
              models: [
                { id: "neural", label: "Neural Network / MLP", description: "Build a small network and follow weighted sums and activations forward.", available: true }
              ]
            }
          ]
        },
        {
          id: "computer-vision",
          label: "Computer Vision",
          groups: [
            {
              id: "vision-models",
              label: "Vision Models",
              models: [
                { id: "cnn", label: "Convolutional Neural Network", description: "Move a kernel across an input and inspect convolution, pooling and flattening.", available: true }
              ]
            }
          ]
        },
        {
          id: "sequence-models",
          label: "Sequence Models",
          groups: [
            {
              id: "sequence",
              label: "Sequential Architectures",
              models: [
                { id: "rnn", label: "RNN", description: "Process a sequence step by step while carrying a hidden state forward.", available: true },
                { id: "lstm", label: "LSTM", description: "Explore memory cells and the input, forget and output gates.", available: true }
              ]
            }
          ]
        },
        {
          id: "modern-ai",
          label: "Modern Architectures",
          groups: [
            {
              id: "transformers",
              label: "Attention-Based Models",
              models: [
                { id: "transformer", label: "Transformer", description: "Explore tokens, query-key-value vectors and self-attention relationships.", available: true }
              ]
            }
          ]
        }
      ]
    }
  ]
};

AIPlayground.config.allModelIds = AIPlayground.config.modelStructure.flatMap(category =>
  category.sections.flatMap(section =>
    section.groups.flatMap(group => group.models.map(model => model.id))
  )
);
