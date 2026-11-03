
import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/simulation/core/createWorld';
import { advanceWorld } from '../../src/simulation/core/advanceWorld';
import { hashWorldState } from '../../src/simulation/core/hashWorldState';
import { TimelineHistory } from '../../src/simulation/core/timelineHistory';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';

describe('TimelineHistory', () => {
  it('stores periodic checkpoints', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      initialPlants: 20,
      initialHerbivores: 5,
      initialPredators: 2,
    };

    let world = createWorld(config);
    const history = new TimelineHistory(world, config, 10);

    for (let i = 1; i <= 30; i += 1) {
      world = advanceWorld(world, config, 1);
      history.record(world);
    }

    expect(history.getCheckpointTicks()).toEqual([0, 10, 20, 30]);
  });

  it('restores the exact state at a requested tick', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      initialPlants: 20,
      initialHerbivores: 5,
      initialPredators: 2,
    };

    const initial = createWorld(config);
    const history = new TimelineHistory(initial, config, 10);
    const expected = advanceWorld(initial, config, 23);

    let recordedWorld = initial;

    for (let i = 1; i <= 30; i += 1) {
      recordedWorld = advanceWorld(recordedWorld, config, 1);
      history.record(recordedWorld);
    }

    const restored = history.restoreAt(23);

    expect(hashWorldState(restored)).toBe(hashWorldState(expected));
  });

  it('rejects negative or fractional target ticks', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG };
    const history = new TimelineHistory(createWorld(config), config);

    expect(() => history.restoreAt(-1)).toThrow(RangeError);
    expect(() => history.restoreAt(2.5)).toThrow(RangeError);
  });

  it('does not modify saved checkpoints when restoring', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG };
    const initial = createWorld(config);
    const history = new TimelineHistory(initial, config, 10);

    const recorded = advanceWorld(initial, config, 10);
    history.record(recorded);

    const before = history.getCheckpointTicks();
    history.restoreAt(7);

    expect(history.getCheckpointTicks()).toEqual(before);
  });
});
