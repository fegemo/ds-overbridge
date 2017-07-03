// adapted from https://codepen.io/Octavector/pen/hxcmF?editors=0010
function spacesphere() {

  let scene = new THREE.Scene();
  let camera = new THREE.PerspectiveCamera(45 , window.innerWidth / window.innerHeight , 0.1, 1000);
  let renderer = new THREE.WebGLRenderer();
  let flag = true;

  renderer.setSize(window.innerWidth, window.innerHeight);

  // let planetGeometry = new THREE.SphereGeometry(4,20,20);

  //Load the planet textures
  // let texture = THREE.ImageUtils.loadTexture("https://s3-us-west-2.amazonaws.com/s.cdpn.io/96252/planet-512.jpg");
  // let normalmap = THREE.ImageUtils.loadTexture("https://s3-us-west-2.amazonaws.com/s.cdpn.io/96252/normal-map-512.jpg");
  // let specmap = THREE.ImageUtils.loadTexture("https://s3-us-west-2.amazonaws.com/s.cdpn.io/96252/water-map-512.jpg");

  // let planetMaterial = new THREE.MeshPhongMaterial();
  // planetMaterial.map = texture;
  //
  // planetMaterial.specularMap = specmap;
  // planetMaterial.specular = new THREE.Color( 0xff0000 );
  // planetMaterial.shininess = 1;
  //
  // planetMaterial.normalMap = normalmap;
  // planetMaterial.normalScale.set(-0.3,-0.3);

  // let planet = new THREE.Mesh(planetGeometry, planetMaterial);

  //here we allow the texture/normal/specular maps to wrap
  // planet.material.map.wrapS = THREE.RepeatWrapping;
  // planet.material.map.wrapT = THREE.RepeatWrapping;
  // planet.material.normalMap.wrapS = THREE.RepeatWrapping;
  // planet.material.normalMap.wrapT = THREE.RepeatWrapping;
  // planet.material.specularMap.wrapS = THREE.RepeatWrapping;
  // planet.material.specularMap.wrapT = THREE.RepeatWrapping;

  //here we repeat the texture/normal/specular maps twice along X
  // planet.material.map.repeat.set( 2, 1);
  // planet.material.normalMap.repeat.set( 2, 1);
  // planet.material.specularMap.repeat.set( 2, 1);

  // planet.position.x = 0;
  // planet.position.y = 0;
  // planet.position.z = 0;

  // scene.add(planet);

  //Space background is a large sphere
  let spacetex = THREE.ImageUtils.loadTexture('assets/img/space-texture.jpg');
  // let spacetex = THREE.ImageUtils.loadTexture("https://s3-us-west-2.amazonaws.com/s.cdpn.io/96252/space.jpg");
  let spacesphereGeo = new THREE.SphereGeometry(20,20,20);
  let spacesphereMat = new THREE.MeshPhongMaterial();
  spacesphereMat.map = spacetex;

  let spacesphere = new THREE.Mesh(spacesphereGeo,spacesphereMat);

  //spacesphere needs to be double sided as the camera is within the spacesphere
  spacesphere.material.side = THREE.DoubleSide;

  spacesphere.material.map.wrapS = THREE.RepeatWrapping;
  spacesphere.material.map.wrapT = THREE.RepeatWrapping;
  spacesphere.material.map.repeat.set( 5, 3);

  scene.add(spacesphere);

  //position camera
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = -15;
  camera.lookAt(scene.position);

  //create two spotlights to illuminate the scene
  let spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set( -40, 60, -10 );
  spotLight.intensity = 0.5;
  scene.add( spotLight );

  let spotLight2 = new THREE.SpotLight( 0x5192e9 );
  spotLight2.position.set( 40, -60, 30 );
  spotLight2.intensity = 1.3;
  scene.add( spotLight2 );

  renderer.domElement.id = 'spacesphere';
  document.body.append(renderer.domElement);

  window.addEventListener('resize', e => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
  })

  //render loop
  function render() {
    if (flag) {
      requestAnimationFrame(render);
    }
    //rotate planet and spacesphere
    // planet.rotation.y += 0.002;
    spacesphere.rotation.y += 0.001;
    renderer.render(scene, camera);
  };

  function playPause(turnOn) {
    flag = turnOn;
    requestAnimationFrame(render)
  }

  return {
    start: () => requestAnimationFrame(render),
    playPause: playPause
  };
}

window.spacesphere = spacesphere();
window.spacesphere.start();
