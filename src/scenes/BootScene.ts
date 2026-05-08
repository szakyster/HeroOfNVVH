import Phaser from 'phaser';
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

    this.scene.start(SCENE_KEYS.MENU);
  }
}
