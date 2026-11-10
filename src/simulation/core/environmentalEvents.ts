import type { SimulationConfig } from './types';

export type EnvironmentalEventType =
  | 'drought'
  | 'heavy_rainfall'
  | 'heatwave';

export interface EnvironmentalEvent {
  type: EnvironmentalEventType;
  startTick: number;
  endTick: number;
  intensity: number;
}

/**
 * Produces a deterministic number between 0 and 1.
 * Does not modify the simulation's random-number generator.
 */
function deterministicValue(
  seed: number,
  cycle: number,
  salt: number,
): number {
  let value =
    (seed ^ Math.imul(cycle + 1, 0x9e3779b1) ^ salt) >>> 0;

  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  value = Math.imul(value, 0xc2b2ae35);
  value ^= value >>> 16;

  return (value >>> 0) / 4294967296;
}

const EVENT_TYPES: EnvironmentalEventType[] = [
  'drought',
  'heavy_rainfall',
  'heatwave',
];

/**
 * Returns the environmental event active at a given tick.
 * Each season has a deterministic chance of one event.
 */
export function getEnvironmentalEvent(
  tick: number,
  config: SimulationConfig,
): EnvironmentalEvent | null {
  if (
    !Number.isSafeInteger(tick) ||
    tick < 0 ||
    config.seasonLengthTicks <= 0
  ) {
    return null;
  }

  const cycle = Math.floor(tick / config.seasonLengthTicks);

  // An event occurs in approximately 35% of seasonal cycles.
  const eventChance = deterministicValue(config.seed, cycle, 101);

  if (eventChance >= 0.35) {
    return null;
  }

  const seasonStart = cycle * config.seasonLengthTicks;

  // Events begin during the first 80% of a season.
  const startOffset = Math.floor(
    deterministicValue(config.seed, cycle, 202) *
      config.seasonLengthTicks *
      0.8,
  );

  const startTick = seasonStart + startOffset;

  // Event duration is between 10% and 20% of a season.
  const durationFactor = deterministicValue(config.seed, cycle, 303);

  const duration = Math.max(
    1,
    Math.floor(config.seasonLengthTicks * (0.1 + durationFactor * 0.1)),
  );

  const endTick = startTick + duration;

  if (tick < startTick || tick >= endTick) {
    return null;
  }

  const typeIndex = Math.floor(
    deterministicValue(config.seed, cycle, 404) * EVENT_TYPES.length,
  );

  const intensity =
    0.5 + deterministicValue(config.seed, cycle, 505) * 0.5;

  return {
    type: EVENT_TYPES[typeIndex]!,
    startTick,
    endTick,
    intensity,
  };
}