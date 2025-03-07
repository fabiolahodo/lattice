// src/features/fileUpload.js

// Import necessary functions
import { createLattice } from '../core/lattice.js';
import { extractConceptsFromGraph, computeCanonicalBase } from '../core/canonicalBase.js';
import { calculateMetrics } from '../core/metrics.js'; 
import { setupFilterControls } from '../features/setupFilters.js';
import { parseSerializedData } from '../core/latticeParser.js';

/**
 * Sets up file upload handling and triggers concept lattice generation upon user interaction.
 */

export function setupFileUpload() {

    console.log("Initializing file upload setup...");

    // Get references to the file input, compute button, and results container from the DOM
    const fileInput = document.getElementById('file-upload');
    const loadButton = document.getElementById('load-json-file');
    const computeButton = document.getElementById('compute-canonical-base');
    const resultsContainer = document.getElementById('results');
    const convertButton = document.getElementById("convert-and-download");


     // Debug: Log what elements exist
     console.log("🔍 Checking DOM elements...");
     console.log("📂 fileInput:", fileInput);
     console.log("📂 loadButton:", loadButton);
     console.log("📂 computeButton:", computeButton);
     console.log("📂 resultsContainer:", resultsContainer);
     console.log("📂 convertButton:", convertButton);

     // Debug: Log elements
    console.log("🔍 Checking DOM elements before setup...", {
        fileInput, loadButton, computeButton, resultsContainer
    });

    // Validate elements
    if (!fileInput || !loadButton || !computeButton || !resultsContainer || !convertButton) {
        console.error('File upload elements are missing in the DOM.');
        return;
    }

    console.log("✅ File upload elements exist. Running `setupFileUpload()` now...");

    let uploadedData = null; // Variable to store the uploaded JSON file data

    // File selection event
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0]; // Get the selected file

        // Check if a file was selected
        if (!file) {
            console.warn("⚠️ No file selected. Waiting for a valid upload.");
            return;
        }

        console.log("📂 File selected:", file.name);

        const reader = new FileReader(); // Create a FileReader to read the file

        /**
         * Parses the JSON content from the uploaded file.
         * @param {ProgressEvent} event - The file read event containing the JSON data.
         */
        reader.onload = (event) => {
            try {
                // Parse the uploaded JSON file and store it
                uploadedData = JSON.parse(event.target.result);
                console.log('📂 Successfully loaded JSON Data:', uploadedData);
                
            } catch (error) {
                console.error('Error processing JSON file:', error);
                alert('Invalid JSON file. Please check your file.');
                uploadedData = null; // Reset the data in case of an error
            }
        };

        reader.readAsText(file); // Read the file as text
    });

    // When "Load JSON File" is clicked, load JSON and visualize lattice
    loadButton.addEventListener("click", () => {
        if (!uploadedData) {
            console.warn("⚠️ No file uploaded. Cannot proceed.");
            alert("⚠️ Please upload a JSON file first.");
            return;
        }

        console.log("📊 Computing metrics and visualizing lattice...");

        // Compute metrics and display metrics
        const metrics = calculateMetrics(uploadedData);
    
        // Update metrics in UI
        document.getElementById('total-concepts').textContent = metrics.totalConcepts;
        document.getElementById('total-objects').textContent = metrics.totalObjects;
        document.getElementById('total-attributes').textContent = metrics.totalAttributes;

        // Visualize lattice immediately after clicking load
        createLattice(uploadedData, { container: "#graph-container" });

        // Setup filters
        setupFilterControls(uploadedData);
    });


    /**
     * Compute Canonical Base. Handles the Compute button click event to process the uploaded data.
     */
    computeButton.addEventListener('click', () => {
        
       // const file = fileInput.files[0];

       // Ensure that a file has been uploaded before computing
       if (!uploadedData) {
        console.warn("⚠️ No file uploaded. Cannot compute canonical base.");
        alert('⚠️ Please upload a JSON file first.');
        return;
    }

    try {
        /**
         * Extracts concepts from the uploaded JSON data.
         * @returns {Array} List of extracted concepts (each with extent and intent).
         */
        const concepts = extractConceptsFromGraph(uploadedData);
        console.log('Extracted Concepts:', concepts);

        /**
         * Computes the canonical base (implication rules) for the extracted concepts.
         * @returns {Array} List of implications, each with a premise and conclusion.
         */
        const canonicalBase = computeCanonicalBase(concepts);
        console.log('Computed Canonical Base:', canonicalBase);
        

        /**
         * Displays the computed canonical base in the results section.
         * @param {Array} canonicalBase - The computed implications to display.
         */
        resultsContainer.textContent = JSON.stringify(canonicalBase, null, 2);

    } catch (error) {
        console.error('❌Error computing canonical base:', error);
        alert('❌Error in computation. Please check your file format.');
    }
});

// Convert and Download button click event
convertButton.addEventListener("click", () => {
    if (!uploadedData) {
      console.warn("⚠️ No file uploaded. Cannot proceed with conversion.");
      alert("⚠️ Please upload a JSON file first.");
      return;
    }

    try {
      const parsedData = parseSerializedData(uploadedData);

       //Remove existing download links before creating a new one
       const existingDownloadLink = document.getElementById("download-link");
       if (existingDownloadLink) {
           existingDownloadLink.remove();
       }

       //Create a new download link and add it properly Trigger download for parsed data
      const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'parsedLattice.json';
      downloadLink.id = "download-link"; // Assign an ID to track the download link

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      console.log('✅ Parsed data downloaded successfully.');
    } catch (error) {
      console.error('❌ Error converting the file:', error);
      alert('❌ Conversion failed. Please ensure the file format is correct.');
    }
  });
        /*const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const graphData = JSON.parse(event.target.result);
                console.log('Graph Data:', graphData);

                // Additional logic for processing the uploaded file
            } catch (error) {
                console.error('Error reading or processing file:', error);
                alert('Invalid JSON file.');
            }
        };

        reader.readAsText(file);
    });*/


}
