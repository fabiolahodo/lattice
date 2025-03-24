// src/core/reducedLabeling.js 

// Import dependencies
import { computeSuperSubConcepts } from './interactivity.js';

/**
 * Extracts extent and intent from the node label.
 * @param {Object} node - The node object containing the `label`.
 * @returns {Object} - An object containing `extent` and `intent` arrays.
 */
export function parseNodeLabel(node) {
    if (!node.label) {
        console.warn(`⚠️ Missing label for node ${node.id}. Defaulting to empty extent/intent.`);
        return { extent: [], intent: [] };
    }

    // Extract Full Extent
    const extentMatch = node.label.match(/Extent\s*\{([^}]*)\}/);
    const extent = extentMatch
        ? extentMatch[1].split(',').map(e => e.trim()).filter(e => e !== '')
        : [];

    // Extract Full Intent
    const intentMatch = node.label.match(/Intent\s*\{([^}]*)\}/);
    const intent = intentMatch
        ? intentMatch[1].split(',').map(i => i.trim()).filter(i => i !== '')
        : [];

    return { extent, intent };
}

/**
 * Formats extent and intent for visualization.
 * @param {Array} extent - Array of extent elements (objects).
 * @param {Array} intent - Array of intent elements (attributes).
 * @returns {string} - Formatted label string for visualization.
 */
export function formatLabel(extent, intent) {
    const extentLabel = extent.length > 0 ? `<b>${extent.join(", ")}</b>` : "";
    const intentLabel = intent.length > 0 ? `<i>${intent.join(", ")}</i>` : "";

    if (extentLabel && intentLabel) {
        return `<div style='text-align:center;'>${extentLabel}<br/>${intentLabel}</div>`;
    } else if (extentLabel) {
        return `<div style='text-align:center;'>${extentLabel}</div>`;
    } else if (intentLabel) {
        return `<div style='text-align:center;'>${intentLabel}</div>`;
    }
    return "";
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

    // Identify the top concept (⊤) -> has no superconcepts
    const topConcept = nodes.find(node => node.superconcepts.length === 0);
    if (!topConcept) {
        console.error("❌ No top concept found! Check your graph data.");
    } else {
        console.log("✅ Top Concept Identified:", topConcept.id);
    }

    // Identify the bottom concept (⊥) -> has no subconcepts
    const bottomConcept = nodes.find(node => node.subconcepts.length === 0);
    if (!bottomConcept) {
        console.error("❌ No bottom concept found! Check your graph data.");
    } else {
        console.log("✅ Bottom Concept Identified:", bottomConcept.id);
    }


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

    // Step 3: Compute full intent (top-down propagation) and full extent (bottom-up propagation)
    nodes.forEach(node => {
        // Initialize intent and extent properties
        node.fullIntent = new Set(node.intent || []);
        node.fullExtent = new Set(node.extent || []);

        // Propagate intent from superconcepts
         // Ensure intent propagation starts from the correct top concept
        if (node !== topConcept) {
        node.superconcepts?.forEach(superconcept => {
            if (superconcept.fullIntent) {
                superconcept.fullIntent.forEach(attr => node.fullIntent.add(attr));
            }
        });
    }
        // Ensure extent propagation starts from the correct bottom concept
        if (node !== bottomConcept) {
        node.subconcepts?.forEach(subconcept => {
            if (subconcept.fullExtent) {
                subconcept.fullExtent.forEach(obj => node.fullExtent.add(obj));
            }
        });
    }
        // Convert sets to arrays before storing
        node.fullIntent = [...node.fullIntent];
        node.fullExtent = [...node.fullExtent];
    });

    console.log("✅ Nodes after full extent/intent computation:", nodes);

    // Step 4: Compute reduced labels
   /* nodes.forEach(node => {
        // Compute reducedExtent by excluding objects inherited from subconcepts
        node.reducedExtent = node.fullExtent.filter(obj => 
            !node.subconcepts.some(sub => sub.fullExtent.includes(obj))
        );

        // Compute reducedIntent by excluding attributes inherited from superconcepts
        node.reducedIntent = node.fullIntent.filter(attr => 
            !node.superconcepts.some(sup => sup.fullIntent.includes(attr))
        );

        console.log(`✅ Node ${node.id} Updated Reduced Label:`, {
            reducedExtent: node.reducedExtent,
            reducedIntent: node.reducedIntent
        });
    });
    */ 
   
 // Step 4: Compute reduced labels
    nodes.forEach(node => {
        if (!node) {
            console.warn("⚠️ Skipping undefined node in computeReducedLabels.");
            return;
        }

    // Compute reducedExtent by excluding inherited objects
node.reducedExtent = node.fullExtent.filter(obj => {
    return !node.subconcepts.some(sub => 
        sub.fullExtent.includes(obj) || sub.reducedExtent.includes(obj)
    );
});

// Compute reducedIntent by excluding inherited attributes
node.reducedIntent = node.fullIntent.filter(attr => {
    return !node.superconcepts.some(sup => 
        sup.fullIntent.includes(attr) || sup.reducedIntent.includes(attr)
    );
});

console.log(`✅ Node ${node.id}:`, {
    reducedExtent: node.reducedExtent,
    reducedIntent: node.reducedIntent
});
});
    console.log("�� Final Reduced Labels Computed:", nodes);    

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
