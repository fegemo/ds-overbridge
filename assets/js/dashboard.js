
// the dashboard must:
//  0. create an event dispatcher ('planetschange', at least)
//  1. fetch the data
//  2. prepare the movies info data
//  3. load the charts
//    3.1 load the map
//    3.2 load the species unit plot
//    3.3 ...
//  4. bind the plots with the map
//    4.1 bind the species unit plot
//    4.2 ...

function dashboard() {
  let mapFiles = [];
  let moviesFiles = [];
  let visualizations = {
    map: null,
    climate: null,
    terrain: null,
    languages: null,
    species: null,
    starships: null
  };

  build.mapFiles = value => {
    if (typeof value === 'undefined') {
      return mapFiles;
    } else {
      mapFiles = value;
      return build;
    }
  };

  build.moviesFiles = value => {
    if (typeof value === 'undefined') {
      return moviesFiles;
    } else {
      moviesFiles = value;
      return build;
    }
  };

  function build(selection) {
    selection.each((_, i, nodes) => {
      let dashboardEl = d3.select(nodes[i]);

      //  0. create an event dispatcher ('planetschange' when users selects planets)
      // dipatching events: https://bl.ocks.org/mbostock/5872848
      let dispatch = d3.dispatch('dataready', 'planetschange');


      // 1. fetch the data
      let filesQueue = d3.queue();
      [].concat(mapFiles, moviesFiles).forEach(f => {
        filesQueue.defer(callback => {
          d3.json(f)
            .on('progress', e => {
              console.log(e && e.total && (e.loaded / e.total));
            })
            .on('error', err => {
              console.log('erro: ' + err);
            })
            .get(callback);
        });
      });

      //  2. prepare the movies info data
      filesQueue.await((err, grid, hyperspace, planets, region, sector,
        planetsInfo, peopleInfo, speciesInfo, starshipsInfo) => {

          // joins data from the movies using the 'url' field
          speciesInfo = joinWithURL(speciesInfo,
            { homeworld: planetsInfo },
            { people: peopleInfo }
          );
          peopleInfo = joinWithURL(peopleInfo,
            { homeworld: planetsInfo },
            { species: speciesInfo },
            { starships: starshipsInfo }
          );
          planetsInfo = joinWithURL(planetsInfo,
            { residents: peopleInfo }
          );
          starshipsInfo = joinWithURL(starshipsInfo,
            { pilots: peopleInfo }
          );

          // filters the planets from the map source to only the ones
          // there is info from the movies source too
          planets.features = planets.features
            // gets only planets for which we have info from movies
            // (planetInfo) and joins with data from the movies
            .reduce((accum, p) => {
              let planetName = (
                p.properties.name ||
                p.properties.name_web ||
                '').toLowerCase();

              let planetInfo = planetsInfo.find(pi =>
                pi.name.toLowerCase() === planetName);

              return planetInfo ?
                accum.push(Object.assign(p, { movie: planetInfo })) && accum :
                accum;
            }, []);


          // notifies interested parties that the data is ready
          dispatch.call('dataready', null, {
            mapData: {
              grid,
              hyperspace,
              planets,
              region,
              sector
            },
            moviesData: {
              planetsInfo,
              peopleInfo,
              speciesInfo,
              starshipsInfo
            }
          });
      });

      dispatch.on('dataready', ({ mapData, moviesData }) => {
        //  3. load the charts

        //  3.1 load the map
        visualizations.map = map()
          .geography([
            {
              name: 'grid',
              features: mapData.grid.features,
              stroke: 'silver',
              strokeWidth: 0.25,
              fill: 'transparent'
            },
            {
              name: 'hyperspace',
              features: mapData.hyperspace.features,
              fill: 'transparent',
              stroke: 'purple',
              strokeWidth: '2'
            },
            {
              name: 'planets',
              features: mapData.planets.features,
              itemClasses: ['planet'],
              label: p => p.movie.name
            },
            {
              name: 'region',
              features: mapData.region.features,
              stroke: '#444',
              strokeWidth: 1,
              fill: (d, i) => d3.scaleLinear()
                .domain([
                  Math.min(...mapData.region.features.map(r => r.properties.rid)),
                  Math.max(...mapData.region.features.map(r => r.properties.rid))])
                .interpolate(d3.interpolateHsl)
                .range([d3.rgb('#fff'), d3.rgb('#444')])(d.properties.rid)
            },
            {
              name: 'sector',
              features: mapData.sector.features,
              fill: 'transparent',
              stroke: 'black',
              strokeWidth: '0.25'
            }])
          .width(dashboardEl.node().getClientRects()[0].width)
          .height(dashboardEl.node().getClientRects()[0].height)
          .onBrushEnd(selected => {
            dispatch.call('planetschange', null, selected);
          });

        dashboardEl.select('#map').call(visualizations.map);



        //  3.2 load the species unit plot
        let genderScale = d3.scaleOrdinal()
          .domain(['male', 'female', 'n/a', 'none'])
          .range(['blue', 'pink', 'silver', 'silver']);

        visualizations.species = unit()
          .width(205)
          .height(400)
          .unitLength(7)
          .caption(d => d.name)
          .units(d => d.people)
          .unitFillColor(d => genderScale(d.gender));

        dashboardEl.select('#people-of-interest .chart')
          .call(visualizations.species);


        //  3.3 load the starships unit plot
        let mgltScale = d3.scaleLinear()
          .domain([
            Math.min(...moviesData.starshipsInfo.map(si =>
              numberOr(si.MGLT, +Infinity))),
            Math.max(...moviesData.starshipsInfo.map(si =>
              numberOr(si.MGLT, -Infinity)))
          ])
          .interpolate(d3.interpolateHsl)
          .range([d3.rgb('#444'), d3.rgb('#fff')]);

        visualizations.starships = unit()
          .width(205)
          .height(150)
          .unitLength(7)
          .caption(d => d.name)
          .units(d => d.ships)
          .unitFillColor(d => Number.isNaN(+d.MGLT) ? 'purple' : mgltScale(+d.MGLT));

        dashboardEl.select('#piloting-knowledge .chart')
          .call(visualizations.starships);


        //  3.4 load the languages cloud
        visualizations.languages = cloud()
          .width(205)
          .height(205);

        dashboardEl.select('#languages .chart')
          .call(visualizations.languages);

        //  3.5.1 load the climates donut chart
        visualizations.climate = donutChart()
          .width(195)
          .height(195)
          .transTime(750)
          .margin({left: 5, top: 5, right: 5, bottom: 5})
          .cornerRadius(3)
          .padAngle(0.015)
          .variable('planets')
          .category('climate');

        d3.select('#chart-climate')
          .call(visualizations.climate);

        //  3.5.2 load the terrains donut chart
        visualizations.terrain = donutChart()
          .width(195)
          .height(195)
          .transTime(750)
          .margin({left: 5, top: 5, right: 5, bottom: 5})
          .cornerRadius(3)
          .padAngle(0.015)
          .variable('planets')
          .category('terrain');

        d3.select('#chart-terrain')
          .call(visualizations.terrain);


        //  4. bind the plots with the map
        //  4.1 bind the species unit plot
        dispatch.on('planetschange.species', selectedPlanets => {
          let selectedPeople = [].concat(...selectedPlanets.map(sp => sp.residents));
          let uniqueSpecies = [...new Set([].concat(...selectedPeople.map(sp => sp.species)))];
          let uniqueSpeciesWithSelectedPeople = uniqueSpecies.map(us => {
            us = Object.assign({}, us);
            us.people = us.people
              .filter(p => selectedPeople.indexOf(p)  > -1)
              .sort((p1, p2) =>
                (p1.gender > p2.gender ? 1 : -1) ||
                (p2.name > p1.name ? 1 : -1)
            );
            return us;
          });

          visualizations.species.data(uniqueSpeciesWithSelectedPeople)
        });

        //  4.2 bind the starships unit plot
        dispatch.on('planetschange.starships', selectedPlanets => {
          let selectedPeople = [].concat(...selectedPlanets.map(sp => sp.residents));
          let pilotedStarships = [].concat(...selectedPeople.map(sp => sp.starships));
          let starshipCategories = [...new Set(
            [].concat(
              ...pilotedStarships.map(ps => ps.starship_class.toLowerCase())
            )
          )];
          let starshipsByCategory = starshipCategories.map(cat => {
            return {
              name: cat,
              ships: pilotedStarships.filter(ps =>
                ps.starship_class.toLowerCase() === cat)
            };
          });

          visualizations.starships.data(starshipsByCategory);
        });

        //  4.3 languages cloud
        dispatch.on('planetschange.languages', selectedPlanets => {
          // planeta tem alguns residentes notáveis
          // residente têm uma espécie
          // espécie tem uma língua
          // contar: a população de cada planeta * línguas faladas
          let planetsWithLanguages = selectedPlanets.map(sp =>
            ({
              planet: sp.name,
              population: sp.population,
              languages: [...new Set([].concat(...sp.residents.map(p =>
                [].concat(p.species.map(s =>
                  s.language.toLowerCase()
                ))
              )))]
            })
          );

          let languagesFrequency = [...new Set([].concat(...planetsWithLanguages.map(pwl => pwl.languages)))]
            .reduce((freq, language) => {
              freq[language] = planetsWithLanguages.filter(pwl => pwl.languages.indexOf(language) !== -1)
                .reduce((count, pi) => {
                  return count + (Number.isInteger(parseInt(pi.population)) ?
                    parseInt(pi.population) :
                    1)
                }, 0)
              return freq;
            }, {});

          visualizations.languages.data(languagesFrequency);
        });

        //  4.4 climate and terrains donut charts
        dispatch.on('planetschange', selectedPlanets => {
          let allClimates = [].concat(
            ...selectedPlanets.map(p => p.climate.split(', '))
          );
          let climatesFrequency = d3.entries(countBy(allClimates, c => c))
            .map(c => ({planets: c.value, climate: c.key}));

          visualizations.climate.data(climatesFrequency);



          let allTerrains = [].concat(
            ...selectedPlanets.map(p => p.terrain.split(/[\s,]+/))
          );
          let terrainsFrequency = d3.entries(countBy(allTerrains, t => t))
            .map(t => ({planets: t.value, terrain: t.key}));

          visualizations.terrain.data(terrainsFrequency);
        });

      });


    });
  }

  return build;
}


d3.select('#dashboard')
  .call(
    dashboard()
      .mapFiles(
        ['grid', 'hyperspace', 'planets', 'region', 'sector']
          .map(prependWith('data/'))
          .map(appendWith('.geojson'))
        )
      .moviesFiles(
        ['planets', 'people', 'species', 'starships']
          .map(prependWith('data/'))
          .map(appendWith('.json'))
        )
    );
