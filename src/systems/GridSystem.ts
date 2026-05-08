export type GridCell = {
  x: number;
  y: number;
};

export type ScreenPoint = {
  x: number;
  y: number;
};

export type ScreenRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GridConfig = {
  columns: number;
  rows: number;
  centerX: number;
  centerY: number;
  topWidth: number;
  bottomWidth: number;
  totalHeight: number;
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

  private getTopY(): number {
    return this.config.centerY - this.config.totalHeight / 2;
  }

  private interpolateEdge(progress: number): { leftX: number; rightX: number; y: number } {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const width = this.config.topWidth + (this.config.bottomWidth - this.config.topWidth) * clampedProgress;
    const y = this.getTopY() + this.config.totalHeight * clampedProgress;

    return {
      leftX: this.config.centerX - width / 2,
      rightX: this.config.centerX + width / 2,
      y,
    };
  }

  toScreen(cell: GridCell): ScreenPoint {
    if (!this.isWithinBounds(cell)) {
      throw new Error(`Grid cell out of bounds: (${cell.x}, ${cell.y})`);
    }

    const topEdge = this.interpolateEdge(cell.y / this.config.rows);
    const topStep = (topEdge.rightX - topEdge.leftX) / this.config.columns;

    const x = topEdge.leftX + cell.x * topStep;
    const y = topEdge.y;

    return { x, y };
  }

  cellPolygon(cell: GridCell): [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint] {
    if (!this.isWithinBounds(cell)) {
      throw new Error(`Grid cell out of bounds: (${cell.x}, ${cell.y})`);
    }

    const topEdge = this.interpolateEdge(cell.y / this.config.rows);
    const bottomEdge = this.interpolateEdge((cell.y + 1) / this.config.rows);
    const topStep = (topEdge.rightX - topEdge.leftX) / this.config.columns;
    const bottomStep = (bottomEdge.rightX - bottomEdge.leftX) / this.config.columns;

    return [
      { x: topEdge.leftX + cell.x * topStep, y: topEdge.y },
      { x: topEdge.leftX + (cell.x + 1) * topStep, y: topEdge.y },
      { x: bottomEdge.leftX + (cell.x + 1) * bottomStep, y: bottomEdge.y },
      { x: bottomEdge.leftX + cell.x * bottomStep, y: bottomEdge.y },
    ];
  }

  cellCenter(cell: GridCell): ScreenPoint {
    const polygon = this.cellPolygon(cell);

    return {
      x: (polygon[0].x + polygon[1].x + polygon[2].x + polygon[3].x) / 4,
      y: (polygon[0].y + polygon[1].y + polygon[2].y + polygon[3].y) / 4,
    };
  }

  cellBounds(cell: GridCell, inset = 0): ScreenRect {
    const polygon = this.cellPolygon(cell);
    const xValues = polygon.map((point) => point.x);
    const yValues = polygon.map((point) => point.y);
    const minX = Math.min(...xValues) + inset;
    const maxX = Math.max(...xValues) - inset;
    const minY = Math.min(...yValues) + inset;
    const maxY = Math.max(...yValues) - inset;

    return {
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    };
  }

  playAreaPolygon(): [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint] {
    const topEdge = this.interpolateEdge(0);
    const bottomEdge = this.interpolateEdge(1);

    return [
      { x: topEdge.leftX, y: topEdge.y },
      { x: topEdge.rightX, y: topEdge.y },
      { x: bottomEdge.rightX, y: bottomEdge.y },
      { x: bottomEdge.leftX, y: bottomEdge.y },
    ];
  }

  containsPoint(point: ScreenPoint): boolean {
    const polygon = this.playAreaPolygon();
    let isInside = false;

    for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current++) {
      const currentPoint = polygon[current];
      const previousPoint = polygon[previous];

      const intersects =
        currentPoint.y > point.y !== previousPoint.y > point.y &&
        point.x <
          ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
            (previousPoint.y - currentPoint.y) +
            currentPoint.x;

      if (intersects) {
        isInside = !isInside;
      }
    }

    return isInside;
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
