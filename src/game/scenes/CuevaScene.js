import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
import { Enemy } from '../entities/Enemy.js';
import { EventBus } from '../EventBus.js';
import { setupInventoryHUD, updateInventoryHUD } from '../systems/InventoryHUD.js';

export class CuevaScene extends Phaser.Scene {
  constructor() { super('CuevaScene'); }
  init(data) { this.saveData = data.save || {}; }

  create() {
    const W = 1000, H = 1000;
    this.physics.world.setBounds(0, 0, W, H);
    this.walls = this.physics.add.staticGroup();
    this.npcs = [];
    this.enemies = [];
    this.pickups = [];
    this.changingScene = false;

    this.buildFloor(W, H);
    this.buildCave(W, H);
    this.buildBorder(W, H);

    const px = this.saveData.player?.scene === 'CuevaScene' ? this.saveData.player.x : 500;
    const py = this.saveData.player?.scene === 'CuevaScene' ? this.saveData.player.y : 850;
    this.player = new Player(this, px, py);
    this.physics.add.collider(this.player, this.walls);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(2);
    this.cameras.main.setBounds(0, 0, W, H);

    // Dark ambiance
    this.cameras.main.setBackgroundColor('#0a0a14');

    this.createNPCs();
    this.createEnemies();
    this.npcs.forEach(n => this.physics.add.collider(this.player, n));
    this.enemies.forEach(e => {
      this.physics.add.collider(e, this.walls);
      this.physics.add.collider(this.player, e, () => {
        if (e.state !== 'hurt' && this.player.alpha === 1) {
          EventBus.emit('player-damage', 1);
          this.player.setAlpha(0.5);
          this.time.delayedCall(1000, () => this.player.setAlpha(1));
          const dir = new Phaser.Math.Vector2(this.player.x - e.x, this.player.y - e.y).normalize();
          this.player.setVelocity(dir.x * 300, dir.y * 300);
        }
      });
    });
    this.createPickups();
    this.createTransitions(W, H);

    // Chest
    const chestState = this.saveData.player?.chestOpen || false;
    this.chest = this.physics.add.staticImage(500, 150, chestState ? 'chest_open' : 'chest_closed').setDepth(15);
    this.chest.body.setSize(32, 20);
    this.chest.body.setOffset(0, 12);
    this.chestOpen = chestState;
    this.physics.add.collider(this.player, this.chest);

    const onChestOpened = () => {
      this.chestOpen = true;
      this.chest.setTexture('chest_open');
      this.chest.body.setSize(32, 20);
      this.chest.body.setOffset(0, 12);
      EventBus.emit('save-state', { chestOpen: true });
    };
    EventBus.on('chest-opened', onChestOpened);

    const onAttack = (hitbox) => {
      this.physics.overlap(hitbox, this.enemies, (hit, enemy) => {
        const knockbackDir = new Phaser.Math.Vector2(enemy.x - this.player.x, enemy.y - this.player.y).normalize();
        enemy.takeDamage(1, knockbackDir);
      });
    };
    EventBus.on('player-attack', onAttack);

    this.events.on('shutdown', () => {
      EventBus.off('chest-opened', onChestOpened);
      EventBus.off('player-attack', onAttack);
    });

    if (this.input.keyboard) {
      this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }

    EventBus.emit('zone-enter', 'Cueva Cristalina');
    EventBus.emit('quest-check-reach', 'CuevaScene');
    this.dialogActive = false;
    EventBus.on('dialog-closed', () => { this.dialogActive = false; this.player.unfreeze(); });

    // Setup inventory HUD
    setupInventoryHUD(this);

    // Torch animation
    this.torchFrame = 0;
    this.time.addEvent({
      delay: 200, loop: true, callback: () => {
        this.torchFrame = (this.torchFrame + 1) % 4;
        this.torchSprites.forEach(t => t.setTexture(`torch_${this.torchFrame}`));
      }
    });

    // Crystal glow animation
    this.crystalSprites.forEach((c, i) => {
      this.tweens.add({
        targets: c, alpha: 0.5, duration: Phaser.Math.Between(1000, 2000),
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 300
      });
    });

    // Light effect around player
    this.lightCircle = this.add.graphics();
    this.lightCircle.setDepth(100).setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Darkness overlay
    this.darkness = this.add.graphics();
    this.darkness.setDepth(2000);
    this.darkness.setScrollFactor(0);

    // === EXPANSION ===
    this.createExpansion();

    const onFireball = (dir) => { this.shootFireball(dir); };
    EventBus.on('player-fireball', onFireball);
    const onDoorOpened = (type) => { this.openDoor(type); };
    EventBus.on('cave-door-opened', onDoorOpened);
    this.events.on('shutdown', () => {
      EventBus.off('player-fireball', onFireball);
      EventBus.off('cave-door-opened', onDoorOpened);
    });

    this.time.addEvent({ delay: 60000, loop: true, callback: () => EventBus.emit('auto-save') });
  }

