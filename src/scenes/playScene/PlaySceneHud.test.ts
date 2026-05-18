import { describe, expect, it, vi } from 'vitest';
import {
  ESCAPED_WARNING_COLOR,
  HEADER_EMPHASIS_COLOR,
  formatAudioToggleTexts,
  formatEnemyInfoText,
  formatLevelInfoText,
  formatPlaySceneHudValues,
  syncInventorySlotImages,
  syncEscapedEnemyWarningState,
} from './PlaySceneHud';

describe('PlaySceneHud helpers', () => {
  it('formats the main HUD values consistently', () => {
    expect(
      formatPlaySceneHudValues({
        score: 150,
        escapedEnemies: 3,
        maxEscapedEnemies: 10,
        waveNumber: 4,
      }),
    ).toEqual({
      scoreText: '150 M Ft',
      escapedText: '3/10',
      waveText: '4. hullám',
    });
  });

    it('formats level and enemy info strings', () => {
    expect(
      formatLevelInfoText({
        level: { name: 'Teszt pálya' },
        activeLootCount: 1,
        inventoryCount: 2,
      }),
    ).toBe('Pálya: Teszt pálya | Földön: 1 tárgy | Leadási sáv: aktív');
    expect(
      formatEnemyInfoText({
        activeEnemyCount: 1,
        spawnedEnemies: 2,
        targetEnemyCount: 5,
      }),
    ).toBe('Aktív ellenfelek: 1 | Spawn ebben a hullámban: 2/5');
    expect(
      formatAudioToggleTexts({
        musicMuted: true,
        sfxMuted: false,
      }),
    ).toEqual({
      musicText: 'Zene némít: Be',
      sfxText: 'Hangeffekt némít: Ki',
    });
  });

  it('tints the music icon gray when music is enabled and restores it when muted', async () => {
    const musicToggleIcon = {
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setAlpha: vi.fn(),
    };
    const sfxToggleIcon = {
      setTint: vi.fn(),
      clearTint: vi.fn(),
      setAlpha: vi.fn(),
    };

    const { syncAudioToggleTexts } = await import('./PlaySceneHud');

    syncAudioToggleTexts(
      {
        musicToggleIcon,
        sfxToggleIcon,
      },
      {
        musicMuted: false,
        sfxMuted: true,
      },
    );

    expect(musicToggleIcon.setAlpha).toHaveBeenCalledWith(0.9);
    expect(musicToggleIcon.setTint).toHaveBeenCalledWith(0x8f8f8f);
    expect(musicToggleIcon.clearTint).not.toHaveBeenCalled();
    expect(sfxToggleIcon.setAlpha).toHaveBeenCalledWith(1);
    expect(sfxToggleIcon.clearTint).toHaveBeenCalledTimes(1);
    expect(sfxToggleIcon.setTint).not.toHaveBeenCalled();

    syncAudioToggleTexts(
      {
        musicToggleIcon,
        sfxToggleIcon,
      },
      {
        musicMuted: true,
        sfxMuted: false,
      },
    );

    expect(musicToggleIcon.setAlpha).toHaveBeenCalledWith(1);
    expect(musicToggleIcon.clearTint).toHaveBeenCalledTimes(1);
    expect(sfxToggleIcon.setAlpha).toHaveBeenCalledWith(0.9);
    expect(sfxToggleIcon.setTint).toHaveBeenCalledWith(0x8f8f8f);
  });

  it('starts the escaped warning tween at high escaped counts', () => {
    const tween = { stop: vi.fn() };
    const add = vi.fn(() => tween);
    const escapedValueText = {
      x: 430,
      y: 63,
      setColor: vi.fn(),
      setPosition: vi.fn(),
    };

    const nextTween = syncEscapedEnemyWarningState({
      escapedEnemies: 8,
      escapedValueText,
      escapedValueBaseX: 430,
      escapedValueBaseY: 63,
      tweens: { add: add as (config: { targets: unknown; x: number; duration: number; ease: string; yoyo: boolean; repeat: number }) => typeof tween },
    });

    expect(escapedValueText.setColor).toHaveBeenCalledWith(ESCAPED_WARNING_COLOR);
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: escapedValueText,
        x: 434,
        yoyo: true,
        repeat: -1,
      }),
    );
    expect(nextTween).toBe(tween);
  });

  it('resets warning color and position below the warning threshold', () => {
    const existingTween = { stop: vi.fn() };
    const add = vi.fn();
    const escapedValueText = {
      x: 434,
      y: 63,
      setColor: vi.fn(),
      setPosition: vi.fn(),
    };

    const nextTween = syncEscapedEnemyWarningState({
      escapedEnemies: 3,
      escapedValueText,
      escapedValueWarningTween: existingTween,
      escapedValueBaseX: 430,
      escapedValueBaseY: 63,
      tweens: {
        add: add as (config: { targets: unknown; x: number; duration: number; ease: string; yoyo: boolean; repeat: number }) => typeof existingTween,
      },
    });

    expect(escapedValueText.setColor).toHaveBeenCalledWith(HEADER_EMPHASIS_COLOR);
    expect(existingTween.stop).toHaveBeenCalledTimes(1);
    expect(escapedValueText.setPosition).toHaveBeenCalledWith(430, 63);
    expect(add).not.toHaveBeenCalled();
    expect(nextTween).toBeUndefined();
  });

  it('renders filled and empty inventory slots with different styling', () => {
    const slotImages = Array.from({ length: 4 }, () => ({
      setAlpha: vi.fn(),
      setTint: vi.fn(),
      clearTint: vi.fn(),
    }));

    syncInventorySlotImages(slotImages, 2, 4);

    expect(slotImages[0].setAlpha).toHaveBeenCalledWith(1);
    expect(slotImages[0].clearTint).toHaveBeenCalledTimes(1);
    expect(slotImages[0].setTint).not.toHaveBeenCalled();
    expect(slotImages[2].setAlpha).toHaveBeenCalledWith(0.4);
    expect(slotImages[2].setTint).toHaveBeenCalledWith(0x7f7f7f);
    expect(slotImages[2].clearTint).not.toHaveBeenCalled();
  });
});