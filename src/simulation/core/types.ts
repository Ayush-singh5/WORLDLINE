export type Tick = number;
export type EntityId = number;

export interface SimulationConfig {
  /** Unsigned 32-bit seed. Zero is a valid seed. */
  seed: number;
  width: number;
  height: number;
  tickDurationSeconds: number;
  initialPlants: number;
  initialHerbivores: number;
  initialPredators: number;
  /** Maximum combined count across all three entity types. */
  maxPopulation: number;
  maxPlantBiomass: number;
  plantGrowthRate: number;
  herbivoreStarvationRate: number;
  herbivoreMetabolism: number;
  predatorMetabolism: number;
  predatorStarvationRate: number;
  predatorReproductionThreshold: number;
  reproductionThreshold: number;
}

export interface EnvironmentState {
  temperature: number;
  rainfall: number;
  water: number;
  nutrients: number;
}

export interface PlantState {
  id: EntityId;
  x: number;
  y: number;
  biomass: number;
  health: number;
}

export interface AnimalState {
  id: EntityId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  ageTicks: number;
  reproductionCooldown: number;
}

export type HerbivoreState = AnimalState;
export type PredatorState = AnimalState;

export interface WorldMetrics {
  plantBiomass: number;
  herbivoreCount: number;
  predatorCount: number;
  availableResources: number;

}

/** All data required to resume logical simulation belongs in this state. */
export interface WorldState {
  tick: Tick;
  nextEntityId: EntityId;
  /** Exact serializable state of the PRNG at the next random draw. */
  rngState: number;
  environment: EnvironmentState;
  plants: PlantState[];
  herbivores: HerbivoreState[];
  predators: PredatorState[];
  metrics: WorldMetrics;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
