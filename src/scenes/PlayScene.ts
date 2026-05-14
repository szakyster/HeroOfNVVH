import Phaser from 'phaser';
import type { LevelData } from '../types/level';
import type { GridCell } from '../types/level';
import { GridSystem } from '../systems/GridSystem';
import type { ScreenRect } from '../systems/GridSystem';
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
import { getHrsAssetKey } from '../systems/HrsAssets';
import { getObstacleAssetKey, hasObstacleAsset } from '../systems/ObstacleAssets';
import { HEADLINE_FONT_FAMILY } from '../utils/typography';
import { SCENE_KEYS } from './sceneKeys';
const HEADER_EMPHASIS_COLOR = '#f4e6a2';
const ESCAPED_WARNING_COLOR = '#ff4d4f';
const DEPOSIT_POPUP_FONT_FAMILY = 'Bungee, Verdana, sans-serif';
const HERO_SPRITE_KEY = 'hero-psz01';
const ENEMY_SPRITE_KEYS = ['enemy-01', 'enemy-02', 'enemy-03', 'enemy-04'] as const;

type ActiveEnemy = {
  body: Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse;
  shadow: Phaser.GameObjects.Ellipse;
  path: GridCell[];
  pathIndex: number;
  speed: number;
  hitsTaken: number;
  lootDropped: boolean;
  escaped: boolean;
  defeated: boolean;
};

type ActiveLoot = {
  id: string;
  type: string;
  value: 10 | 20 | 50;
  body: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
  createdAt: number;
};

