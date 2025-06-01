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
 * Each node is placed in the lowest possible layer where all parents are already assigned.
 * @param {Object} graphData - Input graph with node hierarchy
 * @returns {Array} layers - Computed layering
 */
function computeCoffmanGrahamLayers(graphData) {
    const layers = [];
    const placedNodes = new Set();
    const height = GRAPH_CONFIG.dimensions.height; // Canvas height
    
     // Step 1: Topological sort of the graph
    const sortedNodes = topologicalSort(graphData);

    // Step 2: Place each node in the first valid layer
    sortedNodes.forEach((node) => {
        let layer = 0;

        // Find the lowest layer where all parent nodes have already been placed
        while (true) {
            const parents = node.superconcepts || [];

            const allParentsPlaced = parents.every(parent =>
                layers.slice(0, layer).some(l => l.some(n => n.id === parent.id))
            );

            if (allParentsPlaced) break;
            layer++;
        }

        // Initialize new layer if needed and assign the node
        if (!layers[layer]) layers[layer] = [];
        
        // Place node and mark it as placed
        layers[layer].push(node);
        placedNodes.add(node.id);

        // Estimate Y-position of the node within the layout
        //node.y = (layer + 1) * (height / (layers.length + 1));
    });

    return layers;
}

/**
 * Performs a topological sort on the graph using DFS.
 * Ensures parents are visited before children.
 * @param {Object} graphData - The graph containing nodes with superconcepts
 * @returns {Array} - Topologically sorted nodes
 */
function topologicalSort(graphData) {
    const visited = new Set();
    const result = [];

    function dfs(node) {
        if (visited.has(node.id)) return;
        visited.add(node.id);
        (node.superconcepts || []).forEach(dfs);
        result.push(node);
    }

    graphData.nodes.forEach(dfs);
    return result.reverse(); // Post-order reversed gives topological sort
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

    const maxLabelHeight = 30;
    const minSpacing = 80;
    const maxSpacing = 300;

    const pressures = layers.map((layer, i) => {
        let fanIn = 0;
        let fanOut = 0;

        layer.forEach(node => {
            fanIn += (node.superconcepts || []).length;
            fanOut += (node.subconcepts || []).length;
        });

        return fanIn + fanOut; // total connections
    });

    // Normalize pressures
    const maxPressure = Math.max(...pressures);
    const minPressure = Math.min(...pressures);
    const pressureRange = maxPressure - minPressure || 1;

    const layerSpacings = pressures.map(p => {
        const normalized = (p - minPressure) / pressureRange; // 0..1
        return minSpacing + normalized * (maxSpacing - minSpacing);
    });

    // Compute cumulative y position
    let currentY = padding;
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        layer.forEach(node => {
            node.y = currentY;
        });
        currentY += layerSpacings[i];
    }

    console.log("✅ Adaptive vertical layer spacing based on structural pressure.");
}

/**
 * Distributes X positions of nodes within each layer.
 * Anchors positions based on average parent x-coordinates.
 * Prevents horizontal overlap and false alignment with unrelated edges.
 * Special care is taken for layers with only one node to avoid misleading vertical stacking.
 * @param {Array} layers - Grouped layer nodes
 * @param {number} width - Canvas width
 * @param {number} padding - Padding to preserve margins
 */
