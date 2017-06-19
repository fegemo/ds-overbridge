
function map() {
  let width = 800;
  let height = 400;
  let geography = [];

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

  function build(selection) {
    selection.each((d, i, nodes) => {
      // generate chart here

      let svg = selection.append('svg')
        .attr('width', width)
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

          layerGroup = layerGroup
            .selectAll('path')
            .data(layer.features)
            .enter()
            .append('path')
            .attr('d', path)
            .classed(layer.itemClasses, true);

          if (layer.fillFunction || layer.fill) {
            layerGroup = layerGroup.style('fill', layer.fill);
          }
          if (layer.stroke) {
            layerGroup = layerGroup.style('stroke', layer.stroke);
          }
          if (layer.strokeWidth) {
            layerGroup = layerGroup.style('stroke-width', layer.strokeWidth);
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
            svg.selectAll('.layer-planets path.picked').classed('picked', false);
          }
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

    });
  }


  return build;
}



d3.queue()
  .defer(d3.json, 'data/grid.geojson')
  .defer(d3.json, 'data/hyperspace.geojson')
  .defer(d3.json, 'data/planets.geojson')
  .defer(d3.json, 'data/region.geojson')
  .defer(d3.json, 'data/sector.geojson')
  .defer(d3.json, 'data/planets.json')
  .await((err, grid, hyperspace, planets, region, sector, planetsInfo) => {
    let mapEl = d3.select('#map');

    let galaxyMap = map()
      .geography([
        {
          name: 'grid',
          features: grid.features,
          stroke: 'silver',
          strokeWidth: 0.25,
          fill: 'transparent'
        },
        {
          name: 'hyperspace',
          features: hyperspace.features,
          fill: 'transparent',
          stroke: 'purple',
          strokeWidth: '2'
        },
        {
          name: 'planets',
          features: planets.features
            // gets only canonical planets (not from the extented universe)
            .filter(p => p.properties.canon)
            // gets only planets for which we have info from movies (planetInfo)
            .filter(p => {
              let planetName = (p.properties.name || p.properties.name_web
                || '').toLowerCase();
              let planetsWithInfo = planetsInfo.map(
                pi => pi.name.toLowerCase())
              return planetsWithInfo.indexOf(planetName) !== -1;
            })
            // joins with data from the movies
            .map(p => {
              let planetName = (p.properties.name || p.properties.name_web
                || '').toLowerCase();
              let fromMovie = planetsInfo.find(
                pi => pi.name.toLowerCase() === planetName)
              return Object.assign(p, { movie: fromMovie });
            }),
          itemClasses: ['planet']
        },
        {
          name: 'region',
          features: region.features,
          stroke: '#444',
          strokeWidth: 1,
          fill: (d, i) => d3.scaleLinear()
            .domain([
              Math.min(...region.features.map(r => r.properties.rid)),
              Math.max(...region.features.map(r => r.properties.rid))])
            .interpolate(d3.interpolateHsl)
            .range([d3.rgb('#fff'), d3.rgb('#444')])(d.properties.rid)
        },
        {
          name: 'sector',
          features: sector.features,
          fill: 'transparent',
          stroke: 'black',
          strokeWidth: '0.25'
        }])
      .width(mapEl.node().getClientRects()[0].width)
      .height(mapEl.node().getClientRects()[0].height);


    d3.select('#map')
      .call(galaxyMap);

});
