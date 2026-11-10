
import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/simulation/core/createWorld';
import { stepWorld } from '../../src/simulation/core/stepWorld';
import { advanceWorld } from '../../src/simulation/core/advanceWorld';
import { DEFAULT_SIMULATION_CONFIG } from '../../src/simulation/core/defaultConfig';
//import { calculateEnvironmentalConditions } from '../../src/simulation/core/environmentalModel';
import { updateEnvironment } from '../../src/simulation/core/updateEnvironment';
import { consumePlantResources } from '../../src/simulation/core/consumePlantResources';
import { calculatePlantGrowth } from '../../src/simulation/core/calculatePlantGrowth';
import {
  calculateEnvironmentalConditions,
  applyEnvironmentalEvent,
} from '../../src/simulation/core/environmentalModel';

import { getEnvironmentalEvent } from '../../src/simulation/core/environmentalEvents';
import { calculatePlantStress } from '../../src/simulation/core/calculatePlantStress';


describe('WORLDLINE simulation engine', () => {
  it('advances the logical tick by one', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG, seed: 123 };
    const initial = createWorld(config);

    const next = stepWorld(initial, config);

    expect(next.tick).toBe(initial.tick + 1);
  });

  it('produces identical states for identical seeds and tick counts', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG, seed: 456 };

    const first = advanceWorld(createWorld(config), config, 25);
    const second = advanceWorld(createWorld(config), config, 25);

    expect(first).toEqual(second);
  });

  it('does not mutate the original world', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      initialPlants: 20,
      initialHerbivores: 5,
      initialPredators: 2,
    };
    const initial = createWorld(config);
    const originalCopy = structuredClone(initial);

    stepWorld(initial, config);

    expect(initial).toEqual(originalCopy);
  });

  it('rejects invalid tick counts', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG };
    const initial = createWorld(config);

    expect(() => advanceWorld(initial, config, -1)).toThrow(RangeError);
    expect(() => advanceWorld(initial, config, 1.5)).toThrow(RangeError);
  });

  it('keeps the combined population within the configured limit', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      initialPlants: 20,
      initialHerbivores: 10,
      initialPredators: 5,
      maxPopulation: 40,
      reproductionThreshold: 1,
    };

    let world = createWorld(config);

    for (let i = 0; i < 100; i += 1) {
      world = stepWorld(world, config);
    }

    const total =
      world.plants.length +
      world.herbivores.length +
      world.predators.length;

    expect(total).toBeLessThanOrEqual(config.maxPopulation);
  });
  
  it('allows herbivores to gain energy by eating nearby plants', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      seed: 123,
      initialPlants: 1,
      initialHerbivores: 1,
      initialPredators: 0,
      plantGrowthRate: 0,
      herbivoreMetabolism: 0,
      reproductionThreshold: 1000,
      maxPopulation: 100,
    };

    const initial = createWorld(config);
    const plant = initial.plants[0];
    const herbivore = initial.herbivores[0];

    if (!plant || !herbivore) {
      throw new Error('Test world was not initialized correctly.');
    }

    plant.x = 50;
    plant.y = 50;
    plant.biomass = 10;
    plant.health = 1;

    herbivore.x = 50;
    herbivore.y = 50;
    herbivore.energy = 10;

    const next = stepWorld(initial, config);
    const nextHerbivore = next.herbivores[0];

    expect(nextHerbivore).toBeDefined();
    expect(nextHerbivore!.energy).toBeCloseTo(11.25);
    expect(next.plants[0]!.biomass).toBeCloseTo(7.5);
  });

  
