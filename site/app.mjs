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
const pointInspector = document.querySelector('#bend-phase-inspector');
const pointControl = document.querySelector('#bend-point');
const pointReadout = document.querySelector('#bend-point-readout');
const keptPointReadout = document.querySelector('#bend-kept-point-readout');
const angleCarrier = document.querySelector('#bend-angle-carrier');
const angleAdded = document.querySelector('#bend-angle-added');
const angleTotal = document.querySelector('#bend-angle-total');
const angleResult = document.querySelector('#bend-angle-result');
const nextSampleReadout = document.querySelector('#bend-next-sample-readout');
const modulatorPoint = document.querySelector('#bend-modulator-point');
const resultPoint = document.querySelector('#bend-result-point');
const carrierLine = document.querySelector('#bend-carrier-wave');
const showCarrierControl = document.querySelector('#bend-show-carrier');
const listenButton = document.querySelector('#bend-listen');
const listenFrozenButton = document.querySelector('#bend-listen-frozen');
const compareFrozenButton = document.querySelector('#bend-compare-frozen');
const listenCarrierButton = document.querySelector('#bend-listen-carrier');
const listenModulatorButton = document.querySelector('#bend-listen-modulator');
const comparePlainButton = document.querySelector('#bend-compare-plain');
const stopButton = document.querySelector('#bend-stop');
const soundStatus = document.querySelector('#bend-sound-status');
const keepButton = document.querySelector('#bend-keep');
const returnButton = document.querySelector('#bend-return');
const forgetButton = document.querySelector('#bend-forget');
const studyControl = document.querySelector('#bend-study');
const studyApplyButton = document.querySelector('#bend-study-apply');
const listenKeptButton = document.querySelector('#bend-listen-kept');
const comparePlayButton = document.querySelector('#bend-compare-play');
const keptPlot = document.querySelector('#bend-kept-plot');
const keptPanel = document.querySelector('#bend-kept-panel');
const keptWaveLine = document.querySelector('#bend-kept-wave');
const keptValues = document.querySelector('#bend-kept-values');
const plottedGapReadout = document.querySelector('#bend-plotted-gap-readout');
const overlayKeptControl = document.querySelector('#bend-overlay-kept');
const overlayWaveLine = document.querySelector('#bend-overlay-wave');
let keptSettings = null;
const points = 400;
const duration = 4 / CARRIER_HZ;
const frozenStudies = new Map([
  ['slow', { ratio: 0.5, phase: 0, index: 2, bend: 'steady', moment: 0 }],
  ['thirds', { ratio: 0.6666666666666666, phase: 0.25, index: 3, bend: 'steady', moment: 0 }],
  ['plain', { ratio: 1, phase: 0, index: 0, bend: 'steady', moment: 0 }],
  ['octave', { ratio: 2, phase: 0, index: 2, bend: 'steady', moment: 0 }],
  ['fifths', { ratio: 1.5, phase: 0.25, index: 2, bend: 'steady', moment: 0 }],
  ['fast', { ratio: 3, phase: 0.5, index: 1, bend: 'steady', moment: 0 }],
  ['phase-quarter', { ratio: 1, phase: 0.25, index: 2, bend: 'steady', moment: 0 }],
  ['phase-half', { ratio: 1, phase: 0.5, index: 2, bend: 'steady', moment: 0 }],
  ['phase-three-quarters', { ratio: 1, phase: 0.75, index: 2, bend: 'steady', moment: 0 }],
]);
const repeatCyclesByRatio = new Map([
  [0.5, 2],
  [0.6666666666666666, 3],
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
  refreshPointInspector();
  values.textContent = `Carrier: ${CARRIER_HZ} Hz · modulator: ${modulator} Hz · index: ${settings.index.toFixed(2)}.`;
  indexHere.textContent = `Index here: ${indexAt(settings.moment, settings).toFixed(2)} at ${settings.moment.toFixed(2)} seconds.`;
  momentControl.disabled = settings.bend === 'steady';
  return settings;
}

overlayKeptControl.addEventListener('change', renderKept);

function updatePlottedGap() {
  if (!keptSettings) {
    plottedGapReadout.textContent = 'Keep a bend to compare the plotted samples.';
    return;
  }

  const currentY = waveLine.getAttribute('points').split(' ').map(point => Number(point.split(',')[1]));
  const keptY = keptWaveLine.getAttribute('points').split(' ').map(point => Number(point.split(',')[1]));
  let largestGap = -1;
  let largestIndex = 0;
  for (let i = 0; i < currentY.length; i += 1) {
    const gap = Math.abs(currentY[i] - keptY[i]) / 60;
    if (gap > largestGap) {
      largestGap = gap;
      largestIndex = i;
    }
  }
  plottedGapReadout.textContent = `Largest plotted gap: ${largestGap.toFixed(3)} at sample ${largestIndex} of ${points} (${(largestIndex / 100).toFixed(2)} carrier cycles).`;
}

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
    updatePlottedGap();
    refreshPointInspector();
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
  updatePlottedGap();
  refreshPointInspector();
}

