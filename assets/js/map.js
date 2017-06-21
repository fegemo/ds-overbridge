
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
  .defer(d3.json, 'data/people.json')
  .defer(d3.json, 'data/species.json')
  .await((err, grid, hyperspace, planets, region, sector, planetsInfo, peopleInfo, speciesInfo) => {
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
          itemClasses: ['planet'],
          label: p => p.movie.name
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



    let donut = donutChart()
      .width(800)
      .height(600)
      // .width(300)
      // .height(150)
      .cornerRadius(3) // sets how rounded the corners are on each slice
      .padAngle(0.015) // effectively dictates the gap between slices
      .variable('frequency')
      .category('climate');

    let allClimates = [].concat(...planetsInfo.map(p => p.climate.split(', ')));
    let climatesFrequency = new Map([...new Set(allClimates)].map(
      x => [x, allClimates.filter(y => y === x).length]
    ));
    climatesFrequency = Array.from(climatesFrequency.entries())
      .map(([key, value]) => ({ climate: key, frequency: value}))
    let maximumClimateFrequency = Math.max(...climatesFrequency.map(c => c.frequency));
    climatesFrequency.forEach(c => c.frequency /= maximumClimateFrequency);

    d3.select('#planets #chart-climate')
      .datum(climatesFrequency)
      .call(donut)

    let allTerrains = [].concat(...planetsInfo.map(p => p.terrain.split(', ')));
    let terrainsFrequency = new Map([...new Set(allTerrains)].map(
      x => [x, allTerrains.filter(y => y === x).length]
    ));
    terrainsFrequency = Array.from(terrainsFrequency.entries())
      .map(([key, value]) => ({ terrain: key, frequency: value}))
    let maximumTerrainFrequency = Math.max(...terrainsFrequency.map(c => c.frequency));
    terrainsFrequency.forEach(c => c.frequency /= maximumTerrainFrequency);

    d3.select('#planets #chart-terrain')
      .datum(terrainsFrequency)
      .call(donut.category('terrain'));


    // planeta tem alguns residentes notáveis
    // residente têm uma espécie
    // espécie tem uma língua
    // contar: (1) a quantidade residentes notáveis que falam uma língua ou
    //  (2) a população de cada planeta * línguas faladas

    // tag cloud (worlde-like) of languages
    // uniquePeopleURLsInPlanets = ['http://swapi.co/people/1', '...', ...];
    let uniquePeopleURLsInPlanets = new Set([].concat(...planetsInfo.map(pi => pi.residents)));
    // uniquePeopleInPlanets = [{ name: 'Luke Skywalker', ... }, {...}, ...];
    let uniquePeopleInPlanets = [...uniquePeopleURLsInPlanets].map(pu => peopleInfo.find(pi => pu === pi.url));
    // speciesURLsOfPeople = ['http://swapi.co/species/1', '...', ...];
    let speciesURLsOfPeople = [].concat(...uniquePeopleInPlanets.map(p => p.species));
    // speciesOfPeople = [{name: 'Human', language: 'Galactic Basic' ...}, ...];
    let speciesOfPeople = speciesURLsOfPeople.map(su => speciesInfo.find(s => su === s.url));
    // languagesOfSpecies = ['galactic basic', 'mon calamarian', ...];
    let languagesOfSpecies = speciesOfPeople.map(s => s.language.toLowerCase());
    // languagesFrequency = { 'galactic basic': 37, 'mon calamarian': 1 ...};
    let languagesFrequency = languagesOfSpecies.reduce((frequency, l) => {
      frequency[l] = (frequency[l] + 1) || 1;
      return frequency;
    }, {});


    let planetsWithLanguages = planetsInfo.map(pi => {
      return {
        planet: pi.name,
        population: pi.population,
        languages: [...new Set([].concat(...pi.residents.map(rURL => {
          return [].concat(peopleInfo.find(pei => pei.url === rURL).species.map(sURL => {
            return speciesInfo.find(s => s.url === sURL).language.toLowerCase()
          }));
        })))]
      };
    });

    // PAREI AQUI!!
    languagesFrequency = [...new Set([].concat(...planetsWithLanguages.map(pwl => pwl.languages)))].reduce((frequency, l) => {
      frequency[l] = planetsWithLanguages.filter(pwl => pwl.languages.indexOf(l) !== -1).reduce((count, pi) => count + (Number.isInteger(parseInt(pi.population)) ? parseInt(pi.population) : 1), 0);
      return frequency;
    }, {});
    // languagesFrequency = planetsWithLanguages.reduce((frequency, pwl) => {
    //   frequency[pwl.language] = frequency[pwl.language]+1
    //   return frequency;
    // }, {});

    debugger;
    drawWordCloud();

    function drawWordCloud(){
      word_count = languagesFrequency;



        var svg_location = "#languages .chart";
        var width = 205;
        var height = 205;

        var fill = d3.scaleOrdinal(d3.schemeCategory20);

        var word_entries = d3.entries(word_count);

        var xScale = d3.scaleLinear()
           .domain([0, d3.max(word_entries, function(d) {
              return d.value;
            })
           ])
           .range([8,24]);

        d3.layout.cloud().size([width, height])
          .timeInterval(20)
          .words(word_entries)
          .fontSize(d => xScale(+d.value))
          .text(d => d.key)
          .rotate(() => ~~(Math.random() * 2) * 90)
          .font('Arial, OpenSans, sans-serif')
          .on('end', draw)
          .start();

        function draw(words) {
          d3.select(svg_location).append("svg")
              .attr("width", width)
              .attr("height", height)
            .append("g")
              .attr("transform", "translate(" + [width >> 1, height >> 1] + ")")
            .selectAll("text")
              .data(words)
            .enter().append("text")
              .style("font-size", function(d) { return xScale(d.value) + "px"; })
              .style("font-family", d => d.font)
              .style("fill", function(d, i) { return fill(i); })
              .attr("text-anchor", "middle")
              .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
              })
              .text(function(d) { return d.key; });
        }

        d3.layout.cloud().stop();
      }


});
