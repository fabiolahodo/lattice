import fs from 'fs';
import path from 'path';

/**
 * Parses the SERIALIZED data into a format suitable for visualization.
 * @param {Object} serialized - The serialized lattice data.
 * @returns {Object} Parsed data with nodes and links.
 */
function parseSerialized(serialized) {
    const objects = serialized.objects || [];
    const properties = serialized.properties || [];
    const context = serialized.context || [];
    const lattice = serialized.lattice || [];

    // Helper to create labels for nodes
    const createLabel = (extents, intents) => {
        const extentLabels = extents.map((index) => objects[index] || 'Unknown').join(', ');
        const intentLabels = intents.map((index) => properties[index] || 'Unknown').join(', ');
        return `Extent\n{${extentLabels}}\nIntent\n{${intentLabels}}`;
    };

    // Parse nodes
    const nodes = lattice.map((latticeNode, index) => {
        const [extents, intents] = latticeNode;
        const label = createLabel(extents, intents);
        const level = latticeNode[2]?.length || 0; // Use the size of upper neighbors as the level
        return {
            id: index, // Unique ID for the node
            label,
            level,
        };
    });

    // Parse links
    const links = [];
    lattice.forEach((latticeNode, sourceIndex) => {
        const [_, __, upperNeighbors, lowerNeighbors] = latticeNode;

        // Add links to upper neighbors
        upperNeighbors.forEach((upperIndex) => {
            links.push({
                source: sourceIndex,
                target: upperIndex,
            });
        });

        // Add links to lower neighbors
        lowerNeighbors.forEach((lowerIndex) => {
            links.push({
                source: lowerIndex,
                target: sourceIndex,
            });
        });
    });

    // Return parsed data
    return { nodes, links };
}

/**
 * Load serialized data from a file, parse it, and save the parsed output.
 * @param {string} inputFilePath - Path to the input file with serialized data.
 * @param {string} outputBasePath - Base path to save the parsed data.
 */
function processSerializedFile(inputFilePath, outputBasePath) {
    // Ensure input file exists
    if (!fs.existsSync(inputFilePath)) {
        console.error(`Input file not found: ${inputFilePath}`);
        return;
    }

    // Read serialized data from file
    const serializedData = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));

    // Parse the serialized data
    const parsedData = parseSerialized(serializedData);

    // Create a new folder under the output base path
    const folderName = `lattice_${Date.now()}`; // Use a timestamp for unique folder name
    const outputFolder = path.join(outputBasePath, folderName);

    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    // Save the parsed data as a JSON file
    const outputFilePath = path.join(outputFolder, 'parsedLattice.json');
    fs.writeFileSync(outputFilePath, JSON.stringify(parsedData, null, 2));
    console.log(`Parsed data saved to: ${outputFilePath}`);
}

// Example usage
const inputFilePath = path.join('input', 'serialized.json'); // Path to the input file
const outputBasePath = 'data'; // Base path for the parsed output

processSerializedFile(inputFilePath, outputBasePath);
