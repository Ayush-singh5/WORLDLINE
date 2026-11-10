
import { describe, expect, it } from 'vitest';
import { decomposeOrganicMatter } from '../../src/simulation/core/decomposeOrganicMatter';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
import type { EnvironmentState } from '../../src/simulation/core/types';

describe('decomposeOrganicMatter', () => {
  const environment: EnvironmentState = {
    temperature: 20,
    rainfall: 0.5,
    water: 500,
    nutrients: 500,
    organicMatter: 100,
  };

  it('decomposes organic matter gradually', () => {
    const result = decomposeOrganicMatter(
      environment,
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(result.organicMatter).toBeCloseTo(99);
  });

  it('returns nutrients from decomposed organic matter', () => {
    const result = decomposeOrganicMatter(
      environment,
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(result.nutrients).toBeCloseTo(500.7);
  });

  it('does not decompose organic matter when the rate is zero', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      decompositionRate: 0,
    };

    const result = decomposeOrganicMatter(environment, config);

    expect(result.organicMatter).toBe(100);
    expect(result.nutrients).toBe(500);
  });

  it('does not return nutrients when the return rate is zero', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      nutrientReturnRate: 0,
    };

    const result = decomposeOrganicMatter(environment, config);

    expect(result.organicMatter).toBeCloseTo(99);
    expect(result.nutrients).toBe(500);
  });

  it('does not exceed the maximum nutrient capacity', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      decompositionRate: 1,
      nutrientReturnRate: 1,
    };

    const environmentWithHighNutrients = {
      ...environment,
      nutrients: 999.5,
    };

    const result = decomposeOrganicMatter(
      environmentWithHighNutrients,
      config,
    );

    expect(result.nutrients).toBe(1000);
  });

  it('does not mutate the original environment', () => {
    const original = structuredClone(environment);

    decomposeOrganicMatter(environment, DEFAULT_SIMULATION_CONFIG);

    expect(environment).toEqual(original);
  });

  it('returns an unchanged copy when organic matter is zero', () => {
    const emptyEnvironment = {
      ...environment,
      organicMatter: 0,
    };

    const result = decomposeOrganicMatter(
      emptyEnvironment,
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(result).toEqual(emptyEnvironment);
    expect(result).not.toBe(emptyEnvironment);
  });
});
