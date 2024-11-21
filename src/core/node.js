export function applyNodeConstraints(graphData, width, height) {
    /* Find the y-coordinates of the Top and Bottom Concept nodes
    const topY = Math.min(...graphData.nodes.map(node => node.y || 0)); // Top Concept
    const bottomY = Math.max(...graphData.nodes.map(node => node.y || 0)); // Bottom Concept
   */
    // Helper function to find linked nodes
  function getLinkedNodes(nodeId) {
    return graphData.links
      .filter(link => link.source.id === nodeId || link.target.id === nodeId)
      .map(link => (link.source.id === nodeId ? link.target : link.source));
  }

    // Apply constraints to nodes
    graphData.nodes.forEach(node => {
     /* if (node.id !== 'Top Concept' && node.id !== 'Bottom Concept') {
        // Constrain inner nodes between Top and Bottom Concepts
        node.y = Math.max(topY + 50, Math.min(bottomY - 50, node.y)); // Add padding of 50px
      }
      */
      if (node.id === 'Top Concept') {
        // Get the highest neighbor (smallest y value)
        const linkedNodes = getLinkedNodes(node.id);
        const minY = Math.min(...linkedNodes.map(neighbor => neighbor.y || 0));
        node.y = Math.min(node.y, minY - 50); // Keep 50px gap above the nearest neighbor
      } else if (node.id === 'Bottom Concept') {
        // Get the lowest neighbor (largest y value)
        const linkedNodes = getLinkedNodes(node.id);
        const maxY = Math.max(...linkedNodes.map(neighbor => neighbor.y || 0));
        node.y = Math.max(node.y, maxY + 50); // Keep 50px gap below the nearest neighbor
      } else {
        // Constrain inner nodes between Top and Bottom Concepts
        const topY = Math.min(...graphData.nodes.map(n => n.id === 'Top Concept' ? n.y : Infinity));
        const bottomY = Math.max(...graphData.nodes.map(n => n.id === 'Bottom Concept' ? n.y : -Infinity));
        node.y = Math.max(topY + 50, Math.min(bottomY - 50, node.y)); // Add padding of 50px
      }
  

      // Ensure all nodes stay within the SVG bounds
      node.x = Math.max(0, Math.min(width, node.x));
      node.y = Math.max(0, Math.min(height, node.y));
    });
  }
  

  export function applyNodeConstraints(graphData, width, height) {
    const padding = 30; // Define padding to maintain a gap between nodes
    
    // Helper function to find linked nodes
    function getLinkedNodes(nodeId) {
      return graphData.links
        .filter(link => link.source.id === nodeId || link.target.id === nodeId)
        .map(link => (link.source.id === nodeId ? link.target : link.source));
    }
  
    
    // Apply constraints to nodes
    graphData.nodes.forEach(node => {
      if (node.id === 'Top Concept') {
        // Constrain the 'Top Concept' to be at the top of the graph (fixed level)
        node.y = Math.min(node.y, 50); // Keep it fixed at the top, for example, 50px away from the top
      } else if (node.id === 'Bottom Concept') {
        // Constrain the 'Bottom Concept' to be at the bottom of the graph (fixed level)
        node.y = Math.max(node.y, height - 50); // Keep it fixed at the bottom, for example, 50px away from the bottom
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
  
        // Calculate the bounds based on neighbors
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
  