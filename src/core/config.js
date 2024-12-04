// src/core/config.js
// Central configuration file to avoid hardcoding

export const GRAPH_CONFIG = {
    dimensions: {
      width: 800, // Default width of the graph
      height: 600, // Default height of the graph
      padding: 50, // Padding around the graph
    },
    node: {
      defaultRadius: 10, // Default radius for nodes
      color: 'blue', // Default node color
      selectedColor: 'red', // Color for selected nodes
      labelOffset: 15, // Distance of labels from nodes
    },
    link: {
      color: '#ccc', // Default color for links
      thickness: 2, // Default thickness of links
      highlightedColor: 'red', // Color for highlighted links
      minDistance: 30, // Minimum link distance
      minThickness: 2, // Minimum link thickness
    },
    constraints: {
      topY: 50, // Minimum y-position for the top concept
      bottomY: 50, // Maximum y-position for the bottom concept
    },
    zoom: {
      scaleExtent: [0.1, 10], // Zoom range: 10% to 1000%
    },
    simulation: {
        collisionFactor: 0.8, // Multiplier for collision radius
        chargeFactor: 5, // Multiplier for charge/repulsion strength
      },
  };
  