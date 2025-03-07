//src/core/lattice.js

// Import dependencies
import * as d3 from 'd3';
import { renderGraph, centerGraph  } from './rendering.js';
//import { createSimulation } from './simulation.js';
import { addInteractivity, addNodeInteractivity, computeSuperSubConcepts, updateLinks } from './interactivity.js';
import { GRAPH_CONFIG } from './config.js'; 
import { calculateMetrics } from './metrics.js';
import { computeCanonicalBase } from './canonicalBase.js';
import { setupFilterControls } from '../features/setupFilters.js'; 
import { computeReducedLabels, formatLabel } from './reducedLabeling.js';
import { assignLayers, orderVerticesWithinLayers } from './layering.js';
import { exportAsJSON, exportAsPNG, exportAsCSV, exportAsPDF } from '../features/export.js';


/**
 * Attach the export functionality to the dropdown menu
 * Ensures only one event listener is active at a time.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {SVGElement} svgElement - The SVG element representing the visualization.
 */

export function addExportOptions(graphData, svgElement) {
const saveAsDropdown = document.getElementById('save-as');

// ✅ Remove any existing event listeners before adding a new one
saveAsDropdown.replaceWith(saveAsDropdown.cloneNode(true)); // **This removes all old event listeners**
    
const newSaveAsDropdown = document.getElementById('save-as'); // Re-fetch after replacing

// ✅ Add event listener with correct graphData reference
newSaveAsDropdown.addEventListener('change', (event) => handleExportSelection(event, graphData));

}


/**
 * Handles the dropdown selection and triggers the correct export function.
 * @param {Event} event - The dropdown selection event.
 * @param {Object} graphData - The lattice graph data.
 */

function handleExportSelection(event, graphData) {
    const selectedOption = document.getElementById('save-as').value;
    console.log(`🔹 Selected export option: ${selectedOption}`);

    if (selectedOption === "export-json") {
      console.log("✅ Exporting as JSON...");
      exportAsJSON(graphData);
  } else if (selectedOption === "export-png") {
        console.log("✅ Exporting as PNG...");
        const svgElement = document.querySelector("#graph-container svg");

        if (!svgElement) {
            console.error("❌ No SVG element found for export.");
            alert("Error: No lattice visualization found.");
            return;
        }

        exportAsPNG(svgElement);
    }
    else if (selectedOption === "export-csv") {
      console.log("✅ Exporting as CSV...");
      exportAsCSV(graphData);
  } else if (selectedOption === "export-pdf") {
    console.log("✅ Exporting as PDF...");
    const svgElement = document.querySelector("#graph-container svg");

    if (!svgElement) {
        console.error("❌ No SVG element found for export.");
        alert("Error: No lattice visualization found.");
        return;
    }

    exportAsPDF(svgElement);
}

    // ✅ Reset dropdown after an export is triggered (prevents double execution)
    event.target.value = ""; // Reset selection to prevent re-triggering

}


/**
 * Extracts `Extent` and `Intent` from the `label` property of a node.
 * @param {Object} node - The node object containing the `label`.
 * @returns {Object} - An object with `extent` and `intent` arrays.
 */
function parseNodeLabel(node) {

  if (!node || typeof node !== "object") {
    console.error("❌ Error: Invalid node passed to parseNodeLabel:", node);
    return { extent: [], intent: [] }; // Default empty return to avoid issues
}

if (!node.label) {
  console.warn(`⚠️ Warning: Node ${node.id} has no label.`);
}

  const label = node.label || '';
  const extentMatch = label.match(/Extent\s*\{([^}]*)\}/); // Extract Extent
  const intentMatch = label.match(/Intent\s*\{([^}]*)\}/); // Extract Intent

  
  const extent = extentMatch
      ? extentMatch[1].split(',').map(item => item.trim()).filter(item => item !== '') // Split and trim
      : [];

  const intent = intentMatch
      ? intentMatch[1].split(',').map(item => item.trim()).filter(item => item !== '') // Split and trim
      : [];


   // ✅ Ensure at least empty arrays to avoid undefined errors
   node.extent = extent.length > 0 ? extent : [];
   node.intent = intent.length > 0 ? intent : [];
      
  console.log(`✅ Parsed label for node ${node.id}:`, { extent: node.extent, intent: node.intent });
  return { extent: node.extent, intent: node.intent };
 }

/**
 * Ensures each node has a valid label.
 * If `label` is missing, assigns `"Concept {id}"` as a fallback.
 */
function ensureNodeLabels(graphData) {
  graphData.nodes.forEach(node => {
      if (!node.label) {
          node.label = `Concept ${node.id}`;
      }
  });
}

