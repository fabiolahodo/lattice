// src/core/layering.js

// Import necessary dependencies
import { GRAPH_CONFIG } from './config.js';

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

    const layers = [];
    const width = GRAPH_CONFIG.dimensions.width; // Canvas width (adjustable)
    const height = GRAPH_CONFIG.dimensions.height; // Canvas height (adjustable)
    const padding = GRAPH_CONFIG.dimensions.padding;
    //const layerSpacing = height / 10; // Vertical spacing between layers

    // Check if all nodes have a `level` property (predefined layering)
    const usePredefinedLevels = graphData.nodes.every(node => node.hasOwnProperty("level"));

    if (usePredefinedLevels) {
        console.log("✅ Using predefined levels from JSON...");

        // Calculate spacing dynamically based on the highest level in the dataset
        const maxLevel = Math.max(...graphData.nodes.map(n => n.level));
        const layerSpacing = (height - 2 * padding) / (maxLevel + 1);

    // Group nodes by their `level` property
    graphData.nodes.forEach((node) => {
        const layerIndex = node.level - 1; // Level 1 corresponds to layer 0
        if (!layers[layerIndex]) layers[layerIndex] = [];
        layers[layerIndex].push(node);

        // Assign initial y position for the node
        node.y = padding + layerIndex * layerSpacing; // Vertical spacing based on layer index
    });
   
} else {
    console.log("⚠️ No predefined levels detected. Computing layers using Coffman-Graham algorithm...");

    // Compute layers dynamically using the Coffman-Graham algorithm
    return computeCoffmanGrahamLayers(graphData);
}

// Evenly distribute nodes within each layer (improves horizontal alignment)
layers.forEach((layer) => {
    const xSpacing = (width - 2 * padding) / (layer.length + 1);
    layer.forEach((node, index) => {
        node.x = padding + (index + 1) * xSpacing; // Distribute evenly with padding
    });
});

    console.debug(
        "Layers Assigned:",
        layers.map((layer, index) => ({
            layer: index + 1, // Converts zero-based index to 1-based layer number for readability
            nodes: layer.map((node) => node.id),
        }))
    );

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
    const width = GRAPH_CONFIG.dimensions.width; // Canvas width
    const height = GRAPH_CONFIG.dimensions.height; // Canvas height
    const nodeQueue = [...graphData.nodes]; // Copy nodes for processing
    const placedNodes = new Set();

    // Sort nodes by decreasing number of dependencies (Coffman-Graham approach)
    nodeQueue.sort((a, b) => b.superconcepts.length - a.superconcepts.length);

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

        // Compute spacing
        const layerSpacing = height / (layers.length + 1);
        node.y = layer * layerSpacing;
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

    layers.forEach((layer) => {
        // Compute barycenters for nodes in the current layer
        layer.forEach((node) => {
            node.barycenter = computeBarycenter(node, graphData);
        });

        // Sort nodes within the layer by their barycenter
        layer.sort((a, b) => a.barycenter - b.barycenter);

        // ✅ Recompute **x-coordinates** after sorting for **better alignment**
        const layerWidth = GRAPH_CONFIG.dimensions.width - 2 * GRAPH_CONFIG.dimensions.padding;
        const xSpacing = layerWidth / (layer.length + 1);

        // Reassign x positions for evenly spaced nodes after sorting
        layer.forEach((node, index) => {
            node.x = GRAPH_CONFIG.dimensions.padding + (index + 1) * xSpacing; // Horizontal spacing
        });
    });

    console.debug("Nodes Ordered Within Layers");
}

/**
 * Computes the barycenter for a node based on its neighbors' positions.
 * Helps in minimizing edge crossings during node ordering.
 * @param {Object} node - The node for which to compute the barycenter.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @returns {number} - The computed barycenter value, or 0 if no neighbors.
 */
function computeBarycenter(node, graphData) {
    const neighbors = [...node.superconcepts, ...node.subconcepts];

    // Map neighbors to their x positions
    const neighborPositions = neighbors
        .map((neighbor) => {
            const neighborNode = graphData.nodes.find((n) => n.id === neighbor.id);
            return neighborNode ? neighborNode.x : undefined; // Undefined if not found
        })
        .filter((x) => x !== undefined); // Filter out undefined values

    // Return 0 if no valid neighbors
    if (neighborPositions.length === 0) return 0;

    // Compute and return average x position (barycenter)
    return neighborPositions.reduce((sum, x) => sum + x, 0) / neighborPositions.length;
}
