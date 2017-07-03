// Start off by initializing a new context.
var context = new (window.AudioContext || window.webkitAudioContext)();

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = new Array();
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  }

  request.onerror = function() {
    console.log('BufferLoader: XHR error');
  }

  request.send();
};

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
  this.loadBuffer(this.urlList[i], i);
};


function RoomEffectsSample(inputs) {
  let ctx = this;
  for (let i = 0; i < inputs.length; i++) {
    inputs[i].addEventListener('change', e => ctx.setImpulseResponse(e.target.value));
  }

  this.impulseResponses = [];
  this.buffer = null;

  // Load all of the needed impulse responses and the actual sample.
  let loader = new BufferLoader(context, [
    '../assets/audio/control-room-ambient.mp3',
    '../assets/audio/telephone.wav',
    '../assets/audio/spring.wav'
  ], onLoaded);

  function onLoaded(buffers) {
    ctx.buffer = buffers[0];
    ctx.impulseResponses = buffers.splice(1);
    ctx.impulseResponseBuffer = ctx.impulseResponses[0];

    sample.playPause();
  }
  loader.load();
}

RoomEffectsSample.prototype.setImpulseResponse = function(index) {
  this.impulseResponseBuffer = this.impulseResponses[index];
  // Change the impulse response buffer.
  this.convolver.buffer = this.impulseResponseBuffer;
};

RoomEffectsSample.prototype.playPause = function() {
  if (!this.isPlaying) {
    // Make a source node for the sample.
    let source = context.createBufferSource();
    source.buffer = this.buffer;
    // Make a convolver node for the impulse response.
    let convolver = context.createConvolver();
    convolver.buffer = this.impulseResponseBuffer;
    // Connect the graph.
    source.connect(convolver);
    convolver.connect(context.destination);
    source.loop = true;
    // Save references to important nodes.
    this.source = source;
    this.convolver = convolver;
    // Start playback.
    this.source[this.source.start ? 'start': 'noteOn'](0);
  } else {
    this.source[this.source.stop ? 'stop': 'noteOff'](0);
  }
  this.isPlaying = !this.isPlaying;
};


let sample = new RoomEffectsSample(1);
document.querySelector('button#sound-toggle')
  .addEventListener('click', e => {
    sample.playPause();
    e.currentTarget.querySelector('img').src = sample.isPlaying ? 'assets/img/sound-on.svg' : 'assets/img/sound-off.svg';
  });
