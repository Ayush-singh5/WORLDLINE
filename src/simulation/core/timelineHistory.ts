
import type { SimulationConfig, WorldMetrics, WorldState } from './types';

import { advanceWorld } from './advanceWorld';
import {
  createCheckpoint,
  restoreCheckpoint,
  type WorldCheckpoint,
} from './checkpoint';

export class TimelineHistory {
  private readonly checkpoints: WorldCheckpoint[] = [];
  private readonly metricsHistory = new Map<number, WorldMetrics>();

  constructor(
    initialState: WorldState,
    private readonly config: SimulationConfig,
    private readonly checkpointInterval = 50,
  ) {
    if (!Number.isSafeInteger(checkpointInterval) || checkpointInterval < 1) {
      throw new RangeError('checkpointInterval must be a positive integer.');
    }

    this.checkpoints.push(createCheckpoint(initialState));
    this.metricsHistory.set(initialState.tick, { ...initialState.metrics });
  }

  /** Save periodic checkpoints as the simulation progresses. */
  record(state: WorldState): void {
    const latest = this.checkpoints[this.checkpoints.length - 1];
    this.metricsHistory.set(state.tick, { ...state.metrics });

    if (!latest) {
      throw new Error('Timeline has no initial checkpoint.');
    }

    if (state.tick < latest.tick) {
      throw new Error('Cannot record a state older than the latest checkpoint.');
    }

    if (state.tick === latest.tick) {
      if (state.tick === 0) {
        return;
      }

      // A checkpoint at this tick may only be recorded once.
      if (latest.hash !== createCheckpoint(state).hash) {
        throw new Error('Conflicting states recorded at the same tick.');
      }

      return;
    }

    if (state.tick % this.checkpointInterval === 0) {
      this.checkpoints.push(createCheckpoint(state));
    }
  }

  /** Restore a requested tick from its nearest earlier checkpoint. */
  restoreAt(tick: number): WorldState {
    if (!Number.isSafeInteger(tick) || tick < 0) {
      throw new RangeError('tick must be a non-negative safe integer.');
    }

    let nearest: WorldCheckpoint | undefined;

    for (const checkpoint of this.checkpoints) {
      if (checkpoint.tick <= tick && (!nearest || checkpoint.tick > nearest.tick)) {
        nearest = checkpoint;
      }
    }

    if (!nearest) {
      throw new Error('No checkpoint exists at or before the requested tick.');
    }

    const restored = restoreCheckpoint(nearest);
    return advanceWorld(restored, this.config, tick - restored.tick);
  }

  /** Return the ticks currently stored as checkpoints. */
  getCheckpointTicks(): number[] {
    return this.checkpoints.map((checkpoint) => checkpoint.tick);
  }

  /** Retrieve recorded metrics without reconstructing the world. */
  getMetricsAt(tick: number): WorldMetrics | undefined {
    const metrics = this.metricsHistory.get(tick);

    return metrics ? { ...metrics } : undefined;
  }
}
