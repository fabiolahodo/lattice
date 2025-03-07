//import { jsPDF } from "jspdf";

/**
 * Disable the dropdown while exporting to prevent multiple clicks.
 */
function disableExportDropdown() {
    const saveAsDropdown = document.getElementById('save-as');
    if (saveAsDropdown) saveAsDropdown.disabled = true;
}

/**
 * Enable the dropdown after exporting with a small delay.
 * This ensures users cannot trigger multiple downloads at once.
 */
function enableExportDropdown() {
    setTimeout(() => {
        const saveAsDropdown = document.getElementById('save-as');
        if (saveAsDropdown) 
            saveAsDropdown.disabled = false;
            saveAsDropdown.value = ""; // ✅ Reset dropdown after re-enabling
    }, 500); // 500ms delay to prevent accidental multiple clicks
}

/**
 * Export the lattice visualization as a PNG image.
 * @param {SVGElement} svgElement - The SVG element representing the lattice.
 */
export function exportAsPNG(svgElement) {
    if (!svgElement) {
        console.error("❌ exportAsPNG: No SVG element found!");
        alert("Error: No lattice visualization to export.");
        return;
    }

    disableExportDropdown(); // Prevent multiple clicks while exporting

    console.log("📌 Running exportAsPNG function...");

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Get SVG dimensions
    const { width, height } = svgElement.getBoundingClientRect();
    console.log(`📌 SVG Dimensions - Width: ${width}, Height: ${height}`);

    // Prevent exporting if SVG has zero dimensions
    if (width === 0 || height === 0) {
        console.error("❌ SVG has zero width or height! Cannot export.");
        alert("Error: Lattice visualization is not properly rendered.");
        enableExportDropdown();
        return;
    }

    canvas.width = width || 800;
    canvas.height = height || 600;

    // Clone the SVG to avoid modifying the original one
    const clonedSvg = svgElement.cloneNode(true);

    // Create a white background rectangle to prevent transparent or black background
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", "white");

    // Insert the white background at the beginning of the SVG
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);

    // Convert SVG to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);

    // Encode the SVG as a Base64 image
    const encodedSvgString = btoa(unescape(encodeURIComponent(svgString)));
    const img = new Image();

    img.onload = function () {
        console.log("✅ Image loaded, drawing on canvas...");

        // Fill canvas background with white before drawing the image
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);

        // Generate PNG and trigger download
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = "concept_lattice.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        console.log("✅ PNG downloaded successfully with white background!");
        enableExportDropdown(); // Re-enable dropdown after export
    };

    img.onerror = function () {
        console.error("❌ Error loading SVG as an image.");
        alert("Error: Unable to export SVG as PNG.");
        enableExportDropdown();
    };

    img.src = "data:image/svg+xml;base64," + encodedSvgString;
}

/**
 * Export the lattice data as a minimal JSON file.
 * Only includes ID, Label, and Level.
 * @param {Object} graphData - The data of the lattice graph.
 */

