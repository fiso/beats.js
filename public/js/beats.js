function Beats(audioUrl, offsetSeconds, bpm) {
    this.track = new Audio(audioUrl);
    this.bpm = bpm;
    this.offset = offsetSeconds || 0;
    this.lastBeat = -1;
    this.lastFractionalBeat = -1;
    this.everyBeatCallbacks = [];
    this.oneshotCallbacks = {};
    this.beatCallbacks = {};
    this.fractionalBeatCallbacks = [];
    window.requestAnimationFrame(this._audioPoll.bind(this));
    this._promise = new Promise(function(resolve, reject) {
        if (!bpm) {
            this.analyzeBpm(audioUrl, resolve);
        } else {
            resolve();
        }
    }.bind(this));
};

Beats.prototype.ready = function() {
    return this._promise;
};

Beats.prototype.analyzeBpm = function(audioUrl, onComplete) {
    // Function to identify peaks
    function getPeaksAtThreshold(data, threshold) {
        var peaksArray = [];
        var length = data.length;
        for (var i = 0; i < length;) {
            if (data[i] > threshold) {
                peaksArray.push(i);
                // Skip forward ~ 1/4s to get past this peak.
                i += 10000;
            }
            i++;
        }
        return peaksArray;
    }

    // Function used to return a histogram of peak intervals
    function countIntervalsBetweenNearbyPeaks(peaks) {
        var intervalCounts = [];
        peaks.forEach(function(peak, index) {
            for (var i = 0; i < 10; i++) {
                var interval = peaks[index + i] - peak;
                var foundInterval = intervalCounts.some(function(intervalCount) {
                    if (intervalCount.interval === interval)
                        return intervalCount.count++;
                });
                if (!foundInterval) {
                    intervalCounts.push({
                        interval: interval,
                        count: 1
                    });
                }
            }
        });
        return intervalCounts;
    }

    // Function used to return a histogram of tempo candidates.
    function groupNeighborsByTempo(intervalCounts, sampleRate) {
        var tempoCounts = [];
        intervalCounts.forEach(function(intervalCount, i) {
            if (intervalCount.interval !== 0) {
                // Convert an interval to tempo
                var theoreticalTempo = 60 / (intervalCount.interval / sampleRate);

                // Adjust the tempo to fit within the 90-180 BPM range
                while (theoreticalTempo < 90) theoreticalTempo *= 2;
                while (theoreticalTempo > 180) theoreticalTempo /= 2;

                theoreticalTempo = Math.round(theoreticalTempo);
                var foundTempo = tempoCounts.some(function(tempoCount) {
                    if (tempoCount.tempo === theoreticalTempo)
                        return tempoCount.count += intervalCount.count;
                });
                if (!foundTempo) {
                    tempoCounts.push({
                        tempo: theoreticalTempo,
                        count: intervalCount.count
                    });
                }
            }
        });
        return tempoCounts;
    }

    var context = new(window.AudioContext || window.webkitAudioContext)();
    var request = new XMLHttpRequest();
    request.open('GET', audioUrl, true);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        // Create offline context
        var OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
        var offlineContext = new OfflineContext(1, 2, 44100);

        offlineContext.decodeAudioData(request.response, function(buffer) {
            // Create buffer source
            var source = offlineContext.createBufferSource();
            source.buffer = buffer;

            // Create filter
            var filter = offlineContext.createBiquadFilter();
            filter.type = "lowpass";

            // Pipe the song into the filter, and the filter into the offline context
            source.connect(filter);
            filter.connect(offlineContext.destination);

            // Schedule the song to start playing at time:0
            source.start(0);

            var peaks,
                initialThreshold = 0.9,
                threshold = initialThreshold,
                minThreshold = 0.3,
                minPeaks = 30;

            do {
                peaks = getPeaksAtThreshold(buffer.getChannelData(0), threshold);
                threshold -= 0.05;
            } while (peaks.length < minPeaks && threshold >= minThreshold);

            var intervals = countIntervalsBetweenNearbyPeaks(peaks);

            var groups = groupNeighborsByTempo(intervals, buffer.sampleRate);

            var top = groups.sort(function(intA, intB) {
                return intB.count - intA.count;
            }).splice(0, 5);

            console.log("Best guess: " + top[0].tempo + " BPM");
            this.bpm = top[0].tempo;
            onComplete();
        }.bind(this));
    }.bind(this);
    request.send();
};

