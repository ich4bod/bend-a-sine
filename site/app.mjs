import { CARRIER_HZ, note, sample } from './model.mjs?v=2';

const ratioControl = document.querySelector('#bend-ratio');
const indexControl = document.querySelector('#bend-index');
const values = document.querySelector('#bend-values');
const modulatorLine = document.querySelector('#bend-modulator');
const waveLine = document.querySelector('#bend-wave');
const listenButton = document.querySelector('#bend-listen');
const stopButton = document.querySelector('#bend-stop');
const soundStatus = document.querySelector('#bend-sound-status');
const keepButton = document.querySelector('#bend-keep');
const returnButton = document.querySelector('#bend-return');
const forgetButton = document.querySelector('#bend-forget');
const listenKeptButton = document.querySelector('#bend-listen-kept');
const keptPlot = document.querySelector('#bend-kept-plot');
const keptPanel = document.querySelector('#bend-kept-panel');
const keptWaveLine = document.querySelector('#bend-kept-wave');
const keptValues = document.querySelector('#bend-kept-values');
let keptSettings = null;
const points = 400;
const duration = 4 / CARRIER_HZ;

function serializePoint(x, y) {
  return `${x.toFixed(9)},${y.toFixed(9)}`;
}

function currentSettings() {
  return {
    ratio: Number(ratioControl.value),
    index: Number(indexControl.value),
  };
}

function sameSettings(left, right) {
  return left.ratio === right.ratio && left.index === right.index;
}

function render() {
  const settings = currentSettings();
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
  return settings;
}

function renderKept() {
  if (!keptSettings) {
    keptPanel.hidden = true;
    keptPlot.setAttribute('hidden', '');
    keptValues.textContent = 'No bend kept.';
    returnButton.disabled = true;
    forgetButton.disabled = true;
    listenKeptButton.disabled = true;
    return;
  }

  const keptPoints = [];
  for (let i = 0; i <= points; i += 1) {
    const t = duration * i / points;
    const x = 12 + 376 * i / points;
    keptPoints.push(serializePoint(x, 80 - 60 * sample(t, keptSettings)));
  }
  keptWaveLine.setAttribute('points', keptPoints.join(' '));
  keptPanel.hidden = false;
  keptPlot.removeAttribute('hidden');
  keptValues.textContent = `Kept: ratio ${keptSettings.ratio} : 1 · index ${keptSettings.index.toFixed(2)}.`;
  returnButton.disabled = sameSettings(keptSettings, currentSettings());
  forgetButton.disabled = false;
  listenKeptButton.disabled = false;
}

function refresh() {
  render();
  renderKept();
}

keepButton.addEventListener('click', () => {
  keptSettings = { ...currentSettings() };
  renderKept();
});

forgetButton.addEventListener('click', () => {
  if (!keptSettings) return;
  keptSettings = null;
  renderKept();
});

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

async function listen(settings = currentSettings()) {
  stopSound();
  const request = playbackRequest;
  try {
    if (!audioContext) audioContext = new AudioContext();
    await audioContext.resume();
    if (request !== playbackRequest || document.hidden) return;

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
  refresh();
}

returnButton.addEventListener('click', () => {
  if (!keptSettings || sameSettings(keptSettings, currentSettings())) return;
  stopSound();
  ratioControl.value = String(keptSettings.ratio);
  indexControl.value = String(keptSettings.index);
  refresh();
});

listenKeptButton.addEventListener('click', () => {
  if (!keptSettings) return;
  listen({ ...keptSettings });
});

ratioControl.addEventListener('input', settingsChanged);
ratioControl.addEventListener('change', settingsChanged);
indexControl.addEventListener('input', settingsChanged);
indexControl.addEventListener('change', settingsChanged);
listenButton.addEventListener('click', () => listen());
stopButton.addEventListener('click', stopSound);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSound();
});
refresh();
