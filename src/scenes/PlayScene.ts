import Phaser from 'phaser';
import type { LevelData } from '../types/level';
import type { GridCell } from '../types/level';
import { GridSystem } from '../systems/GridSystem';
import type { CollisionRect } from '../systems/ICollisionProvider';
import { AStarPathfinder } from '../systems/AStarPathfinder';
import {
  createAttackRect,
  DEFAULT_ATTACK_CONFIG,
  getKnockbackDelta,
  type FacingDirection,
} from '../systems/AttackSystem';
import { AUDIO_KEYS, AudioSystem, getAudioSystem } from '../systems/AudioSystem';
import { LevelLoader } from '../systems/LevelLoader';
import {
  DEFAULT_LOOT_CONFIG,
  getLootAlpha,
  isInventoryFull,
  isLootExpired,
} from '../systems/LootSystem';
import { SimpleCollisionProvider } from '../systems/SimpleCollisionProvider';
import { SCENE_KEYS } from './sceneKeys';

type ActiveEnemy = {
  body: Phaser.GameObjects.Ellipse;
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
  body: Phaser.GameObjects.Rectangle;
  shadow: Phaser.GameObjects.Ellipse;
  createdAt: number;
};

export class PlayScene extends Phaser.Scene {
  private readonly levelLoader = new LevelLoader();

  private readonly collisionProvider = new SimpleCollisionProvider();

  private readonly pathfinder = new AStarPathfinder();

  private readonly playerSpeed = 220;

  private readonly enemySpeed = 88;

  private readonly playerHitboxSize = { width: 66, height: 36 };

  private readonly playerHitboxOffsetY = 27.1;

  private readonly enemyHitboxSize = { width: 42, height: 26 };

  private readonly enemyHitboxOffsetY = 20;

  private readonly attackCooldownMs = 420;

  private readonly attackDurationMs = 120;

  private readonly maxEscapedEnemies = 10;

  private readonly lootSize = { width: 28, height: 20 };

  private readonly lootDepositIntervalMs = 400;

  private gridSystem?: GridSystem;

  private currentLevel?: LevelData;

  private obstacleRects: CollisionRect[] = [];

  private sanctuaryRects: CollisionRect[] = [];

  private playerBody?: Phaser.GameObjects.Ellipse;

  private playerShadow?: Phaser.GameObjects.Ellipse;

  private playerHitboxDebug?: Phaser.GameObjects.Graphics;

  private enemyHitboxDebug?: Phaser.GameObjects.Graphics;

  private attackDebug?: Phaser.GameObjects.Graphics;

  private levelInfoText?: Phaser.GameObjects.Text;

  private enemyInfoText?: Phaser.GameObjects.Text;

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
    this.audioSystem = getAudioSystem(this);
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

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.keyW = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.registry.set('score', 0);
    this.registry.set('escapedEnemies', 0);

    this.add.rectangle(width / 2, height / 2, width, height, 0x1f2d3d, 1);

    const graphics = this.add.graphics();
    graphics.setDepth(1);

    graphics.lineStyle(2, 0x8ecae6, 0.95);
    for (const cell of this.gridSystem.allCells()) {
      const polygon = this.gridSystem.cellPolygon(cell);
      graphics.beginPath();
      graphics.moveTo(polygon[0].x, polygon[0].y);
      graphics.lineTo(polygon[1].x, polygon[1].y);
      graphics.lineTo(polygon[2].x, polygon[2].y);
      graphics.lineTo(polygon[3].x, polygon[3].y);
      graphics.closePath();
      graphics.strokePath();
    }

    this.add
      .text(width / 2, 34, 'PlayScene', {
        fontFamily: 'Verdana',
        fontSize: '36px',
        color: '#f2cc8f',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 68, 'Task #3-tol jon a palya + gameplay', {
        fontFamily: 'Verdana',
        fontSize: '20px',
        color: '#f4f1de',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 96, 'Task #4: 7x6 perspektivikus trapEz grid aktiv', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#9fd3c7',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 34, 'Mozgas: WASD vagy nyilak | SPACE: Tamadas | G: Game Over teszt', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#81b29a',
      })
      .setOrigin(0.5);

    this.levelInfoText = this.add
      .text(width / 2, height - 62, 'Palyabetoltes: folyamatban...', {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#c9d6df',
      })
      .setOrigin(0.5);

    this.enemyInfoText = this.add
      .text(width / 2, height - 88, 'Enemy wave: inicializalas...', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#ffb703',
      })
      .setOrigin(0.5);

    this.playerShadow = this.add.ellipse(0, 0, 72, 30, 0x111111, 0.35).setDepth(2);
    this.playerBody = this.add
      .ellipse(0, 0, 72, 90, 0xf4d35e, 1)
      .setStrokeStyle(2, 0x102a43, 1)
      .setDepth(3);
    // DEBUG: Keep hitboxes visible during development. Remove before release build.
    this.playerHitboxDebug = this.add.graphics().setDepth(4);
    // DEBUG: Keep hitboxes visible during development. Remove before release build.
    this.enemyHitboxDebug = this.add.graphics().setDepth(4);
    this.attackDebug = this.add.graphics().setDepth(4.5);
    this.playerShadow.setVisible(false);
    this.playerBody.setVisible(false);