Beats.prototype._audioPoll = function() {
    window.requestAnimationFrame(this._audioPoll.bind(this));

    if (this.track.readyState !== 4) {
        return;
    }

    var currentBeat = this.getCurrentBeat();
    if (this.lastBeat !== currentBeat) {
        this.everyBeatCallbacks.forEach(function(callback) {
            callback(currentBeat);
        });

        if (this.oneshotCallbacks[currentBeat]) {
            this.oneshotCallbacks[currentBeat].forEach(function(callback) {
                callback(currentBeat);
            });
            delete this.oneshotCallbacks[currentBeat];
        }

        if (this.beatCallbacks[currentBeat]) {
            this.beatCallbacks[currentBeat].forEach(function(callback) {
                callback(currentBeat);
            });
        }

        this.lastBeat = currentBeat;
    }

    var currentFractionalBeat = this.getCurrentBeatFloat();
    while (this.fractionalBeatCallbacks.length > 0) {
        if (currentFractionalBeat < this.fractionalBeatCallbacks[0].beat) {
            break;
        }

        var callback = this.fractionalBeatCallbacks.shift();
        callback.callback(callback.data);
    }
    this.lastFractionalBeat = currentFractionalBeat;
};

Beats.prototype.getCurrentBeatFloat = function() {
    var time = this.track.currentTime - this.offset;
    return time / this.getTimePerBeat();
};

Beats.prototype.getCurrentBeat = function() {
    return Math.floor(this.getCurrentBeatFloat());
};

Beats.prototype.getTimePerBeat = function() {
    return 60 / this.bpm;
};

Beats.prototype.getTimeToNearestBeat = function() {
    var currentBeat = this.getCurrentBeatFloat();
    if ((currentBeat - Math.floor(currentBeat)) <= .5) {
        return -(currentBeat - Math.floor(currentBeat));
    } else {
        return 1 - (currentBeat - Math.floor(currentBeat));
    }
};

Beats.prototype.addLyricsCallback = function(beat, lyrics, callback) {
    beat -= 1;
    lyrics = "#" + lyrics;
    var tokens = "#¤%";
    var tokenized = lyrics.split(/([\#\¤\%])/).slice(1);
    var intervals = {};
    var fraction = 4;
    var i;
    for (i = 0; i < tokens.length; i++) {
        var token = tokens.charAt(i);
        intervals[token] = (8 / fraction) * this.getTimePerBeat();
        fraction *= 2;
    }

    for (i = 0; i < tokenized.length; i += 2) {
        var token = tokenized[i];
        var lyric = tokenized[i + 1];
        if (!intervals[token]) {
            debugger;
        }

        beat += intervals[token];

        if (lyric) {
            this.addFractionalBeatCallback(beat, function(data) {
                callback(data);
            }, lyric);
        }
    }
};

Beats.prototype.addEveryBeatCallback = function(callback) {
    this.everyBeatCallbacks.push(callback);
};

Beats.prototype.addFractionalBeatCallback = function(beatNumber, callback, data) {
    this.fractionalBeatCallbacks.push({
        beat: beatNumber,
        callback: callback,
        data: data
    });
};

Beats.prototype.addBeatCallback = function(beatNumber, callback) {
    if (!this.beatCallbacks[beatNumber]) {
        this.beatCallbacks[beatNumber] = [];
    }

    this.beatCallbacks[beatNumber].push(callback);
};

Beats.prototype.addOneshotCallback = function(beatNumber, callback) {
    if (!this.oneshotCallbacks[beatNumber]) {
        this.oneshotCallbacks[beatNumber] = [];
    }

    this.oneshotCallbacks[beatNumber].push(callback);
};
