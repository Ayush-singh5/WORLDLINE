import { describe, expect, it } from 'vitest';
import { createSeededRandom } from '../../src/simulation/rng/seededRandom';

describe('createSeededRandom', () => {
  it('produces the same sequence from the same seed', () => {
    const first = createSeededRandom(1234);
    const second = createSeededRandom(1234);
    expect(Array.from({ length: 20 }, () => first.nextUint32())).toEqual(
      Array.from({ length: 20 }, () => second.nextUint32()),
    );
  });

  it('can resume from its serialized state', () => {
    const original = createSeededRandom(42);
    original.nextUint32();
    original.nextUint32();
    const checkpointState = original.getState();
    const resumed = createSeededRandom(checkpointState);
    expect(resumed.nextUint32()).toBe(original.nextUint32());
  });

  it('returns floats in [0, 1)', () => {
    const random = createSeededRandom(7);
    for (let i = 0; i < 100; i += 1) {
      const value = random.nextFloat();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('rejects invalid seeds and ranges', () => {
    expect(() => createSeededRandom(-1)).toThrow(RangeError);
    expect(() => createSeededRandom(1.5)).toThrow(RangeError);
    expect(() => createSeededRandom(1).range(2, 2)).toThrow(RangeError);
  });
});
