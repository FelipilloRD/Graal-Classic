import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { StartMenuScene } from './scenes/StartMenuScene.js';
import { PuebloScene } from './scenes/PuebloScene.js';
import { BosqueScene } from './scenes/BosqueScene.js';
import { LagoScene } from './scenes/LagoScene.js';
import { CuevaScene } from './scenes/CuevaScene.js';

export const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'phaser-container',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false }
  },
  render: {
    pixelArt: true,
    antialias: false,
    roundPixels: true
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, StartMenuScene, PuebloScene, BosqueScene, LagoScene, CuevaScene],
  backgroundColor: '#1a1a2e'
};
