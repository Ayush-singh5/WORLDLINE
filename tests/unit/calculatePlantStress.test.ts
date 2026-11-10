import { describe, expect, it } from 'vitest';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
import { calculatePlantStress } from '../../src/simulation/core/calculatePlantStress';
import type { EnvironmentState, PlantState } from '../../src/simulation/core/types';

describe('calculatePlantStress', () => {
  const plant: PlantState = {
    id: 1,
    x: 10,
    y: 10,
    biomass: 50,
    health: 1,
  };

  const idealEnvironment: EnvironmentState = {
    temperature: 20,
    rainfall: 0.5,
    water: 500,
    nutrients: 500,
    organicMatter: 0,
  };

  it('reduces plant health under drought conditions', () => {
    const environment = {
      ...idealEnvironment,
      water: 100,
    };

    const result = calculatePlantStress(
      plant,
      environment,
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(result.health).toBeLessThan(plant.health);
  });

  it('reduces plant health under unsuitable temperatures', () => {
    const environment = {
      ...idealEnvironment,
      temperature: 50,
    };

    const result = calculatePlantStress(
      plant,
      environment,
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(result.health).toBeLessThan(plant.health);
  });

  it('allows recovery under favourable conditions', () => {
    const weakenedPlant = {
      ...plant,
      health: 0.5,
    };

    const result = calculatePlantStress(
      weakenedPlant,
      idealEnvironment,
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(result.health).toBeGreaterThan(weakenedPlant.health);
  });

  it('does not allow health to exceed 1', () => {
    const healthyPlant = {
      ...plant,
      health: 1,
    };

    const result = calculatePlantStress(
      healthyPlant,
      idealEnvironment,
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(result.health).toBeLessThanOrEqual(1);
  });

  it('does not allow health to fall below zero', () => {
    const dyingPlant = {
      ...plant,
      health: 0.001,
    };

    const environment = {
      ...idealEnvironment,
      water: 0,
      nutrients: 0,
    };

    const result = calculatePlantStress(
      dyingPlant,
      environment,
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(result.health).toBeGreaterThanOrEqual(0);
  });

  it('does not mutate the original plant', () => {
    const originalPlant = { ...plant };

    calculatePlantStress(
      plant,
      { ...idealEnvironment, water: 100 },
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(plant).toEqual(originalPlant);
  });

  it('produces deterministic results', () => {
    const environment = {
      ...idealEnvironment,
      water: 150,
    };

    const first = calculatePlantStress(
      plant,
      environment,
      DEFAULT_SIMULATION_CONFIG,
    );

    const second = calculatePlantStress(
      plant,
      environment,
      DEFAULT_SIMULATION_CONFIG,
    );

    expect(first).toEqual(second);
  });
});