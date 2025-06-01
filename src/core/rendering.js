// src/core/rendering.js

// Import necessary dependencies
import * as d3 from 'd3';
import { GRAPH_CONFIG } from './config.js';
import { addNodeInteractivity, computeSuperSubConcepts, updateLinks } from './interactivity.js';
import { computeReducedLabels, formatLabel } from './reducedLabeling.js';
import { assignLayers, orderVerticesWithinLayers, adjustLayerSpacing, adjustNodePositions  } from './layering.js';

/**
 * Renders the graph with nodes and links.
 * @param {string} container - The CSS selector for the container
 * @param {Object} graphData - The graph data containing nodes and links
 * @param {Object} options - Options for width and height of the SVG
 * @returns {Object} - References to the SVG and groups created
 */

let nodeGroup, labelGroup, linkGroup;

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

    // Assign layers and node positions
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

    // Order vertices within layers to minimize edge crossings
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
            node.y = padding + layerIndex * (height / layers.length);
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

        if (!link.source || !link.target) {
            console.error("❌ Link has missing source or target:", link);
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
    const linkContainer = g.append("g").attr("class", "link-group");
    //linkGroup = g.append("g")
    linkGroup = linkContainer
        .selectAll('line')
        .data(graphData.links)
        .join("line")
        .attr('class', 'link')
        .attr('stroke', GRAPH_CONFIG.link.color)
        .attr('stroke-width', d => d.weight)
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

    console.log("📌 Drawing Nodes...");
    nodeGroup = g.selectAll('.node-group')
        .data(graphData.nodes)
        .enter()
        .append("g")
        .attr("class", "node-label-group")
        .attr("transform", d => `translate(${d.x}, ${d.y})`);

    nodeGroup.append("circle")
        .attr("r", GRAPH_CONFIG.node.maxRadius)
        .attr("fill", d => d.color || GRAPH_CONFIG.node.color);
    

    labelGroup = d3.selectAll(".node-label-group");

    // Apply currently selected label mode from dropdown
    const selectedMode = document.getElementById("labeling-mode")?.value || "id";
    updateLabels(selectedMode, labelGroup);

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

    if (graphData && graphData.nodes && graphData.links) {
        addNodeInteractivity(nodeGroup, linkGroup, graphData, nodeGroup, updateLinks);
    } else {
        console.error("❌ addNodeInteractivity() received invalid graphData:", graphData);
    }
    
    return { svg, linkGroup, nodeGroup, labelGroup };
}

export function updateNodes(graphData) {
    if (!graphData || !graphData.nodes) {
        console.error("❌ updateNodes() called without valid graphData!");
        return;
    }

    if (!nodeGroup || !labelGroup) {
        console.error("❌ updateNodes() called before nodeGroup or labelGroup was initialized!");
        return;
    }
       
     // ✅ Ensure nodes visually move
     nodeGroup.attr("transform", d => `translate(${d.x}, ${d.y})`);
    
    // ✅ Also update links to match new node positions
    updateLinks(graphData);
    }

/**
 * Wraps long text into multiple lines to prevent overlap.
 * @param {string} text - The input text to wrap.
 * @param {number} maxCharsPerLine - Maximum characters allowed per line.
 * @returns {string} - Wrapped text with line breaks.
 */

function wrapText(text, maxCharsPerLine) {
    const words = text.split(" ");
    let lines = [];
    let currentLine = [];

    words.forEach(word => {
        if (currentLine.join(" ").length + word.length > maxCharsPerLine) {
            lines.push(currentLine.join(" ")); // Add the current line to the array
            currentLine = [word];  // Start a new line
        } else {
            currentLine.push(word); // Continue adding words to the current line
        }
    });

    if (currentLine.length) {
        lines.push(currentLine.join(" "));
    }

    return lines.join("<br>"); // Add line breaks for better display
}

/**
 * Updates node labels based on the selected labeling mode.
 * @param {string} mode - The selected labeling mode ("default", "full", "reduced").
 * @param {Object} labelGroup - The D3 selection of node labels.
 */
export function updateLabels(mode, labelGroup) {
    console.log(`🔄 Updating Labels: Mode = ${mode}`);

    // Select all nodes with labels
    d3.selectAll(".node-label-group").each(function (d, i) {
        if (!d || !d.id) {
            console.warn("⚠️ Skipping undefined node.");
            return;
    }

     // Select node group
    const nodeGroup = d3.select(this);

    // Clear existing labels
    nodeGroup.selectAll("foreignObject").remove();

    // Extract the extent and intent text based on the mode
    const extentText = (mode === "full" ? d.fullExtent : d.reducedExtent).join(", ");
    const intentText = (mode === "full" ? d.fullIntent : d.reducedIntent).join(", ");

    // Wrap long labels for better display
    const formattedExtent = wrapText(extentText, 20); // Wrap every 20 characters
    const formattedIntent = wrapText(intentText, 20);

    // Compute dynamic width based on text size
    const maxTextWidth = Math.max(extentText.length, intentText.length) * 8;
    const extentWidth = Math.max(150, maxTextWidth);// Minimum width of 120px

    const intentWidth = extentWidth; // Use the same width for both labels
    const labelHeight = 15; // Each label's height
    const ySpacing = 2; // Extra space to separate labels

    // Adjust positioning based on node's height
    const nodeRadius = GRAPH_CONFIG.node.maxRadius;

    // Stagger label positions to reduce X-axis overlap
    const staggerOffset = (i % 2 === 0) ? 10 : -10; // Shift every second node


    if (mode === "full" || mode === "reduced") {
        // Extent Label (Above Node)
        if (extentText.trim() !== "") {
        nodeGroup.append("foreignObject")
            .attr("width", extentWidth)
            .attr("height", labelHeight)
            .attr("x", -extentWidth / 2 + staggerOffset) // Center horizontally
            .attr("y", -(nodeRadius + labelHeight + ySpacing)) // Position above node
            .html(() => `<div style="text-align:center; font-weight:bold; white-space:nowrap;">${extentText}</div>`);
        }
        // Intent Label (Below Node)
        if (intentText.trim() !== "") {
        nodeGroup.append("foreignObject")
            .attr("width", intentWidth)
            .attr("height", labelHeight)
            .attr("x", -intentWidth / 2 + staggerOffset) // Center horizontally
            .attr("y", nodeRadius + ySpacing) // Position below node
            .html(() => `<div style="text-align:center; font-style:italic; white-space:nowrap;">${intentText}</div>`);
            }
        } else {
        // Default Mode (Node ID Only)
        nodeGroup.append("foreignObject")
            .attr("width", 100)
            .attr("height", labelHeight)
            .attr("x", -50) // Center horizontally
            .attr("y", -labelHeight - ySpacing) // Above node
            .html(() => `<div style="text-align:center;">${d.id}</div>`);
    }
    });
}

window.updateLabels = updateLabels; // Make it globally available

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
