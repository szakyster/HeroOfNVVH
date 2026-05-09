import Phaser from 'phaser';
import { AUDIO_KEYS, getAudioSystem } from '../systems/AudioSystem';
import { LeaderboardStorage } from '../systems/LeaderboardStorage';
import { SCENE_KEYS } from './sceneKeys';

type GameOverData = {
  score?: number;
};

export class GameOverScene extends Phaser.Scene {
  private readonly leaderboardStorage = new LeaderboardStorage();

  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;
    const score = data.score ?? 0;
    const audioSystem = getAudioSystem(this);
    const savedEntry = score > 0 ? this.saveScore(score) : null;

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
      .text(
        width / 2,
        height / 2 + 42,
        savedEntry
          ? `Eredmény elmentve. Aktuális helyezés: ${savedEntry.rank}.`
          : 'Ez a kör nem került fel az eredménylistára.',
        {
          fontFamily: 'Verdana',
          fontSize: '22px',
          color: '#f4f1de',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 94, 'R: új játék | L: eredménylista | M: főmenü', {
        fontFamily: 'Verdana',
        fontSize: '20px',
        color: '#81b29a',
      })
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-R', () => {
      this.scene.start(SCENE_KEYS.PLAY);
    });

    this.input.keyboard?.once('keydown-L', () => {
      this.scene.start(SCENE_KEYS.LEADERBOARD);
    });

    this.input.keyboard?.once('keydown-M', () => {
      audioSystem.playMusic(AUDIO_KEYS.MENU, true);
      this.scene.start(SCENE_KEYS.MENU);
    });
  }

  private saveScore(score: number): { rank: number } | null {
    const createdAt = new Date().toISOString();
    const entries = this.leaderboardStorage.saveEntry({ score, createdAt });
    const rank = entries.findIndex((entry) => entry.score === score && entry.createdAt === createdAt);

    if (rank === -1) {
      return null;
    }

    return { rank: rank + 1 };
  }
}
