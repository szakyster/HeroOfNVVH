import Phaser from 'phaser';
import type { LevelData } from '../types/level';
import { GridSystem } from '../systems/GridSystem';
import type { CollisionRect } from '../systems/ICollisionProvider';
import { AStarPathfinder } from '../systems/AStarPathfinder';
import {
  createAttackRect,
  DEFAULT_ATTACK_CONFIG,
  getKnockbackDelta,
  type FacingDirection,
} from '../systems/AttackSystem';
import {
  AUDIO_KEYS,
  AUDIO_SETTINGS_KEYS,
  applyAudioSettingsFromRegistry,
  AudioSystem,
  DEATH_AUDIO_KEYS,
  getAudioSystem,
} from '../systems/AudioSystem';
import { LevelLoader } from '../systems/LevelLoader';
import {
  DEFAULT_LOOT_CONFIG,
  getLootAlpha,
  isInventoryFull,
  isLootExpired,
} from '../systems/LootSystem';
import { DEFAULT_LOOT_IMAGE_NAME, getLootAssetKey } from '../systems/LootAssets';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { SimpleCollisionProvider } from '../systems/SimpleCollisionProvider';
import {
  createPlaySceneHud,
  createPlaySceneStatusTexts,
  formatEnemyInfoText,
  formatLevelInfoText,
  syncAudioToggleTexts,
  formatPlaySceneHudValues,
  syncEscapedEnemyWarningState,
} from './PlaySceneHud';
import {
  ActiveEnemy,
  buildEnemyPath,
  ENEMY_ANIMATION_DIRECTIONS,
  ENEMY_ANIMATION_FRAME_RATE,
  ENEMY_SHEET_FRAME_COUNT,
  getEnemyAnimationKey,
  getEnemyMovementVisualState,
  getEnemySheetKey,
  isEnemyInjuryActive,
  startEnemyInjuryAnimation,
  updateActiveEnemies,
  type EnemyAnimationState,
} from './PlaySceneEnemies';
import {
  type ActiveLoot,
  getDepositPopupColor,
  getLootHitbox,
  isPlayerInsideSanctuary,
  processInventoryDeposit,
  shouldPlayInventoryError,
  type InventoryItem,
} from './PlaySceneLoot';
import {
  drawHrsImages,
  drawObstacleCells,
  drawSanctuaryZone,
  getLevelObstacleCells,
} from './PlaySceneWorld';
import { SCENE_KEYS } from './sceneKeys';
const DEPOSIT_POPUP_FONT_FAMILY = 'Bungee, Verdana, sans-serif';
const HERO_ANIMATION_FRAME_RATE = 12;
const HERO_SPRITE_DISPLAY_SIZE = 168;
const HERO_SHEET_FRAME_COUNT = 16;
const HERO_PUNCH_START_FRAME = 2;
const HERO_ATTACK_RELEASE_FRAME = 8;
const HERO_ATTACK_HIT_DELAY_MS = (1 / HERO_ANIMATION_FRAME_RATE) * 1000;
const HERO_ATTACK_MIN_DURATION_MS =
  ((HERO_ATTACK_RELEASE_FRAME - HERO_PUNCH_START_FRAME) / HERO_ANIMATION_FRAME_RATE) * 1000;
const HERO_ATTACK_ANIMATION_DURATION_MS =
  ((HERO_SHEET_FRAME_COUNT - HERO_PUNCH_START_FRAME) / HERO_ANIMATION_FRAME_RATE) * 1000;
const HERO_LOOP_ANIMATION_STATES = ['idle', 'run'] as const;
const HERO_LOOP_ANIMATION_DIRECTIONS = ['down', 'northeast', 'right', 'southeast', 'up'] as const;
const HERO_PUNCH_ANIMATION_DIRECTIONS = ['down', 'right', 'up'] as const;

type HeroLoopAnimationState = (typeof HERO_LOOP_ANIMATION_STATES)[number];
type HeroLoopAnimationDirection = (typeof HERO_LOOP_ANIMATION_DIRECTIONS)[number];
type HeroPunchAnimationDirection = (typeof HERO_PUNCH_ANIMATION_DIRECTIONS)[number];
type HeroAnimationState = HeroLoopAnimationState | 'punch';
type HeroAnimationDirection = HeroLoopAnimationDirection | HeroPunchAnimationDirection;

function getHeroSheetKey(state: HeroAnimationState, direction: HeroAnimationDirection): string {
  return `hero-psz01-${state}-${direction}`;
}

function getHeroAnimationKey(state: HeroAnimationState, direction: HeroAnimationDirection): string {
  return `${getHeroSheetKey(state, direction)}-loop`;
}

export class PlayScene extends Phaser.Scene {
  private readonly levelPath = `${import.meta.env.BASE_URL}levels/level-01.json`;

  private readonly handleDebugGameOver = () => {
    this.triggerGameOver();
  };

  private readonly levelLoader = new LevelLoader();

  private readonly collisionProvider = new SimpleCollisionProvider();

  private readonly pathfinder = new AStarPathfinder();

  private readonly playerSpeed = 220;

  private readonly enemySpeed = 88;

  private readonly playerHitboxSize = { width: 66, height: 36 };

  private readonly playerHitboxOffsetY = 27.1;

  private readonly playerSpriteDisplaySize = HERO_SPRITE_DISPLAY_SIZE;

  private readonly enemyHitboxSize = { width: 42, height: 26 };

  private readonly enemyHitboxOffsetY = 20;

  private readonly enemySpriteDisplayHeight = 98;

  private readonly attackCooldownMs = 420;

  private readonly attackDurationMs = 120;

  private readonly maxEscapedEnemies = 10;

  private readonly lootSize = { width: 60, height: 40 };

  private readonly lootDepositIntervalMs = 400;

