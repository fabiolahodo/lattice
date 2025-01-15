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
  
     // **Global Metrics**
    const totalConcepts = graphData.nodes.length;// Number of concepts is the number of nodes in the graph
    const totalLinks = graphData.links.length; // Total number of links between concepts
    const maxPossibleLinks = (totalConcepts * (totalConcepts - 1)) / 2; // Maximum possible links in a complete graph
    const density = maxPossibleLinks > 0 ? (totalLinks / maxPossibleLinks).toFixed(4) : 0; // Ratio of actual links to possible links
  
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
  const uniqueAttributes = new Set();
  const uniqueObjects = new Set();

  // Compute concept-specific metrics
    graphData.nodes.forEach((node) => {

      // Extract the "Extent" (objects) from the node's label using a regular expression
      const extentMatch = node.label.match(/Extent\s*\{([^}]*)\}/);
      
      // Extract the "Intent" part from the node's label using a regular expression.
      const intentMatch = node.label.match(/Intent\s*\{([^}]*)\}/);
      
      // Parse the extent and intent into arrays, trimming whitespace and filtering out empty values
      const extent = extentMatch ? extentMatch[1].split(',').map(e => e.trim()).filter(Boolean) : [];
      const intent = intentMatch ? intentMatch[1].split(',').map(a => a.trim()).filter(Boolean) : [];

      // Add each unique object and attribute to the respective sets
      extent.forEach(obj => uniqueObjects.add(obj));
      intent.forEach(attr => uniqueAttributes.add(attr));

      // **Concept-level Metrics**
      // Stability: Proportion of the extent size to the sum of extent and intent sizes
      const stability = (extent.length + intent.length) > 0
          ? (extent.length / (extent.length + intent.length)).toFixed(4)
          : 0;

      // Neighborhood size: Number of direct links (edges) connected to the node
      const neighborhoodSize = graphData.links.filter(link =>
          link.source.id === node.id || link.target.id === node.id
      ).length;

      // Attach the calculated metrics to the node object for later use
      node.metrics = {
          stability, // The stability of the concept
          neighborhoodSize, // Number of connections for this concept
          extentSize: extent.length, // Number of objects in the extent
          intentSize: intent.length, // Number of attributes in the intent
      };
  });

  // Return global metrics for the entire lattice

      /* If a match is found, split the contents of the "Intent" by commas and trim whitespace.
      return match 
      ? match[1]
        .split(',')
        .map((item) => item.trim()) 
        .filter((item) => item !== '') // Exclude empty strings
      : [];
    })
  ).size; // Use a Set to ensure unique attributes are counted.
*/
  // Return an object containing the calculated metrics.
    return {
      totalConcepts,
      totalObjects: uniqueObjects.size,
      totalAttributes: uniqueAttributes.size,
      density, // Density of the lattice (global connectivity)
      averageStability: (
        // Calculate the average stability of all concepts
          graphData.nodes.reduce((sum, node) => sum + parseFloat(node.metrics.stability || 0), 0) /
          totalConcepts
      ).toFixed(4),
    };
  }
  