import Phaser from 'phaser';
import type { LevelData } from '../types/level';
import { GridSystem } from '../systems/GridSystem';
import type { CollisionRect } from '../systems/ICollisionProvider';
import { LevelLoader } from '../systems/LevelLoader';
import { SimpleCollisionProvider } from '../systems/SimpleCollisionProvider';
import { SCENE_KEYS } from './sceneKeys';

export class PlayScene extends Phaser.Scene {
  private readonly levelLoader = new LevelLoader();

  private readonly collisionProvider = new SimpleCollisionProvider();

  private readonly playerSpeed = 220;

  private readonly playerHitboxSize = { width: 22, height: 22 };

  private gridSystem?: GridSystem;

  private obstacleRects: CollisionRect[] = [];

  private playerBody?: Phaser.GameObjects.Ellipse;

  private playerShadow?: Phaser.GameObjects.Ellipse;

  private levelInfoText?: Phaser.GameObjects.Text;

  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;

  private keyW?: Phaser.Input.Keyboard.Key;

  private keyA?: Phaser.Input.Keyboard.Key;

  private keyS?: Phaser.Input.Keyboard.Key;

  private keyD?: Phaser.Input.Keyboard.Key;

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

    this.playerShadow = this.add.ellipse(0, 0, 24, 10, 0x111111, 0.35).setDepth(2);
    this.playerBody = this.add
      .ellipse(0, 0, 24, 30, 0xf4d35e, 1)
      .setStrokeStyle(2, 0x102a43, 1)
      .setDepth(3);
    this.playerShadow.setVisible(false);
    this.playerBody.setVisible(false);

    this.levelLoader
      .load('/levels/level-01.json')
      .then((level) => {
        this.obstacleRects = level.obstacles.map((cell) => this.gridSystem!.cellBounds(cell, 6));
        this.drawObstacleCells(level);
        this.spawnPlayer(level);

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
    if (!this.playerBody || !this.playerShadow || !this.gridSystem) {
      return;
    }

    if (!this.playerBody.visible) {
      return;
    }

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

    if (horizontal === 0 && vertical === 0) {
      return;
    }

    const direction = new Phaser.Math.Vector2(horizontal, vertical).normalize();
    const distance = (this.playerSpeed * delta) / 1000;

    this.tryMovePlayer(direction.x * distance, 0);
    this.tryMovePlayer(0, direction.y * distance);
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
    this.playerBody.setPosition(center.x, center.y - 8).setVisible(true);
    this.playerShadow.setPosition(center.x, center.y + 10).setVisible(true);
  }

  private tryMovePlayer(deltaX: number, deltaY: number): void {
    if (!this.playerBody || !this.playerShadow) {
      return;
    }

    const nextX = this.playerBody.x + deltaX;
    const nextY = this.playerBody.y + deltaY;
    const nextHitbox = this.getPlayerHitbox(nextX, nextY);

    if (!this.isInsidePlayArea(nextHitbox)) {
      return;
    }

    if (this.collisionProvider.collidesWithAny(nextHitbox, this.obstacleRects)) {
      return;
    }

    this.playerBody.setPosition(nextX, nextY);
    this.playerShadow.setPosition(nextX, nextY + 18);
  }

  private getPlayerHitbox(centerX: number, centerY: number): CollisionRect {
    return {
      x: centerX - this.playerHitboxSize.width / 2,
      y: centerY - this.playerHitboxSize.height / 2,
      width: this.playerHitboxSize.width,
      height: this.playerHitboxSize.height,
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
}
