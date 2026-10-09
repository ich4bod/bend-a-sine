import { CARRIER_HZ, indexAt, note, plainNote, sample } from './model.mjs?v=7';

const ratioControl = document.querySelector('#bend-ratio');
const phaseControl = document.querySelector('#bend-phase');
const keptPhase = document.querySelector('#bend-kept-phase');
const indexControl = document.querySelector('#bend-index');
const modeControl = document.querySelector('#bend-mode');
const momentControl = document.querySelector('#bend-moment');
const indexHere = document.querySelector('#bend-index-here');
const values = document.querySelector('#bend-values');
const modulatorLine = document.querySelector('#bend-modulator');
const waveLine = document.querySelector('#bend-wave');
const repeatLine = document.querySelector('#bend-repeat-line');
const repeatEnd = document.querySelector('#bend-repeat-end');
const repeatReadout = document.querySelector('#bend-repeat-readout');
const carrierLine = document.querySelector('#bend-carrier-wave');
const showCarrierControl = document.querySelector('#bend-show-carrier');
const listenButton = document.querySelector('#bend-listen');
const listenFrozenButton = document.querySelector('#bend-listen-frozen');
const listenCarrierButton = document.querySelector('#bend-listen-carrier');
const listenModulatorButton = document.querySelector('#bend-listen-modulator');
const comparePlainButton = document.querySelector('#bend-compare-plain');
const stopButton = document.querySelector('#bend-stop');
const soundStatus = document.querySelector('#bend-sound-status');
const keepButton = document.querySelector('#bend-keep');
const returnButton = document.querySelector('#bend-return');
const forgetButton = document.querySelector('#bend-forget');
const listenKeptButton = document.querySelector('#bend-listen-kept');
const comparePlayButton = document.querySelector('#bend-compare-play');
const keptPlot = document.querySelector('#bend-kept-plot');
const keptPanel = document.querySelector('#bend-kept-panel');
const keptWaveLine = document.querySelector('#bend-kept-wave');
const keptValues = document.querySelector('#bend-kept-values');
const overlayKeptControl = document.querySelector('#bend-overlay-kept');
const overlayWaveLine = document.querySelector('#bend-overlay-wave');
let keptSettings = null;
const points = 400;
const duration = 4 / CARRIER_HZ;
const repeatCyclesByRatio = new Map([
  [1, 1],
  [1.5, 2],
  [1.3333333333333333, 3],
  [1.25, 4],
  [2, 1],
  [3, 1],
]);

function serializePoint(x, y) {
  return `${x.toFixed(9)},${y.toFixed(9)}`;
}

const carrierPoints = [];
for (let i = 0; i <= points; i += 1) {
  const t = duration * i / points;
  const x = 12 + 376 * i / points;
  carrierPoints.push(serializePoint(x, 80 - 60 * Math.sin(2 * Math.PI * CARRIER_HZ * t)));
}
carrierLine.setAttribute('points', carrierPoints.join(' '));
showCarrierControl.addEventListener('change', () => {
  carrierLine.toggleAttribute('hidden', !showCarrierControl.checked);
});

function currentSettings() {
  return {
    ratio: Number(ratioControl.value),
    phase: Number(phaseControl.value),
    index: Number(indexControl.value),
    bend: modeControl.value,
    moment: modeControl.value === 'steady' ? 0 : Number(momentControl.value),
  };
}

function sameSettings(left, right) {
  return left.ratio === right.ratio
    && (left.phase ?? 0) === (right.phase ?? 0)
    && left.index === right.index
    && left.bend === right.bend
    && left.moment === right.moment;
}

function render() {
  const settings = currentSettings();
  const frozenIndex = indexAt(settings.moment, settings);
  const repeatCycles = frozenIndex === 0 ? 1 : (repeatCyclesByRatio.get(settings.ratio) ?? 1);
  const repeatX = 12 + 94 * repeatCycles;
  repeatLine.setAttribute('x2', String(repeatX));
  repeatEnd.setAttribute('x1', String(repeatX));
  repeatEnd.setAttribute('x2', String(repeatX));
  repeatReadout.textContent = repeatCycles === 1
    ? 'Frozen wave repeats after 1 carrier cycle.'
    : `Frozen wave repeats after ${repeatCycles} carrier cycles.`;
  const modulator = CARRIER_HZ * settings.ratio;
  const modulatorPoints = [];
  const wavePoints = [];

  for (let i = 0; i <= points; i += 1) {
    const t = duration * i / points;
    const x = 12 + 376 * i / points;
    modulatorPoints.push(serializePoint(x, 80 - 60 * Math.sin(2 * Math.PI * modulator * t + 2 * Math.PI * settings.phase)));
    wavePoints.push(serializePoint(x, 80 - 60 * sample(t, { ...settings, index: indexAt(settings.moment, settings), bend: 'steady' })));
  }

  modulatorLine.setAttribute('points', modulatorPoints.join(' '));
  waveLine.setAttribute('points', wavePoints.join(' '));
  values.textContent = `Carrier: ${CARRIER_HZ} Hz · modulator: ${modulator} Hz · index: ${settings.index.toFixed(2)}.`;
  indexHere.textContent = `Index here: ${indexAt(settings.moment, settings).toFixed(2)} at ${settings.moment.toFixed(2)} seconds.`;
  momentControl.disabled = settings.bend === 'steady';
  return settings;
}

