//src/core/lattice.js

import { renderGraph, centerGraph  } from './rendering.js';
import { createSimulation } from './simulation.js';
import { addInteractivity } from './interactivity.js';
import * as d3 from 'd3';
export function createLattice(graphData, options = {}) {
  const { container = 'body', width = 800, height = 600 } = options;

   // Ensure options are passed properly
   if (!graphData || !graphData.nodes || !graphData.links) {
    throw new Error('Invalid graphData. Ensure it includes nodes and links.');
  }

  const { svg, linkGroup, nodeGroup, labelGroup } = renderGraph(container, graphData, { width, height });
  //const g = svg.select('.graph-transform'); // Select the `g` group
  const simulation = createSimulation(graphData, linkGroup, nodeGroup,labelGroup, { width, height });

  addInteractivity(svg, simulation);

   // Center graph after initial rendering
   centerGraph(svg, graphData, width, height);

  return { svg, simulation };
}
