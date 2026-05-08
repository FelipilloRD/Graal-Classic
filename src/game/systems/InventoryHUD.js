import Phaser from 'phaser';
import { EquipSystem } from './EquipSystem.js';
import { ItemRenderer } from './ItemRenderer.js';
import { EventBus } from '../EventBus.js';

const HUD_SLOTS = 9;
const SLOT_SIZE = 28;
const SLOT_GAP = 4;
const SLOT_BORDER = 1;

/**
 * InventoryHUD — Shared helper that all game scenes call to create and update
 * the Phaser-rendered inventory bar (fixed on camera, keyboard 1-9 + mouse).
 * Handles dynamic repositioning for RESIZE scale mode.
 */

/**
 * Sets up the inventory HUD, EquipSystem, and ItemRenderer for a scene.
 * Call this in scene.create() AFTER the player is created.
 */
export function setupInventoryHUD(scene) {
  // Systems
  scene.equipSystem = new EquipSystem(scene);
  scene.itemRenderer = new ItemRenderer(scene);
  scene.selectedSlot = -1;

  const cam = scene.cameras.main;
  const totalWidth = HUD_SLOTS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;

  // Create HUD container (fixed to camera via scrollFactor 0)
  scene.hudContainer = scene.add.container(0, 0);
  scene.hudContainer.setDepth(5000);
  scene.hudContainer.setScrollFactor(0);

  // Background panel graphics
  scene.hudPanelBg = scene.add.graphics();
  scene.hudContainer.add(scene.hudPanelBg);

  // Create slots
  scene.hudSlots = [];
  for (let i = 0; i < HUD_SLOTS; i++) {
    // Slot background
    const slotBg = scene.add.graphics();
    scene.hudContainer.add(slotBg);

    // Selected highlight (hidden by default)
    const highlight = scene.add.graphics();
    highlight.setVisible(false);
    scene.hudContainer.add(highlight);

    // Item sprite placeholder
    const itemSprite = scene.add.image(0, 0, '__DEFAULT');
    itemSprite.setVisible(false);
    scene.hudContainer.add(itemSprite);

    // Quantity text
    const qtyText = scene.add.text(0, 0, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(1, 1);
    qtyText.setVisible(false);
    scene.hudContainer.add(qtyText);

    // Slot number label
    const numLabel = scene.add.text(0, 0, `${i + 1}`, {
      fontFamily: '"Press Start 2P"',
      fontSize: '4px',
      color: '#888888'
    });
    scene.hudContainer.add(numLabel);

    // Interactive zone for mouse clicks
    const zone = scene.add.zone(0, 0, SLOT_SIZE, SLOT_SIZE);
    zone.setScrollFactor(0);
    zone.setInteractive();
    zone.setDepth(5001);
    zone.on('pointerdown', () => {
      selectSlot(scene, i);
    });

    scene.hudSlots.push({
      bg: slotBg,
      highlight,
      itemSprite,
      qtyText,
      numLabel,
      zone,
      x: 0,
      y: 0
    });
  }

  // Position all slots (initial + on resize)
  repositionHUD(scene);

  // Keyboard 1-9 for slot selection
  if (scene.input.keyboard) {
    scene.input.keyboard.on('keydown', (event) => {
      const num = parseInt(event.key);
      if (!isNaN(num) && num >= 1 && num <= 9) {
        selectSlot(scene, num - 1);
      }
    });
  }

  // Listen for inventory changes from React
  const onInventoryChanged = () => {
    if (scene.selectedSlot >= 0) {
      const items = window.currentInventory || [];
      const item = items[scene.selectedSlot];
      if (item) {
        scene.equipSystem.equip(item);
      } else {
        scene.equipSystem.unequip();
      }
    }
  };
  EventBus.on('item-pickup', onInventoryChanged);
  scene.events.on('shutdown', () => {
    EventBus.off('item-pickup', onInventoryChanged);
    if (scene.itemRenderer) scene.itemRenderer.destroy();
  });
}

/**
 * Recalculates positions for all HUD slots based on current camera dimensions.
 */
function repositionHUD(scene) {
  const cam = scene.cameras.main;
  const totalWidth = HUD_SLOTS * (SLOT_SIZE + SLOT_GAP) - SLOT_GAP;

  // Inverse the camera zoom so the HUD renders at 1x pixel scale
  scene.hudContainer.setScale(1 / cam.zoom);

  // We want to place the HUD at these exact screen pixels:
  const targetX = (cam.width - totalWidth) / 2;
  const targetY = cam.height - SLOT_SIZE - 20;

  // Convert screen pixels to Phaser's zoom-adjusted scrollFactor(0) coordinates
  // Formula: target + center * (zoom - 1)
  const startX = targetX + cam.centerX * (cam.zoom - 1);
  const startY = targetY + cam.centerY * (cam.zoom - 1);

  const panelPad = 6;

  // Redraw panel background
  scene.hudPanelBg.clear();
  scene.hudPanelBg.fillStyle(0x0a0a1e, 0.85);
  scene.hudPanelBg.fillRoundedRect(
    startX - panelPad, startY - panelPad,
    totalWidth + panelPad * 2, SLOT_SIZE + panelPad * 2, 5
  );
  scene.hudPanelBg.lineStyle(1, 0x5DB55D, 0.5);
  scene.hudPanelBg.strokeRoundedRect(
    startX - panelPad, startY - panelPad,
    totalWidth + panelPad * 2, SLOT_SIZE + panelPad * 2, 5
  );

  // Reposition each slot
  for (let i = 0; i < HUD_SLOTS; i++) {
    const slot = scene.hudSlots[i];
    const sx = startX + i * (SLOT_SIZE + SLOT_GAP);
    const sy = startY;
    slot.x = sx;
    slot.y = sy;

    // Redraw slot background
    slot.bg.clear();
    slot.bg.fillStyle(0xFFFFFF, 0.05);
    slot.bg.fillRoundedRect(sx, sy, SLOT_SIZE, SLOT_SIZE, 3);
    slot.bg.lineStyle(SLOT_BORDER, 0x5DB55D, 0.3);
    slot.bg.strokeRoundedRect(sx, sy, SLOT_SIZE, SLOT_SIZE, 3);

    // Reposition sprites
    slot.itemSprite.setPosition(sx + SLOT_SIZE / 2, sy + SLOT_SIZE / 2);
    slot.itemSprite.setDisplaySize(SLOT_SIZE - 8, SLOT_SIZE - 8);
    slot.qtyText.setPosition(sx + SLOT_SIZE - 3, sy + SLOT_SIZE - 3);
    slot.numLabel.setPosition(sx + 2, sy + 1);
    slot.zone.setPosition(sx + SLOT_SIZE / 2, sy + SLOT_SIZE / 2);
    slot.zone.setSize(SLOT_SIZE, SLOT_SIZE);

    // Re-apply highlight if this is the selected slot
    if (scene.selectedSlot === i) {
      slot.highlight.clear();
      slot.highlight.fillStyle(0xFFD700, 0.1);
      slot.highlight.fillRoundedRect(sx - 2, sy - 2, SLOT_SIZE + 4, SLOT_SIZE + 4, 4);
      slot.highlight.lineStyle(2, 0xFFD700, 1);
      slot.highlight.strokeRoundedRect(sx, sy, SLOT_SIZE, SLOT_SIZE, 3);
    }
  }

  scene._lastHudW = cam.width;
  scene._lastHudH = cam.height;
}

/**
 * Selects a slot by index (0-8). Handles equip/unequip,
 * visual feedback (golden border, glow, animation), and sound.
 */
function selectSlot(scene, index) {
  if (index < 0 || index >= HUD_SLOTS) return;

  const prevSlot = scene.selectedSlot;
  scene.selectedSlot = index;

  // Clear previous slot highlight
  if (prevSlot >= 0 && prevSlot < scene.hudSlots.length) {
    const prev = scene.hudSlots[prevSlot];
    prev.highlight.setVisible(false);
  }

  // Apply new highlight
  const slot = scene.hudSlots[index];

  // Golden border + glow
  slot.highlight.clear();
  slot.highlight.fillStyle(0xFFD700, 0.1);
  slot.highlight.fillRoundedRect(slot.x - 2, slot.y - 2, SLOT_SIZE + 4, SLOT_SIZE + 4, 4);
  slot.highlight.lineStyle(2, 0xFFD700, 1);
  slot.highlight.strokeRoundedRect(slot.x, slot.y, SLOT_SIZE, SLOT_SIZE, 3);
  slot.highlight.setVisible(true);

  // Scale animation
  if (scene.tweens) {
    const targets = [slot.itemSprite, slot.qtyText, slot.highlight];
    scene.tweens.add({
      targets: targets.filter(t => t && t.active),
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 100,
      yoyo: true,
      ease: 'Power1'
    });
  }

  // Equip/unequip based on slot content
  const items = window.currentInventory || [];
  const item = items[index];
  if (item) {
    scene.equipSystem.equip(item);
  } else {
    scene.equipSystem.unequip();
  }

  // Sound feedback via Web Audio API
  playSlotSound(index);
}

/**
 * Plays a short tone when changing slots using Web Audio API.
 */
function playSlotSound(index) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 440 + (index * 30);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Audio not available, silently ignore
  }
}

