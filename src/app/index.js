// src/index.js 

// Import necessary dependencies
import { createLattice, filterLattice } from '../core/lattice.js';
import { GRAPH_CONFIG } from '../core/config.js';
import { setupFilterControls } from '../features/setupFilters.js';
import { updateLegend } from '../features/legend.js';
import { extractConceptsFromGraph, computeCanonicalBase } from '../core/canonicalBase.js';
import { setupFileUpload } from '../features/fileUpload.js';
import { calculateMetrics } from '../core/metrics.js';
import { updateLabels } from '../core/rendering.js';
import { computeSuperSubConcepts } from '../core/interactivity.js';
import * as d3 from 'd3';

let originalGraphData = null; // Store uploaded dataset for later processing (ex. filtering)

/**
 * Handles dataset visualization after file upload or predefined dataset.
 * @param {Object} jsonData - The parsed JSON graph data.
 */

function visualizeDataset(jsonData) {
  try {
     console.log('Loaded dataset:', jsonData);

     if (!jsonData || !jsonData.nodes || !jsonData.links) {
      console.error("❌ visualizeDataset: Invalid dataset structure!", jsonData);
      alert("Error: Dataset structure is invalid.");
      return;
  }

     originalGraphData = jsonData; // Store dataset for filtering.

     // Ensure each node has a valid extent/intent
     jsonData.nodes.forEach(node => {
      const parsed = parseNodeLabel(node);
      node.extent = parsed.extent;
      node.intent = parsed.intent;

      // Debugging: Log each node after parsing
      console.log(`🔍 Node ${node.id} Parsed Label:`, node.label, "| Extent:", node.extent, "| Intent:", node.intent);

  });

     // Compute Superconcepts and Subconcepts first
     console.log("📌 Computing superconcepts and subconcepts...");
     computeSuperSubConcepts(jsonData);

      // Compute reduced labels after ensuring relationships
      console.log("📌 Computing reduced labels...");   
      computeReducedLabels(jsonData.nodes, jsonData.links);

      // Create the concept lattice visualization
      createLattice(jsonData, { container: '#graph-container' });

      // Compute and display metrics
      const metrics = calculateMetrics(jsonData);
      document.getElementById('total-concepts').textContent = metrics.totalConcepts;
      document.getElementById('total-objects').textContent = metrics.totalObjects;
      document.getElementById('total-attributes').textContent = metrics.totalAttributes;

      // Set up legend and filtering controls after visualization
      updateLegend();
      setupFilterControls(originalGraphData);

  } catch (err) {
      console.error('Error visualizing dataset:', err);
      alert('❌ Error processing dataset. Please check the uploaded file.');
  }
}

/**
* Checks if a dataset is provided via `data-dataset` in `index.html`.
* If provided, loads it automatically.
*/
function checkForPreloadedDataset() {
  // Get the dataset path from the script tag's data-dataset attribute
  const scriptTag = document.querySelector('script[data-dataset]');
  const datasetPath = scriptTag?.getAttribute('data-dataset');
 
// Ensure dataset path is provided
  if (datasetPath) {
    console.error('Preloading dataset from: ${datasetPath}');
 

  // Fetch graph data from the specified JSON file
  fetch(datasetPath)
    .then(response => {
     // Check if the response is valid
     if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }
    return response.json() // Parse JSON data
  })
  .then((data) => 
    {
      visualizeDataset(data); // Load dataset into visualization
  })
  .catch((err) => {
    console.error('Error loading preloaded dataset:', err);
});

} else {
  console.log("No predefined dataset found. Waiting for file upload.");
}
}


/**
 * Initializes the application on DOM load.
 */
document.addEventListener('DOMContentLoaded', () => {
  
  console.log("📌 DOM fully loaded.");

  // First check if a dataset exists in `index.html`
  checkForPreloadedDataset(); 

  setTimeout(() => {
    console.log("🔍 Checking for file upload elements before setup...");
    setupFileUpload(); // Ensure DOM elements exist before setup
}, 500);
  console.log("✅ Initializing file upload...");

  setupFileUpload(); // Enable file upload functionality. Runs only when the DOM is ready
 
  // Labeling mode change handler
  const labelModeSelector = document.getElementById('labeling-mode');
  if (labelModeSelector) {
      labelModeSelector.addEventListener('change', () => {
          const selectedMode = labelModeSelector.value;
          console.log(`🔄 Switching Labeling Mode to: ${selectedMode}`);
          
          // Ensure nodes and labels exist before updating
          const svg = d3.select('svg');
          const labelGroup = svg.selectAll('.node-label');
          if (!labelGroup.empty()) {
              updateLabels(selectedMode, labelGroup);
          }
      });
  }
  /*
  waitForElement('#file-upload', () => {
    console.log("✅ File upload elements exist. Running `setupFileUpload()` now...");
    setupFileUpload();
  });
  */
});

/**
 * Waits for a DOM element to exist before executing a callback.
 * @param {string} selector - The CSS selector of the element to wait for.
 * @param {Function} callback - The function to execute once the element is found.
 */
function waitForElement(selector, callback) {
  const maxRetries = 20; // Wait up to 2 seconds (100ms x 20 retries)
  let attempts = 0;

  const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
          console.log(`✅ Element ${selector} found.`);
          clearInterval(interval);
          callback();
      } else {
          attempts++;
          if (attempts >= maxRetries) {
              clearInterval(interval);
              console.error(`❌ Element ${selector} not found after ${maxRetries} retries.`);
          }
      }
  }, 100);
}
