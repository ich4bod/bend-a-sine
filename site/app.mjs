import { CARRIER_HZ, sample } from './model.mjs?v=1';

const ratioControl = document.querySelector('#bend-ratio');
const indexControl = document.querySelector('#bend-index');
const values = document.querySelector('#bend-values');
const modulatorLine = document.querySelector('#bend-modulator');
const waveLine = document.querySelector('#bend-wave');
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

ratioControl.addEventListener('input', render);
ratioControl.addEventListener('change', render);
indexControl.addEventListener('input', render);
indexControl.addEventListener('change', render);
render();
