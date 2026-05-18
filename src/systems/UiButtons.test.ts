import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSceneIconButton, createSceneTextButton } from './UiButtons';

type MockGraphics = {
  setDepth: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
  fillStyle: ReturnType<typeof vi.fn>;
  fillRoundedRect: ReturnType<typeof vi.fn>;
  lineStyle: ReturnType<typeof vi.fn>;
  strokeRoundedRect: ReturnType<typeof vi.fn>;
  fillCircle: ReturnType<typeof vi.fn>;
  strokeCircle: ReturnType<typeof vi.fn>;
};

type MockText = {
  handlers: Record<string, (() => void) | undefined>;
  y: number;
  setOrigin: ReturnType<typeof vi.fn>;
  setDepth: ReturnType<typeof vi.fn>;
  setInteractive: ReturnType<typeof vi.fn>;
  setData: ReturnType<typeof vi.fn>;
  setY: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

type MockImage = {
  handlers: Record<string, (() => void) | undefined>;
  setDisplaySize: ReturnType<typeof vi.fn>;
  setOrigin: ReturnType<typeof vi.fn>;
  setDepth: ReturnType<typeof vi.fn>;
  setInteractive: ReturnType<typeof vi.fn>;
  setData: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
};

vi.mock('phaser', () => ({
  default: {},
}));

function createGraphics(): MockGraphics {
  return {
    setDepth: vi.fn().mockReturnThis(),
    clear: vi.fn().mockReturnThis(),
    fillStyle: vi.fn().mockReturnThis(),
    fillRoundedRect: vi.fn().mockReturnThis(),
    lineStyle: vi.fn().mockReturnThis(),
    strokeRoundedRect: vi.fn().mockReturnThis(),
    fillCircle: vi.fn().mockReturnThis(),
    strokeCircle: vi.fn().mockReturnThis(),
  };
}

function createText(initialY: number): MockText {
  const item: MockText = {
    handlers: {},
    y: initialY,
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setData: vi.fn().mockReturnThis(),
    setY: vi.fn(function (this: MockText, value: number) {
      this.y = value;
      return this;
    }),
    on: vi.fn(function (this: MockText, event: string, handler: () => void) {
      this.handlers[event] = handler;
      return this;
    }),
  };

  return item;
}

function createImage(): MockImage {
  const item: MockImage = {
    handlers: {},
    setDisplaySize: vi.fn().mockReturnThis(),
    setOrigin: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setData: vi.fn().mockReturnThis(),
    on: vi.fn(function (this: MockImage, event: string, handler: () => void) {
      this.handlers[event] = handler;
      return this;
    }),
  };

  return item;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UiButtons', () => {
  it('creates a text button with hover and press states', () => {
    const graphics = createGraphics();
    const text = createText(120);
    const onSelect = vi.fn();
    const scene = {
      add: {
        graphics: vi.fn(() => graphics),
        text: vi.fn(() => text),
      },
    } as const;

    const button = createSceneTextButton(scene as never, {
      x: 300,
      y: 120,
      label: 'Teszt',
      width: 220,
      onSelect,
    });

    button.handlers.pointerover?.();
    button.handlers.pointerdown?.();
    button.handlers.pointerup?.();
    button.handlers.pointerout?.();

    expect(scene.add.graphics).toHaveBeenCalledTimes(1);
    expect(scene.add.text).toHaveBeenCalledWith(300, 119, 'Teszt', expect.objectContaining({ fixedWidth: 220 }));
    expect(text.setData).toHaveBeenCalledWith('ui-button', true);
    expect(text.setData).toHaveBeenCalledWith('ui-button-background', graphics);
    expect(text.setY).toHaveBeenCalledWith(118);
    expect(text.setY).toHaveBeenCalledWith(120);
    expect(text.setY).toHaveBeenCalledWith(119);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(graphics.clear).toHaveBeenCalled();
    expect(graphics.fillRoundedRect).toHaveBeenCalled();
    expect(graphics.strokeRoundedRect).toHaveBeenCalled();
  });

  it('creates an icon button with matching interactive states', () => {
    const graphics = createGraphics();
    const image = createImage();
    const onSelect = vi.fn();
    const scene = {
      add: {
        graphics: vi.fn(() => graphics),
        image: vi.fn(() => image),
      },
    } as const;

    const button = createSceneIconButton(scene as never, {
      x: 512,
      y: 200,
      imageKey: 'ui:test.png',
      baseSize: 40,
      onSelect,
    });

    button.handlers.pointerover?.();
    button.handlers.pointerdown?.();
    button.handlers.pointerup?.();
    button.handlers.pointerout?.();

    expect(scene.add.graphics).toHaveBeenCalledTimes(1);
    expect(scene.add.image).toHaveBeenCalledWith(512, 200, 'ui:test.png');
    expect(image.setData).toHaveBeenCalledWith('ui-button', true);
    expect(image.setData).toHaveBeenCalledWith('ui-button-background', graphics);
    expect(image.setDisplaySize).toHaveBeenCalledWith(43.2, 43.2);
    expect(image.setDisplaySize).toHaveBeenCalledWith(38.4, 38.4);
    expect(image.setDisplaySize).toHaveBeenCalledWith(40, 40);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(graphics.fillCircle).toHaveBeenCalled();
    expect(graphics.strokeCircle).toHaveBeenCalled();
  });
});