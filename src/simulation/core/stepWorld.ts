
import { createSeededRandom } from '../rng/seededRandom';
import type {
  AnimalState,
  PlantState,
  SimulationConfig,
  WorldState,
} from './types';

import {
  createSpatialGrid,
  querySpatialGrid,
} from './spatialGrid';

const HERBIVORE_FEED_RADIUS = 3;
const PREDATOR_HUNT_RADIUS = 2;
const REPRODUCTION_COOLDOWN = 50;
const MAX_AGE_TICKS = 10_000;
const EPSILON = 1e-9;

function distanceSquared(
  a: { x: number; y: number },
  b: { x: number; y: number },
  width: number,
  height: number,
): number {
  const dx = shortestWrappedDelta(a.x, b.x, width);
  const dy = shortestWrappedDelta(a.y, b.y, height);

  return dx * dx + dy * dy;
}


function shortestWrappedDelta(
  from: number,
  to: number,
  size: number,
): number {
  const delta = to - from;

  if (delta > size / 2) return delta - size;
  if (delta < -size / 2) return delta + size;

  return delta;
}


function moveAnimal(
  animal: AnimalState,
  config: SimulationConfig,
  random: ReturnType<typeof createSeededRandom>,
): AnimalState {
  // Small deterministic changes in direction create wandering movement.
  const vx = animal.vx + random.range(-0.2, 0.2);
  const vy = animal.vy + random.range(-0.2, 0.2);
  const magnitude = Math.hypot(vx, vy) || 1;

  return {
    ...animal,
    vx: vx / magnitude,
    vy: vy / magnitude,
    x: (animal.x + (vx / magnitude) + config.width) % config.width,
    y: (animal.y + (vy / magnitude) + config.height) % config.height,
    ageTicks: animal.ageTicks + 1,
    reproductionCooldown: Math.max(0, animal.reproductionCooldown - 1),
  };
}


function moveHerbivore(
  animal: AnimalState,
  plants: PlantState[],
  config: SimulationConfig,
  random: ReturnType<typeof createSeededRandom>,
  plantGrid: ReturnType<typeof createSpatialGrid>,
): AnimalState {
  const FOOD_DETECTION_RADIUS = 12;
  let targetPlant: PlantState | undefined;
  let nearestDistance = FOOD_DETECTION_RADIUS ** 2;

  // Search nearby grid cells instead of scanning every plant.
  const nearbyPlantIndexes = querySpatialGrid(
    plantGrid,
    animal.x,
    animal.y,
    FOOD_DETECTION_RADIUS,
  );

  for (const index of nearbyPlantIndexes) {
    const plant = plants[index];

    if (!plant || plant.biomass <= EPSILON) {
      continue;
    }

    const distance = distanceSquared(animal, plant, config.width, config.height);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      targetPlant = plant;
    }
  }

  // If food is nearby, steer gently toward it.
  if (targetPlant) {
    const dx = shortestWrappedDelta(animal.x, targetPlant.x, config.width);
    const dy = shortestWrappedDelta(animal.y, targetPlant.y, config.height);
    const distance = Math.hypot(dx, dy) || 1;

    const vx = animal.vx * 0.6 + (dx / distance) * 0.4;
    const vy = animal.vy * 0.6 + (dy / distance) * 0.4;
    const magnitude = Math.hypot(vx, vy) || 1;

    return {
      ...animal,
      vx: vx / magnitude,
      vy: vy / magnitude,
      x: (animal.x + vx / magnitude + config.width) % config.width,
      y: (animal.y + vy / magnitude + config.height) % config.height,
      ageTicks: animal.ageTicks + 1,
      reproductionCooldown: Math.max(0, animal.reproductionCooldown - 1),
    };
  }

  // No food nearby: continue normal wandering.
  return moveAnimal(animal, config, random);
}


function reproduce(
  parent: AnimalState,
  nextEntityId: number,
  random: ReturnType<typeof createSeededRandom>,
): AnimalState {
  return {
    id: nextEntityId,
    x: parent.x,
    y: parent.y,
    vx: random.range(-1, 1),
    vy: random.range(-1, 1),
    energy: parent.energy / 2,
    ageTicks: 0,
    reproductionCooldown: REPRODUCTION_COOLDOWN,
  };
}

