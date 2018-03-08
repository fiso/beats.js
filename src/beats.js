import 'babel-polyfill';
import {select} from 'node-select';

class Beats {
  constructor (audioUrl, bpm, offset) {
    this.track = new Audio(audioUrl);
    this.bpm = bpm;
    this.offset = offset;
    this.lastBeat = -1;
    this.lastFractionalBeat = -1;
    this.everyBeatCallbacks = [];
    this.oneshotCallbacks = {};
    this.beatCallbacks = {};
    this.fractionalBeatCallbacks = [];
    this._boundPoll = this._audioPoll.bind(this);
    window.requestAnimationFrame(this._boundPoll);
  }

  play () {
    this.track.play();
  }

  _audioPoll () {
    window.requestAnimationFrame(this._boundPoll);

    if (this.track.readyState !== 4) {
      return;
    }

    const currentBeat = this.getCurrentBeat();
    if (this.lastBeat !== currentBeat) {
      this.everyBeatCallbacks.forEach(function (callback) {
        callback(currentBeat);
      });

      if (this.oneshotCallbacks[currentBeat]) {
        this.oneshotCallbacks[currentBeat].forEach(function (callback) {
          callback(currentBeat);
        });
        delete this.oneshotCallbacks[currentBeat];
      }

      if (this.beatCallbacks[currentBeat]) {
        this.beatCallbacks[currentBeat].forEach(function (callback) {
          callback(currentBeat);
        });
      }

      this.lastBeat = currentBeat;
    }

    const currentFractionalBeat = this.getCurrentBeatFloat();
    while (this.fractionalBeatCallbacks.length > 0) {
      if (currentFractionalBeat < this.fractionalBeatCallbacks[0].beat) {
        break;
      }

      const callback = this.fractionalBeatCallbacks.shift();
      callback.callback(callback.data);
    }
    this.lastFractionalBeat = currentFractionalBeat;
  }

  getCurrentBeatFloat () {
    const time = this.track.currentTime - this.offset;
    return time / this.getTimePerBeat();
  }

  getCurrentBeat () {
    return Math.floor(this.getCurrentBeatFloat());
  }

  getTimePerBeat () {
    return 60 / this.bpm;
  }

  getTimeToNearestBeat () {
    const currentBeat = this.getCurrentBeatFloat();
    if (currentBeat - Math.floor(currentBeat) <= .5) {
      return -(currentBeat - Math.floor(currentBeat));
    } else {
      return 1 - (currentBeat - Math.floor(currentBeat));
    }
  }

