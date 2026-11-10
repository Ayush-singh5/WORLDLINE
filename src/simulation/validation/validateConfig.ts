import type { SimulationConfig, ValidationIssue, ValidationResult } from '../core/types';

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}


export function validateConfig(config: SimulationConfig): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });

  if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed > 0xffff_ffff) {
    add('seed', 'Must be an unsigned 32-bit integer.');
  }

  for (const key of ['width', 'height', 'tickDurationSeconds'] as const) {
    if (!isFiniteNumber(config[key]) || config[key] <= 0) {
      add(key, 'Must be a finite number greater than zero.');
    }
  }

  if (
    !Number.isSafeInteger(config.seasonLengthTicks) ||
    config.seasonLengthTicks <= 0
  ) {
    add('seasonLengthTicks', 'Must be a positive safe integer.');
  }

  for (const key of [
    'initialPlants',
    'initialHerbivores',
    'initialPredators',
    'maxPopulation',
  ] as const) {
    if (!Number.isSafeInteger(config[key]) || config[key] < 0) {
      add(key, 'Must be a non-negative safe integer.');
    }
  }

  for (const key of [
    'maxPlantBiomass',
    'reproductionThreshold',
    'predatorReproductionThreshold',
  ] as const) {
    if (!Number.isFinite(config[key]) || config[key] <= 0) {
      add(key, 'Must be a finite number greater than zero.');
    }
  }

  for (const key of [
    'plantGrowthRate',
    'herbivoreStarvationRate',
    'herbivoreMetabolism',
    'predatorMetabolism',
    'predatorStarvationRate',
    'temperatureVariation',
    'baseRainfall',
    'rainfallVariation',
    'evaporationRate',
    'nutrientRegenerationRate',
    'plantWaterConsumptionRate',
    'plantNutrientConsumptionRate',
  ] as const) {
    if (!Number.isFinite(config[key]) || config[key] < 0) {
      add(key, 'Must be a finite, non-negative number.');
    }
  }

  // Decomposition and nutrient recycling rates must be between 0 and 1.
  for (const key of ['decompositionRate', 'nutrientReturnRate'] as const) {
    if (!Number.isFinite(config[key]) || config[key] < 0 || config[key] > 1) {
      add(key, 'Must be a finite number between 0 and 1.');
    }
  }

  if (!Number.isFinite(config.baseTemperature)) {
    add('baseTemperature', 'Must be a finite number.');
  }

  const initialTotal =
    config.initialPlants + config.initialHerbivores + config.initialPredators;

  if (!Number.isSafeInteger(initialTotal)) {
    add('initialPopulation', 'Combined initial population must be a safe integer.');
  } else if (initialTotal > config.maxPopulation) {
    add('maxPopulation', 'Must be at least the total initial population.');
  }

  return { valid: issues.length === 0, issues };
}


export function assertValidConfig(config: SimulationConfig): void {
  const result = validateConfig(config);
  if (!result.valid) {
    const details = result.issues
      .map(({ path, message }) => `${path}: ${message}`)
      .join('\n');
    throw new Error(`Invalid simulation configuration:\n${details}`);
  }
}
