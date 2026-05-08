// SpriteFactory.js — Generates all 10 item textures using Graphics.generateTexture()
// Each texture key uses 'item_' prefix for compatibility with existing pickup code.

function createHerbTexture(scene) {
  const g = scene.add.graphics();
  // Tallo central
  g.fillStyle(0x228B22); g.fillRect(9, 8, 2, 8);
  // Hoja izquierda
  g.fillStyle(0x32CD32); g.fillTriangle(10, 8, 2, 4, 6, 12);
  // Hoja derecha
  g.fillStyle(0x32CD32); g.fillTriangle(10, 8, 18, 4, 14, 12);
  // Hoja central (más clara)
  g.fillStyle(0x7CFC00); g.fillTriangle(10, 2, 6, 10, 14, 10);
  // Venas de hojas
  g.lineStyle(1, 0x006400);
  g.lineBetween(10, 8, 5, 5);
  g.lineBetween(10, 8, 15, 5);
  g.lineBetween(10, 8, 10, 3);

  g.generateTexture('item_herb', 20, 18);
  g.destroy();
}

function createKeyTexture(scene) {
  const g = scene.add.graphics();
  // Aro exterior
  g.lineStyle(2, 0xFFD700);
  g.strokeCircle(6, 6, 5);
  // Relleno aro
  g.fillStyle(0xDAA520); g.fillCircle(6, 6, 4);
  // Hueco interior
  g.fillStyle(0x1a1a2e); g.fillCircle(6, 6, 2);
  // Tallo
  g.fillStyle(0xFFD700); g.fillRect(10, 5, 12, 3);
  // Diente 1
  g.fillRect(17, 8, 2, 4);
  // Diente 2
  g.fillRect(21, 8, 2, 3);
  // Brillo
  g.fillStyle(0xFFFACD); g.fillRect(11, 5, 2, 1);

  g.generateTexture('item_key', 26, 14);
  g.destroy();
}

function createFishTexture(scene) {
  const g = scene.add.graphics();
  // Cola (triángulo)
  g.fillStyle(0xFF6347);
  g.fillTriangle(0, 4, 0, 14, 7, 9);
  // Cuerpo (elipse simulada)
  g.fillStyle(0xFF7F7F); g.fillEllipse(14, 9, 18, 12);
  // Vientre más claro
  g.fillStyle(0xFFB6C1); g.fillEllipse(14, 11, 14, 6);
  // Aleta dorsal
  g.fillStyle(0xFF4500); g.fillTriangle(10, 3, 18, 3, 14, 7);
  // Ojo
  g.fillStyle(0x000000); g.fillCircle(20, 8, 2);
  g.fillStyle(0xFFFFFF); g.fillCircle(21, 7, 1);
  // Escamas
  g.lineStyle(1, 0xFF4500, 0.5);
  g.strokeCircle(13, 9, 3);
  g.strokeCircle(16, 9, 3);

  g.generateTexture('item_fish', 26, 18);
  g.destroy();
}

function createGemTexture(scene) {
  const g = scene.add.graphics();
  // Sombra base
  g.fillStyle(0x0000AA, 0.3); g.fillEllipse(10, 19, 16, 4);
  // Faceta inferior (más oscura)
  g.fillStyle(0x1E90FF);
  g.fillTriangle(4, 12, 16, 12, 10, 20);
  // Faceta izquierda
  g.fillStyle(0x4169E1);
  g.fillTriangle(1, 7, 4, 12, 10, 20);
  // Faceta derecha
  g.fillStyle(0x00BFFF);
  g.fillTriangle(19, 7, 16, 12, 10, 20);
  // Faceta central superior
  g.fillStyle(0x87CEEB);
  g.fillTriangle(4, 12, 16, 12, 10, 4);
  // Corona superior
  g.fillStyle(0x4169E1);
  g.fillTriangle(1, 7, 10, 4, 4, 12);
  g.fillTriangle(19, 7, 10, 4, 16, 12);
  // Brillo
  g.fillStyle(0xFFFFFF, 0.9);
  g.fillTriangle(7, 6, 11, 4, 8, 10);

  g.generateTexture('item_gem', 20, 22);
  g.destroy();
}

