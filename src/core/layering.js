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
    const maxLayerSpacing = 150; // Maximum space between layers

    const totalNodes = graphData.nodes.length;

    // Check if all nodes have a `level` property (predefined layering)
    const usePredefinedLevels = graphData.nodes.every(node => node.hasOwnProperty("level"));

    if (usePredefinedLevels) {
        console.log("✅ Using predefined levels from JSON...");

        // Calculate spacing dynamically based on the highest level in the dataset
        const maxLevel = Math.max(...graphData.nodes.map(n => n.level)) || 1; // Prevent division by zero
        //const layerSpacing = Math.min((height - 2 * padding) / (maxLevel + 1), 100);

    // Group nodes by their `level` property. Calculate layer spacing dynamically
    graphData.nodes.forEach((node) => {

        if (node.level === undefined) {
            console.warn(`⚠️ Node ${node.id} is missing level info. Assigning default level 1.`);
            node.level = 1;
        }
        
        const layerIndex = node.level - 1; // Level 1 corresponds to layer 0
        if (!layers[layerIndex]) layers[layerIndex] = [];
        layers[layerIndex].push(node);

        // ✅ Preserve existing y-position if it's already set
       // node.y = padding + layerIndex * layerSpacing; // Vertical spacing based on layer index
      });   
    } else {
        console.log("⚠️ Computing layers dynamically using Coffman-Graham algorithm...");
        
        // Compute layers dynamically using the Coffman-Graham algorithm
        return computeCoffmanGrahamLayers(graphData);
    }
   
    console.log("✅ Assigned layers:", layers.map((layer, index) => ({ layer: index + 1, nodes: layer.map(n => n.id) })));
    
    // ✅ Adjust spacing dynamically based on node count in each level
    //const maxNodesInLevel = Math.max(...layers.map(l => l.length));

    // ✅ Dynamic spacing for each layer based on node count
    const layerSizes = layers.map(layer => layer.length);
    const maxNodesInLevel = Math.max(...layerSizes);
    
    let cumulativeY = padding; // Track Y-position dynamically

    layers.forEach((layer, layerIndex) => {
        const totalNodes = layer.length;

        // ✅ Adjust spacing: Levels with fewer nodes get less space, dense levels get more
        let spacingFactor = totalNodes / maxNodesInLevel;
        spacingFactor = Math.max(0.3, Math.min(spacingFactor, 1.0)); // Clamp values

        let layerSpacing = minLayerSpacing + (maxLayerSpacing - minLayerSpacing) * spacingFactor;
        
        layer.forEach((node, index) => {
            node.y = cumulativeY;
        });

        cumulativeY += layerSpacing; // Move to next level
    });

    console.log("✅ Final Layer Assignments:", layers.map((layer, index) => ({
        layer: index + 1,
        nodes: layer.map(n => n.id),
    })));
    
    /*
    // ✅ Use precomputed superconcepts for alignment instead of filtering links
    layers.forEach((layer, layerIndex) => {
        const totalNodes = layer.length;

        // ✅ Adjust available width based on node density
        const minSpacingFactor = 0.2;
        const maxSpacingFactor = 0.8;
        let spacingFactor = totalNodes / maxNodesInLevel;
        spacingFactor = Math.max(minSpacingFactor, Math.min(maxSpacingFactor, spacingFactor));

        const levelWidth = width * spacingFactor;
        const xSpacing = levelWidth / Math.max(1, totalNodes + 1);

        layer.forEach((node, index) => {
            node.x = (width - levelWidth) / 2 + (index + 1) * xSpacing;
        });

        // ✅ Align nodes with their parents
        if (layerIndex > 0) {
            layer.forEach((node) => {
                if (node.superconcepts.length === 1) {
                    node.x = node.superconcepts[0].x; // ✅ Align with only parent
                } else if (node.superconcepts.length > 1) {
                    node.x = node.superconcepts.reduce((sum, parent) => sum + parent.x, 0) / node.superconcepts.length;
                }
            });

    // ✅ Prevent overlapping nodes in the same level
    const uniqueXPositions = new Set();
    layer.forEach((node) => {
        let shiftCount = 0;
        while (uniqueXPositions.has(node.x) && shiftCount < 5) {
            node.x += 10;
            shiftCount++;
        }
        uniqueXPositions.add(node.x);
    });
}
});
*/

