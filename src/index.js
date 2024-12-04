// src/index.js 

// Import necessary dependencies
import { createLattice } from './core/lattice.js';
import { GRAPH_CONFIG } from './core/config.js';

document.addEventListener('DOMContentLoaded', () => {
  // Get the dataset path from the script tag's data-dataset attribute
  const scriptTag = document.querySelector('script[data-dataset]');
  const datasetPath = scriptTag?.getAttribute('data-dataset');
 

  if (!datasetPath) {
    console.error('Dataset path not provided in the script tag.');
    return; // Stop execution if dataset path is missing
  }

  /* Fetch graph data from the specified JSON file
  fetch(datasetPath)
    .then(response => {
     // Check if the response is valid
     if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }
    return response.json() // Parse JSON data
  })
    .then(graphData => {
      const { width, height } = GRAPH_CONFIG.dimensions;

       // Create the concept lattice graph
       const { svg } = createLattice(graphData, {
        container: '#graph-container', // Specify the graph container that matches the ID in your HTML
        width,
        height,
      });

      // Adjust the height of the container dynamically based on the graph size
      const graphContainer = document.getElementById('graph-container');
      //const svg = document.querySelector('#graph-container svg'); // Select the SVG element created for the graph
      
        if (svg) {
          const bbox = svg.getBBox(); // Get bounding box of the graph
          //const { width, height } = bbox; 
          const padding = GRAPH_CONFIG.dimensions.padding;

          //const { width: bboxWidth, height: bboxHeight } = bbox;

        // Dynamically adjust the container and SVG sizes
        graphContainer.style.height = `${bbox.height + padding * 2}px`; // Add some padding to avoid cuts
        svg.setAttribute('width', bbox.width + padding * 2); // Adjust SVG width with padding
        svg.setAttribute('height', bbox.height + padding * 2); // Adjust SVG height with padding
      }
    })
      .catch(error => {
      console.error('Error loading graph data:', error);
    });*/

    fetch(datasetPath)
        .then((res) => res.json())
        .then((data) => createLattice(data, { container: '#graph-container', ...GRAPH_CONFIG.dimensions }))
        .catch((err) => console.error('Error loading data:', err));
});