function createMushroomTexture(scene) {
  const g = scene.add.graphics();
  // Tallo
  g.fillStyle(0xF5F5DC); g.fillRect(7, 13, 8, 7);
  g.fillStyle(0xE8E8D0); g.fillRect(8, 14, 3, 5);
  // Sombra bajo sombrero
  g.fillStyle(0xCC0000, 0.3); g.fillEllipse(11, 14, 18, 4);
  // Sombrero (rojo)
  g.fillStyle(0xDC143C); g.fillEllipse(11, 9, 20, 14);
  // Manchas blancas
  g.fillStyle(0xFFFFFF);
  g.fillCircle(8, 7, 2.5);
  g.fillCircle(14, 6, 2);
  g.fillCircle(11, 11, 1.5);
  g.fillCircle(5, 10, 1.5);
  // Brillo sombrero
  g.fillStyle(0xFF6B6B); g.fillEllipse(8, 6, 5, 3);

  g.generateTexture('item_mushroom', 22, 20);
  g.destroy();
}

function createAppleTexture(scene) {
  const g = scene.add.graphics();
  // Hoja
  g.fillStyle(0x228B22); g.fillEllipse(13, 3, 8, 5);
  g.lineStyle(1, 0x006400); g.lineBetween(10, 3, 16, 3);
  // Tallo
  g.lineStyle(2, 0x8B4513); g.lineBetween(10, 5, 10, 2);
  // Cuerpo manzana
  g.fillStyle(0xDC143C); g.fillCircle(10, 12, 9);
  // Hendidura superior
  g.fillStyle(0xAA0000); g.fillEllipse(10, 4, 4, 3);
  // Brillo
  g.fillStyle(0xFF6B6B); g.fillEllipse(7, 8, 4, 5);
  g.fillStyle(0xFFAAAA, 0.6); g.fillCircle(6, 7, 2);
  // Base más oscura
  g.fillStyle(0xAA0000); g.fillEllipse(10, 19, 10, 4);

  g.generateTexture('item_apple', 22, 22);
  g.destroy();
}

function createCoinTexture(scene) {
  const g = scene.add.graphics();
  // Sombra
  g.fillStyle(0x886600, 0.4); g.fillEllipse(10, 17, 16, 5);
  // Canto de la moneda (grosor 3D)
  g.fillStyle(0xB8860B); g.fillEllipse(11, 10, 18, 18);
  // Cara principal
  g.fillStyle(0xFFD700); g.fillCircle(10, 10, 8);
  // Símbolo central
  g.fillStyle(0xDAA520);
  g.fillRect(9, 5, 2, 10);
  g.fillRect(6, 7, 8, 2);
  g.fillRect(6, 11, 8, 2);
  // Borde grabado
  g.lineStyle(1, 0xDAA520); g.strokeCircle(10, 10, 7);
  // Brillo
  g.fillStyle(0xFFFACD, 0.8); g.fillEllipse(7, 7, 4, 3);

  g.generateTexture('item_coin', 20, 20);
  g.destroy();
}

function createPotionTexture(scene) {
  const g = scene.add.graphics();
  // Tapón de corcho
  g.fillStyle(0x8B6914); g.fillRect(6, 0, 6, 4);
  g.fillStyle(0xA0784A); g.fillRect(7, 1, 2, 2);
  // Cuello del frasco
  g.fillStyle(0x88BBCC); g.fillRect(5, 4, 8, 4);
  // Cuerpo (líquido curativo rojo/rosa)
  g.fillStyle(0xFF1493); g.fillEllipse(9, 16, 16, 16);
  // Líquido interior
  g.fillStyle(0xFF69B4); g.fillEllipse(9, 16, 12, 12);
  // Burbujas
  g.fillStyle(0xFFB6C1, 0.8);
  g.fillCircle(7, 15, 1.5);
  g.fillCircle(11, 18, 1);
  g.fillCircle(8, 19, 1);
  // Vidrio / reflejo
  g.fillStyle(0xFFFFFF, 0.5); g.fillEllipse(6, 13, 3, 6);
  // Base
  g.fillStyle(0xCC0066); g.fillEllipse(9, 22, 14, 4);

  g.generateTexture('item_potion', 18, 25);
  g.destroy();
}

