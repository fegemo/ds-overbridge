// adapted from: https://bl.ocks.org/mbhall88/22f91dc6c9509b709defde9dc29c63f2
function donutChart() {
    let data = [],
      width,
      height,
      margin = {top: 10, right: 10, bottom: 10, left: 10},
      color = d3.scaleOrdinal(d3.schemeCategory20c), // color scheme
      variable, // value in data that will dictate proportions on chart
      category, // compare data by
      padAngle, // effectively dictates the gap between slices
      transTime, // transition time
      updateData,
      floatFormat = d3.format('.4r'),
      cornerRadius, // sets how rounded the corners are on each slice
      percentFormat = d3.format(',');

    function build(selection) {
      selection.each((d, i, nodes) => {
        // generate chart
        let radius = Math.min(width, height) / 2;

        // creates a new pie generator
        let pie = d3.pie()
          .value(d => floatFormat(d[variable]))
          .sort(null);

        // contructs and arc generator. This will be used for the donut.
        // The difference between outer and inner
        // radius will dictate the thickness of the donut
        let arc = d3.arc()
          .outerRadius(radius * 0.8)
          .innerRadius(radius * 0.6)
          .cornerRadius(cornerRadius)
          .padAngle(padAngle);

        // append the svg object to the selection
        let svg = d3.select(nodes[i]).append('svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // g elements to keep elements within svg modular
        svg.append('g').attr('class', 'slices');

        // add and color the donut slices
        let path = svg.select('.slices')
          .selectAll('path')
          .data(pie(data))
          .enter().append('path')
            .attr('fill', d => color(d.data[category]))
            .attr('d', arc);

        // add tooltip to mouse events on slices
        svg.selectAll('.slices path').call(toolTip);

        // ====================================================================
        // FUNCTION TO UPDATE CHART
        updateData = function() {

          let updatePath = svg.select('.slices').selectAll('path');

          let data0 = path.data(), // store the current data before updating
              data1 = pie(data);

          // update data attached to the slices
          // the key function assigns the data to the correct element,
          // rather than in order of how the data appears. This means that
          // if a category already exists in the chart, it will have its
          // data updated rather than removed and re-added.
          updatePath = updatePath.data(data1, key);

          // adds new slices
          updatePath.enter().append('path')
            .each((d, i, nodes) => nodes[i]._current = findNeighborArc(i, data0, data1, key) || d)
            .attr('fill', d => color(d.data[category]))
            .attr('d', arc);

          // removes slices that are not in the current dataset
          updatePath.exit()
            .transition()
            .duration(transTime/3)
            .attrTween('d', arcTween)
            .style('opacity', 0)
            .remove();

          // animates the transition from old angle to new angle for slices
          updatePath.transition().duration(transTime)
            .attrTween('d', arcTween);

          // add tooltip to mouse events on slices
          svg.selectAll('.slices path').call(toolTip);

        };

        // Functions
        // calculates the angle for the middle of a slice
        let midAngle = d => d.startAngle + (d.endAngle - d.startAngle) / 2

        // function that creates and adds the tool tip to a selected element
        function toolTip(selection) {

          // add tooltip (svg circle element) when mouse enters slice
          selection.on('mouseenter', data => {

            svg.append('text')
              .attr('class', 'toolCircle')
              .attr('dy', -15) // hard-coded. can adjust this to adjust text vertical alignment in tooltip
              .html(toolTipHTML(data)) // add text to the circle.
              .style('fill', 'white')
              .style('font-size', '.7em')
              .style('text-anchor', 'middle'); // centres text in tooltip

            svg.append('circle')
              .attr('class', 'toolCircle')
              .attr('r', radius * 0.55) // radius of tooltip circle
              .style('fill', color(data.data[category])) // color based on category mouse is over
              .style('fill-opacity', 0.35);

            });

            // remove the tooltip when mouse leaves the slice
            selection.on('mouseout', function () {
              svg.selectAll('.toolCircle').remove();
            });
        }

        // function to create the HTML string for the tool tip. Loops
        // through each key in data object
        // and returns the html string key: value
        function toolTipHTML(data) {

          let tip = '',
              i = 0;

          for (let key in data.data) {

            // if value is a number, format it as a percentage
            let value = (!isNaN(parseFloat(data.data[key]))) ?
              percentFormat(data.data[key]) :
              data.data[key];

            // leave off 'dy' attr for first tspan so the 'dy' attr on
            // text element works. The 'dy' attr on
            // tspan effectively imitates a line break.
            if (i === 0) {
              tip += `<tspan x="0">${key}: </tspan>
                <tspan style="font-weight: bold; font-size: 120%;">${value}</tspan>`;
            } else {
              tip += `<tspan x="0" dy="1.2em">${key}:</tspan>
                <tspan x="0" dy="1em" style="font-weight: bold; font-size: 120%;">${value}</tspan>`;
            }
            i++;
          }

          return tip;
        }

        // function to calculate the tween for an arc's transition.
        // see http://bl.ocks.org/mbostock/5100636 for a thorough explanation.
        function arcTween(d) {
          let i = d3.interpolate(this._current, d);
          this._current = i(0);
          return function(t) { return arc(i(t)); };
        }

        function findNeighborArc(i, data0, data1, key) {
          let d;
          return (d = findPreceding(i, data0, data1, key)) ? {startAngle: d.endAngle, endAngle: d.endAngle}
              : (d = findFollowing(i, data0, data1, key)) ? {startAngle: d.startAngle, endAngle: d.startAngle}
                  : null;
        }

        // Find the element in data0 that joins the highest preceding element in data1.
        function findPreceding(i, data0, data1, key) {
          let m = data0.length;
          while (--i >= 0) {
            let k = key(data1[i]);
            for (let j = 0; j < m; ++j) {
              if (key(data0[j]) === k) return data0[j];
            }
          }
        }

        function key(d) {
          return d.data[category];
        }

        // Find the element in data0 that joins the lowest following
        // element in data1.
        function findFollowing(i, data0, data1, key) {
          let n = data1.length, m = data0.length;
          while (++i < n) {
            let k = key(data1[i]);
            for (let j = 0; j < m; ++j) {
              if (key(data0[j]) === k) return data0[j];
            }
          }
        }

      });
    }

    build.width = function(value) {
      if (!arguments.length) return width;
      width = value;
      return build;
    };

    build.height = function(value) {
      if (!arguments.length) return height;
      height = value;
      return build;
    };

    build.margin = function(value) {
      if (!arguments.length) return margin;
      margin = value;
      return build;
    };

    build.radius = function(value) {
      if (!arguments.length) return radius;
      radius = value;
      return build;
    };

    build.padAngle = function(value) {
      if (!arguments.length) return padAngle;
      padAngle = value;
      return build;
    };

    build.cornerRadius = function(value) {
      if (!arguments.length) return cornerRadius;
      cornerRadius = value;
      return build;
    };

    build.color = function(value) {
      if (!arguments.length) return color;
      color = value;
      return build;
    };

    build.variable = function(value) {
      if (!arguments.length) return variable;
      variable = value;
      return build;
    };

    build.category = function(value) {
      if (!arguments.length) return category;
      category = value;
      return build;
    };

    build.transTime = function(value) {
      if (!arguments.length) return transTime;
      transTime = value;
      return build;
    };

    build.data = function(value) {
      if (!arguments.length) return data;
      data = value;
      if (typeof updateData === 'function') updateData();
      return build;
    };

    return build;
}
