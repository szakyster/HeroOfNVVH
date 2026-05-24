import Phaser from 'phaser';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { getFirstLevelId, getOrderedLevelCatalog } from '../systems/LevelCatalog';
import { getLevelIconAssetKey, hasLevelIconAsset } from '../systems/LevelIconAssets';
import { LevelLoader } from '../systems/LevelLoader';
import { LevelProgressStorage } from '../systems/LevelProgressStorage';
import { createSceneTextButton } from '../systems/UiButtons';
import type { LevelData } from '../types/level';
import { SCENE_KEYS } from './sceneKeys';

type LevelSelectEntryState = {
  isUnlocked: boolean;
  isCompleted: boolean;
};

type PlaySceneStartData = {
  levelId: string;
};

const BACK_BUTTON_LOCK_MS = 1000;

function getLevelRowCenterY(index: number, totalLevels: number): number {
  // Pull the list upward as it grows so six authored levels still fit on the fixed screen height.
  return 242 - Math.max(0, totalLevels - 2) * 30 + index * 90;
}

export class LevelSelectScene extends Phaser.Scene {
  private readonly levelLoader = new LevelLoader();

  private readonly progressStorage = new LevelProgressStorage(getFirstLevelId());

  private isBackButtonEnabled = false;

  constructor() {
    super(SCENE_KEYS.LEVEL_SELECT);
  }

  create(): void {
    // Build the level selection view from the authored level metadata and saved progress.
    this.isBackButtonEnabled = false;

    addSceneBackground(this, 'menu');

    const backButton = createSceneTextButton(this, {
      x: 512,
      y: 710,
      label: 'Vissza',
      width: 180,
      height: 36,
      fontSize: '18px',
      triggerEvent: 'pointerup',
      onSelect: () => {
        if (!this.isBackButtonEnabled) {
          return;
        }

        this.openMenu();
      },
    });

    backButton.setAlpha(0.65);
    this.time.delayedCall(BACK_BUTTON_LOCK_MS, () => {
      this.isBackButtonEnabled = true;
      backButton.setAlpha(1);
    });

    this.input.keyboard?.once('keydown-M', () => {
      this.openMenu();
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      this.openMenu();
    });
    void this.renderLevelEntries();
  }

  private async renderLevelEntries(): Promise<void> {
    // Load the authored levels once so the selection screen reflects live JSON metadata.
    const loadingText = this.add
      .text(512, 330, 'Pályák betöltése...', {
        fontFamily: 'Verdana',
        fontSize: '20px',
        color: '#f4f1de',
      })
      .setOrigin(0.5);

    try {
      const levelCatalog = getOrderedLevelCatalog();
      const progressState = this.progressStorage.getState();
      const levels = await Promise.all(levelCatalog.map((entry) => this.levelLoader.load(entry.path)));

      loadingText.setText('');

      levels.forEach((level, index) => {
        const state: LevelSelectEntryState = {
          isUnlocked: progressState.unlockedLevelIds.includes(level.id),
          isCompleted: progressState.completedLevelIds.includes(level.id),
        };

        this.renderLevelRow(level, state, getLevelRowCenterY(index, levels.length));
      });
    } catch (error) {
      loadingText.setText('Pályabetöltési hiba');
      console.error('Level select loading failed', error);
    }
  }

  private renderLevelRow(level: LevelData, state: LevelSelectEntryState, y: number): void {
    // Each row shows the preview icon, the target score, and whether the level is available.
    const left = 252;
    const top = y - 44;
    const width = 520;
    const height = 88;
    const panelColor = state.isUnlocked ? 0x17324a : 0x30333b;
    const borderColor = state.isUnlocked ? 0xe6c15a : 0x7b7f87;

    this.add.graphics()
      .fillStyle(0x08131d, 0.38)
      .fillRoundedRect(left + 4, top + 6, width, height, 16)
      .fillStyle(panelColor, 0.94)
      .fillRoundedRect(left, top, width, height, 16)
      .lineStyle(2, borderColor, 1)
      .strokeRoundedRect(left, top, width, height, 16)
      .lineStyle(2, state.isUnlocked ? 0x79c7c5 : 0x595f69, 0.9)
      .strokeRoundedRect(left + 8, top + 8, 504, 72, 12);

    this.renderLevelIcon(level, left + 52, y);

    this.add
      .text(left + 102, y - 16, level.name, {
        fontFamily: 'Verdana',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#f4f1de',
      })
      .setOrigin(0, 0.5);

    this.add
      .text(left + 102, y + 18, `Cél: ${level.targetScore} M Ft`, {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#f2cc8f',
      })
      .setOrigin(0, 0.5);

    if (state.isUnlocked) {
      const interactiveOverlay = this.add
        .rectangle(left + width / 2, top + height / 2, width, height, 0x000000, 0.001)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          interactiveOverlay.setFillStyle(0xf6d878, 0.12);
        })
        .on('pointerout', () => {
          interactiveOverlay.setFillStyle(0x000000, 0.001);
        })
        .on('pointerup', () => {
          this.startLevel(level.id);
        });

      this.add
        .text(left + 445, y, state.isCompleted ? 'Teljesítve' : 'Elérhető', {
          fontFamily: 'Verdana',
          fontSize: '14px',
          color: state.isCompleted ? '#81b29a' : '#f4f1de',
        })
        .setOrigin(0.5);

      return;
    }

    this.add
      .text(left + 400, y - 4, '🔒', {
        fontFamily: 'Verdana',
        fontSize: '24px',
        color: '#c9ced6',
      })
      .setOrigin(0.5);

    this.add
      .text(left + 445, y, 'Zárolva', {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#c9ced6',
      })
      .setOrigin(0.5);
  }

  private renderLevelIcon(level: LevelData, x: number, y: number): void {
    // Render the authored preview texture when available, otherwise show a neutral placeholder.
    if (hasLevelIconAsset(level.icon)) {
      this.add.image(x, y, getLevelIconAssetKey(level.icon)).setDisplaySize(56, 56).setOrigin(0.5);
      return;
    }

    this.add.graphics().fillStyle(0x5b6470, 0.95).fillCircle(x, y, 28).lineStyle(2, 0xd8dde4, 1).strokeCircle(x, y, 28);
    this.add
      .text(x, y, '?', {
        fontFamily: 'Verdana',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#f4f1de',
      })
      .setOrigin(0.5);
  }

  private startLevel(levelId: string): void {
    // Persist the selected level so later flows can resume the same run.
    this.progressStorage.setLastPlayedLevel(levelId);
    this.scene.start(SCENE_KEYS.PLAY, { levelId } satisfies PlaySceneStartData);
  }

  private openMenu(): void {
    // Returning from level select always goes back to the main menu.
    this.scene.start(SCENE_KEYS.MENU);
  }
}