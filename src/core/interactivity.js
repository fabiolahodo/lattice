//src/core/interactivity.js

// Import necessary dependencies
import { zoom } from 'd3-zoom';
import { drag } from 'd3-drag';
import * as d3 from 'd3';
import { GRAPH_CONFIG } from './config.js';

/**
 * Adds interactivity to the graph, including zoom, pan, and drag behaviors to the graph.
 * @param {Object} svg - The SVG element containing the graph.
 * @param {Object} simulation - The D3 force simulation instance.
 */

export function addInteractivity(svg, simulation) {
  //const g = svg.append('g').attr('class', 'graph-transform');
  
  // Select the graph transform group for applying transformations
  const g = svg.select('.graph-transform');

  // Add zoom behavior
  svg.call(
    d3.zoom()
      .scaleExtent(GRAPH_CONFIG.zoom.scaleExtent) // Zoom scale limits (10% to 1000%)
      .on('zoom', (event) => {
        // Apply zoom and pan transformations to the graph group
        g.attr('transform', event.transform);
      })
  );

  /*
  g.append(() => svg.select('.links').node());
  g.append(() => svg.select('.nodes').node());
  */
  // Add drag behavior to nodes
  g.selectAll('.node')
    .call(
      d3.drag()
        .on('start', (event, d) => {
          // Start dragging: increase simulation alpha to allow movement
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; // Fix x position during drag
          d.fy = d.y; // Fix y position during drag
        })
        .on('drag', (event, d) => {
          // During drag: update fixed positions to follow the cursor
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          // End dragging: release fixed positions
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );
}

/**
 * Adds node-specific interactivity (hover, click) to the graph.
 * @param {Object} nodeGroup - The selection of nodes in the graph.
 * @param {Object} linkGroup - The selection of links in the graph.
 */

export function addNodeInteractivity(nodeGroup, linkGroup) {
  nodeGroup
    .on('mouseover', function (event, d) {
      // Show tooltip on hover
      d3.select('#tooltip')
        .style('left', `${event.pageX + 10}px`) // Position tooltip near the mouse
        .style('top', `${event.pageY + 10}px`)
        .style('display', 'inline-block') // Make tooltip visible
        .html(`ID: ${d.id}<br>Label: ${d.label}`); // Display node ID and label
    })
    .on('mouseout', () => {
      // Hide tooltip when mouse leaves the node
      d3.select('#tooltip').style('display', 'none');
    })
    .on('click', function (event, clickedNode) {
      // Handle node selection
      // Update the UI with the selected node's information
      d3.select('#selected-node-info').html(
        `Selected Node<br>ID: ${clickedNode.id}<br>Label: ${clickedNode.label}`
      );

      // Change color of clicked node
      d3.select(this).attr('fill', GRAPH_CONFIG.node.selectedColor); // Change node color to red

      // Highlight connected links
      linkGroup
        .attr('stroke', (link) =>
          link.source.id === clickedNode.id || link.target.id === clickedNode.id
            ? GRAPH_CONFIG.link.highlightedColor // Highlight linked edges in red
            : GRAPH_CONFIG.link.color // Reset other edges to default
        )
        .attr('stroke-width', (link) =>
          link.source.id === clickedNode.id || link.target.id === clickedNode.id
            ? 4 // Thicker line for connected edges
            : GRAPH_CONFIG.link.thickness // Default thickness for others
        );

      // Reset colors of other nodes
      nodeGroup.attr('fill', (node) =>
        node.id === clickedNode.id 
      ? GRAPH_CONFIG.node.selectedColor // Keep clicked node highlighted 
      : GRAPH_CONFIG.node.color // Default color for others
      );
    });
}

