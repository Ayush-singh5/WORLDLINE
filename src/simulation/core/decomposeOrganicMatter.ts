
import type { EnvironmentState, SimulationConfig } from './types';

const MAX_NUTRIENTS = 1000;

/**
 * Gradually decomposes accumulated organic matter
 * and returns a portion of it to the nutrient pool.
 */
export function decomposeOrganicMatter(
  environment: EnvironmentState,
  config: SimulationConfig,
): EnvironmentState {
  // Nothing to decompose.
  if (environment.organicMatter <= 0) {
    return { ...environment };
  }

  // Calculate the organic matter decomposed this tick.
  const decomposedAmount =
    environment.organicMatter * config.decompositionRate;

  // Calculate nutrients released through decomposition.
  const releasedNutrients =
    decomposedAmount * config.nutrientReturnRate;

  // Update the remaining organic matter.
  const organicMatter = Math.max(
    0,
    environment.organicMatter - decomposedAmount,
  );

  // Add released nutrients without exceeding the environment limit.
  const nutrients = Math.min(
    MAX_NUTRIENTS,
    environment.nutrients + releasedNutrients,
  );

  return {
    ...environment,
    organicMatter,
    nutrients,
  };
}
