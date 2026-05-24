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
import { EFFECT_ON_IMAGE_NAME, getUiAssetKey, HELP_IMAGE_NAME, MUSIC_ON_IMAGE_NAME } from '../systems/UiAssets';
import { SCENE_KEYS } from './sceneKeys';

export class MenuScene extends Phaser.Scene {
  private musicToggleIcon?: Phaser.GameObjects.Image;

  private sfxToggleIcon?: Phaser.GameObjects.Image;

  private readonly primaryButtonsOffsetY = 230;

  private readonly primaryButtonsX = -110;

  private readonly audioIconsSpacingX = 63;

  constructor() {
    super(SCENE_KEYS.MENU);
  }

  create(): void {
    // Route the main menu start action through the dedicated level selection scene.
    const { width, height } = this.scale;
    const audioSystem = getAudioSystem(this);
    applyAudioSettingsFromRegistry(this);

    addSceneBackground(this, 'menu');

    this.createMenuButton(width / 2 + this.primaryButtonsX, height / 2 + 73 + this.primaryButtonsOffsetY, 'Játék indítása', () => {
      this.scene.start(SCENE_KEYS.LEVEL_SELECT);
    });

    this.createMenuButton(width / 2 + this.primaryButtonsX, height / 2 + 110 + this.primaryButtonsOffsetY, 'Eredménylista', () => {
      this.scene.start(SCENE_KEYS.LEADERBOARD);
    });

    const primaryButtonsCenterY = height / 2 + 89.5 + this.primaryButtonsOffsetY;
    const audioIconsBaseX = width / 2 + 55;

    this.musicToggleIcon = this.createAudioIconButton(audioIconsBaseX, primaryButtonsCenterY, MUSIC_ON_IMAGE_NAME, () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED));
      updateAudioSetting(this, AUDIO_SETTINGS_KEYS.MUSIC_MUTED, nextValue);
      audioSystem.setMusicMuted(nextValue);
      this.refreshAudioToggleIcons();
    });

    this.sfxToggleIcon = this.createAudioIconButton(audioIconsBaseX + this.audioIconsSpacingX, primaryButtonsCenterY, EFFECT_ON_IMAGE_NAME, () => {
      const nextValue = !Boolean(this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED));
      updateAudioSetting(this, AUDIO_SETTINGS_KEYS.SFX_MUTED, nextValue);
      audioSystem.setSfxMuted(nextValue);
      this.refreshAudioToggleIcons();
    });

    this.createAudioIconButton(audioIconsBaseX + this.audioIconsSpacingX * 2, primaryButtonsCenterY, HELP_IMAGE_NAME, () => {
      this.scene.start(SCENE_KEYS.HELP);
    });

    this.refreshAudioToggleIcons();

    if (!this.sound.locked) {
      audioSystem.playMusic(AUDIO_KEYS.MENU, true);
    }

    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start(SCENE_KEYS.LEVEL_SELECT);
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
    // Reuse the circular menu icon style for audio and utility shortcuts.
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
    // Highlight enabled audio and dim toggles that are currently muted.
    if (this.registry.get(AUDIO_SETTINGS_KEYS.MUSIC_MUTED)) {
      this.musicToggleIcon?.setTint(0x8f8f8f);
      this.musicToggleIcon?.setAlpha(0.9);
    } else {
      this.musicToggleIcon?.clearTint();
      this.musicToggleIcon?.setAlpha(1);
    }

    if (this.registry.get(AUDIO_SETTINGS_KEYS.SFX_MUTED)) {
      this.sfxToggleIcon?.setTint(0x8f8f8f);
      this.sfxToggleIcon?.setAlpha(0.9);
    } else {
      this.sfxToggleIcon?.clearTint();
      this.sfxToggleIcon?.setAlpha(1);
    }
  }
}