export function exportAsJSON(graphData) {
    if (!graphData) {
        console.error("❌ exportAsJSON: No graph data found!");
        alert("Error: No lattice data to export.");
        return;
    }

    disableExportDropdown(); // Prevent multiple downloads at once

    console.log("📌 Exporting minimal JSON (ID, Label, Level)...");

    // Function to remove circular references
    function removeCircularReferences(obj, seen = new WeakSet()) {
        if (obj !== null && typeof obj === "object") {
            if (seen.has(obj)) {
                return "[Circular]"; // Replace circular reference with a string
            }
            seen.add(obj);
            const newObj = Array.isArray(obj) ? [] : {};
            for (let key in obj) {
                newObj[key] = removeCircularReferences(obj[key], seen);
            }
            return newObj;
        }
        return obj;
    }

    // Extract only necessary fields (ID, Label, Level)
    function extractMinimalData(obj) {
        return obj.nodes.map(node => ({
            id: node.id,
            label: node.label || "",
            level: node.level || 0
        }));
    }

    const minimalData = extractMinimalData(graphData);
    const sanitizedData = removeCircularReferences(minimalData);

    // Convert data to a downloadable JSON file
    const jsonBlob = new Blob([JSON.stringify(sanitizedData, null, 2)], { type: "application/json" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(jsonBlob);
    downloadLink.download = "concept_lattice_minimal.json";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    console.log("✅ Minimal JSON exported successfully!");
    enableExportDropdown(); // Re-enable dropdown after export
}

/**
 * Converts lattice data to CSV format and triggers a download.
 * @param {Object} graphData - The lattice graph data.
 */
export function exportAsCSV(graphData) {
    if (!graphData) {
        console.error("❌ exportAsCSV: No graph data found!");
        alert("Error: No lattice data to export.");
        return;
    }

    disableExportDropdown(); // Prevent multiple triggers

    console.log("📌 Exporting lattice as CSV...");

    // Extract only ID, Label, and Level for CSV format
    function extractMinimalData(obj) {
        return obj.nodes.map(node => ({
            id: node.id,
            label: node.label || "",
            level: node.level || 0
        }));
    }

    const minimalData = extractMinimalData(graphData);

    // Convert data to CSV format
    const csvContent = [
        ["ID", "Label", "Level"], // Header row
        ...minimalData.map(node => [node.id, node.label, node.level]) // Data rows
    ]
    .map(row => row.join(",")) // Convert each row to CSV format
    .join("\n"); // Separate rows with new lines

    // Create a downloadable CSV file
    const csvBlob = new Blob([csvContent], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(csvBlob);
    downloadLink.download = "concept_lattice.csv";

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    console.log("✅ CSV exported successfully!");
    enableExportDropdown(); // Re-enable dropdown after export
}

/**
 * Export the lattice visualization as a PDF file.
 * @param {SVGElement} svgElement - The SVG element representing the lattice.
 */
const { jsPDF } = window.jspdf; // ✅ Use global jsPDF from CDN

export function exportAsPDF(svgElement) {
    if (!svgElement) {
        console.error("❌ exportAsPDF: No SVG element found!");
        alert("Error: No lattice visualization to export.");
        return;
    }

    disableExportDropdown(); // Prevent multiple clicks

    console.log("📌 Running exportAsPDF function...");

    const { width, height } = svgElement.getBoundingClientRect();
    console.log(`📌 SVG Dimensions - Width: ${width}, Height: ${height}`);

    if (width === 0 || height === 0) {
        console.error("❌ SVG has zero width or height! Cannot export.");
        alert("Error: Lattice visualization is not properly rendered.");
        enableExportDropdown();
        return;
    }

    // ✅ Convert SVG to Canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    // ✅ Clone SVG and add white background
    const clonedSvg = svgElement.cloneNode(true);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "0");
    rect.setAttribute("y", "0");
    rect.setAttribute("width", width);
    rect.setAttribute("height", height);
    rect.setAttribute("fill", "white");
    clonedSvg.insertBefore(rect, clonedSvg.firstChild);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const encodedSvgString = btoa(decodeURIComponent(encodeURIComponent(svgString)));
    const img = new Image();

    img.onload = function () {
        console.log("✅ Image loaded, drawing on canvas...");

        // ✅ Draw the image onto the canvas
        context.fillStyle = "white";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);

        // ✅ Convert Canvas to Image for PDF
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: width > height ? "landscape" : "portrait",
            unit: "px",
            format: [width, height] // Match the PDF size to the image
        });

        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save("concept_lattice.pdf");

        console.log("✅ PDF downloaded successfully!");
        enableExportDropdown();
    };

    img.onerror = function () {
        console.error("❌ Error loading SVG as an image.");
        alert("Error: Unable to export SVG as PDF.");
        enableExportDropdown();
    };

    img.src = "data:image/svg+xml;base64," + encodedSvgString;
}

