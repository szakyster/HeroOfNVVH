import { beforeAll, describe, expect, it, vi } from 'vitest';
import { getGridCellsBounds, getHrsPlacement, getObstacleDisplaySize } from './playScene/PlaySceneWorld';
import { getDepositPopupColor, getLootHitbox, isPlayerInsideSanctuary } from './playScene/PlaySceneLoot';

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
    scene.scoreValueText = { setText: () => undefined };
    scene.inventorySlotImages = [{ setAlpha: () => undefined }];
    scene.escapedValueText = { setText: () => undefined };
    scene.waveValueText = { setText: () => undefined };
    scene.levelInfoText = { setText: () => undefined };
    scene.enemyInfoText = { setText: () => undefined };
    scene.musicToggleIcon = { setTint: () => undefined, clearTint: () => undefined, setAlpha: () => undefined };
    scene.sfxToggleIcon = { setTint: () => undefined, clearTint: () => undefined, setAlpha: () => undefined };
    scene.activeEnemies = [{ defeated: false }];
    scene.activeLoots = [{ id: 'loot-1' }];
    scene.inventory = [{ type: 'bag', value: 50 }];
    scene.droppedLootCount = 3;
    scene.nextLootDepositAt = 1200;
    scene.lastInventoryErrorAt = 400;
    scene.facingDirection = 'left';
    scene.heroAnimationDirection = 'right';
    scene.heroAnimationFlipX = true;
    scene.isAttackAnimating = true;
    scene.attackAnimationReleaseAt = 900;
    scene.attackAnimationEndAt = 1400;
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
    expect(scene.scoreValueText).toBeUndefined();
    expect(scene.inventorySlotImages).toEqual([]);
    expect(scene.escapedValueText).toBeUndefined();
    expect(scene.waveValueText).toBeUndefined();
    expect(scene.levelInfoText).toBeUndefined();
    expect(scene.enemyInfoText).toBeUndefined();
    expect(scene.musicToggleIcon).toBeUndefined();
    expect(scene.sfxToggleIcon).toBeUndefined();
    expect(scene.activeEnemies).toEqual([]);
    expect(scene.activeLoots).toEqual([]);
    expect(scene.inventory).toEqual([]);
    expect(scene.droppedLootCount).toBe(0);
    expect(scene.nextLootDepositAt).toBeNull();
    expect(scene.lastInventoryErrorAt).toBe(Number.NEGATIVE_INFINITY);
    expect(scene.facingDirection).toBe('down');
    expect(scene.heroAnimationDirection).toBe('down');
    expect(scene.heroAnimationFlipX).toBe(false);
    expect(scene.isAttackAnimating).toBe(false);
    expect(scene.attackAnimationReleaseAt).toBe(0);
    expect(scene.attackAnimationEndAt).toBe(0);
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
    const inventorySlotImages = Array.from({ length: 4 }, () => ({
      setAlpha: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
    }));
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
    scene.inventorySlotImages = inventorySlotImages;
    scene.escapedValueText = escapedValueText;
    scene.escapedValueBaseX = 430;
    scene.escapedValueBaseY = 63;
    scene.waveValueText = waveValueText;
    scene.inventory = [{ type: 'wallet', value: 10 }, { type: 'phone', value: 20 }];
    scene.waveNumber = 4;
    scene.tweens = { add: vi.fn() };

    (scene.refreshHud as () => void)();

    expect(scoreValueText.setText).toHaveBeenCalledWith('150 M Ft');
  expect(inventorySlotImages[0].setAlpha).toHaveBeenCalledWith(1);
  expect(inventorySlotImages[2].setTint).toHaveBeenCalledWith(0x7f7f7f);
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
    scene.inventorySlotImages = [];
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
    const inventorySlotImages = Array.from({ length: 4 }, () => ({
      setAlpha: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
    }));

    scene.inventory = [{ type: 'wallet', value: 10 }, { type: 'bag', value: 50 }, { type: 'phone', value: 20 }];

    scene.registry = { get: vi.fn((key: string) => (key === 'score' || key === 'escapedEnemies' ? 0 : undefined)) };
    scene.scoreValueText = { setText: vi.fn() };
    scene.inventorySlotImages = inventorySlotImages;
    scene.escapedValueText = { setText: vi.fn(), setColor: vi.fn(), setPosition: vi.fn(), x: 430, y: 63 };
    scene.escapedValueBaseX = 430;
    scene.escapedValueBaseY = 63;
    scene.waveValueText = { setText: vi.fn() };
    scene.tweens = { add: vi.fn() };
    scene.waveNumber = 1;

    (scene.refreshHud as () => void)();

  expect(inventorySlotImages[3].setTint).toHaveBeenCalledWith(0x7f7f7f);
    expect(getDepositPopupColor(10)).toBe('#8ecae6');
    expect(getDepositPopupColor(20)).toBe('#80ed99');
    expect(getDepositPopupColor(50)).toBe('#ffd166');
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
    expect(scene.activeLoots as unknown[]).toHaveLength(1);
    expect(updateLootRenderDepth).toHaveBeenCalledWith((scene.activeLoots as unknown[])[0]);
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

    expect((scene.add as { image: ReturnType<typeof vi.fn> }).image).toHaveBeenCalledWith(300, 184, 'loot:money01.png');
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

  it('creates score milestone popup fireworks and floating text', () => {
    const popupDestroy = vi.fn();
    const popupSetOrigin = vi.fn().mockReturnThis();
    const popupSetDepth = vi.fn().mockReturnThis();
    const popup = {
      y: 230.4,
      destroy: popupDestroy,
      setOrigin: popupSetOrigin,
      setDepth: popupSetDepth,
    };
    const sparkSetDepth = vi.fn().mockReturnThis();
    const flashSetDepth = vi.fn().mockReturnThis();
    const addText = vi.fn(() => popup);
    const addCircle = vi
      .fn()
      .mockImplementationOnce(() => ({ setDepth: flashSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: flashSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }))
      .mockImplementationOnce(() => ({ setDepth: sparkSetDepth, destroy: vi.fn() }));
    const tweensAdd = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.scale = { width: 800, height: 480 };
    scene.add = { text: addText, circle: addCircle };
    scene.tweens = { add: tweensAdd };

    (scene.showScoreMilestonePopup as (text: string) => void)('elso visszaszerzett milliard');

    expect(addText).toHaveBeenCalledTimes(1);
    const popupCall = addText.mock.calls[0];
    expect(popupCall).toBeDefined();
    const [popupX, popupY, popupLabel, popupStyle] = popupCall as unknown as [
      number,
      number,
      string,
      Record<string, unknown>,
    ];
    expect(popupX).toBe(400);
    expect(popupY).toBeCloseTo(230.4, 5);
    expect(popupLabel).toBe('elso visszaszerzett milliard');
    expect(popupStyle).toEqual(
      expect.objectContaining({
        fontFamily: 'Bungee, Verdana, sans-serif',
        fontSize: '58px',
        color: '#f4e6a2',
      }),
    );
    expect(popupSetOrigin).toHaveBeenCalledWith(0.5);
    expect(popupSetDepth).toHaveBeenCalledWith(9);
    expect(addCircle).toHaveBeenCalledTimes(22);
    const [leftFlash, rightFlash] = [addCircle.mock.calls[0], addCircle.mock.calls[11]];
    expect(leftFlash?.[0]).toBe(190);
    expect(leftFlash?.[1]).toBeCloseTo(254.4, 5);
    expect(leftFlash?.slice(2)).toEqual([18, 0xfff4b1, 0.95]);
    expect(rightFlash?.[0]).toBe(610);
    expect(rightFlash?.[1]).toBeCloseTo(222.4, 5);
    expect(rightFlash?.slice(2)).toEqual([18, 0xfff4b1, 0.95]);
    expect(tweensAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: popup,
        y: 120.4,
        alpha: 0,
        duration: 4950,
      }),
    );
  });

  it('scales obstacle sprites with width and height caps while keeping aspect ratio', () => {
    expect(
      getObstacleDisplaySize({ x: 0, y: 0, width: 70, height: 74 }, { width: 768, height: 768 }, 1.2, 1.6),
    ).toEqual({ width: 84, height: 84 });

    const tallTextureSize = getObstacleDisplaySize(
      { x: 0, y: 0, width: 70, height: 74 },
      { width: 512, height: 1024 },
      1.2,
      1.6,
    );

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

    const zoneBounds = getGridCellsBounds(scene.gridSystem as never, [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
    ]);

    expect(zoneBounds).toEqual({ x: 100, y: 200, width: 110, height: 55 });

    expect(getHrsPlacement(zoneBounds, 'left', -12, 6)).toEqual({
      x: 48.4,
      y: 261,
      originX: 1,
      originY: 1,
      depthY: 255,
    });

    expect(getHrsPlacement(zoneBounds, 'bottom', 0, 12)).toEqual({
      x: 155,
      y: 285.7,
      originX: 0.5,
      originY: 0,
      depthY: 255,
    });
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

    expect(getLootHitbox(100, 120, { width: 60, height: 40 })).toEqual({
      x: 70,
      y: 100,
      width: 60,
      height: 40,
    });

    expect(
      isPlayerInsideSanctuary(
        {
          x: 24,
          y: 24,
          width: 8,
          height: 8,
        },
        scene.sanctuaryRects as never,
        scene.collisionProvider as never,
      ),
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

  it('animates a bag icon into the inventory HUD when loot is picked up', () => {
    const playSfx = vi.fn();
    const destroyLoot = vi.fn();
    const refreshLevelInfo = vi.fn();
    const setDisplaySize = vi.fn().mockReturnThis();
    const setDepth = vi.fn().mockReturnThis();
    const setAlpha = vi.fn().mockReturnThis();
    const destroy = vi.fn();
    const pickupIcon = { setDisplaySize, setDepth, setAlpha, destroy };
    const tweensAdd = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.audioSystem = { playSfx };
    scene.destroyLoot = destroyLoot;
    scene.refreshLevelInfo = refreshLevelInfo;
    scene.inventory = [];
    scene.inventorySlotImages = [{ x: 240, y: 80 }];
    scene.add = { image: vi.fn(() => pickupIcon) };
    scene.tweens = { add: tweensAdd };

    (scene.pickUpLoot as (loot: { body: { x: number; y: number }; type: string; value: number }) => void)({
      body: { x: 320, y: 200 },
      type: 'wallet',
      value: 20,
    });

    expect(scene.inventory).toEqual([{ type: 'wallet', value: 20 }]);
    expect(playSfx).toHaveBeenCalledWith('sfx-pickup');
    expect((scene.add as { image: ReturnType<typeof vi.fn> }).image).toHaveBeenCalledWith(320, 200, 'ui:bag01.png');
    expect(setDisplaySize).toHaveBeenCalledWith(28, 28);
    expect(setDepth).toHaveBeenCalledWith(8);
    expect(setAlpha).toHaveBeenCalledWith(1);
    expect(tweensAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: pickupIcon,
        x: 256,
        y: 80,
        alpha: 0.9,
        duration: 650,
        ease: 'Cubic.easeInOut',
      }),
    );
    expect(destroyLoot).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'wallet', value: 20 }),
      false,
    );
    expect(refreshLevelInfo).toHaveBeenCalledTimes(1);
  });

  it('deposits inventory over time and updates score and info state', () => {
    const playSfx = vi.fn();
    const refreshLevelInfo = vi.fn();
    const showDepositValuePopup = vi.fn();
    const showScoreMilestonePopup = vi.fn();
    const registryState = { score: 40 };
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.audioSystem = { playSfx };
    scene.refreshLevelInfo = refreshLevelInfo;
    scene.showDepositValuePopup = showDepositValuePopup;
    scene.showScoreMilestonePopup = showScoreMilestonePopup;
    scene.currentLevel = { scoreMilestones: [{ score: 100, text: 'elso visszaszerzett milliard' }] };
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
    expect(showScoreMilestonePopup).toHaveBeenCalledWith('elso visszaszerzett milliard');
    expect(scene.nextLootDepositAt).toBeNull();
    expect(refreshLevelInfo).toHaveBeenCalledTimes(2);
  });

  it('shows each score milestone only once', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;
    const showScoreMilestonePopup = vi.fn();

    scene.currentLevel = {
      scoreMilestones: [
        { score: 100, text: 'elso visszaszerzett milliard' },
        { score: 200, text: 'masodik merfoldko' },
      ],
    };
    scene.showScoreMilestonePopup = showScoreMilestonePopup;

    (scene.showScoreMilestones as (previousScore: number, nextScore: number) => void)(90, 110);
    (scene.showScoreMilestones as (previousScore: number, nextScore: number) => void)(110, 150);
    (scene.showScoreMilestones as (previousScore: number, nextScore: number) => void)(150, 210);

    expect(showScoreMilestonePopup).toHaveBeenNthCalledWith(1, 'elso visszaszerzett milliard');
    expect(showScoreMilestonePopup).toHaveBeenNthCalledWith(2, 'masodik merfoldko');
    expect(showScoreMilestonePopup).toHaveBeenCalledTimes(2);
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

  it('starts the full injured animation on hit and keeps the enemy alive until it finishes', () => {
    const playSfx = vi.fn();
    const applyEnemyKnockback = vi.fn();
    const spawnLootAtEnemy = vi.fn();
    const defeatEnemy = vi.fn();
    const play = vi.fn();
    const setFlipX = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;
    const enemy = {
      body: { x: 144, y: 188, play, setFlipX },
      shadow: {},
      path: [],
      pathIndex: 0,
      speed: 88,
      health: 2,
      lootDropped: false,
      escaped: false,
      defeated: false,
      animationDirection: 'up',
      animationFlipX: true,
      injuryAnimationUntil: null,
    };

    scene.attackRect = { x: 0, y: 0, width: 64, height: 64 };
    scene.time = { now: 1000 };
    scene.audioSystem = { playSfx };
    scene.collisionProvider = { intersects: vi.fn(() => true) };
    scene.anims = { exists: vi.fn(() => true) };
    scene.activeEnemies = [enemy];
    scene.applyEnemyKnockback = applyEnemyKnockback;
    scene.spawnLootAtEnemy = spawnLootAtEnemy;
    scene.defeatEnemy = defeatEnemy;

    (scene.checkAttackHits as () => void)();

    expect(playSfx).toHaveBeenCalledWith('sfx-hit');
    expect(applyEnemyKnockback).toHaveBeenCalledWith(enemy);
    expect(spawnLootAtEnemy).toHaveBeenCalledWith(enemy);
    expect(defeatEnemy).not.toHaveBeenCalled();
    expect(enemy.health).toBe(1);
    expect(enemy.lootDropped).toBe(true);
    expect(enemy.injuryAnimationUntil).toBeCloseTo(2333.333, 2);
    expect(play).toHaveBeenCalledWith('enemy-01-injured-up-once', false);
    expect(setFlipX).toHaveBeenCalledWith(true);
  });

  it('defeats the enemy immediately when its remaining health reaches zero', () => {
    const applyEnemyKnockback = vi.fn();
    const spawnLootAtEnemy = vi.fn();
    const defeatEnemy = vi.fn();
    const play = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;
    const enemy = {
      body: { x: 144, y: 188, play },
      shadow: {},
      path: [],
      pathIndex: 0,
      speed: 88,
      health: 1,
      lootDropped: true,
      escaped: false,
      defeated: false,
      animationDirection: 'right',
      animationFlipX: false,
      injuryAnimationUntil: 1800,
    };

    scene.attackRect = { x: 0, y: 0, width: 64, height: 64 };
    scene.time = { now: 1200 };
    scene.audioSystem = { playSfx: vi.fn() };
    scene.collisionProvider = { intersects: vi.fn(() => true) };
    scene.anims = { exists: vi.fn(() => true) };
    scene.activeEnemies = [enemy];
    scene.applyEnemyKnockback = applyEnemyKnockback;
    scene.spawnLootAtEnemy = spawnLootAtEnemy;
    scene.defeatEnemy = defeatEnemy;

    (scene.checkAttackHits as () => void)();

    expect(defeatEnemy).toHaveBeenCalledWith(enemy);
    expect(applyEnemyKnockback).not.toHaveBeenCalled();
    expect(spawnLootAtEnemy).not.toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });

  it('spawns the player at sanctuary and updates visibility', () => {
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

    (scene.spawnPlayer as (level: Record<string, unknown>) => void)({
      sanctuaryZone: [{ x: 3, y: 4 }],
      spawnZones: [{ cells: [{ x: 0, y: 0 }] }],
    });

    expect(playerBody.setPosition).toHaveBeenCalledWith(320, 216);
    expect(playerBody.setVisible).toHaveBeenCalledWith(true);
    expect(playerShadow.setPosition).toHaveBeenCalledWith(320, 270);
    expect(playerShadow.setVisible).toHaveBeenCalledWith(true);
  });

  it('moves the player along the grid only when the next position is valid and unobstructed', () => {
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

  it('pauses enemy movement while the injured animation is still running', () => {
    const setPosition = vi.fn();
    const shadowSetPosition = vi.fn();
    const updateEnemyMovementVisual = vi.fn();
    const updateEnemyRenderDepth = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;
    const enemy = {
      body: { x: 120, y: 140, setPosition, destroy: vi.fn() },
      shadow: { setPosition: shadowSetPosition, destroy: vi.fn() },
      path: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      pathIndex: 0,
      speed: 88,
      health: 1,
      lootDropped: true,
      escaped: false,
      defeated: false,
      animationDirection: 'down',
      animationFlipX: false,
      injuryAnimationUntil: 1500,
    };

    scene.gridSystem = {
      cellCenter: vi.fn(() => ({ x: 240, y: 180 })),
    };
    scene.time = { now: 1200 };
    scene.activeEnemies = [enemy];
    scene.isGameOver = false;
    scene.updateEnemyMovementVisual = updateEnemyMovementVisual;
    scene.updateEnemyRenderDepth = updateEnemyRenderDepth;

    (scene.updateEnemies as (delta: number) => void)(16);

    expect(updateEnemyMovementVisual).not.toHaveBeenCalled();
    expect(setPosition).not.toHaveBeenCalled();
    expect(shadowSetPosition).not.toHaveBeenCalled();
    expect(updateEnemyRenderDepth).not.toHaveBeenCalled();
    expect(scene.activeEnemies).toEqual([enemy]);
  });

  it('resumes enemy movement after the injured animation finishes', () => {
    const setPosition = vi.fn();
    const shadowSetPosition = vi.fn();
    const updateEnemyMovementVisual = vi.fn();
    const updateEnemyRenderDepth = vi.fn();
    const scene = new PlayScene() as unknown as Record<string, unknown>;
    const enemy = {
      body: { x: 120, y: 140, setPosition, destroy: vi.fn() },
      shadow: { setPosition: shadowSetPosition, destroy: vi.fn() },
      path: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
      pathIndex: 0,
      speed: 88,
      health: 1,
      lootDropped: true,
      escaped: false,
      defeated: false,
      animationDirection: 'down',
      animationFlipX: false,
      injuryAnimationUntil: 1500,
    };

    scene.gridSystem = {
      cellCenter: vi.fn(() => ({ x: 240, y: 180 })),
    };
    scene.time = { now: 1600 };
    scene.activeEnemies = [enemy];
    scene.isGameOver = false;
    scene.updateEnemyMovementVisual = updateEnemyMovementVisual;
    scene.updateEnemyRenderDepth = updateEnemyRenderDepth;

    (scene.updateEnemies as (delta: number) => void)(16);

    expect(enemy.injuryAnimationUntil).toBeNull();
    expect(updateEnemyMovementVisual).toHaveBeenCalledTimes(1);
    expect(setPosition).toHaveBeenCalledTimes(1);
    expect(shadowSetPosition).toHaveBeenCalledTimes(1);
    expect(updateEnemyRenderDepth).toHaveBeenCalledWith(enemy);
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

  it('starts the punch animation with mirrored right frames for left attacks', () => {
    const play = vi.fn();
    const setFlipX = vi.fn();
    const setDisplaySize = vi.fn();
    const playSfx = vi.fn();
    let delayedImpact: (() => void) | undefined;
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.playerBody = { x: 320, y: 216, play, setFlipX, setDisplaySize };
    scene.playerShadow = { x: 320, y: 270 };
    scene.time = {
      now: 1000,
      delayedCall: vi.fn((delay: number, callback: () => void) => {
        expect(delay).toBeCloseTo(83.333, 2);
        delayedImpact = callback;
      }),
    };
    scene.audioSystem = { playSfx };
    scene.facingDirection = 'left';
    scene.anims = { exists: vi.fn(() => true) };
    scene.activeEnemies = [];

    (scene.performAttack as () => void)();

    expect(playSfx).toHaveBeenCalledWith('sfx-attack');
    expect(play).toHaveBeenCalledWith('hero-psz01-punch-right-loop', false);
    expect(setFlipX).toHaveBeenCalledWith(true);
    expect(setDisplaySize).toHaveBeenCalledWith(168, 168);
    expect(scene.isAttackAnimating).toBe(true);
    expect(scene.attackAnimationReleaseAt).toBeCloseTo(1500, 2);
    expect(scene.attackAnimationEndAt).toBeCloseTo(2166.667, 2);
    expect(scene.attackVisualUntil).toBeCloseTo(1203.333, 2);
    expect(scene.attackRect).toBeNull();

    delayedImpact?.();

    expect(scene.attackRect).not.toBeNull();
  });

  it('blocks movement while the punch animation is still locked', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.isGameOver = false;
    scene.playerBody = { visible: true, x: 320, y: 216 };
    scene.playerShadow = { x: 320, y: 270 };
    scene.gridSystem = {};
    scene.playerHitboxDebug = {};
    scene.renderPlayerHitbox = vi.fn();
    scene.updateEnemies = vi.fn();
    scene.updateLoots = vi.fn();
    scene.renderAttackEffect = vi.fn();
    scene.tryMovePlayerAlongGrid = vi.fn();
    scene.updatePlayerMovementVisual = vi.fn();
    scene.cursors = {
      left: { isDown: true },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false },
    };
    scene.time = { now: 1200 };
    scene.isAttackAnimating = true;
    scene.attackAnimationReleaseAt = 1300;
    scene.attackAnimationEndAt = 2000;

    (scene.update as (_time: number, delta: number) => void)(0, 16);

    expect(scene.tryMovePlayerAlongGrid).not.toHaveBeenCalled();
    expect(scene.updatePlayerMovementVisual).not.toHaveBeenCalled();
  });

  it('switches from punch to run after the release frame when movement is held', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.isGameOver = false;
    scene.playerBody = { visible: true, x: 320, y: 216 };
    scene.playerShadow = { x: 320, y: 270 };
    scene.gridSystem = {};
    scene.playerHitboxDebug = {};
    scene.renderPlayerHitbox = vi.fn();
    scene.updateEnemies = vi.fn();
    scene.updateLoots = vi.fn();
    scene.renderAttackEffect = vi.fn();
    scene.tryMovePlayerAlongGrid = vi.fn();
    scene.updatePlayerMovementVisual = vi.fn();
    scene.cursors = {
      left: { isDown: true },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false },
    };
    scene.time = { now: 1400 };
    scene.isAttackAnimating = true;
    scene.attackAnimationReleaseAt = 1300;
    scene.attackAnimationEndAt = 2000;

    (scene.update as (_time: number, delta: number) => void)(0, 100);

    expect(scene.isAttackAnimating).toBe(false);
    expect(scene.updatePlayerMovementVisual).toHaveBeenCalledWith(true);
    expect(scene.tryMovePlayerAlongGrid).toHaveBeenNthCalledWith(1, -22, 0);
    expect(scene.tryMovePlayerAlongGrid).toHaveBeenNthCalledWith(2, 0, 0);
  });

  it('returns to idle when the punch animation ends without follow-up input', () => {
    const scene = new PlayScene() as unknown as Record<string, unknown>;

    scene.isGameOver = false;
    scene.playerBody = { visible: true, x: 320, y: 216 };
    scene.playerShadow = { x: 320, y: 270 };
    scene.gridSystem = {};
    scene.playerHitboxDebug = {};
    scene.renderPlayerHitbox = vi.fn();
    scene.updateEnemies = vi.fn();
    scene.updateLoots = vi.fn();
    scene.renderAttackEffect = vi.fn();
    scene.updatePlayerMovementVisual = vi.fn();
    scene.cursors = {
      left: { isDown: false },
      right: { isDown: false },
      up: { isDown: false },
      down: { isDown: false },
    };
    scene.time = { now: 2400 };
    scene.isAttackAnimating = true;
    scene.attackAnimationReleaseAt = 1300;
    scene.attackAnimationEndAt = 2000;

    (scene.update as (_time: number, delta: number) => void)(0, 16);

    expect(scene.isAttackAnimating).toBe(false);
    expect(scene.updatePlayerMovementVisual).toHaveBeenCalledWith(false);
  });
});