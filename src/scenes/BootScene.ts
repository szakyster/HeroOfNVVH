import Phaser from 'phaser';
import { getAudioSystem } from '../systems/AudioSystem';
import { SCENE_KEYS } from './sceneKeys';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
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
