// src/core/simulation.js

// Import necessary dependencies
import { forceSimulation, forceLink, forceManyBody, forceCollide, forceCenter } from 'd3-force';
import { centerGraph } from './rendering.js';
import { applyNodeConstraints, preventNodeOverlap, avoidEdgeOverlap} from './nodeMovement.js';
import { GRAPH_CONFIG } from './config.js';
import * as d3 from 'd3';

/**
 * Creates and configures a D3 force simulation.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} linkGroup - The D3 selection for links.
 * @param {Object} nodeGroup - The D3 selection for nodes.
 * @param {Object} labelGroup - The D3 selection for labels.
 * @param {Object} options - Configuration options for the simulation.
 * @returns {Object} - A configured D3 force simulation instance.
 */

export function createSimulation(graphData, linkGroup, nodeGroup, labelGroup, options) {
  const { width, height } = { ...GRAPH_CONFIG.dimensions, ...options };
  const padding = GRAPH_CONFIG.dimensions.padding;

/* Initialize node positions if not already set
const layerSpacing = (height - 2 * padding) / ((graphData.layers.length || 1) + 1);
 graphData.nodes.forEach((node) => {
        node.x = node.x || width / 2;
        node.y = node.y || (node.layer !== undefined ? padding + node.layer * layerSpacing : height / 2);
    });
   */ 

// Ensure node positions are assigned ONLY if they are undefined
graphData.nodes.forEach((node) => {
    if (node.x === undefined) node.x = width / 2; // Default center horizontally
    if (node.y === undefined) node.y = height / 2; // Default center vertically
});

//Dynamically adjust force parameters
const baseDistance = Math.min(width, height) / 5; // Base distance relative to canvas size
const dynamicLinkDistance = Math.max(
  GRAPH_CONFIG.link.minDistance, 
  baseDistance / Math.sqrt(graphData.nodes.length)); // Link distance scales with node count

const collisionRadius = Math.max(30, dynamicLinkDistance * GRAPH_CONFIG.simulation.collisionFactor); // Increased collision radius
const chargeStrength = Math.min(-100, -dynamicLinkDistance * GRAPH_CONFIG.simulation.chargeFactor); // Stronger repulsion for larger graphs

  const simulation = d3.forceSimulation(graphData.nodes)
    .force('link', forceLink(graphData.links).id(d => d.id).distance(dynamicLinkDistance)) // Dynamic link distance
    .force('charge', forceManyBody().strength(chargeStrength)) // Adjust repulsion dynamically
    .force('collision', forceCollide().radius(collisionRadius)) // Dynamic collision radius
    .force('center', forceCenter(width / 2, height / 2)) // Center graph
    .on('tick', () => {
      // Update positions dynamically on every tick

       // Update link positions
      linkGroup
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      // Update node positions
      nodeGroup
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
      
      // Update label positions dynamically
      labelGroup
        .attr('x', (d)=> d.x)
        .attr('y', (d) => d.y + GRAPH_CONFIG.node.labelOffset); // Adjust below the node
    
      // Apply node constraints
      applyNodeConstraints(graphData, width, height);
      
      // Prevent node overlaps
      preventNodeOverlap(graphData); 

      // Ensure nodes avoid edge overlaps
      avoidEdgeOverlap(graphData);
      // Debug: Log positions of first few nodes and links
  if (graphData.nodes.length > 0) {
    console.log('Node positions:', graphData.nodes.slice(0, 5).map(n => ({ id: n.id, x: n.x, y: n.y })));
  }
  if (graphData.links.length > 0) {
    console.log('Link positions:', graphData.links.slice(0, 5).map(l => ({ source: l.source.id, target: l.target.id })));
  }
      
}); 
  
    return simulation;
  }
