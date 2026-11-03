export { createWorld } from './core/createWorld';
export { DEFAULT_SIMULATION_CONFIG } from './core/defaultConfig';
export type {
  AnimalState,
  EntityId,
  EnvironmentState,
  HerbivoreState,
  PlantState,
  PredatorState,
  SimulationConfig,
  Tick,
  ValidationIssue,
  ValidationResult,
  WorldMetrics,
  WorldState,
} from './core/types';
export { createSeededRandom } from './rng/seededRandom';
export type { SeededRandom } from './rng/seededRandom';
export { assertValidConfig, validateConfig } from './validation/validateConfig';
