
import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/simulation/core/createWorld';
import { advanceWorld } from '../../src/simulation/core/advanceWorld';
import { hashWorldState } from '../../src/simulation/core/hashWorldState';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';

describe('hashWorldState', () => {
  it('returns the same hash for identical initial states', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG, seed: 42 };

    const first = createWorld(config);
    const second = createWorld(config);

    expect(hashWorldState(first)).toBe(hashWorldState(second));
  });

  it('returns the same hash for identical simulation histories', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG, seed: 42 };

    const first = advanceWorld(createWorld(config), config, 20);
    const second = advanceWorld(createWorld(config), config, 20);

    expect(hashWorldState(first)).toBe(hashWorldState(second));
  });

  it('detects a changed tick', () => {
    const world = createWorld(DEFAULT_SIMULATION_CONFIG);
    const changedWorld = { ...world, tick: world.tick + 1 };

    expect(hashWorldState(world)).not.toBe(hashWorldState(changedWorld));
  });

  it('does not modify the world being hashed', () => {
    const world = createWorld(DEFAULT_SIMULATION_CONFIG);
    const original = structuredClone(world);

    hashWorldState(world);

    expect(world).toEqual(original);
  });
});
