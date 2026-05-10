import Phaser from 'phaser';
import {
  AUDIO_KEYS,
  AUDIO_SETTINGS_KEYS,
  applyAudioSettingsFromRegistry,
  getAudioSystem,
} from '../systems/AudioSystem';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { SCENE_KEYS } from './sceneKeys';

export class MenuScene extends Phaser.Scene {
  private musicToggleText?: Phaser.GameObjects.Text;

  private sfxToggleText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    const { width, height } = this.scale;
    const audioSystem = getAudioSystem(this);
    applyAudioSettingsFromRegistry(this);

    addSceneBackground(this, 'menu');

    this.add
      .text(width / 2, height / 2 - 80, 'Heroes of NVVH', {
        fontFamily: 'Verdana',
        fontSize: '52px',
        color: '#f4f1de',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 2, 'Heroes of NVVH', {
        fontFamily: 'Verdana',
        fontSize: '24px',
        color: '#81b29a',
      })
      .setOrigin(0.5);

    this.createMenuButton(width / 2, height / 2 + 64, 'Játék indítása', () => {
      this.scene.start(SCENE_KEYS.PLAY);
    });

    this.createMenuButton(width / 2, height / 2 + 116, 'Eredménylista', () => {
      this.scene.start(SCENE_KEYS.LEADERBOARD);
    });

    this.musicToggleText = this.createMenuButton(width / 2, height / 2 + 182, '', () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED));
      this.registry.set(AUDIO_SETTINGS_KEYS.MUSIC_MUTED, nextValue);
      audioSystem.setMusicMuted(nextValue);
      this.refreshAudioToggleTexts();
    });

    this.sfxToggleText = this.createMenuButton(width / 2, height / 2 + 234, '', () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED));
      this.registry.set(AUDIO_SETTINGS_KEYS.SFX_MUTED, nextValue);
      audioSystem.setSfxMuted(nextValue);
      this.refreshAudioToggleTexts();
    });

    this.refreshAudioToggleTexts();

    if (!this.sound.locked) {
      audioSystem.playMusic(AUDIO_KEYS.MENU, true);
    }

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start(SCENE_KEYS.PLAY);
    });

    this.input.keyboard?.once('keydown-L', () => {
      this.scene.start(SCENE_KEYS.LEADERBOARD);
    });
  }

  private createMenuButton(x: number, y: number, label: string, onSelect: () => void): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, label, {
        fontFamily: 'Verdana',
        fontSize: '20px',
        color: '#f4f1de',
        backgroundColor: '#223247',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.setData('ui-button', true);
    button.on('pointerdown', onSelect);
    button.on('pointerover', () => {
      button.setStyle({ backgroundColor: '#314863' });
    });
    button.on('pointerout', () => {
      button.setStyle({ backgroundColor: '#223247' });
    });

    return button;
  }

  private refreshAudioToggleTexts(): void {
    this.musicToggleText?.setText(
      `Zene némít: ${this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED) ? 'Be' : 'Ki'}`,
    );
    this.sfxToggleText?.setText(
      `Hangeffekt némít: ${this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED) ? 'Be' : 'Ki'}`,
    );
  }
}
