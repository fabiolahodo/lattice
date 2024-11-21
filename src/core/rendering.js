//src/core/rendering.js 
import { select } from 'd3-selection';
import * as d3 from 'd3';

export function renderGraph(container, graphData, options) {
  const { width, height } = options;

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
      .attr('width', width)
      .attr('height', height)

  //Create a <g> element to center the graph
  const g = svg.append('g')
    .attr('class', 'graph-transform')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);
  

  /* Create a <g> element for transformations
  const g = svg.append('g')
    .attr('class', 'graph-transform');
  */
  // Draw links
  const linkGroup = g.selectAll('.link')
    .data(graphData.links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 2);

  // Draw nodes
  const nodeGroup = g.selectAll('.node')
    .data(graphData.nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', 20)
    .attr('fill', 'blue')
    .on('click', function (event, clickedNode) {
      // Change color of clicked node
      d3.select(this).attr('fill', 'red'); // Change node color to red
    
      // Highlight connected links
      linkGroup
        .attr('stroke', link =>
          link.source.id === clickedNode.id || link.target.id === clickedNode.id
            ? 'red' // Highlight linked edges in red
            : '#ccc' // Reset other edges to default
        )
        .attr('stroke-width', link =>
          link.source.id === clickedNode.id || link.target.id === clickedNode.id
            ? 4 // Thicker line for connected edges
            : 2 // Default thickness for others
        );

      // Reset colors of other nodes
      nodeGroup.attr('fill', node =>
        node.id === clickedNode.id ? 'red' : 'blue'
      );
    });
      
    // Add node labels
    const labelGroup = g.selectAll('.node-label')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle') // Center text horizontally
      //.attr('dy', d => d.y > height / 2 ? 25 : -25) // Position label above or below node
      .text(d => d.id);

  console.log('SVG Structure:', svg.node());

    return  { svg, linkGroup, nodeGroup, labelGroup };
}

export function centerGraph(svg, graphData, width, height) {
  const g = svg.select('.graph-transform');

  // Calculate graph bounds
  const xExtent = d3.extent(graphData.nodes, d => d.x || 0); // Default to 0 if undefined
  const yExtent = d3.extent(graphData.nodes, d => d.y || 0);

  // Fallback if extents are invalid
  const xCenter = (xExtent[0] + xExtent[1]) / 2 || 0; // Center of x-range
  const yCenter = (yExtent[0] + yExtent[1]) / 2 || 0; // Center of y-range

  // Calculate translation to center graph in SVG
  const translateX = width / 2 - xCenter;
  const translateY = height / 2 - yCenter;

  // Apply translation to center the graph
  g.attr('transform', `translate(${translateX}, ${translateY})`);
}

/*export function centerGraph(svg, graphData, width, height) {
  const g = svg.select('.graph-transform');

  // Calculate bounding box of the graph
  const nodes = graphData.nodes;
  const xExtent = d3.extent(nodes, (d) => d.x);
  const yExtent = d3.extent(nodes, (d) => d.y);

  // Calculate center of the graph
  const graphWidth = xExtent[1] - xExtent[0];
  const graphHeight = yExtent[1] - yExtent[0];
  const graphCenterX = xExtent[0] + graphWidth / 2;
  const graphCenterY = yExtent[0] + graphHeight / 2;

  // Calculate translation to center the graph in the SVG
  const translateX = width / 2 - graphCenterX;
  const translateY = height / 2 - graphCenterY;

  // Apply translation to the graph
  g.attr('transform', `translate(${translateX}, ${translateY})`);
}*/
