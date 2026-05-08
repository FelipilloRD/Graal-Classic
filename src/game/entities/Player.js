import Phaser from 'phaser';
import { EventBus } from '../EventBus.js';
import { SaveSystem } from '../systems/SaveSystem.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player_tex', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.speed = 160;
    this.runSpeed = 260;
    this.direction = 'down';
    this.isRunning = false;
    this.isRunning = false;
    this.liftedItem = null;
    this.frozen = false;
    this.isAttacking = false;
    this.speedModifier = 1;

    // Hitbox only at feet
    this.body.setSize(16, 12);
    this.body.setOffset(8, 36);
    this.setCollideWorldBounds(true);
    this.setDepth(10);

    // Controls
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = scene.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
        interact: Phaser.Input.Keyboard.KeyCodes.E,
        attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      });
    }

    // Dust particles for running
    this.dustEmitter = scene.add.particles(0, 0, 'dirt', {
      speed: { min: 10, max: 30 },
      scale: { start: 0.3, end: 0 },
      lifespan: 400,
      alpha: { start: 0.5, end: 0 },
      frequency: -1,
      quantity: 2,
    });
  }

  freeze() { this.frozen = true; this.setVelocity(0); }
  unfreeze() { this.frozen = false; }

  liftItem(itemKey) {
    this.liftedItem = itemKey;
    if (this.liftSprite) this.liftSprite.destroy();
    this.liftSprite = this.scene.add.image(this.x, this.y - 40, `item_${itemKey}`);
    this.liftSprite.setDepth(15).setScale(2);
    this.scene.tweens.add({
      targets: this.liftSprite, y: this.y - 48, duration: 300,
      yoyo: true, ease: 'Bounce.easeOut',
      onComplete: () => {
        if (this.liftSprite) { this.liftSprite.destroy(); this.liftSprite = null; }
        this.liftedItem = null;
      }
    });
  }

  swingSword() {
    // Only allow attacking if a sword is actively equipped
    const equipped = this.scene.equipSystem ? this.scene.equipSystem.getEquipped() : null;
    if (!equipped || equipped.id !== 'sword') return;

    this.isAttacking = true;
    this.setVelocity(0);

    // Create slash effect
    let sx = this.x, sy = this.y;
    let angle = 0;
    if (this.direction === 'up') { sy -= 24; angle = -90; }
    else if (this.direction === 'down') { sy += 24; angle = 90; }
    else if (this.direction === 'left') { sx -= 24; angle = 180; }
    else if (this.direction === 'right') { sx += 24; angle = 0; }

    const slash = this.scene.add.image(sx, sy, 'slash').setDepth(this.y + 40);
    slash.setAngle(angle);

    // Create a temporary physics zone for the attack
    const hitbox = this.scene.add.zone(sx, sy, 32, 32);
    this.scene.physics.add.existing(hitbox);
    hitbox.body.setAllowGravity(false);
    
    // Tell the scene about the attack so it can check collisions
    EventBus.emit('player-attack', hitbox);

    this.scene.tweens.add({
      targets: slash,
      angle: angle + 90,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        slash.destroy();
        hitbox.destroy();
        this.isAttacking = false;
      }
    });
  }

  update() {
    if (this.frozen || this.isAttacking || !this.cursors || !this.wasd) {
      if (!this.isAttacking) this.setVelocity(0);
      if (this.anims && this.anims.isPlaying && this.anims.currentAnim &&
          this.anims.currentAnim.key.includes('walk')) {
        this.play(`player_tex_idle_${this.direction}`, true);
      }
      return;
    }

    if (this.wasd.attack && Phaser.Input.Keyboard.JustDown(this.wasd.attack)) {
      // === EXPANSION: Check if wand is equipped for fireball ===
      const equipped = this.scene.equipSystem ? this.scene.equipSystem.getEquipped() : null;
      if (equipped && equipped.id === 'wand') {
        EventBus.emit('player-fireball', this.direction);
        return;
      }
      this.swingSword();
      return;
    }

    this.setVelocity(0);
    this.isRunning = this.wasd.shift.isDown;
    const spd = (this.isRunning ? this.runSpeed : this.speed) * this.speedModifier;
    let moving = false;

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.setVelocityX(-spd); this.direction = 'left'; moving = true;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.setVelocityX(spd); this.direction = 'right'; moving = true;
    }
    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      this.setVelocityY(-spd); this.direction = 'up'; moving = true;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      this.setVelocityY(spd); this.direction = 'down'; moving = true;
    }

    // Normalize diagonal
    if (this.body.velocity.length() > 0) {
      this.body.velocity.normalize().scale(spd);
    }

    // Animations
    if (moving) {
      this.play(`player_tex_walk_${this.direction}`, true);
      // Running dust
      if (this.isRunning && this.dustEmitter) {
        this.dustEmitter.setPosition(this.x, this.y + 20);
        this.dustEmitter.explode(2);
      }
    } else {
      this.play(`player_tex_idle_${this.direction}`, true);
    }

    // Lifted item follows
    if (this.liftSprite) {
      this.liftSprite.setPosition(this.x, this.y - 40);
    }

    // Emit position to React
    EventBus.emit('player-moved', { x: Math.floor(this.x), y: Math.floor(this.y) });

    // Dynamic depth
    this.setDepth(this.y + 36);
  }
}
