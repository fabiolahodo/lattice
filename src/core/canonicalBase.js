// src/core/canonicalBase.js

/**
 * Extracts concepts (extent and intent) from graph data.
 * @param {Object} graphData - The graph data containing nodes.
 * @returns {Array} - An array of concepts with "extent" and "intent".
 */
export function extractConceptsFromGraph(graphData) {
    return graphData.nodes.map(node => {
       // Extract the Extent set from the node label using regex
      const extentMatch = node.label.match(/Extent\s*{([^}]*)}/);
      // Extract the Intent set from the node label using regex
      const intentMatch = node.label.match(/Intent\s*{([^}]*)}/);
      
      // Parse the Extent values if found; otherwise, return an empty array
      const extent = extentMatch 
        ? extentMatch[1]
            .split(',') // Split by comma
            .map(item => item.trim()) // Remove unnecessary spaces
        : [];

      // Parse the Intent values if found; otherwise, return an empty array
      const intent = intentMatch 
        ? intentMatch[1]
            .split(',')
            .map(item => item.trim()) 
        : [];
  
     // Return the concept as an object containing its Extent and Intent  
     return { extent, intent };
    });
  }

/**
 * Computes the canonical base (Duquenne–Guigues Base) for a given concept lattice.
 * @param {Array} concepts - The list of concepts, where each concept is an object with "extent" and "intent".
 * @returns {Array} - The canonical base as an array of implications (each implication has "premise" and "conclusion").
 */
export function computeCanonicalBase(concepts) {
    const canonicalBase = [];
  
    /**
     * Helper function to compute the closure of a given set of attributes (intent).
     * The closure consists of all attributes that are implied by the given set.
     * @param {Array} attributes - The attribute set to compute the closure for.
     * @returns {Array} - The closure of the given attributes.
     */
    const computeClosure = (attributes) => {
      return concepts
      // Filter concepts that contain all attributes in the input set
        .filter(concept => attributes.every(attr => concept.intent.includes(attr)))
        .reduce((closure, concept) => {
          // Add new attributes from the matched concepts
          concept.intent.forEach(attr => {
            if (!closure.includes(attr)) {
              closure.push(attr);
            }
          });
          return closure;
        }, []); // Start with an empty closure set
    };
  
    // Iterate over each concept in the lattice to generate implications
    concepts.forEach(concept => {
      const premise = [...concept.intent]; // The premise starts as the concept's intent
      const closure = computeClosure(premise); // Compute the closure of the premise
      const conclusion = closure.filter(attr => !premise.includes(attr)); // Attributes in closure but not in premise
  
      // If the closure introduces new attributes, add the implication
      if (conclusion.length > 0) {
        canonicalBase.push({ premise, conclusion });
      }
    });
  
    // Minimize the canonical base by removing redundant implications
    const minimizedBase = minimizeImplications(canonicalBase);
  
    return minimizedBase;
  }
  
  /**
   * Minimizes a set of implications to ensure the canonical base is minimal.
   * @param {Array} implications - The list of implications (each with "premise" and "conclusion").
   * @returns {Array} - The minimized set of implications.
   */
  function minimizeImplications(implications) {
    const minimized = [];
  
    implications.forEach(implication => {
      const { premise, conclusion } = implication;
  
      // Check if the premise can be reduced while preserving the implication
      const reducedPremise = premise.filter(attr => {
        // Create a test premise by removing one attribute
        const testPremise = premise.filter(a => a !== attr);
        // Compute the closure of the test premise with the existing minimized implications
        const closure = computeClosureForImplications(testPremise, minimized);
        // If removing the attribute removes the conclusion, it is necessary
        return !conclusion.every(attr => closure.includes(attr));
      });
  
      // Add the minimized implication to the base
      minimized.push({ premise: reducedPremise, conclusion });
    });
  
    return minimized;
  }
  
  /**
   * Computes the closure of a set of attributes using a given set of implications.
   * @param {Array} attributes - The set of attributes to compute the closure for.
   * @param {Array} implications - The set of implications to use.
   * @returns {Array} - The closure of the given attributes.
   */
  function computeClosureForImplications(attributes, implications) {
    let closure = [...attributes]; // Initialize closure with the given attributes
    let changed; // Track whether the closure has changed
  
    do {
      changed = false;
  
      implications.forEach(({ premise, conclusion }) => {
        // Check if the premise is fully contained in the current closure
        if (premise.every(attr => closure.includes(attr)) &&
            conclusion.some(attr => !closure.includes(attr))) {
          // Add new attributes to the closure
          closure.push(...conclusion.filter(attr => !closure.includes(attr)));
          changed = true; // Mark that a change occurred
        }
      });
    } while (changed); // Repeat until no further changes occur
  
    return closure;
  }
  