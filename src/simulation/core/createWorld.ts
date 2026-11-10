import { createSeededRandom } from '../rng/seededRandom';
import { assertValidConfig } from '../validation/validateConfig';
import type {
  AnimalState,
  EnvironmentState,
  HerbivoreState,
  PlantState,
  PredatorState,
  SimulationConfig,
  WorldMetrics,
  WorldState,
} from './types';

function createAnimal(id: number, random: ReturnType<typeof createSeededRandom>): AnimalState {
  return {
    id,
    x: 0,
    y: 0,
    vx: random.range(-1, 1),
    vy: random.range(-1, 1),
    energy: random.range(20, 40),
    ageTicks: 0,
    reproductionCooldown: 0,
  };
}

function placeEntity<T extends { x: number; y: number }>(
  entity: T,
  width: number,
  height: number,
  random: ReturnType<typeof createSeededRandom>,
): T {
  return {
    ...entity,
    x: random.range(0, width),
    y: random.range(0, height),
  };
}

/** Create a deterministic initial state without browser or rendering dependencies. */
export function createWorld(config: SimulationConfig): WorldState {
  assertValidConfig(config);
  const random = createSeededRandom(config.seed);
  let nextEntityId = 1;

  const plants: PlantState[] = Array.from({ length: config.initialPlants }, () => {
    const plant: PlantState = {
      id: nextEntityId++,
      x: 0,
      y: 0,
      biomass: random.range(config.maxPlantBiomass * 0.5, config.maxPlantBiomass),
      health: random.range(0.75, 1),
    };
    return placeEntity(plant, config.width, config.height, random);
  });

  const herbivores: HerbivoreState[] = Array.from(
    { length: config.initialHerbivores },
    () => {
      const animal = createAnimal(nextEntityId++, random);
      return placeEntity(animal, config.width, config.height, random);
    },
  );

  const predators: PredatorState[] = Array.from(
    { length: config.initialPredators },
    () => {
      const animal = createAnimal(nextEntityId++, random);
      return placeEntity(animal, config.width, config.height, random);
    },
  );

  const environment: EnvironmentState = {
    temperature: 20,
    rainfall: 0.5,
    water: 500,
    nutrients: 500,
    organicMatter: 0,
  };

  const metrics: WorldMetrics = {
    plantBiomass: plants.reduce((total, plant) => total + plant.biomass, 0),
    herbivoreCount: herbivores.length,
    predatorCount: predators.length,
    availableResources: environment.water + environment.nutrients,
  };

  return {
    tick: 0,
    nextEntityId,
    rngState: random.getState(),
    environment,
    plants,
    herbivores,
    predators,
    metrics,
  };
}
