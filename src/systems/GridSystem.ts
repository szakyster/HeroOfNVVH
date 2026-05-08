export type GridCell = {
  x: number;
  y: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
};

export type GridConfig = {
  columns: number;
  rows: number;
  originX: number;
  originY: number;
  cellTopWidth: number;
  cellBottomWidth: number;
  cellHeight: number;
};

export class GridSystem {
  constructor(private readonly config: GridConfig) {}

  getConfig(): GridConfig {
    return this.config;
  }

  isWithinBounds(cell: GridCell): boolean {
    return (
      Number.isInteger(cell.x) &&
      Number.isInteger(cell.y) &&
      cell.x >= 0 &&
      cell.x < this.config.columns &&
      cell.y >= 0 &&
      cell.y < this.config.rows
    );
  }

  toScreen(cell: GridCell): ScreenPoint {
    if (!this.isWithinBounds(cell)) {
      throw new Error(`Grid cell out of bounds: (${cell.x}, ${cell.y})`);
    }

    const rowOffset = (this.config.cellBottomWidth - this.config.cellTopWidth) / 2;
    const widthDeltaPerRow = this.config.cellBottomWidth - this.config.cellTopWidth;

    const x =
      this.config.originX +
      cell.x * this.config.cellTopWidth +
      cell.y * rowOffset +
      (cell.y * widthDeltaPerRow) / 2;

    const y = this.config.originY + cell.y * this.config.cellHeight;

    return { x, y };
  }

  cellPolygon(cell: GridCell): [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint] {
    const topLeft = this.toScreen(cell);

    return [
      topLeft,
      { x: topLeft.x + this.config.cellTopWidth, y: topLeft.y },
      { x: topLeft.x + this.config.cellBottomWidth, y: topLeft.y + this.config.cellHeight },
      { x: topLeft.x, y: topLeft.y + this.config.cellHeight },
    ];
  }

  allCells(): GridCell[] {
    const cells: GridCell[] = [];

    for (let y = 0; y < this.config.rows; y += 1) {
      for (let x = 0; x < this.config.columns; x += 1) {
        cells.push({ x, y });
      }
    }

    return cells;
  }
}
