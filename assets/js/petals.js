
class Country {
  constructor({ symbol, name, indices }) {
    this.name = name;
    this.symbol = symbol;
    this.indices = indices;
  }

  averageIndex() {
    return this.average ? this.average :
      (d3.mean(this.indices, idx => idx.value));
  }
}

class Petal {
  constructor({ name, value }, country, flowerType) {
    this.value = value;
    this.indexName = name;
    this.country = country;
    this.flowerType = flowerType;
  }


  dropPetal(flowerContainer, i, nodes) {
    flowerContainer
      .classed(`category`, true)
      .classed(`category-${slugify(this.indexName)}`, true);

    let petalData = Petal.getPetalData(this.flowerType)
      .concat(Petal.getPetalData(this.flowerType).map(p => ({ x: p.x, y: -p.y })).reverse());

    return flowerContainer.
      append('path')
      .attr('d', petal => Petal.getPathGenerator({
        xScale: d3.scaleLinear().range([0, petal.value * 25]),
        yScale: d3.scaleLinear().range([0, 3])
      })(petalData))
      .attr('stroke', Petal.colorScale(i))
      .attr('stroke-width', 2)
      .attr('fill', Petal.colorScale(i))
      .attr('transform', d => `rotate(${i / nodes.length * 360}) translate(2, 0) scale(1, 1)`)
        .transition(this.t)
        .attr('transform', d => `rotate(${i / nodes.length * 360}) translate(2, 0) scale(0.5, 1)`)
        .transition(this.t)
          .delay((_1, _2) => 1500+(i * 50))
          .attr('transform', d => `rotate(${i / nodes.length * 360}) translate(2, 0) scale(1, 1)`);

  }

  static get colorScale() {
    Petal._colorScale = Petal._colorScale ||
      // escala padrão do d3
      // d3.scaleOrdinal(d3.schemeCategory20);
      // escala criada por mim
      // d3.scaleOrdinal([
      //   '#5F99FD',
      //   '#2AFDBF',
      //   '#BBFE05',
      //   '#FD8E3E',
      //   '#FD5176',
      //   '#FEF03F',
      //   '#5CFE17',
      //   '#10FE8A',
      //   '#1018FE',
      //   '#CF50FE',
      //   '#FE1F10'
      // ]);
    // escala baseada na escala da Google
    d3.scaleOrdinal([
      '#3366cc',
      '#dc3912',
      '#ff9900',
      '#109618',
      '#dd4477',
      '#b82e2e',
      '#994499',
      '#22aa99',
      '#aaaa11',
      '#329262',
      '#5574a6',
      '#3b3eac'
    ]);
    return Petal._colorScale;
  }

  static getPetalData(flowerType) {
    let petalByFlowerType = {
      ornitop: [
        { x: 0.00, y: 0.00},
        { x: 0.25, y: 1.00},
        { x: 0.50, y: 0.75},
        { x: 0.75, y: 0.50},
        { x: 1.00, y: 0.00}
      ],
      daisy: [
        { x: 0.00, y: 0.00},
        { x: 0.25, y: 0.20},
        { x: 0.50, y: 0.85},
        { x: 0.75, y: 0.90},
        { x: 1.00, y: 0.00}
      ],
      cylindric: [
        { x: 0.00, y: 0.00},
        { x: 0.05, y: 0.05},
        { x: 0.10, y: 0.10},
        { x: 0.15, y: 0.15},
        { x: 0.20, y: 0.95},
        { x: 0.40, y: 1.00},
        { x: 0.80, y: 1.00},
        { x: 0.85, y: 0.90},
        { x: 0.90, y: 0.85},
        { x: 0.95, y: 0.80},
        { x: 1.00, y: 0.00}
      ]
    }
    return petalByFlowerType[flowerType];
  }

  static getPathGenerator({xScale, yScale}) {
    return d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveBasis);
  }
}


