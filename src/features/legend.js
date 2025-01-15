// src/features/legend.js

/**
 * Updates the legend dynamically based on the color coding of the nodes.
 */
export function updateLegend() {
    const legendContainer = document.getElementById('legend');
  
    // Clear the existing legend
    legendContainer.innerHTML = '';
  
    // Define the color mapping for the legend
    const legendItems = [
      { color: 'orange', label: 'Matches both extent and intent' },
      { color: 'green', label: 'Matches extent' },
      { color: 'gray', label: 'Matches intent' },
      { color: 'blue', label: 'No match' },
    ];
  
    // Dynamically create legend items
    legendItems.forEach((item) => {
      const legendItem = document.createElement('li');
  
      // Create the color indicator
      const colorIndicator = document.createElement('span');
      colorIndicator.style.backgroundColor = item.color;
  
      // Create the label text
      const label = document.createTextNode(item.label);
  
      // Append color indicator and label to the legend item
      legendItem.appendChild(colorIndicator);
      legendItem.appendChild(label);
  
      // Append the legend item to the legend container
      legendContainer.appendChild(legendItem);
    });
  }
  