/**
 * Updates the inventory HUD visuals and ItemRenderer each frame.
 * Call this in the scene's update() method.
 */
export function updateInventoryHUD(scene) {
  if (!scene.hudSlots || !scene.player) return;

  // Reposition HUD if camera/window size changed
  const cam = scene.cameras.main;
  if (scene._lastHudW !== cam.width || scene._lastHudH !== cam.height) {
    repositionHUD(scene);
  }

  const items = window.currentInventory || [];

  // Update each slot's visual
  for (let i = 0; i < HUD_SLOTS; i++) {
    const slot = scene.hudSlots[i];
    const item = items[i];

    if (item) {
      const texKey = `item_${item.id}`;
      if (scene.textures.exists(texKey)) {
        slot.itemSprite.setTexture(texKey);
        slot.itemSprite.setVisible(true);
        slot.itemSprite.setDisplaySize(SLOT_SIZE - 14, SLOT_SIZE - 14);
      } else {
        slot.itemSprite.setVisible(false);
      }

      if (item.qty > 1) {
        slot.qtyText.setText(`${item.qty}`);
        slot.qtyText.setVisible(true);
      } else {
        slot.qtyText.setVisible(false);
      }
    } else {
      slot.itemSprite.setVisible(false);
      slot.qtyText.setVisible(false);
    }
  }

  // Update ItemRenderer (item in hand)
  if (scene.itemRenderer && scene.equipSystem) {
    scene.itemRenderer.update(scene.player, scene.equipSystem.getEquipped());
  }
}
