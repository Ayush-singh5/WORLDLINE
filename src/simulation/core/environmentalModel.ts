
import type { SimulationConfig } from './types';
import type { EnvironmentalEvent } from './environmentalEvents';

export interface EnvironmentalConditions {
  temperature: number;
  rainfall: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

/**
 * Calculates deterministic seasonal conditions for a simulation tick.
 * The cycle repeats every four seasons.
 */
export function calculateEnvironmentalConditions(
  tick: number,
  config: SimulationConfig,
): EnvironmentalConditions {
  const seasonProgress =
    (tick % (config.seasonLengthTicks * 4)) /
    config.seasonLengthTicks;

  const seasonIndex = Math.floor(seasonProgress);
  const progressWithinSeason =
    seasonProgress - seasonIndex;

  const seasons = [
    'spring',
    'summer',
    'autumn',
    'winter',
  ] as const;

  const season = seasons[seasonIndex] ?? 'spring';

  // One complete sinusoidal cycle across four seasons.
  const annualPhase = (seasonProgress / 4) * 2 * Math.PI;

  const temperature =
    config.baseTemperature +
    config.temperatureVariation * Math.sin(annualPhase);

  // Rainfall peaks during spring and autumn.
  const rainfallPhase = annualPhase + Math.PI / 2;

  const rainfall = Math.max(
    0,
    config.baseRainfall +
      config.rainfallVariation * Math.sin(rainfallPhase),
  );

  return {
    temperature,
    rainfall,
    season,
  };
}

/**
 * Applies an active environmental event to seasonal conditions.
 * Returns a new object without mutating the original conditions.
 */
export function applyEnvironmentalEvent(
  conditions: EnvironmentalConditions,
  event: EnvironmentalEvent | null,
): EnvironmentalConditions {
  if (!event) {
    return { ...conditions };
  }

  switch (event.type) {
    case 'drought':
      return {
        ...conditions,
        rainfall: conditions.rainfall * (1 - 0.8 * event.intensity),
      };

    case 'heavy_rainfall':
      return {
        ...conditions,
        rainfall: conditions.rainfall * (1 + 2 * event.intensity),
      };

    case 'heatwave':
      return {
        ...conditions,
        temperature: conditions.temperature + 5 * event.intensity,
      };

    default:
      return { ...conditions };
  }
}