/**
 * Computes the canonical base (Duquenne–Guigues Base) for a concept lattice.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @returns {Array} - The canonical base as an array of implications.
 */
export function generateCanonicalBase(graphData) {
  // Extract concepts from nodes
  const concepts = graphData.nodes.map(node => parseNodeLabel(node));

  // Compute the canonical base
  const canonicalBase = computeCanonicalBase(concepts);
  console.log('Canonical Base:', canonicalBase);

  return canonicalBase;
}

/**
 * Test function for dynamically loaded graph data.
 * @param {string} filePath - Path to the JSON file containing graph data.
 */
export async function testCanonicalBaseDynamic(filePath) {
  try {
    // Dynamically load the graph data from the specified file
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load file: ${filePath}`);
    }

    const graphData = await response.json();

    // Generate and log the canonical base
    const result = generateCanonicalBase(graphData);
    console.log('Canonical Base (Dynamic):', result);
  } catch (error) {
    console.error('Error loading and testing canonical base:', error);
  }
}

/**
 * Creates a concept lattice based on the provided graph data.
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} options - Configuration options for the graph.
 * @returns {Object} - The SVG and simulation instances for further use.
 */
export function createLattice(graphData, options = {}) {
  //const { container = 'body', width = 800, height = 600 } = options;
  console.log("🚀 Creating Lattice Visualization...");

  // Merge options with defaults from the config file
  const { container = 'body', width, height } = {
    ...GRAPH_CONFIG.dimensions,
    ...options,
};
   
  // Validate graph data
   if (!graphData || !graphData.nodes || !graphData.links) {
    throw new Error('⚠️Invalid graphData. Ensure it includes nodes and links.');
  }

  console.log("📌 Assigning Layers...");
  const layers = assignLayers(graphData);
  graphData.layers = layers;  // Store layers inside graphData


console.log("📌 Ordering Nodes Within Layers...");
orderVerticesWithinLayers(layers, graphData);  // Optimize horizontal positioning

  console.log("📌 Assigning X & Y positions...");
  // Set y-coordinates for nodes based on their assigned layers
  const layerSpacing = height / (layers.length + 1);

  layers.forEach((layer, layerIndex) => {
    const xSpacing = (width - 2 * GRAPH_CONFIG.dimensions.padding) / (layer.length + 1);
      layer.forEach((node, nodeIndex) => {
          node.y = GRAPH_CONFIG.dimensions.padding + layerIndex * layerSpacing; // Assign vertical spacing based on layer index
          node.x = GRAPH_CONFIG.dimensions.padding +(nodeIndex + 1) * xSpacing; // Horizontal spacing
          //node.layer = layerIndex; // Add layer information for constraints
      });
  });


  console.log("📌 Computing Superconcepts and Subconcepts...");
  computeSuperSubConcepts(graphData);  // Ensure correct hierarchical relationships

  // ✅ Compute reduced labels before rendering
  computeReducedLabels(graphData.nodes, graphData.links);

  // Calculate metrics and log them
  const metrics = calculateMetrics(graphData);
  console.log('Metrics:', metrics);

  // Update metrics in the DOM
  updateMetricsInDOM(metrics);

  // Update Filtering
  setupFilterControls(graphData);

   // Clear existing graph content before rendering the new graph
   const containerElement = d3.select(container);
   containerElement.selectAll('svg').remove();
  
  // Render the graph using dynamic dimensions and get the SVG elements
  const { svg, linkGroup, nodeGroup, labelGroup } = renderGraph(container, graphData, { width, height });
  
  // ✅ Ensure svg and nodeGroup exist before adding interactivity
  if (!svg || nodeGroup.empty()) {
    console.error("❌ SVG or nodeGroup is undefined! Cannot add interactivity.");
    return;
  }
  // Add interactivity after creating the simulation
  //addInteractivity(svg, simulation);

  // ✅ Pass correct arguments to `addInteractivity` and `addNodeInteractivity`
  addInteractivity(svg, graphData);

  // Add node-specific interactivity (hover, click, shortest path, etc.)
  addNodeInteractivity(nodeGroup, linkGroup, graphData, updateLinks);

 // Dynamically center the graph
 //const graphGroup = svg.select('.graph-transform');
 setTimeout(() => {
  const bbox = svg.select('.graph-transform').node().getBBox();
  centerGraph(svg, { width, height, padding: GRAPH_CONFIG.dimensions.padding, bbox });
 }, 100);

  // Add export options after rendering
  addExportOptions(graphData);

  // Return the SVG and metrics for further use
  return { svg, metrics };
}


/**
 * Updates the metrics in the DOM.
 * @param {Object} metrics - The metrics to display.
 */
// Function to update metrics in the DOM
function updateMetricsInDOM(metrics) {
  // Update the total count of concepts, objects, and attributes in the UI
  document.getElementById('total-concepts').textContent = metrics.totalConcepts;
  document.getElementById('total-objects').textContent = metrics.totalObjects;
  document.getElementById('total-attributes').textContent = metrics.totalAttributes;
  document.getElementById('lattice-density').textContent = metrics.density;
  document.getElementById('lattice-stability').textContent = metrics.averageStability;
}


/**
 * Finds the shortest path between two nodes using Breadth-First Search (BFS).
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {string} startNodeId - ID of the starting node.
 * @param {string} endNodeId - ID of the ending node.
 * @returns {Array} - The shortest path as an array of node IDs, or an empty array if no path exists.
 */
export function findShortestPath(graphData, startNodeId, endNodeId) {
  const adjacencyList = new Map();

  // Build adjacency list
  graphData.links.forEach((link) => {
    if (!adjacencyList.has(link.source.id)) adjacencyList.set(link.source.id, []);
    if (!adjacencyList.has(link.target.id)) adjacencyList.set(link.target.id, []);
    adjacencyList.get(link.source.id).push(link.target.id);
    adjacencyList.get(link.target.id).push(link.source.id);
  });

  // BFS setup
  const visited = new Set();
  const queue = [[startNodeId]];

  while (queue.length > 0) {
    const path = queue.shift();
    const currentNode = path[path.length - 1];

    // Return the path if the end node is reached
    if (currentNode === endNodeId) return path;

    if (!visited.has(currentNode)) {
      visited.add(currentNode);

      // Add unvisited neighbors to the queue
      const neighbors = adjacencyList.get(currentNode) || [];
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) queue.push([...path, neighbor]);
      });
    }
  }

  // Return an empty array if no path exists
  return [];
}

/**
 * Filters the lattice graph data based on the provided filter criteria.
 * 
 * @param {Object} graphData - The graph data containing nodes and links.
 * @param {Object} filterCriteria - An object with `objectFilter` and `attributeFilter` arrays.
 * @returns {Object} - A filtered graph data object with updated nodes and links.
 */
export function filterLattice(graphData, filterCriteria) {
  
  if (!graphData || !graphData.nodes || !graphData.links) {
    throw new Error('Invalid graphData: Ensure it includes nodes and links.');
  }
  // Destructure object and attribute filters from the filter criteria
  const { objectFilter, attributeFilter } = filterCriteria;

  console.log('Graph Data Before Filtering:', graphData); // Debugging log
  console.log('Filter Criteria:', filterCriteria); // Debugging log

   // Update node colors based on the filtering criteria
   graphData.nodes.forEach((node) => {
    const extentMatch = objectFilter
      ? objectFilter.some((obj) => node.label.includes(obj))
      : false;
    const intentMatch = attributeFilter
      ? attributeFilter.some((attr) => node.label.includes(attr))
      : false;

    // Set color based on matching extent or intent
    if (extentMatch && intentMatch) {
      node.color = 'orange'; // Highlight nodes matching both criteria
    } else if (extentMatch) {
      node.color = 'green'; // Highlight nodes matching extent
    } else if (intentMatch) {
      node.color = 'gray'; // Highlight nodes matching intent
    } else {
      node.color = 'blue'; // Default color for nodes not matching
    }
  });

  // Filter the nodes based on the extent (objects) and intent (attributes)
  const filteredNodes = graphData.nodes.filter((node) => {
    // Check if the node's extent matches all specified object filters
    const extentMatch = objectFilter
      ? objectFilter.every(obj => node.label.includes(obj)) // Ensure every object in the filter is present in the node's label
      : true; // If no filter is provided, allow all nodes
    
    // Check if the node's intent matches all specified attribute filters
    const intentMatch = attributeFilter
      ? attributeFilter.every(attr => node.label.includes(attr)) // Ensure every attribute in the filter is present in the node's label
      : true; // If no filter is provided, allow all nodes
    
    /* Include the node only if it matches both the extent and intent filters
    return extentMatch && intentMatch;
    */
   
   // Keep all nodes and links
  return { nodes: graphData.nodes, links: graphData.links };
  });

  // Create a set of IDs for the filtered nodes for easy lookup
  const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

  // Filter the links to include only those that connect filtered nodes
  const filteredLinks = graphData.links.filter(
    link =>
      filteredNodeIds.has(link.source.id) && // Check if the source node is in the filtered set
      filteredNodeIds.has(link.target.id)   // Check if the target node is in the filtered set
  );
  
  console.log('Filtered Nodes:', filteredNodes); // Debugging log
  console.log('Filtered Links:', filteredLinks); // Debugging log
  
  // Return the filtered graph data with updated nodes and links
  return { nodes: filteredNodes, links: filteredLinks };
}