function createSwordTexture(scene) {
  const g = scene.add.graphics();
  // Sombra hoja
  g.fillStyle(0x505050); g.fillRect(8, 1, 2, 22);
  // Hoja principal (plateada)
  g.fillStyle(0xC0C0C0); g.fillRect(7, 1, 4, 22);
  // Filo brillante (línea central)
  g.fillStyle(0xF0F0F0); g.fillRect(8, 1, 2, 22);
  // Punta de la hoja
  g.fillStyle(0xC0C0C0);
  g.fillTriangle(7, 1, 11, 1, 9, 0);
  // Guarda (dorada, horizontal)
  g.fillStyle(0xB8860B); g.fillRect(3, 23, 15, 4);
  g.fillStyle(0xFFD700); g.fillRect(4, 24, 13, 2);
  // Mango
  g.fillStyle(0x5C3A1E); g.fillRect(6, 27, 7, 9);
  // Grip (envoltura)
  g.fillStyle(0x8B4513);
  g.fillRect(6, 29, 7, 1);
  g.fillRect(6, 31, 7, 1);
  g.fillRect(6, 33, 7, 1);
  // Pomo (redondeado dorado)
  g.fillStyle(0xDAA520); g.fillEllipse(9, 37, 10, 5);
  g.fillStyle(0xFFD700); g.fillEllipse(9, 36, 7, 3);

  g.generateTexture('item_sword', 19, 39);
  g.destroy();
}

function createScrollTexture(scene) {
  const g = scene.add.graphics();
  // Rodillo superior
  g.fillStyle(0x8B4513); g.fillEllipse(10, 3, 18, 6);
  g.fillStyle(0xA0522D); g.fillEllipse(10, 2, 14, 4);
  // Cuerpo del pergamino
  g.fillStyle(0xF5DEB3); g.fillRect(2, 3, 16, 18);
  // Líneas de texto (simulado)
  g.fillStyle(0x8B7355);
  g.fillRect(4, 7, 12, 1);
  g.fillRect(4, 10, 10, 1);
  g.fillRect(4, 13, 12, 1);
  g.fillRect(4, 16, 8, 1);
  // Símbolo mágico central
  g.fillStyle(0x9400D3, 0.7);
  g.fillCircle(10, 12, 3);
  g.lineStyle(1, 0x9400D3);
  g.lineBetween(10, 9, 10, 15);
  g.lineBetween(7, 12, 13, 12);
  // Rodillo inferior
  g.fillStyle(0x8B4513); g.fillEllipse(10, 21, 18, 6);
  g.fillStyle(0xA0522D); g.fillEllipse(10, 22, 14, 4);
  // Bordes envejecidos
  g.fillStyle(0xDEB887, 0.5);
  g.fillRect(2, 3, 2, 18);
  g.fillRect(16, 3, 2, 18);

  g.generateTexture('item_scroll', 20, 26);
  g.destroy();
}

// === EXPANSION TEXTURES ===

