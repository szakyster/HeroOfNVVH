import Phaser from 'phaser';
import {
  AUDIO_KEYS,
  applyAudioSettingsFromRegistry,
  getAudioSystem,
  loadAudioSettingsIntoRegistry,
} from '../systems/AudioSystem';
import { getOrderedLevelCatalog } from '../systems/LevelCatalog';
import { getAvailableLevelIconAssets } from '../systems/LevelIconAssets';
import { preloadSceneBackgrounds } from '../systems/SceneBackgrounds';
import { getAvailableHrsAssets } from '../systems/HrsAssets';
import { getAvailableLootAssets } from '../systems/LootAssets';
import { getAvailableObstacleAssets } from '../systems/ObstacleAssets';
import { getAvailableUiAssets } from '../systems/UiAssets';
import { SCENE_KEYS } from './sceneKeys';

const BOOT_HANDOFF_DELAY_MS = 120;
const BOOT_PROGRESS_BAR_WIDTH = 320;
const BOOT_REGISTRY_DEFAULTS = {
  score: 0,
  escapedEnemies: 0,
  currentWave: 1,
} as const;

type BootLoadingUi = {
  progressFill?: Phaser.GameObjects.Rectangle;
  progressLabel?: Phaser.GameObjects.Text;
  statusLabel?: Phaser.GameObjects.Text;
};

const HERO_SPRITE_SHEETS = [
  { key: 'hero-psz01-idle-down', url: 'assets/sprites/PSZ01/idle_down.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-idle-northeast', url: 'assets/sprites/PSZ01/idle_northeast.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-idle-right', url: 'assets/sprites/PSZ01/idle_right.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-idle-southeast', url: 'assets/sprites/PSZ01/idle_southeast.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-idle-up', url: 'assets/sprites/PSZ01/idle_up.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-punch-down', url: 'assets/sprites/PSZ01/punch_down.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-punch-right', url: 'assets/sprites/PSZ01/punch_right.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-punch-up', url: 'assets/sprites/PSZ01/punch_up.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-run-down', url: 'assets/sprites/PSZ01/run_down.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-run-northeast', url: 'assets/sprites/PSZ01/run_northeast.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-run-right', url: 'assets/sprites/PSZ01/run_right.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-run-southeast', url: 'assets/sprites/PSZ01/run_southeast.png', frameWidth: 256, frameHeight: 256 },
  { key: 'hero-psz01-run-up', url: 'assets/sprites/PSZ01/run_up.png', frameWidth: 256, frameHeight: 256 },
];

const ENEMY_SPRITE_FRAME_SIZE = 256;

const ENEMY_SPRITE_SHEETS = [
  { key: 'enemy-01-walk-down', url: 'assets/sprites/enemy01/walk_down.png' },
  { key: 'enemy-01-walk-right', url: 'assets/sprites/enemy01/walk_right.png' },
  { key: 'enemy-01-walk-up', url: 'assets/sprites/enemy01/walk_up.png' },
  { key: 'enemy-02-walk-down', url: 'assets/sprites/enemy02/walk_down.png' },
  { key: 'enemy-02-walk-right', url: 'assets/sprites/enemy02/walk_right.png' },
  { key: 'enemy-02-walk-up', url: 'assets/sprites/enemy02/walk_up.png' },
  { key: 'enemy-03-walk-down', url: 'assets/sprites/enemy03/walk_down.png' },
  { key: 'enemy-03-walk-right', url: 'assets/sprites/enemy03/walk_right.png' },
  { key: 'enemy-03-walk-up', url: 'assets/sprites/enemy03/walk_up.png' },
  { key: 'enemy-04-walk-down', url: 'assets/sprites/enemy04/walk_down.png' },
  { key: 'enemy-04-walk-right', url: 'assets/sprites/enemy04/walk_right.png' },
  { key: 'enemy-04-walk-up', url: 'assets/sprites/enemy04/walk_up.png' },
  { key: 'enemy-01-injured-down', url: 'assets/sprites/enemy01/injured_down.png' },
  { key: 'enemy-01-injured-right', url: 'assets/sprites/enemy01/injured_right.png' },
  { key: 'enemy-01-injured-up', url: 'assets/sprites/enemy01/injured_up.png' },
  { key: 'enemy-02-injured-down', url: 'assets/sprites/enemy02/injured_down.png' },
  { key: 'enemy-02-injured-right', url: 'assets/sprites/enemy02/injured_right.png' },
  { key: 'enemy-02-injured-up', url: 'assets/sprites/enemy02/injured_up.png' },
  { key: 'enemy-03-injured-down', url: 'assets/sprites/enemy03/injured_down.png' },
  { key: 'enemy-03-injured-right', url: 'assets/sprites/enemy03/injured_right.png' },
  { key: 'enemy-03-injured-up', url: 'assets/sprites/enemy03/injured_up.png' },
  { key: 'enemy-04-injured-down', url: 'assets/sprites/enemy04/injured_down.png' },
  { key: 'enemy-04-injured-right', url: 'assets/sprites/enemy04/injured_right.png' },
  { key: 'enemy-04-injured-up', url: 'assets/sprites/enemy04/injured_up.png' },
];

export class BootScene extends Phaser.Scene {
  private loadingUi: BootLoadingUi = {};

  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    // Preload shared scene and preview assets before handing control to the menu flow.
    this.createLoadingOverlay();
    this.registerLoadingEvents();
    preloadSceneBackgrounds(this);
    this.preloadLevelData();

    for (const heroSheet of HERO_SPRITE_SHEETS) {
      this.load.spritesheet(heroSheet.key, heroSheet.url, {
        frameWidth: heroSheet.frameWidth,
        frameHeight: heroSheet.frameHeight,
      });
    }

