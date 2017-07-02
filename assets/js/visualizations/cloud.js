function cloud() {
  let width = 300;
  let height = 300;
  let range = [8, 24];
  let font = 'Arial, OpenSans, sans-serif';
  let fill = d3.scaleOrdinal(d3.schemeCategory20);
  let data = [];
  let updateData = null;
  let updateCounts = null;

  function build(selection) {
    selection.each((_, i, nodes) => {
      let svg = d3.select(nodes[i])
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append("g")
          .attr("transform", "translate(" + [width >> 1, height >> 1] + ")")


      updateData = () => {
        let words = d3.entries(data);
        // creates the text font size scale
        let fontScale = d3.scaleLinear()
          .domain([0, d3.max(words, d => d.value)])
          .range(range);

        // creates a cloud layout
        let layout = d3.layout.cloud().size([width, height])
          .timeInterval(20)
          .words(words)
          .fontSize(d => fontScale(+d.value))
          .text(d => d.key)
          .rotate(() => ~~(Math.random() * 2) * 90)
          .font(font)
          .on('end', words => {
            // function that draws the words
            let texts = svg.selectAll('text')
              .data(words, d => d.text.toLowerCase());

            // exiting texts
            texts.exit()
              .transition()
              .duration(200)
              .style('transform', 'scale(0)')
              .style('opacity', '0')
              .remove();

            // entering texts
            texts.enter()
              .append('text')
              .style('font-family', font)
              .style('text-anchor', 'middle')
              .text(d => d.key)
              .merge(texts)
              .transition()
              .duration(600)
              .style('font-size', d => `${fontScale(d.value)}px`)
              .style('fill', (_, i) => fill(i))
              .attr('transform', d => `translate(${d.x}, ${d.y})rotate(${d.rotate})`)

          });

        layout.start();
      }

      updateData();
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

  build.fill = value => {
    if (typeof value === 'undefined') {
      return fill;
    } else {
      fill = value;
      return build;
    }
  };

  build.range = value => {
    if (typeof value === 'undefined') {
      return range;
    } else {
      range = value;
      return build;
    }
  };

  build.font = value => {
    if (typeof value === 'undefined') {
      return font;
    } else {
      font = value;
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

  return build;
}
