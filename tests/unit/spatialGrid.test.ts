
import { describe, expect, it } from 'vitest';
import {
  createSpatialGrid,
  querySpatialGrid,
} from '../../src/simulation/core/spatialGrid';

describe('spatialGrid', () => {
  const entities = [
    { x: 5, y: 5 },
    { x: 15, y: 5 },
    { x: 99, y: 50 },
  ];

  it('returns indexes from nearby cells', () => {
    const grid = createSpatialGrid(entities, 100, 100, 12);

    const result = querySpatialGrid(grid, 5, 5, 12);

    expect(result).toContain(0);
    expect(result).toContain(1);
    expect(result).not.toContain(2);
  });

  it('searches across wrapped world edges', () => {
    const grid = createSpatialGrid(entities, 100, 100, 12);

    const result = querySpatialGrid(grid, 1, 50, 3);

    expect(result).toContain(2);
  });

  it('does not return duplicate indexes', () => {
    const grid = createSpatialGrid(entities, 100, 100, 12);

    const result = querySpatialGrid(grid, 1, 50, 12);

    expect(new Set(result).size).toBe(result.length);
  });
});
