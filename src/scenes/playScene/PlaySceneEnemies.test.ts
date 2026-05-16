import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { LevelData } from '../../types/level';

vi.mock('phaser', () => {
  class Vector2 {
    constructor(public x = 0, public y = 0) {}

    normalize(): this {
      const magnitude = Math.hypot(this.x, this.y);

      if (magnitude > 0) {
        this.x /= magnitude;
        this.y /= magnitude;
      }

      return this;
    }

    scale(value: number): this {
      this.x *= value;
      this.y *= value;
      return this;
    }

    length(): number {
      return Math.hypot(this.x, this.y);
    }
  }

  return {
    default: {
      Math: {
        Vector2,
      },
      Utils: {
        Array: {
          Shuffle: <T>(items: T[]) => items,
        },
      },
    },
  };
});

let buildEnemyPath: typeof import('./PlaySceneEnemies').buildEnemyPath;
let getEnemyAnimationKey: typeof import('./PlaySceneEnemies').getEnemyAnimationKey;
let getEnemyMovementVisualState: typeof import('./PlaySceneEnemies').getEnemyMovementVisualState;
let getEnemySheetKey: typeof import('./PlaySceneEnemies').getEnemySheetKey;
let isEnemyInjuryActive: typeof import('./PlaySceneEnemies').isEnemyInjuryActive;
let startEnemyInjuryAnimation: typeof import('./PlaySceneEnemies').startEnemyInjuryAnimation;
let updateActiveEnemies: typeof import('./PlaySceneEnemies').updateActiveEnemies;
type ActiveEnemy = import('./PlaySceneEnemies').ActiveEnemy;

beforeAll(async () => {
  ({
    buildEnemyPath,
    getEnemyAnimationKey,
    getEnemyMovementVisualState,
    getEnemySheetKey,
    isEnemyInjuryActive,
    startEnemyInjuryAnimation,
    updateActiveEnemies,
  } = await import('./PlaySceneEnemies'));
});

const levelFixture: LevelData = {
  id: 'level-test',
  name: 'Teszt pálya',
  grid: { width: 7, height: 6 },
  obstacles: [{ x: 3, y: 3, image: 'crate.png' }],
  spawnZones: [{ id: 'spawn-a', cells: [{ x: 0, y: 0 }] }],
  goalZones: [{ id: 'goal-a', cells: [{ x: 6, y: 5 }] }],
  sanctuaryZone: [{ x: 1, y: 5 }],
  hrsImages: [],
  lootSpawns: [],
};

function createEnemyFixture(overrides: Partial<ActiveEnemy> = {}): ActiveEnemy {
  return {
    body: {
      x: 120,
      y: 140,
      setPosition: vi.fn(),
      destroy: vi.fn(),
    } as unknown as ActiveEnemy['body'],
    shadow: {
      setPosition: vi.fn(),
      destroy: vi.fn(),
    } as unknown as ActiveEnemy['shadow'],
    path: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    pathIndex: 0,
    speed: 88,
    health: 2,
    lootDropped: false,
    escaped: false,
    defeated: false,
    animationDirection: 'down',
    animationFlipX: false,
    injuryAnimationUntil: null,
    ...overrides,
  };
}

describe('PlaySceneEnemies helpers', () => {
  it('builds enemy animation keys consistently', () => {
    expect(getEnemySheetKey('walk', 'down')).toBe('enemy-01-walk-down');
    expect(getEnemyAnimationKey('injured', 'up')).toBe('enemy-01-injured-up-once');
  });

  it('derives enemy movement direction and flip from velocity', () => {
    expect(getEnemyMovementVisualState(-20, 5)).toEqual({ direction: 'right', flipX: true });
    expect(getEnemyMovementVisualState(2, -10)).toEqual({ direction: 'up', flipX: false });
  });

  it('starts and clears the enemy injury window', () => {
    const enemy = createEnemyFixture();

    startEnemyInjuryAnimation(enemy, 1000);

    expect(enemy.injuryAnimationUntil).toBeGreaterThan(1000);
    expect(isEnemyInjuryActive(enemy, 1200)).toBe(true);
    expect(isEnemyInjuryActive(enemy, 2500)).toBe(false);
    expect(enemy.injuryAnimationUntil).toBeNull();
  });

  it('prefers a waypoint path when one is available', () => {
    const pathfinder = {
      findPathViaWaypoint: vi.fn((_, __, ___, waypoint) => (waypoint.x === 4 ? [{ x: 0, y: 0 }, { x: 4, y: 2 }, { x: 6, y: 5 }] : null)),
      findPath: vi.fn(() => [{ x: 0, y: 0 }, { x: 6, y: 5 }]),
    };
    const gridSystem = {
      allCells: vi.fn(() => [
        { x: 1, y: 1 },
        { x: 4, y: 2 },
      ]),
    };

    const path = buildEnemyPath({
      level: levelFixture,
      spawnCell: { x: 0, y: 0 },
      goalCell: { x: 6, y: 5 },
      gridSystem: gridSystem as never,
      pathfinder: pathfinder as never,
    });

    expect(path).toEqual([{ x: 0, y: 0 }, { x: 4, y: 2 }, { x: 6, y: 5 }]);
    expect(pathfinder.findPath).not.toHaveBeenCalled();
  });

  it('updates active enemies, skipping injured ones and removing escaped ones', () => {
    const injuredEnemy = createEnemyFixture({ injuryAnimationUntil: 1500 });
    const escapingEnemy = createEnemyFixture({ path: [{ x: 0, y: 0 }], pathIndex: 0 });
    const movingEnemy = createEnemyFixture();
    const onEnemyEscaped = vi.fn();
    const updateEnemyMovementVisual = vi.fn();
    const updateEnemyRenderDepth = vi.fn();
    const gridSystem = {
      cellCenter: vi.fn(() => ({ x: 240, y: 180 })),
    };

    const nextEnemies = updateActiveEnemies({
      activeEnemies: [injuredEnemy, escapingEnemy, movingEnemy],
      delta: 16,
      now: 1200,
      isGameOver: false,
      gridSystem: gridSystem as never,
      onEnemyEscaped,
      updateEnemyMovementVisual,
      updateEnemyRenderDepth,
    });

    expect(onEnemyEscaped).toHaveBeenCalledTimes(1);
    expect((escapingEnemy.body.destroy as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    expect(updateEnemyMovementVisual).toHaveBeenCalledTimes(1);
    expect(updateEnemyRenderDepth).toHaveBeenCalledTimes(1);
    expect(nextEnemies).toEqual([injuredEnemy, movingEnemy]);
  });
});