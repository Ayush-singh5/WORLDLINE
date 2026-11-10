
import { describe, expect, it } from 'vitest';

import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
import { updateEnvironment } from '../../src/simulation/core/updateEnvironment';

import type { EnvironmentState } from '../../src/simulation/core/types';
import type { EnvironmentalConditions } from '../../src/simulation/core/environmentalModel';

describe('updateEnvironment', () => {
  const config = DEFAULT_SIMULATION_CONFIG;

  const initialEnvironment: EnvironmentState = {
    temperature: 20,
    rainfall: 0.5,
    water: 500,
    nutrients: 500,
    organicMatter: 0,
  };

  it('replenishes water when rainfall exceeds evaporation', () => {
    const conditions: EnvironmentalConditions = {
      temperature: 20,
      rainfall: 1,
      season: 'spring',
    };

    const result = updateEnvironment(
      initialEnvironment,
      conditions,
      config,
    );

    expect(result.water).toBeGreaterThan(initialEnvironment.water);
  });

  it('reduces water through evaporation when rainfall is zero', () => {
    const conditions: EnvironmentalConditions = {
      temperature: 20,
      rainfall: 0,
      season: 'summer',
    };

    const result = updateEnvironment(
      initialEnvironment,
      conditions,
      config,
    );

    expect(result.water).toBeLessThan(initialEnvironment.water);
  });

  it('increases evaporation at higher temperatures', () => {
    const hotConditions: EnvironmentalConditions = {
      temperature: 40,
      rainfall: 0,
      season: 'summer',
    };

    const coldConditions: EnvironmentalConditions = {
      temperature: 0,
      rainfall: 0,
      season: 'winter',
    };

    const hotResult = updateEnvironment(
      initialEnvironment,
      hotConditions,
      config,
    );

    const coldResult = updateEnvironment(
      initialEnvironment,
      coldConditions,
      config,
    );

    expect(hotResult.water).toBeLessThan(coldResult.water);
  });

  it('regenerates nutrients over time', () => {
    const conditions: EnvironmentalConditions = {
      temperature: 20,
      rainfall: 0.5,
      season: 'spring',
    };

    const result = updateEnvironment(
      initialEnvironment,
      conditions,
      config,
    );

    expect(result.nutrients).toBeGreaterThan(initialEnvironment.nutrients);
  });

  it('keeps resources within valid limits', () => {
    const conditions: EnvironmentalConditions = {
      temperature: 20,
      rainfall: 100,
      season: 'spring',
    };

    const result = updateEnvironment(
      {
        ...initialEnvironment,
        water: 999.9,
        nutrients: 999.9,
      },
      conditions,
      config,
    );

    expect(result.water).toBeLessThanOrEqual(1000);
    expect(result.nutrients).toBeLessThanOrEqual(1000);
    expect(result.water).toBeGreaterThanOrEqual(0);
    expect(result.nutrients).toBeGreaterThanOrEqual(0);
  });

  it('does not mutate the original environment', () => {
    const original = { ...initialEnvironment };

    updateEnvironment(
      initialEnvironment,
      {
        temperature: 25,
        rainfall: 0.8,
        season: 'summer',
      },
      config,
    );

    expect(initialEnvironment).toEqual(original);
  });

  it('produces identical results for identical inputs', () => {
    const conditions: EnvironmentalConditions = {
      temperature: 25,
      rainfall: 0.8,
      season: 'summer',
    };

    expect(
      updateEnvironment(initialEnvironment, conditions, config),
    ).toEqual(
      updateEnvironment(initialEnvironment, conditions, config),
    );
  });
});
