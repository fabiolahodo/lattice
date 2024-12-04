// src/core/nodeMovement.js

// Import necessary dependencies
import { GRAPH_CONFIG } from './config.js';

/**
 * Applies constraints to node positions.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {number} width - Width of the graph area.
 * @param {number} height - Height of the graph area.
 */

export function applyNodeConstraints(graphData, width, height) {
  const padding = GRAPH_CONFIG.dimensions.padding; // Use dynamic padding from config to maintain a gap between nodes
  
  /**
   * Helper function to find nodes linked to a given node.
   * @param {string} nodeId - The ID of the node to find linked nodes for.
   * @returns {Array} - Array of linked nodes.
   */

  function getLinkedNodes(nodeId) {
    return graphData.links
      .filter(link => link.source.id === nodeId || link.target.id === nodeId)
      .map(link => (link.source.id === nodeId ? link.target : link.source));
  }

  
  // Apply constraints to nodes
  graphData.nodes.forEach(node => {
    if (node.id === 'Top Concept') {
      // Constrain the 'Top Concept' to be at the top of the graph (fixed level)
      node.y = Math.min(node.y, GRAPH_CONFIG.constraints.topY); // Keep it fixed at the top, for example, 50px away from the top
    } else if (node.id === 'Bottom Concept') {
      // Constrain the 'Bottom Concept' to be at the bottom of the graph (fixed level)
      node.y = Math.max(node.y, height - GRAPH_CONFIG.constraints.bottomY); // Keep it fixed at the bottom, for example, 50px away from the bottom
    } else {
      /* For other nodes, constrain them based on the level
      const topY = Math.min(...graphData.nodes.filter(n => n.id === 'Top Concept').map(n => n.y));
      const bottomY = Math.max(...graphData.nodes.filter(n => n.id === 'Bottom Concept').map(n => n.y));
      

      // Ensure the y-coordinate of the node respects the level and does not exceed the bounds of top and bottom nodes
      const levelPadding = 50;  // You can adjust the padding as needed
      const minY = topY + (node.level - 1) * levelPadding;  // Calculate the minimum y-coordinate based on the level
      const maxY = bottomY - (5 - node.level) * levelPadding; // Adjust this based on the maximum level (assuming 5 levels)
      
      node.y = Math.max(minY, Math.min(maxY, node.y)); // Keep node within the bounds defined by its level
    
    */
      // Constrain inner nodes based on their neighbors
      const linkedNodes = getLinkedNodes(node.id);

      const upperNeighbors = linkedNodes.filter(n => n.level < node.level);
      const lowerNeighbors = linkedNodes.filter(n => n.level > node.level);

      // Calculate constraints based on neighbors
      const topY = upperNeighbors.length > 0
        ? Math.max(...upperNeighbors.map(n => n.y + padding)) // Ensure node stays below its upper neighbors
        : 0; // No upper neighbors, fallback to the top of the graph
      const bottomY = lowerNeighbors.length > 0
        ? Math.min(...lowerNeighbors.map(n => n.y - padding)) // Ensure node stays above its lower neighbors
        : height; // No lower neighbors, fallback to the bottom of the graph

      // Constrain the node within these bounds
      node.y = Math.max(topY, Math.min(bottomY, node.y));

    }

    // Ensure all nodes stay within the SVG bounds
    node.x = Math.max(0, Math.min(width, node.x));
    node.y = Math.max(0, Math.min(height, node.y));
  });
}
