// src/core/layering.js

// Import necessary dependencies
import { GRAPH_CONFIG } from './config.js';
import { computeSuperSubConcepts } from './interactivity.js';

/**
 * Assigns nodes to hierarchical layers.
 * Use predefined `level` values from the JSON if available.
 * If no levels exist, it computes layers dynamically using the Coffman-Graham algorithm.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @returns {Array} - An array of layers, each containing nodes.
 * @throws {Error} - If the graph data is invalid or malformed.
 */
export function assignLayers(graphData) {
    if (!graphData || !Array.isArray(graphData.nodes)) {
        throw new Error("Invalid graph data: 'nodes' must be an array.");
    }

    console.log("📌 Node Levels Before Layer Assignment:", graphData.nodes.map(n => ({ id: n.id, level: n.level }))); //Check for missing or incorrect layer assignments
    
    // ✅ Ensure Super/Subconcepts are computed first
    computeSuperSubConcepts(graphData);

    const layers = [];
    const width = GRAPH_CONFIG.dimensions.width; // Canvas width (adjustable)
    const height = GRAPH_CONFIG.dimensions.height; // Canvas height (adjustable)
    const padding = GRAPH_CONFIG.dimensions.padding;
    //const layerSpacing = Math.min((height - 2 * padding) / (graphData.nodes.length + 1), 100);

  
    // ✅ Dynamically calculate layer spacing
    const minLayerSpacing = 50;  // Minimum space between layers
    const maxLayerSpacing = 200; // Maximum space between layers
    const totalNodes = graphData.nodes.length;

    // Check if all nodes have a `level` property (predefined layering)
    const usePredefinedLevels = graphData.nodes.every(node => node.hasOwnProperty("level"));

    if (usePredefinedLevels) {
        console.log("✅ Using predefined levels from JSON...");

        // Calculate spacing dynamically based on the highest level in the dataset
        const maxLevel = Math.max(...graphData.nodes.map(n => n.level)) || 1; // Prevent division by zero
        

    // Group nodes by their `level` property. Calculate layer spacing dynamically
    graphData.nodes.forEach((node) => {

        if (node.level === undefined) {
            console.warn(`⚠️ Node ${node.id} is missing level info. Assigning default level 1.`);
            node.level = 1;
        }
        
        const layerIndex = node.level - 1; // Level 1 corresponds to layer 0
        if (!layers[layerIndex]) layers[layerIndex] = [];
        layers[layerIndex].push(node);
      });   
    } else {
        console.log("⚠️ Computing layers dynamically using Coffman-Graham algorithm...");
        
        // Compute layers dynamically using the Coffman-Graham algorithm
        return computeCoffmanGrahamLayers(graphData);
    }
   
    console.log("✅ Assigned layers:", layers.map((layer, index) => ({ layer: index + 1, nodes: layer.map(n => n.id) })));

    // ✅ Determine the maximum number of nodes in a single layer
    const maxNodesInLayer = Math.max(...layers.map(layer => layer.length));
    let cumulativeY = padding; // Track Y-position dynamically

    layers.forEach((layer, i) => {
        const totalNodes = layer.length;

        // ✅ Adjust spacing: Levels with fewer nodes get less space, dense levels get more
        //let spacingFactor = totalNodes / maxNodesInLayer;
        const spacingFactor = Math.max(0.3, Math.min(totalNodes / maxNodesInLayer, 1.0)); // Clamp values
        const layerSpacing = minLayerSpacing + (maxLayerSpacing - minLayerSpacing) * spacingFactor;
        const dynamicLayerWidth = width * (0.5 + 0.5 * spacingFactor);
        const xSpacing = dynamicLayerWidth / Math.max(1, totalNodes + 1);
        
        // ✅ Adjust Layer Width Based on Node Count
        //const minLayerWidth = width * 0.5; // Ensure a minimum width
        //const dynamicLayerWidth = minLayerWidth + (width - minLayerWidth) * spacingFactor;

        // ✅ Compute X-Spacing for Even Distribution
        //const xSpacing = dynamicLayerWidth / Math.max(1, totalNodes + 1);

        layer.forEach((node, index) => {
            node.y = cumulativeY;
            node.x = (width - dynamicLayerWidth) / 2 + (index + 1) * xSpacing;
        });

        cumulativeY += layerSpacing; // Move to next level
    });

//✅ First Align Nodes with Parents Before Ordering
alignNodesWithParents(layers, graphData);

// ✅ Order nodes within layers to minimize crossings
orderVerticesWithinLayers(layers, graphData);

console.debug("✅ Nodes Ordered Within Layers and Aligned to Parents");

return layers;
}

