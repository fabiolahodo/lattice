// src/core/layering.js

/**
 * Assigns nodes to hierarchical layers using the provided `level` property.
 * Ensures all dependencies are satisfied while placing nodes in appropriate layers.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @returns {Array} - An array of layers, each containing nodes.
 * @throws {Error} - If the graph data is invalid or malformed.
 */
export function assignLayers(graphData) {
    if (!graphData || !Array.isArray(graphData.nodes)) {
        throw new Error("Invalid graph data: 'nodes' must be an array.");
    }

    const layers = [];
    const width = 800; // Canvas width (adjustable)
    const height = 600; // Canvas height (adjustable)
    const layerSpacing = height / 10; // Vertical spacing between layers

    // Group nodes by their `level` property
    graphData.nodes.forEach((node) => {
        const layer = node.level - 1; // Level 1 corresponds to layer 0
        if (!layers[layer]) layers[layer] = [];
        layers[layer].push(node);

        // Assign initial x and y positions for the node
        node.y = layer * layerSpacing; // Vertical spacing based on layer index
        node.x = layers[layer].length * (width / (layers[layer].length + 1)); // Horizontal spacing within the layer
    });

    console.debug(
        "Layers Assigned:",
        layers.map((layer, index) => ({
            layer: index + 1,
            nodes: layer.map((node) => node.id),
        }))
    ); // Debug log for layer assignment
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

    layers.forEach((layer) => {
        layer.sort((a, b) =>
            computeBarycenter(a, graphData) - computeBarycenter(b, graphData)
        );
    });

    console.debug("Vertices Ordered Within Layers");
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
    const neighborPositions = neighbors.map((neighbor) => {
        const neighborNode = graphData.nodes.find((n) => n.id === neighbor.id);
        return neighborNode ? neighborNode.x : 0; // Default to 0 if neighbor not found
    });

    if (neighborPositions.length === 0) return 0; // No neighbors, return 0
    return neighborPositions.reduce((sum, x) => sum + x, 0) / neighborPositions.length;
}
