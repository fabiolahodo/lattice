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
 * Computes reduced labels for nodes based on their superconcepts and subconcepts.
 * @param {Array} nodes - The array of nodes in the concept lattice.
 * @param {Array} links - The array of links connecting nodes.
 */
export function computeReducedLabels(nodes, links) {
    console.log(`✅ computeReducedLabels received: ${nodes?.length || 0} nodes, ${links?.length || 0} links`);

    if (!Array.isArray(nodes) || !Array.isArray(links)) {
        console.error("❌ computeReducedLabels received invalid data!", { nodes, links });
        return;
    }

    // Step 1: Ensure every node has necessary properties
    nodes.forEach(node => {
        if (!node || typeof node !== "object" || !node.id) {
            console.warn(`⚠️ Skipping invalid node:`, node);
            return;
        }

        const { extent, intent } = parseNodeLabel(node);
        node.extent = extent;
        node.intent = intent;

        node.superconcepts = [];
        node.subconcepts = [];
        node.fullExtent = new Set(node.extent);
        node.fullIntent = new Set(node.intent);
    });

    console.log("✅ Nodes after extent/intent processing:", nodes);

    // Step 2: Compute superconcepts & subconcepts
    computeSuperSubConcepts({ nodes, links });

    // Identify top and bottom concepts
    const topConcept = nodes.find(node => node.superconcepts.length === 0);
    const bottomConcept = nodes.find(node => node.subconcepts.length === 0);

    if (!topConcept || !bottomConcept) {
        console.error("❌ Could not determine top and bottom concepts!");
        return;
    }

    console.log(`✅ Top Concept: ${topConcept.id}`);
    console.log(`✅ Bottom Concept: ${bottomConcept.id}`);

    // Step 3: Compute full intent (top-down propagation)
    nodes.forEach(node => {
        node.superconcepts?.forEach(sup => {
            sup.fullIntent?.forEach(attr => node.fullIntent.add(attr));
        });
        node.fullIntent = [...node.fullIntent]; // Convert Set to Array
    });

    // Step 4: Compute full extent (bottom-up propagation)
    nodes.forEach(node => {
        node.subconcepts?.forEach(sub => {
            sub.fullExtent?.forEach(obj => node.fullExtent.add(obj));
        });
        node.fullExtent = [...node.fullExtent]; // Convert Set to Array
    });

    console.log("✅ Nodes after full extent/intent computation:", nodes);

    // Step 5: Compute reduced labels
    nodes.forEach(node => {
        if (node === topConcept || node === bottomConcept) {
            // Skip labeling for the top and bottom concepts
            node.reducedExtent = [];
            node.reducedIntent = [];
            return;
        }

        const inheritedExtent = new Set();
        node.subconcepts?.forEach(sub => sub.fullExtent?.forEach(obj => inheritedExtent.add(obj))); // Now from bottom-up

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
    });
}
