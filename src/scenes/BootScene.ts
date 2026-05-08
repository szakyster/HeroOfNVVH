import Phaser from 'phaser';
import {
  AUDIO_KEYS,
  AUDIO_SETTINGS_KEYS,
  applyAudioSettingsFromRegistry,
  getAudioSystem,
} from '../systems/AudioSystem';
import { SCENE_KEYS } from './sceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    this.load.audio(AUDIO_KEYS.ATTACK, ['assets/sprites/Punch01.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_1, ['assets/sprites/death01.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_2, ['assets/sprites/death02.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_3, ['assets/sprites/death03.mp3']);
    this.load.audio(AUDIO_KEYS.DEATH_4, ['assets/sprites/death04.mp3']);
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
