/**
 * EquipSystem — Centralizes all item equipping/unequipping logic.
 * Only equip() and unequip() should be used to change equipped item.
 */
export class EquipSystem {
  constructor(scene) {
    this.scene = scene;
    this.equippedItem = null;
  }

  equip(item) {
    if (!item) return;
    this.equippedItem = item;
    this.scene.events.emit('itemEquipped', item);
  }

  unequip() {
    this.equippedItem = null;
    this.scene.events.emit('itemUnequipped');
  }

  getEquipped() {
    return this.equippedItem;
  }
}