  buildFloor(W, H) {
    for (let x = 0; x < W; x += 32) {
      for (let y = 0; y < H; y += 32) {
        this.add.image(x + 16, y + 16, 'stone').setDepth(0).setTint(0x666680);
      }
    }
  }

  buildCave(W, H) {
    this.torchSprites = [];
    this.crystalSprites = [];

    // Wall patches (irregular cave walls)
    const wallAreas = [
      { x: 0, y: 0, w: 200, h: 400 }, { x: 0, y: 600, w: 150, h: 400 },
      { x: 800, y: 0, w: 200, h: 350 }, { x: 850, y: 650, w: 150, h: 350 },
      { x: 300, y: 0, w: 400, h: 100 },
    ];
    wallAreas.forEach(a => {
      for (let x = a.x; x < a.x + a.w; x += 32) {
        for (let y = a.y; y < a.y + a.h; y += 32) {
          this.add.image(x + 16, y + 16, 'wall').setDepth(3).setTint(0x555566);
          const bw = this.walls.create(x + 16, y + 16, null);
          bw.body.setSize(32, 32); bw.body.setOffset(-16, -16); bw.setVisible(false);
        }
      }
    });

    // Torches on walls
    const torchPos = [
      { x: 200, y: 150 }, { x: 200, y: 450 }, { x: 800, y: 150 },
      { x: 800, y: 500 }, { x: 500, y: 100 },
    ];
    torchPos.forEach(t => {
      const torch = this.add.image(t.x, t.y, 'torch_0').setDepth(10);
      this.torchSprites.push(torch);
      // Light glow around torch
      const glow = this.add.graphics();
      glow.fillStyle(0xFFAA44, 0.08);
      glow.fillCircle(t.x, t.y, 80);
      glow.setDepth(4);
    });

    // Crystals
    const crystalPos = [
      { x: 300, y: 300, t: 0 }, { x: 700, y: 250, t: 1 }, { x: 500, y: 500, t: 2 },
      { x: 350, y: 700, t: 0 }, { x: 650, y: 650, t: 1 },
    ];
    crystalPos.forEach(c => {
      const crystal = this.add.image(c.x, c.y, `crystal_${c.t}`).setDepth(5);
      this.crystalSprites.push(crystal);
      // Glow
      const glow = this.add.graphics();
      const colors = [0xE040FB, 0x7C4DFF, 0x00E5FF];
      glow.fillStyle(colors[c.t], 0.06);
      glow.fillCircle(c.x, c.y, 50);
      glow.setDepth(4);
    });

    // Stalactites (decorative, at top)
    for (let i = 0; i < 10; i++) {
      const sx = Phaser.Math.Between(100, 900);
      this.add.image(sx, Phaser.Math.Between(20, 80), 'stalactite').setDepth(2).setTint(0x888899);
    }

    // Rocks
    [{ x: 400, y: 400 }, { x: 600, y: 300 }, { x: 300, y: 800 }].forEach(r => {
      this.add.image(r.x, r.y, 'rock').setDepth(5).setTint(0x777788);
      const rw = this.walls.create(r.x, r.y + 4, null);
      rw.body.setSize(28, 14); rw.body.setOffset(-14, -7); rw.setVisible(false);
    });
  }

