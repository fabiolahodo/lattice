const isNodeEnvironment = typeof window === "undefined";

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
    let levels = new Map(); // Track levels based on node hierarchy

    // Helper function to create formatted labels
    const createLabel = (extents, intents) => {
        const extentLabels = extents.map(index => objects[index] || 'Unknown').join(', ');
        const intentLabels = intents.map(index => properties[index] || 'Unknown').join(', ');
        return `Extent\n{${extentLabels}}\nIntent\n{${intentLabels}}`;
    };

    // Compute levels
    const computeLevel = (index, visited = new Set()) => {
        if (visited.has(index)) return levels.get(index) || 0; // Avoid cyclic dependencies
        visited.add(index);
        const [, , upperNeighbors] = lattice[index];
        if (!upperNeighbors.length) return 1; // Top-level concept
        const maxParentLevel = Math.max(...upperNeighbors.map(neighbor => computeLevel(neighbor, visited)));
        levels.set(index, maxParentLevel + 1);
        return maxParentLevel + 1;
    };

    // Creating nodes from lattice data
    lattice.forEach((entry, index) => {
        const [extentIndices, intentIndices, upperNeighbors] = entry;
        const extent = extentIndices.map(i => objects[i]);
        const intent = intentIndices.map(i => properties[i]);
        const level = computeLevel(index);
        nodes.push({
            id: index + 1, // 1-based indexing
            label: createLabel(extentIndices, intentIndices),
            level: level
        });
    });

    // Creating links based on lattice structure
    lattice.forEach((entry, index) => {
        const [, , upperNeighbors, lowerNeighbors] = entry;
        upperNeighbors.forEach(neighborIndex => {
            links.push({ source: index + 1, target: neighborIndex + 1 });
        });
        lowerNeighbors.forEach(neighborIndex => {
            links.push({ source: neighborIndex + 1, target: index + 1 });
        });
    });

    return { nodes, links, context };
}

/*
export function loadSerializedFile(input) {
    return new Promise((resolve, reject) => {
        if (isNodeEnvironment) {
            const fs = require("fs");
            try {
                if (!fs.existsSync(input)) {
                    reject(`File not found: ${input}`);
                    return;
                }
                const serializedData = JSON.parse(fs.readFileSync(input, "utf-8"));
                const parsedData = parseSerializedData(serializedData);
                resolve(parsedData);
            } catch (error) {
                reject(`Error reading file in Node.js: ${error.message}`);
            }
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const serializedData = JSON.parse(event.target.result);
                    const parsedData = parseSerializedData(serializedData);
                    resolve(parsedData);
                } catch (error) {
                    reject(`Error parsing file in browser: ${error.message}`);
                }
            };
            reader.onerror = () => {
                reject("Error reading the file in the browser.");
            };
            reader.readAsText(input);
        }
    });
}

export function saveParsedData(parsedData, output = "parsedLattice.json") {
    if (isNodeEnvironment) {
        const fs = require("fs");
        try {
            fs.writeFileSync(output, JSON.stringify(parsedData, null, 2));
            console.log(`Parsed data saved to: ${output}`);
        } catch (error) {
            console.error(`Error saving file in Node.js: ${error.message}`);
        }
    } else {
        const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: "application/json" });
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = output;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
}
*/