/*
export function adjustNodePositions(layers, width, padding) {
    const maxShiftRatio = 0.4;
    const minSpacing = 150;
    const minGap = 50; // Min space between nodes
    const collisionThreshold = 25;

    layers.forEach((layer, layerIndex) => {
        const layerSize = layer.length;
        if (layerSize === 0) return;

        // 🔹 Handle single-node layer (top node)
        if (layerSize === 1) {
            const node = layer[0];
            const parents = node.superconcepts || [];
            const children = node.subconcepts || [];

            let baseX = width / 2;
            if (parents.length > 0) {
                baseX = parents.reduce((sum, p) => sum + p.x, 0) / parents.length;
            }

            const parentSpread = Math.max(...parents.map(p => p.x), 0) - Math.min(...parents.map(p => p.x), 0);
            const childSpread = Math.max(...children.map(c => c.x), 0) - Math.min(...children.map(c => c.x), 0);

            const needsNudge = (parents.length && children.length && parentSpread < 10 && childSpread < 10);
            node.x = needsNudge ? baseX + (layerIndex % 2 === 0 ? -50 : 50) : baseX;
            return;
        }

        // Check for shared parents
        const allParents = layer.map(n => n.superconcepts?.[0]?.id).filter(Boolean);
        const sharedParentId = allParents.every(id => id === allParents[0]) ? allParents[0] : null;

        // More spacing for upper layers
        const baseFactor = 1.2 + (1 - layerIndex / layers.length) * 1.2;
        const nodeFactor = Math.min(1.0 + (layerSize / 10), 3.0);
        
        // Enforce minimum spacing between nodes
        const xSpacing = minSpacing * baseFactor * nodeFactor;

        // Compute total width of the layer based on that spacing
        const layerWidth = (layerSize - 1) * xSpacing;
        const startX = (width - layerWidth) / 2;


        // 🎯 Step 1: Default spacing
        layer.forEach((node, i) => {
            node.x = startX + (i + 1) * xSpacing;
        });

        // 🧭 Step 2:Refine based on parents (barycenter shift)
        if (sharedParentId) {
            // All nodes share one parent → spread evenly around that parent
            const sharedParent = layer[0].superconcepts.find(p => p.id === sharedParentId);
            const centerX = sharedParent?.x ?? (width / 2);
            const spreadWidth = Math.max(minSpacing * (layerSize - 1), 200);
            const newSpacing = spreadWidth / (layerSize - 1);
            const spreadStartX = centerX - spreadWidth / 2;

            layer.forEach((node, i) => {
                node.x = spreadStartX + i * newSpacing;
            });

            console.log(`📐 Layer ${layerIndex}: Spread evenly (1 common parent: ${sharedParentId})`);
        } else {
            // Standard barycenter shift
            layer.forEach((node) => {
                const parents = node.superconcepts || [];
                if (!parents.length) return;

                const avgParentX = parents.reduce((sum, p) => sum + p.x, 0) / parents.length;
                const shift = node.x - avgParentX;
                const maxShift = xSpacing * maxShiftRatio;
                const clamped = Math.max(-maxShift, Math.min(shift, maxShift));
                node.x = avgParentX + clamped;
            });
        }

        // 🚫 Step 3: Collision resolution
        let hasOverlap = true;
        let iteration = 0;
        const maxIterations = 10;

        while (hasOverlap && iteration < maxIterations) {
            hasOverlap = false;
            for (let i = 1; i < layer.length; i++) {
                const left = layer[i - 1];
                const right = layer[i];
                const dx = right.x - left.x;

                if (dx < minGap) {
                    const shift = (minGap - dx) / 2;
                    left.x -= shift;
                    right.x += shift;
                    hasOverlap = true;
                }
            }
            iteration++;
        }

        // 🎯 Step 4: Recentering the entire layer
        const minX = Math.min(...layer.map(n => n.x));
        const maxX = Math.max(...layer.map(n => n.x));
        const layerMid = (minX + maxX) / 2;
        const viewMid = width / 2;
        const offset = viewMid - layerMid;

        layer.forEach(n => {
            n.x += offset;
        });
    });

    console.log("✅ Final node positions assigned with alignment, spacing, and centering.");
}
*/

export function adjustNodePositions(layers, width, padding) {
    const maxShiftRatio = 0.4;
    const minSpacing = 100;
    const minGap = 50;
    const collisionThreshold = 25;

    layers.forEach((layer, layerIndex) => {
        const layerSize = layer.length;
        if (layerSize === 0) return;

        // 🔹 Special case: Top or Bottom node alone
        if (layerSize === 1) {
            const node = layer[0];
            const parents = node.superconcepts || [];
            const children = node.subconcepts || [];

            let baseX = width / 2;

            if (parents.length > 0) {
                baseX = parents.reduce((sum, p) => sum + p.x, 0) / parents.length;
            }

            const parentSpread = Math.max(...parents.map(p => p.x), 0) - Math.min(...parents.map(p => p.x), 0);
            const childSpread = Math.max(...children.map(c => c.x), 0) - Math.min(...children.map(c => c.x), 0);

            const needsNudge = (parents.length && children.length && parentSpread < 10 && childSpread < 10);
            node.x = needsNudge ? baseX + (layerIndex % 2 === 0 ? -50 : 50) : baseX;
            return;
        }

        // 🔄 Step 1: Default x-spacing based on layer width
        const nodeFactor = Math.min(1.0 + (layerSize / 12), 3.5);
        const baseFactor = 1.3 + (1 - layerIndex / layers.length) * 1.2;
        const xSpacing = minSpacing * nodeFactor * baseFactor;

        const layerWidth = (layerSize - 1) * xSpacing;
        const startX = (width - layerWidth) / 2;

        layer.forEach((node, i) => {
            node.x = startX + i * xSpacing;
        });

        // 🧠 Step 2: Parent-based barycenter adjustment
        const allParents = layer.map(n => n.superconcepts?.[0]?.id).filter(Boolean);
        const sharedParentId = allParents.every(id => id === allParents[0]) ? allParents[0] : null;

        if (sharedParentId) {
            const sharedParent = layer[0].superconcepts.find(p => p.id === sharedParentId);
            const centerX = sharedParent?.x ?? (width / 2);
            const spreadWidth = Math.max(minSpacing * (layerSize - 1), 200);
            const newSpacing = spreadWidth / (layerSize - 1);
            const spreadStartX = centerX - spreadWidth / 2;

            layer.forEach((node, i) => {
                node.x = spreadStartX + i * newSpacing;
            });

            console.log(`📐 Layer ${layerIndex}: Centered under shared parent ${sharedParentId}`);
        } else {
            layer.forEach(node => {
                const parents = node.superconcepts || [];
                if (!parents.length) return;

                const avgParentX = parents.reduce((sum, p) => sum + p.x, 0) / parents.length;
                const shift = node.x - avgParentX;
                const maxShift = xSpacing * maxShiftRatio;
                const clamped = Math.max(-maxShift, Math.min(shift, maxShift));
                node.x = avgParentX + clamped;
            });
        }

        // 🚫 Step 3: Resolve overlaps
        let hasOverlap = true;
        let iteration = 0;
        const maxIterations = 10;

        while (hasOverlap && iteration < maxIterations) {
            hasOverlap = false;
            for (let i = 1; i < layer.length; i++) {
                const left = layer[i - 1];
                const right = layer[i];
                const dx = right.x - left.x;

                if (dx < minGap) {
                    const shift = (minGap - dx) / 2;
                    left.x -= shift;
                    right.x += shift;
                    hasOverlap = true;
                }
            }
            iteration++;
        }

        // 🎯 Step 4: Recenter layer
        const minX = Math.min(...layer.map(n => n.x));
        const maxX = Math.max(...layer.map(n => n.x));
        const layerMid = (minX + maxX) / 2;
        const viewMid = width / 2;
        const offset = viewMid - layerMid;

        layer.forEach(n => {
            n.x += offset;
        });
    });

    console.log("✅ Final node positions adjusted for alignment and symmetry.");
}