    this.levelLoader
      .load('/levels/level-01.json')
      .then((level) => {
        this.currentLevel = level;
        this.obstacleRects = level.obstacles.map((cell) => this.gridSystem!.cellBounds(cell, 10));
        this.sanctuaryRects = level.sanctuaryZone.map((cell) => this.gridSystem!.cellBounds(cell, 10));
        this.drawObstacleCells(level);
        this.drawSanctuaryZone(level);
        this.spawnPlayer(level);
        this.startEnemyWave(level);
        this.refreshLevelInfo();
      })
      .catch((error: unknown) => {
        this.levelInfoText?.setText('Palyabetoltes hiba');
        console.error('Level loading failed', error);
      });

    this.input.keyboard?.on('keydown-G', () => {
      const currentScore = this.registry.get('score') ?? 0;
      this.scene.start(SCENE_KEYS.GAME_OVER, { score: currentScore });
    });
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
    const graphics = this.add.graphics();
    graphics.setDepth(1.5);

    for (const cell of level.obstacles) {
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
    const body = this.add
      .ellipse(startPoint.x, startPoint.y - 2, 42, 58, 0xe63946, 1)
      .setStrokeStyle(2, 0x3d0c11, 1)
      .setDepth(3);

    this.activeEnemies.push({
      body,
      shadow,
      path,
      pathIndex: 0,
      speed: this.enemySpeed * Phaser.Math.FloatBetween(0.75, 1.25),
      hitsTaken: 0,
      lootDropped: false,
      escaped: false,
      defeated: false,
    });

    return true;
  }

  private buildEnemyPath(level: LevelData, spawnCell: GridCell, goalCell: GridCell): GridCell[] | null {
    const waypoint = this.pickEnemyWaypoint(level, spawnCell, goalCell);

    if (waypoint) {
      const waypointPath = this.pathfinder.findPathViaWaypoint(
        level.grid.width,
        level.grid.height,
        spawnCell,
        waypoint,
        goalCell,
        level.obstacles,
      );

      if (waypointPath && waypointPath.length > 0) {
        return waypointPath;
      }
    }

    return this.pathfinder.findPath(level.grid.width, level.grid.height, spawnCell, goalCell, level.obstacles);
  }

  private pickEnemyWaypoint(level: LevelData, spawnCell: GridCell, goalCell: GridCell): GridCell | null {
    const blockedKeys = new Set(level.obstacles.map((cell) => this.cellKey(cell)));
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
        level.obstacles,
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
    this.renderPlayerHitbox();
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

    this.playerBody.setFillStyle(0xffe08a, 1);
    this.time.delayedCall(this.attackDurationMs, () => {
      this.attackRect = null;
      this.playerBody?.setFillStyle(0xf4d35e, 1);
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

      enemy.body.setFillStyle(0xf77f00, 1);
      enemy.body.setStrokeStyle(2, 0x6a040f, 1);
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
  }

  private defeatEnemy(enemy: ActiveEnemy): void {
    enemy.defeated = true;
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

    const shadow = this.add
      .ellipse(enemy.body.x, enemy.body.y + 18, 24, 10, 0x111111, 0.22)
      .setDepth(2.1);
    const body = this.add
      .rectangle(enemy.body.x, enemy.body.y + 4, this.lootSize.width, this.lootSize.height, this.getLootColor(template.type), 1)
      .setStrokeStyle(2, 0x1d3557, 0.9)
      .setDepth(2.6);

    this.activeLoots.push({
      id: `${template.id}-${this.droppedLootCount}`,
      type: template.type,
      value: template.value,
      body,
      shadow,
      createdAt: this.time.now,
    });
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
    this.registry.set('score', (this.registry.get('score') ?? 0) + (depositedLoot?.value ?? 0));
    this.audioSystem?.playSfx(AUDIO_KEYS.DEPOSIT);
    this.nextLootDepositAt += this.lootDepositIntervalMs;

    if (this.inventory.length === 0) {
      this.nextLootDepositAt = null;
    }

    this.refreshLevelInfo();
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

    if (escapedEnemies >= this.maxEscapedEnemies) {
      this.triggerGameOver();
    }
  }

  private refreshEnemyInfo(count: number = this.targetEnemyCount): void {
    const escapedEnemies = this.registry.get('escapedEnemies') ?? 0;
    this.enemyInfoText?.setText(
      `${this.waveNumber}. hullam: ${this.spawnedEnemies}/${count} ellenfel | Elmenekult: ${escapedEnemies}/${this.maxEscapedEnemies}`,
    );
  }

  private refreshLevelInfo(): void {
    if (!this.currentLevel) {
      return;
    }

    this.levelInfoText?.setText(
      `Palya: ${this.currentLevel.name} | Inventory: ${this.getInventoryIcons()} | M Ft: ${this.registry.get('score') ?? 0} | Foldon: ${this.activeLoots.length}`,
    );
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

  private getLootColor(type: string): number {
    if (type === 'wallet') {
      return 0x8d6e63;
    }

    if (type === 'phone') {
      return 0x577590;
    }

    if (type === 'bag') {
      return 0x6a994e;
    }

    return 0xe9c46a;
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
    this.audioSystem?.stopMusic();
    this.audioSystem?.playSfx(AUDIO_KEYS.ERROR);
    const currentScore = this.registry.get('score') ?? 0;
    this.scene.start(SCENE_KEYS.GAME_OVER, { score: currentScore });
  }
}