/** Advance a world by exactly one deterministic logical tick. */
export function stepWorld(
  state: WorldState,
  config: SimulationConfig,
): WorldState {
  const random = createSeededRandom(state.rngState);
  let nextEntityId = state.nextEntityId;

  const plants: PlantState[] = state.plants.map((plant) => ({
    ...plant,
    biomass: Math.min(
      config.maxPlantBiomass,
      plant.biomass + config.plantGrowthRate * plant.health,
    ),
  }));

  
  const plantGrid = createSpatialGrid(plants, config.width, config.height, 12);



  const herbivores = state.herbivores.map((animal) =>
    moveHerbivore(animal, plants, config, random, plantGrid),
  );

  const predators = state.predators.map((animal) =>
    moveAnimal(animal, config, random),
  );

  const survivingHerbivores: typeof herbivores = [];
  const survivingPredators: typeof predators = [];
  const newHerbivores: typeof herbivores = [];
  const newPredators: typeof predators = [];

  const consumedHerbivores = new Set<number>();
  const predatorsThatHunted = new Set<number>();

  // Predators hunt the nearest living herbivore within range.
  for (const predator of predators) {
    if (predator.energy <= 0 || predator.ageTicks >= MAX_AGE_TICKS) {
      continue;
    }

    let nearestIndex = -1;
    let nearestDistance = PREDATOR_HUNT_RADIUS ** 2;

    for (let i = 0; i < herbivores.length; i += 1) {
        const prey = herbivores[i];
        
        if (!prey || consumedHerbivores.has(i)) continue;
        
        const distance = distanceSquared(predator, prey, config.width, config.height);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

      let successfullyHunted = false;

if (nearestIndex !== -1) {
  const prey = herbivores[nearestIndex];

  if (prey) {
    consumedHerbivores.add(nearestIndex);
    predatorsThatHunted.add(predator.id);
    successfullyHunted = true;

    const energyGained = Math.min(5, prey.energy * 0.25);
    predator.energy += Math.max(0, energyGained);
  }
}

predator.energy -= config.predatorMetabolism;

if (!successfullyHunted) {
  predator.energy -= config.predatorStarvationRate;
}

    if (predator.energy > 0 && predator.ageTicks < MAX_AGE_TICKS) {
      survivingPredators.push(predator);
    }
  }

  // Herbivores feed on the nearest available plant.
  for (let i = 0; i < herbivores.length; i += 1) {
    const herbivore = herbivores[i];

    if (
      !herbivore ||
      consumedHerbivores.has(i) ||
      herbivore.energy <= 0 ||
      herbivore.ageTicks >= MAX_AGE_TICKS
    ) {
      continue;
    }

    let nearestPlant = -1;
    let nearestDistance = HERBIVORE_FEED_RADIUS ** 2;

    
const nearbyPlantIndexes = querySpatialGrid(
  plantGrid,
  herbivore.x,
  herbivore.y,
  HERBIVORE_FEED_RADIUS,
);

for (const j of nearbyPlantIndexes) {
  const candidatePlant = plants[j];

  if (!candidatePlant || candidatePlant.biomass <= EPSILON) {
    continue;
  }

  const distance = distanceSquared(
    herbivore,
    candidatePlant,
    config.width,
    config.height,
  );

  if (distance < nearestDistance) {
    nearestDistance = distance;
    nearestPlant = j;
  }
}


  if (nearestPlant !== -1) {
    const plant = plants[nearestPlant];

    if (plant) {
      const amount = Math.min(2.5, plant.biomass);

      plant.biomass -= amount;
      herbivore.energy += amount * 0.5;
    }
  } else {
    // Herbivores lose extra energy when no food is nearby.
    herbivore.energy -= config.herbivoreStarvationRate;
  }

  herbivore.energy -= config.herbivoreMetabolism;


    if (herbivore.energy > 0 && herbivore.ageTicks < MAX_AGE_TICKS) {
      survivingHerbivores.push(herbivore);
    }
  }

  // Reproduce only while the combined population limit allows it.
  let population =
    plants.length + survivingHerbivores.length + survivingPredators.length;

  for (const animal of survivingHerbivores) {
    if (
      population < config.maxPopulation &&
      animal.energy >= config.reproductionThreshold &&
      animal.reproductionCooldown === 0
    ) {
      const child = reproduce(animal, nextEntityId++, random);
      animal.energy /= 2;
      animal.reproductionCooldown = REPRODUCTION_COOLDOWN;
      newHerbivores.push(child);
      population += 1;
    }
  }

  for (const animal of survivingPredators) {
    if (
      population < config.maxPopulation &&
      animal.energy >= config.predatorReproductionThreshold &&
      animal.reproductionCooldown === 0 &&
      predatorsThatHunted.has(animal.id)

    ) {
      const child = reproduce(animal, nextEntityId++, random);
      animal.energy /= 2;
      animal.reproductionCooldown = REPRODUCTION_COOLDOWN;
      newPredators.push(child);
      population += 1;
    }
  }

  const nextHerbivores = [...survivingHerbivores, ...newHerbivores];
  const nextPredators = [...survivingPredators, ...newPredators];

  const environment = {
    ...state.environment,
    water: Math.max(0, state.environment.water - 0.01),
    nutrients: Math.min(1000, state.environment.nutrients + 0.005),
  };

  return {
    tick: state.tick + 1,
    nextEntityId,
    rngState: random.getState(),
    environment,
    plants,
    herbivores: nextHerbivores,
    predators: nextPredators,
    metrics: {
      plantBiomass: plants.reduce(
        (total, plant) => total + plant.biomass,
        0,
      ),
      herbivoreCount: nextHerbivores.length,
      predatorCount: nextPredators.length,
      availableResources: environment.water + environment.nutrients,
    },
  };
}
