import { describe, expect, it } from 'vitest';
import { compareMetric } from '../../src/simulation/analysis/compareWorlds';

describe('compareMetric', () => {
  it('calculates an increase correctly', () => {
    expect(compareMetric(100, 120)).toEqual({
      baseline: 100,
      experiment: 120,
      difference: 20,
      percentageChange: 20,
    });
  });

  it('calculates a decrease correctly', () => {
    expect(compareMetric(100, 80)).toEqual({
      baseline: 100,
      experiment: 80,
      difference: -20,
      percentageChange: -20,
    });
  });

  it('handles a zero baseline', () => {
    expect(compareMetric(0, 10)).toEqual({
      baseline: 0,
      experiment: 10,
      difference: 10,
      percentageChange: null,
    });
  });

  it('rejects invalid metric values', () => {
    expect(() => compareMetric(Number.NaN, 10)).toThrow();
    expect(() => compareMetric(10, Infinity)).toThrow();
  });
});