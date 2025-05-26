
// src/core/interactivity.js

// Import necessary dependencies
import * as d3 from 'd3';
import { GRAPH_CONFIG } from './config.js';
import { findShortestPath } from './lattice.js';
import { updateNodes } from './rendering.js';
import { calculateMetrics } from './metrics.js';

let zoomBehavior; // Global zoom behavior
let selectedNodes = []; // Track selected nodes for shortest path

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

  // Reset superconcepts and subconcepts
  graphData.nodes.forEach(node => {
      node.superconcepts = [];
      node.subconcepts = [];
  });

  // Assign relationships based on links
  graphData.links.forEach(link => {
      /*
      let parentNode = graphData.nodes.find(n => n.id == link.source);
      let childNode = graphData.nodes.find(n => n.id == link.target);
     

      let parentNode = graphData.nodes.find(n => String(n.id) === String(link.source));
      let childNode = graphData.nodes.find(n => String(n.id) === String(link.target));
     */

      let parentNode = graphData.nodes.find(n => String(n.id) === String(link.source.id || link.source));
      let childNode = graphData.nodes.find(n => String(n.id) === String(link.target.id || link.target));

      if (!parentNode || !childNode) {
          console.warn(`⚠️ Link references invalid nodes:`, link);
          return;
      }

      // Avoid duplicates
      if (!parentNode.subconcepts.some(n => n.id === childNode.id)) {
          parentNode.subconcepts.push(childNode);
      }
      if (!childNode.superconcepts.some(n => n.id === parentNode.id)) {
          childNode.superconcepts.push(parentNode);
      }
  });

  //console.log("✅ Superconcepts and subconcepts assigned correctly.");

  // Log computed super/subconcepts
  console.log("✅ Final Node Assignments:");
  graphData.nodes.forEach(node => {
      console.log(`🔍 Node ${node.id}: Superconcepts ->`, node.superconcepts.map(n => n.id));
      console.log(`🔍 Node ${node.id}: Subconcepts ->`, node.subconcepts.map(n => n.id));
  });

}

/**
 * Updates link positions when nodes move.
 * @param {Object} graphData - The graph data containing nodes and links.
 */
export function updateLinks(graphData) {
  
  d3.selectAll('.link')
    .data(graphData.links)
    .join('line')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y);

}

/**
 * Adds zooming and panning to the graph.
 * @param {Object} svg - The SVG element containing the graph.
 * @param {Object} graphData - The graph data containing nodes and links.
 */
export function addInteractivity(svg, graphData) {
  if (!graphData || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.links)) {
    console.error("❌ addInteractivity() received invalid graphData:", graphData);
    return;
  }

  // Ensure graphData has metrics before interactivity is added
  calculateMetrics(graphData);

  const g = svg.select('.graph-transform');
  if (g.empty()) {
    console.error("❌ Graph transform group `.graph-transform` not found!");
    return;
  }

  zoomBehavior = d3.zoom()
    .scaleExtent([0.1, 5])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoomBehavior);
}

/**
 * Adds node interactivity: dragging, selection, highlighting, and tooltips.
 * @param {Object} nodeGroup - D3 selection of nodes.
 * @param {Object} linkGroup - D3 selection of links.
 * @param {Object} graphData - Graph data with nodes and links.
 */
