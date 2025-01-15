//src/core/interactivity.js

// Import necessary dependencies
import { zoom } from 'd3-zoom';
import { drag } from 'd3-drag';
import * as d3 from 'd3';
import { GRAPH_CONFIG } from './config.js';
import { findShortestPath } from './lattice.js';

/**
 * Computes and assigns superconcepts and subconcepts based on graph links.
 * @param {Object} graphData - The graph data containing nodes and links.
 */
export function computeSuperSubConcepts(graphData) {
  
  if (!graphData || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.links)) {
    console.error("❌ computeSuperSubConcepts received invalid graphData:", graphData);
    return;
}
console.log("✅ computeSuperSubConcepts received:", graphData.nodes.length, "nodes and", graphData.links.length, "links");
  // Ensure each node has superconcepts and subconcepts properties
    graphData.nodes.forEach(node => {
      if (!Array.isArray(node.superconcepts)) node.superconcepts = [];
      if (!Array.isArray(node.subconcepts)) node.subconcepts = [];
    });

    // Traverse links to assign superconcepts and subconcepts
    graphData.links.forEach(link => {
        let sourceNode = graphData.nodes.find(n => n.id == link.source );
        let targetNode = graphData.nodes.find(n => n.id == link.target );

        if (!sourceNode || !targetNode) {
          console.warn(`⚠️ Link references invalid nodes:`, link);
          return;
      }
      sourceNode.subconcepts.push(targetNode); // Outgoing = Subconcept
      targetNode.superconcepts.push(sourceNode); // Incoming = Superconcept
        
    });

    //Debugging: Log relationships
    graphData.nodes.forEach(node => {
        console.log(`🔗 Node ${node.id} Superconcepts:`, node.superconcepts.map(n => n.id));
        console.log(`🔗 Node ${node.id} Subconcepts:`, node.subconcepts.map(n => n.id));
    });
}

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
 * @param {Object} graphData - The graph data containing nodes and links.
*/

export function addNodeInteractivity(nodeGroup, linkGroup, graphData) {
  let selectedNodes = []; // Track selected nodes for shortest path

  nodeGroup
    .on('mouseover', function (event, d) {
      // Show tooltip on hover
      d3.select('#tooltip')
        .style('left', `${event.pageX + 10}px`) // Position tooltip near the mouse
        .style('top', `${event.pageY + 10}px`)
        .style('display', 'inline-block') // Make tooltip visible
        .html(`
          <strong>ID:</strong> ${d.id}<br>
          <strong>Label:</strong> ${d.label|| 'No Label'}<br>
          <strong>Level:</strong> ${d.level || 'N/A'}
          `); // Display node ID, label and level
    })
    .on('mouseout', () => {
      // Hide tooltip when mouse leaves the node
      d3.select('#tooltip').style('display', 'none');
    })
    .on('click', function (event, clickedNode) {
      // Handle node selection

      console.log(`📌 Node Clicked: ${clickedNode.id}`);

      // Track selected nodes for shortest path calculation
      selectedNodes.push(clickedNode.id);

    if (selectedNodes.length === 2) {
      const [startNode, endNode] = selectedNodes;

      // Calculate the shortest path
      const path = findShortestPath(graphData, startNode, endNode);
      console.log('Shortest Path:', path);

      if (path.length > 0) {
        // Highlight the shortest path
        nodeGroup.attr('fill', (node) =>
          path.includes(node.id) 
            ? 'orange' 
            : GRAPH_CONFIG.node.color
        );

        linkGroup.attr('stroke', (link) =>
          path.includes(link.source.id) && path.includes(link.target.id)
            ? 'orange'
            : GRAPH_CONFIG.link.color
        );

        // Update the HTML to display the shortest path
        d3.select('#shortest-path-display').html(`
          Shortest path between <strong>${startNode}</strong> and <strong>${endNode}</strong>: 
          ${path.join(' → ')}
        `);

      } else {
        alert('No path found between the selected nodes.');
        
        // Clear the shortest path display
        d3.select('#shortest-path-display').html('No path found between the selected nodes.');
      }

      // Reset selection
      selectedNodes = [];
    } else {

      /* Find neighbors
      const superconcepts = [];
      const subconcepts = [];
      
      linkGroup.each(function (link) {
        if (link.source.id === clickedNode.id) {
            subconcepts.push(link.target); // Outgoing link -> Subconcept
        } else if (link.target.id === clickedNode.id) {
            superconcepts.push(link.source); // Incoming link -> Superconcept
        }
    });
      */

    // Ensure relationships exist before accessing them
    if (!clickedNode.superconcepts || !clickedNode.subconcepts) {
      console.warn(`⚠️ Node ${clickedNode.id} missing superconcepts or subconcepts.`);
      return;
  }

    // Use precomputed values instead of recalculating
    const superconcepts = clickedNode.superconcepts;
    const subconcepts = clickedNode.subconcepts;
    
    console.log(`🔗 Node ${clickedNode.id} Superconcepts:`, superconcepts.map(n => n.id));
    console.log(`🔗 Node ${clickedNode.id} Subconcepts:`, subconcepts.map(n => n.id));


    // Format neighbor information
    const superconceptsInfo = superconcepts
        .map((node) => `${node.id} (${node.label || 'No Label'})`)
        .join(', ');
    const subconceptsInfo = subconcepts
        .map((node) => `${node.id} (${node.label || 'No Label'})`)
        .join(', ');

     // Update the UI with the selected node's information
      d3.select('#selected-node-info').html(`
        <strong>Selected Node</strong><br>
        &ensp;  &emsp;ID: ${clickedNode.id}<br>
        &ensp;  &emsp;Label: ${clickedNode.label || 'No Label'}<br>
        <strong>Extent Size:</strong> ${clickedNode.metrics.extentSize}&ensp;  &emsp;<strong>Intent Size:</strong> ${clickedNode.metrics.intentSize}<br>
        <strong>Stability:</strong> ${clickedNode.metrics.stability}&ensp;  &emsp;<strong>Neighborhood Size:</strong> ${clickedNode.metrics.neighborhoodSize}<br>
        <strong>Superconcepts</strong>:${superconceptsInfo || 'None'}<br>
        <strong>Subconcepts:</strong> ${subconceptsInfo || 'None'}
        `);

      // Change color of clicked node
      //d3.select(this).attr('fill', GRAPH_CONFIG.node.selectedColor); // Change node color to red

      // Highlight clicked node and connected links
      nodeGroup.attr('fill', (node) =>
        node.id === clickedNode.id
            ? GRAPH_CONFIG.node.selectedColor
            : GRAPH_CONFIG.node.color
    );


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
    }
 });
 // Add double-click to reset graph state
nodeGroup.on('dblclick', () => {
  // Reset all nodes and links
  nodeGroup.attr('fill', GRAPH_CONFIG.node.color);
  linkGroup
    .attr('stroke', GRAPH_CONFIG.link.color)
    .attr('stroke-width', GRAPH_CONFIG.link.thickness);

  d3.select('#selected-node-info').html('Click a node to see its details.');
});
}

