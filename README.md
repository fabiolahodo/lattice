# lattice
`lattice.js` is a lightweight and flexible JavaScript library for creating, visualizing, interactiong with, and exporting concept lattices based on Formal Concept Analysis (FCA), powered by D3.js. Designed for academic and research purposes, this library enables users to generate, render, and explore concept lattices in a 2D space.

---

## 🚀 Features and Current Status 🚧

The library is **not feature-complete** and may have bugs or lack certain functionalities.

### Current Features:
- **Graph Rendering**: Automatically renders nodes, links, and labels based on input data.
- **Interactivity**: Includes drag-and-drop for nodes and zoom/pan functionality for the graph.
- **Constrained Node Movement**: Nodes can move freely horizontally but are constrained vertically, ensuring they do not overstep the upper or lower boundaries.
- **Labeling Options**: Supports three labeling modes—ID-only (default), full labeling (showing extent and intent), and reduced labeling (minimal non-redundant labels).
- **Filtering Support**: Enables user-defined filtering by extent or intent, with color-coded feedback for matched concepts.
- **Export Options**: Supports exporting the lattice as JSON, CSV, PNG, PDF, and SLF formats.
- **Data Conversion**: Includes compatibility with the Python concepts library to convert concept lattice data into a format usable by `lattice.js`.
- **Custom Layouts**: Supports customizable layouts, such as hierarchical structures.
- **Scalability**: Built with modularity in mind, making it easy to extend for future needs.
- **Academic Focus**: Includes tools for dataset handling,  export features, and FCA-specific interactions.

---

## 🛠️ Installation

To use or develop this library, we recommend using Visual Studio Code as the development environment. Follow these steps to set up the project:

1. Clone the repository:
   ```bash
   git clone https://github.com/fabiolahodo/lattice.git
   ```
   ```bash
   cd lattice
   ```
2. Open the project in Visual Studio Code
3. Install dependencies:
   ```bash
   npm install
   ```
   This command will install all the dependencies listed in the `package.json` file, including the necessary libraries for running and building the library.
4. Build the library:
   ```bash
   npm run build
   ```
This command generates the bundled version of the library, ready for use in your application.

---

## 🧪 Testing

You can test the library by running the provided examples locally.

1. Start a local development server:
   - If not already installed, install a lightweight server:
     ```bash
     npm install -g live-server
     ```
   - Navigate to the `examples` directory and run:
     ```bash
     live-server examples/frontpage
     ```
     OR
     Serve the project from the root directory by:
      ```bash
     live-server 
     ```

2. Open your browser and interact with the graph.

---
## 📖 Documentation

- 🔰 [Usage Instructions](./usage.md): Step-by-step guide on how to upload your own formal context, visualize the lattice, and interact with the tool.
- 🧪 [Examples and Visualizations](./examples.md): A curated set of examples demonstrating features such as full and reduced labeling, filtering, layout behavior, and export options.
