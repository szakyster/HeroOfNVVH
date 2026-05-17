import Phaser from 'phaser';
import {
  AUDIO_KEYS,
  AUDIO_SETTINGS_KEYS,
  applyAudioSettingsFromRegistry,
  getAudioSystem,
} from '../systems/AudioSystem';
import { preloadSceneBackgrounds } from '../systems/SceneBackgrounds';
import { getAvailableHrsAssets } from '../systems/HrsAssets';
import { getAvailableLootAssets } from '../systems/LootAssets';
import { getAvailableObstacleAssets } from '../systems/ObstacleAssets';
import { getAvailableUiAssets } from '../systems/UiAssets';
import { SCENE_KEYS } from './sceneKeys';

const HERO_SPRITE_SHEETS = [
  { key: 'hero-psz01-idle-down', url: 'assets/sprites/PSZ01/idle_down.png' },
  { key: 'hero-psz01-idle-northeast', url: 'assets/sprites/PSZ01/idle_northeast.png' },
  { key: 'hero-psz01-idle-right', url: 'assets/sprites/PSZ01/idle_right.png' },
  { key: 'hero-psz01-idle-southeast', url: 'assets/sprites/PSZ01/idle_southeast.png' },
  { key: 'hero-psz01-idle-up', url: 'assets/sprites/PSZ01/idle_up.png' },
  { key: 'hero-psz01-punch-down', url: 'assets/sprites/PSZ01/punch_down.png' },
  { key: 'hero-psz01-punch-right', url: 'assets/sprites/PSZ01/punch_right.png' },
  { key: 'hero-psz01-punch-up', url: 'assets/sprites/PSZ01/punch_up.png' },
  { key: 'hero-psz01-run-down', url: 'assets/sprites/PSZ01/run_down.png' },
  { key: 'hero-psz01-run-northeast', url: 'assets/sprites/PSZ01/run_northeast.png' },
  { key: 'hero-psz01-run-right', url: 'assets/sprites/PSZ01/run_right.png' },
  { key: 'hero-psz01-run-southeast', url: 'assets/sprites/PSZ01/run_southeast.png' },
  { key: 'hero-psz01-run-up', url: 'assets/sprites/PSZ01/run_up.png' },
];

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
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    preloadSceneBackgrounds(this);

    for (const heroSheet of HERO_SPRITE_SHEETS) {
      this.load.spritesheet(heroSheet.key, heroSheet.url, {
        frameWidth: 128,
        frameHeight: 128,
      });
    }

    for (const enemySheet of ENEMY_SPRITE_SHEETS) {
      this.load.spritesheet(enemySheet.key, enemySheet.url, {
        frameWidth: 128,
        frameHeight: 128,
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

    this.load.audio(AUDIO_KEYS.ATTACK, ['assets/audio/effect/Punch01.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_1, ['assets/audio/effect/death01.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_2, ['assets/audio/effect/death02.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_3, ['assets/audio/effect/death03.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_4, ['assets/audio/effect/death04.mp3']);
    this.load.audio(AUDIO_KEYS.MENU, ['assets/audio/Preparation of hunting.mp3']);
    this.load.audio(AUDIO_KEYS.AMBIENT, ['assets/audio/The Hero.mp3']);
  }

  create(): void {
    // Shared bootstrap defaults for scene state.
    this.registry.set('score', 0);
    this.registry.set('escapedEnemies', 0);
    this.registry.set('currentWave', 1);
    this.registry.set(AUDIO_SETTINGS_KEYS.MUSIC_MUTED, false);
    this.registry.set(AUDIO_SETTINGS_KEYS.SFX_MUTED, false);
    getAudioSystem(this).setMasterVolume(0.35);
    getAudioSystem(this).setMuted(false);
    applyAudioSettingsFromRegistry(this);

    this.scene.start(SCENE_KEYS.MENU);
  }
}
