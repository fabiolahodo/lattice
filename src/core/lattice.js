//src/core/lattice.js

// Import dependencies
import { renderGraph, centerGraph  } from './rendering.js';
import { createSimulation } from './simulation.js';
import { addInteractivity } from './interactivity.js';
import { GRAPH_CONFIG } from './config.js'; 
import * as d3 from 'd3';

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

   /*Center graph dynamically after initial rendering
   centerGraph(svg,{width, height});
  */
 // Dynamically center the graph
 //const graphGroup = svg.select('.graph-transform');
 setTimeout(() => {
  const bbox = svg.select('.graph-transform').node().getBBox();
  centerGraph(svg, { width, height, padding: GRAPH_CONFIG.dimensions.padding, bbox });
 }, 100);

  // Return the SVG and simulation for further use
  return { svg, simulation };
}
