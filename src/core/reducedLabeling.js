//src/core/reducedLabeling.js

// Import dependencies
import { computeSuperSubConcepts } from './interactivity.js';

/**
 * Extracts extent and intent from the node label.
 * @param {Object} node - The node object containing the `label`.
 * @returns {Object} - An object containing `extent` and `intent` arrays.
 */
function parseNodeLabel(node) {
    if (!node.label) {
        console.warn(`⚠️ Missing label for node ${node.id}. Defaulting to empty extent/intent.`);
        return { extent: [], intent: [] };
    }

    const extentMatch = node.label.match(/Extent\s*\{([^}]*)\}/);
    const intentMatch = node.label.match(/Intent\s*\{([^}]*)\}/);

    return {
        extent: extentMatch ? extentMatch[1].split(',').map(e => e.trim()).filter(e => e !== '') : [],
        intent: intentMatch ? intentMatch[1].split(',').map(i => i.trim()).filter(i => i !== '') : []
    };
}

/**
 * Formats extent and intent for visualization.
 * Distinguishes between extent and intent with clear visual markers.
 * @param {Array} extent - Array of extent elements (objects).
 * @param {Array} intent - Array of intent elements (attributes).
 * @returns {string} - Formatted label string for visualization.
 */
export function formatLabel(extent, intent) {
    const extentLabel = extent.length > 0 ? extent.join(", ") : ""; // Skip empty
    const intentLabel = intent.length > 0 ? intent.join(", ") : ""; // Skip empty

    if (extentLabel && intentLabel) {
        return `[Extent: ${extentLabel}] [Intent: ${intentLabel}]`;
    } else if (extentLabel) {
        return `[Extent: ${extentLabel}]`;
    } else if (intentLabel) {
        return `[Intent: ${intentLabel}]`;
    }
    return ""; // No label if both are empty
}

/**
 * Computes reduced labels for nodes based on their superconcepts and subconcepts.
 * Ensures intents and extents are only assigned once to their valid concepts.
 * @param {Array} nodes - The array of nodes in the concept lattice.
 * @param {Array} links - The array of links connecting nodes.
 */
export function computeReducedLabels(nodes, links) {
    console.log(`✅ computeReducedLabels received: ${nodes?.length || 0} nodes, ${links?.length || 0} links`);

    if (!Array.isArray(nodes) || !Array.isArray(links)) {
        console.error("❌ computeReducedLabels received invalid data!", { nodes, links });
        return;
    }

    // Initialize tracking sets for global usage
    const assignedExtents = new Set(); // Tracks already assigned extents (objects)
    const assignedIntents = new Set(); // Tracks already assigned intents (attributes)

    // Step 1: Ensure every node has necessary properties
    nodes.forEach(node => {
        if (!node || typeof node !== "object" || !node.id) {
            console.warn(`⚠️ Skipping invalid node:`, node);
            return;
        }

        const { extent, intent } = parseNodeLabel(node);
        node.extent = extent || [];
        node.intent = intent || [];

        node.superconcepts = [];
        node.subconcepts = [];
        node.fullExtent = new Set(node.extent);
        node.fullIntent = new Set(node.intent);
        node.reducedExtent = [];
        node.reducedIntent = [];
    });

    console.log("✅ Nodes after extent/intent processing:", nodes);

    // Step 2: Compute superconcepts & subconcepts
    computeSuperSubConcepts({ nodes, links });

    /* Identify top and bottom concepts
    const topConcept = nodes.find(node => node.superconcepts.length === 0);
    const bottomConcept = nodes.find(node => node.subconcepts.length === 0);

    if (!topConcept || !bottomConcept) {
        console.error("❌ Could not determine top and bottom concepts!");
        return;
    }

    console.log(`✅ Top Concept: ${topConcept.id}`);
    console.log(`✅ Bottom Concept: ${bottomConcept.id}`);
    */
    // Step 3: Compute full intent (top-down propagation) and full extent (bottom-up propagation)
    nodes.forEach(node => {
        // Propagate intent from superconcepts
        node.superconcepts?.forEach(superconcept => {
            superconcept.fullIntent?.forEach(attr => node.fullIntent.add(attr));
        });
       node.fullIntent = [...node.fullIntent]; // Convert Set to Array
 
    // Propagate extent from subconcepts
    const inheritedExtent = new Set();
    node.subconcepts?.forEach(subconcept => {
        subconcept.fullExtent.forEach(obj => {
            if (!node.fullExtent.has(obj)) {
                node.fullExtent.add(obj);
                inheritedExtent.add(obj); // Avoid duplication
            }
        });
    });
        node.fullExtent = [...node.fullExtent]; // Convert Set to Array
    });
    console.log("✅ Nodes after full extent/intent computation:", nodes);

    // Step 3: Compute reduced labels
    nodes.forEach(node => {
       /* if (node === topConcept || node === bottomConcept) {
            // Skip labeling for the top and bottom concepts
            node.reducedExtent = [];
            node.reducedIntent = [];
            return;
        }
        */    
        const inheritedExtent = new Set();
        node.subconcepts?.forEach(sub => sub.fullExtent?.forEach(obj => inheritedExtent.add(obj))); // Now from bottom-up

         /*
        const inheritedIntent = new Set();
        node.superconcepts?.forEach(sup => sup.fullIntent?.forEach(attr => inheritedIntent.add(attr))); // Now from top-down

        // Reduced Extent: Remove inherited objects
        node.reducedExtent = node.fullExtent.filter(obj => !inheritedExtent.has(obj));

        // Reduced Intent: Remove inherited attributes
        node.reducedIntent = node.fullIntent.filter(attr => !inheritedIntent.has(attr));

        console.log(`✅ Node ${node.id} Reduced Labels:`, {
            fullExtent: node.fullExtent,
            fullIntent: node.fullIntent,
            reducedExtent: node.reducedExtent,
            reducedIntent: node.reducedIntent
        });
         */

     // Compute reducedExtent by excluding objects already assigned to other nodes
     node.reducedExtent = node.fullExtent.filter(obj => 
         !assignedExtents.has(obj)&& !inheritedExtent.has(obj));
     // Add the reducedExtent to the global tracker
     node.reducedExtent.forEach(obj =>  assignedExtents.add(obj));

     // Compute reducedIntent by excluding attributes already assigned to other nodes
     node.reducedIntent = node.intent.filter(attr => !assignedIntents.has(attr));
     // Add the reducedIntent to the global tracker
     node.reducedIntent.forEach(attr =>assignedIntents.add(attr));
    
     console.log(`✅ Node ${node.id} Updated Reduced Label:`, {
        reducedExtent: node.reducedExtent,
        reducedIntent: node.reducedIntent
    });
 });


// Final visualization or debug logs for verification
visualizeReducedLabels(nodes);
}

/**
 * Visualizes reduced labels with clear differentiation between extent and intent.
 * @param {Array} nodes - Array of nodes in the lattice.
 */
function visualizeReducedLabels(nodes) {
    nodes.forEach(node => {
        console.log(
            `Node ${node.id}:\n` +
            ` - Reduced Extent: ${node.reducedExtent.join(", ")}\n` +
            ` - Reduced Intent: ${node.reducedIntent.join(", ")}`
        );
    });
}