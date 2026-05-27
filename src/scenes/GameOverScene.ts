import Phaser from 'phaser';
import { AUDIO_KEYS, getAudioSystem } from '../systems/AudioSystem';
import { LeaderboardStorage } from '../systems/LeaderboardStorage';
import { getFirstLevelId, getNextLevelId } from '../systems/LevelCatalog';
import { LevelProgressStorage } from '../systems/LevelProgressStorage';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { createSceneTextButton } from '../systems/UiButtons';
import { SCENE_KEYS } from './sceneKeys';

type GameOverData = {
  score?: number;
  levelId?: string;
  levelName?: string;
  targetScore?: number;
};

export class GameOverScene extends Phaser.Scene {

  private static readonly TEXT_ROW_OFFSETS = {
    scoreLead: -36,
    scoreValue: +6,
    scoreTail: 50,
    result: 104,
    progression: 158,
    retryButton: 214,
    newGameButton: 256,
    menuButton: 298,
    controls: 346,
  };

  private readonly leaderboardStorage = new LeaderboardStorage();

  private readonly progressStorage = new LevelProgressStorage(getFirstLevelId());

  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  create(data: GameOverData): void {
    //const { width, height } = this.scale;
    const score = data.score ?? 0;
    const levelId = data.levelId ?? this.progressStorage.getState().lastPlayedLevelId;
    const targetScore = data.targetScore ?? Number.MAX_SAFE_INTEGER;
    const audioSystem = getAudioSystem(this);
    const savedEntry = score > 0 ? this.saveScore(levelId, score) : null;
    const textAnchor = {
      x: 260,
      y: 280,
    };
    const progressionMessage = this.resolveProgressionMessage(levelId, targetScore, score);
    const retryLevel = () => {
      const retryLevelId = data.levelId ?? this.progressStorage.getState().lastPlayedLevelId;
      this.scene.start(SCENE_KEYS.PLAY, { levelId: retryLevelId });
    };
    const openLevelSelect = () => {
      audioSystem.playMusic(AUDIO_KEYS.MENU, true);
      this.scene.start(SCENE_KEYS.LEVEL_SELECT);
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

    if (progressionMessage) {
      this.add
        .text(
          textAnchor.x,
          textAnchor.y + GameOverScene.TEXT_ROW_OFFSETS.progression,
          progressionMessage,
          {
            fontFamily: 'Verdana',
            fontSize: '20px',
            color: '#81b29a',
            align: 'center',
          },
        )
        .setOrigin(0.5);
    }

    createSceneTextButton(this, {
      x: textAnchor.x,
      y: textAnchor.y + GameOverScene.TEXT_ROW_OFFSETS.retryButton,
      label: 'Újra',
      width: 176,
      height: 36,
      fontSize: '18px',
      triggerEvent: 'pointerup',
      onSelect: retryLevel,
    });

    createSceneTextButton(this, {
      x: textAnchor.x,
      y: textAnchor.y + GameOverScene.TEXT_ROW_OFFSETS.newGameButton,
      label: 'Új játék',
      width: 176,
      height: 36,
      fontSize: '18px',
      triggerEvent: 'pointerup',
      onSelect: openLevelSelect,
    });

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
        'R: újra | N: új játék | L: eredménylista | M: főmenü',
        {
          fontFamily: 'Verdana',
          fontSize: '14px',
          color: '#81b29a',
        },
      )
      .setOrigin(0.5);

    this.input.keyboard?.once('keydown-R', () => {
      retryLevel();
    });

    this.input.keyboard?.once('keydown-N', () => {
      openLevelSelect();
    });

    this.input.keyboard?.once('keydown-L', () => {
      this.scene.start(SCENE_KEYS.LEADERBOARD, { levelId });
    });

    this.input.keyboard?.once('keydown-M', openMenu);
  }

  private saveScore(levelId: string, score: number): { rank: number } | null {
    const createdAt = new Date().toISOString();
    const entries = this.leaderboardStorage.saveEntry(levelId, { score, createdAt });
    const rank = entries.findIndex((entry) => entry.score === score && entry.createdAt === createdAt);

    if (rank === -1) {
      return null;
    }

    return { rank: rank + 1 };
  }

  private resolveProgressionMessage(levelId: string, targetScore: number, score: number): string | null {
    if (score < targetScore) {
      return null;
    }

    const previousState = this.progressStorage.getState();
    const nextLevelId = getNextLevelId(levelId);
    const nextLevelWasUnlocked = nextLevelId ? previousState.unlockedLevelIds.includes(nextLevelId) : false;

    this.progressStorage.markLevelCompleted(levelId);

    if (nextLevelId) {
      this.progressStorage.unlockLevel(nextLevelId);
    }

    if (nextLevelId && !nextLevelWasUnlocked) {
      return 'Elérted a célpontszámot,\na következő pálya megnyílt.';
    }

    return 'Elérted a célpontszámot,\na pálya teljesítve.';
  }
}
