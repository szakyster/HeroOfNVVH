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

  it('creates loot hitboxes from center coordinates and checks sanctuary overlap', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;
    const intersects = vi.fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    scene.sanctuaryRects = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 20, width: 10, height: 10 },
    ];
    scene.collisionProvider = { intersects };

    expect((scene.getLootHitbox as (x: number, y: number) => { x: number; y: number; width: number; height: number })(100, 120)).toEqual({
      x: 86,
      y: 110,
      width: 28,
      height: 20,
    });

    expect(
      (scene.isPlayerInsideSanctuary as (hitbox: { x: number; y: number; width: number; height: number }) => boolean)({
        x: 24,
        y: 24,
        width: 8,
        height: 8,
      }),
    ).toBe(true);
    expect(intersects).toHaveBeenCalledTimes(2);
  });

  it('rate-limits inventory error audio playback', () => {
    const playSfx = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.audioSystem = { playSfx };
    scene.lastInventoryErrorAt = 1000;

    (scene.playInventoryError as (now: number) => void)(1100);
    (scene.playInventoryError as (now: number) => void)(1300);

    expect(playSfx).toHaveBeenCalledTimes(1);
    expect(playSfx).toHaveBeenCalledWith('sfx-error');
    expect(scene.lastInventoryErrorAt).toBe(1300);
  });

  it('deposits inventory over time and updates score and info state', () => {
    const playSfx = vi.fn();
    const refreshLevelInfo = vi.fn();
    const registryState = { score: 40 };
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.audioSystem = { playSfx };
    scene.refreshLevelInfo = refreshLevelInfo;
    scene.inventory = [{ type: 'wallet', value: 10 }, { type: 'bag', value: 50 }];
    scene.nextLootDepositAt = null;
    scene.registry = {
      get: vi.fn((key: string) => registryState[key as keyof typeof registryState]),
      set: vi.fn((key: string, value: number) => {
        registryState[key as keyof typeof registryState] = value;
      }),
    };

    (scene.depositInventory as (now: number) => void)(1000);
    expect(scene.nextLootDepositAt).toBe(1400);
    expect(scene.inventory).toHaveLength(2);

    (scene.depositInventory as (now: number) => void)(1200);
    expect(scene.inventory).toHaveLength(2);

    (scene.depositInventory as (now: number) => void)(1400);
    expect(scene.inventory).toHaveLength(1);
    expect(registryState.score).toBe(50);
    expect(playSfx).toHaveBeenCalledWith('sfx-deposit');
    expect(scene.nextLootDepositAt).toBe(1800);

    (scene.depositInventory as (now: number) => void)(1800);
    expect(scene.inventory).toHaveLength(0);
    expect(registryState.score).toBe(100);
    expect(scene.nextLootDepositAt).toBeNull();
    expect(refreshLevelInfo).toHaveBeenCalledTimes(2);
  });

  it('triggers game over once and starts the game over scene after music fade', () => {
    const playSfx = vi.fn();
    const fadeOutMusic = vi.fn((_duration: number, onComplete?: () => void) => {
      onComplete?.();
    });
    const start = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.audioSystem = { playSfx, fadeOutMusic };
    scene.scene = { start };
    scene.registry = { get: vi.fn(() => 275) };
    scene.isGameOver = false;

    (scene.triggerGameOver as () => void)();
    (scene.triggerGameOver as () => void)();

    expect(scene.isGameOver).toBe(true);
    expect(playSfx).toHaveBeenCalledTimes(1);
    expect(playSfx).toHaveBeenCalledWith('sfx-error');
    expect(fadeOutMusic).toHaveBeenCalledTimes(1);
    expect(fadeOutMusic).toHaveBeenCalledWith(900, expect.any(Function));
    expect(start).toHaveBeenCalledWith('GameOverScene', { score: 275 });
  });

  it('increments escaped enemies and triggers game over at the threshold', () => {
    const refreshEnemyInfo = vi.fn();
    const refreshHud = vi.fn();
    const triggerGameOver = vi.fn();
    const registryState = { escapedEnemies: 9 };
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.refreshEnemyInfo = refreshEnemyInfo;
    scene.refreshHud = refreshHud;
    scene.triggerGameOver = triggerGameOver;
    scene.registry = {
      get: vi.fn((key: string) => registryState[key as keyof typeof registryState]),
      set: vi.fn((key: string, value: number) => {
        registryState[key as keyof typeof registryState] = value;
      }),
    };

    (scene.handleEnemyEscaped as () => void)();

    expect(registryState.escapedEnemies).toBe(10);
    expect(refreshEnemyInfo).toHaveBeenCalledTimes(1);
    expect(refreshHud).toHaveBeenCalledTimes(1);
    expect(triggerGameOver).toHaveBeenCalledTimes(1);
  });

  it('removes destroyed loot and optionally refreshes level info', () => {
    const refreshLevelInfo = vi.fn();
    const firstLoot = {
      id: 'loot-1',
      body: { destroy: vi.fn() },
      shadow: { destroy: vi.fn() },
    };
    const secondLoot = {
      id: 'loot-2',
      body: { destroy: vi.fn() },
      shadow: { destroy: vi.fn() },
    };
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.refreshLevelInfo = refreshLevelInfo;
    scene.activeLoots = [firstLoot, secondLoot];

    (scene.destroyLoot as (loot: typeof firstLoot, refreshInfo?: boolean) => void)(firstLoot, true);

    expect(firstLoot.body.destroy).toHaveBeenCalledTimes(1);
    expect(firstLoot.shadow.destroy).toHaveBeenCalledTimes(1);
    expect(scene.activeLoots).toEqual([secondLoot]);
    expect(refreshLevelInfo).toHaveBeenCalledTimes(1);

    (scene.destroyLoot as (loot: typeof secondLoot, refreshInfo?: boolean) => void)(secondLoot, false);
    expect(refreshLevelInfo).toHaveBeenCalledTimes(1);
    expect(scene.activeLoots).toEqual([]);
  });

  it('spawns the player at sanctuary and updates visibility and hitbox rendering', () => {
    const renderPlayerHitbox = vi.fn();
    const playerBody = {
      setPosition: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    };
    const playerShadow = {
      setPosition: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockReturnThis(),
    };
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.playerBody = playerBody;
    scene.playerShadow = playerShadow;
    scene.gridSystem = {
      cellCenter: vi.fn(() => ({ x: 320, y: 240 })),
    };
    scene.renderPlayerHitbox = renderPlayerHitbox;

    (scene.spawnPlayer as (level: Record<string, unknown>) => void)({
      sanctuaryZone: [{ x: 3, y: 4 }],
      spawnZones: [{ cells: [{ x: 0, y: 0 }] }],
    });

    expect(playerBody.setPosition).toHaveBeenCalledWith(320, 216);
    expect(playerBody.setVisible).toHaveBeenCalledWith(true);
    expect(playerShadow.setPosition).toHaveBeenCalledWith(320, 270);
    expect(playerShadow.setVisible).toHaveBeenCalledWith(true);
    expect(renderPlayerHitbox).toHaveBeenCalledTimes(1);
  });

  it('moves the player along the grid only when the next position is valid and unobstructed', () => {
    const renderPlayerHitbox = vi.fn();
    const playerBody = {
      x: 100,
      y: 120,
      setPosition: vi.fn().mockReturnThis(),
    };
    const playerShadow = {
      setPosition: vi.fn().mockReturnThis(),
    };
    const moveAlongSurface = vi.fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ x: 140, y: 160 })
      .mockReturnValueOnce({ x: 180, y: 200 })
      .mockReturnValueOnce({ x: 220, y: 240 });
    const collidesWithAny = vi.fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const isInsidePlayArea = vi.fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true);
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.playerBody = playerBody;
    scene.playerShadow = playerShadow;
    scene.gridSystem = { moveAlongSurface };
    scene.collisionProvider = { collidesWithAny };
    scene.isInsidePlayArea = isInsidePlayArea;
    scene.renderPlayerHitbox = renderPlayerHitbox;
    scene.obstacleRects = [{ x: 0, y: 0, width: 10, height: 10 }];

    (scene.tryMovePlayerAlongGrid as (dx: number, dy: number) => void)(10, 0);
    (scene.tryMovePlayerAlongGrid as (dx: number, dy: number) => void)(20, 0);
    (scene.tryMovePlayerAlongGrid as (dx: number, dy: number) => void)(30, 0);
    (scene.tryMovePlayerAlongGrid as (dx: number, dy: number) => void)(40, 0);

    expect(moveAlongSurface).toHaveBeenCalledTimes(4);
    expect(collidesWithAny).toHaveBeenCalledTimes(2);
    expect(playerBody.setPosition).toHaveBeenCalledTimes(1);
    expect(playerBody.setPosition).toHaveBeenCalledWith(220, 240);
    expect(playerShadow.setPosition).toHaveBeenCalledWith(220, 294);
    expect(renderPlayerHitbox).toHaveBeenCalledTimes(1);
  });
});