class PetalVisualization {
  constructor({ container, data }) {
    this.containerEl = d3.select(container);
    this.data = data;
    this.graphPadding = {
      top: 40,
      right: 40,
      bottom: 60,
      left: 50
    };
    this.flowerType = getParameterByName('petal', location.href);
    if (['daisy', 'ornitop', 'cylindric'].indexOf(this.flowerType) < 0) {
      this.flowerType = 'daisy';
    }
  }

  load() {
    let availableHeight = window.innerHeight - this.containerEl.node().offsetTop;
    this.containerEl.style('height', `${availableHeight}px`);
    this.createGraph();
    this.determineBounds();
    let scales = this.getScales();
    this.createAxes(scales);
    this.createFlowers(scales);
    this.createLegend();
    this.createSortingControls()
    this.attachHoverPetals();
    this.attachClickCountries();
    // this.attachHoverFlowers();
  }

  determineBounds() {
    this.containerDimensions = {
      width: this.graphEl.node().getClientRects()[0].width,
      height: this.graphEl.node().getClientRects()[0].height
    };

    this.graphDimensions = {
      width: this.containerDimensions.width - (this.graphPadding.left + this.graphPadding.right),
      height: this.containerDimensions.height - (this.graphPadding.top + this.graphPadding.bottom)
    };
  }

  getScales() {
    let yBounds = d3.extent(this.data, d => d.averageIndex());

    return {
      x:  d3.scaleBand()
            .padding(0.05)
            .range([this.graphPadding.left, this.graphPadding.left + this.graphDimensions.width])
            .domain(this.data.map(c => c.name))
            ,
      y:  d3.scaleLinear()
            .domain([yBounds[1], 0])
            .range([0, this.graphDimensions.height])
    };
  }

  createGraph() {
    this.graphEl = this.containerEl.append('svg').classed('graph', true);

    this.mainGroupEl = this.graphEl
      .append('g')
      .attr('transform', `translate(${this.graphPadding.left/2}, ${this.graphPadding.top})` );
  }

  createAxes(scales) {
    let verticalAxisGroupEl = this.graphEl.append('g');
    verticalAxisGroupEl.attr(
      'transform', `translate(${this.graphPadding.left}, ${this.graphPadding.top})`);
    this.verticalAxis = d3.axisLeft(scales.y);
    let verticalAxisNodes = verticalAxisGroupEl.call(this.verticalAxis);
    this.styleAxisNodes(verticalAxisNodes);
  }

  createFlowers(scales) {
    this.t = d3.transition()
      .duration(400)
      .ease(d3.easeCubicOut);

    this.flowersEl = this.mainGroupEl
      .selectAll('g')
      .data(this.data);

    let flowerGroupEl = this.flowersEl
      .enter()
      .append('g')
      .classed('flower', true)
      .style('opacity', 0.25)
      .attr('transform', (d, i, nodes) =>
        `translate(${scales.x(d.name)}, ${scales.y(d.averageIndex())*1.5})`)
    flowerGroupEl
      .transition(this.t)
        .delay(() => d3.randomUniform(1000, 2800)())
        .duration(2000)
        .style('opacity', 1)
        .attr('transform', (d, i, nodes) =>
          `translate(${scales.x(d.name)}, ${scales.y(d.averageIndex())})`);

    // miolo
    const kernelRadius = 2;
    flowerGroupEl.append('circle')
      .attr('fill', 'white')
      .attr('r', kernelRadius);

    // caule
    flowerGroupEl.append('line')
      .attr('stroke', 'black')
      .attr('stroke-width', '1')
      .attr('opacity', 0.3)
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', d => this.graphDimensions.height - scales.y(d.averageIndex()))
      .attr('y2', kernelRadius)
      .classed('stem', true);

    // texto no caule
    flowerGroupEl.append('text')
      .text(d => d.name)
      .attr('fill', 'black')
      .attr('font-size', 12)
      .attr('font-family', 'Arial')
      .attr('transform', 'rotate(-90)')
      .attr('dx', '-30')
      .attr('dy', '0')
      .attr('text-anchor', 'end');


    // pétalas
    let petalsGroupEl = flowerGroupEl
      .append('g')
      .classed('petals', true);

    petalsGroupEl.selectAll('g.petal')
      .data(d => d.indices.map(
        index => new Petal(d.indices.find(i => i.name === index.name), d, this.flowerType)))
      .enter()
      .append('g')
        .classed('petal', true)
        .html(d => d)
        .each((d, i, nodes) => {
          // para cada pétala...
          return d.dropPetal(d3.select(nodes[i]), i, nodes);
        })

    // setinha mostrando que país está selecionado
    flowerGroupEl.append('svg:image')
      .attr('xlink:href', d => 'assets/img/arrow-up.svg')
      .attr('height', 15)
      .attr('width', 15)
      .attr('transform', d => `translate(-7.5 ${this.graphDimensions.height - scales.y(d.averageIndex()) + 5})`)
      .classed('arrow', true)
  }

