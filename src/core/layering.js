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
    // Check if graph data is valid and has a nodes array
    if (!graphData || !Array.isArray(graphData.nodes)) {
        throw new Error("Invalid graph data: 'nodes' must be an array.");
    }

    // Log the level info of all nodes before processing
     console.log("📌 Node Levels Before Layer Assignment:", graphData.nodes.map(n => ({ id: n.id, level: n.level }))); //Check for missing or incorrect layer assignments
    
    // ✅ Ensure  relationships between concepts (Super/Subconcepts) are computed first
    computeSuperSubConcepts(graphData);

    const layers = [];
    const { width, height, padding } = GRAPH_CONFIG.dimensions;// Canvas adjustable
    
    // ✅ Dynamically calculate layer spacing
    const minLayerSpacing = 50; // Minimum space between layers
    const maxLayerSpacing = 200; // Maximum space between layers

    // Check if all nodes have a `level` property (predefined layering)
    const usePredefinedLevels = graphData.nodes.every(node => node.hasOwnProperty("level"));

    if (usePredefinedLevels) {
        // Group nodes by their `level` property. Calculate layer spacing dynamically
        graphData.nodes.forEach((node) => {
            if (node.level === undefined) node.level = 1; // Level 1 corresponds to layer 0
            const layerIndex = node.level - 1;
            if (!layers[layerIndex]) layers[layerIndex] = [];
            layers[layerIndex].push(node);
        });
    } else {
        // If no predefined levels, use Coffman-Graham to compute layers
        console.log("⚠️ Computing layers dynamically using Coffman-Graham algorithm...");

        return computeCoffmanGrahamLayers(graphData);
    }

    // === Post-processing steps ===

        // Assign vertical positions to nodes within each layer
        adjustLayerSpacing(layers, { height, padding });

        // Sort nodes horizontally within each layer to reduce edge crossings
        orderVerticesWithinLayers(layers, graphData);

        // Fine-tune horizontal positions to align with parent nodes
        adjustNodePositions(layers, width, padding);

        // Improve alignment for nodes that are in between chains of concepts
        straightenMidpoints(layers);

        // Avoid visual overlap between nodes and unrelated edges
        disambiguateEdgeProximity(layers, graphData);

        // Return the processed layered structure

    return layers;
}

/**
 * Computes layers using the Coffman-Graham algorithm for topological sorting.
 * @param {Object} graphData - Input graph with node hierarchy
 * @returns {Array} layers - Computed layering
 */
function computeCoffmanGrahamLayers(graphData) {
    const layers = [];
    const height = GRAPH_CONFIG.dimensions.height; // Canvas height
    
    // Sort nodes by number of parents in descending order
    const nodeQueue = [...graphData.nodes].sort((a, b) => b.superconcepts.length - a.superconcepts.length);

    nodeQueue.forEach((node) => {
        let layer = 0;

        // Find the lowest layer where all parent nodes have already been placed
        while (layer < layers.length) {
            const dependenciesMet = node.superconcepts.every((parent) =>
                layers[layer].some((layerNode) => layerNode.id === parent.id)
            );
            if (dependenciesMet) break;
            layer++;
        }

        // Initialize new layer if needed and assign the node
        if (!layers[layer]) layers[layer] = [];
        layers[layer].push(node);

        // Estimate Y-position of the node within the layout
        node.y = (layer + 1) * (height / (layers.length + 1));
    });

    return layers;
}

/**
 * Orders nodes in each layer by computing barycenters to reduce crossings.
 * Alternates between downward and upward passes.
 * @param {Array} layers - Grouped node layers
 * @param {Object} graphData - Graph structure including links
 */
