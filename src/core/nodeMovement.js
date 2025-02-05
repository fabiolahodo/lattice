// src/core/nodeMovement.js

// Import necessary dependencies
import { GRAPH_CONFIG } from './config.js';

/**
 * Applies movement constraints to node positions.
 * Ensures nodes:
 * - Stay inside the graph boundaries
 * - Maintain proper vertical alignment within their assigned layers
 * - Avoid overlapping with other nodes
 * - Do not cross into other layers
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {number} width - Width of the graph area.
 * @param {number} height - Height of the graph area.
 */
export function applyNodeConstraints(graphData, width, height) {
    // ✅ Get padding from config to maintain consistent spacing
    const padding = GRAPH_CONFIG.dimensions.padding;

    // ✅ Compute layer spacing dynamically based on the total number of layers
    const maxLevel = Math.max(...graphData.nodes.map(n => n.level)); // Find the deepest level
    const layerSpacing = (height - 2 * padding) / (maxLevel + 1); // Distribute layers evenly

    /**
     * Helper function to find nodes directly connected to a given node.
     * @param {string} nodeId - The ID of the node to find linked nodes for.
     * @returns {Array} - Array of linked nodes.
     */
    function getLinkedNodes(nodeId) {
        return graphData.links
            .filter(link => link.source.id === nodeId || link.target.id === nodeId) // Find links where this node is a source or target
            .map(link => (link.source.id === nodeId ? link.target : link.source)); // Return the connected nodes
    }

    // ✅ Apply constraints to all nodes in the graph
    graphData.nodes.forEach(node => {
        if (node.id === 'Top Concept') {
            // 🔹 Keep "Top Concept" fixed at the top
            node.y = padding; // Strictly fix at top padding
        } else if (node.id === 'Bottom Concept') {
            // 🔹 Keep "Bottom Concept" fixed at the bottom
            node.y = height - padding; // Strictly fix at bottom padding
        } else {
            // 🔹 Ensure node stays within its assigned layer
            const layerY = padding + node.level * layerSpacing; // Compute base Y position for the layer
            const verticalMargin = layerSpacing * 0.3; // Allow some minor movement within the layer

            // 🔹 Ensure the node stays within its assigned layer boundaries
            const minY = layerY - verticalMargin;
            const maxY = layerY + verticalMargin;

            // Ensure the node stays within its assigned layer boundaries
            node.y = Math.max(minY, Math.min(maxY, node.y));

            // 🔹 Adjust y-position dynamically based on its linked neighbors
            const linkedNodes = getLinkedNodes(node.id); // Find connected nodes
            const upperNeighbors = linkedNodes.filter(n => n.level < node.level); // Nodes above this one
            const lowerNeighbors = linkedNodes.filter(n => n.level > node.level); // Nodes below this one

            // ✅ Compute new vertical positioning constraints based on linked neighbors
            const topY = upperNeighbors.length > 0
                ? Math.max(...upperNeighbors.map(n => n.y + padding)) // Ensures node stays below its upper neighbors
                : minY; // Default to minY if no upper neighbors

            const bottomY = lowerNeighbors.length > 0
                ? Math.min(...lowerNeighbors.map(n => n.y - padding)) // Ensures node stays above its lower neighbors
                : maxY; // Default to maxY if no lower neighbors

            // ✅ Apply the computed constraints to prevent overlapping with neighbors
            node.y = Math.max(topY, Math.min(bottomY, node.y));
        }

        // ✅ Ensure nodes stay within the graph's horizontal & vertical boundaries
        node.x = Math.max(padding, Math.min(width - padding, node.x)); // Keeps nodes inside left-right bounds
        node.y = Math.max(padding, Math.min(height - padding, node.y)); // Keeps nodes inside top-bottom bounds
    });

    // ✅ Apply an additional step to prevent nodes from overlapping
    preventNodeOverlap(graphData);

    avoidEdgeOverlap(graphData);
}


/**
 * Prevents nodes from overlapping by applying a simple repulsion force.
 * Ensures:
 * - Nodes do not get too close to each other
 * - Labels and nodes do not collide
 * - Maintains better readability of the graph
 * @param {Object} graphData - The graph data containing nodes.
 */
export function preventNodeOverlap(graphData) {
    const minDistance = GRAPH_CONFIG.node.maxRadius * 2; // ✅ Defines the minimum spacing between nodes

    graphData.nodes.forEach((nodeA) => {
        graphData.nodes.forEach((nodeB) => {
            if (nodeA !== nodeB) { // ✅ Only compare different nodes
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const distance = Math.sqrt(dx * dx + dy * dy); // Compute Euclidean distance between nodes

                if (distance < minDistance) { // If nodes are too close
                    const angle = Math.atan2(dy, dx); // Find the angle between the nodes
                    const moveAmount = (minDistance - distance) / 2; // Compute how much they need to be moved apart

                    // ✅ Move both nodes apart by a small amount
                    nodeA.x += Math.cos(angle) * moveAmount;
                    nodeA.y += Math.sin(angle) * moveAmount;
                    nodeB.x -= Math.cos(angle) * moveAmount;
                    nodeB.y -= Math.sin(angle) * moveAmount;
                }
            }
        });
    });
}

/**
 * Avoid node-edge overlaps by pushing nodes away from edges.
 * Ensures nodes do not visually intersect edges for better clarity.
 * @param {Object} graphData - The graph data containing nodes and links.
 */
function avoidEdgeOverlap(graphData) {
    const minEdgeNodeDistance = GRAPH_CONFIG.node.maxRadius * 1.5; // Minimum distance from edges
    graphData.nodes.forEach((node) => {
        graphData.links.forEach((link) => {
            const source = link.source;
            const target = link.target;

            // Calculate the distance of the node from the edge (line segment)
            const distance = calculatePointToSegmentDistance(
                { x: node.x, y: node.y },
                { x: source.x, y: source.y },
                { x: target.x, y: target.y }
            );

            if (distance < minEdgeNodeDistance) {
                const dx = node.x - (source.x + target.x) / 2;
                const dy = node.y - (source.y + target.y) / 2;
                const magnitude = Math.sqrt(dx * dx + dy * dy);

                if (magnitude > 0) {
                    node.x += (dx / magnitude) * (minEdgeNodeDistance - distance);
                    node.y += (dy / magnitude) * (minEdgeNodeDistance - distance);
                }
            }
        });
    });
}

/**
 * Calculate the shortest distance from a point to a line segment.
 * @param {Object} point - The point (x, y).
 * @param {Object} segmentStart - The start of the segment (x, y).
 * @param {Object} segmentEnd - The end of the segment (x, y).
 * @returns {number} - The shortest distance.
 */
function calculatePointToSegmentDistance(point, segmentStart, segmentEnd) {
    const px = segmentEnd.x - segmentStart.x;
    const py = segmentEnd.y - segmentStart.y;
    const norm = px * px + py * py;
    let u = ((point.x - segmentStart.x) * px + (point.y - segmentStart.y) * py) / norm;
    u = Math.max(Math.min(u, 1), 0);
    const x = segmentStart.x + u * px;
    const y = segmentStart.y + u * py;
    const dx = x - point.x;
    const dy = y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
}
