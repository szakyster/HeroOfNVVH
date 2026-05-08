export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  PLAY: 'PlayScene',
  GAME_OVER: 'GameOverScene',
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
