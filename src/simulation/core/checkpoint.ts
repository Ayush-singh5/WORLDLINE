
import type { WorldState } from './types';
import { hashWorldState } from './hashWorldState';

export interface WorldCheckpoint {
  /** Tick at which this checkpoint was captured. */
  tick: number;
  /** Independent copy of the complete simulation state. */
  state: WorldState;
  /** Diagnostic fingerprint for detecting accidental changes. */
  hash: string;
}

/** Capture an independent snapshot of the current world. */
export function createCheckpoint(state: WorldState): WorldCheckpoint {
  const copy = structuredClone(state);

  return {
    tick: copy.tick,
    state: copy,
    hash: hashWorldState(copy),
  };
}

/** Restore a fresh world state from a checkpoint. */
export function restoreCheckpoint(
  checkpoint: WorldCheckpoint,
): WorldState {
  if (checkpoint.tick !== checkpoint.state.tick) {
    throw new Error('Checkpoint tick does not match its saved state.');
  }

  if (checkpoint.hash !== hashWorldState(checkpoint.state)) {
    throw new Error('Checkpoint integrity check failed.');
  }

  return structuredClone(checkpoint.state);
}
