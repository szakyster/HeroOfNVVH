import Phaser from 'phaser';
import { GridSystem } from '../systems/GridSystem';
import { LevelLoader } from '../systems/LevelLoader';
import { SCENE_KEYS } from './sceneKeys';

export class PlayScene extends Phaser.Scene {
  private readonly levelLoader = new LevelLoader();

  private readonly gridSystem = new GridSystem({
    columns: 7,
    rows: 6,
    originX: 180,
    originY: 130,
    cellTopWidth: 44,
    cellBottomWidth: 64,
    cellHeight: 36,
  });

  constructor() {
    super(SCENE_KEYS.PLAY);
  }

  create(): void {
    const { width, height } = this.scale;
    const graphics = this.add.graphics();

    this.add.rectangle(width / 2, height / 2, width, height, 0x1f2d3d, 1);

    graphics.lineStyle(1, 0x7ea8be, 0.7);
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
      .text(width / 2, height / 2 - 40, 'PlayScene', {
        fontFamily: 'Verdana',
        fontSize: '44px',
        color: '#f2cc8f',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 10, 'Task #3-tol jon a palya + gameplay', {
        fontFamily: 'Verdana',
        fontSize: '22px',
        color: '#f4f1de',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 70, 'Task #4: 7x6 trapezoid grid aktiv', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#9fd3c7',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 50, 'Nyomj G-t a Game Over teszthez', {
        fontFamily: 'Verdana',
        fontSize: '20px',
        color: '#81b29a',
      })
      .setOrigin(0.5);

    const levelInfoText = this.add
      .text(width / 2, height / 2 + 108, 'Palyabetoltes: folyamatban...', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#c9d6df',
      })
      .setOrigin(0.5);

    this.levelLoader
      .load('/levels/level-01.json')
      .then((level) => {
        levelInfoText.setText(
          `Palya: ${level.name} | Akadalyok: ${level.obstacles.length} | Loot: ${level.lootSpawns.length}`,
        );
      })
      .catch((error: unknown) => {
        levelInfoText.setText('Palyabetoltes hiba');
        console.error('Level loading failed', error);
      });

    this.input.keyboard?.on('keydown-G', () => {
      const currentScore = this.registry.get('score') ?? 0;
      this.scene.start(SCENE_KEYS.GAME_OVER, { score: currentScore });
    });
  }
}
