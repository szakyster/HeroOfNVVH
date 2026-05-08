import Phaser from 'phaser';
import type { LevelData } from '../types/level';
import type { GridCell } from '../types/level';
import { GridSystem } from '../systems/GridSystem';
import type { CollisionRect } from '../systems/ICollisionProvider';
import { AStarPathfinder } from '../systems/AStarPathfinder';
import { LevelLoader } from '../systems/LevelLoader';
import { SimpleCollisionProvider } from '../systems/SimpleCollisionProvider';
import { SCENE_KEYS } from './sceneKeys';

type ActiveEnemy = {
  body: Phaser.GameObjects.Ellipse;
  shadow: Phaser.GameObjects.Ellipse;
  path: GridCell[];
  pathIndex: number;
  speed: number;
  escaped: boolean;
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

  private gridSystem?: GridSystem;

  private obstacleRects: CollisionRect[] = [];

  private playerBody?: Phaser.GameObjects.Ellipse;

  private playerShadow?: Phaser.GameObjects.Ellipse;

  private playerHitboxDebug?: Phaser.GameObjects.Graphics;

  private enemyHitboxDebug?: Phaser.GameObjects.Graphics;

  private levelInfoText?: Phaser.GameObjects.Text;

  private enemyInfoText?: Phaser.GameObjects.Text;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private keyW?: Phaser.Input.Keyboard.Key;

  private keyA?: Phaser.Input.Keyboard.Key;

  private keyS?: Phaser.Input.Keyboard.Key;

  private keyD?: Phaser.Input.Keyboard.Key;

  private activeEnemies: ActiveEnemy[] = [];

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
      .text(width / 2, height - 34, 'Mozgas: WASD vagy nyilak | G: Game Over teszt', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#81b29a',
      })
      .setOrigin(0.5);

    this.levelInfoText = this.add
      .text(width / 2, height - 62, 'Palyabetoltes: folyamatban...', {
        fontFamily: 'Verdana',
        fontSize: '18px',
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
    this.playerShadow.setVisible(false);
    this.playerBody.setVisible(false);

    this.levelLoader
      .load('/levels/level-01.json')
      .then((level) => {
        this.obstacleRects = level.obstacles.map((cell) => this.gridSystem!.cellBounds(cell, 10));
        this.drawObstacleCells(level);
        this.spawnPlayer(level);
        this.startEnemyWave(level);

        this.levelInfoText?.setText(
          `Palya: ${level.name} | Akadalyok: ${level.obstacles.length} | Loot: ${level.lootSpawns.length}`,
        );
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
    if (!this.playerBody || !this.playerShadow || !this.gridSystem || !this.playerHitboxDebug) {
      return;
    }

    if (!this.playerBody.visible) {
      return;
    }

    this.renderPlayerHitbox();
    this.updateEnemies(delta);
    this.renderEnemyHitboxes();

    let horizontal = 0;
    let vertical = 0;

    if (this.cursors?.left.isDown || this.keyA?.isDown) {
      horizontal -= 1;
    }
    if (this.cursors?.right.isDown || this.keyD?.isDown) {
      horizontal += 1;
    }
    if (this.cursors?.up.isDown || this.keyW?.isDown) {
      vertical -= 1;
    }
    if (this.cursors?.down.isDown || this.keyS?.isDown) {
      vertical += 1;
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
    this.enemyInfoText?.setText(`${this.waveNumber}. hullam: 0/${count} ellenfel`);

    for (let i = 0; i < count; i++) {
      const baseDelay = (i / count) * (waveWindow-1500);
      const randomExtra = Math.random() * 1000;
      this.time.delayedCall(baseDelay + randomExtra, () => {
        const spawned = this.spawnEnemy(level);
        if (spawned) {
          this.spawnedEnemies += 1;
          this.enemyInfoText?.setText(`${this.waveNumber}. hullam: ${this.spawnedEnemies}/${count} ellenfel`);
        }
      });
    }

    this.time.delayedCall(waveWindow, () => {
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
      escaped: false,
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

  private updateEnemies(delta: number): void {
    if (!this.gridSystem || this.activeEnemies.length === 0) {
      return;
    }

    for (const enemy of this.activeEnemies) {
      if (enemy.escaped) {
        continue;
      }

      const deltaDistance = (delta / 1000) * enemy.speed;

      const nextGridCell = enemy.path[enemy.pathIndex + 1];
      if (!nextGridCell) {
        enemy.escaped = true;
        enemy.body.destroy();
        enemy.shadow.destroy();
        this.registry.set('escapedEnemies', (this.registry.get('escapedEnemies') ?? 0) + 1);
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

    this.activeEnemies = this.activeEnemies.filter((enemy) => !enemy.escaped);
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
}
