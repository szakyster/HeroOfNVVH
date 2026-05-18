import Phaser from 'phaser';
import { LeaderboardStorage } from '../systems/LeaderboardStorage';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { createSceneTextButton } from '../systems/UiButtons';
import { SCENE_KEYS } from './sceneKeys';

export class LeaderboardScene extends Phaser.Scene {
  private readonly leaderboardStorage = new LeaderboardStorage();

  private readonly listOffsetX = -205;

  private readonly rankColumnX = -220;

  private readonly scoreColumnX = -165;

  private readonly dateColumnX = 10;

  constructor() {
    super(SCENE_KEYS.LEADERBOARD);
  }

  create(): void {
    const { width, height } = this.scale;
    const entries = this.leaderboardStorage.getEntries();
    const listCenterX = width / 2 + this.listOffsetX;

    addSceneBackground(this, 'leaderboard');

    if (entries.length > 0) {
      entries.forEach((entry, index) => {
        const rowY = 190 + index * 42;
        const rank = `${index + 1}.`;
        const dateLabel = formatDate(entry.createdAt);

        this.add
          .text(listCenterX + this.rankColumnX, rowY, rank, {
            fontFamily: 'Verdana',
            fontSize: '22px',
            color: '#ffd166',
          })
          .setOrigin(0, 0.5);

        this.add
          .text(listCenterX + this.scoreColumnX, rowY, `${entry.score} M Ft`, {
            fontFamily: 'Verdana',
            fontSize: '22px',
            color: '#f1faee',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5);

        this.add
          .text(listCenterX + this.dateColumnX, rowY, dateLabel, {
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
    createSceneTextButton(this, {
      x,
      y,
      label: 'Vissza a menübe',
      width: 264,
      height: 38,
      fontSize: '20px',
      onSelect: () => {
      this.scene.start(SCENE_KEYS.MENU);
      },
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