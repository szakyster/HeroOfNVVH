import Phaser from 'phaser';
import { LeaderboardStorage } from '../systems/LeaderboardStorage';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { SCENE_KEYS } from './sceneKeys';

export class LeaderboardScene extends Phaser.Scene {
  private readonly leaderboardStorage = new LeaderboardStorage();

  constructor() {
    super(SCENE_KEYS.LEADERBOARD);
  }

  create(): void {
    const { width, height } = this.scale;
    const entries = this.leaderboardStorage.getEntries();

    addSceneBackground(this, 'leaderboard');
    this.add.rectangle(width / 2, height / 2, width * 0.7, height * 0.72, 0x102a43, 0.88).setStrokeStyle(2, 0xf4d35e, 0.4);

    this.add
      .text(width / 2, 110, 'Eredménylista', {
        fontFamily: 'Verdana',
        fontSize: '42px',
        color: '#f4f1de',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 154, 'A 10 legjobb eredmény helyben mentve', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#a8dadc',
      })
      .setOrigin(0.5);

    if (entries.length === 0) {
      this.add
        .text(width / 2, height / 2, 'Még nincs mentett eredmény.', {
          fontFamily: 'Verdana',
          fontSize: '24px',
          color: '#f1faee',
        })
        .setOrigin(0.5);
    } else {
      entries.forEach((entry, index) => {
        const rowY = 220 + index * 38;
        const rank = `${index + 1}.`;
        const dateLabel = formatDate(entry.createdAt);

        this.add
          .text(width / 2 - 250, rowY, rank, {
            fontFamily: 'Verdana',
            fontSize: '22px',
            color: '#ffd166',
          })
          .setOrigin(0, 0.5);

        this.add
          .text(width / 2 - 180, rowY, `${entry.score} M Ft`, {
            fontFamily: 'Verdana',
            fontSize: '22px',
            color: '#f1faee',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5);

        this.add
          .text(width / 2 + 50, rowY, dateLabel, {
            fontFamily: 'Verdana',
            fontSize: '18px',
            color: '#a8dadc',
          })
          .setOrigin(0, 0.5);
      });
    }

    this.createBackButton(width / 2, height - 92);

    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  private createBackButton(x: number, y: number): void {
    const button = this.add
      .text(x, y, 'Vissza a menübe', {
        fontFamily: 'Verdana',
        fontSize: '22px',
        color: '#f4f1de',
        backgroundColor: '#223247',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
    button.on('pointerover', () => {
      button.setStyle({ backgroundColor: '#314863' });
    });
    button.on('pointerout', () => {
      button.setStyle({ backgroundColor: '#223247' });
    });
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}