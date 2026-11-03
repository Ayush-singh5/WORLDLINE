
export interface GridPosition {
  x: number;
  y: number;
}

export interface SpatialGrid {
  cells: Map<string, number[]>;
  columns: number;
  rows: number;
  cellSize: number;
  width: number;
  height: number;
}

/** Wrap a coordinate into the world boundaries. */
function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}

function cellKey(column: number, row: number): string {
  return `${column},${row}`;
}

/** Build a grid containing the indexes of entities in each cell. */
export function createSpatialGrid(
  entities: readonly GridPosition[],
  width: number,
  height: number,
  cellSize = 12,
): SpatialGrid {
  if (
    width <= 0 ||
    height <= 0 ||
    cellSize <= 0 ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    !Number.isFinite(cellSize)
  ) {
    throw new Error('Grid dimensions and cell size must be positive and finite.');
  }

  const columns = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const cells = new Map<string, number[]>();

  for (let i = 0; i < entities.length; i += 1) {
    const entity = entities[i];

    if (!entity) continue;

    const x = wrap(entity.x, width);
    const y = wrap(entity.y, height);
    const column = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    const key = cellKey(column, row);

    const bucket = cells.get(key);

    if (bucket) {
      bucket.push(i);
    } else {
      cells.set(key, [i]);
    }
  }

  return { cells, columns, rows, cellSize, width, height };
}

/** Return nearby entity indexes, including cells across world edges. */
export function querySpatialGrid(
  grid: SpatialGrid,
  x: number,
  y: number,
  radius: number,
): number[] {
  if (!Number.isFinite(radius) || radius < 0) {
    throw new Error('Search radius must be finite and non-negative.');
  }

  const centerX = Math.floor(wrap(x, grid.width) / grid.cellSize);
  const centerY = Math.floor(wrap(y, grid.height) / grid.cellSize);
  const range = Math.ceil(radius / grid.cellSize) + 1;
  const found = new Set<number>();

  for (let dy = -range; dy <= range; dy += 1) {
    for (let dx = -range; dx <= range; dx += 1) {
      const column =
        ((centerX + dx) % grid.columns + grid.columns) % grid.columns;
      const row =
        ((centerY + dy) % grid.rows + grid.rows) % grid.rows;

      const bucket = grid.cells.get(cellKey(column, row));

      if (!bucket) continue;

      for (const index of bucket) {
        found.add(index);
      }
    }
  }

  return [...found];
}