export function orderVerticesWithinLayers(layers, graphData) {
    const numPasses = 4;
    for (let pass = 0; pass < numPasses; pass++) {
        // Alternate direction each pass
        const downward = pass % 2 === 0;
        const indices = downward
            ? [...Array(layers.length).keys()] // top-down pass
            : [...Array(layers.length).keys()].reverse(); // bottom-up pass

        indices.forEach(layerIndex => {
            const layer = layers[layerIndex];

            // Compute barycenter for each node based on neighbors
            layer.forEach((node) => {
                node.barycenter = computeBarycenterFromNeighbors(node, graphData, downward);
            });

            // Sort nodes by barycenter or fallback to x
            layer.sort((a, b) => {
                const aVal = a.barycenter !== undefined ? a.barycenter : a.x;
                const bVal = b.barycenter !== undefined ? b.barycenter : b.x;
                return aVal - bVal;
            });

            // Reassign horizontal positions evenly
            const layerWidth = GRAPH_CONFIG.dimensions.width - 2 * GRAPH_CONFIG.dimensions.padding;
            const xSpacing = layerWidth / (layer.length + 1);

            layer.forEach((node, index) => {
                node.x = GRAPH_CONFIG.dimensions.padding + (index + 1) * xSpacing;
            });
        });
    }
}

/**
 * Computes the average x-position of neighboring nodes for alignment.
 * Used in ordering nodes within a layer.
 * @param {Object} node - Current node
 * @param {Object} graphData - Full graph structure
 * @param {boolean} downward - Direction of neighbor lookup
 * @returns {number} barycenter - Mean x-value of neighbors
 */
function computeBarycenterFromNeighbors(node, graphData, downward) {
    const links = graphData.links;

    // Select either parent or child nodes depending on pass direction
    const neighbors = links
        .filter(link => downward ? link.target.id === node.id : link.source.id === node.id)
        .map(link => downward ? link.source : link.target);

     // Return average x if neighbors exist, else use current position
    if (neighbors.length === 0) return node.x;
    return neighbors.reduce((sum, n) => sum + n.x, 0) / neighbors.length;
}

/**
 * Adjusts vertical spacing between layers using a fixed or dynamic approach.
 * @param {Array} layers - Array of layer groups
 * @param {Object} dimensions - Graph height and padding
 */
export function adjustLayerSpacing(layers, { height, padding }) {
    const numLayers = layers.length;
    if (numLayers === 0) return;

    // Set a reasonable vertical gap based on label height
    const maxLabelHeight = 30;
    const minSpacing = 80;
    const dynamicSpacing = Math.max(minSpacing, maxLabelHeight * 2);

    // Apply vertical position to each node in each layer
    layers.forEach((layer, layerIndex) => {
        layer.forEach(node => {
            node.y = padding + layerIndex * dynamicSpacing;
        });
    });

    console.log(`✅ Adjusted layer spacing dynamically: ${dynamicSpacing}px`);
}

/**
 * Distributes X positions of nodes within each layer.
 * Anchors positions based on average parent x-coordinates.
 * Prevents horizontal overlap.
 * @param {Array} layers - Grouped layer nodes
 * @param {number} width - Canvas width
 * @param {number} padding - Padding to preserve margins
 */
export function adjustNodePositions(layers, width, padding) {
    const maxShiftRatio = 0.3; // Limit how far nodes can shift from parent anchor
    const minSpacing = 40; // Minimum spacing between sibling nodes

    layers.forEach(layer => {
        //const xSpacing = (width - 2 * padding) / (layer.length + 1);

        const layerSize = layer.length;
        if (layerSize === 0) return;

        // Compute the average x position of all parents in this layer
        const allParents = layer.flatMap(node => node.superconcepts || []);
        const parentAnchorX = allParents.length > 0
            ? allParents.reduce((sum, p) => sum + p.x, 0) / allParents.length
            : width / 2;

        // Determine spacing and available width centered around parent cluster
        const layerWidth = Math.max(minSpacing * (layerSize + 1), 150);
        const xSpacing = layerWidth / (layerSize + 1);
        const startX = parentAnchorX - layerWidth / 2;

        // Assign x-position to each node based on soft alignment
        layer.forEach((node, index) => {
            const defaultX = startX + (index + 1) * xSpacing;

            if (!node.superconcepts || node.superconcepts.length === 0) {
                node.x = defaultX;
                return;
            }

            // Compute average x of parents
            const avgParentX = node.superconcepts.reduce((sum, parent) => sum + parent.x, 0) / node.superconcepts.length;
            const shift = defaultX - avgParentX;
            const maxShift = xSpacing * maxShiftRatio;
            const clampedShift = Math.max(-maxShift, Math.min(shift, maxShift));

            node.x = avgParentX + clampedShift;
        });
    });

    console.log("✅ Node positions adjusted with soft vertical alignment constraint.");
}