  attachHoverPetals() {
    let fadeBackInTimeout;

    this.containerEl.selectAll('.category')
      .on('mouseover', (d, i, nodes) => {
        window.clearTimeout(fadeBackInTimeout);

        let hoveredPetalEl = nodes[i];
        let hoveredPetalClass = Array.from(hoveredPetalEl.classList)
          .find(c => /category\-[^\d]+/.test(c));
        this.containerEl.selectAll('.category')
          .classed('faded-out', (d, i, nodes) => !nodes[i].classList.contains(hoveredPetalClass));
      })
      .on('mouseout', (d, i, nodes) => {
        fadeBackInTimeout = window.setTimeout(() => {
          Array.from(nodes).forEach(n => n.classList.remove('faded-out'));
        }, 400);
      });
  }

  attachClickCountries() {
    this.containerEl.selectAll('.flower')
      .on('click', (d, i, nodes) => {
        nodes[i].classList.toggle('selected');
        // let clickedFlower = d3.select().
        // clickedFlower.classed('selected', true)
      });
  }


  // attachHoverFlowers() {
  //   this.tooltipEl = this.containerEl.append('g')
  //     .classed('tooltip', true)
  //     .classed('hidden', true);
  //
  //   this.tooltipBars = this.tooltipEl.selectAll('g.tooltip-category')
  //     .data(this.data[0].map(d => { name: d.name, value: 1 }));
  //   this.tooltipBars.enter().append('g')
  //     .classed('tooltip-category')
  //     .
  //
  //   this.containerEl.selectAll('.flower')
  //     .on('mouseover', (d, i, nodes) => {
  //       this.tooltipEl.classed('hidden', false);
  //       this.tooltipEl.datum(d);
  //     })
  //     .on('mouseout', (d, i, nodes) => {
  //       this.tooltipEl.classed('hidden', true);
  //     });
  // }

  createLegend() {
    // housing,income,jobs,community,education,environment,
    // civic engagement,health,life satisfaction,safety,work-life balance
    this.legendEl = this.containerEl.append('svg')
      .classed('legend', true);

    let categories = this.data[0].indices.map(idx => idx.name);

    // cria a flor que fica no alto
    let flowerGroup = this.legendEl.append('g')
      .classed('flower', true)
      .classed('legend-flower', true);

    flowerGroup.selectAll('g.petal')
      .data(categories.map(c => new Petal({ name: c, value: 1}, null, this.flowerType)))
      .enter()
      .append('g')
        .attr('transform', `translate(
          ${this.legendEl.node().getClientRects()[0].width/2}, 135) scale(2.5)`)
        .classed('petal', true)
        .classed('category', true)
        .html(d => d)
        .each((d, i, nodes) => {
          // para cada pétala...
          return d.dropPetal(d3.select(nodes[i]), i, nodes);
        });

    // cria os ícones das categorias e seus nomes
    let categoryGroups = this.legendEl.append('g')
      .classed('categories', true)
      .attr('transform', `translate(0 ${flowerGroup.node().getBoundingClientRect().bottom - 55})`)
      .selectAll('g.category')
      .data(categories)
      .enter()
      .append('g')
        .classed('category-group', true)
        .attr('transform', (d, i) => `translate(0, ${i*30})`)
        .style('color', (d, i) => Petal.colorScale(i));

    categoryGroups.append('circle')
        .style('fill', d => `url(#fill-for-${slugify(d)})`)
        .attr('r', 12.5)
        .attr('cx', 12.5)
        .attr('cy', 12.5)
        .classed('category', true)
        .each((d, i, nodes) => {
          nodes[i].classList.add(`category-${slugify(d)}`);
        });

    // pattern para os ícones das categorias
    let iconPatterns = categoryGroups.append('defs')
      .append('pattern')
      .attr('id', d => `fill-for-${slugify(d)}`)
      .attr('height', '100%')
      .attr('width', '100%')
      .attr('viewBox', '0 0 25 25')
    iconPatterns.append('rect')
      .attr('fill', 'currentColor')
      .attr('height', 25)
      .attr('width', 25);
    iconPatterns.append('svg:image')
        .attr('xlink:href', d => `assets/img/icons/${slugify(d)}.svg`)
        .attr('height', 25)
        .attr('width', 25)
        .attr('transform', 'translate(6.25 6.25) scale(0.5)');



    categoryGroups.append('text')
      .text(d => d)
      .attr('transform', `translate(30 15)`);
  }

