import Phaser from 'phaser';
import {
  AUDIO_KEYS,
  AUDIO_SETTINGS_KEYS,
  applyAudioSettingsFromRegistry,
  getAudioSystem,
} from '../systems/AudioSystem';
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

    this.musicToggleText = this.createToggleButton(width / 2, height / 2 + 112, () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED));
      this.registry.set(AUDIO_SETTINGS_KEYS.MUSIC_MUTED, nextValue);
      audioSystem.setMusicMuted(nextValue);
      this.refreshAudioToggleTexts();
    });

    this.sfxToggleText = this.createToggleButton(width / 2, height / 2 + 158, () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED));
      this.registry.set(AUDIO_SETTINGS_KEYS.SFX_MUTED, nextValue);
      audioSystem.setSfxMuted(nextValue);
      this.refreshAudioToggleTexts();
    });

    this.refreshAudioToggleTexts();

    if (!this.sound.locked) {
      audioSystem.playMusic(AUDIO_KEYS.MENU, true);
    }

    const startGame = () => {
      this.scene.start(SCENE_KEYS.PLAY);
    };

    let started = false;

    const handlePointerStart = (
      _pointer: Phaser.Input.Pointer,
      currentlyOver: Phaser.GameObjects.GameObject[] = [],
    ) => {
      if (started || currentlyOver.some((gameObject) => gameObject.getData('ui-button') === true)) {
        return;
      }

      started = true;
      this.input.off('pointerdown', handlePointerStart);
      startGame();
    };

    this.input.on('pointerdown', handlePointerStart);

    this.input.keyboard?.once('keydown-SPACE', () => {
      if (started) {
        return;
      }

      started = true;
      this.input.off('pointerdown', handlePointerStart);
      startGame();
    });
  }

  private createToggleButton(x: number, y: number, onToggle: () => void): Phaser.GameObjects.Text {
    const button = this.add
      .text(x, y, '', {
        fontFamily: 'Verdana',
        fontSize: '20px',
        color: '#f4f1de',
        backgroundColor: '#223247',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.setData('ui-button', true);
    button.on('pointerdown', onToggle);
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
