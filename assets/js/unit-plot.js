
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
  let units = null;
  let caption = null;

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

  function build(selection) {
    selection.each(data => {
      // generate chart here

      let svg = selection.append('svg')
        .attr('width', width)
        .attr('height', height);

      // we need to know where to start the unit circles
      // so we determine the height of a line of text (for the legend) and the
      // widest (largest) one
      let legendWidths = [];
      let legendHeight = null;
      let legendWidth = null;

      svg.append('g')
        .selectAll('.dummy-text')
        .data(data.map(sp => sp.name))
        .enter()
        .append('text')
        .classed('dummy-text', true)
        .attr('font-family', legendFontFamily)
        .attr('font-size', legendFontSize)
        .text(d => d)
        .each((d, i, nodes) => {
          legendHeight = legendHeight || nodes[i].getBBox().height;
          legendWidths.push(nodes[i].getComputedTextLength());
          nodes[i].remove();
        });

      legendWidth = Math.max(...legendWidths);
      svg.select('.dummy-text')
        .remove();

      // sorts by the most number of units
      this.data = data
        .sort((s1, s2) => units(s2).length - units(s1).length);

      // determines how many units we can put per row
      let unitsPerRow = Math.floor(
        (width - legendWidth - legendHorizontalMargin) /
        (unitLength + unitMargin));

      // calculates the necessary height for each category
      let necessaryHeights = this.data.map(si => {
        let necessaryRows = Math.ceil(units(si).length / unitsPerRow);
        return Math.max(
          legendHeight + legendVerticalMargin,
          necessaryRows * (unitLength + unitMargin) + legendVerticalMargin);
      });
      let accumulatedHeights = necessaryHeights.reduce((prev, curr, i) => {
        prev[i] = (prev[i-1] || 0) + curr;
        return prev;
      }, []);


      // checks how many categories will be shown by calculating their
      // individual heights, then filters the data
      let lastCategoryIndex = accumulatedHeights.findIndex(h => h >= height) || this.data.length - 1;
      this.data = this.data.filter((sp, i) => i < lastCategoryIndex);

      // draws each category
      let categoryGroup = svg.selectAll('g.unit-category')
        .data(this.data)
        .enter()
        .append('g')
        .classed('unit-category', true)
        .attr('transform', (_, i) => `translate(0 ${accumulatedHeights[i - 1] || 0})`);

      let categoryLegend = categoryGroup.append('text')
        .text(caption)
        .style('font-family', legendFontFamily)
        .style('font-size', legendFontSize)
        .style('text-anchor', 'end')
        .style('fill', 'white')
        .attr('dy', legendHeight)
        .attr('dx', legendWidth);

      let unitsGroup = categoryGroup.append('g')
        .classed('unit-group', true)
        .attr('transform', `translate(${legendWidth} ${legendHeight / 2})`);

      let unitsCircles = unitsGroup.selectAll('circle').data(units);
      unitsCircles.enter().append('circle')
        .attr('cx', (_, i) => ((i % unitsPerRow) + 1) * (unitLength + unitMargin))
        .attr('cy', (_, i) => Math.floor(i / unitsPerRow) * (unitLength + unitMargin))
        .attr('r', unitLength / 2)
        .style('fill', unitFillColor);

    });
  }


  return build;
}
