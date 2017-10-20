(function () {
  const hervoice = {audioUrl: '/audio/track2.mp3', offset: 13.4, bpm: 150};
  const heybaby = {audioUrl: '/audio/track.mp3', offset: .28};
  let music = null;
  window.beats.beatSync(heybaby).then((_music) => {
    music = _music;
    window.heybaby(_music);
  });

  function togglePlayback () {
    if (music.track.paused) {
      music.track.play();
    } else {
      music.track.pause();
    }
  }

  document.addEventListener('click', (event) => {
    togglePlayback();
  });

  let total = 0;
  let count = 0;

  window.addEventListener('keydown', (event) => {
    event = event || window.event;
    switch (event.keyCode) {
      case 32: // Space
        togglePlayback();
        break;
      case 81: // Q
        music.track.currentTime = 150;
        break;
      case 87: // W
        count++;
        total += music.getTimeToNearestBeat();
        console.log(total / count);
        break;
      case 65: // A
        music.offset -= .01;
        console.log(music.offset);
        break;
      case 68: // D
        music.offset += .01;
        console.log(music.offset);
        break;
      case 69: // E
        console.log(music.getCurrentBeat());
        break;
      case 39: // Right
        music.track.currentTime += 10;
        break;
      case 37: // Left
        music.track.currentTime -= 10;
        break;
      case 38: // Up
        music.track.playbackRate += 0.05;
        break;
      case 40: // Down
        music.track.playbackRate -= 0.05;
        break;
      default:
        break;
    }
  }, false);
})();
