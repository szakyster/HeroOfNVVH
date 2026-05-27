import Phaser from 'phaser';
import { getFirstLevelId, getOrderedLevelCatalog } from '../systems/LevelCatalog';
import { LeaderboardStorage } from '../systems/LeaderboardStorage';
import { LevelProgressStorage } from '../systems/LevelProgressStorage';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { createSceneTextButton } from '../systems/UiButtons';
import { SCENE_KEYS } from './sceneKeys';

type LeaderboardSceneData = {
  levelId?: string;
};

export class LeaderboardScene extends Phaser.Scene {
  private readonly leaderboardStorage = new LeaderboardStorage();

  private readonly progressStorage = new LevelProgressStorage(getFirstLevelId());

  private readonly listOffsetX = -205;

  private readonly rankColumnX = -220;

  private readonly scoreColumnX = -165;

  private readonly dateColumnX = 10;

  private selectedLevelId = getFirstLevelId();

  private renderedEntryTexts: Phaser.GameObjects.Text[] = [];

  private levelSelectorButtons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(SCENE_KEYS.LEADERBOARD);
  }

  create(data: LeaderboardSceneData = {}): void {
    const { width, height } = this.scale;
    const listCenterX = width / 2 + this.listOffsetX;
    const fallbackLevelId = this.progressStorage.getState().lastPlayedLevelId;

    this.selectedLevelId = data.levelId ?? fallbackLevelId;

    addSceneBackground(this, 'leaderboard');

    this.createLevelSelector(width / 2, 176);
    this.renderSelectedLeaderboard(listCenterX);

    this.createBackButton(width / 2, height - 92);

    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });

    this.input.keyboard?.once('keydown-M', () => {
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  // Let the player switch between the individual level leaderboards on the same screen.
  private createLevelSelector(centerX: number, y: number): void {
    const levels = getOrderedLevelCatalog();
    const buttonsPerRow = 3;
    const horizontalSpacing = 96;
    const verticalSpacing = 42;
    const selectorCenterX = centerX - 200;
    const selectorStartY = y - 10;

    this.levelSelectorButtons = [];

    levels.forEach((level, index) => {
      const column = index % buttonsPerRow;
      const row = Math.floor(index / buttonsPerRow);
      const rowWidth = Math.min(buttonsPerRow, levels.length - row * buttonsPerRow);
      const rowStartX = selectorCenterX - ((rowWidth - 1) * horizontalSpacing) / 2;

      const button = createSceneTextButton(this, {
        x: rowStartX + column * horizontalSpacing,
        y: selectorStartY + row * verticalSpacing,
        label: formatLevelLabel(level.id),
        width: 92,
        height: 34,
        fontSize: '16px',
        onSelect: () => {
          this.selectedLevelId = level.id;
          this.refreshLevelSelectorButtons();
          this.renderSelectedLeaderboard(this.scale.width / 2 + this.listOffsetX);
        },
      });

      button.setData('level-id', level.id);
      this.levelSelectorButtons.push(button);
    });

    this.refreshLevelSelectorButtons();
  }

  private refreshLevelSelectorButtons(): void {
    this.levelSelectorButtons.forEach((button) => {
      const isSelected = button.getData('level-id') === this.selectedLevelId;

      button.setStyle({
        color: isSelected ? '#ffd166' : '#f8f1d2',
      });
      button.setAlpha(isSelected ? 1 : 0.9);
      button.setScale(isSelected ? 1.06 : 1);
    });
  }

  private renderSelectedLeaderboard(listCenterX: number): void {
    this.renderedEntryTexts.forEach((text) => {
      text.destroy();
    });
    this.renderedEntryTexts = [];

    const entries = this.leaderboardStorage.getEntries(this.selectedLevelId);

    if (entries.length === 0) {
      this.renderedEntryTexts.push(
        this.add
          .text(this.scale.width / 2 - 200, 294, 'Még nincs mentett eredmény.', {
            fontFamily: 'Verdana',
            fontSize: '20px',
            color: '#f4f1de',
          })
          .setOrigin(0.5),
      );
      return;
    }

    entries.forEach((entry, index) => {
      const rowY = 260 + index * 42;
      const rank = `${index + 1}.`;
      const dateLabel = formatDate(entry.createdAt);

      this.renderedEntryTexts.push(
        this.add
          .text(listCenterX + this.rankColumnX, rowY, rank, {
            fontFamily: 'Verdana',
            fontSize: '22px',
            color: '#ffd166',
          })
          .setOrigin(0, 0.5),
      );

      this.renderedEntryTexts.push(
        this.add
          .text(listCenterX + this.scoreColumnX, rowY, `${entry.score} M Ft`, {
            fontFamily: 'Verdana',
            fontSize: '22px',
            color: '#f1faee',
            fontStyle: 'bold',
          })
          .setOrigin(0, 0.5),
      );

      this.renderedEntryTexts.push(
        this.add
          .text(listCenterX + this.dateColumnX, rowY, dateLabel, {
            fontFamily: 'Verdana',
            fontSize: '18px',
            color: '#a8dadc',
          })
          .setOrigin(0, 0.5),
      );
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

function formatLevelLabel(levelId: string): string {
  const match = /level-(\d+)/i.exec(levelId);
  if (!match) {
    return levelId;
  }

  return `Pálya ${Number(match[1])}`;
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