import Phaser from 'phaser';

/**
 * StartMenuScene — Main menu screen shown before gameplay starts.
 * Features an animated forest background with swaying trees,
 * firefly particles, parallax fog, pulsing title, and interactive START button.
 */
export class StartMenuScene extends Phaser.Scene {
  constructor() {
    super('StartMenuScene');
  }

  init(data) {
    this.saveData = data.save || {};
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    const centerX = W / 2;
    const centerY = H / 2;

    // ========== BACKGROUND ==========
    // Dark gradient sky
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x0a0a1e, 0x0a0a1e, 0x1a2a1a, 0x1a2a1a, 1);
    bgGraphics.fillRect(0, 0, W, H);
    bgGraphics.setDepth(0);

    // Ground/grass layer
    const groundGraphics = this.add.graphics();
    groundGraphics.fillStyle(0x1a3a1a, 1);
    groundGraphics.fillRect(0, H * 0.7, W, H * 0.3);
    groundGraphics.fillStyle(0x224422, 1);
    groundGraphics.fillRect(0, H * 0.72, W, H * 0.28);
    groundGraphics.setDepth(1);

    // Floor texture dots
    for (let i = 0; i < 100; i++) {
      const gx = Phaser.Math.Between(0, W);
      const gy = Phaser.Math.Between(Math.floor(H * 0.7), H);
      groundGraphics.fillStyle(Phaser.Math.Between(0, 1) ? 0x2a5a2a : 0x1a4a1a, 0.5);
      groundGraphics.fillRect(gx, gy, 2, 2);
    }

    // ========== TREES ==========
    this.menuTrees = [];
    const treePositions = [
      { x: W * 0.08, y: H * 0.55, s: 1.4 },
      { x: W * 0.22, y: H * 0.58, s: 1.1 },
      { x: W * 0.40, y: H * 0.52, s: 1.6 },
      { x: W * 0.60, y: H * 0.56, s: 1.3 },
      { x: W * 0.78, y: H * 0.50, s: 1.5 },
      { x: W * 0.92, y: H * 0.54, s: 1.2 },
      { x: W * 0.15, y: H * 0.48, s: 1.0 },
      { x: W * 0.85, y: H * 0.46, s: 1.1 },
    ];

    treePositions.forEach((tp) => {
      const treeG = this.add.graphics();
      treeG.setDepth(2);

      // Trunk
      const trunkW = 12 * tp.s;
      const trunkH = 40 * tp.s;
      treeG.fillStyle(0x4A3020);
      treeG.fillRect(tp.x - trunkW / 2, tp.y, trunkW, trunkH);
      treeG.fillStyle(0x5D3A1A);
      treeG.fillRect(tp.x - trunkW / 2 + 2, tp.y + 2, trunkW / 3, trunkH - 4);

      // Crown shadow
      treeG.fillStyle(0x0a2a0a);
      treeG.fillCircle(tp.x + 2, tp.y - 2, 30 * tp.s);

      // Crown main
      treeG.fillStyle(0x1a4a1a);
      treeG.fillCircle(tp.x, tp.y - 5, 28 * tp.s);

      // Crown highlight
      treeG.fillStyle(0x2a6a2a);
      treeG.fillCircle(tp.x - 6 * tp.s, tp.y - 12 * tp.s, 14 * tp.s);

      this.menuTrees.push({
        graphics: treeG,
        baseY: tp.y,
        baseX: tp.x,
        speed: 0.3 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
        scale: tp.s,
      });
    });

