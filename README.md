# WORLDLINE — M1 foundation

A browser-based artificial-life laboratory. This repository slice establishes the React + TypeScript + Vite shell and the first standalone simulation primitives. It does **not** yet implement ecological tick execution, history/branching, Three.js rendering, or persistence.

## Requirements

- Node.js 20.19+ or 22.12+
- npm 10+

## Setup

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm test
npm run lint
npm run format:check
npm run build
```

Coverage is available after installing dependencies:

```bash
npm run test:coverage
```

## M1 scope

- Strict TypeScript configuration
- Vite + React starter shell
- Vitest tests
- ESLint and Prettier
- Simulation configuration types and validation
- Serializable Mulberry32 pseudo-random generator
- Deterministic initial world creation

## Design decisions

- The simulation engine has no React, Three.js, or browser dependencies.
- The seed is an unsigned 32-bit integer; `0` is valid.
- `WorldState.rngState` records the generator state after initialization, ready for the next random draw.
- Entity IDs are allocated monotonically across plants, herbivores, and predators.
- World coordinates are continuous and bounded by `width` and `height`.
- Default coefficients are scaffolding values, not a calibrated ecological model.

## Current limitations

The world is only initialized; no simulation tick exists yet. The current metrics are derived at initialization. State hashing, world-state validation, spatial queries, ecological rules, replay, branching, and IndexedDB belong to subsequent steps/milestones.
