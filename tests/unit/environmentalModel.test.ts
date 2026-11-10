
import { describe, expect, it } from 'vitest';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
import { calculateEnvironmentalConditions } from '../../src/simulation/core/environmentalModel';

describe('environmentalModel', () => {
  it('calculates the expected seasonal temperatures', () => {
    const config = DEFAULT_SIMULATION_CONFIG;

    expect(calculateEnvironmentalConditions(0, config).temperature)
      .toBeCloseTo(20);

    expect(calculateEnvironmentalConditions(500, config).temperature)
      .toBeCloseTo(30);

    expect(calculateEnvironmentalConditions(1000, config).temperature)
      .toBeCloseTo(20);

    expect(calculateEnvironmentalConditions(1500, config).temperature)
      .toBeCloseTo(10);

    expect(calculateEnvironmentalConditions(2000, config).temperature)
      .toBeCloseTo(20);
  });

  it('keeps rainfall non-negative', () => {
    const config = DEFAULT_SIMULATION_CONFIG;

    for (let tick = 0; tick <= 2000; tick += 100) {
      const conditions = calculateEnvironmentalConditions(tick, config);

      expect(conditions.rainfall).toBeGreaterThanOrEqual(0);
    }
  });

  it('repeats environmental conditions after one full cycle', () => {
    const config = DEFAULT_SIMULATION_CONFIG;

    expect(calculateEnvironmentalConditions(0, config))
      .toEqual(calculateEnvironmentalConditions(2000, config));
  });

  it('returns the correct season', () => {
    const config = DEFAULT_SIMULATION_CONFIG;

    expect(calculateEnvironmentalConditions(0, config).season).toBe('spring');
    expect(calculateEnvironmentalConditions(500, config).season).toBe('summer');
    expect(calculateEnvironmentalConditions(1000, config).season).toBe('autumn');
    expect(calculateEnvironmentalConditions(1500, config).season).toBe('winter');
  });
});