  createSortingControls() {
    this.sortingGroupEl = this.legendEl.append('g')
      .classed('sorting-controls', true)
      .attr('transform', `translate(
        ${0}
        ${30})`);

    this.sortingByLabel = this.sortingGroupEl.append('text')
      .style('font-size', '14px')
      .style('transform', 'translateY(-18px)')
      .text('Sorting by ');
    this.sortingGroupEl.append('circle')
      .attr('cx', this.sortingByLabel.node().getBoundingClientRect().width/2)
      .attr('cy', -10)
      .attr('r', 3)
      .attr('fill', 'transparent')
      .attr('stroke', 'orange')
      .attr('stroke-width', '1');


    this.sortingGroupsData = [
      { name: 'country name', selected: true },
      { name: 'the index average', selected: false },
      { name: 'a category', selected: false }];
    this.currentSort = {
      criterion: this.sortingGroupsData.find(sg => sg.selected).name,
      order: 'ascending',
      category: null
    }

    this.sortingGroups = this.sortingGroupEl
      .selectAll('.sorting-option')
      .data(this.sortingGroupsData)

    let sortingGroupsEnter = this.sortingGroups.enter();
    sortingGroupsEnter.append('text')
        .classed('sorting-option', true)
        .text(d => d.name)
        .style('font-size', '14px')
        .classed('active', d => d.selected)
        .attr('dx', this.sortingByLabel.node().getBoundingClientRect().width + 13)
        .attr('dy', (d, i) => (i-1) * 18)
        .each((d, i, nodes) => {
          return d3.select(nodes[i])
            .classed(`sorting-option-${slugify(d.name)}`, true);
        })
        .on('click', (d, i, nodes) => {
          this.sortBy(d.name, 'housing');
        });

    sortingGroupsEnter.append('circle')
      .attr('cx', this.sortingByLabel.node().getBoundingClientRect().width + 8)
      .attr('cy', (d, i) => (i-1) * 18 - 4)
      .attr('r', 3)
      .attr('fill', 'transparent')
      .attr('stroke', 'orange')
      .attr('stroke-width', '1');

    this.sortingLinkToActiveSortOptionData = [
      { x: this.sortingByLabel.node().getBoundingClientRect().width/2, y: -10 },
      { x: this.sortingByLabel.node().getBoundingClientRect().width/2, y: 5 },
      { x: this.sortingByLabel.node().getBoundingClientRect().width + 8, y: -18 - 4 }
    ];
    this.sortingGroupEl.select('path')
      .remove();
    this.sortingGroupEl
      .datum(this.sortingLinkToActiveSortOptionData)
      .append('path')
      .classed('link-to-active-sort', true)
      .attr('d',
        d3.line()
          .x(d => d.x)
          .y(d => d.y)
          .curve(d3.curveBasis)
      )
      .attr('stroke-width', '1')
      .attr('stroke', 'silver')
      .attr('fill', 'transparent')

    this.legendEl.selectAll('.legend-flower .petal')
      .on('click', (d, i, nodes) => {
        this.sortBy('a category', d.indexName);
      });
  }