/**
 * Computes hierarchical layers dynamically using the Coffman-Graham algorithm.
 * This method is used if nodes do not have predefined `level` values.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @returns {Array} - The computed layers using the Coffman-Graham algorithm.
 */
function computeCoffmanGrahamLayers(graphData) {
    const layers = [];
    //const width = GRAPH_CONFIG.dimensions.width; // Canvas width
    const height = GRAPH_CONFIG.dimensions.height; // Canvas height
    //const nodeQueue = [...graphData.nodes]; // Copy nodes for processing
    const nodeQueue = [...graphData.nodes].sort((a, b) => b.superconcepts.length - a.superconcepts.length);
    const placedNodes = new Set();

    // Sort nodes by decreasing number of dependencies (Coffman-Graham approach)
    //nodeQueue.sort((a, b) => b.superconcepts.length - a.superconcepts.length);

    nodeQueue.forEach((node) => {
        let layer = 0;

        // Find the first available layer where all dependencies are placed
        while (layer < layers.length) {
            const dependenciesMet = node.superconcepts.every((parent) =>
                layers[layer].some((layerNode) => layerNode.id === parent.id)
            );
            if (dependenciesMet) break;
            layer++;
        }

        // Place the node in the correct layer
        if (!layers[layer]) layers[layer] = [];
        layers[layer].push(node);
        placedNodes.add(node.id);

        node.y = (layer + 1) * (height / (layers.length + 1));

        // Compute spacing
        //const layerSpacing = height / (layers.length + 1);
        //node.y = layer * layerSpacing;
    });

    console.debug(
        "Computed Layers (Coffman-Graham):",
        layers.map((layer, index) => ({
            layer: index + 1,
            nodes: layer.map((node) => node.id),
        }))
    );

    return layers;
}

/**
 * Orders nodes within layers to reduce edge crossings using the barycenter heuristic.
 * @param {Array} layers - The array of layers containing nodes.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @throws {Error} - If the input data is invalid or malformed.
 */
export function orderVerticesWithinLayers(layers, graphData) {
    if (!Array.isArray(layers)) {
        throw new Error("Invalid input: 'layers' must be an array.");
    }
    if (!graphData || !Array.isArray(graphData.nodes)) {
        throw new Error("Invalid graph data: 'nodes' must be an array.");
    }

    //const width = 800; // Canvas width for horizontal positioning

    layers.forEach((layer, layerIndex) => {
        // Compute barycenters for nodes in the current layer
        layer.forEach((node) => {
           // node.barycenter = computeBarycenter(node, graphData);
           node.barycenter = computeBarycenter(node, graphData);
        });

      /*✅ Sort nodes within the layer based on barycenter values
        layer.sort((a, b) => {
            if (a.barycenter === null && b.barycenter === null) return 0;
            if (a.barycenter === null) return 1;
            if (b.barycenter === null) return -1;
            return a.barycenter - b.barycenter;
        });
    */

        layer.sort((a, b) => (a.barycenter ?? Infinity) - (b.barycenter ?? Infinity));
       
        // ✅ Recompute x-coordinates after sorting
        const layerWidth = GRAPH_CONFIG.dimensions.width - 2 * GRAPH_CONFIG.dimensions.padding;
        const xSpacing = layerWidth / (layer.length + 1);

        layer.forEach((node, index) => {
            node.x = GRAPH_CONFIG.dimensions.padding + (index + 1) * xSpacing;
        });
    });

    console.debug("✅ Nodes Ordered Within Layers");
}
    
/**
 * Computes the barycenter for a node based on its neighbors' positions.
 * Helps in minimizing edge crossings during node ordering.
 * @param {Object} node - The node for which to compute the barycenter.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @returns {number} - The computed barycenter value, or 0 if no neighbors.
 */
export function computeBarycenter(node, graphData) {

    // ✅ If a node has no parents, keep its current x-position
    if (!node.superconcepts || node.superconcepts.length === 0) {
        return node.x;
    }

    // ✅ Compute the average x-position of all parent nodes
    const avgX = node.superconcepts.reduce((sum, parent) => sum + parent.x, 0) / node.superconcepts.length;

    return avgX;
}