console.log("✅ Final Layer Assignments:", layers.map((layer, index) => ({
    layer: index + 1, nodes: layer.map(n => n.id)
})));

// ✅ Order nodes within layers to minimize crossings
orderVerticesWithinLayers(layers, graphData);

console.debug("✅ Nodes Ordered Within Layers and Aligned to Parents");
return layers;
}
    /* layers.forEach((layer, layerIndex) => {
        const xSpacing = (width - 2 * padding) / (layer.length + 1);
        layer.forEach((node, index) => {
            //node.y = padding + layerIndex * layerSpacing;
            node.x = padding + (index + 1) * xSpacing;
        });
        */
    /*
       // ✅ Adjust spacing dynamically based on node count in each level
    const maxNodesInLevel = Math.max(...layers.map(l => l.length)); // Get max nodes in any level

    layers.forEach((layer, layerIndex) => {
        const totalNodes = layer.length;
        
        // 🟢 Adjust available width based on node density (use more width if the level has more nodes)
        const densityFactor = totalNodes / maxNodesInLevel; // Between 0 and 1
        const minLevelWidth = width * 0.3; // Ensure minimum width for small levels
        const levelWidth = minLevelWidth + (width - minLevelWidth) * densityFactor;

        const xSpacing = levelWidth / Math.max(1, totalNodes + 1); // Ensure division by zero does not occur

        layer.forEach((node, index) => {
            node.x = (width - levelWidth) / 2 + (index + 1) * xSpacing; // Center nodes in available space
        });

     // 🔹 **Reduce edge crossings by ensuring nodes in small levels stay near their parents**
     if (layerIndex > 0) {
        const parentLayer = layers[layerIndex - 1];
        layer.forEach((node) => {
            const parentLinks = graphData.links.filter(l => l.target.id === node.id);
            if (parentLinks.length === 1) {
                node.x = parentLinks[0].source.x; // Align with the only parent
            } else if (parentLinks.length > 1) {
                const avgX = parentLinks.reduce((sum, link) => sum + link.source.x, 0) / parentLinks.length;
                node.x = avgX; // Align with the average parent position
            }
        });
    }
});
 
console.log("✅ Final Layer Assignments:", layers.map((layer, index) => ({
    layer: index + 1, nodes: layer.map(n => n.id)
})));

// ✅ Order nodes within layers to minimize crossings
orderVerticesWithinLayers(layers, graphData);

return layers;
}
*/

