import type Phaser from 'phaser';
import type { LevelData } from '../../types/level';
import { DEFAULT_LOOT_CONFIG } from '../../systems/LootSystem';
import { HEADLINE_FONT_FAMILY } from '../../utils/typography';

export const HEADER_EMPHASIS_COLOR = '#f4e6a2';
export const ESCAPED_WARNING_COLOR = '#ff4d4f';

type SetTextLike = {
  setText?: (value: string) => unknown;
};

type WarningTextLike = SetTextLike & {
  x: number;
  y: number;
  setColor?: (value: string) => unknown;
  setPosition?: (x: number, y: number) => unknown;
};

type WarningTweenLike = Pick<Phaser.Tweens.Tween, 'stop'>;

type WarningTweenConfigLike = {
  targets: unknown;
  x: number;
  duration: number;
  ease: string;
  yoyo: boolean;
  repeat: number;
};

type WarningTweenManagerLike = {
  add: (config: WarningTweenConfigLike) => WarningTweenLike;
};

type ButtonCallbacks = {
  onMusicToggle: () => void;
  onSfxToggle: () => void;
};

export type AudioToggleTextRefs = {
  musicToggleText?: SetTextLike;
  sfxToggleText?: SetTextLike;
};

export type PlaySceneHudRefs = {
  scoreValueText: Phaser.GameObjects.Text;
  inventoryValueText: Phaser.GameObjects.Text;
  escapedValueText: Phaser.GameObjects.Text;
  escapedValueBaseX: number;
  escapedValueBaseY: number;
  waveValueText: Phaser.GameObjects.Text;
};

export type PlaySceneStatusRefs = {
  levelInfoText: Phaser.GameObjects.Text;
  enemyInfoText: Phaser.GameObjects.Text;
  musicToggleText: Phaser.GameObjects.Text;
  sfxToggleText: Phaser.GameObjects.Text;
};

function addHudLabel(scene: Phaser.Scene, x: number, y: number, text: string): void {
  scene.add
    .text(x, y, text, {
      fontFamily: 'Verdana',
      fontSize: '15px',
      color: '#a8dadc',
    })
    .setDepth(7);
}

function addHudValue(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, '', {
      fontFamily: HEADLINE_FONT_FAMILY,
      fontSize: '24px',
      color: HEADER_EMPHASIS_COLOR,
      fontStyle: 'bold',
    })
    .setDepth(7);
}

function createToggleButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  onPointerDown: () => void,
): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, '', {
      fontFamily: 'Verdana',
      fontSize: '15px',
      color: '#f4f1de',
      backgroundColor: '#223247',
      padding: { x: 10, y: 6 },
    })
    .setOrigin(1, 0)
    .setDepth(6)
    .setInteractive({ useHandCursor: true });

  button.setData('ui-button', true);
  button.on('pointerdown', onPointerDown);
  button.on('pointerover', () => {
    button.setStyle({ backgroundColor: '#314863' });
  });
  button.on('pointerout', () => {
    button.setStyle({ backgroundColor: '#223247' });
  });

  return button;
}

export function createPlaySceneHud(scene: Phaser.Scene, width: number): PlaySceneHudRefs {
  const panelLeft = 18;
  const panelWidth = width - 36;
  const contentLeft = panelLeft + 28;
  const contentWidth = panelWidth - 56;
  const hudTop = 13;

  const panel = scene.add.graphics();
  panel.setDepth(6);
  panel.fillStyle(0x102a43, 0.38);
  panel.fillRoundedRect(panelLeft, hudTop, panelWidth, 92, 24);
  panel.lineStyle(2, 0xf4d35e, 0.45);
  panel.strokeRoundedRect(panelLeft, hudTop, panelWidth, 92, 24);

  const metricY = 31;
  const valueY = 63;
  const columns = [0, 0.24, 0.52, 0.8].map((ratio) => contentLeft + contentWidth * ratio);

  addHudLabel(scene, columns[0], metricY, 'Pont');
  const scoreValueText = addHudValue(scene, columns[0], valueY);

  addHudLabel(scene, columns[1], metricY, 'Hátizsák');
  const inventoryValueText = addHudValue(scene, columns[1], valueY);

  addHudLabel(scene, columns[2], metricY, 'Reptérre érkeztek');
  const escapedValueText = addHudValue(scene, columns[2], valueY);

  addHudLabel(scene, columns[3], metricY, 'Hullám');
  const waveValueText = addHudValue(scene, columns[3], valueY);

  return {
    scoreValueText,
    inventoryValueText,
    escapedValueText,
    escapedValueBaseX: columns[2],
    escapedValueBaseY: valueY,
    waveValueText,
  };
}