/**
 * Straightens nodes that fall between aligned parent and child chains.
 * Only adjusts if deviation is small to preserve layout stability.
 * @param {Array} layers - All layered nodes
 */
/*
export function straightenMidpoints(layers) {
    const alignmentThreshold = 30; // Max horizontal spread allowed among parents/children to be considered aligned
    const correctionThreshold = 100; // Max distance a node can deviate from the average before adjustment is skipped

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
*/
export function straightenMidpoints(layers) {
    const alignmentSpreadThreshold = 40;     // Allow some horizontal deviation
    const correctionThreshold = 120;         // Only adjust if node isn't too far off
    const minConnected = 2;                  // Minimum parents/children to consider

    for (let i = 1; i < layers.length - 1; i++) {
        const layer = layers[i];

        layer.forEach(node => {
            const parents = node.superconcepts || [];
            const children = node.subconcepts || [];

            if (parents.length < minConnected || children.length < minConnected) return;

            const parentXs = parents.map(p => p.x);
            const childXs = children.map(c => c.x);

            const parentSpread = Math.max(...parentXs) - Math.min(...parentXs);
            const childSpread = Math.max(...childXs) - Math.min(...childXs);

            // Check if this node is structurally centered
            const alignedParents = parentSpread < alignmentSpreadThreshold;
            const alignedChildren = childSpread < alignmentSpreadThreshold;

            if (alignedParents && alignedChildren) {
                const avgParentX = parentXs.reduce((a, b) => a + b, 0) / parentXs.length;
                const avgChildX = childXs.reduce((a, b) => a + b, 0) / childXs.length;
                const avgX = (avgParentX + avgChildX) / 2;

                const deviation = Math.abs(node.x - avgX);

                if (deviation < correctionThreshold) {
                    node.x = avgX;
                }
            }
        });
    }

    console.log("✅ Improved midpoint straightening for aligned concept chains.");
}

/**
 * Detects and resolves visual conflicts between unrelated links and nearby nodes.
 * Prevents ambiguous overlaps by nudging interfering nodes.
 * @param {Array} layers - All node layers
 * @param {Object} graphData - Graph structure including links
 */

export function disambiguateEdgeProximity(layers, graphData) {
    const nodeRadius = 10; // Approximate visual size of a node
    const disambiguationThreshold = 20; // Distance at which overlap is considered problematic
    const nudgeAmount = 25;  // Horizontal offset applied to separate conflicting node

    const links = graphData.links;
    const allNodes = layers.flat(); // Flatten layers into a single array of nodes

    // Perform two passes for better spacing correction
    for (let pass = 0; pass < 2; pass++) {
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

            // Compute projection of node onto the edge
            const dx = x2 - x1;
            const dy = y2 - y1;
            const lenSq = dx * dx + dy * dy;
            if (lenSq === 0) return; // Avoid division by zero for degenerate edge

            const t = ((x0 - x1) * dx + (y0 - y1) * dy) / lenSq; // projection scalar
            const tClamped = Math.max(0, Math.min(1, t)); // restrict projection to edge segment
            const projX = x1 + tClamped * dx;
            const projY = y1 + tClamped * dy;

            const dxProj = projX - x0;
            const dyProj = projY - y0;
            // Compute distance between node and projected point
            const dist = Math.sqrt(dxProj ** 2 + dyProj ** 2);

            // Additional criteria: if vertical distance is small, increase repulsion
            const verticalBias = Math.abs(dyProj) < 40 ? 1.5 : 1.0;

            // Push node horizontally if too close to unrelated edge
            if (dist < disambiguationThreshold * verticalBias) {
                const offset = (x0 < projX ? -1 : 1);
                node.x += offset * nudgeAmount ;
            }
        });
    });
   
    }
    console.log("✅ Disambiguated visual overlap between nodes and unrelated edges.");
}

