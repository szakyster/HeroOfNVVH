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
    const escapedValueText = { setText: vi.fn(), setColor: vi.fn(), setPosition: vi.fn(), x: 430, y: 63 };
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
    scene.escapedValueBaseX = 430;
    scene.escapedValueBaseY = 63;
    scene.waveValueText = waveValueText;
    scene.inventory = [{ type: 'wallet', value: 10 }, { type: 'phone', value: 20 }];
    scene.waveNumber = 4;
    scene.tweens = { add: vi.fn() };

    (scene.refreshHud as () => void)();

    expect(scoreValueText.setText).toHaveBeenCalledWith('150 M Ft');
    expect(inventoryValueText.setText).toHaveBeenCalledWith('2/4  ■■□□');
    expect(escapedValueText.setText).toHaveBeenCalledWith('3/10');
    expect(escapedValueText.setColor).toHaveBeenCalledWith('#f4e6a2');
    expect(escapedValueText.setPosition).toHaveBeenCalledWith(430, 63);
    expect(waveValueText.setText).toHaveBeenCalledWith('4. hullám');
  });

  it('turns the escaped enemy counter bright red and shakes it at 8 or above', () => {
    const warningTween = { stop: vi.fn() };
    const tweensAdd = vi.fn(() => warningTween);
    const escapedValueText = {
      setText: vi.fn(),
      setColor: vi.fn(),
      setPosition: vi.fn(),
      x: 430,
      y: 63,
    };
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.registry = {
      get: vi.fn((key: string) => {
        if (key === 'score') {
          return 150;
        }

        if (key === 'escapedEnemies') {
          return 8;
        }

        return undefined;
      }),
    };
    scene.scoreValueText = { setText: vi.fn() };
    scene.inventoryValueText = { setText: vi.fn() };
    scene.escapedValueText = escapedValueText;
    scene.escapedValueBaseX = 430;
    scene.escapedValueBaseY = 63;
    scene.waveValueText = { setText: vi.fn() };
    scene.inventory = [];
    scene.waveNumber = 1;
    scene.tweens = { add: tweensAdd };

    (scene.refreshHud as () => void)();
    (scene.refreshHud as () => void)();

    expect(escapedValueText.setText).toHaveBeenCalledWith('8/10');
    expect(escapedValueText.setColor).toHaveBeenCalledWith('#ff4d4f');
    expect(tweensAdd).toHaveBeenCalledTimes(1);
    expect(tweensAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: escapedValueText,
        x: 434,
        yoyo: true,
        repeat: -1,
      }),
    );
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

  it('maps inventory icons and deposit popup colors consistently', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.inventory = [{ type: 'wallet', value: 10 }, { type: 'bag', value: 50 }, { type: 'phone', value: 20 }];

    expect((scene.getInventoryIcons as () => string)()).toBe('■■■□');
    expect((scene.getDepositPopupColor as (value: number) => string)(10)).toBe('#8ecae6');
    expect((scene.getDepositPopupColor as (value: number) => string)(20)).toBe('#80ed99');
    expect((scene.getDepositPopupColor as (value: number) => string)(50)).toBe('#ffd166');
  });

  it('spawns dropped loot using the image configured on the loot template', () => {
    const refreshLevelInfo = vi.fn();
    const updateLootRenderDepth = vi.fn();
    const shadow = { setDepth: vi.fn().mockReturnThis() };
    const body = {
      setDisplaySize: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };
    const add = {
      ellipse: vi.fn(() => shadow),
      image: vi.fn(() => body),
    };
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.currentLevel = {
      lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 20, image: 'money01.png', cell: { x: 2, y: 4 } }],
    };
    scene.add = add;
    scene.time = { now: 1250 };
    scene.refreshLevelInfo = refreshLevelInfo;
    scene.updateLootRenderDepth = updateLootRenderDepth;
    scene.activeLoots = [];
    scene.droppedLootCount = 0;

    (scene.spawnLootAtEnemy as (enemy: { body: { x: number; y: number } }) => void)({
      body: { x: 300, y: 180 },
    });

    expect(add.image).toHaveBeenCalledWith(300, 184, 'loot:money01.png');
    expect(body.setDisplaySize).toHaveBeenCalledWith(60, 40);
    expect(scene.activeLoots).toHaveLength(1);
    expect(updateLootRenderDepth).toHaveBeenCalledWith(scene.activeLoots[0]);
    expect(refreshLevelInfo).toHaveBeenCalledTimes(1);
  });

  it('falls back to the default loot image when no loot image is configured', () => {
    const body = {
      setDisplaySize: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
    };
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.currentLevel = {
      lootSpawns: [{ id: 'loot-1', type: 'wallet', value: 10, cell: { x: 2, y: 4 } }],
    };
    scene.add = {
      ellipse: vi.fn(() => ({ setDepth: vi.fn().mockReturnThis() })),
      image: vi.fn(() => body),
    };
    scene.time = { now: 1250 };
    scene.refreshLevelInfo = vi.fn();
    scene.updateLootRenderDepth = vi.fn();
    scene.activeLoots = [];
    scene.droppedLootCount = 0;

    (scene.spawnLootAtEnemy as (enemy: { body: { x: number; y: number } }) => void)({
      body: { x: 300, y: 180 },
    });

    expect(scene.add.image).toHaveBeenCalledWith(300, 184, 'loot:money01.png');
  });

  it('creates deposit popups with Bungee font and larger sizes', () => {
    const destroy = vi.fn();
    const setOrigin = vi.fn().mockReturnThis();
    const setDepth = vi.fn().mockReturnThis();
    const popup = {
      y: 142,
      destroy,
      setOrigin,
      setDepth,
    };
    const addText = vi.fn(() => popup);
    const tweensAdd = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.playerBody = { x: 320, y: 220 };
    scene.add = { text: addText };
    scene.tweens = { add: tweensAdd };

    (scene.showDepositValuePopup as (value: number) => void)(20);

    expect(addText).toHaveBeenCalledWith(
      320,
      142,
      '+20 M Ft',
      expect.objectContaining({
        fontFamily: 'Bungee, Verdana, sans-serif',
        fontSize: '34px',
        color: '#80ed99',
      }),
    );
    expect(setOrigin).toHaveBeenCalledWith(0.5);
    expect(setDepth).toHaveBeenCalledWith(8);
    expect(tweensAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: popup,
        y: 88,
        alpha: 0,
      }),
    );
  });

  it('scales obstacle sprites with width and height caps while keeping aspect ratio', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    expect(
      (scene.getObstacleDisplaySize as (
        bounds: { x: number; y: number; width: number; height: number },
        textureSize: { width: number; height: number },
      ) => { width: number; height: number })({ x: 0, y: 0, width: 70, height: 74 }, { width: 768, height: 768 }),
    ).toEqual({ width: 84, height: 84 });

    const tallTextureSize = (scene.getObstacleDisplaySize as (
      bounds: { x: number; y: number; width: number; height: number },
      textureSize: { width: number; height: number },
    ) => { width: number; height: number })({ x: 0, y: 0, width: 70, height: 74 }, { width: 512, height: 1024 });

    expect(tallTextureSize.width).toBeCloseTo(59.2);
    expect(tallTextureSize.height).toBeCloseTo(118.4);
  });

  it('computes shared screen bounds for multi-cell HRS zones and places images outside the grid', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.gridSystem = {
      cellBounds: vi
        .fn()
        .mockReturnValueOnce({ x: 100, y: 200, width: 50, height: 40 })
        .mockReturnValueOnce({ x: 150, y: 210, width: 60, height: 45 }),
    };

    const zoneBounds = (scene.getGridCellsBounds as (cells: Array<{ x: number; y: number }>) => {
      x: number;
      y: number;
      width: number;
      height: number;
    })([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);

    expect(zoneBounds).toEqual({ x: 100, y: 200, width: 110, height: 55 });

    expect(
      (scene.getHrsPlacement as (
        bounds: { x: number; y: number; width: number; height: number },
        side: 'left' | 'right' | 'top' | 'bottom',
        offsetX?: number,
        offsetY?: number,
      ) => { x: number; y: number; originX: number; originY: number; depthY: number })(zoneBounds, 'left', -12, 6),
    ).toEqual({ x: 48.4, y: 261, originX: 1, originY: 1, depthY: 255 });

    expect(
      (scene.getHrsPlacement as (
        bounds: { x: number; y: number; width: number; height: number },
        side: 'left' | 'right' | 'top' | 'bottom',
        offsetX?: number,
        offsetY?: number,
      ) => { x: number; y: number; originX: number; originY: number; depthY: number })(zoneBounds, 'bottom', 0, 12),
    ).toEqual({ x: 155, y: 285.7, originX: 0.5, originY: 0, depthY: 255 });
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
      x: 70,
      y: 100,
      width: 60,
      height: 40,
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
    const showDepositValuePopup = vi.fn();
    const registryState = { score: 40 };
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.audioSystem = { playSfx };
    scene.refreshLevelInfo = refreshLevelInfo;
    scene.showDepositValuePopup = showDepositValuePopup;
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
    expect(showDepositValuePopup).toHaveBeenCalledWith(10);
    expect(scene.nextLootDepositAt).toBe(1800);

    (scene.depositInventory as (now: number) => void)(1800);
    expect(scene.inventory).toHaveLength(0);
    expect(registryState.score).toBe(100);
    expect(showDepositValuePopup).toHaveBeenCalledWith(50);
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

  it('plays the shared run animation and flips the hero sprite for left movement', () => {
    const play = vi.fn();
    const setFlipX = vi.fn();
    const setDisplaySize = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.heroAnimationDirection = 'right';
    scene.heroAnimationFlipX = true;
    scene.playerBody = { play, setFlipX, setDisplaySize };
    scene.anims = { exists: vi.fn(() => true) };

    (scene.updatePlayerMovementVisual as (isMoving: boolean) => void)(true);

    expect(setDisplaySize).toHaveBeenCalledWith(168, 168);
    expect(play).toHaveBeenCalledWith('hero-psz01-run-right-loop', true);
    expect(setFlipX).toHaveBeenCalledWith(true);
  });

  it('maps vertical movement to the up animation without mirroring', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    (scene.updateHeroAnimationDirection as (horizontal: number, vertical: number) => void)(0, -1);

    expect(scene.heroAnimationDirection).toBe('up');
    expect(scene.heroAnimationFlipX).toBe(false);
  });

  it('maps upper-left movement to the mirrored northeast animation', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    (scene.updateHeroAnimationDirection as (horizontal: number, vertical: number) => void)(-1, -1);

    expect(scene.heroAnimationDirection).toBe('northeast');
    expect(scene.heroAnimationFlipX).toBe(true);
  });

  it('plays the matching idle animation when movement stops', () => {
    const play = vi.fn();
    const setDisplaySize = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.heroAnimationDirection = 'southeast';
    scene.heroAnimationFlipX = true;
    scene.playerBody = {
      play,
      setDisplaySize,
    };
    scene.anims = { exists: vi.fn(() => true) };
    
    (scene.updatePlayerMovementVisual as (isMoving: boolean) => void)(false);

    expect(play).toHaveBeenCalledWith('hero-psz01-idle-southeast-loop', true);
    expect(setDisplaySize).toHaveBeenCalledWith(168, 168);
  });
});