
import type { SimulationConfig, WorldState } from './types';
import { stepWorld } from './stepWorld';

/**
 * Advance a world by a specified number of logical ticks.
 * The input state is not modified by this function.
 */
export function advanceWorld(
  initialState: WorldState,
  config: SimulationConfig,
  ticks: number,
): WorldState {
  if (!Number.isSafeInteger(ticks) || ticks < 0) {
    throw new RangeError('ticks must be a non-negative safe integer.');
  }

  let currentState = initialState;

  for (let i = 0; i < ticks; i += 1) {
    currentState = stepWorld(currentState, config);
  }

  return currentState;
}
