
import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/simulation/core/createWorld';
import {
  createRootTimeline,
} from '../../src/simulation/core/timelineBranch';
import { hashWorldState } from '../../src/simulation/core/hashWorldState';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';

describe('WORLDLINE timeline branches', () => {
  function setup() {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      initialPlants: 20,
      initialHerbivores: 5,
      initialPredators: 2,
    };

    const root = createRootTimeline('baseline', createWorld(config), config, 5);
    root.advance(20);

    return { root, config };
  }

  it('creates a child from the exact requested historical tick', () => {
    const { root } = setup();
    const expected = root.restoreAt(10);
    const child = root.fork('experiment-a', 10);

    expect(child.parentId).toBe('baseline');
    expect(child.forkTick).toBe(10);
    expect(hashWorldState(child.state)).toBe(hashWorldState(expected));
  });

  it('allows a branch to use different simulation settings', () => {
    const { root, config } = setup();
    const child = root.fork('high-growth', 10, {
      plantGrowthRate: config.plantGrowthRate + 1,
    });

    expect(child.config.plantGrowthRate).toBe(
      config.plantGrowthRate + 1,
    );
    expect(root.config.plantGrowthRate).toBe(config.plantGrowthRate);
  });

  it('advances a child independently of its parent', () => {
    const { root } = setup();
    const parentBefore = hashWorldState(root.state);
    const child = root.fork('experiment-b', 10);

    child.advance(5);

    expect(root.state.tick).toBe(20);
    expect(hashWorldState(root.state)).toBe(parentBefore);
    expect(child.state.tick).toBe(15);
  });

  it('replays the same branch history deterministically', () => {
    const { root } = setup();
    const first = root.fork('experiment-c1', 10);
    const second = root.fork('experiment-c2', 10);

    first.advance(8);
    second.advance(8);

    expect(hashWorldState(first.state)).toBe(hashWorldState(second.state));
  });

  it('rejects a fork outside the recorded history', () => {
    const { root } = setup();

    expect(() => root.fork('invalid', 21)).toThrow(RangeError);
  });
});
