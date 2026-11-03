
import type { WorldState } from './types';

/**
 * Serialize values with stable object-key ordering.
 * Arrays retain their original order because entity order is meaningful.
 */
function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'undefined';
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableSerialize(record[key])}`,
    )
    .join(',')}}`;
}

/**
 * Return a deterministic, non-cryptographic 32-bit fingerprint.
 * Intended for simulation comparisons, not security or proof against collisions.
 */
export function hashWorldState(state: WorldState): string {
  const serialized = stableSerialize(state);
  let hash = 0x811c9dc5;

  for (let i = 0; i < serialized.length; i += 1) {
    const codePoint = serialized.charCodeAt(i);
    hash = Math.imul(hash ^ (codePoint & 0xff), 0x01000193);
    hash = Math.imul(hash ^ (codePoint >>> 8), 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}
