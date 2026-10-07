import { CARRIER_HZ, note, sample } from './model.mjs?v=2';

const ratioControl = document.querySelector('#bend-ratio');
const indexControl = document.querySelector('#bend-index');
const values = document.querySelector('#bend-values');
const modulatorLine = document.querySelector('#bend-modulator');
const waveLine = document.querySelector('#bend-wave');
const listenButton = document.querySelector('#bend-listen');
const stopButton = document.querySelector('#bend-stop');
const soundStatus = document.querySelector('#bend-sound-status');
const points = 400;
const duration = 4 / CARRIER_HZ;

function serializePoint(x, y) {
  return `${x.toFixed(9)},${y.toFixed(9)}`;
}

function render() {
  const settings = {
    ratio: Number(ratioControl.value),
    index: Number(indexControl.value),
  };
  const modulator = CARRIER_HZ * settings.ratio;
  const modulatorPoints = [];
  const wavePoints = [];

  for (let i = 0; i <= points; i += 1) {
    const t = duration * i / points;
    const x = 12 + 376 * i / points;
    modulatorPoints.push(serializePoint(x, 80 - 60 * Math.sin(2 * Math.PI * modulator * t)));
    wavePoints.push(serializePoint(x, 80 - 60 * sample(t, settings)));
  }

  modulatorLine.setAttribute('points', modulatorPoints.join(' '));
  waveLine.setAttribute('points', wavePoints.join(' '));
  values.textContent = `Carrier: ${CARRIER_HZ} Hz · modulator: ${modulator} Hz · index: ${settings.index.toFixed(2)}.`;
}

let audioContext = null;
let activeSource = null;
let playbackRequest = 0;

function stopSound() {
  playbackRequest += 1;
  if (activeSource) {
    const source = activeSource;
    activeSource = null;
    source.onended = null;
    try {
      source.stop();
    } catch {
      // A note that ended just before a control edit is already silent.
    }
    source.disconnect();
  }
  soundStatus.textContent = 'Ready.';
  stopButton.disabled = true;
}

async function listen() {
  stopSound();
  const request = playbackRequest;
  try {
    if (!audioContext) audioContext = new AudioContext();
    await audioContext.resume();
    if (request !== playbackRequest || document.hidden) return;

    const settings = {
      ratio: Number(ratioControl.value),
      index: Number(indexControl.value),
    };
    const samples = note(settings, audioContext.sampleRate);
    const buffer = audioContext.createBuffer(1, samples.length, audioContext.sampleRate);
    buffer.copyToChannel(samples, 0);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = false;
    source.connect(audioContext.destination);
    source.onended = () => {
      if (activeSource !== source) return;
      activeSource = null;
      source.disconnect();
      soundStatus.textContent = 'Ready.';
      stopButton.disabled = true;
    };
    activeSource = source;
    soundStatus.textContent = 'Playing one note.';
    stopButton.disabled = false;
    source.start();
  } catch {
    if (request === playbackRequest) {
      if (activeSource) {
        const source = activeSource;
        activeSource = null;
        source.onended = null;
        try {
          source.stop();
        } catch {
          // The failed source may not have started.
        }
        source.disconnect();
      }
      soundStatus.textContent = 'Sound is unavailable in this browser.';
      stopButton.disabled = true;
    }
  }
}

function settingsChanged() {
  stopSound();
  render();
}

ratioControl.addEventListener('input', settingsChanged);
ratioControl.addEventListener('change', settingsChanged);
indexControl.addEventListener('input', settingsChanged);
indexControl.addEventListener('change', settingsChanged);
listenButton.addEventListener('click', listen);
stopButton.addEventListener('click', stopSound);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSound();
});
render();
