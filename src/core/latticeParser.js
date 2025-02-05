// src/core/latticeParser.js

/*import fs from 'fs';
import path from 'path';
*/
// Check if running in a Node.js or browser environment
const isNodeEnvironment = typeof window === "undefined";

/**
 * Parses the SERIALIZED data into a format suitable for visualization.
 * Converts serialized lattice data into `nodes` and `links` with labels, levels, and all neighbor links.
 * 
 * @param {Object} serialized - The serialized lattice data.
 * @returns {Object} Parsed data with nodes and links.
 */
export function parseSerialized(serialized) {
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
        const [extents, intents, upperNeighbors] = latticeNode;
        const label = createLabel(extents, intents);
        //const level = latticeNode[2]?.length || 0; // Use the size of upper neighbors as the level
        const level = upperNeighbors.length; // Use the number of upper neighbors to calculate the level
        return {
            id: index + 1, // Unique ID for the node starting from 1
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
                source: sourceIndex + 1, // Adjust for 1-based indexing
                target: upperIndex + 1, // Adjust for 1-based indexing
            });
        });

        // Add links to lower neighbors
        lowerNeighbors.forEach((lowerIndex) => {
            links.push({
                source: lowerIndex + 1, // Adjust for 1-based indexing
                target: sourceIndex + 1, // Adjust for 1-based indexing
            });
        });
    });

    // Return parsed data
    return { nodes, links, context };
}

/**
 * Load serialized data from a file (manual - Node.js or browser-based).
 * @param {string|File} input - Path to the input file (Node.js) or File object (browser).
 * @returns {Promise<Object>} Parsed data with nodes and links.
 */
export function loadSerializedFile(input) {
    return new Promise((resolve, reject) => {
        if (isNodeEnvironment) {
            // Node.js environment
            const fs = require("fs");
            const path = require("path");

            try {
                if (!fs.existsSync(input)) {
                    reject(`File not found: ${input}`);
                    return;
                }
                const serializedData = JSON.parse(fs.readFileSync(input, "utf-8"));
                const parsedData = parseSerialized(serializedData);
                resolve(parsedData);
            } catch (error) {
                reject(`Error reading file in Node.js: ${error.message}`);
            }
        } else {
            // Browser environment
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const serializedData = JSON.parse(event.target.result);
                    const parsedData = parseSerialized(serializedData);
                    resolve(parsedData);
                } catch (error) {
                    reject(`Error parsing file in browser: ${error.message}`);
                }
            };

            reader.onerror = () => {
                reject("Error reading the file in the browser.");
            };

            reader.readAsText(input); // File object from <input type="file">
        }
    });
}

/**
 * Save parsed data to a file (manual - Node.js or browser-based).
 * @param {Object} parsedData - The parsed data to save.
 * @param {string} output - Path to the output file (Node.js) or file name (browser).
 */
export function saveParsedData(parsedData, output = "parsedLattice.json") {
    if (isNodeEnvironment) {
        // Node.js environment
        const fs = require("fs");
        const path = require("path");

        try {
            const outputDir = path.dirname(output);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.writeFileSync(output, JSON.stringify(parsedData, null, 2));
            console.log(`Parsed data saved to: ${output}`);
        } catch (error) {
            console.error(`Error saving file in Node.js: ${error.message}`);
        }
    } else {
        // Browser environment
        const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: "application/json" });
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = output;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
}

/*
/**
 * Load serialized data from a file, parse it, and save the parsed output.
 * @param {string} inputFilePath - Path to the input file with serialized data.
 * @param {string} outputBasePath - Base path to save the parsed data.
 */
/*
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
const inputFilePath = path.join('input', 'bob-ros.json'); // Path to the input file
const outputBasePath = 'data'; // Base path for the parsed output

processSerializedFile(inputFilePath, outputBasePath);
*/