/**
 * Straightens nodes that fall between aligned parent and child chains.
 * Only adjusts if deviation is small to preserve layout stability.
 * @param {Array} layers - All layered nodes
 */
export function straightenMidpoints(layers) {
    const alignmentThreshold = 15; // Max horizontal spread allowed among parents/children to be considered aligned
    const correctionThreshold = 60; // Max distance a node can deviate from the average before adjustment is skipped

    for (let i = 1; i < layers.length - 1; i++) {
        const layer = layers[i];

        layer.forEach(node => {
            const parents = node.superconcepts || []; // Collect parent nodes (previous layer)
            const children = node.subconcepts || []; // Collect child nodes (next layer)

            // Extract x positions for all parents and children
            const allParentX = parents.map(p => p.x);
            const allChildX = children.map(c => c.x);

            // Compute horizontal spread of parents and children
            const parentSpread = Math.max(...allParentX) - Math.min(...allParentX);
            const childSpread = Math.max(...allChildX) - Math.min(...allChildX);

            // Check if both parents and children are roughly aligned horizontally
            if ((parents.length >= 1 && children.length >= 1) && parentSpread < alignmentThreshold && childSpread < alignmentThreshold) {
                // Calculate the average x position of parents and children
                const avgParentX = parents.reduce((sum, p) => sum + p.x, 0) / parents.length;
                const avgChildX = children.reduce((sum, c) => sum + c.x, 0) / children.length;
                
                // Use the midpoint between parent and child average as the target x
                const avgX = (avgParentX + avgChildX) / 2;
                const deviation = Math.abs(avgX - node.x);
                
                 // Apply adjustment only if deviation is within safe bounds
                if (deviation < correctionThreshold) {
                    node.x = avgX;
                }
            }
        });
    }

    console.log("✅ Applied refined midpoint straightening for nearly aligned chains.");
}

/**
 * Detects and resolves visual conflicts between unrelated links and nearby nodes.
 * Prevents ambiguous overlaps by nudging interfering nodes.
 * @param {Array} layers - All node layers
 * @param {Object} graphData - Graph structure including links
 */
export function disambiguateEdgeProximity(layers, graphData) {
    const nodeRadius = 10; // Approximate visual size of a node
    const disambiguationThreshold = 15; // Distance at which overlap is considered problematic
    const nudgeAmount = 20;  // Horizontal offset applied to separate conflicting node

    const links = graphData.links;
    const allNodes = layers.flat(); // Flatten layers into a single array of nodes

    allNodes.forEach(node => {
        // Build a set of node IDs that are connected (directly related)
        const connectedIds = new Set([
            ...node.superconcepts.map(n => n.id),
            ...node.subconcepts.map(n => n.id),
            node.id
        ]);

        links.forEach(link => {
            // Skip this link if it is directly related to the node
            if (connectedIds.has(link.source.id) || connectedIds.has(link.target.id)) return;

            // Project node onto the line segment and measure distance
            const x1 = link.source.x;
            const y1 = link.source.y;
            const x2 = link.target.x;
            const y2 = link.target.y;
            const x0 = node.x;
            const y0 = node.y;

            // Compute projection of node onto the line segment (edge)
            const dx = x2 - x1;
            const dy = y2 - y1;
            const lenSq = dx * dx + dy * dy;
            if (lenSq === 0) return; // Avoid division by zero for degenerate edge

            const t = ((x0 - x1) * dx + (y0 - y1) * dy) / lenSq; // projection scalar
            const tClamped = Math.max(0, Math.min(1, t)); // restrict projection to edge segment
            const projX = x1 + tClamped * dx;
            const projY = y1 + tClamped * dy;

            // Compute distance between node and projected point
            const dist = Math.sqrt((projX - x0) ** 2 + (projY - y0) ** 2);

            // Push node horizontally if too close to unrelated edge
            if (dist < disambiguationThreshold) {
                const offset = (x0 < projX ? -nudgeAmount : nudgeAmount);
                node.x += offset;
            }
        });
    });

    console.log("✅ Disambiguated visual overlap between nodes and unrelated edges.");
}