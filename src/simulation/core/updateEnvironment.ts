
import type {
  EnvironmentState,
  SimulationConfig,
} from './types';

import type {
  EnvironmentalConditions,
} from './environmentalModel';

const MAX_WATER = 1000;
const MAX_NUTRIENTS = 1000;

/**
 * Updates water and nutrient resources using current weather.
 * This function is deterministic and does not mutate the input.
 */
export function updateEnvironment(
  environment: EnvironmentState,
  conditions: EnvironmentalConditions,
  config: SimulationConfig,
): EnvironmentState {
  // Higher temperatures increase evaporation.
  const temperatureFactor = Math.max(
    0.1,
    1 + (conditions.temperature - config.baseTemperature) / 30,
  );

  const evaporation =
    config.evaporationRate * temperatureFactor;

  // Rainfall replenishes water; evaporation removes it.
  const water = Math.min(
    MAX_WATER,
    Math.max(0, environment.water + conditions.rainfall - evaporation),
  );

  // Nutrients regenerate gradually, with additional support from rainfall.
  const nutrientRegeneration =
    config.nutrientRegenerationRate *
    (0.5 + conditions.rainfall);

  const nutrients = Math.min(
    MAX_NUTRIENTS,
    Math.max(0, environment.nutrients + nutrientRegeneration),
  );

  return {
    ...environment,
    water,
    nutrients,
    temperature: conditions.temperature,
    rainfall: conditions.rainfall,
  };
}
