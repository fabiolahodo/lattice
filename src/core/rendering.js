//src/core/rendering.js 

// Import necessary dependencies
import { select } from 'd3-selection';
import * as d3 from 'd3';
import { addNodeInteractivity } from './interactivity.js';
import { GRAPH_CONFIG } from './config.js';

/**
 * Renders the graph with nodes and links
 * @param {string} container - The CSS selector for the container
 * @param {Object} graphData - The graph data containing nodes and links
 * @param {Object} options - Options for width and height of the SVG
 * @returns {Object} - References to the SVG and groups created
 */

export function renderGraph(container, graphData, options) {
  //const { width, height } = options; // Destructure options for width and height
  
  const { width, height, padding } = { ...GRAPH_CONFIG.dimensions, ...options };

  /* Validate graph data
  if (!graphData || !graphData.nodes || !graphData.links) {
    console.error('Invalid graph data:', graphData);
    return;
  }

  // Dynamically calculate the size of the SVG container
  const containerNode = d3.select(container).node(); // Select the container element
  const containerRect = containerNode.getBoundingClientRect() || { width, height }; // Get the dimensions (width/height) of the container
 
  // Ensure containerRect dimensions are valid
  if (!containerRect || containerRect.width === 0 || containerRect.height === 0) {
    console.error('Invalid container dimensions:', containerRect);
    return;
  }
  
  const svgWidth = containerRect.width || width; // Use container width or fallback to viewport width
  const svgHeight = containerRect.height || height; // Use container height or fallback to viewport height

  // Dynamically calculate padding based on the size of the graph (number of nodes)
  const dynamicPadding = Math.max(padding, Math.sqrt(graphData.nodes.length || 1) * 10); // Scale padding to fit graph dynamically
*/

// Calculate dynamic node radius based on graph size
const dynamicRadius = Math.max(
  GRAPH_CONFIG.node.minRadius,
  Math.min(
    GRAPH_CONFIG.node.maxRadius,
    50 / Math.sqrt(graphData.nodes.length || 1) // Scale inversely with node count
  )
);

  // Create SVG element in the specified container
  const svg = d3.select(container)
    .append('svg') // Append an SVG element to the container
      .attr('width', width) // Set dynamic width
      .attr('height', height) // Set dynamic height
      .style('overflow', 'visible'); // Allow content to overflow the container if needed)

  //Create a <g> group element to center and transform the graph
  const g = svg.append('g')
    .attr('class', 'graph-transform')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
    // Draw links
  const linkGroup = g.selectAll('.link')
    .data(graphData.links) // Bind the links data
    .enter() // Process each link in the data
    .append('line') // Append a <line> element for each link
    .attr('class', 'link') // Add a class for stylingGRAPH_CONFIG.link.minThickness, d.weight || GRAPH_CONFIG.link.defaultThickness)
    .attr('stroke', GRAPH_CONFIG.link.color) // Default link color
    .attr('stroke-width', d => Math.max(GRAPH_CONFIG.link.minThickness, d.weight || GRAPH_CONFIG.link.thickness)); // Dynamic link thickness based on weight

  // Draw nodes
  const nodeGroup = g.selectAll('.node') // Select all nodes (none exist initially)
    .data(graphData.nodes) // Bind the nodes data
    .enter() // Process each node in the data
    .append('circle') // Append a <circle> element for each node
    .attr('class', 'node') // Add a class for styling
    //.attr('r', GRAPH_CONFIG.node.defaultRadius) // Radius of the node
    //.attr('r', d =>Math.max(5, 100 / Math.sqrt(graphData.nodes.length))) // Dynamic radius
    .attr('r', dynamicRadius) // Use dynamic radius
    .attr('fill',  GRAPH_CONFIG.node.color) // Default node color
      
    // Adjust label position dynamically based on node's position
    const labelGroup = g.selectAll('.node-label')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle') // Center text horizontally
      //.attr('dy', d => d.y > height / 2 ? 25 : -25) // Position label above or below node
      .attr('dy', d => (d.y < height / 2 ? -GRAPH_CONFIG.node.labelOffset : GRAPH_CONFIG.node.labelOffset)) // Position label above or below based on node's vertical location
      //.text(d => d.label || d.id); // Fallback to ID if no label is provided
      .text(d => d.id);

     // Delay to ensure rendering is complete before calling getBBox()
    // Adjust the SVG size dynamically based on the rendered content  
     setTimeout(() => {
     /*const groupNode = g.node();

      if (!groupNode) {
        console.error('Graph transform group is not found.');
        return;
      }
    */
    const bbox = g.node().getBBox(); // Get the bounding box of the rendered graph
    
    if (!bbox || isNaN(bbox.width) || isNaN(bbox.height)) {
      console.error('Invalid bounding box:', bbox);
      return;
    }
    
    // Debug bounding box dimensions
    console.log('Bounding Box Dimensions:', bbox.width, bbox.height);


  const adjustedWidth = Math.max(width, bbox.width + padding * 2);
  const adjustedHeight = Math.max(height, bbox.height + padding * 2);
    
    svg.attr('width', adjustedWidth).attr('height', adjustedHeight);
    
    /*svg.attr('width', Math.max(graphWidth, width)); 
    svg.attr('width', Math.max(graphHeight, height)); 
    
    // Center the graph dynamically
      centerGraph(svg, { width: graphWidth, height: graphHeight, padding, bbox });// Dynamically center the graph within the SVG
    
  svg.attr('width', bbox.width + padding * 2)
      .attr('height', bbox.height + padding * 2);
    */
  g.attr('transform', `translate(${padding+(width - bbox.width) / 2}, ${padding+(height - bbox.height) / 2})`);    
  
  /* Pass the correct bbox object to centerGraph
        centerGraph(svg, { width, height, padding, bbox }); */
      }, 100); // Delay ensures the graph is fully rendered before centering

    // Add interactivity to nodes
    addNodeInteractivity(nodeGroup, linkGroup);

    console.log('SVG Structure:', svg.node());

    // Return references to the SVG and its groups for further manipulation
    return  { svg, linkGroup, nodeGroup, labelGroup };
}

