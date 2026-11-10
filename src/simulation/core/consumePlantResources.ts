
import type {
  EnvironmentState,
  SimulationConfig,
} from './types';

export interface PlantResourceConsumption {
  environment: EnvironmentState;
  waterConsumed: number;
  nutrientsConsumed: number;
}

/**
 * Deducts shared environmental resources based on actual plant biomass gained.
 * Does not mutate the original environment.
 */
export function consumePlantResources(
  environment: EnvironmentState,
  biomassGained: number,
  config: SimulationConfig,
): PlantResourceConsumption {
  const safeBiomassGained = Math.max(0, biomassGained);

  const waterConsumed =
    safeBiomassGained * config.plantWaterConsumptionRate;

  const nutrientsConsumed =
    safeBiomassGained * config.plantNutrientConsumptionRate;

  const actualWaterConsumed = Math.min(
    environment.water,
    waterConsumed,
  );

  const actualNutrientsConsumed = Math.min(
    environment.nutrients,
    nutrientsConsumed,
  );

  return {
    environment: {
      ...environment,
      water: Math.max(0, environment.water - actualWaterConsumed),
      nutrients: Math.max(0, environment.nutrients - actualNutrientsConsumed),
    },
    waterConsumed: actualWaterConsumed,
    nutrientsConsumed: actualNutrientsConsumed,
  };
}