    for (const enemySheet of ENEMY_SPRITE_SHEETS) {
      this.load.spritesheet(enemySheet.key, enemySheet.url, {
        frameWidth: ENEMY_SPRITE_FRAME_SIZE,
        frameHeight: ENEMY_SPRITE_FRAME_SIZE,
      });
    }

    for (const obstacleAsset of getAvailableObstacleAssets()) {
      this.load.image(obstacleAsset.key, [obstacleAsset.url]);
    }

    for (const hrsAsset of getAvailableHrsAssets()) {
      this.load.image(hrsAsset.key, [hrsAsset.url]);
    }

    for (const lootAsset of getAvailableLootAssets()) {
      this.load.image(lootAsset.key, [lootAsset.url]);
    }

    for (const uiAsset of getAvailableUiAssets()) {
      this.load.image(uiAsset.key, [uiAsset.url]);
    }

    for (const levelIconAsset of getAvailableLevelIconAssets()) {
      this.load.image(levelIconAsset.key, [levelIconAsset.url]);
    }

    this.load.audio(AUDIO_KEYS.ATTACK, ['assets/audio/effect/Punch01.mp3']);
    this.load.audio(AUDIO_KEYS.ALARM, ['assets/audio/alarm.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_1, ['assets/audio/effect/death01.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_2, ['assets/audio/effect/death02.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_3, ['assets/audio/effect/death03.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_4, ['assets/audio/effect/death04.mp3']);
    this.load.audio(AUDIO_KEYS.MENU, ['assets/audio/Preparation of hunting.mp3']);
    this.load.audio(AUDIO_KEYS.AMBIENT, ['assets/audio/The Hero.mp3']);
  }

  create(): void {
    // Seed the shared registry once so all scenes start from the same defaults.
    this.seedSharedRegistryDefaults();
    loadAudioSettingsIntoRegistry(this);
    const audioSystem = getAudioSystem(this);

    audioSystem.setMasterVolume(0.35);
    audioSystem.setMuted(false);
    applyAudioSettingsFromRegistry(this);

    this.loadingUi.statusLabel?.setText('Indítás...');

    this.handoffToMenu();
  }

  private createLoadingOverlay(): void {
    // Render a lightweight loading screen so startup work gives immediate feedback.
    const { width, height } = this.scale;
    const barX = width / 2 - BOOT_PROGRESS_BAR_WIDTH / 2;
    const barY = height / 2 + 42;

    this.add.rectangle(width / 2, height / 2, width, height, 0x08131a, 1).setDepth?.(-5);
    this.add
      .text(width / 2, height / 2 - 46, 'Heroes of NVVH', {
        fontFamily: 'Verdana',
        fontSize: '34px',
        color: '#f1faee',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 - 8, 'Erőforrások előkészítése', {
        fontFamily: 'Verdana',
        fontSize: '18px',
        color: '#a8dadc',
      })
      .setOrigin(0.5);
    this.add.rectangle(width / 2, barY, BOOT_PROGRESS_BAR_WIDTH, 18, 0x17313d, 0.95).setOrigin(0.5);

    this.loadingUi.progressFill = this.add
      .rectangle(barX, barY, BOOT_PROGRESS_BAR_WIDTH, 10, 0xf6d878, 1)
      .setOrigin(0, 0.5)
      .setScale(0, 1);
    this.loadingUi.progressLabel = this.add
      .text(width / 2, barY + 28, 'Betöltés 0%', {
        fontFamily: 'Verdana',
        fontSize: '16px',
        color: '#f1faee',
      })
      .setOrigin(0.5);
    this.loadingUi.statusLabel = this.add
      .text(width / 2, barY + 54, 'Assetek előkészítése...', {
        fontFamily: 'Verdana',
        fontSize: '14px',
        color: '#a8dadc',
      })
      .setOrigin(0.5);
  }

  private registerLoadingEvents(): void {
    // Keep the loading overlay in sync with Phaser's loader progress events.
    this.load.on('progress', (progress: number) => {
      this.updateLoadingProgress(progress);
    });

    this.load.on('fileprogress', (file: { key?: string } | undefined) => {
      const fileKey = typeof file?.key === 'string' && file.key.length > 0 ? file.key : 'ismeretlen asset';
      this.loadingUi.statusLabel?.setText(`Betöltés: ${fileKey}`);
    });

    this.load.on('complete', () => {
      this.updateLoadingProgress(1);
      this.loadingUi.statusLabel?.setText('Betöltés kész.');
    });
  }

  private preloadLevelData(): void {
    // Preload the authored level JSON files so startup covers the current playable catalog.
    for (const levelEntry of getOrderedLevelCatalog()) {
      this.load.json(`level-data:${levelEntry.id}`, levelEntry.path);
    }
  }

  private updateLoadingProgress(progress: number): void {
    // Clamp and mirror loader progress into the simple boot overlay.
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const roundedPercentage = Math.round(clampedProgress * 100);

    this.loadingUi.progressFill?.setScale(clampedProgress, 1);
    this.loadingUi.progressLabel?.setText(`Betöltés ${roundedPercentage}%`);
  }

  private seedSharedRegistryDefaults(): void {
    // Reset the transient gameplay counters that every fresh play session expects.
    for (const [key, value] of Object.entries(BOOT_REGISTRY_DEFAULTS)) {
      this.registry.set(key, value);
    }
  }

  private handoffToMenu(): void {
    // Delay the menu handoff slightly so the completed loading state can render once.
    const startMenu = () => {
      this.scene.start(SCENE_KEYS.MENU);
    };

    if (typeof this.time?.delayedCall === 'function') {
      this.time.delayedCall(BOOT_HANDOFF_DELAY_MS, startMenu);
      return;
    }

    startMenu();
  }
}