    // ========== FOG LAYERS ==========
    for (let i = 0; i < 3; i++) {
      const fog = this.add.graphics();
      const fogAlpha = 0.08 + Math.random() * 0.07;
      const fogColor = i % 2 === 0 ? 0xFFFFFF : 0x8888CC;
      fog.fillStyle(fogColor, fogAlpha);
      const fogY = H * (0.3 + i * 0.15);
      const fogH = 60 + i * 20;
      fog.fillRect(-W * 0.3, fogY, W * 1.6, fogH);
      fog.setDepth(3);

      // Parallax fog tween
      this.tweens.add({
        targets: fog,
        x: { from: -80 - i * 40, to: 80 + i * 40 },
        duration: 8000 + i * 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // ========== FIREFLY PARTICLES ==========
    if (!this.textures.exists('firefly_particle')) {
      const particleG = this.add.graphics();
      particleG.fillStyle(0xFFFFAA, 1);
      particleG.fillCircle(4, 4, 3);
      particleG.fillStyle(0xFFFFFF, 0.8);
      particleG.fillCircle(4, 4, 1.5);
      particleG.generateTexture('firefly_particle', 8, 8);
      particleG.destroy();
    }

    this.add.particles(W / 2, H / 2, 'firefly_particle', {
      x: { min: -W / 2, max: W / 2 },
      y: { min: -H / 3, max: H / 3 },
      speed: { min: 5, max: 20 },
      angle: { min: 250, max: 290 },
      scale: { start: 0.4, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      lifespan: { min: 3000, max: 6000 },
      frequency: 200,
      quantity: 1,
      blendMode: 'ADD',
    }).setDepth(4);

    // ========== TITLE ==========
    const titleText = this.add.text(centerX, H * 0.16, 'CLASSIC RPG', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(10);

    // Subtitle
    this.add.text(centerX, H * 0.24, 'Una aventura en Graal', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#8BC34A',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    // Title pulse tween
    this.tweens.add({
      targets: titleText,
      alpha: { from: 0.85, to: 1.0 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // ========== START BUTTON ==========
    const btnWidth = 220;
    const btnHeight = 60;
    const btnX = centerX;
    const btnY = H * 0.62;

    // Visual background
    this.btnBgGraphics = this.add.graphics().setDepth(10);
    this.drawButton(this.btnBgGraphics, btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 0x2a5a2a, 0x5DB55D);

    // Label
    this.btnLabel = this.add.text(btnX, btnY, 'START GAME', {
      fontSize: '16px',
      fontFamily: '"Press Start 2P", monospace',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(11);

    // Interactive zone — use the same coordinates as the visual button
    const btnZone = this.add.rectangle(btnX, btnY, btnWidth, btnHeight);
    btnZone.setFillStyle(0x000000, 0); // Invisible fill
    btnZone.setInteractive({ useHandCursor: true });
    btnZone.setDepth(12);

    this.transitioning = false;

    btnZone.on('pointerover', () => {
      if (this.transitioning) return;
      this.btnBgGraphics.clear();
      this.drawButton(this.btnBgGraphics, btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 0x3a7a3a, 0x7DCB7D);
      this.btnLabel.setScale(1.08);
    });

    btnZone.on('pointerout', () => {
      if (this.transitioning) return;
      this.btnBgGraphics.clear();
      this.drawButton(this.btnBgGraphics, btnX - btnWidth / 2, btnY - btnHeight / 2, btnWidth, btnHeight, 0x2a5a2a, 0x5DB55D);
      this.btnLabel.setScale(1.0);
    });

    btnZone.on('pointerdown', () => {
      if (this.transitioning) return;
      this.transitioning = true;
      this.btnLabel.setScale(0.95);

      // Transition to game
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        const targetScene = this.saveData.player?.scene || 'PuebloScene';
        this.scene.start(targetScene, { save: this.saveData });
      });
    });

    // ========== VERSION / CREDITS ==========
    this.add.text(centerX, H - 30, 'v1.0 — Phaser + React', {
      fontSize: '8px',
      fontFamily: 'monospace',
      color: '#555555',
    }).setOrigin(0.5).setDepth(10);

    // Fade in on scene start
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  drawButton(graphics, x, y, w, h, fillColor, strokeColor) {
    graphics.fillStyle(fillColor, 1);
    graphics.fillRoundedRect(x, y, w, h, 8);
    graphics.lineStyle(2, strokeColor, 1);
    graphics.strokeRoundedRect(x, y, w, h, 8);
    // Inner highlight
    graphics.fillStyle(0xFFFFFF, 0.05);
    graphics.fillRoundedRect(x + 2, y + 2, w - 4, h / 2 - 2, 6);
  }

  update(time) {
    // Animate tree crowns with sine wave
    this.menuTrees.forEach(tree => {
      const sway = Math.sin(time * 0.001 * tree.speed + tree.offset) * 2;
      tree.graphics.setX(sway);
    });
  }
}