function formatInspectionValue(value) {
  return (Math.abs(value) < 0.0005 ? 0 : value).toFixed(3);
}

function refreshPointInspector() {
  const settings = currentSettings();
  const index = Number(pointControl.value);
  if (!keptSettings) {
    keptPointReadout.textContent = 'Keep a bend to compare this point.';
  } else {
    const currentFrozen = { ...settings, index: indexAt(settings.moment, settings), bend: 'steady' };
    const keptFrozen = { ...keptSettings, index: indexAt(keptSettings.moment, keptSettings), bend: 'steady' };
    const time = index / (100 * CARRIER_HZ);
    const currentValue = sample(time, currentFrozen);
    const keptValue = sample(time, keptFrozen);
    keptPointReadout.textContent = `Sample ${index}: current ${formatInspectionValue(currentValue)} · kept ${formatInspectionValue(keptValue)} · current − kept ${formatInspectionValue(currentValue - keptValue)}.`;
  }

  const visible = pointInspector.open;
  modulatorPoint.toggleAttribute('hidden', !visible);
  resultPoint.toggleAttribute('hidden', !visible);
  if (!visible) return;

  const source = modulatorLine.getAttribute('points').split(' ')[index].split(',').map(Number);
  const result = waveLine.getAttribute('points').split(' ')[index].split(',').map(Number);
  modulatorPoint.setAttribute('cx', String(source[0]));
  modulatorPoint.setAttribute('cy', String(source[1]));
  resultPoint.setAttribute('cx', String(result[0]));
  resultPoint.setAttribute('cy', String(result[1]));
  pointReadout.textContent = `At ${(index / 100).toFixed(2)} carrier cycles: bending sine ${((80 - source[1]) / 60).toFixed(3)} · resulting wave ${((80 - result[1]) / 60).toFixed(3)}.`;

  const frozenIndex = indexAt(settings.moment, settings);
  const carrier = 2 * Math.PI * index / 100;
  const sourceValue = Math.sin(2 * Math.PI * settings.ratio * index / 100 + 2 * Math.PI * settings.phase);
  const added = frozenIndex * sourceValue;
  const total = carrier + added;
  angleCarrier.textContent = `${formatInspectionValue(carrier)} rad`;
  angleAdded.textContent = `${formatInspectionValue(added)} rad`;
  angleTotal.textContent = `${formatInspectionValue(total)} rad`;
  angleResult.textContent = formatInspectionValue(Math.sin(total));

  const frozenSettings = { ...settings, index: frozenIndex, bend: 'steady' };
  const currentValue = sample(index / (100 * CARRIER_HZ), frozenSettings);
  if (index === points) {
    nextSampleReadout.textContent = 'Sample 400 is the last plotted sample; there is no next sample.';
  } else {
    const nextValue = sample((index + 1) / (100 * CARRIER_HZ), frozenSettings);
    nextSampleReadout.textContent = `Samples ${index} → ${index + 1}: ${formatInspectionValue(currentValue)} → ${formatInspectionValue(nextValue)}; change ${formatInspectionValue(nextValue - currentValue)} in sine value.`;
  }
}

pointControl.addEventListener('input', refreshPointInspector);
pointInspector.addEventListener('toggle', refreshPointInspector);

function refresh() {
  render();
  renderKept();
}

function updateStudyEligibility() {
  const study = frozenStudies.get(studyControl.value);
  studyApplyButton.disabled = !study || sameSettings(currentSettings(), study);
}

studyControl.addEventListener('change', updateStudyEligibility);
studyApplyButton.addEventListener('click', () => {
  const study = frozenStudies.get(studyControl.value);
  if (!study || sameSettings(currentSettings(), study)) return;
  ratioControl.value = String(study.ratio);
  phaseControl.value = String(study.phase);
  indexControl.value = String(study.index);
  modeControl.value = study.bend;
  momentControl.value = String(study.moment);
  settingsChanged();
});

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

function frozenSettings(snapshot) {
  return { ...snapshot, index: indexAt(snapshot.moment, snapshot), bend: 'steady' };
}

function listenFrozenInstant() {
  const snapshot = { ...currentSettings() };
  const frozen = frozenSettings(snapshot);
  return playSound(rate => note(frozen, rate), 'Playing the frozen instant.');
}

function compareEvolvingThenFrozen() {
  const snapshot = { ...currentSettings() };
  const frozen = frozenSettings(snapshot);
  return playSound(rate => {
    const samples = new Float32Array(Math.round(1.85 * rate));
    samples.set(note(snapshot, rate), 0);
    samples.set(note(frozen, rate), Math.round(1.05 * rate));
    return samples;
  }, 'Playing evolving then frozen.');
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
  updateStudyEligibility();
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
  updateStudyEligibility();
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
compareFrozenButton.addEventListener('click', compareEvolvingThenFrozen);
listenCarrierButton.addEventListener('click', () => listen(undefined, CARRIER_HZ));
listenModulatorButton.addEventListener('click', () => listen(undefined, CARRIER_HZ * Number(ratioControl.value), Number(phaseControl.value)));
stopButton.addEventListener('click', stopSound);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSound();
});
refresh();
updateStudyEligibility();
