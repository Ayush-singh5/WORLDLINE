
import { describe, expect, it } from 'vitest';

import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
import { consumePlantResources } from '../../src/simulation/core/consumePlantResources';

import type { EnvironmentState } from '../../src/simulation/core/types';

describe('consumePlantResources', () => {
  const config = DEFAULT_SIMULATION_CONFIG;

  const environment: EnvironmentState = {
    temperature: 20,
    rainfall: 0.5,
    water: 500,
    nutrients: 500,
  };

  it('consumes water and nutrients based on biomass gained', () => {
    const result = consumePlantResources(environment, 100, config);

    expect(result.waterConsumed).toBeCloseTo(0.1);
    expect(result.nutrientsConsumed).toBeCloseTo(0.01);
  });

  it('reduces shared environmental resources', () => {
    const result = consumePlantResources(environment, 100, config);

    expect(result.environment.water).toBeLessThan(environment.water);
    expect(result.environment.nutrients).toBeLessThan(environment.nutrients);
  });

  it('does not consume resources when biomass gain is zero', () => {
    const result = consumePlantResources(environment, 0, config);

    expect(result.waterConsumed).toBe(0);
    expect(result.nutrientsConsumed).toBe(0);
    expect(result.environment.water).toBe(environment.water);
    expect(result.environment.nutrients).toBe(environment.nutrients);
  });

  it('does not allow resources to become negative', () => {
    const scarceEnvironment = {
      ...environment,
      water: 0.01,
      nutrients: 0.001,
    };

    const result = consumePlantResources(
      scarceEnvironment,
      1000,
      config,
    );

    expect(result.environment.water).toBe(0);
    expect(result.environment.nutrients).toBe(0);
    expect(result.waterConsumed).toBe(0.01);
    expect(result.nutrientsConsumed).toBe(0.001);
  });

  it('does not mutate the original environment', () => {
    const original = { ...environment };

    consumePlantResources(environment, 100, config);

    expect(environment).toEqual(original);
  });

  it('treats negative biomass gain as zero', () => {
    const result = consumePlantResources(environment, -100, config);

    expect(result.waterConsumed).toBe(0);
    expect(result.nutrientsConsumed).toBe(0);
  });

  it('produces deterministic results', () => {
    expect(
      consumePlantResources(environment, 100, config),
    ).toEqual(
      consumePlantResources(environment, 100, config),
    );
  });
});
