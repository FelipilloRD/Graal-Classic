import Phaser from 'phaser';

export class NPC extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spriteKey, config) {
    super(scene, x, y, spriteKey, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.npcName = config.name;
    this.npcId = config.id;
    this.dialogLines = config.dialog || ['...'];
    this.direction = config.direction || 'down';

    this.setImmovable(true);
    this.body.setSize(16, 12);
    this.body.setOffset(8, 36);
    this.setDepth(y + 36);

    // Play idle animation
    const animKey = `${spriteKey}_idle_${this.direction}`;
    if (scene.anims.exists(animKey)) {
      this.play(animKey, true);
    }

    // Chat bubble (hidden by default)
    this.bubble = scene.add.image(x, y - 36, 'chat_bubble').setDepth(20).setVisible(false).setScale(1);

    // Name tag
    this.nameTag = scene.add.text(x, y - 28, config.name, {
      fontFamily: '"Press Start 2P"', fontSize: '6px', color: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 2, y: 1 }
    }).setOrigin(0.5).setDepth(20);
  }

  showBubble() { this.bubble.setVisible(true); }
  hideBubble() { this.bubble.setVisible(false); }

  updatePosition() {
    this.bubble.setPosition(this.x, this.y - 36);
    this.nameTag.setPosition(this.x, this.y - 28);
  }

  getDialog() {
    return { npcName: this.npcName, npcId: this.npcId, lines: this.dialogLines };
  }
}
