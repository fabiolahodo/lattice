//src/core/interactivity.js
import { zoom } from 'd3-zoom';
import { drag } from 'd3-drag';
import * as d3 from 'd3';
export function addInteractivity(svg, simulation) {
  //const g = svg.append('g').attr('class', 'graph-transform');
  const g = svg.select('.graph-transform');

  // Add zoom behavior
  svg.call(
    d3.zoom()
      .scaleExtent([0.1, 10]) // Zoom scale limits
      .on('zoom', (event) => {
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
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );
}
