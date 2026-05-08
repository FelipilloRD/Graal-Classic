import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { EventBus } from '../EventBus.js';
import { setupInventoryHUD, updateInventoryHUD } from '../systems/InventoryHUD.js';

export class PuebloScene extends Phaser.Scene {
  constructor() { super('PuebloScene'); }

  init(data) { this.saveData = data.save || {}; }

  create() {
    const W = 1600, H = 1200;
    this.physics.world.setBounds(0, 0, W, H);
    this.walls = this.physics.add.staticGroup();
    this.npcs = [];
    this.pickups = [];
    this.transitions = [];
    this.changingScene = false;

    // Floor
    this.buildFloor(W, H);
    this.buildTown();
    this.buildBorder(W, H);

    // Player
    const px = this.saveData.player?.scene === 'PuebloScene' ? this.saveData.player.x : 800;
    const py = this.saveData.player?.scene === 'PuebloScene' ? this.saveData.player.y : 700;
    this.player = new Player(this, px, py);
    this.physics.add.collider(this.player, this.walls);

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, W, H);

    // NPCs
    this.createNPCs();
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));

    // Pickups
    this.createPickups();

    // Zone transitions
    this.createTransitions(W, H);

    // Interaction key
    if (this.input.keyboard) {
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    // Events
    EventBus.emit('zone-enter', 'Pueblo Central');
    EventBus.emit('quest-check-reach', 'PuebloScene');
    this.dialogActive = false;
    EventBus.on('dialog-closed', () => { this.dialogActive = false; this.player.unfreeze(); });

    // Setup inventory HUD (equip system + item renderer + visual slots)
    setupInventoryHUD(this);

    // Ambient: sway trees
    this.trees.forEach(t => {
      this.tweens.add({
        targets: t, angle: Phaser.Math.Between(-2, 2),
        duration: Phaser.Math.Between(2000, 3000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });

    // Auto-save timer
    this.time.addEvent({ delay: 60000, loop: true, callback: () => EventBus.emit('auto-save') });
  }

  buildFloor(W, H) {
    for (let x = 0; x < W; x += 32) {
      for (let y = 0; y < H; y += 32) {
        const tile = Math.random() > 0.5 ? 'grass1' : 'grass2';
        this.add.image(x + 16, y + 16, tile).setDepth(0);
      }
    }
    // Dirt paths
    for (let x = 750; x < 850; x += 32) {
      for (let y = 200; y < H; y += 32) {
        this.add.image(x + 16, y + 16, 'dirt').setDepth(0);
      }
    }
    for (let y = 550; y < 650; y += 32) {
      for (let x = 200; x < W - 200; x += 32) {
        this.add.image(x + 16, y + 16, 'dirt').setDepth(0);
      }
    }
  }

  buildTown() {
    this.trees = [];
    // Houses with roofs
    const houses = [
      { x: 400, y: 400, roof: 0 }, { x: 700, y: 350, roof: 1 },
      { x: 1000, y: 400, roof: 2 }, { x: 550, y: 800, roof: 0 },
    ];
    houses.forEach(h => {
      const house = this.add.image(h.x, h.y, 'house').setDepth(5);
      const roof = this.add.image(h.x, h.y - 40, `roof_${h.roof}`).setDepth(6);
      // Wall collision
      const w = this.walls.create(h.x, h.y + 10, null);
      w.body.setSize(80, 40); w.body.setOffset(-40, -20);
      w.setVisible(false);
    });

    // Fountain in center
    this.add.image(800, 600, 'fountain').setDepth(5);
    const fw = this.walls.create(800, 610, null);
    fw.body.setSize(50, 24); fw.body.setOffset(-25, -12); fw.setVisible(false);

    // Sign
    this.add.image(750, 700, 'sign').setDepth(5);

    // Trees around
    const treePositions = [
      [200,200],[300,300],[150,500],[200,800],[300,1000],[1200,200],
      [1300,400],[1400,300],[1400,700],[1300,900],[1200,1000],[500,200],
      [600,150],[1100,150],[1000,900],[900,1000],[400,1050],[1100,1050],
    ];
    treePositions.forEach(([tx, ty]) => {
      const tree = this.add.image(tx, ty, 'tree').setDepth(ty + 30);
      this.trees.push(tree);
      const tw = this.walls.create(tx, ty + 20, null);
      tw.body.setSize(12, 10); tw.body.setOffset(-6, -5); tw.setVisible(false);
    });

    // Flowers
    for (let i = 0; i < 40; i++) {
      const fx = Phaser.Math.Between(100, 1500);
      const fy = Phaser.Math.Between(100, 1100);
      this.add.image(fx, fy, `flower_${i % 5}`).setDepth(1);
    }
  }

  buildBorder(W, H) {
    // Invisible walls at borders (except exits)
    for (let x = 0; x < W; x += 32) {
      this.addWall(x + 16, 8); // top
      this.addWall(x + 16, H - 8); // bottom
    }
    for (let y = 0; y < H; y += 32) {
      this.addWall(8, y + 16); // left
      if (y < 500 || y > 700) this.addWall(W - 8, y + 16); // right (gap for exit to Lago)
    }
    // North exit gap (to Bosque): no wall at x=750-850, y=0
    for (let x = 0; x < W; x += 32) {
      if (x < 720 || x > 880) {
        // top wall already added above, but we need gap
      }
    }
    // Remove top walls at exit
    // (they're already created, but let's add transition zones instead)
  }

  addWall(x, y) {
    const w = this.walls.create(x, y, null);
    w.body.setSize(32, 32); w.body.setOffset(-16, -16); w.setVisible(false);
  }

  createNPCs() {
    const npcData = [
      { x: 600, y: 600, sprite: 'npc_0', id: 'guardia', name: 'Guardia', direction: 'down',
        dialog: ['¡Bienvenido al pueblo!', 'El bosque está al norte.', 'Ten cuidado con la cueva.'] },
      { x: 900, y: 550, sprite: 'npc_1', id: 'mercader', name: 'Mercader', direction: 'left',
        dialog: ['Hola viajero.', 'Compro gemas raras.', '¡Toma tus monedas!'] },
      { x: 500, y: 850, sprite: 'npc_2', id: 'herborista', name: 'Herborista', direction: 'right',
        dialog: ['Necesito hierbas del bosque.', '¿Podrías traerme 3?'] },
    ];
    npcData.forEach(d => {
      const npc = new NPC(this, d.x, d.y, d.sprite, d);
      this.npcs.push(npc);
    });
  }

  createPickups() {
    const items = [
      { x: 1100, y: 600, item: 'coin' },
      { x: 350, y: 900, item: 'apple' },
    ];
    items.forEach(d => {
      const img = this.physics.add.image(d.x, d.y, `item_${d.item}`).setDepth(5).setScale(1);
      img.body.setSize(16, 16);
      img.itemId = d.item;
      // Float animation
      this.tweens.add({
        targets: img, y: d.y - 4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.pickups.push(img);
    });
  }

  createTransitions(W, H) {
    // North → Bosque
    const north = this.add.zone(800, 16, 160, 32);
    this.physics.add.existing(north, true);
    this.physics.add.overlap(this.player, north, () => this.changeScene('BosqueScene', 800, 1050));

    // East → Lago
    const east = this.add.zone(W - 16, 600, 32, 200);
    this.physics.add.existing(east, true);
    this.physics.add.overlap(this.player, east, () => this.changeScene('LagoScene', 50, 600));
  }

  changeScene(target, tx, ty) {
    if (this.changingScene) return;
    this.changingScene = true;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      EventBus.emit('save-state', {
        x: tx, y: ty, scene: target, direction: this.player.direction
      });
      this.scene.start(target, { save: { player: { x: tx, y: ty, scene: target } } });
    });
  }

  update() {
    if (this.dialogActive) return;
    this.player.update();

    // Update inventory HUD & item in hand
    updateInventoryHUD(this);

    // NPC proximity check
    this.npcs.forEach(npc => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < 50) {
        npc.showBubble();
        if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
          this.dialogActive = true;
          this.player.freeze();
          const d = npc.getDialog();
          EventBus.emit('show-dialog', d);
          EventBus.emit('quest-check-talk', npc.npcId);
          
          if (npc.npcId === 'mercader') {
            EventBus.emit('trade-gems');
          }
        }
      } else {
        npc.hideBubble();
      }
    });

    // Pickup check
    this.pickups.forEach((p, i) => {
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
