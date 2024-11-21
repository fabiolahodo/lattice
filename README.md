# lattice
A modular JavaScript library for creating and visualizing concept lattices, powered by D3.js.Designed for academic and research purposes, this library enables users to generate, render, and interact with concept lattices in a 2D space.

---

## 🚀 Features and Current Status 🚧

The library is **not feature-complete** and may have bugs or missing functionalities.

### Current Features:
- **Graph Rendering**: Automatically renders nodes, links, and labels based on input data.
- **Dynamic Edge Colors**: Highlights edges connected to a selected node.
- **Interactivity**: Includes drag-and-drop for nodes and zoom/pan functionality for the graph.
- **Constrained Node Movement**: Nodes can move freely horizontally but are constrained vertically, ensuring they do not overstep the upper or lower boundaries.
- **Custom Layouts**: Supports customizable layouts, such as hierarchical structures.
- **Scalability**: Built with modularity in mind, making it easy to extend for future needs.
- **Academic Focus**: Includes tools for dataset handling, graph exporting, and more.

---

## 🛠️ Installation

To use the library, clone the repository and install the necessary dependencies.

1. Clone the repository:
   ```bash
   git clone [https://github.com/fabiolahodo/lattice.git]
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   This command will install all the dependencies listed in the package.json file, including the necessary libraries for running and building the library.
3. Build the library:
   ```bash
   npm run build
   ```

---

## 🧪 Testing

You can test the library by running the provided examples.

1. Start a local development server:
   - Install a lightweight server:
     ```bash
     npm install -g live-server
     ```
   - Navigate to the `examples` directory and run:
     ```bash
     live-server examples/basic-example
     ```
2. Open your browser and interact with the graph.
