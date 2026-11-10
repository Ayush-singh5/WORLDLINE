import type {
  EnvironmentState,
  PlantState,
  SimulationConfig,
} from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const MAX_PLANT_HEALTH = 1;
const STRESS_THRESHOLD = 0.5;
const PLANT_STRESS_RATE = 0.02;
const PLANT_RECOVERY_RATE = 0.01;

/**
 * Calculates environmental stress and recovery for a plant.
 * Returns a new plant without mutating the original.
 */
export function calculatePlantStress(
  plant: PlantState,
  environment: EnvironmentState,
  config: SimulationConfig,
): PlantState {
  const waterFactor = clamp(environment.water / 500, 0, 1);
  const nutrientFactor = clamp(environment.nutrients / 500, 0, 1);

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

  const environmentalSuitability =
    waterFactor * nutrientFactor * temperatureFactor;

  let healthChange = 0;

  if (environmentalSuitability < STRESS_THRESHOLD) {
    const stressSeverity =
      STRESS_THRESHOLD - environmentalSuitability;

    healthChange = -stressSeverity * PLANT_STRESS_RATE;
  } else if (environmentalSuitability > STRESS_THRESHOLD) {
    const recoveryOpportunity =
      environmentalSuitability - STRESS_THRESHOLD;

    healthChange = recoveryOpportunity * PLANT_RECOVERY_RATE;
  }

  return {
    ...plant,
    health: clamp(
      plant.health + healthChange,
      0,
      MAX_PLANT_HEALTH,
    ),
  };
}