export function createPlaySceneStatusTexts(
  scene: Phaser.Scene,
  width: number,
  height: number,
  callbacks: ButtonCallbacks,
): PlaySceneStatusRefs {
  const levelInfoText = scene.add
    .text(24, height - 58, 'Pályabetöltés: folyamatban...', {
      fontFamily: 'Verdana',
      fontSize: '17px',
      color: '#f1faee',
    })
    .setOrigin(0, 0.5)
    .setDepth(7);

  const enemyInfoText = scene.add
    .text(24, height - 28, 'Ellenségállapot: inicializálás...', {
      fontFamily: 'Verdana',
      fontSize: '17px',
      color: '#ffd166',
    })
    .setOrigin(0, 0.5)
    .setDepth(7);

  const musicToggleText = createToggleButton(scene, width - 18, 122, callbacks.onMusicToggle);
  const sfxToggleText = createToggleButton(scene, width - 18, 160, callbacks.onSfxToggle);

  return {
    levelInfoText,
    enemyInfoText,
    musicToggleText,
    sfxToggleText,
  };
}

export function formatInventoryIcons(inventoryCount: number, maxInventory: number = DEFAULT_LOOT_CONFIG.maxInventory): string {
  const filledSlots = '■'.repeat(inventoryCount);
  const emptySlots = '□'.repeat(Math.max(0, maxInventory - inventoryCount));

  return `${filledSlots}${emptySlots}`;
}

export function formatPlaySceneHudValues(args: {
  score: number;
  inventoryCount: number;
  escapedEnemies: number;
  maxEscapedEnemies: number;
  waveNumber: number;
  maxInventory?: number;
}): {
  scoreText: string;
  inventoryText: string;
  escapedText: string;
  waveText: string;
} {
  const maxInventory = args.maxInventory ?? DEFAULT_LOOT_CONFIG.maxInventory;

  return {
    scoreText: `${args.score} M Ft`,
    inventoryText: `${args.inventoryCount}/${maxInventory}  ${formatInventoryIcons(args.inventoryCount, maxInventory)}`,
    escapedText: `${args.escapedEnemies}/${args.maxEscapedEnemies}`,
    waveText: `${args.waveNumber}. hullám`,
  };
}

export function formatLevelInfoText(args: {
  level?: Pick<LevelData, 'name'>;
  activeLootCount: number;
  inventoryCount: number;
}): string {
  return `Pálya: ${args.level?.name ?? 'betöltés alatt'} | Földön: ${args.activeLootCount} tárgy | Leadási sáv: ${args.inventoryCount > 0 ? 'aktív' : 'üres'}`;
}

export function formatEnemyInfoText(args: {
  activeEnemyCount: number;
  spawnedEnemies: number;
  targetEnemyCount: number;
}): string {
  return `Aktív ellenfelek: ${args.activeEnemyCount} | Spawn ebben a hullámban: ${args.spawnedEnemies}/${args.targetEnemyCount}`;
}

export function formatAudioToggleTexts(args: { musicMuted: boolean; sfxMuted: boolean }): {
  musicText: string;
  sfxText: string;
} {
  return {
    musicText: `Zene némít: ${args.musicMuted ? 'Be' : 'Ki'}`,
    sfxText: `Hangeffekt némít: ${args.sfxMuted ? 'Be' : 'Ki'}`,
  };
}

export function syncAudioToggleTexts(
  refs: AudioToggleTextRefs,
  args: { musicMuted: boolean; sfxMuted: boolean },
): void {
  const labels = formatAudioToggleTexts(args);

  refs.musicToggleText?.setText?.(labels.musicText);
  refs.sfxToggleText?.setText?.(labels.sfxText);
}

export function syncEscapedEnemyWarningState(args: {
  escapedEnemies: number;
  escapedValueText?: WarningTextLike;
  escapedValueWarningTween?: WarningTweenLike;
  escapedValueBaseX?: number;
  escapedValueBaseY?: number;
  tweens: WarningTweenManagerLike;
}): WarningTweenLike | undefined {
  if (!args.escapedValueText) {
    return args.escapedValueWarningTween;
  }

  if (args.escapedEnemies >= 8) {
    args.escapedValueText.setColor?.(ESCAPED_WARNING_COLOR);

    if (!args.escapedValueWarningTween) {
      return args.tweens.add({
        targets: args.escapedValueText,
        x: (args.escapedValueBaseX ?? args.escapedValueText.x) + 4,
        duration: 55,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    return args.escapedValueWarningTween;
  }

  args.escapedValueText.setColor?.(HEADER_EMPHASIS_COLOR);
  args.escapedValueWarningTween?.stop?.();

  if (args.escapedValueBaseX !== undefined && args.escapedValueBaseY !== undefined) {
    args.escapedValueText.setPosition?.(args.escapedValueBaseX, args.escapedValueBaseY);
  }

  return undefined;
}