it('steers herbivores toward food across wrapped world edges', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    width: 100,
    height: 100,
  };

  const world = createWorld(config);
  const herbivore = {
    ...world.herbivores[0]!,
    x: 1,
    y: 50,
    vx: -1,
    vy: 0,
  };

  const plant = {
    ...world.plants[0]!,
    x: 99,
    y: 50,
    biomass: config.maxPlantBiomass,
  };

  const moved = stepWorld(
    {
      ...world,
      herbivores: [herbivore],
      predators: [],
      plants: [plant],
      rngState: world.rngState,
    },
    config,
  );

  const movedHerbivore = moved.herbivores[0];

  expect(movedHerbivore).toBeDefined();
  expect(movedHerbivore!.x).toBeLessThan(herbivore.x);
});


 
it('allows predators to catch nearby herbivores and scales energy gain', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    seed: 456,
    initialPlants: 0,
    initialHerbivores: 1,
    initialPredators: 1,
    predatorMetabolism: 0,
    reproductionThreshold: 1000,
    maxPopulation: 100,
  };

  // Case 1: Prey energy of 20 gives the predator 10 energy.
  const initial = createWorld(config);
  const herbivore = initial.herbivores[0];
  const predator = initial.predators[0];

  if (!herbivore || !predator) {
    throw new Error('Test world was not initialized correctly.');
  }

  herbivore.x = 50;
  herbivore.y = 50;
  predator.x = 50;
  predator.y = 50;

  herbivore.energy = 20;
  predator.energy = 10;

  const next = stepWorld(initial, config);

  expect(next.herbivores).toHaveLength(0);
  expect(next.predators).toHaveLength(1);
  expect(next.predators[0]!.energy).toBeCloseTo(15);

  // Case 2: Prey energy of 8 gives the predator only 4 energy.
  const secondWorld = createWorld(config);
  const secondHerbivore = secondWorld.herbivores[0];
  const secondPredator = secondWorld.predators[0];

  if (!secondHerbivore || !secondPredator) {
    throw new Error('Second test world was not initialized correctly.');
  }

  secondHerbivore.x = 50;
  secondHerbivore.y = 50;
  secondPredator.x = 50;
  secondPredator.y = 50;

  secondHerbivore.energy = 8;
  secondPredator.energy = 10;

  const secondNext = stepWorld(secondWorld, config);

  expect(secondNext.herbivores).toHaveLength(0);
  expect(secondNext.predators).toHaveLength(1);
  expect(secondNext.predators[0]!.energy).toBeCloseTo(12);
});


  it('removes a herbivore whose energy is exhausted', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      seed: 789,
      initialPlants: 1,
      initialHerbivores: 1,
      initialPredators: 0,
      plantGrowthRate: 0,
      herbivoreMetabolism: 1,
      reproductionThreshold: 1000,
      maxPopulation: 100,
    };

    const initial = createWorld(config);
    const plant = initial.plants[0];
    const herbivore = initial.herbivores[0];

    if (!plant || !herbivore) {
      throw new Error('Test world was not initialized correctly.');
    }

    plant.x = 50;
    plant.y = 50;
    herbivore.x = 0;
    herbivore.y = 0;
    herbivore.energy = 0.1;

    const next = stepWorld(initial, config);

    expect(next.herbivores).toHaveLength(0);
  });  
    


it('uses the configured predator reproduction threshold', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    initialPlants: 0,
    initialHerbivores: 1,
    initialPredators: 1,
    predatorMetabolism: 0,
    predatorReproductionThreshold: 35,
    maxPopulation: 100,
  };

  const createHuntingWorld = (energy: number) => {
    const world = createWorld(config);
    const predator = world.predators[0];
    const herbivore = world.herbivores[0];

    if (!predator || !herbivore) {
      throw new Error('Test animals were not initialized.');
    }

    // Ensure the predator can catch the herbivore during this tick.
    predator.x = 50;
    predator.y = 50;
    predator.energy = energy;
    predator.reproductionCooldown = 0;

    herbivore.x = 50;
    herbivore.y = 50;
    herbivore.energy = 20;

    return world;
  };

  // Hunting adds 5 energy: 29 + 5 = 34, below the threshold.
  const belowThreshold = createHuntingWorld(29);
  expect(stepWorld(belowThreshold, config).predators).toHaveLength(1);

  // Hunting adds 5 energy: 30 + 5 = 35, meeting the threshold.
  const atThreshold = createHuntingWorld(30);
  expect(stepWorld(atThreshold, config).predators).toHaveLength(2);
});


  it('does not allow a predator to reproduce without recent feeding', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      initialPlants: 0,
      initialHerbivores: 0,
      initialPredators: 1,
      predatorMetabolism: 0,
      predatorReproductionThreshold: 35,
      maxPopulation: 100,
    };

    const world = createWorld(config);
    const predator = world.predators[0];

    if (!predator) {
      throw new Error('Test predator was not initialized.');
    }

    predator.energy = 100;
    predator.reproductionCooldown = 0;

    const next = stepWorld(world, config);

    expect(next.predators).toHaveLength(1);
  });

  
  it('makes herbivores lose extra energy when no food is nearby', () => {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      initialPlants: 0,
      initialHerbivores: 1,
      initialPredators: 0,
      herbivoreMetabolism: 0.1,
      herbivoreStarvationRate: 0.2,
    };

    const world = createWorld(config);
    const herbivore = world.herbivores[0];

    if (!herbivore) {
      throw new Error('Test herbivore was not initialized.');
    }

    herbivore.energy = 10;
    herbivore.reproductionCooldown = 50;

    const next = stepWorld(world, config);
    const survivingHerbivore = next.herbivores[0];

    if (!survivingHerbivore) {
      throw new Error('Herbivore should survive this test tick.');
    }

    expect(survivingHerbivore.energy).toBeCloseTo(9.7);
  });

