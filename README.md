# beats.js

A beat detection and synchronization library.

## Usage

Basic usage, load an audio file and attempt to autodetect BPM:

```js
  beats.beatSync('/audio/music.mp3').then((music) => {
    // Set up your beat callbacks here, and then start playback
    music.play();
  });
```

You can also pass an options object that can contain the following fields.
|Parameter|Description|
|--------------:|:--------------|
| audioUrl      | URL to the audio file to be loaded. Supported formats are going to be whatever the browsers `<Audio>` tag supports.
| bpm           | If beats is unable to autodetect the BPM correctly, you can pass a value here instead and it will not attempt autodetection.
| offset        | A decimal number indicating the beat offset (in seconds, floating point). This will need to be tweaked carefully, and *will* need to be different for different machines. Ideally, you'd allow the user to tweak their offset to match whatever delays their audio drivers introduce.

The returned `music` object has the following methods you can use to set up
syncing.

| Method                    |Parameters                                          |Description|
|--------------------------:|:---------------------------------------------------|-
| addBeatCallback           | beatNumber (int), callback                         | Add a callback to be fired every time the numbered beat is played.
| addEveryBeatCallback      | callback                                           | Add a callback to be fired on every beat
|     addOneshotCallback        | beatNumber, callback                           | Add a callback to be fired the first time the numbered beat is played.
|     addFractionalBeatCallback | beatNumber (float), callback, data             | Add a callback to be fired every time the numbered beat, indicated as a float, is played. This is useful when you need sub-beat precision. addLyricsCallback uses this function internally.
| addLyricsCallback         | beatNumber (int), lyrics, callback, offset (float) | Add a callback to be fired every time a new lyrics segment is played. The lyrics start at the beat indicated by the first parameter. Lyrics are specified as a string with tokens inserted into it to separate syllables. The special tokens are `#¤%&` and they represent a beat, a half-beat, a quarter beat and an eighth of a beat, respectively in order. Here's an example of a lyrics segment: `###¤What's# crac¤kin'?¤&Who¤ ya¤ mac¤kin'?¤%What¤&cha¤ do¤in'?¤`.
| getCurrentBeat            |                                                    | Returns the current active beat as an integer.
| getCurrentBeatFloat       |                                                    | Returns the current active beat as a float.
| getTimePerBeat            |                                                    | Returns the duration of a single beat, in seconds.
| getTimeToNearestBeat      |                                                    | Returns the time to the closest beat right now. Can be either negative or positive, depending on whether or not the closest beat is forward of backward in time. Useful when syncing.

See the demos inside the repo for further usage examples.