overlayKeptControl.addEventListener('change', renderKept);

function renderKept() {
  overlayKeptControl.disabled = !keptSettings;
  if (!keptSettings) {
    overlayKeptControl.checked = false;
    overlayWaveLine.setAttribute('hidden', '');
    keptPanel.hidden = true;
    keptPlot.setAttribute('hidden', '');
    keptValues.textContent = 'No bend kept.';
    keptPhase.textContent = 'No source phase kept.';
    returnButton.disabled = true;
    forgetButton.disabled = true;
    listenKeptButton.disabled = true;
    comparePlayButton.disabled = true;
    return;
  }

  const keptPoints = [];
  for (let i = 0; i <= points; i += 1) {
    const t = duration * i / points;
    const x = 12 + 376 * i / points;
    keptPoints.push(serializePoint(x, 80 - 60 * sample(t, { ...keptSettings, index: indexAt(keptSettings.moment, keptSettings), bend: 'steady' })));
  }
  const serializedPoints = keptPoints.join(' ');
  keptWaveLine.setAttribute('points', serializedPoints);
  overlayWaveLine.setAttribute('points', serializedPoints);
  overlayWaveLine.toggleAttribute('hidden', !overlayKeptControl.checked);
  keptPanel.hidden = false;
  keptPlot.removeAttribute('hidden');
  keptValues.textContent = `Kept: ratio ${keptSettings.ratio} : 1 · index ${keptSettings.index.toFixed(2)} · ${keptSettings.bend} · at ${keptSettings.moment.toFixed(2)} seconds.`;
  keptPhase.textContent = `Kept source phase: ${keptSettings.phase ?? 0} cycles.`;
  returnButton.disabled = sameSettings(keptSettings, currentSettings());
  forgetButton.disabled = false;
  listenKeptButton.disabled = false;
  comparePlayButton.disabled = false;
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

async function playSound(samplesAtRate, status) {
  stopSound();
  const request = playbackRequest;
  stopButton.disabled = false;
  try {
    if (!audioContext) audioContext = new AudioContext();
    await audioContext.resume();
    if (request !== playbackRequest || document.hidden) return;

    const samples = samplesAtRate(audioContext.sampleRate);
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
    soundStatus.textContent = status;
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

function listen(settings = currentSettings(), sourceFrequency = null, sourcePhase = 0) {
  const snapshot = { ...settings };
  return playSound(rate => sourceFrequency === null
    ? note(snapshot, rate)
    : plainNote(sourceFrequency, rate, sourcePhase), 'Playing one note.');
}

function listenFrozenInstant() {
  const snapshot = { ...currentSettings() };
  const frozenIndex = indexAt(snapshot.moment, snapshot);
  return playSound(rate => note({ ...snapshot, index: frozenIndex, bend: 'steady' }, rate), 'Playing the frozen instant.');
}

function compareNotes() {
  if (!keptSettings) return;
  const kept = { ...keptSettings };
  const current = { ...currentSettings() };
  return playSound(rate => {
    const samples = new Float32Array(Math.round(1.85 * rate));
    samples.set(note(kept, rate), 0);
    samples.set(note(current, rate), Math.round(1.05 * rate));
    return samples;
  }, 'Playing kept then current.');
}

function comparePlainThenCurrent() {
  const current = { ...currentSettings() };
  return playSound(rate => {
    const samples = new Float32Array(Math.round(1.85 * rate));
    samples.set(plainNote(CARRIER_HZ, rate), 0);
    samples.set(note(current, rate), Math.round(1.05 * rate));
    return samples;
  }, 'Playing plain then bent.');
}

function settingsChanged() {
  stopSound();
  refresh();
}

returnButton.addEventListener('click', () => {
  if (!keptSettings || sameSettings(keptSettings, currentSettings())) return;
  stopSound();
  ratioControl.value = String(keptSettings.ratio);
  phaseControl.value = String(keptSettings.phase ?? 0);
  indexControl.value = String(keptSettings.index);
  modeControl.value = keptSettings.bend;
  momentControl.value = String(keptSettings.moment);
  refresh();
});

listenKeptButton.addEventListener('click', () => {
  if (!keptSettings) return;
  listen({ ...keptSettings });
});

comparePlayButton.addEventListener('click', compareNotes);
comparePlainButton.addEventListener('click', comparePlainThenCurrent);

ratioControl.addEventListener('input', settingsChanged);
ratioControl.addEventListener('change', settingsChanged);
phaseControl.addEventListener('input', settingsChanged);
phaseControl.addEventListener('change', settingsChanged);
indexControl.addEventListener('input', settingsChanged);
indexControl.addEventListener('change', settingsChanged);
modeControl.addEventListener('input', settingsChanged);
modeControl.addEventListener('change', settingsChanged);
momentControl.addEventListener('input', settingsChanged);
momentControl.addEventListener('change', settingsChanged);
listenButton.addEventListener('click', () => listen());
listenFrozenButton.addEventListener('click', listenFrozenInstant);
listenCarrierButton.addEventListener('click', () => listen(undefined, CARRIER_HZ));
listenModulatorButton.addEventListener('click', () => listen(undefined, CARRIER_HZ * Number(ratioControl.value), Number(phaseControl.value)));
stopButton.addEventListener('click', stopSound);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSound();
});
refresh();