  buildBorder(W, H) {
    for (let x = 0; x < W; x += 32) {
      this.addWall(x + 16, 8);
      if (x < 440 || x > 560) this.addWall(x + 16, H - 8);
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
    const npc = new NPC(this, 500, 400, 'npc_2', {
      id: 'mago', name: 'Mago', direction: 'down',
      dialog: ['Busco gemas preciosas...', 'Si me traes 2 gemas, te daré un Pergamino Mágico.']
    });
    this.npcs.push(npc);
  }

  createEnemies() {
    for (let i = 0; i < 4; i++) {
      const ex = Phaser.Math.Between(200, 800);
      const ey = Phaser.Math.Between(500, 800);
      const enemy = new Enemy(this, ex, ey, 'slime', { health: 2, speed: 40 });
      this.enemies.push(enemy);
    }
  }

  createPickups() {
    [{ x: 350, y: 600, item: 'gem' }, { x: 700, y: 500, item: 'gem' }, { x: 500, y: 750, item: 'key' }].forEach(d => {
      const img = this.physics.add.image(d.x, d.y, `item_${d.item}`).setDepth(6).setScale(1);
      img.body.setSize(16, 16); img.itemId = d.item;
      this.tweens.add({ targets: img, y: d.y - 4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pickups.push(img);
    });
  }

  createTransitions(W, H) {
    const south = this.add.zone(500, H - 16, 120, 32);
    this.physics.add.existing(south, true);
    this.physics.add.overlap(this.player, south, () => this.changeScene('BosqueScene', 800, 50));
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

  // ==============================
  // === EXPANSION METHODS ===
  // ==============================

  createExpansion() {
    this.blueTorches = [];
    this.greenTorches = [];
    this.fireballs = this.physics.add.group();
    this.miniSlimes = this.physics.add.group();
    this.doors = {};
    this.pedestals = {};
    this.bossActive = false;
    this.kingSlime = null;

    this.createLeftPath();
    this.createRightPath();
    this.createUpperPath();
    this.createDoors();
    this.createPedestals();

    // Blue torch animation
    this.time.addEvent({
      delay: 200, loop: true, callback: () => {
        this.blueTorches.forEach(t => t.setTexture(`torch_blue_${this.torchFrame}`));
        this.greenTorches.forEach(t => t.setTexture(`torch_green_${this.torchFrame}`));
      }
    });

    // Fireball collisions
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
    this.physics.add.overlap(this.fireballs, this.walls, (fb) => {
      if (fb._emitter) fb._emitter.stop();
      fb.disableBody(true, true);
      this.time.delayedCall(10, () => { if (fb) fb.destroy(); });
    });

    // Mini slime damage
    this.physics.add.overlap(this.player, this.miniSlimes, (player, ms) => {
      if (player.alpha === 1) {
        EventBus.emit('player-damage', 1);
        player.setAlpha(0.5);
        this.time.delayedCall(1000, () => player.setAlpha(1));
        const dir = new Phaser.Math.Vector2(player.x - ms.x, player.y - ms.y).normalize();
        player.setVelocity(dir.x * 200, dir.y * 200);
      }
    });
    // Fireball vs mini slimes
    this.physics.add.overlap(this.fireballs, this.miniSlimes, (obj1, obj2) => {
      let fb = (obj1 && obj1.texture && obj1.texture.key === 'fireball') ? obj1 : obj2;
      let ms = (obj1 && obj1.texture && obj1.texture.key === 'fireball') ? obj2 : obj1;

      if (!fb || !ms || !fb.active || fb._hit) return;
      fb._hit = true;
      if (ms.active) ms.destroy();
      
      if (fb._emitter) fb._emitter.stop();
      fb.disableBody(true, true);
      this.time.delayedCall(10, () => { if (fb) fb.destroy(); });
    });

    // Sword attack vs mini slimes
    const onAttackMinis = (hitbox) => {
      this.physics.overlap(hitbox, this.miniSlimes, (hit, ms) => {
        const kb = new Phaser.Math.Vector2(ms.x - this.player.x, ms.y - this.player.y).normalize();
        ms.setVelocity(kb.x * 200, kb.y * 200);
        ms.setTint(0xff0000);
        this.time.delayedCall(200, () => { if (ms.active) { ms.clearTint(); ms.destroy(); } });
      });
    };
    EventBus.on('player-attack', onAttackMinis);
    this.events.on('shutdown', () => EventBus.off('player-attack', onAttackMinis));
  }

  createLeftPath() {
    // Floor tiles (icy blue tint)
    const pathTiles = [
      {x:320,y:360},{x:320,y:392},{x:320,y:424},
      {x:288,y:360},{x:288,y:392},{x:288,y:424},
      {x:256,y:350},{x:256,y:382},{x:256,y:414},
      {x:224,y:350},{x:224,y:382},{x:224,y:414},
      {x:192,y:360},{x:192,y:392},{x:192,y:424},
      {x:160,y:360},{x:160,y:392},{x:160,y:424},
      {x:128,y:350},{x:128,y:382},{x:128,y:414},{x:128,y:446},
      {x:96,y:340},{x:96,y:372},{x:96,y:404},{x:96,y:436},{x:96,y:468},
      {x:64,y:340},{x:64,y:372},{x:64,y:404},{x:64,y:436},{x:64,y:468},
    ];
    pathTiles.forEach(t => {
      this.add.image(t.x+16, t.y+16, 'stone').setDepth(0).setTint(0x445577);
    });

    // Blue torches
    [{x:300,y:350},{x:240,y:410},{x:170,y:350},{x:100,y:350}].forEach(t => {
      const torch = this.add.image(t.x, t.y, 'torch_blue_0').setDepth(10);
      this.blueTorches.push(torch);
      const glow = this.add.graphics();
      glow.fillStyle(0x1E88E5, 0.06); glow.fillCircle(t.x, t.y, 60); glow.setDepth(4);
    });

    // Defense crystals
    [{x:260,y:370},{x:180,y:430},{x:80,y:380}].forEach(c => {
      const crystal = this.add.image(c.x, c.y, 'crystal_defense').setDepth(5);
      this.tweens.add({targets:crystal,alpha:0.5,duration:1500,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
      const glow = this.add.graphics();
      glow.fillStyle(0x4FC3F7, 0.05); glow.fillCircle(c.x, c.y, 40); glow.setDepth(4);
    });

    // Shield room - circular glow
    const roomGlow = this.add.graphics();
    roomGlow.fillStyle(0x4FC3F7, 0.04); roomGlow.fillCircle(80, 400, 80); roomGlow.setDepth(1);
  }

  createRightPath() {
    const pathTiles = [
      {x:672,y:360},{x:672,y:392},{x:672,y:424},
      {x:704,y:360},{x:704,y:392},{x:704,y:424},
      {x:736,y:350},{x:736,y:382},{x:736,y:414},
      {x:768,y:350},{x:768,y:382},{x:768,y:414},
      {x:800,y:360},{x:800,y:392},{x:800,y:424},
      {x:832,y:360},{x:832,y:392},{x:832,y:424},
      {x:864,y:340},{x:864,y:372},{x:864,y:404},{x:864,y:436},{x:864,y:468},
      {x:896,y:340},{x:896,y:372},{x:896,y:404},{x:896,y:436},{x:896,y:468},
      {x:928,y:340},{x:928,y:372},{x:928,y:404},{x:928,y:436},{x:928,y:468},
    ];
    pathTiles.forEach(t => {
      this.add.image(t.x+16, t.y+16, 'stone').setDepth(0).setTint(0x554477);
    });

    // Magic crystals
    [{x:720,y:370},{x:810,y:420},{x:920,y:380}].forEach(c => {
      const crystal = this.add.image(c.x, c.y, 'crystal_magic').setDepth(5);
      this.tweens.add({targets:crystal,alpha:0.5,duration:1200,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    });

    // Rune symbols on walls
    [{x:690,y:350},{x:750,y:430},{x:840,y:350},{x:910,y:440}].forEach(r => {
      const rune = this.add.image(r.x, r.y, 'rune_symbol').setDepth(5).setAlpha(0.6);
      this.tweens.add({targets:rune,alpha:0.2,duration:2000,yoyo:true,repeat:-1});
    });

    // Purple ambient glow
    const roomGlow = this.add.graphics();
    roomGlow.fillStyle(0xCE93D8, 0.04); roomGlow.fillCircle(920, 400, 80); roomGlow.setDepth(1);
  }

  createUpperPath() {
    // Wide corridor floor
    for (let x = 400; x < 600; x += 32) {
      for (let y = 50; y < 280; y += 32) {
        this.add.image(x+16, y+16, 'stone').setDepth(0).setTint(0x3D3D3D);
      }
    }

    // Green torches
    [{x:410,y:240},{x:590,y:240},{x:410,y:160},{x:590,y:160},{x:410,y:80},{x:590,y:80}].forEach(t => {
      const torch = this.add.image(t.x, t.y, 'torch_green_0').setDepth(10);
      this.greenTorches.push(torch);
      const glow = this.add.graphics();
      glow.fillStyle(0x4CAF50, 0.05); glow.fillCircle(t.x, t.y, 50); glow.setDepth(4);
    });

    // Slime puddles (slow effect)
    this.slimePuddles = this.physics.add.staticGroup();
    [{x:460,y:220},{x:540,y:180},{x:480,y:130},{x:520,y:90}].forEach(p => {
      const puddle = this.add.image(p.x, p.y, 'slime_puddle').setDepth(1);
      const zone = this.slimePuddles.create(p.x, p.y, null);
      zone.body.setSize(28, 10); zone.body.setOffset(-14, -5); zone.setVisible(false);
    });
    this.physics.add.overlap(this.player, this.slimePuddles, () => {
      if (this.player.speedModifier === 1) {
        this.player.speedModifier = 0.5;
        this.time.delayedCall(800, () => { this.player.speedModifier = 1; });
      }
    });

    // Decorative rocks
    [{x:420,y:200},{x:570,y:150}].forEach(r => {
      this.add.image(r.x, r.y, 'rock').setDepth(5).setTint(0x555555);
    });
  }

  createDoors() {
    // Left door (shield path)
    this.doors.shield = this.physics.add.staticImage(340, 400, 'door_locked').setDepth(15);
    this.doors.shield.body.setSize(32, 40);
    this.doors.shield._doorType = 'shield';
    this.doors.shield._open = false;
    this.physics.add.collider(this.player, this.doors.shield);

    // Right door (wand path)
    this.doors.wand = this.physics.add.staticImage(660, 400, 'door_locked').setDepth(15);
    this.doors.wand.body.setSize(32, 40);
    this.doors.wand._doorType = 'wand';
    this.doors.wand._open = false;
    this.physics.add.collider(this.player, this.doors.wand);

    // Boss door (upper path)
    this.doors.boss = this.physics.add.staticImage(500, 280, 'boss_door_locked').setDepth(15);
    this.doors.boss.body.setSize(48, 48);
    this.doors.boss._doorType = 'boss';
    this.doors.boss._open = false;
    this.physics.add.collider(this.player, this.doors.boss);
  }

  createPedestals() {
    // Shield pedestal (hidden behind door, in left room)
    this.pedestals.shield = this.physics.add.staticImage(80, 400, 'pedestal').setDepth(14);
    const shieldItem = this.add.image(80, 384, 'item_shield').setDepth(16);
    this.tweens.add({targets:shieldItem,y:380,duration:1000,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    this.pedestals.shield._item = shieldItem;
    this.pedestals.shield._collected = false;
    this.pedestals.shield._type = 'shield';

    // Wand pedestal (hidden behind door, in right room)
    this.pedestals.wand = this.physics.add.staticImage(920, 400, 'pedestal').setDepth(14);
    const wandItem = this.add.image(920, 384, 'item_wand').setDepth(16);
    this.tweens.add({targets:wandItem,y:380,duration:1000,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    this.pedestals.wand._item = wandItem;
    this.pedestals.wand._collected = false;
    this.pedestals.wand._type = 'wand';
  }

  checkDoorInteraction() {
    Object.values(this.doors).forEach(door => {
      if (door._open) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, door.x, door.y);
      if (dist < 50) {
        EventBus.emit('interact-cave-door', door._doorType);
      }
    });
  }

  openDoor(type) {
    const door = this.doors[type];
    if (!door || door._open) return;
    door._open = true;
    if (type === 'boss') {
      door.setTexture('boss_door_open');
    } else {
      door.setTexture('door_open');
    }
    door.body.enable = false;
    // Flash effect
    this.cameras.main.flash(200, 255, 255, 200);

    if (type === 'boss') {
      this.startBossFight();
    }
  }

  checkPedestalInteraction() {
    Object.values(this.pedestals).forEach(ped => {
      if (ped._collected) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, ped.x, ped.y);
      if (dist < 40) {
        ped._collected = true;
        if (ped._item) {
          this.tweens.add({targets:ped._item,alpha:0,scale:2,duration:300,onComplete:()=>ped._item.destroy()});
        }
        if (ped._type === 'shield') {
          EventBus.emit('pickup-shield');
          this.player.liftItem('shield');
        } else if (ped._type === 'wand') {
          EventBus.emit('pickup-wand');
          this.player.liftItem('wand');
        }
      }
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
    // Set velocity AFTER adding to group so group doesn't reset it
    fb.body.setVelocity(d.x * 300, d.y * 300);
    fb._life = 2000;

    // Particle trail
    const emitter = this.add.particles(0, 0, 'fireball_particle', {
      speed: 30, scale: {start:0.8,end:0}, lifespan: 300, frequency: 50, tint: 0xFFAA00
    });
    emitter.startFollow(fb);
    fb._emitter = emitter;

  }

  startBossFight() {
    this.bossActive = true;
    this.kingSlimeHP = 500;
    this.kingSlimeMaxHP = 500;
    this.bossJumpTimer = 0;
    this.bossSummonTimer = 0;
    this.bossStunned = false;

    this.kingSlime = this.physics.add.sprite(500, 120, 'king_slime', 0);
    this.kingSlime.setDepth(15);
    this.kingSlime.play('king_slime_move');
    this.kingSlime.setCollideWorldBounds(true);
    this.kingSlime.body.setSize(48, 40);
    this.kingSlime.body.setOffset(8, 20);

    // Boss collider with player
    this.physics.add.overlap(this.player, this.kingSlime, () => {
      if (this.player.alpha === 1) {
        EventBus.emit('player-damage', 2);
        this.player.setAlpha(0.5);
        this.time.delayedCall(1000, () => this.player.setAlpha(1));
        const dir = new Phaser.Math.Vector2(this.player.x - this.kingSlime.x, this.player.y - this.kingSlime.y).normalize();
        this.player.setVelocity(dir.x * 350, dir.y * 350);
      }
    });

    // Sword can hit boss
    const onBossAttack = (hitbox) => {
      if (!this.kingSlime || !this.kingSlime.active) return;
      this.physics.overlap(hitbox, this.kingSlime, () => {
        this.kingSlimeHP -= 15;
        this.kingSlime.setTint(0xffffff);
        this.time.delayedCall(100, () => { if(this.kingSlime&&this.kingSlime.active) this.kingSlime.clearTint(); });
        this.cameras.main.shake(80, 0.008);
        if (this.kingSlimeHP <= 0) this.defeatBoss();
      });
    };
    EventBus.on('player-attack', onBossAttack);
    this.events.once('shutdown', () => EventBus.off('player-attack', onBossAttack));

    // Fireball vs king slime (group-level overlap for all fireballs)
    this.physics.add.overlap(this.fireballs, this.kingSlime, (obj1, obj2) => {
      let fb = (obj1 && obj1.texture && obj1.texture.key === 'fireball') ? obj1 : obj2;
      let boss = (obj1 && obj1.texture && obj1.texture.key === 'fireball') ? obj2 : obj1;

      if (!this.kingSlime || !this.kingSlime.active) return;
      if (!fb || !fb.active || fb._hit) return; // prevent multi-hit
      fb._hit = true;
      this.kingSlimeHP -= 25;
      this.kingSlime.setTint(0xffffff);
      this.time.delayedCall(100, () => { if (this.kingSlime && this.kingSlime.active && !this.bossStunned) this.kingSlime.clearTint(); });
      this.cameras.main.shake(80, 0.008);
      if (this.kingSlimeHP <= 0) this.defeatBoss();
      
      if (fb._emitter) fb._emitter.stop();
      fb.disableBody(true, true);
      this.time.delayedCall(10, () => { if (fb) fb.destroy(); });
    });

    // Boss health bar (Phaser graphics, fixed to camera)
    this.bossHealthBar = this.add.graphics();
    this.bossHealthBar.setDepth(5000).setScrollFactor(0);
    this.bossNameText = this.add.text(0, 0, 'REY SLIME', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3
    }).setDepth(5001).setScrollFactor(0).setOrigin(0.5, 0);
  }

  updateBoss() {
    if (!this.kingSlime || !this.kingSlime.active) return;
    const time = this.time.now;

    // Chase player (skip if stunned)
    if (!this.bossStunned) {
      this.physics.moveToObject(this.kingSlime, this.player, 55);
    } else {
      this.kingSlime.setVelocity(0);
    }
    this.kingSlime.flipX = this.player.x < this.kingSlime.x;
    this.kingSlime.setDepth(this.kingSlime.y + 40);

    // Jump attack every 4s (skip if stunned)
    if (!this.bossStunned && time > this.bossJumpTimer + 4000) {
      this.bossJumpTimer = time;
      const tx = this.player.x, ty = this.player.y;
      // Warning shadow
      const shadow = this.add.ellipse(tx, ty, 50, 20, 0xff0000, 0.3).setDepth(1);
      this.kingSlime.setVelocity(0);
      this.tweens.add({
        targets: this.kingSlime, y: this.kingSlime.y - 60, duration: 400, ease: 'Power2',
        onComplete: () => {
          this.tweens.add({
            targets: this.kingSlime, x: tx, y: ty, duration: 350, ease: 'Bounce.easeIn',
            onComplete: () => {
              shadow.destroy();
              const dist = Phaser.Math.Distance.Between(tx, ty, this.player.x, this.player.y);
              if (dist < 50 && this.player.alpha === 1) {
                EventBus.emit('player-damage', 2);
                this.player.setAlpha(0.5);
                this.time.delayedCall(1000, () => this.player.setAlpha(1));
              }
              this.cameras.main.shake(150, 0.015);

              // === STUN after heavy attack ===
              this.bossStunned = true;
              this.kingSlime.setTint(0x8888FF); // blue tint = stunned
              this.kingSlime.setVelocity(0);
              this.time.delayedCall(1500, () => {
                this.bossStunned = false;
                if (this.kingSlime && this.kingSlime.active) this.kingSlime.clearTint();
              });
            }
          });
        }
      });
    }

    // Summon mini slimes every 8s
    if (time > this.bossSummonTimer + 8000) {
      this.bossSummonTimer = time;
      const activeMinions = this.miniSlimes.getChildren().filter(m => m.active).length;
      if (activeMinions < 6) {
        for (let i = 0; i < 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const mx = this.kingSlime.x + Math.cos(angle) * 80;
          const my = this.kingSlime.y + Math.sin(angle) * 80;
          const ms = this.physics.add.sprite(mx, my, 'mini_slime', 0);
          ms.play('mini_slime_move');
          ms.body.setSize(16, 12); ms.body.setOffset(4, 8);
          ms.setCollideWorldBounds(true);
          this.miniSlimes.add(ms);
          // Mini slime damage to player
          this.physics.add.overlap(this.player, ms, () => {
            if (this.player.alpha === 1) {
              EventBus.emit('player-damage', 1);
              this.player.setAlpha(0.5);
              this.time.delayedCall(1000, () => this.player.setAlpha(1));
            }
          });
        }
      }
    }
  }

  drawBossHealthBar() {
    const cam = this.cameras.main;
    const cx = cam.centerX;
    const cy = cam.centerY;
    const z = cam.zoom;
    
    const barW = 220, barH = 14;
    const drawX = -barW / 2;
    const drawY = 30 - cy;
    
    const pct = Math.max(0, this.kingSlimeHP / this.kingSlimeMaxHP);
    const color = pct > 0.5 ? 0x4CAF50 : pct > 0.25 ? 0xFFC107 : 0xF44336;

    this.bossHealthBar.clear();
    this.bossHealthBar.setPosition(cx, cy);
    this.bossHealthBar.setScale(1/z);

    // Background panel
    this.bossHealthBar.fillStyle(0x000000, 0.8);
    this.bossHealthBar.fillRoundedRect(drawX-6, drawY-6, barW+12, barH+12, 6);
    // Border
    this.bossHealthBar.lineStyle(2, 0xFFD700, 0.6);
    this.bossHealthBar.strokeRoundedRect(drawX-6, drawY-6, barW+12, barH+12, 6);
    // Bar bg
    this.bossHealthBar.fillStyle(0x333333, 0.9);
    this.bossHealthBar.fillRoundedRect(drawX, drawY, barW, barH, 4);
    // Health fill
    this.bossHealthBar.fillStyle(color, 1);
    if (barW * pct > 0) {
      this.bossHealthBar.fillRoundedRect(drawX, drawY, barW * pct, barH, 4);
    }
    
    // Name text BELOW the bar
    const textScreenY = 30 + barH + 12;
    this.bossNameText.setPosition(cx, cy + (textScreenY - cy) / z);
    this.bossNameText.setScale(1/z);
  }

  defeatBoss() {
    this.bossActive = false;
    // Explosion effect
    this.tweens.add({
      targets: this.kingSlime, alpha: 0, scale: 2, duration: 800,
      onComplete: () => {
        // Drop crown
        this.add.image(this.kingSlime.x, this.kingSlime.y, 'crown').setDepth(15);
        this.kingSlime.destroy();
        // Clean up mini slimes
        this.miniSlimes.getChildren().forEach(ms => ms.destroy());
        // Hide health bar
        if (this.bossHealthBar) this.bossHealthBar.clear();
        if (this.bossNameText) this.bossNameText.setVisible(false);
        // Victory!
        EventBus.emit('boss-defeated');
        this.cameras.main.flash(1000, 255, 215, 0);
      }
    });
  }

  update() {
    if (this.dialogActive) return;
    this.player.update();
    this.enemies.forEach(e => e.update(this.player));

    // Update inventory HUD & item in hand
    updateInventoryHUD(this);

    // Update darkness overlay (simple vignette effect)
    if (this.darkness) {
      this.darkness.clear();
      const cam = this.cameras.main;
      this.darkness.fillStyle(0x000000, 0.4);
      this.darkness.fillRect(0, 0, cam.width, cam.height);
    }

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

    const chestDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.chest.x, this.chest.y);
    if (chestDist < 50 && !this.chestOpen) {
      if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        EventBus.emit('interact-chest');
      }
    }

    // === EXPANSION: Update boss ===
    if (this.kingSlime && this.kingSlime.active && this.bossActive) {
      this.updateBoss();
    }
    // Update mini slimes
    if (this.miniSlimes) {
      this.miniSlimes.getChildren().forEach(ms => {
        if (!ms.active) return;
        this.physics.moveToObject(ms, this.player, 80);
        ms.setDepth(ms.y + 16);
      });
    }
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
    // Update boss health bar
    if (this.bossHealthBar && this.bossActive) this.drawBossHealthBar();

    // Door interactions
    if (this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.checkDoorInteraction();
      this.checkPedestalInteraction();
    }
  }
}
