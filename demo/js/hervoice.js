/* eslint-disable */

function hervoice (music) {
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild( renderer.domElement );
  var geometry = new THREE.BoxGeometry( 1, 1, 1 );
  var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
  var cube = new THREE.Mesh( geometry, material );
  scene.add( cube );

  camera.position.z = 5;
  var animate = function () {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
  }
  animate();

  var timelineElement = document.getElementById("timeline");
  setInterval(function() {
    var position = music.track.currentTime / music.track.duration;
    timelineElement.style.transform = "scaleX(" + String(position) + ")";
  }, 100);

  var containerElement = document.getElementById("animation-container");
  containerElement.style["transitionDuration"] = music.getTimePerBeat() + "s";

  var flasherElement = document.getElementById("flasher");
  music.addEveryBeatCallback(function(beat) {
    setTimeout(function() {
      flasherElement.classList.add("beat-on");
      setTimeout(function() {
        flasherElement.classList.remove("beat-on");
      }, 20);
    }, 20);
  });

  music.track.play();
}
