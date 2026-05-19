import Phaser from 'phaser';
import { HEADLINE_FONT_FAMILY } from '../utils/typography';

type ButtonState = 'idle' | 'hover' | 'pressed';

type TextButtonOptions = {
  x: number;
  y: number;
  label: string;
  width: number;
  height?: number;
  fontSize?: string;
  depth?: number;
  triggerEvent?: 'pointerdown' | 'pointerup';
  onSelect: () => void;
};

type IconButtonOptions = {
  x: number;
  y: number;
  imageKey: string;
  baseSize: number;
  depth?: number;
  onSelect: () => void;
};

const TEXT_BUTTON_HEIGHT = 36;
const TEXT_BUTTON_DEPTH = 8;
const ICON_BUTTON_DEPTH = 6;
const TEXT_BUTTON_COLORS: Record<ButtonState, { face: number; border: number; accent: number }> = {
  idle: {
    face: 0x17324a,
    border: 0xe6c15a,
    accent: 0x79c7c5,
  },
  hover: {
    face: 0x22506f,
    border: 0xf6d878,
    accent: 0x9be4da,
  },
  pressed: {
    face: 0x0f2435,
    border: 0xcda648,
    accent: 0x4fa4a9,
  },
};
const ICON_BUTTON_COLORS: Record<ButtonState, { face: number; border: number; accent: number }> = {
  idle: {
    face: 0x14324a,
    border: 0xe6c15a,
    accent: 0x79c7c5,
  },
  hover: {
    face: 0x1c4968,
    border: 0xf6d878,
    accent: 0x9be4da,
  },
  pressed: {
    face: 0x0e2233,
    border: 0xcda648,
    accent: 0x4fa4a9,
  },
};

function drawTextButtonBackground(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  state: ButtonState,
): void {
  const colors = TEXT_BUTTON_COLORS[state];
  const left = x - width / 2;
  const top = y - height / 2;

  graphics.clear();
  graphics.fillStyle(0x08131d, 0.42);
  graphics.fillRoundedRect(left + 2, top + 4, width, height, 12);
  graphics.fillStyle(colors.face, 0.95);
  graphics.fillRoundedRect(left, top, width, height, 12);
  graphics.fillStyle(0xf9edbf, state === 'pressed' ? 0.08 : 0.18);
  graphics.fillRoundedRect(left + 3, top + 3, width - 6, 10, 9);
  graphics.lineStyle(2, colors.border, 1);
  graphics.strokeRoundedRect(left, top, width, height, 12);
  graphics.lineStyle(2, colors.accent, 0.85);
  graphics.strokeRoundedRect(left + 6, top + height - 10, width - 12, 2, 1);
}

function drawIconButtonBackground(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  diameter: number,
  state: ButtonState,
): void {
  const colors = ICON_BUTTON_COLORS[state];
  const radius = diameter / 2;

  graphics.clear();
  graphics.fillStyle(0x08131d, 0.42);
  graphics.fillCircle(x + 1.5, y + 3, radius);
  graphics.fillStyle(colors.face, 0.95);
  graphics.fillCircle(x, y, radius);
  graphics.fillStyle(0xf9edbf, state === 'pressed' ? 0.08 : 0.18);
  graphics.fillCircle(x - 6, y - 6, radius * 0.46);
  graphics.lineStyle(2, colors.border, 1);
  graphics.strokeCircle(x, y, radius);
  graphics.lineStyle(2, colors.accent, 0.85);
  graphics.strokeCircle(x, y, radius - 5);
}

export function createSceneTextButton(scene: Phaser.Scene, options: TextButtonOptions): Phaser.GameObjects.Text {
  const {
    x,
    y,
    label,
    width,
    height = TEXT_BUTTON_HEIGHT,
    fontSize = '20px',
    depth = TEXT_BUTTON_DEPTH,
    triggerEvent = 'pointerdown',
    onSelect,
  } = options;
  const background = scene.add.graphics().setDepth(depth - 1);
  const button = scene.add
    .text(x, y - 1, label, {
      fontFamily: HEADLINE_FONT_FAMILY,
      fontSize,
      fontStyle: 'bold',
      color: '#f8f1d2',
      stroke: '#09131c',
      strokeThickness: 4,
      align: 'center',
      fixedWidth: width,
      padding: { x: 0, y: 7 },
    })
    .setOrigin(0.5)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });

  const setVisualState = (state: ButtonState): void => {
    drawTextButtonBackground(background, x, y, width, height, state);

    if (state === 'hover') {
      button.setY(y - 2);
      return;
    }

    if (state === 'pressed') {
      button.setY(y);
      return;
    }

    button.setY(y - 1);
  };

  setVisualState('idle');

  button.setData('ui-button', true);
  button.setData('ui-button-background', background);
  button.on('pointerover', () => {
    setVisualState('hover');
  });
  button.on('pointerout', () => {
    setVisualState('idle');
  });
  button.on('pointerdown', () => {
    setVisualState('pressed');

    if (triggerEvent === 'pointerdown') {
      onSelect();
    }
  });
  button.on('pointerup', () => {
    setVisualState('hover');

    if (triggerEvent === 'pointerup') {
      onSelect();
    }
  });

  return button;
}

export function createSceneIconButton(scene: Phaser.Scene, options: IconButtonOptions): Phaser.GameObjects.Image {
  const { x, y, imageKey, baseSize, depth = ICON_BUTTON_DEPTH, onSelect } = options;
  const hoverScale = 1.08;
  const backgroundSize = baseSize + 16;
  const background = scene.add.graphics().setDepth(depth - 1);
  const button = scene.add
    .image(x, y, imageKey)
    .setDisplaySize(baseSize, baseSize)
    .setOrigin(0.5)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });

  const setVisualState = (state: ButtonState): void => {
    drawIconButtonBackground(background, x, y, backgroundSize, state);

    if (state === 'hover') {
      button.setDisplaySize(baseSize * hoverScale, baseSize * hoverScale);
      return;
    }

    if (state === 'pressed') {
      button.setDisplaySize(baseSize * 0.96, baseSize * 0.96);
      return;
    }

    button.setDisplaySize(baseSize, baseSize);
  };

  setVisualState('idle');

  button.setData('ui-button', true);
  button.setData('ui-button-background', background);
  button.on('pointerover', () => {
    setVisualState('hover');
  });
  button.on('pointerout', () => {
    setVisualState('idle');
  });
  button.on('pointerdown', () => {
    setVisualState('pressed');
    onSelect();
  });
  button.on('pointerup', () => {
    setVisualState('hover');
  });

  return button;
}