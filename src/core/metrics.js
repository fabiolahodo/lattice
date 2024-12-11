// src/core/metrics.js

/**
 * Calculates metrics for the concept lattice.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} formalContext - The formal context containing objects and attributes.
 * @returns {Object} - The calculated metrics (number of concepts, objects, attributes).
 */
// Exporting a function to calculate metrics (concepts, objects, attributes).
export function calculateMetrics(graphData) {

     // Check if the graph data is valid (should include nodes and links).
    if (!graphData || !graphData.nodes || !graphData.links) {
      throw new Error('Invalid input: Ensure graphData includes nodes and links.');
    }
  
    // Number of concepts is the number of nodes in the graph
    const totalConcepts = graphData.nodes.length;
  
    // Calculate the total number of unique objects across all nodes.
  // Each node's label contains an "Extent" block that specifies the objects it represents.
  // Extract and count unique objects
  const totalObjects = new Set(
    graphData.nodes.flatMap((node) => {
      // Extract the "Extent" part from the node's label using a regular expression.
      const match = node.label.match(/Extent\s*\{([^}]*)\}/);
      // If a match is found, split the contents of the "Extent" by commas and trim whitespace.
      return match 
      ? match[1]
        .split(',')
        .map((item) => item.trim()) 
        .filter((item) => item !== '') // Exclude empty strings
      : [];
    })
  ).size; // Use a Set to ensure unique objects are counted.

  // Calculate the total number of unique attributes across all nodes.
  // Each node's label contains an "Intent" block that specifies the attributes it represents.
  // Extract and count unique attributes
  const totalAttributes = new Set(
    graphData.nodes.flatMap((node) => {
      // Extract the "Intent" part from the node's label using a regular expression.
      const match = node.label.match(/Intent\s*\{([^}]*)\}/);
      // If a match is found, split the contents of the "Intent" by commas and trim whitespace.
      return match 
      ? match[1]
        .split(',')
        .map((item) => item.trim()) 
        .filter((item) => item !== '') // Exclude empty strings
      : [];
    })
  ).size; // Use a Set to ensure unique attributes are counted.

  // Return an object containing the calculated metrics.
    return {
      totalConcepts,
      totalObjects,
      totalAttributes,
    };
  }
  