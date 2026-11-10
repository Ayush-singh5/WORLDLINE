
import { describe, expect, it } from 'vitest';

import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
import { calculatePlantGrowth } from '../../src/simulation/core/calculatePlantGrowth';

import type {
  EnvironmentState,
  PlantState,
} from '../../src/simulation/core/types';

describe('calculatePlantGrowth', () => {
  const config = DEFAULT_SIMULATION_CONFIG;

  const plant: PlantState = {
    id: 1,
    x: 50,
    y: 50,
    biomass: 20,
    health: 1,
  };

  const environment: EnvironmentState = {
    temperature: 20,
    rainfall: 0.5,
    water: 500,
    nutrients: 500,
    organicMatter: 0,
  };

  it('preserves normal growth under ideal conditions', () => {
    const result = calculatePlantGrowth(plant, environment, config);

    expect(result.biomass).toBeCloseTo(
      plant.biomass + config.plantGrowthRate,
    );
  });

  it('reduces growth when water is scarce', () => {
    const dryEnvironment = {
      ...environment,
      water: 100,
    };

    const result = calculatePlantGrowth(
      plant,
      dryEnvironment,
      config,
    );

    expect(result.biomass).toBeLessThan(
      calculatePlantGrowth(plant, environment, config).biomass,
    );
  });

  it('reduces growth when nutrients are scarce', () => {
    const poorSoil = {
      ...environment,
      nutrients: 100,
    };

    const result = calculatePlantGrowth(plant, poorSoil, config);

    expect(result.biomass).toBeLessThan(
      calculatePlantGrowth(plant, environment, config).biomass,
    );
  });

  it('reduces growth at unsuitable temperatures', () => {
    const hotEnvironment = {
      ...environment,
      temperature: 40,
    };

    const result = calculatePlantGrowth(
      plant,
      hotEnvironment,
      config,
    );

    expect(result.biomass).toBeLessThan(
      calculatePlantGrowth(plant, environment, config).biomass,
    );
  });

  it('does not exceed maximum plant biomass', () => {
    const maturePlant = {
      ...plant,
      biomass: config.maxPlantBiomass - 0.1,
    };

    const result = calculatePlantGrowth(
      maturePlant,
      environment,
      config,
    );

    expect(result.biomass).toBe(config.maxPlantBiomass);
  });

  it('does not mutate the original plant', () => {
    const original = { ...plant };

    calculatePlantGrowth(plant, environment, config);

    expect(plant).toEqual(original);
  });

  it('produces identical results for identical inputs', () => {
    expect(
      calculatePlantGrowth(plant, environment, config),
    ).toEqual(
      calculatePlantGrowth(plant, environment, config),
    );
  });
});
