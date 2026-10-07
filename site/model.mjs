export const CARRIER_HZ = 220;

export function sample(t, { ratio, index }) {
  const modulator = CARRIER_HZ * ratio;
  return Math.sin(2 * Math.PI * CARRIER_HZ * t + index * Math.sin(2 * Math.PI * modulator * t));
}