function createShieldTexture(scene) {
  const g = scene.add.graphics();
  // Shield body (rounded kite shape)
  g.fillStyle(0x4682B4); // steel blue
  g.fillTriangle(10, 0, 0, 8, 10, 22);
  g.fillTriangle(10, 0, 20, 8, 10, 22);
  // Inner face lighter
  g.fillStyle(0x6CA6CD);
  g.fillTriangle(10, 2, 3, 8, 10, 18);
  g.fillTriangle(10, 2, 17, 8, 10, 18);
  // Cross emblem (silver)
  g.fillStyle(0xE0E0E0);
  g.fillRect(8, 4, 4, 14);
  g.fillRect(4, 8, 12, 4);
  // Border outline
  g.lineStyle(1, 0x2F4F6F);
  g.lineBetween(10, 0, 0, 8);
  g.lineBetween(0, 8, 10, 22);
  g.lineBetween(10, 22, 20, 8);
  g.lineBetween(20, 8, 10, 0);
  // Top shine
  g.fillStyle(0xADD8E6, 0.6);
  g.fillTriangle(7, 3, 13, 3, 10, 7);
  // Rivets
  g.fillStyle(0xFFD700);
  g.fillCircle(10, 2, 1.5);
  g.fillCircle(3, 9, 1);
  g.fillCircle(17, 9, 1);
  g.fillCircle(10, 19, 1);
  g.generateTexture('item_shield', 20, 22);
  g.destroy();
}

function createWandTexture(scene) {
  const g = scene.add.graphics();
  // Wand shaft (brown)
  g.fillStyle(0x6B3A2A);
  g.fillRect(6, 10, 4, 18);
  // Grip wrapping
  g.fillStyle(0x8B5A4A);
  g.fillRect(6, 14, 4, 1);
  g.fillRect(6, 17, 4, 1);
  g.fillRect(6, 20, 4, 1);
  // Gem holder (gold)
  g.fillStyle(0xDAA520);
  g.fillRect(5, 7, 6, 4);
  // Purple gem
  g.fillStyle(0x9B30FF);
  g.fillCircle(8, 5, 4);
  // Gem inner shine
  g.fillStyle(0xDA70D6, 0.7);
  g.fillCircle(7, 4, 2);
  // Sparkle dots around gem
  g.fillStyle(0xFFFFFF, 0.8);
  g.fillRect(3, 2, 1, 1);
  g.fillRect(12, 3, 1, 1);
  g.fillRect(8, 0, 1, 1);
  // Tip bottom pommel
  g.fillStyle(0xDAA520);
  g.fillCircle(8, 28, 2);
  g.generateTexture('item_wand', 16, 30);
  g.destroy();
}

function createFireballTexture(scene) {
  const g = scene.add.graphics();
  // Outer glow
  g.fillStyle(0xFF4500, 0.5);
  g.fillCircle(6, 6, 6);
  // Core
  g.fillStyle(0xFF6600);
  g.fillCircle(6, 6, 4);
  // Hot center
  g.fillStyle(0xFFCC00);
  g.fillCircle(6, 6, 2);
  // White hot spot
  g.fillStyle(0xFFFFFF, 0.8);
  g.fillCircle(5, 5, 1);
  g.generateTexture('fireball', 12, 12);
  g.destroy();
}

function createFireballParticleTexture(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0xFFA500);
  g.fillRect(0, 0, 4, 4);
  g.fillStyle(0xFFFF00, 0.6);
  g.fillRect(1, 1, 2, 2);
  g.generateTexture('fireball_particle', 4, 4);
  g.destroy();
}

function createDoorLockedTexture(scene) {
  const g = scene.add.graphics();
  // Stone frame
  g.fillStyle(0x555566);
  g.fillRect(0, 0, 32, 40);
  // Door wood
  g.fillStyle(0x4E3400);
  g.fillRect(4, 4, 24, 32);
  // Planks
  g.fillStyle(0x5C3A1E);
  g.fillRect(4, 4, 11, 32);
  g.fillRect(17, 4, 11, 32);
  // Iron bands
  g.fillStyle(0x777788);
  g.fillRect(4, 10, 24, 2);
  g.fillRect(4, 24, 24, 2);
  // Lock
  g.fillStyle(0xFFD700);
  g.fillCircle(16, 20, 3);
  g.fillStyle(0x1a1a2e);
  g.fillCircle(16, 20, 1);
  // Keyhole
  g.fillRect(15, 20, 2, 4);
  g.generateTexture('door_locked', 32, 40);
  g.destroy();
}

