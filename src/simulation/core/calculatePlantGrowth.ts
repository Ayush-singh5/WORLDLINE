
import type {
  EnvironmentState,
  PlantState,
  SimulationConfig,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculates plant growth using shared ecosystem conditions.
 * Every plant experiences the same environmental resource factors.
 */
export function calculatePlantGrowth(
  plant: PlantState,
  environment: EnvironmentState,
  config: SimulationConfig,
): PlantState {
  // Water and nutrients are shared across the ecosystem.
  // 500 represents the initial resource baseline.
  const waterFactor = clamp(environment.water / 500, 0, 1);
  const nutrientFactor = clamp(environment.nutrients / 500, 0, 1);

  // Plants grow best around the configured base temperature.
  const temperatureTolerance = Math.max(
    1,
    config.temperatureVariation * 2,
  );

  const temperatureDifference = Math.abs(
    environment.temperature - config.baseTemperature,
  );

  const temperatureFactor = clamp(
    1 - temperatureDifference / temperatureTolerance,
    0,
    1,
  );

  const environmentalFactor =
    waterFactor * nutrientFactor * temperatureFactor;

  const growth = 
    config.plantGrowthRate *
    plant.health *
    environmentalFactor;

  return {
    ...plant,
    biomass: Math.min(
      config.maxPlantBiomass,
      plant.biomass + growth,
    ),
  };
}
