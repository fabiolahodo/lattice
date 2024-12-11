//src/core/lattice.js

// Import dependencies
import { renderGraph, centerGraph  } from './rendering.js';
import { createSimulation } from './simulation.js';
import { addInteractivity, addNodeInteractivity } from './interactivity.js';
import { GRAPH_CONFIG } from './config.js'; 
import { calculateMetrics } from './metrics.js';
import * as d3 from 'd3';


/**
 * Updates the metrics in the DOM.
 * @param {Object} metrics - The metrics to display.
 */
// Function to update metrics in the DOM
function updateMetricsInDOM(metrics) {
  document.getElementById('total-concepts').textContent = metrics.totalConcepts;
  document.getElementById('total-objects').textContent = metrics.totalObjects;
  document.getElementById('total-attributes').textContent = metrics.totalAttributes;
}


/**
 * Creates a concept lattice based on the provided graph data.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} options - Configuration options for the graph.
 * @returns {Object} - The SVG and simulation instances for further use.
 */
export function createLattice(graphData, options = {}) {
  //const { container = 'body', width = 800, height = 600 } = options;
  
  // Merge options with defaults from the config file
  const { container = 'body', width, height } = {
    ...GRAPH_CONFIG.dimensions,
    ...options,
};
   
  // Validate graph data
   if (!graphData || !graphData.nodes || !graphData.links) {
    throw new Error('Invalid graphData. Ensure it includes nodes and links.');
  }
  // Calculate metrics and log them
  const metrics = calculateMetrics(graphData);
  console.log('Metrics:', metrics);

  // Update metrics in the DOM
  updateMetricsInDOM(metrics);
  
  // Render the graph using dynamic dimensions and get the SVG elements
  const { svg, linkGroup, nodeGroup, labelGroup } = renderGraph(container, graphData, { width, height });
  //const g = svg.select('.graph-transform'); // Select the `g` group
 
  /* Adjust the graph transform group for padding from config
  const padding =  GRAPH_CONFIG.dimensions.padding;
  svg
    .attr('width', GRAPH_CONFIG.dimensions.padding * 2) // Increase SVG width with dynamic padding
    .attr('height', GRAPH_CONFIG.dimensions.padding * 2); // Increase SVG height with dynamic padding

  // Adjust the translation of the graph transform group
  const g = svg.select('.graph-transform');
  g.attr('transform', `translate(${width / 2 + padding}, ${height / 2 + padding})`);
  */
  // Create the simulation and add interactivity
  const simulation = createSimulation(graphData, linkGroup, nodeGroup,labelGroup, { width, height });

  // Add interactivity after creating the simulation
  addInteractivity(svg, simulation);

  // Add node-specific interactivity (hover, click, shortest path, etc.)
  addNodeInteractivity(nodeGroup, linkGroup, graphData);

   /*Center graph dynamically after initial rendering
   centerGraph(svg,{width, height});
  */
 // Dynamically center the graph
 //const graphGroup = svg.select('.graph-transform');
 setTimeout(() => {
  const bbox = svg.select('.graph-transform').node().getBBox();
  centerGraph(svg, { width, height, padding: GRAPH_CONFIG.dimensions.padding, bbox });
 }, 100);

  // Return the SVG, simulation and metrics for further use
  return { svg, simulation, metrics };
}

/**
 * Finds the shortest path between two nodes using Breadth-First Search (BFS).
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {string} startNodeId - ID of the starting node.
 * @param {string} endNodeId - ID of the ending node.
 * @returns {Array} - The shortest path as an array of node IDs, or an empty array if no path exists.
 */
export function findShortestPath(graphData, startNodeId, endNodeId) {
  const adjacencyList = new Map();

  // Build adjacency list
  graphData.links.forEach((link) => {
    if (!adjacencyList.has(link.source.id)) adjacencyList.set(link.source.id, []);
    if (!adjacencyList.has(link.target.id)) adjacencyList.set(link.target.id, []);
    adjacencyList.get(link.source.id).push(link.target.id);
    adjacencyList.get(link.target.id).push(link.source.id);
  });

  // BFS setup
  const visited = new Set();
  const queue = [[startNodeId]];

  while (queue.length > 0) {
    const path = queue.shift();
    const currentNode = path[path.length - 1];

    if (currentNode === endNodeId) return path;

    if (!visited.has(currentNode)) {
      visited.add(currentNode);

      const neighbors = adjacencyList.get(currentNode) || [];
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) queue.push([...path, neighbor]);
      });
    }
  }

  return [];
}