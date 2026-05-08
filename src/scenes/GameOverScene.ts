import Phaser from 'phaser';
import { AUDIO_KEYS, getAudioSystem } from '../systems/AudioSystem';
import { SCENE_KEYS } from './sceneKeys';

type GameOverData = {
  score?: number;
};

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;
    const score = data.score ?? 0;
    const audioSystem = getAudioSystem(this);

    this.add.rectangle(width / 2, height / 2, width, height, 0x3d1120, 1);

    this.add
      .text(width / 2, height / 2 - 80, 'Game Over', {
        fontFamily: 'Verdana',
        fontSize: '56px',
        color: '#f4f1de',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 12, `Visszaszereztél ${score} millió forintot!`, {
        fontFamily: 'Verdana',
        fontSize: '28px',
        color: '#f2cc8f',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 44, 'Nyomj R-t az ujrainditashoz', {
        fontFamily: 'Verdana',
        fontSize: '22px',
        color: '#81b29a',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-R', () => {
      audioSystem.playMusic(AUDIO_KEYS.MENU, true);
      this.scene.start(SCENE_KEYS.MENU);
    });
  }
}
