import Phaser from 'phaser';

// Game configuration - Reference: D-001 (Phaser 3), D-002 (TypeScript), D-003 (Vite)
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1024,
    height: 768,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scenes: [
    // Scenes will be registered here (Task #2)
  ],
};

// Initialize the Phaser game
const game = new Phaser.Game(config);

console.log('Heroes of NVVH - Game initialized');
export default game;
