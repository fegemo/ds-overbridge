
function map() {
  let width = 800;
  let height = 400;
  let geography = [];
  let onBrushEnd = function() {};

  function build(selection) {

    selection.each((d, i, nodes) => {
      // generate chart here
      let svg = d3.select(nodes[i]).append('svg');


      let updateGeography =  () => {
        svg.attr('width', width)
          .attr('height', height);

        let projection = d3.geoMercator()
          .scale(width/2/Math.PI)
          .translate([width/2, height/2]);

        let path = d3.geoPath().projection(projection);

        // zooming and panning
        let zoom = d3.zoom()
          .scaleExtent([1,8])
          .on('zoom', () => {
            svg.selectAll('g').attr('transform', d3.event.transform);
          });

          svg.call(zoom);


        // loads the geometry
        ['region', 'grid', /*'hyperspace',*/ 'sector', 'planets'].forEach(layerName => {
          layer = geography.find(l => l.name === layerName);
          let layerGroup = svg.append('g')
            .classed(`map-layer layer-${layer.name}`, true);

            let enterPath = layerGroup
              .selectAll('path')
              .data(layer.features)
              .enter()
            layerGroup = enterPath.append('path')
              .attr('d', path)
              .classed(layer.itemClasses, true);

            if (layer.fill) {
              layerGroup = layerGroup.style('fill', layer.fill);
            }
            if (layer.stroke) {
              layerGroup = layerGroup.style('stroke', layer.stroke);
            }
            if (layer.strokeWidth) {
              layerGroup = layerGroup.style('stroke-width', layer.strokeWidth);
            }
            if (layer.label) {
              enterPath.append('text')
                .text(layer.label)
                .classed('planet-name', true)
                .attr('x', p => projection(p.geometry.coordinates)[0])
                .attr('y', p => projection(p.geometry.coordinates)[1] + 15);
            }
        });



        // adds brushing (selecting rectangularly) to the planets
        let brush = d3.brush()
          .extent([[0, 0], [width, height]])
          .on('brush', () => {
            // if this is a zooming event, ignore it and return
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') {
              return;
            }

            let region = d3.event.selection;
            let brushX1 = region[0][0],
              brushY1 = region[0][1],
              brushX2 = region[1][0],
              brushY2 = region[1][1];

            svg.selectAll('.layer-planets path').classed('picked', d => {
              let projectedPlanetPosition = projection(d.geometry.coordinates);
              let planetX = projectedPlanetPosition[0],
                planetY = projectedPlanetPosition[1];

              return (brushX1 <= planetX && planetX <= brushX2)
                  && (brushY1 <= planetY && planetY <= brushY2);
            });
          })
          .on('end', () => {
            if (!d3.event.selection) {
              // clears the selection
              svg.selectAll('.layer-planets path.picked').classed('picked', false);
            }

            onBrushEnd.call(this,
              // TODO: is this really the way to pick the selected planets? Looks ugly and hacky
              Array.from(svg.selectAll('.picked')._groups[0])
                .map(el => el.__data__.movie));

          });

        svg.append('g')
          .classed('brush', true)
          .call(brush);

        // adds control to allow panning when 'shift' is pressed
        'keydown keyup'.split(' ').forEach(
          name => document.body.addEventListener(name, (e) => {
            if (e.key.toLowerCase() === 'shift') {
              // adds a .deactivated to the brush overlay to make it
              // pointer-events: none
              svg.select('.brush .overlay')
                .classed('deactivated', e.type === 'keydown');
            }
          })
        );
      };

      updateGeography();

      // makes the map resizable (every 1s - throttled due to performance)
      window.addEventListener('resize', throttle(e => {
        width = window.innerWidth;
        height = window.innerHeight;
        svg.selectAll('g').remove();
        updateGeography();
      }, 1000));

    });
  }


  build.width = value => {
    if (typeof value === 'undefined') {
      return width;
    } else {
      width = value;
      return build;
    }
  };

  build.height = value => {
    if (typeof value === 'undefined') {
      return height;
    } else {
      height = value;
      return build;
    }
  };

  build.geography = value => {
    if (typeof value === 'undefined') {
      return geography;
    } else {
      geography = value;
      return build;
    }
  };

  build.onBrushEnd = value => {
    if (typeof value === 'undefined') {
      return onBrushEnd;
    } else {
      onBrushEnd = value;
      return build;
    }
  };


  return build;
}
