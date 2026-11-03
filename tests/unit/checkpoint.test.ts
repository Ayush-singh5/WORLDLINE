
import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/simulation/core/createWorld';
import { advanceWorld } from '../../src/simulation/core/advanceWorld';
import { hashWorldState } from '../../src/simulation/core/hashWorldState';
import {
  createCheckpoint,
  restoreCheckpoint,
} from '../../src/simulation/core/checkpoint';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';

describe('WORLDLINE checkpoints', () => {
  it('restores the exact saved state', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG, seed: 42 };
    const world = advanceWorld(createWorld(config), config, 30);
    const checkpoint = createCheckpoint(world);

    expect(restoreCheckpoint(checkpoint)).toEqual(world);
  });

  it('restores a state that produces the same future', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG, seed: 42 };
    const world = advanceWorld(createWorld(config), config, 30);
    const restored = restoreCheckpoint(createCheckpoint(world));

    const expected = advanceWorld(world, config, 20);
    const actual = advanceWorld(restored, config, 20);

    expect(hashWorldState(actual)).toBe(hashWorldState(expected));
  });

  it('does not let later changes to the world change the checkpoint', () => {
    const world = createWorld(DEFAULT_SIMULATION_CONFIG);
    const checkpoint = createCheckpoint(world);

    world.tick = 999;

    expect(checkpoint.tick).toBe(0);
    expect(restoreCheckpoint(checkpoint).tick).toBe(0);
  });

 it('rejects a checkpoint whose saved state was modified', () => {
  const world = createWorld(DEFAULT_SIMULATION_CONFIG);
  const checkpoint = createCheckpoint(world);

  checkpoint.state.environment.water += 1;

  expect(() => restoreCheckpoint(checkpoint)).toThrow(
    'Checkpoint integrity check failed.',
  );
});
});
