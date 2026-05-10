import Phaser from 'phaser';

export const SCENE_BACKGROUND_KEYS = {
  menu: 'scene-menu-bg',
  play: 'scene-play-bg',
  leaderboard: 'scene-leaderboard-bg',
  gameOver: 'scene-game-over-bg',
} as const;

type SceneBackgroundName = keyof typeof SCENE_BACKGROUND_KEYS;

const SCENE_BACKGROUND_FILES: Record<SceneBackgroundName, string> = {
  menu: 'assets/backgrounds/scene-menu-bg-v01.png',
  play: 'assets/backgrounds/scene-play-bg-v01.png',
  leaderboard: 'assets/backgrounds/scene-leaderboard-bg-v01.png',
  gameOver: 'assets/backgrounds/scene-game-over-bg-v01.png',
};

const FALLBACK_COLORS: Record<SceneBackgroundName, number> = {
  menu: 0x112233,
  play: 0x14323d,
  leaderboard: 0x15232f,
  gameOver: 0x3d1120,
};

export function preloadSceneBackgrounds(scene: Phaser.Scene): void {
  for (const [name, key] of Object.entries(SCENE_BACKGROUND_KEYS) as Array<
    [SceneBackgroundName, (typeof SCENE_BACKGROUND_KEYS)[SceneBackgroundName]]
  >) {
    scene.load.image(key, [SCENE_BACKGROUND_FILES[name]]);
  }
}

export function addSceneBackground(scene: Phaser.Scene, backgroundName: SceneBackgroundName): void {
  const { width, height } = scene.scale;
  const textureKey = SCENE_BACKGROUND_KEYS[backgroundName];
  const hasTexture = typeof scene.textures?.exists === 'function' && scene.textures.exists(textureKey);

  if (hasTexture && typeof scene.add.image === 'function') {
    scene.add.image(width / 2, height / 2, textureKey).setDisplaySize(width, height).setDepth(-10);
    return;
  }

  const fallback = scene.add.rectangle(width / 2, height / 2, width, height, FALLBACK_COLORS[backgroundName], 1);
  const withDepth = fallback as Phaser.GameObjects.Rectangle & { setDepth?: (value: number) => unknown };
  if (typeof withDepth.setDepth === 'function') {
    withDepth.setDepth(-10);
  }
}