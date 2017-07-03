let effectsToggleEl = document.querySelector('#effects-toggle');
let effects = true;

effectsToggleEl.addEventListener('click', e => {
  effects = !effects;
  // turns on/off the starfield
  window.starfield.playPause(effects);

  // turns on/off the spacesphere
  window.spacesphere.playPause(effects);
  
  // changes the image
  let status = effects ? 'on' : 'off';
  e.currentTarget.querySelector('img').src = `assets/img/effects-${status}.svg`;
});