  private readonly obstacleSpriteMaxWidthScale = 1.2;

  private readonly obstacleSpriteMaxHeightScale = 1.6;

  private readonly hrsSpriteMaxWidthScale = 1.95;

  private readonly hrsSpriteMaxHeightScale = 2.3;

  private gridSystem?: GridSystem;

  private currentLevel?: LevelData;

  private obstacleRects: CollisionRect[] = [];

  private sanctuaryRects: CollisionRect[] = [];

  private playerBody?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Ellipse;

  private playerShadow?: Phaser.GameObjects.Ellipse;

  private enemyHitboxDebug?: Phaser.GameObjects.Graphics;

  private scoreValueText?: Phaser.GameObjects.Text;

  private inventoryValueText?: Phaser.GameObjects.Text;

  private escapedValueText?: Phaser.GameObjects.Text;

  private escapedValueWarningTween?: Phaser.Tweens.Tween;

  private escapedValueBaseX?: number;

  private escapedValueBaseY?: number;

  private waveValueText?: Phaser.GameObjects.Text;

  private levelInfoText?: Phaser.GameObjects.Text;

  private enemyInfoText?: Phaser.GameObjects.Text;

  private musicToggleText?: Phaser.GameObjects.Text;

  private sfxToggleText?: Phaser.GameObjects.Text;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private keyW?: Phaser.Input.Keyboard.Key;

  private keyA?: Phaser.Input.Keyboard.Key;

  private keyS?: Phaser.Input.Keyboard.Key;

  private keyD?: Phaser.Input.Keyboard.Key;

  private keySpace?: Phaser.Input.Keyboard.Key;

  private activeEnemies: ActiveEnemy[] = [];

  private activeLoots: ActiveLoot[] = [];

  private inventory: InventoryItem[] = [];

  private droppedLootCount = 0;

  private nextLootDepositAt: number | null = null;

  private lastInventoryErrorAt = Number.NEGATIVE_INFINITY;

  private readonly inventoryErrorCooldownMs = 250;

  private audioSystem?: AudioSystem;

  private facingDirection: FacingDirection = 'down';

  private heroAnimationDirection: HeroLoopAnimationDirection = 'down';

  private heroAnimationFlipX = false;

  private isAttackAnimating = false;

  private attackAnimationReleaseAt = 0;

  private attackAnimationEndAt = 0;

  private attackRect: CollisionRect | null = null;

  private attackVisualUntil = 0;

  private lastAttackAt = Number.NEGATIVE_INFINITY;

  private isGameOver = false;

  private waveNumber = 1;

  private spawnedEnemies = 0;

  private get targetEnemyCount(): number {
    return Math.min(Math.floor(this.waveNumber * 0.4 + 1), 8);
  }

  constructor() {
    super(SCENE_KEYS.PLAY);
  }

