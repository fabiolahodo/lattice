// src/core/rendering.js

// Import necessary dependencies
import * as d3 from 'd3';
import { GRAPH_CONFIG } from './config.js';
import { addNodeInteractivity, computeSuperSubConcepts } from './interactivity.js';
import { computeReducedLabels, formatLabel } from './reducedLabeling.js';
import { assignLayers, orderVerticesWithinLayers, adjustLayerSpacing, adjustNodePositions  } from './layering.js';

/**
 * Renders the graph with nodes and links.
 * @param {string} container - The CSS selector for the container
 * @param {Object} graphData - The graph data containing nodes and links
 * @param {Object} options - Options for width and height of the SVG
 * @returns {Object} - References to the SVG and groups created
 */

let nodeGroup, labelGroup;

export function renderGraph(container, graphData, options) {
    console.log("🚀 renderGraph() started! Graph Data:", graphData);

    const { width, height, padding } = { ...GRAPH_CONFIG.dimensions, ...options };

    if (!graphData || !graphData.nodes || !graphData.links) {
        console.error("Error: graphData is missing nodes or links!", graphData);
        return;
    }

    console.log("✅ Valid graphData detected, proceeding with rendering...");
    // Compute relationships and labels
    // Ensure superconcepts and subconcepts are computed first
    console.log("📌 Computing superconcepts and subconcepts...");
    computeSuperSubConcepts(graphData);

    console.log("📌 Computing reduced labels...");
    computeReducedLabels(graphData.nodes, graphData.links);

    // Assign layers and positions
    console.log("📌 Assigning hierarchical layers...");
    const layers = assignLayers(graphData);
    if (!layers || layers.length === 0) {
        console.error("❌ Layer assignment failed.");
        return;
    }
    console.log("✅ Layers assigned successfully");

    // Adjust spacing dynamically based on density
    adjustLayerSpacing(layers, { width, height, padding });
    console.log("✅ Layer spacing adjusted.");

    // 🔹 Order vertices within layers to minimize edge crossings
    console.log("📌 Ordering vertices within layers...");
    orderVerticesWithinLayers(layers, graphData);

    adjustNodePositions(layers, width, padding);

    // Assign the computed positions to nodes
    layers.forEach(layer => {
        layer.forEach(node => {
            node.x = node.x || 0;
            node.y = node.y || 0;
        });
    });

    console.log("📌 Assigning X & Y positions...");
    layers.forEach((layer, layerIndex) => {
        const xSpacing = (width - 2 * padding) / (layer.length + 1);
        layer.forEach((node, nodeIndex) => {
            node.x = padding + (nodeIndex + 1) * xSpacing;
            //node.y = padding + layerIndex * (height / layers.length);
        });
    });

       //Ensure Links Reference Nodes Correctly
       graphData.links.forEach(link => {
        if (typeof link.source === "string" || typeof link.source === "number") {
            link.source = graphData.nodes.find(n => n.id == link.source);
        }
        if (typeof link.target === "string" || typeof link.target === "number") {
            link.target = graphData.nodes.find(n => n.id == link.target);
        }
    });

    graphData.links.forEach(link => {
        if (!link.source || !link.target) {
            console.error("❌ Link has missing source or target:", link);
        }
    });
    

    // Debugging Logs
    console.log("🔍 Node Positions:", graphData.nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
    console.log("🔗 Link Connections:", graphData.links.map(l => ({ source: l.source.id, target: l.target.id })));

    // Create SVG container
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('overflow', 'visible');

    // Create a <g> group element to center and transform the graph
    const g = svg.append('g')
        .attr('class', 'graph-transform');

    console.log("📌 Drawing Links...");
    const linkGroup = g.append("g")
        .attr("class", "link-group")
        .selectAll('.link')
        .data(graphData.links)
        .enter()
        .append('line')
        .attr('class', 'link')
        .attr('stroke', GRAPH_CONFIG.link.color || "#aaa")
        .attr('stroke-width', d => d.weight || 2)
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    console.log("📌 Drawing Nodes...");
    nodeGroup = g.selectAll('.node')
        .data(graphData.nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', GRAPH_CONFIG.node.maxRadius)
        .attr('fill', d => d.color || GRAPH_CONFIG.node.color);

    console.log("📌 Adding Node Labels...");
    labelGroup = g.selectAll('.node-label')
        .data(graphData.nodes)
        .enter()
        .append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        //.attr('dy', d => (d.y < height / 2 ? -GRAPH_CONFIG.node.labelOffset : GRAPH_CONFIG.node.labelOffset))
        .attr('dx', d => d.x) // Position labels correctly
        .attr('dy', d => d.y - GRAPH_CONFIG.node.labelOffset) // Adjust label above the node
        .text(d => d.id);

    // ✅ Ensure edges follow nodes when moved
    function updateLinks() {
        linkGroup
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
    }

   /* // ✅ Update node and label positions
   function updateNodes(){
        nodeGroup
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        labelGroup
            .attr('x', d => d.x)
            .attr('y', d => d.y - GRAPH_CONFIG.node.labelOffset);
    }
    */
    //Ensure that labelGroup is correctly created
    if (!labelGroup.empty()) {
        updateLabels("default", labelGroup);
    } else {
        console.error("❌ Label group is empty, skipping label update.");
    }
    
    // Apply default label mode
    updateLabels("default", labelGroup);

    console.log("📌 Adjusting Graph Centering...");
    setTimeout(() => {
        //Before calling .getBBox(), verify that g.node() exists
        if (!g.node()) {
            console.error("❌ Graph group (`g.node()`) is undefined. Skipping centering.");
            return;
        }

        const bbox = g.node().getBBox();
        centerGraph(svg, { width, height, padding, bbox });
    }, 100);

    // ✅ Pass updateLinks to ensure edges move with nodes
    //addNodeInteractivity(nodeGroup, linkGroup, graphData, nodeGroup, updateLinks);

    if (graphData && graphData.nodes && graphData.links) {
        addNodeInteractivity(nodeGroup, linkGroup, graphData, nodeGroup, updateLinks);
    } else {
        console.error("❌ addNodeInteractivity() received invalid graphData:", graphData);
    }
    
    return { svg, linkGroup, nodeGroup, labelGroup };
}

export function updateNodes() {
    if (!nodeGroup || !labelGroup) {
        console.error("❌ updateNodes() called before nodeGroup or labelGroup was initialized!");
        return;
    }

    nodeGroup
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

    labelGroup
        .attr('dx', d => d.x)
        .attr('dy', d => d.y - GRAPH_CONFIG.node.labelOffset);
}

/**
 * Updates node labels based on the selected labeling mode.
 * @param {string} mode - The selected labeling mode ("default", "full", "reduced").
 * @param {Object} labelGroup - The D3 selection of node labels.
 */
export function updateLabels(mode, labelGroup) {
    console.log(`🔄 Updating Labels: Mode = ${mode}`);

    labelGroup.text(d => {
        if (!d) return ""; // Handle undefined nodes

        if (mode === "full") {
            return d.label || d.id; // Full mode: Use `label` from JSON, fallback to `id`
        } else if (mode === "reduced") {
            if (!Array.isArray(d.reducedExtent) || !Array.isArray(d.reducedIntent)) {
                console.warn(`⚠️ Reduced labels missing for node ${d.id}.`);
                return "";
            }
            return formatLabel(d.reducedExtent, d.reducedIntent);
        } else {
            return d.id; // Default mode: Show node ID
        }
    });
}

/**
 * Centers the graph dynamically within the SVG.
 * @param {Object} svg - The SVG element containing the graph.
 * @param {Object} options - Configuration options for dimensions and padding.
 */
export function centerGraph(svg, { width, height, padding, bbox }) {
    const g = svg.select('.graph-transform');
    //const bbox = g.node()?.getBBox();  // Safe access

    // Check for invalid bounding box values
    if (!bbox || isNaN(bbox.width) || isNaN(bbox.height)) {
        console.error('Invalid bounding box:', bbox);
        return;
    }

    // Calculate the center of the graph
    const graphCenterX = bbox.x + bbox.width / 2;
    const graphCenterY = bbox.y + bbox.height / 2;

    // Calculate the center of the SVG container with padding applied
    const svgCenterX = width / 2;
    const svgCenterY = height / 2;

    // Calculate translation needed to center the graph
    const translateX = svgCenterX - graphCenterX;
    const translateY = svgCenterY - graphCenterY;

    // Apply translation to center the graph
    g.attr('transform', `translate(${translateX}, ${translateY})`);

    console.log('✅ Graph centered with translation:', { translateX, translateY });
}
