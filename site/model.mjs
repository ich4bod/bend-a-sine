export const CARRIER_HZ = 220;

export function indexAt(t, { index, bend = 'steady' }) {
  if (bend === 'falling') return index * Math.max(0, 1 - t / 0.6);
  if (bend === 'rising') return index * Math.min(1, Math.max(0, t / 0.6));
  return index;
}

export function sample(t, { ratio, index, bend = 'steady', phase = 0 }) {
  const modulator = CARRIER_HZ * ratio;
  return Math.sin(2 * Math.PI * CARRIER_HZ * t + indexAt(t, { index, bend }) * Math.sin(2 * Math.PI * modulator * t + 2 * Math.PI * phase));
}

export function envelope(t) {
  return Math.max(0, Math.min(1, t / 0.01, (0.8 - t) / 0.04));
}

export function plainNote(frequency, sampleRate, phase = 0) {
  const samples = new Float32Array(Math.round(0.8 * sampleRate));
  for (let i = 0; i < samples.length; i += 1) {
    const t = i / sampleRate;
    samples[i] = 0.15 * envelope(t) * Math.sin(2 * Math.PI * frequency * t + 2 * Math.PI * phase);
  }
  return samples;
}

export function note(settings, sampleRate) {
  const samples = new Float32Array(Math.round(0.8 * sampleRate));
  for (let i = 0; i < samples.length; i += 1) {
    const t = i / sampleRate;
    samples[i] = 0.15 * envelope(t) * sample(t, settings);
  }
  return samples;
}