/*

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
*/

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

    layers.forEach((layer, layerIndex) => {
        // Compute barycenters for nodes in the current layer
        layer.forEach((node) => {
           // node.barycenter = computeBarycenter(node, graphData);
           node.barycenter = computeBarycenter(node);
        });

        // Sort nodes by barycenter value
        //layer.sort((a, b) => a.barycenter - b.barycenter);

/*
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
*/


       // ✅ Sort nodes within the layer based on barycenter values
        layer.sort((a, b) => {
            if (a.barycenter === null && b.barycenter === null) return 0;
            if (a.barycenter === null) return 1;
            if (b.barycenter === null) return -1;
            return a.barycenter - b.barycenter;
        });
        const layerWidth = GRAPH_CONFIG.dimensions.width - 2 * GRAPH_CONFIG.dimensions.padding;
        const xSpacing = layerWidth / (layer.length + 1);

        layer.forEach((node, index) => {
            node.x = GRAPH_CONFIG.dimensions.padding + (index + 1) * xSpacing;
        });
    });

    console.debug("✅ Nodes Ordered Within Layers");
}
         /*
        // ✅ Adaptive width for each level
        const totalNodes = layer.length;
        const maxNodesInLevel = Math.max(...layers.map(l => l.length));
        const minSpacingFactor = 0.3; // Ensure at least 30% width is used
        const spacingFactor = Math.max(minSpacingFactor, totalNodes / maxNodesInLevel);
        const levelWidth = GRAPH_CONFIG.dimensions.width * spacingFactor; // Scale width dynamically

        const xSpacing = levelWidth / Math.max(1, totalNodes + 1);
        

        // ✅ Dynamically adjust width for each level based on node density
        const totalNodes = layer.length;
        const maxNodesInLevel = Math.max(...layers.map(l => l.length));
        const minSpacingFactor = 0.2; // Ensure at least 20% width is used
        const maxSpacingFactor = 0.8; // Ensure no level takes up more than 80% of available width

        // ✅ Compute spacing factor: Small levels take less space, large levels take more
        let spacingFactor = totalNodes / maxNodesInLevel; 
        spacingFactor = Math.max(minSpacingFactor, Math.min(maxSpacingFactor, spacingFactor)); // Keep within limits

        const levelWidth = GRAPH_CONFIG.dimensions.width * spacingFactor; // Scale width dynamically
        const xSpacing = levelWidth / Math.max(1, totalNodes + 1);

        // ✅ Assign compact x positions
        layer.forEach((node, index) => {
            node.x = (GRAPH_CONFIG.dimensions.width - levelWidth) / 2 + (index + 1) * xSpacing;
        });

                // ✅ Further align nodes with their parents
                if (layerIndex > 0) {
                    layer.forEach((node) => {
                        if (node.superconcepts.length === 1) {
                            node.x = node.superconcepts[0].x; // ✅ Align single-parent nodes
                        } else if (node.superconcepts.length > 1) {
                            node.x = node.superconcepts.reduce((sum, parent) => sum + parent.x, 0) / node.superconcepts.length;
                        }
                    });
        
                    // ✅ Prevent overlapping nodes in the same level (Limited Adjustments)
                    const uniqueXPositions = new Set();
                    layer.forEach((node) => {
                        let shiftCount = 0;
                        while (uniqueXPositions.has(node.x) && shiftCount < 3) {
                            node.x += 10;
                            shiftCount++;
                        }
                        uniqueXPositions.add(node.x);
                    });
                }
            });
        /*
        // ✅ Further align nodes with their parents
        if (layerIndex > 0) {
            const parentLayer = layers[layerIndex - 1];

            layer.forEach((node) => {
                // ✅ Ensure `graphData.links` exists before filtering
                if (!Array.isArray(graphData.links)) {
                    console.warn("⚠️ `graphData.links` is not an array. Skipping parent alignment.");
                    return;
                }

                const parentLinks = graphData.links.filter(link => {
                    return link.target === node.id || (link.target.id && link.target.id === node.id);
                });

                if (parentLinks.length === 1) {
                    // ✅ Align single-parent nodes directly under their parent
                    node.x = parentLinks[0].source.x;
                } else if (parentLinks.length > 1) {
                    // ✅ Align multiple-parent nodes to the average X position of their parents
                    const avgX = parentLinks.reduce((sum, link) => sum + link.source.x, 0) / parentLinks.length;
                    node.x = avgX;
                }
            });

            // ✅ **Prevent overlapping nodes in the same level**
            const uniqueXPositions = new Set();
            layer.forEach((node) => {
                while (uniqueXPositions.has(node.x)) {
                    node.x += 10; // Slightly shift overlapping nodes
                }
                uniqueXPositions.add(node.x);
            });
        }
           
    });
   
    console.debug("Nodes Ordered Within Layers");
}
  */
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

    /*
    //const neighbors = [...node.superconcepts, ...node.subconcepts];
    const superconcepts = Array.isArray(node.superconcepts) ? node.superconcepts : [];
    const subconcepts = Array.isArray(node.subconcepts) ? node.subconcepts : [];
    const neighbors = [...superconcepts, ...subconcepts];

    if (neighbors.length === 0) return 0; // Prevents division by zero
    
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
}*/

/**
 * Adjusts vertical spacing between layers dynamically.
 * @param {Array} layers - The array of layers containing nodes.
 * @param {Object} graphDimensions - The graph width, height, and padding.
 */
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