type HrsPlacement = {
  x: number;
  y: number;
  originX: number;
  originY: number;
  depthY: number;
};

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

  private readonly playerSpriteDisplayHeight = 128;

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

  private playerBody?: Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse;

  private playerShadow?: Phaser.GameObjects.Ellipse;

  private playerHitboxDebug?: Phaser.GameObjects.Graphics;

  private enemyHitboxDebug?: Phaser.GameObjects.Graphics;

  private attackDebug?: Phaser.GameObjects.Graphics;

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

  private inventory: Array<{ type: string; value: 10 | 20 | 50 }> = [];

  private droppedLootCount = 0;

  private nextLootDepositAt: number | null = null;

  private lastInventoryErrorAt = Number.NEGATIVE_INFINITY;

  private readonly inventoryErrorCooldownMs = 250;

  private audioSystem?: AudioSystem;

  private facingDirection: FacingDirection = 'down';

  private attackRect: CollisionRect | null = null;

  private attackVisualUntil = 0;

  private lastAttackAt = Number.NEGATIVE_INFINITY;

  private isGameOver = false;

  private waveNumber = 1;

  private spawnedEnemies = 0;

  private get targetEnemyCount(): number {
    return Math.min(Math.floor(this.waveNumber * 0.75 + 1), 8);
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

    this.levelInfoText = this.add
      .text(24, height - 58, 'Pályabetöltés: folyamatban...', {
        fontFamily: 'Verdana',
        fontSize: '17px',
        color: '#f1faee',
      })
      .setOrigin(0, 0.5)
      .setDepth(7);

    this.enemyInfoText = this.add
      .text(24, height - 28, 'Ellenségállapot: inicializálás...', {
        fontFamily: 'Verdana',
        fontSize: '17px',
        color: '#ffd166',
      })
      .setOrigin(0, 0.5)
      .setDepth(7);

    this.createAudioToggleButtons(width);

    this.playerShadow = this.add.ellipse(0, 0, 72, 30, 0x111111, 0.35).setDepth(2);
    this.playerBody = this.createPlayerBody();
    // DEBUG: Keep hitboxes visible during development. Remove before release build.
    this.playerHitboxDebug = this.add.graphics().setDepth(4);
    // DEBUG: Keep hitboxes visible during development. Remove before release build.
    this.enemyHitboxDebug = this.add.graphics().setDepth(4);
    this.attackDebug = this.add.graphics().setDepth(4.5);
    this.playerShadow.setVisible(false);
    this.playerBody.setVisible(false);

    this.levelLoader
      .load(this.levelPath)
      .then((level) => {
        this.currentLevel = level;
        this.obstacleRects = this.getObstacleCells(level).map((cell) => this.gridSystem!.cellBounds(cell, 10));
        this.sanctuaryRects = level.sanctuaryZone.map((cell) => this.gridSystem!.cellBounds(cell, 10));
        this.drawObstacleCells(level);
        this.drawSanctuaryZone(level);
        this.drawHrsImages(level);
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
    this.playerHitboxDebug = undefined;
    this.enemyHitboxDebug = undefined;
    this.attackDebug = undefined;
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
    const panelLeft = 18;
    const panelWidth = width - 36;
    const contentLeft = panelLeft + 28;
    const contentWidth = panelWidth - 56;
    const hudTop = 13;

    const panel = this.add.graphics();
    panel.setDepth(6);
    panel.fillStyle(0x102a43, 0.38);
    panel.fillRoundedRect(panelLeft, hudTop, panelWidth, 92, 24);
    panel.lineStyle(2, 0xf4d35e, 0.45);
    panel.strokeRoundedRect(panelLeft, hudTop, panelWidth, 92, 24);

    const metricY = 31;
    const valueY = 63;
    const columns = [0, 0.24, 0.52, 0.8].map((ratio) => contentLeft + contentWidth * ratio);

    this.addHudLabel(columns[0], metricY, 'Pont');
    this.scoreValueText = this.addHudValue(columns[0], valueY);

    this.addHudLabel(columns[1], metricY, 'Hátizsák');
    this.inventoryValueText = this.addHudValue(columns[1], valueY);

    this.addHudLabel(columns[2], metricY, 'Reptérre érkeztek');
    this.escapedValueText = this.addHudValue(columns[2], valueY);
    this.escapedValueBaseX = columns[2];
    this.escapedValueBaseY = valueY;

    this.addHudLabel(columns[3], metricY, 'Hullám');
    this.waveValueText = this.addHudValue(columns[3], valueY);
  }

  private addHudLabel(x: number, y: number, text: string): void {
    this.add
      .text(x, y, text, {
        fontFamily: 'Verdana',
        fontSize: '15px',
        color: '#a8dadc',
      })
      .setDepth(7);
  }

  private addHudValue(x: number, y: number): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, '', {
        fontFamily: HEADLINE_FONT_FAMILY,
        fontSize: '24px',
        color: HEADER_EMPHASIS_COLOR,
        fontStyle: 'bold',
      })
      .setDepth(7);
  }

  private createAudioToggleButtons(width: number): void {
    this.musicToggleText = this.add
      .text(width - 18, 122, '', {
        fontFamily: 'Verdana',
        fontSize: '15px',
        color: '#f4f1de',
        backgroundColor: '#223247',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });

    this.musicToggleText.setData('ui-button', true);
    this.musicToggleText.on('pointerdown', () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED));
      this.registry.set(AUDIO_SETTINGS_KEYS.MUSIC_MUTED, nextValue);
      this.audioSystem?.setMusicMuted(nextValue);
      this.refreshAudioToggleTexts();
    });

    this.sfxToggleText = this.add
      .text(width - 18, 160, '', {
        fontFamily: 'Verdana',
        fontSize: '15px',
        color: '#f4f1de',
        backgroundColor: '#223247',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(6)
      .setInteractive({ useHandCursor: true });

    this.sfxToggleText.setData('ui-button', true);
    this.sfxToggleText.on('pointerdown', () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED));
      this.registry.set(AUDIO_SETTINGS_KEYS.SFX_MUTED, nextValue);
      this.audioSystem?.setSfxMuted(nextValue);
      this.refreshAudioToggleTexts();
    });

    for (const button of [this.musicToggleText, this.sfxToggleText]) {
      button.on('pointerover', () => {
        button.setStyle({ backgroundColor: '#314863' });
      });
      button.on('pointerout', () => {
        button.setStyle({ backgroundColor: '#223247' });
      });
    }

    this.refreshAudioToggleTexts();
  }

  private refreshAudioToggleTexts(): void {
    this.musicToggleText?.setText(
      `Zene némít: ${this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED) ? 'Be' : 'Ki'}`,
    );
    this.sfxToggleText?.setText(
      `Hangeffekt némít: ${this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED) ? 'Be' : 'Ki'}`,
    );
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) {
      return;
    }

    if (!this.playerBody || !this.playerShadow || !this.gridSystem || !this.playerHitboxDebug) {
      return;
    }

    if (!this.playerBody.visible) {
      return;
    }

    this.renderPlayerHitbox();
    this.updateEnemies(delta);
    this.updateLoots();
    this.renderEnemyHitboxes();
    this.renderAttackEffect();

    if (this.keySpace && Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      this.performAttack();
    }

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

    if (horizontal !== 0 || vertical !== 0) {
      const direction = new Phaser.Math.Vector2(horizontal, vertical).normalize();
      const distance = (this.playerSpeed * delta) / 1000;

      this.tryMovePlayerAlongGrid(direction.x * distance, 0);
      this.tryMovePlayerAlongGrid(0, direction.y * distance);
    }
  }

  private drawObstacleCells(level: LevelData): void {
    let fallbackGraphics: Phaser.GameObjects.Graphics | undefined;
    const obstacleTextureSizes = new Map<string, { width: number; height: number }>();

    for (const obstacle of level.obstacles) {
      const textureKey = getObstacleAssetKey(obstacle.image);

      if (!hasObstacleAsset(obstacle.image) || !this.textures.exists(textureKey)) {
        fallbackGraphics ??= this.add.graphics().setDepth(1.5);
        this.drawFallbackObstacleCell(fallbackGraphics, obstacle);
        continue;
      }

      let textureSize = obstacleTextureSizes.get(textureKey);

      if (!textureSize) {
        const sourceImage = this.textures.get(textureKey).getSourceImage();
        const textureSource = Array.isArray(sourceImage) ? sourceImage[0] : sourceImage;
        textureSize = {
          width: textureSource?.width ?? 1,
          height: textureSource?.height ?? 1,
        };
        obstacleTextureSizes.set(textureKey, textureSize);
      }

      const center = this.gridSystem!.cellCenter(obstacle);
      const bounds = this.gridSystem!.cellBounds(obstacle, 8);
      const displaySize = this.getObstacleDisplaySize(bounds, textureSize);
      const anchorY = bounds.y + bounds.height * 1.08;

      this.add
        .image(center.x, anchorY, textureKey)
        .setOrigin(0.5, 1)
        .setDisplaySize(displaySize.width, displaySize.height)
        .setDepth(this.getGameplayDepth(anchorY));
    }
  }

  private drawFallbackObstacleCell(graphics: Phaser.GameObjects.Graphics, cell: GridCell): void {
    const polygon = this.gridSystem!.cellPolygon(cell);
    graphics.fillStyle(0xe76f51, 0.35);
    graphics.lineStyle(2, 0xffb4a2, 0.95);
    graphics.beginPath();
    graphics.moveTo(polygon[0].x, polygon[0].y);
    graphics.lineTo(polygon[1].x, polygon[1].y);
    graphics.lineTo(polygon[2].x, polygon[2].y);
    graphics.lineTo(polygon[3].x, polygon[3].y);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  private getObstacleCells(level: LevelData): GridCell[] {
    return level.obstacles.map((obstacle) => ({ x: obstacle.x, y: obstacle.y }));
  }

  private getObstacleDisplaySize(
    bounds: ScreenRect,
    textureSize: { width: number; height: number },
  ): { width: number; height: number } {
    return this.getFittedSpriteDisplaySize(
      bounds,
      textureSize,
      this.obstacleSpriteMaxWidthScale,
      this.obstacleSpriteMaxHeightScale,
    );
  }

  private getHrsDisplaySize(
    bounds: ScreenRect,
    textureSize: { width: number; height: number },
    scale = 1,
  ): { width: number; height: number } {
    return this.getFittedSpriteDisplaySize(
      bounds,
      textureSize,
      this.hrsSpriteMaxWidthScale * scale,
      this.hrsSpriteMaxHeightScale * scale,
    );
  }

  private getFittedSpriteDisplaySize(
    bounds: ScreenRect,
    textureSize: { width: number; height: number },
    maxWidthScale: number,
    maxHeightScale: number,
  ): { width: number; height: number } {
    const maxWidth = bounds.width * maxWidthScale;
    const maxHeight = bounds.height * maxHeightScale;

    if (textureSize.width <= 0 || textureSize.height <= 0) {
      return { width: maxWidth, height: maxHeight };
    }

    const scale = Math.min(maxWidth / textureSize.width, maxHeight / textureSize.height);

    return {
      width: textureSize.width * scale,
      height: textureSize.height * scale,
    };
  }

  private drawHrsImages(level: LevelData): void {
    if (level.hrsImages.length === 0) {
      return;
    }

    const textureSizes = new Map<string, { width: number; height: number }>();

    for (const hrsImage of level.hrsImages) {
      const textureKey = getHrsAssetKey(hrsImage.image);

      if (!this.textures.exists(textureKey)) {
        continue;
      }

      const zoneCells = this.getHrsZoneCells(level, hrsImage);

      if (zoneCells.length === 0) {
        continue;
      }

      let textureSize = textureSizes.get(textureKey);

      if (!textureSize) {
        const sourceImage = this.textures.get(textureKey).getSourceImage();
        const textureSource = Array.isArray(sourceImage) ? sourceImage[0] : sourceImage;
        textureSize = {
          width: textureSource?.width ?? 1,
          height: textureSource?.height ?? 1,
        };
        textureSizes.set(textureKey, textureSize);
      }

      const zoneBounds = this.getGridCellsBounds(zoneCells);
      const placement = this.getHrsPlacement(zoneBounds, hrsImage.side, hrsImage.offsetX, hrsImage.offsetY);
      const displaySize = this.getHrsDisplaySize(zoneBounds, textureSize, hrsImage.scale);

      this.add
        .image(placement.x, placement.y, textureKey)
        .setOrigin(placement.originX, placement.originY)
        .setDisplaySize(displaySize.width, displaySize.height)
        .setDepth(this.getGameplayDepth(placement.depthY) - 0.08);
    }
  }

  private getHrsZoneCells(level: LevelData, hrsImage: LevelData['hrsImages'][number]): GridCell[] {
    if (hrsImage.zoneType === 'sanctuary') {
      return [...level.sanctuaryZone];
    }

    if (hrsImage.zoneType === 'spawn') {
      return level.spawnZones.find((zone) => zone.id === hrsImage.zoneId)?.cells ?? [];
    }

    return level.goalZones.find((zone) => zone.id === hrsImage.zoneId)?.cells ?? [];
  }

  private getGridCellsBounds(cells: GridCell[]): ScreenRect {
    const cellBounds = cells.map((cell) => this.gridSystem!.cellBounds(cell, 0));
    const minX = Math.min(...cellBounds.map((bounds) => bounds.x));
    const minY = Math.min(...cellBounds.map((bounds) => bounds.y));
    const maxX = Math.max(...cellBounds.map((bounds) => bounds.x + bounds.width));
    const maxY = Math.max(...cellBounds.map((bounds) => bounds.y + bounds.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  private getHrsPlacement(
    zoneBounds: ScreenRect,
    side: LevelData['hrsImages'][number]['side'],
    offsetX = 0,
    offsetY = 0,
  ): HrsPlacement {
    const centerX = zoneBounds.x + zoneBounds.width / 2;
    const horizontalMargin = Math.max(26, zoneBounds.width * 0.36);
    const verticalMargin = Math.max(18, zoneBounds.height * 0.34);
    const baseBottomY = zoneBounds.y + zoneBounds.height;

    if (side === 'left') {
      return {
        x: zoneBounds.x - horizontalMargin + offsetX,
        y: baseBottomY + offsetY,
        originX: 1,
        originY: 1,
        depthY: baseBottomY,
      };
    }

    if (side === 'right') {
      return {
        x: zoneBounds.x + zoneBounds.width + horizontalMargin + offsetX,
        y: baseBottomY + offsetY,
        originX: 0,
        originY: 1,
        depthY: baseBottomY,
      };
    }

    if (side === 'top') {
      return {
        x: centerX + offsetX,
        y: zoneBounds.y - verticalMargin + offsetY,
        originX: 0.5,
        originY: 1,
        depthY: zoneBounds.y,
      };
    }

    return {
      x: centerX + offsetX,
      y: baseBottomY + verticalMargin + offsetY,
      originX: 0.5,
      originY: 0,
      depthY: baseBottomY,
    };
  }

  private drawSanctuaryZone(level: LevelData): void {
    const graphics = this.add.graphics();
    graphics.setDepth(1.4);

    for (const cell of level.sanctuaryZone) {
      const polygon = this.gridSystem!.cellPolygon(cell);
      graphics.fillStyle(0x2a9d8f, 0.22);
      graphics.lineStyle(2, 0x95d5b2, 0.9);
      graphics.beginPath();
      graphics.moveTo(polygon[0].x, polygon[0].y);
      graphics.lineTo(polygon[1].x, polygon[1].y);
      graphics.lineTo(polygon[2].x, polygon[2].y);
      graphics.lineTo(polygon[3].x, polygon[3].y);
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
    }
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
    this.renderPlayerHitbox();
  }

  private startEnemyWave(level: LevelData): void {
    const waveWindow = 10_000;
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

    const path = this.buildEnemyPath(level, spawnCell, goalCell);

    if (!path || path.length === 0) {
      return false;
    }

    const startPoint = this.gridSystem.cellCenter(path[0]);
    const shadow = this.add.ellipse(startPoint.x, startPoint.y + 16, 42, 16, 0x111111, 0.28).setDepth(2);
    const enemySpriteKey = ENEMY_SPRITE_KEYS[this.spawnedEnemies % ENEMY_SPRITE_KEYS.length];
    const body = this.createEnemyBody(startPoint.x, startPoint.y - 2, enemySpriteKey);

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
    };

    this.activeEnemies.push(enemy);
    this.updateEnemyRenderDepth(enemy);

    return true;
  }

  private buildEnemyPath(level: LevelData, spawnCell: GridCell, goalCell: GridCell): GridCell[] | null {
    const waypoint = this.pickEnemyWaypoint(level, spawnCell, goalCell);

    if (waypoint) {
      const obstacleCells = this.getObstacleCells(level);
      const waypointPath = this.pathfinder.findPathViaWaypoint(
        level.grid.width,
        level.grid.height,
        spawnCell,
        waypoint,
        goalCell,
        obstacleCells,
      );

      if (waypointPath && waypointPath.length > 0) {
        return waypointPath;
      }
    }
    return this.pathfinder.findPath(level.grid.width, level.grid.height, spawnCell, goalCell, this.getObstacleCells(level));
  }

  private pickEnemyWaypoint(level: LevelData, spawnCell: GridCell, goalCell: GridCell): GridCell | null {
    const obstacleCells = this.getObstacleCells(level);
    const blockedKeys = new Set(obstacleCells.map((cell) => this.cellKey(cell)));
    const candidates = this.gridSystem
      ?.allCells()
      .filter((cell) => {
        const candidateKey = this.cellKey(cell);

        if (blockedKeys.has(candidateKey)) {
          return false;
        }

        if (candidateKey === this.cellKey(spawnCell) || candidateKey === this.cellKey(goalCell)) {
          return false;
        }

        return this.manhattanDistance(cell, spawnCell) >= 2 && this.manhattanDistance(cell, goalCell) >= 2;
      });

    if (!candidates || candidates.length === 0) {
      return null;
    }

    const shuffledCandidates = Phaser.Utils.Array.Shuffle([...candidates]);

    for (const candidate of shuffledCandidates) {
      const waypointPath = this.pathfinder.findPathViaWaypoint(
        level.grid.width,
        level.grid.height,
        spawnCell,
        candidate,
        goalCell,
        obstacleCells,
      );

      if (waypointPath && waypointPath.length > 0) {
        return candidate;
      }
    }

    return null;
  }

  private manhattanDistance(a: GridCell, b: GridCell): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  private createPlayerBody(): Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse {
    if (!this.textures.exists(HERO_SPRITE_KEY)) {
      return this.add
        .ellipse(0, 0, 72, 90, 0xf4d35e, 1)
        .setStrokeStyle(2, 0x102a43, 1)
        .setDepth(3);
    }

    const sourceImage = this.textures.get(HERO_SPRITE_KEY).getSourceImage();
    const textureSource = Array.isArray(sourceImage) ? sourceImage[0] : sourceImage;
    const textureWidth = textureSource?.width ?? this.playerSpriteDisplayHeight;
    const textureHeight = textureSource?.height ?? this.playerSpriteDisplayHeight;
    const displayWidth = textureHeight > 0 ? (this.playerSpriteDisplayHeight * textureWidth) / textureHeight : 72;

    return this.add
      .image(0, 0, HERO_SPRITE_KEY)
      .setDisplaySize(displayWidth, this.playerSpriteDisplayHeight)
      .setDepth(3);
  }

  private createEnemyBody(
    x: number,
    y: number,
    textureKey: (typeof ENEMY_SPRITE_KEYS)[number],
  ): Phaser.GameObjects.Image | Phaser.GameObjects.Ellipse {
    if (!this.textures.exists(textureKey)) {
      return this.add
        .ellipse(x, y, 42, 58, 0xe63946, 1)
        .setStrokeStyle(2, 0x3d0c11, 1)
        .setDepth(3);
    }

    const sourceImage = this.textures.get(textureKey).getSourceImage();
    const textureSource = Array.isArray(sourceImage) ? sourceImage[0] : sourceImage;
    const textureWidth = textureSource?.width ?? this.enemySpriteDisplayHeight;
    const textureHeight = textureSource?.height ?? this.enemySpriteDisplayHeight;
    const displayWidth = textureHeight > 0 ? (this.enemySpriteDisplayHeight * textureWidth) / textureHeight : 42;

    return this.add
      .image(x, y, textureKey)
      .setDisplaySize(displayWidth, this.enemySpriteDisplayHeight)
      .setDepth(3);
  }

  private cellKey(cell: GridCell): string {
    return `${cell.x},${cell.y}`;
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
    this.renderPlayerHitbox();
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
    this.attackVisualUntil = now + this.attackDurationMs;
    this.attackRect = createAttackRect(this.getPlayerHitbox(this.playerBody.x, this.playerBody.y), this.facingDirection);

    this.setPlayerAttackFeedback(true);
    this.time.delayedCall(this.attackDurationMs, () => {
      this.attackRect = null;
      this.setPlayerAttackFeedback(false);
    });

    this.checkAttackHits();
  }

  private checkAttackHits(): void {
    if (!this.attackRect) {
      return;
    }

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

      enemy.hitsTaken += 1;
      this.applyEnemyKnockback(enemy);

      if (enemy.hitsTaken === 1 && !enemy.lootDropped) {
        this.spawnLootAtEnemy(enemy);
        enemy.lootDropped = true;
      }

      if (enemy.hitsTaken >= 2) {
        this.defeatEnemy(enemy);
        continue;
      }

      enemy.speed *= 0.6;
      if ('setTint' in enemy.body && typeof enemy.body.setTint === 'function') {
        enemy.body.setTint(0xf77f00);
      } else {
        enemy.body.setFillStyle(0xf77f00, 1);
        enemy.body.setStrokeStyle(2, 0x6a040f, 1);
      }
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

  private renderPlayerHitbox(): void {
    if (!this.playerBody || !this.playerHitboxDebug) {
      return;
    }

    // DEBUG: Temporary hitbox overlay for gameplay tuning. Remove before release.
    const hitbox = this.getPlayerHitbox(this.playerBody.x, this.playerBody.y);
    this.playerHitboxDebug.clear();
    this.playerHitboxDebug.lineStyle(2, 0xff4d6d, 0.95);
    this.playerHitboxDebug.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
  }

  private setPlayerAttackFeedback(isAttacking: boolean): void {
    if (!this.playerBody) {
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
        const lootHitbox = this.getLootHitbox(loot.body.x, loot.body.y);
        if (this.collisionProvider.intersects(playerHitbox, lootHitbox)) {
          this.pickUpLoot(loot);
        }
      } else {
        const lootHitbox = this.getLootHitbox(loot.body.x, loot.body.y);
        if (this.collisionProvider.intersects(playerHitbox, lootHitbox)) {
          this.playInventoryError(now);
        }
      }
    }

    const isInsideSanctuary = this.isPlayerInsideSanctuary(playerHitbox);

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
    if (this.inventory.length === 0) {
      return;
    }

    if (this.nextLootDepositAt === null) {
      this.nextLootDepositAt = now + this.lootDepositIntervalMs;
      return;
    }

    if (now < this.nextLootDepositAt) {
      return;
    }

    const depositedLoot = this.inventory.shift();
    const depositedValue = depositedLoot?.value ?? 0;

    this.registry.set('score', (this.registry.get('score') ?? 0) + depositedValue);
    this.audioSystem?.playSfx(AUDIO_KEYS.DEPOSIT);
    this.showDepositValuePopup(depositedValue);
    this.nextLootDepositAt += this.lootDepositIntervalMs;

    if (this.inventory.length === 0) {
      this.nextLootDepositAt = null;
    }

    this.refreshLevelInfo();
  }

  private showDepositValuePopup(value: number): void {
    if (value <= 0 || !this.playerBody) {
      return;
    }

    const fontSize = value >= 50 ? '39px' : value >= 20 ? '34px' : '29px';
    const color = this.getDepositPopupColor(value);
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

  private getDepositPopupColor(value: number): string {
    if (value >= 50) {
      return '#ffd166';
    }

    if (value >= 20) {
      return '#80ed99';
    }

    return '#8ecae6';
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
    if (!this.gridSystem || this.activeEnemies.length === 0 || this.isGameOver) {
      return;
    }

    for (const enemy of this.activeEnemies) {
      if (enemy.escaped || enemy.defeated) {
        continue;
      }

      const deltaDistance = (delta / 1000) * enemy.speed;

      const nextGridCell = enemy.path[enemy.pathIndex + 1];
      if (!nextGridCell) {
        enemy.escaped = true;
        enemy.body.destroy();
        enemy.shadow.destroy();
        this.handleEnemyEscaped();
        continue;
      }

      const target = this.gridSystem.cellCenter(nextGridCell);
      const targetX = target.x;
      const targetY = target.y - 2;
      const vector = new Phaser.Math.Vector2(targetX - enemy.body.x, targetY - enemy.body.y);

      if (vector.length() <= deltaDistance) {
        enemy.body.setPosition(targetX, targetY);
        enemy.shadow.setPosition(target.x, target.y + 16);
        enemy.pathIndex += 1;
      } else {
        vector.normalize().scale(deltaDistance);
        enemy.body.setPosition(enemy.body.x + vector.x, enemy.body.y + vector.y);
        enemy.shadow.setPosition(enemy.body.x, enemy.body.y + 18);
      }

      this.updateEnemyRenderDepth(enemy);
    }

    this.activeEnemies = this.activeEnemies.filter((enemy) => !enemy.escaped && !enemy.defeated);
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

  private renderAttackEffect(): void {
    if (!this.attackDebug) {
      return;
    }

    this.attackDebug.clear();

    if (!this.attackRect || this.time.now > this.attackVisualUntil) {
      return;
    }

    this.attackDebug.fillStyle(0xffbe0b, 0.2);
    this.attackDebug.lineStyle(2, 0xffbe0b, 0.85);
    this.attackDebug.fillRect(this.attackRect.x, this.attackRect.y, this.attackRect.width, this.attackRect.height);
    this.attackDebug.strokeRect(this.attackRect.x, this.attackRect.y, this.attackRect.width, this.attackRect.height);
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
      `Aktív ellenfelek: ${this.activeEnemies.length} | Spawn ebben a hullámban: ${this.spawnedEnemies}/${count}`,
    );
    this.refreshHud();
  }

  private refreshLevelInfo(): void {
    this.levelInfoText?.setText(
      `Pálya: ${this.currentLevel?.name ?? 'betöltés alatt'} | Földön: ${this.activeLoots.length} tárgy | Leadási sáv: ${this.inventory.length > 0 ? 'aktív' : 'üres'}`,
    );
    this.refreshHud();
  }

  private refreshHud(): void {
    const escapedEnemies = this.registry.get('escapedEnemies') ?? 0;

    this.scoreValueText?.setText(`${this.registry.get('score') ?? 0} M Ft`);
    this.inventoryValueText?.setText(`${this.inventory.length}/${DEFAULT_LOOT_CONFIG.maxInventory}  ${this.getInventoryIcons()}`);
    this.escapedValueText?.setText(`${escapedEnemies}/${this.maxEscapedEnemies}`);
    this.updateEscapedEnemyWarningState(escapedEnemies);
    this.waveValueText?.setText(`${this.waveNumber}. hullám`);
  }

  private updateEscapedEnemyWarningState(escapedEnemies: number): void {
    if (!this.escapedValueText) {
      return;
    }

    const setColor = 'setColor' in this.escapedValueText ? this.escapedValueText.setColor?.bind(this.escapedValueText) : undefined;
    const setPosition =
      'setPosition' in this.escapedValueText ? this.escapedValueText.setPosition?.bind(this.escapedValueText) : undefined;

    if (escapedEnemies >= 8) {
      setColor?.(ESCAPED_WARNING_COLOR);

      if (!this.escapedValueWarningTween) {
        this.escapedValueWarningTween = this.tweens.add({
          targets: this.escapedValueText,
          x: (this.escapedValueBaseX ?? this.escapedValueText.x) + 4,
          duration: 55,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: -1,
        });
      }

      return;
    }

    setColor?.(HEADER_EMPHASIS_COLOR);
    this.escapedValueWarningTween?.stop();
    this.escapedValueWarningTween = undefined;

    if (this.escapedValueBaseX !== undefined && this.escapedValueBaseY !== undefined) {
      setPosition?.(this.escapedValueBaseX, this.escapedValueBaseY);
    }
  }

  private getInventoryIcons(): string {
    const filledSlots = '■'.repeat(this.inventory.length);
    const emptySlots = '□'.repeat(Math.max(0, DEFAULT_LOOT_CONFIG.maxInventory - this.inventory.length));

    return `${filledSlots}${emptySlots}`;
  }

  private isPlayerInsideSanctuary(playerHitbox: CollisionRect): boolean {
    return this.sanctuaryRects.some((rect) => this.collisionProvider.intersects(playerHitbox, rect));
  }

  private getLootHitbox(centerX: number, centerY: number): CollisionRect {
    return {
      x: centerX - this.lootSize.width / 2,
      y: centerY - this.lootSize.height / 2,
      width: this.lootSize.width,
      height: this.lootSize.height,
    };
  }

  private playInventoryError(now: number): void {
    if (now - this.lastInventoryErrorAt < this.inventoryErrorCooldownMs) {
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