it('keeps populations and biomass finite and non-negative over 500 ticks', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    seed: 42,
    initialPlants: 100,
    initialHerbivores: 20,
    initialPredators: 5,
    maxPopulation: 500,
    
  };

  let world = createWorld(config);

  for (let tick = 0; tick < 500; tick += 1) {
    world = stepWorld(world, config);

    expect(world.tick).toBe(tick + 1);

    for (const plant of world.plants) {
      expect(Number.isFinite(plant.biomass)).toBe(true);
      expect(plant.biomass).toBeGreaterThanOrEqual(0);
      expect(plant.biomass).toBeLessThanOrEqual(config.maxPlantBiomass);
    }

    for (const animal of [...world.herbivores, ...world.predators]) {
      expect(Number.isFinite(animal.energy)).toBe(true);
      expect(animal.energy).toBeGreaterThan(0);
    }

    expect(world.metrics.herbivoreCount).toBe(world.herbivores.length);
    expect(world.metrics.predatorCount).toBe(world.predators.length);
    expect(world.metrics.plantBiomass).toBeCloseTo(
      world.plants.reduce((sum, plant) => sum + plant.biomass, 0),
    );

    expect(
      world.plants.length +
      world.herbivores.length +
      world.predators.length,
    ).toBeLessThanOrEqual(config.maxPopulation);
  }
});

it('compares ecosystem outcomes across five seeds', () => {
  const seeds = [42, 123, 456, 789, 2026];

  for (const seed of seeds) {
    const config = {
      ...DEFAULT_SIMULATION_CONFIG,
      seed,
      initialPlants: 600,
      initialHerbivores: 100,
      initialPredators: 5,
      predatorReproductionThreshold: 100,
      maxPopulation: 2_000,
    };

    let world = createWorld(config);

    const checkpoints: {
      tick: number;
      plants: number;
      herbivores: number;
      predators: number;
      biomass: number;
    }[] = [];

    for (let tick = 0; tick <= 500; tick += 1) {
      if (tick % 100 === 0) {
        checkpoints.push({
          tick,
          plants: world.plants.length,
          herbivores: world.herbivores.length,
          predators: world.predators.length,
          biomass: Number(world.metrics.plantBiomass.toFixed(2)),
        });
      }

      if (tick < 500) {
        world = stepWorld(world, config);
      }
    }

  expect(seeds).toHaveLength(5);
  expect(
    world.plants.every(
      (plant) =>
        Number.isFinite(plant.biomass) &&
        plant.biomass >= 0 &&
        plant.biomass <= config.maxPlantBiomass,
    ),
  ).toBe(true);

  expect(
    [...world.herbivores, ...world.predators].every(
      (animal) => Number.isFinite(animal.energy) && animal.energy > 0,
    ),
  ).toBe(true);

  expect(
    world.plants.length + world.herbivores.length + world.predators.length,
  ).toBeLessThanOrEqual(config.maxPopulation);
  
  console.log(`Population checkpoints for seed ${seed}`);
  console.table(checkpoints);  
}
},25000);

it('reports ecosystem populations at 100-tick intervals', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    seed: 42,
    initialPlants: 600,
    initialHerbivores: 100,
    initialPredators: 5,
    predatorReproductionThreshold: 100,
    maxPopulation: 2_000,
  };

  let world = createWorld(config);

  console.log('WORLDLINE population report:');
  console.log(
    `tick ${world.tick}: plants=${world.plants.length}, ` +
    `herbivores=${world.herbivores.length}, ` +
    `predators=${world.predators.length}, ` +
    `predatorEnergy=${world.predators.reduce((sum, p) => sum + p.energy, 0).toFixed(2)}, ` 
  );

  for (let tick = 1; tick <= 500; tick += 1) {
    world = stepWorld(world, config);

    if (tick % 100 === 0) {
      
      console.log(
        `tick ${tick}: plants=${world.plants.length}, ` +
        `herbivores=${world.herbivores.length}, ` +
        `predators=${world.predators.length}, ` +
        `predatorEnergy=${world.predators.reduce((sum, p) => sum + p.energy, 0).toFixed(2)}, ` +
        `biomass=${world.metrics.plantBiomass.toFixed(2)}`,
      );

    }
  }
});

