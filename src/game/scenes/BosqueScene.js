import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { Enemy } from '../entities/Enemy.js';
import { EventBus } from '../EventBus.js';
import { setupInventoryHUD, updateInventoryHUD } from '../systems/InventoryHUD.js';

export class BosqueScene extends Phaser.Scene {
  constructor() { super('BosqueScene'); }
  init(data) { this.saveData = data.save || {}; }

  create() {
    const W = 1600, H = 1200;
    this.physics.world.setBounds(0, 0, W, H);
    this.walls = this.physics.add.staticGroup();
    this.bushes = this.physics.add.staticGroup();
    this.npcs = [];
    this.enemies = [];
    this.pickups = [];
    this.trees = [];
    this.changingScene = false;
    this.fireballs = this.physics.add.group();

    this.buildFloor(W, H);
    this.buildForest();
    this.buildBorder(W, H);

    const px = this.saveData.player?.scene === 'BosqueScene' ? this.saveData.player.x : 800;
    const py = this.saveData.player?.scene === 'BosqueScene' ? this.saveData.player.y : 1050;
    this.player = new Player(this, px, py);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.bushes);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, W, H);

    this.createNPCs();
    this.createEnemies();
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));
    this.enemies.forEach(e => {
      this.physics.add.collider(e, this.walls);
      this.physics.add.collider(e, this.bushes);
      this.physics.add.collider(this.player, e, () => {
        if (e.state !== 'hurt' && this.player.alpha === 1) {
          EventBus.emit('player-damage', 1);
          // Invulnerability frames
          this.player.setAlpha(0.5);
          this.time.delayedCall(1000, () => this.player.setAlpha(1));
          
          // Knockback player
          const dir = new Phaser.Math.Vector2(this.player.x - e.x, this.player.y - e.y).normalize();
          this.player.setVelocity(dir.x * 300, dir.y * 300);
        }
      });
    });
    this.createPickups();
    this.createTransitions(W, H);

    if (this.input.keyboard) {
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    EventBus.emit('zone-enter', 'Bosque Encantado');
    EventBus.emit('quest-check-reach', 'BosqueScene');
    this.dialogActive = false;
    EventBus.on('dialog-closed', () => { this.dialogActive = false; this.player.unfreeze(); });

    // Setup inventory HUD
    setupInventoryHUD(this);

    // Leaf particles
    this.leafParticles = this.add.particles(W / 2, 0, 'flower_2', {
      x: { min: 0, max: W }, y: { min: 0, max: 50 },
      speedY: { min: 20, max: 40 }, speedX: { min: -10, max: 10 },
      scale: { start: 0.5, end: 0.2 }, alpha: { start: 0.7, end: 0 },
      lifespan: 5000, frequency: 800, quantity: 1,
    });

    // Sway trees
    this.trees.forEach(t => {
      this.tweens.add({
        targets: t, angle: Phaser.Math.Between(-3, 3),
        duration: Phaser.Math.Between(1500, 2500), yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    });

    // Handle attack
    const onAttack = (hitbox) => {
      this.physics.overlap(hitbox, this.bushes, (hit, bush) => {
        bush.destroy();
        // Drop loot from bush
        if (Math.random() > 0.7) {
          const loot = Math.random() > 0.5 ? 'coin' : 'apple';
          const drop = this.physics.add.image(bush.x, bush.y, `item_${loot}`).setDepth(5).setScale(1);
          drop.body.setSize(16, 16); drop.itemId = loot;
          this.pickups.push(drop);
          this.tweens.add({ targets: drop, y: bush.y - 4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      });

      this.physics.overlap(hitbox, this.enemies, (hit, enemy) => {
        const knockbackDir = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y).normalize();
        enemy.takeDamage(1, knockbackDir);
      });
    };
    EventBus.on('player-attack', onAttack);

    // === Fireball support (wand) ===
    const onFireball = (dir) => { this.shootFireball(dir); };
    EventBus.on('player-fireball', onFireball);

    // Fireball collisions with enemies
    this.physics.add.overlap(this.fireballs, this.enemies, (obj1, obj2) => {
      let fb = (obj1 && obj1.texture && obj1.texture.key === 'fireball') ? obj1 : obj2;
      let enemy = (obj1 && obj1.texture && obj1.texture.key === 'fireball') ? obj2 : obj1;
      if (!fb || !enemy || !fb.active || fb._hit || !enemy.active) return;
      fb._hit = true;
      let dir = new Phaser.Math.Vector2(enemy.x - fb.x, enemy.y - fb.y);
      if (dir.lengthSq() === 0) dir.set(1, 0);
      if (typeof enemy.takeDamage === 'function') enemy.takeDamage(2, dir.normalize());
      if (fb._emitter) fb._emitter.stop();
      fb.disableBody(true, true);
      this.time.delayedCall(10, () => { if (fb) fb.destroy(); });
    });
    // Fireball collisions with bushes
    this.physics.add.overlap(this.fireballs, this.bushes, (obj1, obj2) => {
      let fb = (obj1 && obj1.texture && obj1.texture.key === 'fireball') ? obj1 : obj2;
      let bush = (obj1 && obj1.texture && obj1.texture.key === 'fireball') ? obj2 : obj1;
      if (!fb || !fb.active || fb._hit) return;
      fb._hit = true;
      if (bush && bush.active) bush.destroy();
      if (fb._emitter) fb._emitter.stop();
      fb.disableBody(true, true);
      this.time.delayedCall(10, () => { if (fb) fb.destroy(); });
    });
    // Fireball collisions with walls
    this.physics.add.overlap(this.fireballs, this.walls, (fb) => {
      if (fb._emitter) fb._emitter.stop();
      fb.disableBody(true, true);
      this.time.delayedCall(10, () => { if (fb) fb.destroy(); });
    });

    this.events.on('shutdown', () => {
      EventBus.off('player-attack', onAttack);
      EventBus.off('player-fireball', onFireball);
    });

    this.time.addEvent({ delay: 60000, loop: true, callback: () => EventBus.emit('auto-save') });
  }

  buildFloor(W, H) {
    for (let x = 0; x < W; x += 32) {
      for (let y = 0; y < H; y += 32) {
        this.add.image(x + 16, y + 16, Math.random() > 0.6 ? 'grass2' : 'grass1').setDepth(0);
      }
    }
    // Winding dirt path
    const pathY = [600, 500, 400, 350, 300, 250, 300, 400, 500, 550, 600, 650, 700];
    for (let i = 0; i < pathY.length; i++) {
      const px = 100 + i * 110;
      for (let dy = -32; dy <= 32; dy += 32) {
        this.add.image(px, pathY[i] + dy, 'dirt').setDepth(0);
      }
    }
  }

  buildForest() {
    // Dense tree placement
    for (let i = 0; i < 80; i++) {
      const tx = Phaser.Math.Between(50, 1550);
      const ty = Phaser.Math.Between(50, 1150);
      // Avoid path area
      if (tx > 700 && tx < 900 && ty > 1050) continue;
      if (tx > 700 && tx < 900 && ty < 150) continue;
      const tree = this.add.image(tx, ty, 'tree').setDepth(ty + 30);
      this.trees.push(tree);
      const tw = this.walls.create(tx, ty + 20, null);
      tw.body.setSize(12, 10); tw.body.setOffset(-6, -5); tw.setVisible(false);
    }
    // Flowers scattered
    for (let i = 0; i < 60; i++) {
      const fx = Phaser.Math.Between(50, 1550);
      const fy = Phaser.Math.Between(50, 1150);
      this.add.image(fx, fy, `flower_${i % 5}`).setDepth(1);
    }
    
    // Bushes
    for (let i = 0; i < 30; i++) {
      const bx = Phaser.Math.Between(100, 1500);
      const by = Phaser.Math.Between(200, 1000);
      // Avoid main path
      if (bx > 700 && bx < 900) continue;
      const bush = this.bushes.create(bx, by, 'bush').setDepth(by + 16);
      bush.body.setSize(24, 24); bush.body.setOffset(4, 4);
      bush.refreshBody();
    }
  }

  buildBorder(W, H) {
    for (let x = 0; x < W; x += 32) {
      if (x < 720 || x > 880) {
        this.addWall(x + 16, 8);
        this.addWall(x + 16, H - 8);
      }
    }
    for (let y = 0; y < H; y += 32) {
      this.addWall(8, y + 16);
      this.addWall(W - 8, y + 16);
    }
  }

  addWall(x, y) {
    const w = this.walls.create(x, y, null);
    w.body.setSize(32, 32); w.body.setOffset(-16, -16); w.setVisible(false);
  }

  createNPCs() {
    const npcData = [
      { x: 400, y: 400, sprite: 'npc_3', id: 'leñador', name: 'Leñador', direction: 'down',
        dialog: ['Este bosque es antiguo...', 'Dicen que hay una cueva al norte.', '¡Ten cuidado!'] },
    ];
    npcData.forEach(d => {
      const npc = new NPC(this, d.x, d.y, d.sprite, d);
      this.npcs.push(npc);
    });
  }

  createEnemies() {
    for (let i = 0; i < 5; i++) {
      const ex = Phaser.Math.Between(200, 1400);
      const ey = Phaser.Math.Between(200, 1000);
      if (ex > 700 && ex < 900) continue;
      const enemy = new Enemy(this, ex, ey, 'slime', { health: 2, speed: 40 });
      this.enemies.push(enemy);
    }
  }

  createPickups() {
    const herbs = [
      { x: 750, y: 950 }, { x: 850, y: 900 }, { x: 720, y: 850 },
      { x: 880, y: 800 }, { x: 800, y: 750 },
    ];
    herbs.forEach(d => {
      const img = this.physics.add.image(d.x, d.y, 'item_herb').setDepth(5).setScale(1);
      img.body.setSize(16, 16);
      img.itemId = 'herb';
      this.tweens.add({
        targets: img, y: d.y - 4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
      this.pickups.push(img);
    });
    // Mushrooms
    const mush = [{ x: 200, y: 500 }, { x: 1200, y: 600 }];
    mush.forEach(d => {
      const img = this.physics.add.image(d.x, d.y, 'item_mushroom').setDepth(5).setScale(1);
      img.body.setSize(16, 16); img.itemId = 'mushroom';
      this.tweens.add({ targets: img, y: d.y - 4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pickups.push(img);
    });
  }

  createTransitions(W, H) {
    // South → Pueblo
    const south = this.add.zone(800, H - 16, 160, 32);
    this.physics.add.existing(south, true);
    this.physics.add.overlap(this.player, south, () => this.changeScene('PuebloScene', 800, 50));

    // North → Cueva
    const north = this.add.zone(800, 16, 160, 32);
    this.physics.add.existing(north, true);
    this.physics.add.overlap(this.player, north, () => this.changeScene('CuevaScene', 500, 850));
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

  shootFireball(direction) {
    const dirVec = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
    const d = dirVec[direction] || dirVec.down;
    const spawnX = this.player.x + d.x * 24;
    const spawnY = this.player.y + d.y * 24;
    const fb = this.physics.add.image(spawnX, spawnY, 'fireball');
    fb.setDepth(20);
    fb.body.setAllowGravity(false);
    fb.body.setImmovable(false);
    fb.setCollideWorldBounds(false);
    this.fireballs.add(fb);
    fb.body.setVelocity(d.x * 300, d.y * 300);
    fb._life = 2000;
    const emitter = this.add.particles(0, 0, 'fireball_particle', {
      speed: 30, scale: {start:0.8,end:0}, lifespan: 300, frequency: 50, tint: 0xFFAA00
    });
    emitter.startFollow(fb);
    fb._emitter = emitter;
  }

  update() {
    if (this.dialogActive) return;
    this.player.update();
    this.enemies.forEach(e => e.update(this.player));

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

    // Update fireballs
    if (this.fireballs) {
      this.fireballs.getChildren().forEach(fb => {
        if (!fb.active) return;
        fb._life -= 16;
        if (fb._life <= 0) {
          if (fb._emitter) fb._emitter.stop();
          fb.disableBody(true, true);
          this.time.delayedCall(10, () => { if (fb) fb.destroy(); });
        }
      });
    }
  }
}
