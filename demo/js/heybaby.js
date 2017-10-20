/* eslint-disable */

function heybaby (music) {
    /*
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    scene.add( cube );

    camera.position.z = 5;
    var animate = function () {
    requestAnimationFrame( animate );
    cube.rotation.x += 0.1;
    cube.rotation.y += 0.1;
    renderer.render( scene, camera );
    }
    animate();
    */

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

    var strobeInterval = -1;

    var strobeOn = function () {
        if (strobeInterval !== -1) {
          return;
        }
        var element = document.getElementsByTagName("body")[0];
        var on = true;
        element.style["backgroundColor"] = "#444";
        strobeInterval = setInterval(function() {
            on = !on;
            element.style["backgroundColor"] = on ? "#444" : "black";
        }, music.getTimePerBeat() * 1000 / 10);
    };

    var strobeOff = function () {
        if (strobeInterval === -1) {
          return;
        }
        var element = document.getElementsByTagName("body")[0];
        element.style["backgroundColor"] = "black";
        clearInterval(strobeInterval);
        strobeInterval = -1;
    };

    var upsideDown = function() {
        containerElement.style["transform"] = "rotate(180deg)";
        setTimeout(function() {
            containerElement.style["transform"] = "";
        }, music.getTimePerBeat() * 2 * 1000);
    };

    var startScene = function (index, beat) {
      if (beat === 640) {
        strobeOn();
      } else if (beat === 704) {
        strobeOff();
      }
    };

    var sceneStarts = [32, 64, 128, 192, 256, 320, 448, 512, 640, 704];
    for (var i = 0; i < sceneStarts.length; i++) {
      var beat = sceneStarts[i];
      music.addBeatCallback(beat, startScene.bind(this, i, beat));
    }

    music.addBeatCallback(376, upsideDown);
    music.addBeatCallback(440, upsideDown);
    music.addBeatCallback(504, upsideDown);
    music.addBeatCallback(760, upsideDown);
    music.addBeatCallback(824, upsideDown);

    var verseLyrics = "###¤What's# crac¤kin'?¤&Who¤ ya¤ mac¤kin'?¤%What¤&cha¤ do¤in'?¤" +
        "Who¤ ya¤ screw¤in'?¤% What¤cha¤ drink¤in'?¤ What¤cha¤ think¤in'?" +
        "#####Say¤ my¤ name#% Play¤ your¤ game# Wan¤na¤ do¤ me?" +
        "¤%Wan¤na¤ screw¤ me?¤ I'm¤ your¤ pet#% Make¤ me¤ wet" +
        "###¤%#¤Don't¤ ya¤ stare# I¤ don't¤% care#&Want¤ some¤ fun?" +
        "#Make¤ me¤ cum# Keep¤ it¤ go¤in'¤% Cause% it's¤% snow¤in'" +
        "###%#¤Tie¤ me¤ up#%Pin¤ me¤ down#% Flip¤ me¤ o¤ver¤" +
        "Up¤side¤ down#% Make¤ me¤ make¤ that¤ fuck¤ing¤ sound#¤%";
    var heybabyLyrics = "Hey¤ ba¤by?";
    var lyricsOffset = -.3;

    var flashLyrics = function (element, text) {
      element.innerHTML = text.trim();
      element.classList.add("on");
      setTimeout(function() {
          element.classList.remove("on");
      }, 20);
    };

    var smallLyricsElement = document.getElementById("lyrics-container-small");
    var baseBeat = 322;
    for (var i = 0; i < 12; i++) {
      music.addLyricsCallback(baseBeat + i * 16, heybabyLyrics, function (text) {
        flashLyrics(smallLyricsElement, text);
      }, lyricsOffset);
    }
    baseBeat = 706;
    for (var i = 0; i < 8; i++) {
      music.addLyricsCallback(baseBeat + i * 16, heybabyLyrics, function (text) {
        flashLyrics(smallLyricsElement, text);
      }, lyricsOffset);
    }

    var lyricsElement = document.getElementById("lyrics-container");
    music.addLyricsCallback(320,
        verseLyrics + verseLyrics + verseLyrics,
        function(text) {
          flashLyrics(lyricsElement, text);
        }, lyricsOffset);

    music.addLyricsCallback(704,
        verseLyrics + verseLyrics,
        function(text) {
          flashLyrics(lyricsElement, text);
        }, lyricsOffset);

    music.track.play();
    music.track.currentTime = 149;
}
