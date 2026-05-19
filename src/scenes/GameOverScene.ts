import Phaser from 'phaser';
import { AUDIO_KEYS, getAudioSystem } from '../systems/AudioSystem';
import { LeaderboardStorage } from '../systems/LeaderboardStorage';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { createSceneTextButton } from '../systems/UiButtons';
import { SCENE_KEYS } from './sceneKeys';

type GameOverData = {
  score?: number;
};

export class GameOverScene extends Phaser.Scene {

  private static readonly TEXT_ROW_OFFSETS = {
    scoreLead: -36,
    scoreValue: +6,
    scoreTail: 50,
    result: 104,
    menuButton: 168,
    controls: 210,
  };

  private readonly leaderboardStorage = new LeaderboardStorage();

  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  create(data: GameOverData): void {
    //const { width, height } = this.scale;
    const score = data.score ?? 0;
    const audioSystem = getAudioSystem(this);
    const savedEntry = score > 0 ? this.saveScore(score) : null;
    const textAnchor = {
      x: 260,
      y: 280,
    };
    const openMenu = () => {
      audioSystem.playMusic(AUDIO_KEYS.MENU, true);
      this.scene.start(SCENE_KEYS.MENU);
    };

    addSceneBackground(this, 'gameOver');

    this.add
      .text(
        textAnchor.x,
        textAnchor.y + GameOverScene.TEXT_ROW_OFFSETS.scoreLead,
        'Visszaszereztél',
        {
          fontFamily: 'Verdana',
          fontSize: '24px',
          color: '#f2cc8f',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        textAnchor.x,
        textAnchor.y + GameOverScene.TEXT_ROW_OFFSETS.scoreValue,
        `${score} millió`,
        {
          fontFamily: 'Verdana',
          fontSize: '40px',
          fontStyle: 'bold',
          color: '#e07a5f',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        textAnchor.x,
        textAnchor.y + GameOverScene.TEXT_ROW_OFFSETS.scoreTail,
        'forintot!',
        {
          fontFamily: 'Verdana',
          fontSize: '24px',
          color: '#f2cc8f',
        },
      )
      .setOrigin(0.5);

    this.add
      .text(
        textAnchor.x,
        textAnchor.y + GameOverScene.TEXT_ROW_OFFSETS.result,
        savedEntry
          ? `Eredmény elmentve. \nAktuális helyezés: ${savedEntry.rank}.`
          : 'Ez a kör nem került fel az \neredménylistára.',
        {
          fontFamily: 'Verdana',
          fontSize: '22px',
          color: '#f4f1de',
        },
      )
      .setOrigin(0.5);

    createSceneTextButton(this, {
      x: textAnchor.x,
      y: textAnchor.y + GameOverScene.TEXT_ROW_OFFSETS.menuButton,
      label: 'Főmenü',
      width: 176,
      height: 36,
      fontSize: '18px',
      triggerEvent: 'pointerup',
      onSelect: openMenu,
    });

    this.add
      .text(
        textAnchor.x,
        textAnchor.y + GameOverScene.TEXT_ROW_OFFSETS.controls,
        'R: új játék | L: eredménylista | M: főmenü',
        {
          fontFamily: 'Verdana',
          fontSize: '14px',
          color: '#81b29a',
        },
      )
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-R', () => {
      this.scene.start(SCENE_KEYS.PLAY);
    });

    this.input.keyboard?.once('keydown-L', () => {
      this.scene.start(SCENE_KEYS.LEADERBOARD);
    });

    this.input.keyboard?.once('keydown-M', openMenu);
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
