import { createLattice } from './core/lattice.js';

document.addEventListener('DOMContentLoaded', () => {
  // Get the dataset path from the script tag's data-dataset attribute
  const scriptTag = document.querySelector('script[data-dataset]');
  const datasetPath = scriptTag?.getAttribute('data-dataset');
 

  if (!datasetPath) {
    console.error('Dataset path not provided in the script tag.');
    return;
  }

  // Fetch graph data from the specified JSON file
  fetch(datasetPath)
    .then(response => response.json())
    .then(graphData => {
      createLattice(graphData, {
        container: '#graph-container', // Matches the ID in your HTML
        width: 800,
        height: 600,
      });
    })
    .catch(error => {
      console.error('Error loading graph data:', error);
    });
});
