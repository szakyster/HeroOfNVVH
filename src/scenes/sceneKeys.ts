export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  LEVEL_SELECT: 'LevelSelectScene',
  PLAY: 'PlayScene',
  GAME_OVER: 'GameOverScene',
  LEADERBOARD: 'LeaderboardScene',
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
