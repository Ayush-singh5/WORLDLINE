
export interface GridPosition {
  x: number;
  y: number;
}

export interface SpatialGrid {
  cells: Map<number, number[]>;
  columns: number;
  rows: number;
  cellSize: number;
  width: number;
  height: number;
}

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}

/** Numeric cell key avoids repeated string creation. */
function cellKey(column: number, row: number, columns: number): number {
  return row * columns + column;
}

/** Build a grid containing entity indexes. */
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
    throw new Error(
      'Grid dimensions and cell size must be positive and finite.',
    );
  }

  const columns = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const cells = new Map<number, number[]>();

  for (let i = 0; i < entities.length; i += 1) {
    const entity = entities[i];
    if (!entity) continue;

    const x = wrap(entity.x, width);
    const y = wrap(entity.y, height);

    const column = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    const key = cellKey(column, row, columns);

    const bucket = cells.get(key);

    if (bucket) {
      bucket.push(i);
    } else {
      cells.set(key, [i]);
    }
  }

  return { cells, columns, rows, cellSize, width, height };
}

/** Return nearby entity indexes, including wrapped world edges. */
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

  const range = Math.ceil(radius / grid.cellSize);

  // Visit each grid column and row at most once.
  const columnCount = Math.min(grid.columns, range * 2 + 1);
  const rowCount = Math.min(grid.rows, range * 2 + 1);

  const startColumn =
    ((centerX - range) % grid.columns + grid.columns) % grid.columns;

  const startRow =
    ((centerY - range) % grid.rows + grid.rows) % grid.rows;

  const found: number[] = [];

  for (let rowOffset = 0; rowOffset < rowCount; rowOffset += 1) {
    const row = (startRow + rowOffset) % grid.rows;

    for (
      let columnOffset = 0;
      columnOffset < columnCount;
      columnOffset += 1
    ) {
      const column = (startColumn + columnOffset) % grid.columns;
      const bucket = grid.cells.get(cellKey(column, row, grid.columns));

      if (!bucket) continue;

      for (let i = 0; i < bucket.length; i += 1) {
        found.push(bucket[i]!);
      }
    }
  }

  return found;
}
