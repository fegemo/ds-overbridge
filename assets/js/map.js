
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

      let zoom = d3.zoom()
        .scaleExtent([1,8])
        .on('zoom', zoomed);

      svg.call(zoom);

      ['region', 'grid', /*'hyperspace',*/ 'sector', 'planets'].forEach(layerName => {
        layer = geography.find(l => l.name === layerName);
        let layerGroup = svg.append('g')
          .classed(`map-layer layer-${layer.name}`, true);

          layerGroup
            .selectAll('path')
            .data(layer.features)
            .enter()
            .append('path')
            .attr('d', path)
            .style('fill', d => layer.fillFunction ? layer.fillFunction(d) : layer.fill)
            .style('stroke', layer.stroke)
            .style('stroke-width', layer.strokeWidth)
      });



      function zoomed(e) {
        svg.selectAll('g').attr('transform', d3.event.transform);
      }

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
  .await((err, grid, hyperspace, planets, region, sector) => {
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
          features: planets.features.filter(p => p.properties.canon),
          stroke: 'transparent',
          strokeWidth: 0,
          fill: 'orange'
        },
        {
          name: 'region',
          features: region.features,
          stroke: '#444',
          strokeWidth: 1,
          fillFunction: (d, i) => d3.scaleLinear()
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
