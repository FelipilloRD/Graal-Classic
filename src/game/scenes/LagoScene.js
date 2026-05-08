import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { EventBus } from '../EventBus.js';
import { setupInventoryHUD, updateInventoryHUD } from '../systems/InventoryHUD.js';

export class LagoScene extends Phaser.Scene {
  constructor() { super('LagoScene'); }
  init(data) { this.saveData = data.save || {}; }

  create() {
    const W = 1200, H = 1200;
    this.physics.world.setBounds(0, 0, W, H);
    this.walls = this.physics.add.staticGroup();
    this.npcs = [];
    this.pickups = [];
    this.changingScene = false;
    this.trees = [];

    this.buildFloor(W, H);
    this.buildLake();
    this.buildBorder(W, H);

    const px = this.saveData.player?.scene === 'LagoScene' ? this.saveData.player.x : 50;
    const py = this.saveData.player?.scene === 'LagoScene' ? this.saveData.player.y : 600;
    this.player = new Player(this, px, py);
    this.physics.add.collider(this.player, this.walls);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, W, H);

    this.createNPCs();
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));
    this.createPickups();
    this.createTransitions(W, H);

    if (this.input.keyboard) {
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    EventBus.emit('zone-enter', 'Lago Sereno');
    EventBus.emit('quest-check-reach', 'LagoScene');
    this.dialogActive = false;
    EventBus.on('dialog-closed', () => { this.dialogActive = false; this.player.unfreeze(); });

    // Setup inventory HUD
    setupInventoryHUD(this);

    // Water animation
    this.waterFrame = 0;
    this.time.addEvent({
      delay: 400, loop: true, callback: () => {
        this.waterFrame = (this.waterFrame + 1) % 4;
        this.waterTiles.forEach(t => t.setTexture(`water_${this.waterFrame}`));
      }
    });

    // Fish animation
    this.fishSprites.forEach((f, i) => {
      this.tweens.add({
        targets: f, x: f.x + Phaser.Math.Between(-40, 40),
        duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        delay: i * 500
      });
    });

    // Trees sway
    this.trees.forEach(t => {
      this.tweens.add({
        targets: t, angle: Phaser.Math.Between(-2, 2),
        duration: Phaser.Math.Between(2000, 3000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });

    this.time.addEvent({ delay: 60000, loop: true, callback: () => EventBus.emit('auto-save') });
  }

  buildFloor(W, H) {
    this.waterTiles = [];
    for (let x = 0; x < W; x += 32) {
      for (let y = 0; y < H; y += 32) {
        const cx = W / 2, cy = H / 2;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < 250) {
          const wt = this.add.image(x + 16, y + 16, 'water_0').setDepth(0);
          this.waterTiles.push(wt);
        } else if (dist < 300) {
          this.add.image(x + 16, y + 16, 'sand').setDepth(0);
        } else {
          this.add.image(x + 16, y + 16, Math.random() > 0.5 ? 'grass1' : 'grass2').setDepth(0);
        }
      }
    }
    // Water collision zone
    const wz = this.walls.create(W / 2, H / 2, null);
    wz.body.setCircle(220);
    wz.body.setOffset(-220, -220);
    wz.setVisible(false);
  }

  buildLake() {
    // Fish in water
    this.fishSprites = [];
    for (let i = 0; i < 5; i++) {
      const fx = 600 + Phaser.Math.Between(-150, 150);
      const fy = 600 + Phaser.Math.Between(-150, 150);
      const fish = this.add.image(fx, fy, 'fish_sprite').setDepth(2).setScale(2);
      this.fishSprites.push(fish);
    }

    // Trees around lake
    const treePos = [
      [100,100],[200,200],[100,400],[100,800],[200,1000],[100,1100],
      [1000,100],[1100,200],[1100,500],[1100,800],[1000,1000],[1100,1100],
      [400,100],[800,100],[400,1100],[800,1100],
    ];
    treePos.forEach(([tx, ty]) => {
      const tree = this.add.image(tx, ty, 'tree').setDepth(ty + 30);
      this.trees.push(tree);
      const tw = this.walls.create(tx, ty + 20, null);
      tw.body.setSize(12, 10); tw.body.setOffset(-6, -5); tw.setVisible(false);
    });

    // Rocks along shore
    [{ x: 400, y: 350 }, { x: 800, y: 350 }, { x: 500, y: 850 }].forEach(r => {
      this.add.image(r.x, r.y, 'rock').setDepth(5);
      const rw = this.walls.create(r.x, r.y + 4, null);
      rw.body.setSize(28, 14); rw.body.setOffset(-14, -7); rw.setVisible(false);
    });

    // Flowers
    for (let i = 0; i < 25; i++) {
      this.add.image(Phaser.Math.Between(50, 1150), Phaser.Math.Between(50, 1150), `flower_${i % 5}`).setDepth(1);
    }
  }

  buildBorder(W, H) {
    for (let x = 0; x < W; x += 32) {
      this.addWall(x + 16, 8);
      this.addWall(x + 16, H - 8);
    }
    for (let y = 0; y < H; y += 32) {
      if (y < 500 || y > 700) this.addWall(8, y + 16);
      this.addWall(W - 8, y + 16);
    }
  }

  addWall(x, y) {
    const w = this.walls.create(x, y, null);
    w.body.setSize(32, 32); w.body.setOffset(-16, -16); w.setVisible(false);
  }

  createNPCs() {
    const npc = new NPC(this, 350, 500, 'npc_1', {
      id: 'pescador', name: 'Pescador', direction: 'right',
      dialog: ['El lago está lleno de peces hoy.', '¿Te gustaría pescar?', 'Toma este pez como regalo.']
    });
    this.npcs.push(npc);
  }

  createPickups() {
    [{ x: 900, y: 400, item: 'fish' }, { x: 300, y: 800, item: 'fish' }].forEach(d => {
      const img = this.physics.add.image(d.x, d.y, `item_${d.item}`).setDepth(5).setScale(1);
      img.body.setSize(16, 16); img.itemId = d.item;
      this.tweens.add({ targets: img, y: d.y - 4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pickups.push(img);
    });
  }

  createTransitions(W, H) {
    const west = this.add.zone(16, 600, 32, 200);
    this.physics.add.existing(west, true);
    this.physics.add.overlap(this.player, west, () => this.changeScene('PuebloScene', 1550, 600));
  }

  changeScene(target, tx, ty) {
    if (this.changingScene) return;
    this.changingScene = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      EventBus.emit('save-state', { x: tx, y: ty, scene: target, direction: this.player.direction });
      this.scene.start(target, { save: { player: { x: tx, y: ty, scene: target } } });
    });
  }

  update() {
    if (this.dialogActive) return;
    this.player.update();

    // Update inventory HUD & item in hand
    updateInventoryHUD(this);
    this.npcs.forEach(npc => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < 50) {
        npc.showBubble();
        if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
          this.dialogActive = true; this.player.freeze();
          EventBus.emit('show-dialog', npc.getDialog());
          EventBus.emit('quest-check-talk', npc.npcId);
        }
      } else { npc.hideBubble(); }
    });
    this.pickups.forEach(p => {
      if (!p.active) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
      if (dist < 30 && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        EventBus.emit('item-pickup', p.itemId);
        this.player.liftItem(p.itemId);
        p.destroy();
      }
    });
  }
}