export function addNodeInteractivity(nodeGroup, linkGroup, graphData) {
  if (!nodeGroup || nodeGroup.empty()) {
    console.error("❌ addNodeInteractivity() received an invalid nodeGroup:", nodeGroup);
    return;
  }

  // Drag Behavior
  nodeGroup.call(d3.drag()
   .on("start", function(event, d) {
      d3.select(this).raise();// Bring the dragged node to the front
    })
    .on("drag",function(event, d){
    
    // Compute movement constraints (node cannot move beyond its parents or children in y-axis)
    let minY = d.superconcepts.length > 0 ? Math.max(...d.superconcepts.map(n => n.y)) : 0;
    let maxY = d.subconcepts.length > 0 ? Math.min(...d.subconcepts.map(n => n.y)) : Infinity;
        
      d.x = event.x;
      //d.y = event.y;
      d.y = Math.max(minY + 20, Math.min(event.y, maxY -25)); // Add some padding for constrained y-axis movement
      
      // ✅ Ensure both attributes (`cx`, `cy`) and transformation (`translate()`) are updated
      d3.select(this)
        //.attr("cx", d.x)
        //.attr("cy", d.y)
        .attr("transform", `translate(${d.x}, ${d.y})`);  // Move the node visually

      // ✅ Update edges dynamically
       updateLinks(graphData);
    })
    .on("end", (event, d) => {
        //mouseupHandler(event, d);
        updateNodes(graphData);
    })
    
  );

  // **Click-to-Zoom & Highlight Node**
  nodeGroup.on('click', function (event, clickedNode) {
    console.log(`📌 Node Clicked: ${clickedNode.id}`);

    // Ensure clickedNode exists
    if (!clickedNode) {
      console.error("❌ Click event fired but no node was found!");
      return;
  }


    const svg = d3.select("svg");
    if (!svg) return;
   if (!zoomBehavior) {
      console.error("❌ zoomBehavior is not initialized!");
      return;
    }
  
    const newScale = 2.5;
    const newX = -clickedNode.x * newScale + svg.attr('width') / 2;
    const newY = -clickedNode.y * newScale + svg.attr('height') / 2;

    svg.transition()
      .duration(600)
      .call(zoomBehavior.transform, d3.zoomIdentity.translate(newX, newY).scale(newScale));

    // ✅ Highlight clicked node and reset others
    nodeGroup.selectAll("circle")
        .attr("fill", d => d.id === clickedNode.id ? GRAPH_CONFIG.node.selectedColor : GRAPH_CONFIG.node.color);
   
    // **Highlight Links connected to the Selected Node**
    if (!linkGroup || linkGroup.size() === 0) {
      //if (!linkGroup || linkGroup.empty()) {
      console.error("❌ linkGroup is not initialized properly. Cannot update link styles.");
      return;
  }

   // Highlight connected links
   linkGroup
      .attr('stroke', d => {
        const sourceId = d.source.id !== undefined ? d.source.id : d.source;
        const targetId = d.target.id !== undefined ? d.target.id : d.target;
        return (sourceId === clickedNode.id || targetId === clickedNode.id)
          ? GRAPH_CONFIG.link.highlightedColor
          : GRAPH_CONFIG.link.color;
      })
      .attr('stroke-width', d => {
        const sourceId = d.source.id !== undefined ? d.source.id : d.source;
        const targetId = d.target.id !== undefined ? d.target.id : d.target;
        return (sourceId === clickedNode.id || targetId === clickedNode.id)
          ? 5
          : GRAPH_CONFIG.link.thickness;
      });

  /*
  linkGroup
      .attr("stroke", d => {
        const srcId = d.source?.id ?? d.source;
        const tgtId = d.target?.id ?? d.target;
        return (srcId === clickedNode.id || tgtId === clickedNode.id) ? GRAPH_CONFIG.link.highlightedColor : GRAPH_CONFIG.link.color;
      })
      .attr("stroke-width", d => {
        const srcId = d.source?.id ?? d.source;
        const tgtId = d.target?.id ?? d.target;
        return (srcId === clickedNode.id || tgtId === clickedNode.id) ? 6 : GRAPH_CONFIG.link.thickness;
      });
    */

  /*
    linkGroup
      .attr("stroke", link =>
        ( link.source.id === clickedNode.id || link.target.id === clickedNode.id) 
              ? GRAPH_CONFIG.link.highlightedColor // Highlight linked edges in red
              : GRAPH_CONFIG.link.color // Reset other edges to default
        )
      .attr("stroke-width", link =>
        (link.source.id === clickedNode.id || link.target.id === clickedNode.id) 
            ? 4 // Thicker line for connected edges
            : GRAPH_CONFIG.link.thickness // Default thickness for others
        );
  */
    // **Ensure Node Metrics Exist**
    if (!clickedNode.metrics) {
      console.warn(`⚠️ Node ${clickedNode.id} has missing metrics. Recalculating...`);
      calculateMetrics(graphData);
    }

    // **Format Superconcepts & Subconcepts**
  const superconceptsInfo = clickedNode.superconcepts && clickedNode.superconcepts.length > 0
    ? clickedNode.superconcepts.map(node => `${node.id} (${node.label || 'No Label'})`).join(', ')
    : 'None';

  const subconceptsInfo = clickedNode.subconcepts && clickedNode.subconcepts.length > 0
      ? clickedNode.subconcepts.map(node => `${node.id} (${node.label || 'No Label'})`).join(', ')
      : 'None';

    console.log("🔍 Superconcepts:", superconceptsInfo);
    console.log("🔍 Subconcepts:", subconceptsInfo);

    // **Display Node Details**
    d3.select('#selected-node-info').html(`
      <strong>Selected Node</strong><br>
      ID: ${clickedNode.id}<br>
      Label: ${clickedNode.label || 'No Label'}<br>
      <strong>Extent Size:</strong> ${clickedNode.metrics.extentSize}<br>
      <strong>Intent Size:</strong> ${clickedNode.metrics.intentSize}<br>
      <strong>Stability:</strong> ${clickedNode.metrics.stability}<br>
      <strong>Neighborhood Size:</strong> ${clickedNode.metrics.neighborhoodSize}<br>
      <strong>Superconcepts:</strong> ${superconceptsInfo || 'None'}<br>
      <strong>Subconcepts:</strong> ${subconceptsInfo || 'None'}
    `);

    // **Shortest Path Selection**
    selectedNodes.push(clickedNode.id);

    if (selectedNodes.length === 2) {
      const path = findShortestPath(graphData, selectedNodes[0], selectedNodes[1]);
      console.log('Shortest Path:', path);

      /*if (path.length > 0) {
        nodeGroup.selectAll("circle")
        .attr('fill', d => path.includes(d.id) ? 'orange' : GRAPH_CONFIG.node.color);
        
        linkGroup.attr('stroke', link =>
          path.includes(link.source.id) && path.includes(link.target.id) ? 'red' : GRAPH_CONFIG.link.color
        );
      */

        if (path.length > 0) {
          nodeGroup.selectAll("circle")
            .attr('fill', d => path.includes(d.id) ? 'orange' : GRAPH_CONFIG.node.color);
  
          linkGroup
            .attr('stroke', d => {
              const srcId = d.source.id !== undefined ? d.source.id : d.source;
              const tgtId = d.target.id !== undefined ? d.target.id : d.target;
              return (path.includes(srcId) && path.includes(tgtId))
                ? 'red'
                : GRAPH_CONFIG.link.color;
            })
            .attr('stroke-width', d => {
              const srcId = d.source.id !== undefined ? d.source.id : d.source;
              const tgtId = d.target.id !== undefined ? d.target.id : d.target;
              return (path.includes(srcId) && path.includes(tgtId))
                ? 5
                : GRAPH_CONFIG.link.thickness;
            });
        d3.select('#shortest-path-display').html(`
          Shortest path between <strong>${selectedNodes[0]}</strong> and <strong>${selectedNodes[1]}</strong>: 
          ${path.join(' → ')}
        `);
      } else {
        alert('No path found between the selected nodes.');
        d3.select('#shortest-path-display').html('No path found between the selected nodes.');
      }

      selectedNodes = []; // Reset selection after path is found
    }
  });

  // **Hover Tooltip**
  nodeGroup
    .on('mouseover', function (event, d) {
      d3.select('#tooltip')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
        .style('display', 'inline-block')
        .html(`
          <strong>ID:</strong> ${d.id}<br>
          <strong>Label:</strong> ${d.label || 'No Label'}<br>
          <strong>Level:</strong> ${d.level || 'N/A'}
        `);
    })
    .on('mouseout', () => {
      d3.select('#tooltip').style('display', 'none');
    });

  // **Reset Graph on Double-click**
  nodeGroup.on('dblclick', () => {
    nodeGroup.selectAll("circle").attr('fill', GRAPH_CONFIG.node.color);
    linkGroup.attr('stroke', GRAPH_CONFIG.link.color).attr('stroke-width', GRAPH_CONFIG.link.thickness);
    d3.select('#selected-node-info').html('Click a node to see its details.');
    d3.select('#shortest-path-display').html('Click two nodes to calculate the shortest path.');
  });
}
