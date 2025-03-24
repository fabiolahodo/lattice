// src/core/latticeParser.js

/**
 * Parses a serialized formal concept lattice structure and extracts nodes and links.
 *
 * The function processes the given serialized data to generate a concept lattice,
 * ensuring correct node ordering and hierarchical relationships.
 * Nodes are assigned increasing IDs, and links are structured from superconcepts (parents) to subconcepts (children).
 *
 * @param {Object} SERIALIZED - The serialized lattice data containing objects, properties, context, and lattice structure.
 * @returns {Object} - An object containing the parsed nodes and links for visualization.
 */

export function parseSerializedData(SERIALIZED) {
    if (!SERIALIZED || typeof SERIALIZED !== 'object') {
        throw new Error("Invalid input data");
    }

    const objects = SERIALIZED.objects || [];
    const properties = SERIALIZED.properties || [];
    const context = SERIALIZED.context || [];
    const lattice = SERIALIZED.lattice || [];

    let nodes = [];
    let links = [];
    let levels = new Map();

    // Compute levels first for all nodes
    const computeLevels = () => {
        const computeLevel = (index) => {
            if (levels.has(index)) return levels.get(index);
            const [, , upperNeighbors] = lattice[index] || [];
            if (!upperNeighbors.length) {
                levels.set(index, 1);
                return 1;
            }
            const maxParentLevel = Math.max(...upperNeighbors.map(neighbor => computeLevel(neighbor)));
            levels.set(index, maxParentLevel + 1);
            return maxParentLevel + 1;
        };

        lattice.forEach((_, index) => computeLevel(index));
    };

    computeLevels();

    // Get the number of nodes
    const numNodes = lattice.length;

    // Step 1: Create nodes with reversed IDs and swapped content
    lattice.forEach((entry, index) => {
        if (!Array.isArray(entry) || entry.length < 3) return;
        const [extentIndices, intentIndices] = entry;
        const extent = extentIndices.map(i => objects[i] || 'Unknown');
        const intent = intentIndices.map(i => properties[i] || 'Unknown');
        const level = levels.get(index) || 1;

        // Reverse ID assignment
        const reversedId = numNodes - index;

        nodes.push({
            id: reversedId,
            label: `Intent\n{${intent.join(", ")}}\nExtent\n{${extent.join(", ")}}`,
            level: level
        });
    });

    // Step 2: Adjust links with reversed IDs and swap direction (parent to child)
    lattice.forEach((entry, index) => {
        if (!Array.isArray(entry) || entry.length < 4) return;
        const [, , upperNeighbors] = entry;
        const targetId = numNodes - index; // Reverse ID mapping

        if (upperNeighbors) {
            upperNeighbors.forEach(neighborIndex => {
                const sourceId = numNodes - neighborIndex; // Reverse ID mapping
                if (sourceId && targetId) {
                    links.push({ source: sourceId, target: targetId });
                }
            });
        }
    });

    return { nodes, links };
}
