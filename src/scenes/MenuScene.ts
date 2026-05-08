import Phaser from 'phaser';
import { AUDIO_KEYS, getAudioSystem } from '../systems/AudioSystem';
import { SCENE_KEYS } from './sceneKeys';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    const { width, height } = this.scale;
    const audioSystem = getAudioSystem(this);

    this.add.rectangle(width / 2, height / 2, width, height, 0x112233, 1);

    this.add
      .text(width / 2, height / 2 - 80, 'Heroes of NVVH', {
        fontFamily: 'Verdana',
        fontSize: '52px',
        color: '#f4f1de',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, 'Nyomj SPACE-t a kezdéshez', {
        fontFamily: 'Verdana',
        fontSize: '24px',
        color: '#81b29a',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 42, 'Vagy kattints bárhová', {
        fontFamily: 'Verdana',
        fontSize: '20px',
        color: '#e07a5f',
      })
      .setOrigin(0.5);

    if (!this.sound.locked) {
      audioSystem.playMusic(AUDIO_KEYS.AMBIENT, true);
    }

    const startGame = () => {
      audioSystem.playMusic(AUDIO_KEYS.AMBIENT, true);
      this.scene.start(SCENE_KEYS.PLAY);
    };

    this.input.once('pointerdown', () => {
      startGame();
    });

    this.input.keyboard?.once('keydown-SPACE', () => {
      startGame();
    });
  }
}