function createDoorOpenTexture(scene) {
  const g = scene.add.graphics();
  // Stone frame
  g.fillStyle(0x555566);
  g.fillRect(0, 0, 32, 40);
  // Dark opening
  g.fillStyle(0x0a0a14);
  g.fillRect(4, 4, 24, 32);
  // Depth shading
  g.fillStyle(0x111122, 0.5);
  g.fillRect(4, 4, 4, 32);
  g.generateTexture('door_open', 32, 40);
  g.destroy();
}

function createBossDoorLockedTexture(scene) {
  const g = scene.add.graphics();
  // Large stone frame
  g.fillStyle(0x444455);
  g.fillRect(0, 0, 48, 48);
  // Door face
  g.fillStyle(0x3D2B1F);
  g.fillRect(4, 4, 40, 40);
  // Iron reinforcements
  g.fillStyle(0x666677);
  g.fillRect(4, 14, 40, 3);
  g.fillRect(4, 30, 40, 3);
  g.fillRect(22, 4, 4, 40);
  // Gem slots (empty)
  g.fillStyle(0x333344);
  g.fillCircle(14, 22, 4);
  g.fillCircle(34, 22, 4);
  // Slot borders
  g.lineStyle(1, 0x888899);
  g.strokeCircle(14, 22, 4);
  g.strokeCircle(34, 22, 4);
  // Skull decoration
  g.fillStyle(0x999999);
  g.fillCircle(24, 38, 3);
  g.fillStyle(0x1a1a2e);
  g.fillRect(22, 37, 2, 2);
  g.fillRect(25, 37, 2, 2);
  g.generateTexture('boss_door_locked', 48, 48);
  g.destroy();
}

function createBossDoorOpenTexture(scene) {
  const g = scene.add.graphics();
  // Frame
  g.fillStyle(0x444455);
  g.fillRect(0, 0, 48, 48);
  // Dark opening
  g.fillStyle(0x0a0a14);
  g.fillRect(4, 4, 40, 40);
  // Gems now glow
  g.fillStyle(0x4FC3F7);
  g.fillCircle(14, 22, 4);
  g.fillStyle(0xCE93D8);
  g.fillCircle(34, 22, 4);
  // Depth shading
  g.fillStyle(0x111122, 0.5);
  g.fillRect(4, 4, 6, 40);
  g.generateTexture('boss_door_open', 48, 48);
  g.destroy();
}

function createPedestalTexture(scene) {
  const g = scene.add.graphics();
  // Base
  g.fillStyle(0x777788);
  g.fillRect(2, 14, 20, 6);
  // Pillar
  g.fillStyle(0x888899);
  g.fillRect(6, 4, 12, 12);
  // Top surface
  g.fillStyle(0x999AAA);
  g.fillRect(4, 2, 16, 4);
  // Highlight
  g.fillStyle(0xBBBBCC, 0.5);
  g.fillRect(7, 5, 4, 8);
  // Rune marks
  g.fillStyle(0x5DB55D, 0.4);
  g.fillRect(8, 8, 8, 1);
  g.fillRect(11, 6, 2, 5);
  g.generateTexture('pedestal', 24, 20);
  g.destroy();
}

function createCrystalDefenseTexture(scene) {
  const g = scene.add.graphics();
  // Crystal body (icy blue)
  g.fillStyle(0x4FC3F7);
  g.beginPath();
  g.moveTo(8, 0); g.lineTo(14, 16); g.lineTo(2, 16);
  g.closePath(); g.fill();
  // Inner shine
  g.fillStyle(0xB3E5FC, 0.6);
  g.fillRect(6, 4, 3, 8);
  // Glow base
  g.fillStyle(0x4FC3F7, 0.3);
  g.fillEllipse(8, 20, 14, 6);
  g.generateTexture('crystal_defense', 16, 24);
  g.destroy();
}

