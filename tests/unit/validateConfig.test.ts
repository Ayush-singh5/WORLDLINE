import { describe, expect, it } from 'vitest';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
import { assertValidConfig, validateConfig } from '../../src/simulation/validation/validateConfig';
import type { SimulationConfig } from '../../src/simulation/core/types';

const validConfig: SimulationConfig = { ...DEFAULT_SIMULATION_CONFIG };

describe('validateConfig', () => {
  it('accepts the default configuration', () => {
    expect(validateConfig(validConfig)).toEqual({ valid: true, issues: [] });
  });

  it('accepts seed zero', () => {
    expect(validateConfig({ ...validConfig, seed: 0 }).valid).toBe(true);
  });

  it('reports invalid dimensions, rates, and population totals', () => {
    const result = validateConfig({
      ...validConfig,
      width: Number.NaN,
      plantGrowthRate: -1,
      initialPlants: 2_000,
      initialHerbivores: 1,
      initialPredators: 0,
      maxPopulation: 2_000,
    });
    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain('width');
    expect(result.issues.map((issue) => issue.path)).toContain('plantGrowthRate');
    expect(result.issues.map((issue) => issue.path)).toContain('maxPopulation');
  });

  it('throws a descriptive error for invalid configuration', () => {
    expect(() => assertValidConfig({ ...validConfig, height: 0 })).toThrow(
      /height: Must be a finite number greater than zero/,
    );
  });
});
