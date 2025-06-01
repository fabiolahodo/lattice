// src/core/generateTable.js
document.addEventListener("DOMContentLoaded", function () {
    console.log("🔍 Script Loaded: generateTable.js");

    // Select the Load JSON File button
    const loadButton = document.getElementById("load-json-file");
    
    // Select the Show Formal Context button
    const showTableButton = document.getElementById("show-formal-context"); // FIXED
    showTableButton.style.display = "none"; // Hide initially

    // Event listener for loading a JSON file
    loadButton.addEventListener("click", function () {
        const fileInput = document.getElementById("file-upload");
        if (!fileInput.files.length) {
            alert("Please select a JSON file first.");
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();
        
        // Read the file as text and parse the JSON
        reader.onload = function (event) {
            try {
                const graphData = JSON.parse(event.target.result);
                console.log("✅ JSON Loaded:", graphData);
                
                // Store the nodes data in sessionStorage for later use
                sessionStorage.setItem("formalContext", JSON.stringify(graphData.nodes));
                
                // Show the "Show Formal Context" button after loading the JSON file
                showTableButton.style.display = "block"; 
            } catch (error) {
                console.error("❌ Error loading JSON file:", error);
                alert("Failed to parse the file. Ensure it is a valid JSON.");
            }
        };
        reader.readAsText(file);
    });

     // Event listener for Show Formal Context button
    showTableButton.addEventListener("click", function () {
        const nodes = JSON.parse(sessionStorage.getItem("formalContext"));
        if (nodes) {
            generateFormalContextTable(nodes);
        } else {
            alert("No formal context found. Please upload a JSON file first.");
        }
    });
});

/**
 * Generates a Formal Context table dynamically and inserts it into the document.
 *
 * The function extracts unique objects (Extent) as table rows and unique properties (Intent) as columns.
 * If an object has a property, the corresponding table cell is filled with "x"; otherwise, it remains empty.
 *
 * @param {Array} nodes - The array of nodes containing Extent and Intent labels.
 */
function generateFormalContextTable(nodes) {
    console.log("📌 Generating Formal Context Table:", nodes);
    const tableContainer = document.querySelector(".table-container");
    if (!tableContainer) {
        console.error("❌ Table container not found in the HTML.");
        return;
    }

    if (!nodes || nodes.length === 0) {
        console.warn("⚠️ No nodes found in JSON.");
        return;
    }

    // Extract unique objects (extent) and properties (intent)
    const objects = new Set();
    const properties = new Set();

   /*
    nodes.forEach(node => {
        extractExtent(node.label).split(",").forEach(obj => objects.add(obj.trim()));
        extractIntent(node.label).split(",").forEach(prop => properties.add(prop.trim()));
    });
    */

    nodes.forEach(node => {
        extractExtent(node.label).forEach(obj => objects.add(obj.trim()));
        extractIntent(node.label).forEach(prop => properties.add(prop.trim()));
    });

    // Convert to arrays for indexing
    const objectList = Array.from(objects).filter(obj => obj !== "");
    const propertyList = Array.from(properties).filter(prop => prop !== "");

    const table = document.createElement("table");
    table.border = "1";

    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.appendChild(document.createElement("th")); // Empty top-left cell
    propertyList.forEach(prop => {
        const th = document.createElement("th");
        th.textContent = prop;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement("tbody");
    objectList.forEach(obj => {
        const row = document.createElement("tr");
        
        // Add object name to the row header
        const objectCell = document.createElement("th");
        objectCell.textContent = obj;
        row.appendChild(objectCell);

        // Fill the row with "x" where an object has the corresponding property
        propertyList.forEach(prop => {
            const cell = document.createElement("td");
            /*
            cell.textContent = nodes.some(node => 
                extractExtent(node.label).includes(obj) && extractIntent(node.label).includes(prop)
            ) ? "1" : "";
             */

            const hasProperty = nodes.some(node => {
                const nodeExtent = new Set(extractExtent(node.label));
                const nodeIntent = new Set(extractIntent(node.label));
                return nodeExtent.has(obj) && nodeIntent.has(prop);
            });

            cell.textContent = hasProperty ? "x" : "";
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    
    // Clear existing table and insert the new one
    tableContainer.innerHTML = "";
    tableContainer.appendChild(table);
    console.log("✅ Formal Context Table Generated Successfully");
}

// Function to extract Extent (Objects) from the node label
function extractExtent(label) {
    //const match = label.match(/Extent\n\{(.*?)\}/);
    const match = label.match(/Extent\s*\{([\s\S]*?)\}/);
    //return match ? match[1] : "";
    return match ? match[1].split(/,\s*/) : [];
}

// Function to extract Intent (Properties) from the node label
function extractIntent(label) {
    const match = label.match(/Intent\s*\{([\s\S]*?)\}/);
    return match ? match[1].split(/,\s*/) : [];
}