function createCrystalMagicTexture(scene) {
  const g = scene.add.graphics();
  // Crystal body (magic purple)
  g.fillStyle(0xCE93D8);
  g.beginPath();
  g.moveTo(8, 0); g.lineTo(14, 16); g.lineTo(2, 16);
  g.closePath(); g.fill();
  // Inner shine
  g.fillStyle(0xF3E5F5, 0.6);
  g.fillRect(6, 4, 3, 8);
  // Glow base
  g.fillStyle(0xCE93D8, 0.3);
  g.fillEllipse(8, 20, 14, 6);
  g.generateTexture('crystal_magic', 16, 24);
  g.destroy();
}

function createRuneSymbolTexture(scene) {
  const g = scene.add.graphics();
  // Rune circle
  g.lineStyle(1, 0x9B30FF, 0.7);
  g.strokeCircle(8, 8, 6);
  // Rune lines
  g.lineBetween(8, 2, 8, 14);
  g.lineBetween(3, 5, 13, 11);
  g.lineBetween(3, 11, 13, 5);
  // Center dot
  g.fillStyle(0xDA70D6);
  g.fillCircle(8, 8, 1.5);
  g.generateTexture('rune_symbol', 16, 16);
  g.destroy();
}

function createSlimePuddleTexture(scene) {
  const g = scene.add.graphics();
  // Puddle shape
  g.fillStyle(0x2d5016, 0.6);
  g.fillEllipse(16, 8, 28, 12);
  // Lighter center
  g.fillStyle(0x4CAF50, 0.4);
  g.fillEllipse(14, 7, 16, 6);
  // Shine
  g.fillStyle(0x81C784, 0.3);
  g.fillEllipse(10, 5, 6, 3);
  g.generateTexture('slime_puddle', 32, 16);
  g.destroy();
}

function createCrownTexture(scene) {
  const g = scene.add.graphics();
  // Crown base
  g.fillStyle(0xFFD700);
  g.fillRect(2, 6, 16, 6);
  // Crown points
  g.fillTriangle(2, 6, 6, 0, 6, 6);
  g.fillTriangle(8, 6, 10, 2, 12, 6);
  g.fillTriangle(14, 6, 18, 0, 18, 6);
  // Gems on points
  g.fillStyle(0xE040FB);
  g.fillCircle(5, 3, 1.5);
  g.fillStyle(0x00E5FF);
  g.fillCircle(10, 4, 1.5);
  g.fillStyle(0xEF5350);
  g.fillCircle(16, 3, 1.5);
  // Gold trim
  g.fillStyle(0xDAA520);
  g.fillRect(2, 10, 16, 2);
  g.generateTexture('crown', 20, 12);
  g.destroy();
}

/**
 * Generates all 10 item textures. Call in BootScene.create() after genItems()
 * to overwrite the basic canvas textures with improved pixel-art versions.
 */
export function createAllTextures(scene) {
  createHerbTexture(scene);
  createKeyTexture(scene);
  createFishTexture(scene);
  createGemTexture(scene);
  createMushroomTexture(scene);
  createAppleTexture(scene);
  createCoinTexture(scene);
  createPotionTexture(scene);
  createSwordTexture(scene);
  createScrollTexture(scene);

  // === EXPANSION TEXTURES ===
  createShieldTexture(scene);
  createWandTexture(scene);
  createFireballTexture(scene);
  createFireballParticleTexture(scene);
  createDoorLockedTexture(scene);
  createDoorOpenTexture(scene);
  createBossDoorLockedTexture(scene);
  createBossDoorOpenTexture(scene);
  createPedestalTexture(scene);
  createCrystalDefenseTexture(scene);
  createCrystalMagicTexture(scene);
  createRuneSymbolTexture(scene);
  createSlimePuddleTexture(scene);
  createCrownTexture(scene);
}
