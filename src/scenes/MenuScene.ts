import Phaser from 'phaser';
import {
  AUDIO_KEYS,
  AUDIO_SETTINGS_KEYS,
  applyAudioSettingsFromRegistry,
  getAudioSystem,
  updateAudioSetting,
} from '../systems/AudioSystem';
import { addSceneBackground } from '../systems/SceneBackgrounds';
import { createSceneIconButton, createSceneTextButton } from '../systems/UiButtons';
import { EFFECT_OFF_IMAGE_NAME, getUiAssetKey, MUSIC_OFF_IMAGE_NAME } from '../systems/UiAssets';
import { SCENE_KEYS } from './sceneKeys';

export class MenuScene extends Phaser.Scene {
  private musicToggleIcon?: Phaser.GameObjects.Image;

  private sfxToggleIcon?: Phaser.GameObjects.Image;

  private readonly primaryButtonsOffsetY = 230;

  private readonly primaryButtonsX = -110;

  private readonly audioIconsSpacingX = 56;

  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    const { width, height } = this.scale;
    const audioSystem = getAudioSystem(this);
    applyAudioSettingsFromRegistry(this);

    addSceneBackground(this, 'menu');

    this.createMenuButton(width / 2 + this.primaryButtonsX, height / 2 + 73 + this.primaryButtonsOffsetY, 'Játék indítása', () => {
      this.scene.start(SCENE_KEYS.PLAY);
    });

    this.createMenuButton(width / 2 + this.primaryButtonsX, height / 2 + 110 + this.primaryButtonsOffsetY, 'Eredménylista', () => {
      this.scene.start(SCENE_KEYS.LEADERBOARD);
    });

    const primaryButtonsCenterY = height / 2 + 89.5 + this.primaryButtonsOffsetY;
    const audioIconsBaseX = width / 2 + 66;

    this.musicToggleIcon = this.createAudioIconButton(audioIconsBaseX, primaryButtonsCenterY, MUSIC_OFF_IMAGE_NAME, () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED));
      updateAudioSetting(this, AUDIO_SETTINGS_KEYS.MUSIC_MUTED, nextValue);
      audioSystem.setMusicMuted(nextValue);
      this.refreshAudioToggleIcons();
    });

    this.sfxToggleIcon = this.createAudioIconButton(audioIconsBaseX + this.audioIconsSpacingX, primaryButtonsCenterY, EFFECT_OFF_IMAGE_NAME, () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED));
      updateAudioSetting(this, AUDIO_SETTINGS_KEYS.SFX_MUTED, nextValue);
      audioSystem.setSfxMuted(nextValue);
      this.refreshAudioToggleIcons();
    });

    this.refreshAudioToggleIcons();

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
    return createSceneTextButton(this, {
      x,
      y,
      label,
      width: 236,
      height: 34,
      fontSize: '18px',
      onSelect,
    });
  }

  private createAudioIconButton(x: number, y: number, imageName: string, onSelect: () => void): Phaser.GameObjects.Image {
    const baseSize = 32 * 1.3;

    return createSceneIconButton(this, {
      x,
      y,
      imageKey: getUiAssetKey(imageName),
      baseSize,
      onSelect,
    });
  }

  private refreshAudioToggleIcons(): void {
    if (this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED)) {
      this.musicToggleIcon?.clearTint();
      this.musicToggleIcon?.setAlpha(1);
    } else {
      this.musicToggleIcon?.setTint(0x8f8f8f);
      this.musicToggleIcon?.setAlpha(0.9);
    }

    if (this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED)) {
      this.sfxToggleIcon?.clearTint();
      this.sfxToggleIcon?.setAlpha(1);
    } else {
      this.sfxToggleIcon?.setTint(0x8f8f8f);
      this.sfxToggleIcon?.setAlpha(0.9);
    }
  }
}
