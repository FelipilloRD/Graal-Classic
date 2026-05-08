/**
 * ItemRenderer — Renders the equipped item sprite next to the player character.
 * Also renders shield on the opposite arm if shield is in inventory.
 * update() must be called every frame in the scene's update() method.
 */
export class ItemRenderer {
  constructor(scene) {
    this.scene = scene;
    this.sprite = null;
    this.shieldSprite = null;
    this.currentKey = null;
  }

  update(player, equippedItem) {
    // === Main hand item (sword or wand) ===
    if (!equippedItem) {
      if (this.sprite) {
        this.sprite.setVisible(false);
      }
      this.currentKey = null;
    } else {
      const textureKey = `item_${equippedItem.id}`;

      // Create sprite on first use or if it was destroyed
      if (!this.sprite || !this.sprite.active) {
        this.sprite = this.scene.add.image(0, 0, textureKey);
        this.sprite.setDepth(player.depth + 1);
        this.sprite.setScale(0.8);
        this.currentKey = textureKey;
      }

      // Change texture if equipped item changed
      if (this.currentKey !== textureKey) {
        if (this.scene.textures.exists(textureKey)) {
          this.sprite.setTexture(textureKey);
        }
        this.currentKey = textureKey;
      }

      this.sprite.setVisible(true);

      const offsets = {
        down:  { x: 10,  y: 10,  flipX: false },
        up:    { x: -10, y: -10, flipX: false },
        left:  { x: -14, y: 4,   flipX: true  },
        right: { x: 14,  y: 4,   flipX: false },
      };

      const o = offsets[player.direction] || offsets.down;
      this.sprite.setPosition(player.x + o.x, player.y + o.y);
      this.sprite.setFlipX(o.flipX);
      this.sprite.setDepth(player.depth + 1);
    }

    // === EXPANSION: Shield on opposite arm ===
    const hasShield = (window.currentInventory || []).some(i => i && i.id === 'shield');
    if (hasShield) {
      if (!this.shieldSprite || !this.shieldSprite.active) {
        this.shieldSprite = this.scene.add.image(0, 0, 'item_shield');
        this.shieldSprite.setScale(0.7);
      }
      this.shieldSprite.setVisible(true);

      // Opposite arm offsets (mirrored from main hand)
      const shieldOffsets = {
        down:  { x: -10, y: 8,   flipX: true  },
        up:    { x: 10,  y: -8,  flipX: true  },
        left:  { x: -8,  y: 6,   flipX: false },
        right: { x: 8,   y: 6,   flipX: true  },
      };

      const so = shieldOffsets[player.direction] || shieldOffsets.down;
      this.shieldSprite.setPosition(player.x + so.x, player.y + so.y);
      this.shieldSprite.setFlipX(so.flipX);
      this.shieldSprite.setDepth(player.depth + 1);
    } else {
      if (this.shieldSprite) {
        this.shieldSprite.setVisible(false);
      }
    }
  }

  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    if (this.shieldSprite) {
      this.shieldSprite.destroy();
      this.shieldSprite = null;
    }
  }
}

