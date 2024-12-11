// src/core/config.js
// Central configuration file to avoid hardcoding

export const GRAPH_CONFIG = {
    dimensions: {
      width: 800, // Default width of the graph
      height: 600, // Default height of the graph
      padding: 50, // Padding around the graph
    },
    node: {
      maxRadius: 10, // Max radius for small graphs
      minRadius: 5, // Smaller minimum radius for very large graphs
      color: 'blue', // Default node color
      selectedColor: 'red', // Color for selected nodes
      labelOffset: 15, // Distance of labels from nodes
    },
    link: {
      color: '#ccc', // Default color for links
      thickness: 2, // Default thickness of links
      highlightedColor: 'red', // Color for highlighted links
      minDistance: 50, // Minimum link distance
      maxDistance: 200, // Maximum link distance for large graphs
      minThickness: 1, // Minimum thickness of links for better performance 
    },
    constraints: {
      topY: 50, // Minimum y-position for the top concept
      bottomY: 50, // Maximum y-position for the bottom concept
    },
    zoom: {
      scaleExtent: [0.1, 2], // Zoom range: 10% to 200% (adjust for large graphs)
    },
    simulation: {
      collisionFactor: 1.2, // Multiplier for collision radius
      chargeFactor: 5, // Multiplier for charge/repulsion strength
      throttling: true, // Enable throttling for simulation updates
      tickInterval: 30, // Minimum interval (ms) between simulation ticks for large graphs
    },
    performance: {
      maxNodes: 5000, // Suggest max nodes for optimal performance
      debounceInterval: 100, // Debounce interval for resize or drag events
    },
    features: {
      enableClustering: false, // Placeholder for future clustering feature
      theme: 'light', // Placeholder for theming (e.g., dark, light)
    },
  };
  