  sortBy(criterion, category = null) {
    this.sortingGroupsData.forEach(sg => sg.selected = criterion === sg.name)
    this.sortingGroupEl
      .selectAll('.sorting-option')
      .data(this.sortingGroupsData)
      .classed('active', d => d.selected);

    let order = criterion === this.currentSort.criterion ?
      // mesmo critério que anterior, então alterna
      (this.currentSort.order === 'ascending' ? 'descending' : 'ascending'):
      // se mudou critério, default para 'ascending'
      'ascending';

    this.currentSort.criterion = criterion;
    this.currentSort.order = order;
    this.currentSort.category = category;
    let comparison = (a, b) => a > b;
    switch (criterion) {
      case 'country name':
        comparison = (a, b) => {
          let v = d3[order](a.name, b.name);
          return v;
        }
        break;
      case 'the index average':
        comparison = (a, b) => d3[order](a.averageIndex(), b.averageIndex());
        break;
      case 'a category':
        comparison = (a, b) => d3[order](a.indices
          .find(i => i.name === category).value,
          b.indices.find(i => i.name === category).value);
        break;
    }


    this.sortingGroupEl.select('path')
      .remove();
    this.sortingLinkToActiveSortOptionData
    [this.sortingLinkToActiveSortOptionData.length - 1] = {
      x: this.sortingByLabel.node().getBoundingClientRect().width + 8,
      y: (this.sortingGroupsData.map(d => d.name).indexOf(criterion) - 1) * 18 - 4
    };
    this.sortingGroupEl
      .datum(this.sortingLinkToActiveSortOptionData)
      .append('path')
      .classed('link-to-active-sort', true)
      .attr('d',
        d3.line()
          .x(d => d.x)
          .y(d => d.y)
          .curve(d3.curveBasis)
      )
      .attr('stroke-width', '1')
      .attr('stroke', 'silver')
      .attr('fill', 'transparent')

    this.data.sort(comparison);
    this.updateFlowers();
  }

  updateFlowers() {
    let scales = this.getScales();
    let newX = scales.x.domain(this.data.map(c => c.name)).copy();
    let t = d3.transition()
      .duration(750)
      .ease(d3.easeCubicOut);

    this.flowersEl = this.mainGroupEl
      .selectAll('g.flower')
      .sort((a, b) => newX(a.name) - newX(b.name))
      .transition(t)
        .delay((_, i) => i * 20)
        .attr('transform', (d, i, nodes) =>
          `translate(${newX(d.name)}, ${scales.y(d.averageIndex())})`);
  }

  styleAxisNodes(nodes) {
    nodes.selectAll('.domain')
      .attr({
        fill: 'none',
        'stroke-width': 1,
        'stroke': 'black'
      });
    nodes.selectAll('.tick line')
    .attr({
      fill: 'none',
      'stroke-width': 1,
      'stroke': 'black'
    });
  }

}


// carrega ambos os arquivos
d3.queue()
  .defer(d3.csv, 'data/data.csv')
  .defer(d3.json, 'data/countries.json')
  .await((err, data, countries) => {
    // quando ambos tiverem sido carregados...
    // faz uma tabela hash com o símbolo dos países (e.g., USA) sendo
    // a chave e seu nome em inglês o valor
    let countriesBySymbol = countries.reduce
      ((prev, curr) => ((prev[curr.code] = curr.en) && prev), {});

    // instancia uma nova visualização, fazendo as devidas transformações
    // nos dados
    let viz = new PetalVisualization({
      container: '#main-visualization',
      data: data.map(d => new Country({
        symbol: d.country,
        name: countriesBySymbol[d.country],
        indices: delete d.country &&
          d3.keys(d)
            .map(idxName => ({
              name: idxName,
              value: Number.parseFloat(d[idxName])
            }))
      }))
    });

    window.viz = viz;
    window.data = viz.data;


    viz.load();
  });
