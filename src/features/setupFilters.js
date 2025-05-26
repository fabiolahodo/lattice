// src/features/setupFilters.js

import { createLattice, filterLattice } from '../core/lattice.js';
import { updateLegend } from './legend.js';

/**
 * Sets up the filtering controls and handles the filtering process.
 * 
 * @param {Object} originalGraphData - The original unfiltered graph data.
 */
export function setupFilterControls(originalGraphData) {
  // Ensure the required elements exist in the DOM
  const objectFilterInput = document.getElementById('object-filter');
  const attributeFilterInput = document.getElementById('attribute-filter');
  const applyFiltersButton = document.getElementById('apply-filters');
  const labelingModeSelector = document.getElementById('labeling-mode');

  if (!objectFilterInput || !attributeFilterInput || !applyFiltersButton || !labelingModeSelector) {
    console.error('Filter controls or labeling mode selector are missing in the DOM.');
    return;
  }

  // Add event listener to the "Apply Filters" button
  applyFiltersButton.addEventListener('click', () => {
    // Get the object filter values from the input field
    const objectFilter = objectFilterInput.value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');

    // Get the attribute filter values from the input field
    const attributeFilter = attributeFilterInput.value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item !== '');

    const selectedLabelingMode = labelingModeSelector.value;
    
    console.log('Filter Criteria:', { objectFilter, attributeFilter, selectedLabelingMode });

    try {
      // Highlight nodes based on the specified filters
      const updatedData = filterLattice(originalGraphData, {
        objectFilter,
        attributeFilter,
      });

      // Re-render the lattice visualization with the updated colors
      createLattice(updatedData, { container: '#graph-container' });

       // After graph created, update labels according to mode
       if (typeof window.updateLabels === "function") {
        window.updateLabels(selectedLabelingMode);
      } else {
        console.error('updateLabels function is not defined.');
      }

      // Update the legend
      updateLegend();
      
    } catch (error) {
      console.error('Error during filtering:', error);
    }
  });
}

/**
 * Dynamically creates the filter UI elements and appends them to the DOM.
 * This function is optional and can be used to generate the filter inputs programmatically.
 */
function createFilterUI() {
    const filterContainer = document.createElement('div');
    filterContainer.id = 'filters';
  
    const objectFilterInput = document.createElement('input');
    objectFilterInput.id = 'object-filter';
    objectFilterInput.type = 'text';
    objectFilterInput.placeholder = 'Filter by objects (comma-separated)';
  
    const attributeFilterInput = document.createElement('input');
    attributeFilterInput.id = 'attribute-filter';
    attributeFilterInput.type = 'text';
    attributeFilterInput.placeholder = 'Filter by attributes (comma-separated)';
  
    const applyFiltersButton = document.createElement('button');
    applyFiltersButton.id = 'apply-filters';
    applyFiltersButton.textContent = 'Apply Filters';
  
    filterContainer.appendChild(objectFilterInput);
    filterContainer.appendChild(attributeFilterInput);
    filterContainer.appendChild(applyFiltersButton);
  
    document.body.insertBefore(filterContainer, document.getElementById('graph-container'));
  }
  
  // Programmatically add the filter UI
  //createFilterUI();