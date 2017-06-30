
function unit() {
  let width = 300;
  let height = 400;
  let unitLength = 5;
  let unitMargin = 2;
  let unitFillColor = 'silver';
  let legendFontFamily = 'Arial, OpenSans, sans-serif';
  let legendFontSize = 12;
  let legendVerticalMargin = 6;
  let legendHorizontalMargin = 6;
  let data = [];
  let units = null;
  let caption = null;
  let updateData = null;

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

  build.unitLength = value => {
    if (typeof value === 'undefined') {
      return unitLength;
    } else {
      unitLength = value;
      return build;
    }
  };

  build.unitMargin = value => {
    if (typeof value === 'undefined') {
      return unitMargin;
    } else {
      unitMargin = value;
      return build;
    }
  };

  build.unitFillColor = value => {
    if (typeof value === 'undefined') {
      return unitFillColor;
    } else {
      unitFillColor = value;
      return build;
    }
  };

  build.legendFontFamily = value => {
    if (typeof value === 'undefined') {
      return legendFontFamily;
    } else {
      legendFontFamily = value;
      return build;
    }
  };

  build.legendFontSize = value => {
    if (typeof value === 'undefined') {
      return legendFontSize;
    } else {
      legendFontSize = value;
      return build;
    }
  };

  build.legendVerticalMargin = value => {
    if (typeof value === 'undefined') {
      return legendVerticalMargin;
    } else {
      legendVerticalMargin = value;
      return build;
    }
  };

  build.legendHorizontalMargin = value => {
    if (typeof value === 'undefined') {
      return legendHorizontalMargin;
    } else {
      legendHorizontalMargin = value;
      return build;
    }
  };

  build.units = value => {
    if (typeof value === 'undefined') {
      return units;
    } else {
      units = value;
      return build;
    }
  };

  build.caption = value => {
    if (typeof value === 'undefined') {
      return caption;
    } else {
      caption = value;
      return build;
    }
  };

  build.data = value => {
    if (typeof value === 'undefined') {
      return data;
    } else {
      data = value;
      if (typeof updateData === 'function') {
        updateData();
      }
      return build;
    }
  }

  function build(selection) {
    selection.each(function() {
      // generate chart here

      let svg = d3.select(this)
        .append('svg')
        .attr('width', width)
        .attr('height', height);

      // determines width/height of the legend
      let configureLegend = () => {
        // we need to know where to start the unit circles
        // so we determine the height of a line of text (for the legend) and the
        // widest (largest) one
        let legendWidths = [];
        let legendHeight = null;
        svg.append('g')
          .attr('class', 'dummy-text')
          .selectAll('.dummy-text')
          .data(data.map(sp => sp.name))
          .enter()
          .append('text')
          .attr('font-family', legendFontFamily)
          .attr('font-size', legendFontSize)
          .text(d => d)
          .each((d, i, nodes) => {
            legendHeight = legendHeight || nodes[i].getBBox().height;
            legendWidths.push(nodes[i].getComputedTextLength());
            nodes[i].remove();
          });

        svg.select('.dummy-text')
          .remove();

        let legendWidth = Math.max(...legendWidths);
        return { legendWidth, legendHeight };
      };

      // determines how much of the data can be shown on the available
      // dimensions
      let configureSeries = ({ legendWidth, legendHeight }) => {
        // sorts by the most number of units and alphabetically
        data = data
          .sort((s1, s2) =>
            (units(s2).length - units(s1).length) ||
            (caption(s1) > caption(s2) ? 1 : -1))

        // determines how many units we can put per row
        unitsPerRow = Math.floor(
          (width - legendWidth - legendHorizontalMargin) /
          (unitLength + unitMargin));

        // calculates the necessary height for each category
        let necessaryHeights = data.map(si => {
          let necessaryRows = Math.ceil(units(si).length / unitsPerRow);
          return Math.max(
            legendHeight + legendVerticalMargin,
            necessaryRows * (unitLength + unitMargin) + legendVerticalMargin);
        });
        accumulatedHeights = necessaryHeights.reduce((prev, curr, i) => {
          prev[i] = (prev[i-1] || 0) + curr;
          return prev;
        }, []);


        // checks how many categories will be shown by calculating their
        // individual heights, then filters the data
        let lastCategoryIndex = accumulatedHeights
          .findIndex(h => h >= height) === -1 ?
            data.length - 1 :
            accumulatedHeights.findIndex(h => h >= height) - 1;
        data = data.filter((sp, i) => i <= lastCategoryIndex);

        return { accumulatedHeights, unitsPerRow };
      };

      // creates/updates category groups
      let buildCategories = (accumulatedHeights) => {
        // draws each category
        categoryGroup = svg.selectAll('g.unit-category')
          .data(data)

        // transitions updating categories to their y positions
        categoryGroup
          .transition()
          .duration(200)
          .attr('transform', (_, i) => `translate(0 ${accumulatedHeights[i - 1] || 0})`)

        // animates out exiting categories
        categoryGroup.exit()
          .transition()
          .duration(125)
          .delay((_, i) => i * 15)
          .style('opacity', 0)
          .remove();

        // creates a 'g' for entering categories elements
        categoryGroupEnter = categoryGroup.enter()
          .append('g')
          .attr('class', 'unit-category')
          .attr('transform', (_, i) => `translate(-30 ${accumulatedHeights[i - 1] || 0})`)
          .style('opacity', 0);

        // transitions in entering 'g's for categories elements
        categoryGroupEnter
          .transition()
          .duration(200)
          .delay((_, i) => i * 20)
          .attr('transform', (_, i) => `translate(0 ${accumulatedHeights[i - 1] || 0})`)
          .style('opacity', 1);

        return { categoryGroup, categoryGroupEnter };
      }

      // creates/updates legends inside the category groups
      let buildLegend = ({ legendWidth, legendHeight, categoryGroup,
        categoryGroupEnter }) => {
        // creates/updates legends for entering and updating categories elements
        let categoryLegend = categoryGroupEnter
          .append('text')
          .style('font-family', legendFontFamily)
          .style('font-size', legendFontSize)
          .style('text-anchor', 'end')
          .style('fill', 'white')
          .merge(categoryGroup.select('text'))
          .text(caption)
          .transition()
          .duration(200)
          .attr('dx', legendWidth)
          .attr('dy', legendHeight);
      }

      // creates/updates/removes unit circles
      let buildUnits = ({ legendWidth, legendHeight, categoryGroup,
        categoryGroupEnter }) => {
        // creates groups for the units circles and merges with existing ones
        let unitsGroup = categoryGroupEnter
          .append('g')
          .attr('class', 'unit-group')
          .merge(categoryGroup.select('g.unit-group'))
          .attr('transform', `translate(${legendWidth} ${legendHeight / 2})`);

        // binds a circle for each unit
        let unitsCircles = unitsGroup.selectAll('circle').data(units);

        // creates a circle for entering units
        let spacing = unitLength + unitMargin;
        let unitsCirclesEnter = unitsCircles.enter()
          .append('circle')
          .attr('cx', (_, i) => ((i % unitsPerRow) + 1) * spacing)
          .attr('cy', (_, i) => Math.floor(i / unitsPerRow) * spacing)
          .attr('r', unitLength / 2);

        // defines the color of each circle, no matter if entering or updating
        unitsCircles.merge(unitsCirclesEnter)
          .style('fill', unitFillColor)

        // fades out exiting circles
        let unitsCirclesExit = unitsCircles.exit()
          .transition()
          .duration(125)
          .style('opacity', 0)
          .remove();
      }

      updateData = () => {
        let legendConfig = configureLegend();
        let { accumulatedHeights, unitsPerRow } = configureSeries(legendConfig);
        let categorySelections = buildCategories(accumulatedHeights);
        buildLegend(Object.assign({}, legendConfig, categorySelections));
        buildUnits(Object.assign({}, legendConfig, categorySelections, {unitsPerRow}));
      };

      updateData();
    });
  }


  return build;
}
