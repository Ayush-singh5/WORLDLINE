import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/simulation/core/createWorld';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
import type { SimulationConfig } from '../../src/simulation/core/types';

function config(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
  return { ...DEFAULT_SIMULATION_CONFIG, ...overrides };
}

describe('createWorld', () => {
  it('creates identical states for the same seed and configuration', () => {
    const first = createWorld(config({ seed: 2026 }));
    const second = createWorld(config({ seed: 2026 }));
    expect(first).toEqual(second);
  });

  it('normally creates different initial states for different seeds', () => {
    const first = createWorld(config({ seed: 11 }));
    const second = createWorld(config({ seed: 12 }));
    expect(first).not.toEqual(second);
  });

  it('allocates unique ascending IDs across all entity types', () => {
    const world = createWorld(config({ initialPlants: 5, initialHerbivores: 3, initialPredators: 2 }));
    const ids = [...world.plants, ...world.herbivores, ...world.predators].map((entity) => entity.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(Array.from({ length: 10 }, (_, index) => index + 1));
    expect(world.nextEntityId).toBe(11);
  });

  it('initializes metrics from the authoritative entity and environment state', () => {
    const world = createWorld(config({ initialPlants: 4, initialHerbivores: 2, initialPredators: 1 }));
    expect(world.metrics.plantBiomass).toBe(
      world.plants.reduce((sum, plant) => sum + plant.biomass, 0),
    );
    expect(world.metrics.herbivoreCount).toBe(2);
    expect(world.metrics.predatorCount).toBe(1);
    expect(world.metrics.availableResources).toBe(
      world.environment.water + world.environment.nutrients,
    );
  });

  it('places entities within the configured world bounds', () => {
    const world = createWorld(config({ width: 12, height: 9 }));
    for (const entity of [...world.plants, ...world.herbivores, ...world.predators]) {
      expect(entity.x).toBeGreaterThanOrEqual(0);
      expect(entity.x).toBeLessThan(12);
      expect(entity.y).toBeGreaterThanOrEqual(0);
      expect(entity.y).toBeLessThan(9);
    }
  });

  it('stores the PRNG state required to continue the same random sequence', () => {
    const world = createWorld(config({ seed: 55 }));
    expect(Number.isInteger(world.rngState)).toBe(true);
    expect(world.rngState).toBeGreaterThanOrEqual(0);
    expect(world.rngState).toBeLessThanOrEqual(0xffff_ffff);
  });

  it('rejects invalid configurations before initialization', () => {
    expect(() => createWorld(config({ initialPlants: -1 }))).toThrow(/Invalid simulation configuration/);
  });
});
