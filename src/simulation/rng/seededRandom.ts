const UINT32_RANGE = 0x1_0000_0000;
const MULBERRY_INCREMENT = 0x6d2b79f5;

export interface SeededRandom {
  /** Return an unsigned 32-bit value and advance the generator. */
  nextUint32(): number;
  /** Return a value in the half-open interval [0, 1). */
  nextFloat(): number;
  /** Return a value in [min, max), requiring finite min < max. */
  range(min: number, max: number): number;
  /** Current state, suitable for a checkpoint before the next draw. */
  getState(): number;
}

function assertUint32(seed: number): void {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffff_ffff) {
    throw new RangeError('Seed must be an unsigned 32-bit integer.');
  }
}

/**
 * Mulberry32 PRNG with explicit, serializable state.
 * Determinism is guaranteed for the same implementation and sequence of calls.
 */
export function createSeededRandom(initialState: number): SeededRandom {
  assertUint32(initialState);
  let state = initialState >>> 0;

  function nextUint32(): number {
    state = (state + MULBERRY_INCREMENT) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  }

  return {
    nextUint32,
    nextFloat: () => nextUint32() / UINT32_RANGE,
    range(min: number, max: number): number {
      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
        throw new RangeError('range() requires finite bounds where min < max.');
      }
      return min + (max - min) * (nextUint32() / UINT32_RANGE);
    },
    getState: () => state,
  };
}
