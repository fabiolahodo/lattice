// src/features/export.js

// Import dependencies
import { jsPDF } from "jspdf";

/**
 * Exports the given concept lattice visualization as a PDF file.
 * @param {SVGElement} svgElement - The SVG element containing the concept lattice visualization.
 */
export function exportAsPDF(svgElement) {
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svgElement);

    // Convert SVG to a canvas element for rasterization
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = function () {
        // Set canvas dimensions to match the SVG image
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Create a new PDF document
        const pdf = new jsPDF({
            orientation: img.width > img.height ? "landscape" : "portrait",
            unit: "px",
            format: [canvas.width, canvas.height] // Match canvas dimensions
        });

        // Add the canvas content as an image to the PDF
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);

        // Save the PDF file
        pdf.save("concept_lattice.pdf");
    };

    // Convert SVG string to a base64 data URL and set it as the image source
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

/**
 * Exports the given concept lattice graph data as a JSON file.
 * @param {Object} graphData - The graph data containing nodes and links.
 */
export function exportAsJSON(graphData) {
    const jsonStr = JSON.stringify(graphData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "concept_lattice.json";
    a.click();
}

/**
 * Exports the given SVG element as a PNG image.
 * @param {SVGElement} svgElement - The SVG element containing the concept lattice visualization.
 */
export function exportAsPNG(svgElement) {
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svgElement);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "concept_lattice.png";
        link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

/**
 * Exports the given concept lattice graph data as a CSV file.
 * @param {Object} graphData - The graph data containing nodes and links.
 */
export function exportAsCSV(graphData) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Node ID,Label\n";

    graphData.nodes.forEach(node => {
        csvContent += `${node.id},${node.label}\n`;
    });

    csvContent += "\nSource,Target\n";

    graphData.links.forEach(link => {
        csvContent += `${link.source.id},${link.target.id}\n`;
    });

    const a = document.createElement("a");
    a.href = encodeURI(csvContent);
    a.download = "concept_lattice.csv";
    a.click();
}
