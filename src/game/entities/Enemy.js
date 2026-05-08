import Phaser from 'phaser';
import { EventBus } from '../EventBus.js';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey, config) {
    super(scene, x, y, spriteKey, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.health = config.health || 3;
    this.speed = config.speed || 40;
    this.state = 'wander'; // 'wander', 'chase', 'hurt'
    this.wanderTimer = 0;
    this.targetPos = new Phaser.Math.Vector2(x, y);

    this.body.setSize(20, 16);
    this.body.setOffset(6, 16);
    this.setCollideWorldBounds(true);
    this.setBounce(0.5);

    if (scene.anims.exists(`${spriteKey}_move`)) {
      this.play(`${spriteKey}_move`, true);
    }
  }

  takeDamage(amount, knockbackDir) {
    if (this.state === 'hurt') return;
    this.health -= amount;
    this.state = 'hurt';
    this.setTint(0xff0000);

    // Knockback
    this.setVelocity(knockbackDir.x * 200, knockbackDir.y * 200);

    if (this.health <= 0) {
      this.die();
      return;
    }

    this.scene.time.delayedCall(300, () => {
      this.clearTint();
      this.state = 'chase'; // aggro
    });
  }

  die() {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => {
        // Drop loot chance
        if (Math.random() > 0.5) {
          const loot = Math.random() > 0.3 ? 'coin' : 'gem';
          const drop = this.scene.physics.add.image(this.x, this.y, `item_${loot}`).setDepth(5).setScale(1);
          drop.body.setSize(16, 16);
          drop.itemId = loot;
          this.scene.pickups.push(drop);
          this.scene.tweens.add({ targets: drop, y: this.y - 4, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        this.destroy();
      }
    });
  }

  update(player) {
    if (!this.active || this.state === 'hurt') return;
    this.setDepth(this.y + 16);

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (dist < 150) {
      this.state = 'chase';
    } else {
      this.state = 'wander';
    }

    if (this.state === 'chase') {
      this.scene.physics.moveToObject(this, player, this.speed);
    } else if (this.state === 'wander') {
      if (this.scene.time.now > this.wanderTimer) {
        this.targetPos.x = this.x + Phaser.Math.Between(-50, 50);
        this.targetPos.y = this.y + Phaser.Math.Between(-50, 50);
        this.wanderTimer = this.scene.time.now + Phaser.Math.Between(1000, 3000);
      }
      if (Phaser.Math.Distance.Between(this.x, this.y, this.targetPos.x, this.targetPos.y) > 10) {
        this.scene.physics.moveToObject(this, this.targetPos, this.speed / 2);
      } else {
        this.setVelocity(0);
      }
    }
  }
}
