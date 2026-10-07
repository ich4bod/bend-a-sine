export const CARRIER_HZ = 220;

export function sample(t, { ratio, index }) {
  const modulator = CARRIER_HZ * ratio;
  return Math.sin(2 * Math.PI * CARRIER_HZ * t + index * Math.sin(2 * Math.PI * modulator * t));
}

export function envelope(t) {
  return Math.max(0, Math.min(1, t / 0.01, (0.8 - t) / 0.04));
}

export function note(settings, sampleRate) {
  const samples = new Float32Array(Math.round(0.8 * sampleRate));
  for (let i = 0; i < samples.length; i += 1) {
    const t = i / sampleRate;
    samples[i] = 0.15 * envelope(t) * sample(t, settings);
  }
  return samples;
}