it('updates environmental conditions on every simulation tick', () => {
  const config = DEFAULT_SIMULATION_CONFIG;
  const initialWorld = createWorld(config);

  const nextWorld = stepWorld(initialWorld, config);

  const seasonalConditions = calculateEnvironmentalConditions(
    initialWorld.tick + 1,
    config,
  );

  const environmentalEvent = getEnvironmentalEvent(initialWorld.tick + 1, config);

  const expectedConditions = applyEnvironmentalEvent(
    seasonalConditions,
    environmentalEvent,
  );

  const weatherUpdatedEnvironment = updateEnvironment(
    initialWorld.environment,
    expectedConditions,
    config,
  );

  const expectedBiomassGained = initialWorld.plants.reduce((total, previousPlant) => {
    // First calculate plant stress or recovery.
    const updatedPlant = calculatePlantStress(
      previousPlant,
      initialWorld.environment,
      config,
    );

    // Then calculate growth using updated health.
    const grownPlant = calculatePlantGrowth(
      updatedPlant,
      initialWorld.environment,
      config,
    );

    return total + Math.max(0, grownPlant.biomass - previousPlant.biomass);
  }, 0);

  const expectedEnvironment = consumePlantResources(
    weatherUpdatedEnvironment,
    expectedBiomassGained,
    config,
  ).environment;

  expect(nextWorld.tick).toBe(initialWorld.tick + 1);
  expect(nextWorld.environment).toEqual(expectedEnvironment);
  expect(nextWorld.environment.temperature).toBe(expectedConditions.temperature);
  expect(nextWorld.environment.rainfall).toBe(expectedConditions.rainfall);
});

it('deducts water and nutrients consumed by plant growth', () => {
  const config = DEFAULT_SIMULATION_CONFIG;
  const initialWorld = createWorld(config);

  const nextWorld = stepWorld(initialWorld, config);

  expect(nextWorld.environment.water)
    .toBeLessThan(1000);

  expect(nextWorld.environment.nutrients)
    .toBeLessThan(1000);

  expect(nextWorld.environment.water)
    .toBeGreaterThanOrEqual(0);

  expect(nextWorld.environment.nutrients)
    .toBeGreaterThanOrEqual(0);
});

it('accounts for remaining resources in world metrics', () => {
  const config = DEFAULT_SIMULATION_CONFIG;
  const initialWorld = createWorld(config);

  const nextWorld = stepWorld(initialWorld, config);

  expect(nextWorld.metrics.availableResources).toBeCloseTo(
    nextWorld.environment.water + nextWorld.environment.nutrients,
  );
});

it('reduces plant health under drought conditions', () => {
  const initialWorld = createWorld(DEFAULT_SIMULATION_CONFIG);

  const plant = initialWorld.plants[0];

  if (!plant) {
    throw new Error('Expected at least one plant');
  }

  const droughtWorld = {
    ...initialWorld,
    environment: {
      ...initialWorld.environment,
      water: 0,
    },
    plants: [
      {
        ...plant,
        health: 1,
      },
      ...initialWorld.plants.slice(1),
    ],
  };

  const nextWorld = stepWorld(
    droughtWorld,
    DEFAULT_SIMULATION_CONFIG,
  );

  expect(nextWorld.plants[0]!.health).toBeLessThan(1);
});

it('allows plants to recover under favourable conditions', () => {
  const initialWorld = createWorld(DEFAULT_SIMULATION_CONFIG);

  const plant = initialWorld.plants[0];

  if (!plant) {
    throw new Error('Expected at least one plant');
  }

  const weakenedWorld = {
    ...initialWorld,
    plants: [
      {
        ...plant,
        health: 0.5,
      },
      ...initialWorld.plants.slice(1),
    ],
  };

  const nextWorld = stepWorld(
    weakenedWorld,
    DEFAULT_SIMULATION_CONFIG,
  );

  expect(nextWorld.plants[0]!.health).toBeGreaterThan(0.5);
});

