function info() {
  let aboutModal = d3.select('#info-modal');

  d3.html('info.template.html', (error, docFragment) => {
    let attributionTemplate = d3.select(docFragment).select('#attribution-template');

    aboutModal.select('.modal-header')
      .html(attributionTemplate.select('.modal-header').html());
    aboutModal.select('.modal-content')
      .html(attributionTemplate.select('.modal-content').html());
  });


  d3.select('#info-toggle').on('click', e =>
    aboutModal.node().classList.toggle('showing')
  );

  d3.select('.modal-dismiss').on('click', e =>
    aboutModal.classed('showing', false)
  );

}

info();