  addLyricsCallback (beat, lyrics, callback, offset = 0) {
    beat -= 1;
    lyrics = `#${lyrics}`;
    const tokens = '#¤%&';
    const tokenized = lyrics.split(/([\#\¤\%\&])/).slice(1);
    const intervals = {};
    let fraction = 4;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens.charAt(i);
      intervals[token] = 8 / fraction * this.getTimePerBeat();
      fraction *= 2;
    }

    for (let i = 0; i < tokenized.length; i += 2) {
      const token = tokenized[i];
      const lyric = tokenized[i + 1];
      if (!intervals[token]) {
        debugger;
      }

      beat += intervals[token];

      if (lyric) {
        this.addFractionalBeatCallback(beat + offset, function (data) {
          callback(data);
        }, lyric);
      }
    }
  }

  addEveryBeatCallback (callback) {
    this.everyBeatCallbacks.push(callback);
  }

  addFractionalBeatCallback (beatNumber, callback, data) {
    this.fractionalBeatCallbacks.push({
      beat: beatNumber,
      callback,
      data,
    });

    this.fractionalBeatCallbacks.sort(function (a, b) {
      return a.beat < b.beat ? -1 : a.beat > b.beat ? 1 : 0;
    });
  }

  addBeatCallback (beatNumber, callback) {
    if (!this.beatCallbacks[beatNumber]) {
      this.beatCallbacks[beatNumber] = [];
    }

    this.beatCallbacks[beatNumber].push(callback);
  }

  addOneshotCallback (beatNumber, callback) {
    if (!this.oneshotCallbacks[beatNumber]) {
      this.oneshotCallbacks[beatNumber] = [];
    }

    this.oneshotCallbacks[beatNumber].push(callback);
  }
}

function analyzeBpm (audioUrl, bpm, offset) {
  // Identifies peaks
  function getPeaksAtThreshold (data, threshold) {
    const peaksArray = [];
    const length = data.length;
    for (let i = 0; i < length;) {
      if (data[i] > threshold) {
        peaksArray.push(i);
        // Skip forward ~ 1/4s to get past this peak.
        i += 10000;
      }
      i++;
    }
    return peaksArray;
  }

  // Returns a histogram of peak intervals
  function countIntervalsBetweenNearbyPeaks (peaks) {
    const intervalCounts = [];
    peaks.forEach(function (peak, index) {
      for (let i = 0; i < 10; i++) {
        const interval = peaks[index + i] - peak;
        const foundInterval = intervalCounts.some((intervalCount) => {
          if (intervalCount.interval === interval) {
            return intervalCount.count++;
          }
          return false;
        });
        if (!foundInterval) {
          intervalCounts.push({
            interval: interval,
            count: 1,
          });
        }
      }
    });
    return intervalCounts;
  }

  // Returns a histogram of tempo candidates.
  function groupNeighborsByTempo (intervalCounts, sampleRate) {
    const tempoCounts = [];
    intervalCounts.forEach(function (intervalCount, i) {
      if (intervalCount.interval !== 0) {
        // Convert an interval to tempo
        let theoreticalTempo = 60 / (intervalCount.interval / sampleRate);

        // Adjust the tempo to fit within the 90-180 BPM range
        while (theoreticalTempo < 90) {
          theoreticalTempo *= 2;
        }
        while (theoreticalTempo > 180) {
          theoreticalTempo /= 2;
        }

        theoreticalTempo = Math.round(theoreticalTempo);
        const foundTempo = tempoCounts.some((tempoCount) => {
          if (tempoCount.tempo === theoreticalTempo) {
            return tempoCount.count += intervalCount.count;
          }
          return false;
        });
        if (!foundTempo) {
          tempoCounts.push({
            tempo: theoreticalTempo,
            count: intervalCount.count,
          });
        }
      }
    });
    return tempoCounts;
  }

  return new Promise((resolve, reject) => {
    const context = new(window.AudioContext || window.webkitAudioContext)();
    const request = new XMLHttpRequest();
    request.open('GET', audioUrl, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      // Create offline context
      const OfflineContext = window.OfflineAudioContext ||
        window.webkitOfflineAudioContext;
      const offlineContext = new OfflineContext(1, 2, 44100);

      offlineContext.decodeAudioData(request.response, (buffer) => {
        // Create buffer source
        const source = offlineContext.createBufferSource();
        source.buffer = buffer;

        // Create filter
        const filter = offlineContext.createBiquadFilter();
        filter.type = 'lowpass';

        // Pipe the song into the filter and the filter into the offline context
        source.connect(filter);
        filter.connect(offlineContext.destination);

        // Schedule the song to start playing at time:0
        source.start(0);

        let peaks = null;
        const initialThreshold = 0.9;
        let threshold = initialThreshold;
        const minThreshold = 0.3;
        const minPeaks = 30;

        do {
          peaks = getPeaksAtThreshold(buffer.getChannelData(0), threshold);
          threshold -= 0.05;
        } while (peaks.length < minPeaks && threshold >= minThreshold);

        let intervals = countIntervalsBetweenNearbyPeaks(peaks);

        let groups = groupNeighborsByTempo(intervals, buffer.sampleRate);

        let top = groups.sort(function (intA, intB) {
          return intB.count - intA.count;
        }).splice(0, 5);

        console.log(`Best guess is ${top[0].tempo} BPM`);
        resolve(new Beats(audioUrl, top[0].tempo, offset));
      });
    };
    request.send();
  });
}

export function beatSync (options) {
  const [audioUrl, bpm, offset] = select(options, (options) => {
    if (typeof options === String) {
      return [options, 0, 0];
    } else {
      return [options.audioUrl, options.bpm, options.offset];
    }
  });

  if (!bpm) {
    return analyzeBpm(audioUrl, bpm, offset);
  } else {
    return new Promise((resolve) => {
      resolve(new Beats(audioUrl, bpm, offset));
    });
  }
}