it('removes a plant that already has zero health', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    initialPlants: 1,
    initialHerbivores: 0,
    initialPredators: 0,
  };

  const world = createWorld(config);
  const plant = world.plants[0];

  if (!plant) {
    throw new Error('Expected one plant.');
  }

  const deadPlant = {
    ...plant,
    health: 0,
  };

  const worldWithDeadPlant = {
    ...world,
    plants: [deadPlant],
  };

  const nextWorld = stepWorld(worldWithDeadPlant, config);

  expect(nextWorld.plants).toHaveLength(0);
  expect(nextWorld.metrics.plantBiomass).toBe(0);
});

it('transfers dead plant biomass into organic matter', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    initialPlants: 1,
    initialHerbivores: 0,
    initialPredators: 0,
  };

  const world = createWorld(config);
  const plant = world.plants[0];

  if (!plant) {
    throw new Error('Expected an initial plant');
  }

  const state = {
    ...world,
    plants: [
      {
        ...plant,
        biomass: 12,
        health: 0,
      },
    ],
    environment: {
      ...world.environment,
      organicMatter: 0,
    },
  };

  const nextWorld = stepWorld(state, config);

  // The dead plant should be removed.
  expect(nextWorld.plants).toHaveLength(0);

  // Its remaining biomass should enter the organic matter pool.
  expect(nextWorld.environment.organicMatter).toBeCloseTo(12);
});

it('does not transfer healthy plant biomass into organic matter', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    initialPlants: 1,
    initialHerbivores: 0,
    initialPredators: 0,
  };

  const world = createWorld(config);
  const plant = world.plants[0];

  if (!plant) {
    throw new Error('Expected an initial plant');
  }

  const state = {
    ...world,
    plants: [
      {
        ...plant,
        biomass: 12,
        health: 1,
      },
    ],
    environment: {
      ...world.environment,
      organicMatter: 0,
    },
  };

  const nextWorld = stepWorld(state, config);

  // The healthy plant should survive.
  expect(nextWorld.plants).toHaveLength(1);

  // No dead biomass should be added.
  expect(nextWorld.environment.organicMatter).toBe(0);
});

it('recycles nutrients from previously accumulated organic matter', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    initialPlants: 0,
    initialHerbivores: 0,
    initialPredators: 0,
    decompositionRate: 0.1,
    nutrientReturnRate: 0.7,
    nutrientRegenerationRate: 0,
  };

  const world = createWorld(config);

  const state = {
    ...world,
    environment: {
      ...world.environment,
      organicMatter: 100,
      nutrients: 500,
    },
  };

  const nextWorld = stepWorld(state, config);

  // 10% of 100 organic matter should decompose.
  expect(nextWorld.environment.organicMatter).toBeCloseTo(90);

  // 70% of the decomposed 10 units should return as nutrients.
  expect(nextWorld.environment.nutrients).toBeCloseTo(507);
});

it('removes a plant when environmental stress reduces its health to zero', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    initialPlants: 1,
    initialHerbivores: 0,
    initialPredators: 0,
    plantGrowthRate: 0,
  };

  const world = createWorld(config);
  const plant = world.plants[0];

  if (!plant) {
    throw new Error('Expected one plant.');
  }

  const weakenedPlant = {
    ...plant,
    health: 0.005,
  };

  const droughtWorld = {
    ...world,
    environment: {
      ...world.environment,
      water: 0,
      nutrients: 0,
    },
    plants: [weakenedPlant],
  };

  const nextWorld = stepWorld(droughtWorld, config);

  expect(nextWorld.plants).toHaveLength(0);
  expect(nextWorld.metrics.plantBiomass).toBe(0);
});

it('allows healthy plants to continue growing normally', () => {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    initialPlants: 1,
    initialHerbivores: 0,
    initialPredators: 0,
  };

  const world = createWorld(config);
  const plant = world.plants[0];

  if (!plant) {
    throw new Error('Expected one plant.');
  }

  const healthyPlant = {
    ...plant,
    biomass: 1,
    health: 1,
  };

  const worldWithHealthyPlant = {
    ...world,
    plants: [healthyPlant],
  };

  const nextWorld = stepWorld(worldWithHealthyPlant, config);

  expect(nextWorld.plants).toHaveLength(1);
  expect(nextWorld.plants[0]!.health).toBeGreaterThan(0);
  expect(nextWorld.plants[0]!.biomass).toBeGreaterThan(1);
});


});
