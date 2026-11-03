
import { performance } from 'node:perf_hooks';
import { DEFAULT_SIMULATION_CONFIG } from '../src/simulation/core/defaultConfig';
import { createWorld } from '../src/simulation/core/createWorld';
import { stepWorld } from '../src/simulation/core/stepWorld';

const TICKS = 500;
const RUNS = 3;

for (let run = 1; run <= RUNS; run += 1) {
  let world = createWorld(DEFAULT_SIMULATION_CONFIG);

  const start = performance.now();

  for (let tick = 0; tick < TICKS; tick += 1) {
    world = stepWorld(world, DEFAULT_SIMULATION_CONFIG);
  }

  const elapsed = performance.now() - start;

  console.log(
    `Run ${run}: ${elapsed.toFixed(2)} ms | ` +
    `Herbivores: ${world.herbivores.length} | ` +
    `Predators: ${world.predators.length}`,
  );
}
