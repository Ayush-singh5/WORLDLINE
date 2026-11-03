
import { stepWorld } from './stepWorld';
import { assertValidConfig } from '../validation/validateConfig';
import { TimelineHistory } from './timelineHistory';
import type { SimulationConfig, WorldState } from './types';

export class TimelineBranch {
  readonly id: string;
  readonly parentId: string | null;
  readonly forkTick: number;
  readonly config: SimulationConfig;

  private currentState: WorldState;
  private readonly history: TimelineHistory;

  constructor(
    id: string,
    parentId: string | null,
    forkTick: number,
    initialState: WorldState,
    config: SimulationConfig,
    checkpointInterval = 50,
  ) {
    if (!id.trim()) {
      throw new Error('Branch ID must not be empty.');
    }

    if (!Number.isSafeInteger(forkTick) || forkTick < 0) {
      throw new RangeError('forkTick must be a non-negative safe integer.');
    }

    if (initialState.tick !== forkTick) {
      throw new Error('Initial state tick must match forkTick.');
    }

    assertValidConfig(config);

    this.id = id;
    this.parentId = parentId;
    this.forkTick = forkTick;
    this.config = { ...config };
    this.currentState = structuredClone(initialState);
    this.history = new TimelineHistory(
      this.currentState,
      this.config,
      checkpointInterval,
    );
  }

  /** Return an independent copy of the branch's current state. */
  get state(): WorldState {
    return structuredClone(this.currentState);
  }

  /** Advance this branch without modifying its parent or sibling branches. */
  advance(ticks: number): WorldState {
    if (!Number.isSafeInteger(ticks) || ticks < 0) {
      throw new RangeError('ticks must be a non-negative safe integer.');
    }

    for (let i = 0; i < ticks; i += 1) {
      this.currentState = stepWorld(this.currentState, this.config);
      this.history.record(this.currentState);
    }

    return this.state;
  }

  /** Restore a tick that belongs to this branch's recorded history. */
  restoreAt(tick: number): WorldState {
    if (tick < this.forkTick || tick > this.currentState.tick) {
      throw new RangeError(
        'Requested tick must be within this branch history.',
      );
    }

    return this.history.restoreAt(tick);
  }

  /** Create an independent child branch from this branch's history. */
  fork(
    childId: string,
    tick: number,
    configOverrides: Partial<SimulationConfig> = {},
  ): TimelineBranch {
    if (tick < this.forkTick || tick > this.currentState.tick) {
      throw new RangeError(
        'Fork tick must be within this branch history.',
      );
    }

    const forkState = this.restoreAt(tick);
    const childConfig: SimulationConfig = {
      ...this.config,
      ...configOverrides,
    };

    return new TimelineBranch(
      childId,
      this.id,
      tick,
      forkState,
      childConfig,
    );
  }
}

/** Create the root timeline from an initial world state. */
export function createRootTimeline(
  id: string,
  initialState: WorldState,
  config: SimulationConfig,
  checkpointInterval = 50,
): TimelineBranch {
  return new TimelineBranch(
    id,
    null,
    initialState.tick,
    initialState,
    config,
    checkpointInterval,
  );
}