/**
 * Adjusts vertical spacing between layers dynamically.
 * @param {Array} layers - The array of layers containing nodes.
 * @param {Object} graphDimensions - The graph width, height, and padding.
 */

export function adjustLayerSpacing(layers, { height, padding }) {
    const numLayers = layers.length;
    if (numLayers === 0) return;

    // Adjust spacing based on max label length to avoid overlap
    const maxLabelHeight = 30; // Adjust based on font size
    const minSpacing = 80; // Minimum gap between layers
    const dynamicSpacing = Math.max(minSpacing, maxLabelHeight * 2);

    layers.forEach((layer, layerIndex) => {
        layer.forEach(node => {
            node.y = padding + layerIndex * dynamicSpacing;
        });
    });

    console.log(`✅ Adjusted layer spacing dynamically: ${dynamicSpacing}px`);
}


/*
export function adjustLayerSpacing(layers, graphDimensions) {
    const { height, padding } = graphDimensions;
    const totalLayers = layers.length;

    if (totalLayers === 0) return;

    let availableHeight = height - 2 * padding;
    let dynamicSpacing = [];

    // 🔹 Give more spacing to layers with more nodes
    const maxNodesInLevel = Math.max(...layers.map(l => l.length));
    layers.forEach(layer => {
        let levelFactor = Math.max(0.5, layer.length / maxNodesInLevel); 
        dynamicSpacing.push(levelFactor);
    });

    let totalFactor = dynamicSpacing.reduce((sum, f) => sum + f, 0);
    let adjustedSpacing = availableHeight / totalFactor;

    let yPosition = padding;
    layers.forEach((layer, index) => {
        let spacing = dynamicSpacing[index] * adjustedSpacing;
        layer.forEach(node => {
            node.y = yPosition;
        });
        yPosition += spacing;
    });

    console.log("✅ Adjusted layer spacing dynamically.");
}
*/
/**
 * Adjusts X positions of nodes dynamically to reduce crossings.
 * Ensures left-side alignment is improved.
 * @param {Array} layers - The array of layers containing nodes.
 * @param {number} width - The graph width.
 * @param {number} padding - Graph padding.
 */

export function adjustNodePositions(layers, width, padding) {
    layers.forEach(layer => {
        let xSpacing = (width - 2 * padding) / (layer.length + 1);

        layer.forEach((node, index) => {
            node.x = padding + (index + 1) * xSpacing;

            if (node.superconcepts.length === 1) {
                node.x = node.superconcepts[0].x;
            } else if (node.superconcepts.length > 1) {
                let avgParentX = node.superconcepts.reduce((sum, parent) => sum + parent.x, 0) / node.superconcepts.length;
                node.x = avgParentX;
            }
        });
    });

    console.log("✅ Node positions adjusted to prevent unnecessary crossings.");
}

/**
 * Aligns nodes with parents to reduce crossings.
 * @param {Array} layers - The array of layers.
 * @param {Object} graphData - The graph data.
 */
function alignNodesWithParents(layers, graphData) {
    const parentMap = new Map();

    graphData.links.forEach(link => {
        if (!parentMap.has(link.target.id)) parentMap.set(link.target.id, []);
        parentMap.get(link.target.id).push(link.source);
    });

    /*
    layers.forEach((layer, layerIndex) => {
        if (layerIndex === 0) return; // Skip the first layer (top concepts)

        layer.forEach((node) => {
            const parents = graphData.links
                .filter(link => link.target.id === node.id)
                .map(link => link.source);

            if (parents.length === 1) {
                node.x = parents[0].x; // Directly align with single parent
            } else if (parents.length > 1) {
                node.x = parents.reduce((sum, parent) => sum + parent.x, 0) / parents.length; // Average position
            }
        });
    });
    */

    layers.forEach((layer, i) => {
        if (i === 0) return;

        layer.forEach(node => {
            const parents = parentMap.get(node.id) || [];
            if (parents.length === 1) {
                node.x = parents[0].x;
            } else if (parents.length > 1) {
                node.x = parents.reduce((sum, parent) => sum + parent.x, 0) / parents.length;
            }
        });
    });

    console.log("✅ Nodes Aligned with Parents");
}