/**
 * Centers the graph dynamically within the SVG.
 * @param {Object} svg - The SVG element containing the graph.
 * @param {Object} options - Configuration options for dimensions and padding.
 */

export function centerGraph(svg, { width, height, padding, bbox }) {
  //const { width, height, padding } = { ...GRAPH_CONFIG.dimensions, ...options };
  
  const g = svg.select('.graph-transform');

  /* Ensure the group contains elements before calculating the bounding box
  if (g.empty() || !bbox()) {
    console.error('Graph transform group is empty or bounding box is invalid.');
    return;
  }

  /*Get the bounding box of the group element
  const bbox = g.node().getBBox();

  // Check for invalid bounding box values
  if (!bbox || isNaN(bbox.width) || isNaN(bbox.height)) {
    console.error('Invalid bounding box:', bbox);
    return;
  }


  // Dynamically calculate padding based on the graph size (bounding box dimensions)
  const dynamicPadding = Math.max(padding, Math.sqrt(bbox.width * bbox.height) / 10); // Adjust factor for better results
  console.log('Dynamic Padding:', dynamicPadding);
  
  // Calculate bounding box of the graph
  const graphWidth = bbox.width;
  const graphHeight = bbox.height; 
  

  // Dynamically ensure container width and height are valid
  const svgWidth = width || GRAPH_CONFIG.dimensions.width; // Default to 800 if not provided
  const svgHeight = height || GRAPH_CONFIG.dimensions.height; // Default to 600 if not provided
 
  //Dynamically calculate padding based on graph size
  const horizontalPadding = Math.max((width - graphWidth) / 4, 20); // Ensure at least 20px padding
  const verticalPadding = Math.max((height - graphHeight) / 4, 20); // Ensure at least 20px padding
  

  if (!bbox || typeof bbox !== 'object') {
    console.error('Invalid bounding box:', bbox);
    return;
  }
*/
  // Calculate the center of the graph
  const graphCenterX = bbox.x + bbox.width / 2;
  const graphCenterY = bbox.y + bbox.height / 2;

  // Calculate the center of the SVG container with padding applied
  const svgCenterX = width / 2;
  const svgCenterY = height / 2;

 // Calculate translation needed to center the graph in the SVG
  const translateX = svgCenterX - graphCenterX; // Center horizontally;
  const translateY = svgCenterY - graphCenterY; // Center vertically

 /* if (isNaN(svgCenterX) || isNaN(svgCenterY)) {
    console.error('Invalid SVG center:', svgCenterX, svgCenterY);
    return;
  }

  // Adjust the SVG view box to include dynamic padding
  const adjustedWidth = bbox.width + dynamicPadding * 2;
  const adjustedHeight = graphHeight + dynamicPadding * 2;
  const adjustedX = bbox.x - dynamicPadding;
  const adjustedY = bbox.y - dynamicPadding;

  // Debugging logs
  console.log('Bounding Box:', bbox);
  console.log('Container Rect:', containerRect);
  console.log('Graph Center (X, Y):', graphCenterX, graphCenterY);
  console.log('SVG Center (X, Y):', svgCenterX, svgCenterY);
  console.log('Translation (X, Y):', translateX, translateY);
*/
  // Apply translation to center the graph
  g.attr('transform', `translate(${translateX}, ${translateY})`);
  
  /* Adjust the SVG viewBox for dynamic scaling
  svg.attr(
    'viewBox',
    `${adjustedX} ${adjustedY} ${adjustedWidth} ${adjustedHeight}`
  ).attr('preserveAspectRatio', 'xMidYMid meet');
  */
}