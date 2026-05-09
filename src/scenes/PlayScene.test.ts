import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('phaser', () => {
  class MockScene {
    constructor(_config?: unknown) {}
  }

  return {
    default: {
      Scene: MockScene,
      Scenes: {
        Events: {
          SHUTDOWN: 'shutdown',
        },
      },
      Input: {
        Keyboard: {
          KeyCodes: {},
          JustDown: () => false,
        },
      },
      Math: {
        Vector2: class {
          constructor(public x = 0, public y = 0) {}

          normalize(): this {
            return this;
          }

          scale(_value: number): this {
            return this;
          }

          length(): number {
            return 0;
          }
        },
        FloatBetween: () => 1,
      },
      Utils: {
        Array: {
          Shuffle: <T>(items: T[]) => items,
          GetRandom: <T>(items: T[]) => items[0],
        },
      },
    },
  };
});

let PlayScene: typeof import('./PlayScene').PlayScene;

beforeAll(async () => {
  ({ PlayScene } = await import('./PlayScene'));
});

describe('PlayScene runtime reset', () => {
  it('clears transient gameplay state before a new run starts', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.currentLevel = { name: 'Teszt pálya' };
    scene.obstacleRects = [{ x: 1, y: 2, width: 3, height: 4 }];
    scene.sanctuaryRects = [{ x: 5, y: 6, width: 7, height: 8 }];
    scene.playerBody = { visible: true };
    scene.playerShadow = { visible: true };
    scene.playerHitboxDebug = { clear: () => undefined };
    scene.enemyHitboxDebug = { clear: () => undefined };
    scene.attackDebug = { clear: () => undefined };
    scene.scoreValueText = { setText: () => undefined };
    scene.inventoryValueText = { setText: () => undefined };
    scene.escapedValueText = { setText: () => undefined };
    scene.waveValueText = { setText: () => undefined };
    scene.levelInfoText = { setText: () => undefined };
    scene.enemyInfoText = { setText: () => undefined };
    scene.musicToggleText = { setText: () => undefined };
    scene.sfxToggleText = { setText: () => undefined };
    scene.activeEnemies = [{ defeated: false }];
    scene.activeLoots = [{ id: 'loot-1' }];
    scene.inventory = [{ type: 'bag', value: 50 }];
    scene.droppedLootCount = 3;
    scene.nextLootDepositAt = 1200;
    scene.lastInventoryErrorAt = 400;
    scene.facingDirection = 'left';
    scene.attackRect = { x: 10, y: 10, width: 20, height: 20 };
    scene.attackVisualUntil = 700;
    scene.lastAttackAt = 650;
    scene.isGameOver = true;
    scene.waveNumber = 4;
    scene.spawnedEnemies = 9;

    (scene.resetRuntimeState as () => void)();

    expect(scene.currentLevel).toBeUndefined();
    expect(scene.obstacleRects).toEqual([]);
    expect(scene.sanctuaryRects).toEqual([]);
    expect(scene.playerBody).toBeUndefined();
    expect(scene.playerShadow).toBeUndefined();
    expect(scene.playerHitboxDebug).toBeUndefined();
    expect(scene.enemyHitboxDebug).toBeUndefined();
    expect(scene.attackDebug).toBeUndefined();
    expect(scene.scoreValueText).toBeUndefined();
    expect(scene.inventoryValueText).toBeUndefined();
    expect(scene.escapedValueText).toBeUndefined();
    expect(scene.waveValueText).toBeUndefined();
    expect(scene.levelInfoText).toBeUndefined();
    expect(scene.enemyInfoText).toBeUndefined();
    expect(scene.musicToggleText).toBeUndefined();
    expect(scene.sfxToggleText).toBeUndefined();
    expect(scene.activeEnemies).toEqual([]);
    expect(scene.activeLoots).toEqual([]);
    expect(scene.inventory).toEqual([]);
    expect(scene.droppedLootCount).toBe(0);
    expect(scene.nextLootDepositAt).toBeNull();
    expect(scene.lastInventoryErrorAt).toBe(Number.NEGATIVE_INFINITY);
    expect(scene.facingDirection).toBe('down');
    expect(scene.attackRect).toBeNull();
    expect(scene.attackVisualUntil).toBe(0);
    expect(scene.lastAttackAt).toBe(Number.NEGATIVE_INFINITY);
    expect(scene.isGameOver).toBe(false);
    expect(scene.waveNumber).toBe(1);
    expect(scene.spawnedEnemies).toBe(0);
  });

  it('refreshes HUD texts from registry values and inventory state', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;
    const scoreValueText = { setText: vi.fn() };
    const inventoryValueText = { setText: vi.fn() };
    const escapedValueText = { setText: vi.fn() };
    const waveValueText = { setText: vi.fn() };

    scene.registry = {
      get: vi.fn((key: string) => {
        if (key === 'score') {
          return 150;
        }

        if (key === 'escapedEnemies') {
          return 3;
        }

        return undefined;
      }),
    };
    scene.scoreValueText = scoreValueText;
    scene.inventoryValueText = inventoryValueText;
    scene.escapedValueText = escapedValueText;
    scene.waveValueText = waveValueText;
    scene.inventory = [{ type: 'wallet', value: 10 }, { type: 'phone', value: 20 }];
    scene.waveNumber = 4;

    (scene.refreshHud as () => void)();

    expect(scoreValueText.setText).toHaveBeenCalledWith('150 M Ft');
    expect(inventoryValueText.setText).toHaveBeenCalledWith('2/4  ■■□□');
    expect(escapedValueText.setText).toHaveBeenCalledWith('3/10');
    expect(waveValueText.setText).toHaveBeenCalledWith('4. hullám');
  });

  it('formats auxiliary level and enemy info texts', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;
    const levelInfoText = { setText: vi.fn() };
    const enemyInfoText = { setText: vi.fn() };

    scene.levelInfoText = levelInfoText;
    scene.enemyInfoText = enemyInfoText;
    scene.currentLevel = { name: 'Teszt pálya' };
    scene.activeLoots = [{ id: 'loot-1' }];
    scene.inventory = [{ type: 'bag', value: 50 }];
    scene.activeEnemies = [{ defeated: false }];
    scene.spawnedEnemies = 2;
    scene.waveNumber = 2;
    scene.registry = { get: vi.fn(() => 0) };
    scene.scoreValueText = { setText: vi.fn() };
    scene.inventoryValueText = { setText: vi.fn() };
    scene.escapedValueText = { setText: vi.fn() };
    scene.waveValueText = { setText: vi.fn() };

    (scene.refreshLevelInfo as () => void)();
    (scene.refreshEnemyInfo as (count?: number) => void)(5);

    expect(levelInfoText.setText).toHaveBeenCalledWith(
      'Pálya: Teszt pálya | Földön: 1 tárgy | Leadási sáv: aktív',
    );
    expect(enemyInfoText.setText).toHaveBeenCalledWith(
      'Aktív ellenfelek: 1 | Spawn ebben a hullámban: 2/5',
    );
  });

  it('maps loot colors and inventory icons consistently', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.inventory = [{ type: 'wallet', value: 10 }, { type: 'bag', value: 50 }, { type: 'phone', value: 20 }];

    expect((scene.getInventoryIcons as () => string)()).toBe('■■■□');
    expect((scene.getLootColor as (type: string) => number)('wallet')).toBe(0x8d6e63);
    expect((scene.getLootColor as (type: string) => number)('phone')).toBe(0x577590);
    expect((scene.getLootColor as (type: string) => number)('bag')).toBe(0x6a994e);
    expect((scene.getLootColor as (type: string) => number)('other')).toBe(0xe9c46a);
  });
});