  create(): void {
    const { width, height } = this.scale;
    this.resetRuntimeState();
    this.audioSystem = getAudioSystem(this);
    applyAudioSettingsFromRegistry(this);
    this.audioSystem.playMusic(AUDIO_KEYS.AMBIENT, true);
    this.gridSystem = new GridSystem({
      columns: 7,
      rows: 6,
      centerX: width / 2,
      centerY: height / 2,
      topWidth: width * 0.52,
      bottomWidth: width * 0.7,
      totalHeight: height * 0.7,
    });
    this.createBackground(width, height);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.registry.set('score', 0);
    this.registry.set('escapedEnemies', 0);

    this.createHud(width, height);
    this.refreshHud();

    const statusRefs = createPlaySceneStatusTexts(this, width, height, {
      onMusicToggle: () => {
        const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED));
        this.registry.set(AUDIO_SETTINGS_KEYS.MUSIC_MUTED, nextValue);
        this.audioSystem?.setMusicMuted(nextValue);
        this.refreshAudioToggleTexts();
      },
      onSfxToggle: () => {
        const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED));
        this.registry.set(AUDIO_SETTINGS_KEYS.SFX_MUTED, nextValue);
        this.audioSystem?.setSfxMuted(nextValue);
        this.refreshAudioToggleTexts();
      },
    });
    this.levelInfoText = statusRefs.levelInfoText;
    this.enemyInfoText = statusRefs.enemyInfoText;
    this.musicToggleText = statusRefs.musicToggleText;
    this.sfxToggleText = statusRefs.sfxToggleText;
    this.refreshAudioToggleTexts();

    const graphics = this.add.graphics();
    graphics.setDepth(1);

    graphics.lineStyle(2, 0xb8d8d8, 0.78);
    for (const cell of this.gridSystem.allCells()) {
      const polygon = this.gridSystem.cellPolygon(cell);
      graphics.fillStyle((cell.x + cell.y) % 2 === 0 ? 0x355c5d : 0x406f70, 0.48);
      graphics.beginPath();
      graphics.moveTo(polygon[0].x, polygon[0].y);
      graphics.lineTo(polygon[1].x, polygon[1].y);
      graphics.lineTo(polygon[2].x, polygon[2].y);
      graphics.lineTo(polygon[3].x, polygon[3].y);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
    }

    this.playerShadow = this.add.ellipse(0, 0, 72, 30, 0x111111, 0.35).setDepth(2);
    this.createHeroAnimations();
    this.createEnemyAnimations();
    this.playerBody = this.createPlayerBody();
    // DEBUG: Keep hitboxes visible during development. Remove before release build.
    this.enemyHitboxDebug = this.add.graphics().setDepth(4);
    this.playerShadow.setVisible(false);
    this.playerBody.setVisible(false);

    this.levelLoader
      .load(this.levelPath)
      .then((level) => {
        this.currentLevel = level;
        this.obstacleRects = getLevelObstacleCells(level).map((cell) => this.gridSystem!.cellBounds(cell, 10));
        this.sanctuaryRects = level.sanctuaryZone.map((cell) => this.gridSystem!.cellBounds(cell, 10));
        drawObstacleCells({
          scene: this,
          gridSystem: this.gridSystem!,
          level,
          obstacleSpriteMaxWidthScale: this.obstacleSpriteMaxWidthScale,
          obstacleSpriteMaxHeightScale: this.obstacleSpriteMaxHeightScale,
          getGameplayDepth: (worldY) => this.getGameplayDepth(worldY),
        });
        drawSanctuaryZone(this, this.gridSystem!, level.sanctuaryZone);
        drawHrsImages({
          scene: this,
          gridSystem: this.gridSystem!,
          level,
          hrsSpriteMaxWidthScale: this.hrsSpriteMaxWidthScale,
          hrsSpriteMaxHeightScale: this.hrsSpriteMaxHeightScale,
          getGameplayDepth: (worldY) => this.getGameplayDepth(worldY),
        });
        this.spawnPlayer(level);
        this.startEnemyWave(level);
        this.refreshLevelInfo();
      })
      .catch((error: unknown) => {
        this.levelInfoText?.setText('Palyabetoltes hiba');
        console.error('Level loading failed', error);
      });

    this.input.keyboard?.off('keydown-G', this.handleDebugGameOver, this);
    this.input.keyboard?.on('keydown-G', this.handleDebugGameOver, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-G', this.handleDebugGameOver, this);
    });
  }

  private resetRuntimeState(): void {
    this.currentLevel = undefined;
    this.obstacleRects = [];
    this.sanctuaryRects = [];
    this.playerBody = undefined;
    this.playerShadow = undefined;
    this.enemyHitboxDebug = undefined;
    this.scoreValueText = undefined;
    this.inventoryValueText = undefined;
    this.escapedValueText = undefined;
    this.escapedValueWarningTween?.stop();
    this.escapedValueWarningTween = undefined;
    this.escapedValueBaseX = undefined;
    this.escapedValueBaseY = undefined;
    this.waveValueText = undefined;
    this.levelInfoText = undefined;
    this.enemyInfoText = undefined;
    this.musicToggleText = undefined;
    this.sfxToggleText = undefined;
    this.activeEnemies = [];
    this.activeLoots = [];
    this.inventory = [];
    this.droppedLootCount = 0;
    this.nextLootDepositAt = null;
    this.lastInventoryErrorAt = Number.NEGATIVE_INFINITY;
    this.facingDirection = 'down';
    this.heroAnimationDirection = 'down';
    this.heroAnimationFlipX = false;
    this.isAttackAnimating = false;
    this.attackAnimationReleaseAt = 0;
    this.attackAnimationEndAt = 0;
    this.attackRect = null;
    this.attackVisualUntil = 0;
    this.lastAttackAt = Number.NEGATIVE_INFINITY;
    this.isGameOver = false;
    this.waveNumber = 1;
    this.spawnedEnemies = 0;
  }

  private createBackground(width: number, height: number): void {
    addSceneBackground(this, 'play');
    this.add.ellipse(width * 0.18, height * 0.14, width * 0.45, height * 0.18, 0x2f5d62, 0.2).setDepth(0.1);
    this.add.ellipse(width * 0.82, height * 0.22, width * 0.4, height * 0.16, 0x3a6b6f, 0.18).setDepth(0.1);

    const atmosphere = this.add.graphics();
    atmosphere.setDepth(5.5);
    //atmosphere.fillStyle(0x1d4d4f, 0.35);
    //atmosphere.fillRoundedRect(18, 18, width - 36, 92, 24);
    atmosphere.fillStyle(0x10252d, 0.62);
    atmosphere.fillRoundedRect(16, height - 80, width - 396, 70, 18);
    //atmosphere.fillStyle(0x4d6a6d, 0.22);
    //atmosphere.fillRect(width * 0.08, height * 0.74, width * 0.84, height * 0.12);
  }

  private createHud(width: number, _height: number): void {
    const hudRefs = createPlaySceneHud(this, width);

    this.scoreValueText = hudRefs.scoreValueText;
    this.inventoryValueText = hudRefs.inventoryValueText;
    this.escapedValueText = hudRefs.escapedValueText;
    this.escapedValueBaseX = hudRefs.escapedValueBaseX;
    this.escapedValueBaseY = hudRefs.escapedValueBaseY;
    this.waveValueText = hudRefs.waveValueText;
  }

  private refreshAudioToggleTexts(): void {
    syncAudioToggleTexts(
      {
        musicToggleText: this.musicToggleText,
        sfxToggleText: this.sfxToggleText,
      },
      {
        musicMuted: Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED)),
        sfxMuted: Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED)),
      },
    );
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) {
      return;
    }

    if (!this.playerBody || !this.playerShadow || !this.gridSystem) {
      return;
    }

    if (!this.playerBody.visible) {
      return;
    }

    const now = this.time.now;

    this.updateEnemies(delta);
    this.updateLoots();
    this.renderEnemyHitboxes();
    this.updateAttackState(now);

    let horizontal = 0;
    let vertical = 0;

    if (this.cursors?.left.isDown || this.keyA?.isDown) {
      horizontal -= 1;
      this.facingDirection = 'left';
    }
    if (this.cursors?.right.isDown || this.keyD?.isDown) {
      horizontal += 1;
      this.facingDirection = 'right';
    }
    if (this.cursors?.up.isDown || this.keyW?.isDown) {
      vertical -= 1;
      this.facingDirection = 'up';
    }
    if (this.cursors?.down.isDown || this.keyS?.isDown) {
      vertical += 1;
      this.facingDirection = 'down';
    }

    const wantsToMove = horizontal !== 0 || vertical !== 0;
    const wantsToAttack = Boolean(this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace));

    if (this.isAttackAnimating) {
      if (wantsToAttack && this.canInterruptAttackAnimation(now)) {
        this.performAttack();
        return;
      }

      if (!this.canInterruptAttackAnimation(now)) {
        return;
      }

      if (wantsToMove) {
        const direction = new Phaser.Math.Vector2(horizontal, vertical).normalize();
        const distance = (this.playerSpeed * delta) / 1000;

        this.stopAttackAnimation();
        this.updateHeroAnimationDirection(horizontal, vertical);
        this.updatePlayerMovementVisual(true);

        this.tryMovePlayerAlongGrid(direction.x * distance, 0);
        this.tryMovePlayerAlongGrid(0, direction.y * distance);
        return;
      }

      if (now >= this.attackAnimationEndAt) {
        this.stopAttackAnimation();
        this.updatePlayerMovementVisual(false);
      }

      return;
    }

    if (wantsToAttack) {
      this.performAttack();
      return;
    }

    if (wantsToMove) {
      const direction = new Phaser.Math.Vector2(horizontal, vertical).normalize();
      const distance = (this.playerSpeed * delta) / 1000;

      this.updateHeroAnimationDirection(horizontal, vertical);
      this.updatePlayerMovementVisual(true);

      this.tryMovePlayerAlongGrid(direction.x * distance, 0);
      this.tryMovePlayerAlongGrid(0, direction.y * distance);
      return;
    }

    this.updatePlayerMovementVisual(false);
  }

  private spawnPlayer(level: LevelData): void {
    const startCell = level.sanctuaryZone[0] ?? level.spawnZones[0]?.cells[0];
    if (!startCell || !this.playerBody || !this.playerShadow) {
      return;
    }

    const center = this.gridSystem!.cellCenter(startCell);
    this.playerBody.setPosition(center.x, center.y - 24).setVisible(true);
    this.playerShadow.setPosition(center.x, center.y + 30).setVisible(true);
    this.updatePlayerRenderDepth();
  }

  private startEnemyWave(level: LevelData): void {
    const waveWindow = 12_000;
    const count = this.targetEnemyCount;

    this.spawnedEnemies = 0;
    this.refreshEnemyInfo(count);

    for (let i = 0; i < count; i++) {
      const baseDelay = (i / count) * (waveWindow-1500);
      const randomExtra = Math.random() * 1000;
      this.time.delayedCall(baseDelay + randomExtra, () => {
        const spawned = this.spawnEnemy(level);
        if (spawned) {
          this.spawnedEnemies += 1;
          this.refreshEnemyInfo(count);
        }
      });
    }

    this.time.delayedCall(waveWindow, () => {
      if (this.isGameOver) {
        return;
      }

      this.waveNumber += 1;
      this.startEnemyWave(level);
    });
  }

  private spawnEnemy(level: LevelData): boolean {
    const spawnCell = level.spawnZones[0]?.cells[this.spawnedEnemies % (level.spawnZones[0]?.cells.length ?? 1)];
    const goalCell = level.goalZones[0]?.cells[0];

    if (!spawnCell || !goalCell || !this.gridSystem) {
      return false;
    }

    const path = buildEnemyPath({
      level,
      spawnCell,
      goalCell,
      gridSystem: this.gridSystem,
      pathfinder: this.pathfinder,
    });

    if (!path || path.length === 0) {
      return false;
    }

    const startPoint = this.gridSystem.cellCenter(path[0]);
    const shadow = this.add.ellipse(startPoint.x, startPoint.y + 16, 42, 16, 0x111111, 0.28).setDepth(2);
    const body = this.createEnemyBody(startPoint.x, startPoint.y - 2);

    const enemy: ActiveEnemy = {
      body,
      shadow,
      path,
      pathIndex: 0,
      speed: this.enemySpeed * Phaser.Math.FloatBetween(0.75, 1.25),
      hitsTaken: 0,
      lootDropped: false,
      escaped: false,
      defeated: false,
      animationDirection: 'down',
      animationFlipX: false,
      injuryAnimationUntil: null,
    };

    this.activeEnemies.push(enemy);
    this.updateEnemyRenderDepth(enemy);

    return true;
  }

  private createHeroAnimations(): void {
    for (const state of HERO_LOOP_ANIMATION_STATES) {
      for (const direction of HERO_LOOP_ANIMATION_DIRECTIONS) {
        this.createHeroAnimation(state, direction, -1);
      }
    }

    for (const direction of HERO_PUNCH_ANIMATION_DIRECTIONS) {
      this.createHeroAnimation('punch', direction, 0);
    }
  }

  private createEnemyAnimations(): void {
    for (const direction of ENEMY_ANIMATION_DIRECTIONS) {
      for (const animationState of ['walk', 'injured'] as const) {
        const sheetKey = getEnemySheetKey(animationState, direction);
        const animationKey = getEnemyAnimationKey(animationState, direction);

        if (!this.textures.exists(sheetKey) || this.anims.exists(animationKey)) {
          continue;
        }

        this.anims.create({
          key: animationKey,
          frames: this.anims.generateFrameNumbers(sheetKey, { start: 0, end: ENEMY_SHEET_FRAME_COUNT - 1 }),
          frameRate: ENEMY_ANIMATION_FRAME_RATE,
          repeat: animationState === 'walk' ? -1 : 0,
        });
      }
    }
  }

  private createPlayerBody(): Phaser.GameObjects.Sprite | Phaser.GameObjects.Ellipse {
    const initialTextureKey = getHeroSheetKey('idle', 'down');

    if (!this.textures.exists(initialTextureKey)) {
      return this.add
        .ellipse(0, 0, 72, 90, 0xf4d35e, 1)
        .setStrokeStyle(2, 0x102a43, 1)
        .setDepth(3);
    }

    return this.add
      .sprite(0, 0, initialTextureKey)
      .setDisplaySize(this.playerSpriteDisplaySize, this.playerSpriteDisplaySize)
      .setDepth(3);
  }

  private applyHeroDisplaySize(): void {
    if (!this.playerBody || typeof this.playerBody.setDisplaySize !== 'function') {
      return;
    }

    this.playerBody.setDisplaySize(this.playerSpriteDisplaySize, this.playerSpriteDisplaySize);
  }

  private updateHeroAnimationDirection(horizontal: number, vertical: number): void {
    if (horizontal < 0 && vertical < 0) {
      this.heroAnimationDirection = 'northeast';
      this.heroAnimationFlipX = true;
      return;
    }

    if (horizontal > 0 && vertical < 0) {
      this.heroAnimationDirection = 'northeast';
      this.heroAnimationFlipX = false;
      return;
    }

    if (horizontal < 0 && vertical > 0) {
      this.heroAnimationDirection = 'southeast';
      this.heroAnimationFlipX = true;
      return;
    }

    if (horizontal > 0 && vertical > 0) {
      this.heroAnimationDirection = 'southeast';
      this.heroAnimationFlipX = false;
      return;
    }

    if (horizontal < 0) {
      this.heroAnimationDirection = 'right';
      this.heroAnimationFlipX = true;
      return;
    }

    if (horizontal > 0) {
      this.heroAnimationDirection = 'right';
      this.heroAnimationFlipX = false;
      return;
    }

    if (vertical < 0) {
      this.heroAnimationDirection = 'up';
      this.heroAnimationFlipX = false;
      return;
    }

    if (vertical > 0) {
      this.heroAnimationDirection = 'down';
      this.heroAnimationFlipX = false;
    }
  }

  private updatePlayerMovementVisual(isMoving: boolean): void {
    const state: HeroLoopAnimationState = isMoving ? 'run' : 'idle';

    this.playHeroAnimation(state, this.heroAnimationDirection, this.heroAnimationFlipX, true);
  }

  private createEnemyBody(x: number, y: number): Phaser.GameObjects.Sprite | Phaser.GameObjects.Ellipse {
    const initialTextureKey = getEnemySheetKey('walk', 'down');

    if (!this.textures.exists(initialTextureKey)) {
      return this.add
        .ellipse(x, y, 42, 58, 0xe63946, 1)
        .setStrokeStyle(2, 0x3d0c11, 1)
        .setDepth(3);
    }

    const sourceImage = this.textures.get(initialTextureKey).getSourceImage();
    const textureSource = Array.isArray(sourceImage) ? sourceImage[0] : sourceImage;
    const textureWidth = textureSource?.width ? textureSource.width / 4 : this.enemySpriteDisplayHeight;
    const textureHeight = textureSource?.height ? textureSource.height / 4 : this.enemySpriteDisplayHeight;
    const displayWidth = textureHeight > 0 ? (this.enemySpriteDisplayHeight * textureWidth) / textureHeight : 42;

    return this.add
      .sprite(x, y, initialTextureKey)
      .setDisplaySize(displayWidth, this.enemySpriteDisplayHeight)
      .setDepth(3);
  }

  private updateEnemyMovementVisual(enemy: ActiveEnemy, deltaX: number, deltaY: number): void {
    const nextVisualState = getEnemyMovementVisualState(deltaX, deltaY);
    enemy.animationDirection = nextVisualState.direction;
    enemy.animationFlipX = nextVisualState.flipX;
    this.playEnemyAnimation(enemy, 'walk', true);
  }

  private playEnemyAnimation(enemy: ActiveEnemy, animationState: EnemyAnimationState, ignoreIfPlaying: boolean): void {
    if (!('play' in enemy.body) || typeof enemy.body.play !== 'function') {
      return;
    }

    const animationKey = getEnemyAnimationKey(animationState, enemy.animationDirection);
    if (!this.anims.exists(animationKey)) {
      return;
    }

    enemy.body.play(animationKey, ignoreIfPlaying);
    if (typeof enemy.body.setFlipX === 'function') {
      enemy.body.setFlipX(enemy.animationFlipX);
    }
  }

  private tryMovePlayerAlongGrid(deltaX: number, deltaY: number): void {
    if (!this.playerBody || !this.playerShadow || !this.gridSystem) {
      return;
    }

    const nextPosition = this.gridSystem.moveAlongSurface(
      { x: this.playerBody.x, y: this.playerBody.y },
      deltaX,
      deltaY,
    );

    if (!nextPosition) {
      return;
    }

    const nextHitbox = this.getPlayerHitbox(nextPosition.x, nextPosition.y);

    if (!this.isInsidePlayArea(nextHitbox)) {
      return;
    }

    if (this.collisionProvider.collidesWithAny(nextHitbox, this.obstacleRects)) {
      return;
    }

    this.playerBody.setPosition(nextPosition.x, nextPosition.y);
    this.playerShadow.setPosition(nextPosition.x, nextPosition.y + 54);
    this.updatePlayerRenderDepth();
  }

  private getGameplayDepth(worldY: number): number {
    return 1.2 + worldY / 1000;
  }

  private updatePlayerRenderDepth(): void {
    if (!this.playerBody || !this.playerShadow) {
      return;
    }

    const bodyDepth = this.getGameplayDepth(this.playerBody.y + this.playerHitboxOffsetY);

    this.setGameObjectDepth(this.playerBody, bodyDepth);
    this.setGameObjectDepth(this.playerShadow, bodyDepth - 0.05);
  }

  private updateEnemyRenderDepth(enemy: ActiveEnemy): void {
    const bodyDepth = this.getGameplayDepth(enemy.body.y + this.enemyHitboxOffsetY);

    this.setGameObjectDepth(enemy.body, bodyDepth);
    this.setGameObjectDepth(enemy.shadow, bodyDepth - 0.05);
  }

  private updateLootRenderDepth(loot: ActiveLoot): void {
    const bodyDepth = this.getGameplayDepth(loot.body.y + this.lootSize.height / 2);

    this.setGameObjectDepth(loot.body, bodyDepth);
    this.setGameObjectDepth(loot.shadow, bodyDepth - 0.05);
  }

  private setGameObjectDepth(gameObject: { setDepth?: (value: number) => unknown }, depth: number): void {
    if (typeof gameObject.setDepth === 'function') {
      gameObject.setDepth(depth);
    }
  }

  private createHeroAnimation(state: HeroAnimationState, direction: HeroAnimationDirection, repeat: number): void {
    const sheetKey = getHeroSheetKey(state, direction);
    const animationKey = getHeroAnimationKey(state, direction);

    if (!this.textures.exists(sheetKey) || this.anims.exists(animationKey)) {
      return;
    }

    this.anims.create({
      key: animationKey,
      frames: this.anims.generateFrameNumbers(sheetKey, {
        start: state === 'punch' ? HERO_PUNCH_START_FRAME : 0,
        end: HERO_SHEET_FRAME_COUNT - 1,
      }),
      frameRate: HERO_ANIMATION_FRAME_RATE,
      repeat,
    });
  }

  private playHeroAnimation(
    state: HeroAnimationState,
    direction: HeroAnimationDirection,
    flipX: boolean,
    ignoreIfPlaying: boolean,
  ): void {
    if (!this.playerBody || !('play' in this.playerBody) || typeof this.playerBody.play !== 'function') {
      return;
    }

    const animationKey = getHeroAnimationKey(state, direction);
    if (!this.anims.exists(animationKey)) {
      return;
    }

    this.applyHeroDisplaySize();
    this.playerBody.play(animationKey, ignoreIfPlaying);
    if (typeof this.playerBody.setFlipX === 'function') {
      this.playerBody.setFlipX(flipX);
    }
  }

  private getHeroPunchAnimationDirection(): { direction: HeroPunchAnimationDirection; flipX: boolean } {
    if (this.facingDirection === 'left') {
      this.heroAnimationDirection = 'right';
      this.heroAnimationFlipX = true;
      return { direction: 'right', flipX: true };
    }

    if (this.facingDirection === 'right') {
      this.heroAnimationDirection = 'right';
      this.heroAnimationFlipX = false;
      return { direction: 'right', flipX: false };
    }

    if (this.facingDirection === 'up') {
      this.heroAnimationDirection = 'up';
      this.heroAnimationFlipX = false;
      return { direction: 'up', flipX: false };
    }

    this.heroAnimationDirection = 'down';
    this.heroAnimationFlipX = false;
    return { direction: 'down', flipX: false };
  }

  private canInterruptAttackAnimation(now: number): boolean {
    return !this.isAttackAnimating || now >= this.attackAnimationReleaseAt;
  }

  private stopAttackAnimation(): void {
    this.isAttackAnimating = false;
    this.attackAnimationReleaseAt = 0;
    this.attackAnimationEndAt = 0;
    this.setPlayerAttackFeedback(false);
  }

  private performAttack(): void {
    if (!this.playerBody || !this.playerShadow) {
      return;
    }

    const now = this.time.now;
    if (now - this.lastAttackAt < this.attackCooldownMs) {
      return;
    }

    this.audioSystem?.playSfx(AUDIO_KEYS.ATTACK);
    this.lastAttackAt = now;
    this.isAttackAnimating = true;
    this.attackAnimationReleaseAt = now + HERO_ATTACK_MIN_DURATION_MS;
    this.attackAnimationEndAt = now + HERO_ATTACK_ANIMATION_DURATION_MS;
    this.attackRect = null;
    this.attackVisualUntil = now + HERO_ATTACK_HIT_DELAY_MS + this.attackDurationMs;

    const punchAnimation = this.getHeroPunchAnimationDirection();
    this.playHeroAnimation('punch', punchAnimation.direction, punchAnimation.flipX, false);
    this.setPlayerAttackFeedback(true);

    const attackHitbox = this.getPlayerHitbox(this.playerBody.x, this.playerBody.y);
    const attackDirection = this.facingDirection;

    this.time.delayedCall(HERO_ATTACK_HIT_DELAY_MS, () => {
      this.attackRect = createAttackRect(attackHitbox, attackDirection);
      this.checkAttackHits();
    });
  }

  private checkAttackHits(): void {
    if (!this.attackRect) {
      return;
    }

    const now = this.time?.now ?? 0;
    let hitAny = false;

    for (const enemy of this.activeEnemies) {
      if (enemy.escaped || enemy.defeated) {
        continue;
      }

      const enemyHitbox = this.getEnemyHitbox(enemy.body.x, enemy.body.y);
      if (!this.collisionProvider.intersects(this.attackRect, enemyHitbox)) {
        continue;
      }

      if (!hitAny) {
        this.audioSystem?.playSfx(AUDIO_KEYS.HIT);
        hitAny = true;
      }

      if (isEnemyInjuryActive(enemy, now)) {
        this.defeatEnemy(enemy);
        continue;
      }

      enemy.hitsTaken += 1;
      this.applyEnemyKnockback(enemy);

      if (enemy.hitsTaken === 1 && !enemy.lootDropped) {
        this.spawnLootAtEnemy(enemy);
        enemy.lootDropped = true;
      }

      startEnemyInjuryAnimation(enemy, now);
      this.playEnemyAnimation(enemy, 'injured', false);
    }
  }

  private applyEnemyKnockback(enemy: ActiveEnemy): void {
    const knockback = getKnockbackDelta(this.facingDirection, DEFAULT_ATTACK_CONFIG.knockbackDistance);
    const nextX = enemy.body.x + knockback.x;
    const nextY = enemy.body.y + knockback.y;
    const nextHitbox = this.getEnemyHitbox(nextX, nextY);

    if (!this.isInsidePlayArea(nextHitbox)) {
      return;
    }

    if (this.collisionProvider.collidesWithAny(nextHitbox, this.obstacleRects)) {
      return;
    }

    enemy.body.setPosition(nextX, nextY);
    enemy.shadow.setPosition(nextX, nextY + 18);
    this.updateEnemyRenderDepth(enemy);
  }

  private defeatEnemy(enemy: ActiveEnemy): void {
    enemy.defeated = true;
    this.audioSystem?.playSfx(Phaser.Utils.Array.GetRandom([...DEATH_AUDIO_KEYS]));
    enemy.body.destroy();
    enemy.shadow.destroy();
    this.refreshLevelInfo();
  }

  private spawnLootAtEnemy(enemy: ActiveEnemy): void {
    if (!this.currentLevel || this.currentLevel.lootSpawns.length === 0) {
      return;
    }

    const template = this.currentLevel.lootSpawns[this.droppedLootCount % this.currentLevel.lootSpawns.length];
    this.droppedLootCount += 1;
    const lootTextureKey = getLootAssetKey(template.image ?? DEFAULT_LOOT_IMAGE_NAME);

    const shadow = this.add
      .ellipse(enemy.body.x, enemy.body.y + 18, 24, 10, 0x111111, 0.22)
      .setDepth(2.1);
    const body = this.add
      .image(enemy.body.x, enemy.body.y + 4, lootTextureKey)
      .setDisplaySize(this.lootSize.width, this.lootSize.height)
      .setDepth(2.6);

    const loot: ActiveLoot = {
      id: `${template.id}-${this.droppedLootCount}`,
      type: template.type,
      value: template.value,
      body,
      shadow,
      createdAt: this.time.now,
    };

    this.activeLoots.push(loot);
    this.updateLootRenderDepth(loot);
    this.refreshLevelInfo();
  }

  private getPlayerHitbox(centerX: number, centerY: number): CollisionRect {
    return {
      x: centerX - this.playerHitboxSize.width / 2,
      y: centerY - this.playerHitboxSize.height / 2 + this.playerHitboxOffsetY,
      width: this.playerHitboxSize.width,
      height: this.playerHitboxSize.height,
    };
  }

  private getEnemyHitbox(centerX: number, centerY: number): CollisionRect {
    return {
      x: centerX - this.enemyHitboxSize.width / 2,
      y: centerY - this.enemyHitboxSize.height / 2 + this.enemyHitboxOffsetY,
      width: this.enemyHitboxSize.width,
      height: this.enemyHitboxSize.height,
    };
  }

  private isInsidePlayArea(rect: CollisionRect): boolean {
    if (!this.gridSystem) {
      return false;
    }

    return [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height },
    ].every((corner) => this.gridSystem!.containsPoint(corner));
  }

  private setPlayerAttackFeedback(isAttacking: boolean): void {
    if (!this.playerBody) {
      return;
    }

    if ('play' in this.playerBody && typeof this.playerBody.play === 'function') {
      return;
    }

    if ('setTint' in this.playerBody && typeof this.playerBody.setTint === 'function') {
      if (isAttacking) {
        this.playerBody.setTint(0xffe08a);
      } else if (typeof this.playerBody.clearTint === 'function') {
        this.playerBody.clearTint();
      }

      return;
    }

    if ('setFillStyle' in this.playerBody && typeof this.playerBody.setFillStyle === 'function') {
      this.playerBody.setFillStyle(isAttacking ? 0xffe08a : 0xf4d35e, 1);
    }
  }

  private updateLoots(): void {
    if (!this.playerBody) {
      return;
    }

    const now = this.time.now;
    const playerHitbox = this.getPlayerHitbox(this.playerBody.x, this.playerBody.y);

    for (const loot of [...this.activeLoots]) {
      if (isLootExpired(loot.createdAt, now)) {
        this.destroyLoot(loot);
        continue;
      }

      const alpha = getLootAlpha(loot.createdAt, now);
      loot.body.setAlpha(alpha);
      loot.shadow.setAlpha(Math.max(0.1, alpha * 0.45));

      if (!isInventoryFull(this.inventory.length)) {
        const lootHitbox = getLootHitbox(loot.body.x, loot.body.y, this.lootSize);
        if (this.collisionProvider.intersects(playerHitbox, lootHitbox)) {
          this.pickUpLoot(loot);
        }
      } else {
        const lootHitbox = getLootHitbox(loot.body.x, loot.body.y, this.lootSize);
        if (this.collisionProvider.intersects(playerHitbox, lootHitbox)) {
          this.playInventoryError(now);
        }
      }
    }

    const isInsideSanctuary = isPlayerInsideSanctuary(playerHitbox, this.sanctuaryRects, this.collisionProvider);

    if (this.inventory.length > 0 && isInsideSanctuary) {
      this.depositInventory(now);
    } else {
      this.nextLootDepositAt = null;
    }
  }

  private pickUpLoot(loot: ActiveLoot): void {
    this.inventory.push({ type: loot.type, value: loot.value });
    this.audioSystem?.playSfx(AUDIO_KEYS.PICKUP);
    this.destroyLoot(loot, false);
    this.refreshLevelInfo();
  }

  private depositInventory(now: number): void {
    const currentScore = this.registry.get('score') ?? 0;
    const depositResult = processInventoryDeposit({
      inventory: this.inventory,
      now,
      nextLootDepositAt: this.nextLootDepositAt,
      lootDepositIntervalMs: this.lootDepositIntervalMs,
      score: currentScore,
    });

    this.inventory = depositResult.inventory;
    this.nextLootDepositAt = depositResult.nextLootDepositAt;

    if (depositResult.depositedValue === null) {
      return;
    }

    this.registry.set('score', depositResult.score);
    this.audioSystem?.playSfx(AUDIO_KEYS.DEPOSIT);
    this.showDepositValuePopup(depositResult.depositedValue);

    this.refreshLevelInfo();
  }

  private showDepositValuePopup(value: number): void {
    if (value <= 0 || !this.playerBody) {
      return;
    }

    const fontSize = value >= 50 ? '39px' : value >= 20 ? '34px' : '29px';
    const color = getDepositPopupColor(value);
    const popup = this.add
      .text(this.playerBody.x, this.playerBody.y - 78, `+${value} M Ft`, {
        fontFamily: DEPOSIT_POPUP_FONT_FAMILY,
        fontSize,
        color,
        fontStyle: 'bold',
        stroke: '#102a43',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.tweens.add({
      targets: popup,
      y: popup.y - 54,
      alpha: 0,
      duration: 975,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        popup.destroy();
      },
    });
  }

  private destroyLoot(loot: ActiveLoot, refreshInfo = true): void {
    loot.body.destroy();
    loot.shadow.destroy();
    this.activeLoots = this.activeLoots.filter((activeLoot) => activeLoot.id !== loot.id);

    if (refreshInfo) {
      this.refreshLevelInfo();
    }
  }

  private updateEnemies(delta: number): void {
    this.activeEnemies = updateActiveEnemies({
      activeEnemies: this.activeEnemies,
      delta,
      now: this.time?.now ?? 0,
      isGameOver: this.isGameOver,
      gridSystem: this.gridSystem,
      onEnemyEscaped: () => this.handleEnemyEscaped(),
      updateEnemyMovementVisual: (enemy, deltaX, deltaY) => this.updateEnemyMovementVisual(enemy, deltaX, deltaY),
      updateEnemyRenderDepth: (enemy) => this.updateEnemyRenderDepth(enemy),
    });
  }

  private renderEnemyHitboxes(): void {
    if (!this.enemyHitboxDebug) {
      return;
    }

    this.enemyHitboxDebug.clear();
    this.enemyHitboxDebug.lineStyle(2, 0x80ed99, 0.95);

    for (const enemy of this.activeEnemies) {
      // DEBUG: Temporary enemy hitbox overlay for gameplay tuning. Remove before release.
      const hitbox = this.getEnemyHitbox(enemy.body.x, enemy.body.y);
      this.enemyHitboxDebug.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    }
  }

  private updateAttackState(now: number): void {
    if (now <= this.attackVisualUntil) {
      return;
    }

    this.attackRect = null;
    this.setPlayerAttackFeedback(false);
  }

  private handleEnemyEscaped(): void {
    const escapedEnemies = (this.registry.get('escapedEnemies') ?? 0) + 1;
    this.registry.set('escapedEnemies', escapedEnemies);
    this.refreshEnemyInfo();
    this.refreshHud();

    if (escapedEnemies >= this.maxEscapedEnemies) {
      this.triggerGameOver();
    }
  }

  private refreshEnemyInfo(count: number = this.targetEnemyCount): void {
    this.enemyInfoText?.setText(
      formatEnemyInfoText({
        activeEnemyCount: this.activeEnemies.length,
        spawnedEnemies: this.spawnedEnemies,
        targetEnemyCount: count,
      }),
    );
    this.refreshHud();
  }

  private refreshLevelInfo(): void {
    this.levelInfoText?.setText(
      formatLevelInfoText({
        level: this.currentLevel,
        activeLootCount: this.activeLoots.length,
        inventoryCount: this.inventory.length,
      }),
    );
    this.refreshHud();
  }

  private refreshHud(): void {
    const score = this.registry.get('score') ?? 0;
    const escapedEnemies = this.registry.get('escapedEnemies') ?? 0;
    const hudValues = formatPlaySceneHudValues({
      score,
      inventoryCount: this.inventory.length,
      escapedEnemies,
      maxEscapedEnemies: this.maxEscapedEnemies,
      waveNumber: this.waveNumber,
      maxInventory: DEFAULT_LOOT_CONFIG.maxInventory,
    });

    this.scoreValueText?.setText(hudValues.scoreText);
    this.inventoryValueText?.setText(hudValues.inventoryText);
    this.escapedValueText?.setText(hudValues.escapedText);
    this.updateEscapedEnemyWarningState(escapedEnemies);
    this.waveValueText?.setText(hudValues.waveText);
  }

  private updateEscapedEnemyWarningState(escapedEnemies: number): void {
    this.escapedValueWarningTween = syncEscapedEnemyWarningState({
      escapedEnemies,
      escapedValueText: this.escapedValueText,
      escapedValueWarningTween: this.escapedValueWarningTween,
      escapedValueBaseX: this.escapedValueBaseX,
      escapedValueBaseY: this.escapedValueBaseY,
      tweens: this.tweens,
    }) as Phaser.Tweens.Tween | undefined;
  }

  private playInventoryError(now: number): void {
    if (!shouldPlayInventoryError(now, this.lastInventoryErrorAt, this.inventoryErrorCooldownMs)) {
      return;
    }

    this.lastInventoryErrorAt = now;
    this.audioSystem?.playSfx(AUDIO_KEYS.ERROR);
  }

  private triggerGameOver(): void {
    if (this.isGameOver) {
      return;
    }

    this.isGameOver = true;
    this.audioSystem?.playSfx(AUDIO_KEYS.ERROR);
    const currentScore = this.registry.get('score') ?? 0;
    this.audioSystem?.fadeOutMusic(900, () => {
      this.scene.start(SCENE_KEYS.GAME_OVER, { score: currentScore });
    });
  }
}
