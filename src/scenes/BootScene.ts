import Phaser from 'phaser';
import { AUDIO_KEYS, getAudioSystem } from '../systems/AudioSystem';
import { SCENE_KEYS } from './sceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    this.load.audio(AUDIO_KEYS.ATTACK, ['assets/sprites/Punch01.mp3']);
    this.load.audio(AUDIO_KEYS.MENU, ['assets/audio/Preparation of hunting.mp3']);
    this.load.audio(AUDIO_KEYS.AMBIENT, ['assets/audio/The Hero.mp3']);
  }

  create(): void {
    // Shared bootstrap defaults for scene state.
    this.registry.set('score', 0);
    this.registry.set('escapedEnemies', 0);
    this.registry.set('currentWave', 1);
    getAudioSystem(this).setMasterVolume(0.35);
    getAudioSystem(this).setMuted(false);

    this.scene.start(SCENE_KEYS.MENU);
  }
}
