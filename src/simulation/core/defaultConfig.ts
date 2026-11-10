import type { SimulationConfig } from './types';

/** Initial tuning defaults; ecological balance is not yet calibrated. */
export const DEFAULT_SIMULATION_CONFIG: Readonly<SimulationConfig> = {
  seed: 42,
  width: 100,
  height: 100,
  tickDurationSeconds: 0.1,
  initialPlants: 600,
  initialHerbivores: 100,
  initialPredators: 20,
  maxPopulation: 2_000,
  maxPlantBiomass: 100,
  plantGrowthRate: 0.5,
  herbivoreStarvationRate: 0.2,
  herbivoreMetabolism: 0.1,
  predatorMetabolism: 0.15,
  predatorStarvationRate: 0.3,
  reproductionThreshold: 20,
  predatorReproductionThreshold: 50,
    // Environmental simulation
  seasonLengthTicks: 500,
  baseTemperature: 20,
  temperatureVariation: 10,
  baseRainfall: 0.5,
  rainfallVariation: 0.35,
  evaporationRate: 0.01,
  nutrientRegenerationRate: 0.005,
    // Plant resource consumption
  plantWaterConsumptionRate: 0.001,
  plantNutrientConsumptionRate: 0.0001,
  // Decomposition and nutrient recycling
  decompositionRate: 0.01,
  nutrientReturnRate: 0.7,
};
