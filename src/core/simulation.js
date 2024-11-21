// src/core/simulation.js
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import { centerGraph } from './rendering.js';
import { applyNodeConstraints } from './nodeMovement.js';
import * as d3 from 'd3';
/**
 * Creates and configures a D3 force simulation.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} options - Configuration options for the simulation.
 * @param {number} options.width - The width of the simulation area.
 * @param {number} options.height - The height of the simulation area.
 * @returns {Object} - A configured D3 force simulation instance.
 */
export function createSimulation(graphData, linkGroup, nodeGroup, labelGroup, options) {
  const { width, height } = options;

  // Initialize node positions if undefined
  graphData.nodes.forEach(node => {
    if (node.x === undefined) node.x = width / 2;
    if (node.y === undefined) node.y = height / 2;
  });

  /* Dynamically calculate max link distance based on dataset size and canvas dimensions
  const baseDistance = Math.min(width, height) / 5; // A baseline distance proportional to the canvas size
  const dynamicDistance = (baseDistance / Math.sqrt(graphData.nodes.length)) * 2; // Adjust based on node count

  const linkDistance = d => {
    const levelDiff = Math.abs(d.source.level - d.target.level); // Level difference between nodes
    return Math.max(dynamicDistance / (levelDiff + 1), 50); // Ensure minimum distance of 50
  };
*/
  const simulation = d3.forceSimulation(graphData.nodes)
    //.force('link', d3.forceLink(graphData.links).id(d => d.id).distance(linkDistance)) // Apply dynamic link distance
    .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(150))
    .force('charge', forceManyBody().strength(-500)) // Stronger repulsion
    .force('collision', d3.forceCollide().radius(40)) // Add collision force with radius slightly larger than node size
    //.force('center', d3.forceCenter(0, 0)) // Center at (0, 0)
    .force('center', d3.forceCenter(width / 2, height / 2)) // Center the graph
    .on('tick', () => {
      // Apply node constraints
      applyNodeConstraints(graphData, width, height);

       // Update link positions
      linkGroup
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      // Update node positions
      nodeGroup
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
  /*
      svg.selectAll('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y); */
      
      // Update label positions dynamically
      labelGroup
        .attr('x', d => d.x)
        .attr('y', d => d.y + 25); // Adjust below the node
    }); 
  
    return simulation;
  }
