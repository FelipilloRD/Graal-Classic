const MAX_SLOTS = 12;

export class InventorySystem {
  constructor(initialItems = []) {
    this.items = initialItems.map(i => typeof i === 'string' ? { id: i, qty: 1 } : { ...i });
    this.selectedSlot = -1;
  }

  selectSlot(index) {
    if (index < 0 || index >= MAX_SLOTS) return null;
    this.selectedSlot = index;
    const item = this.items[index] || null;
    return item;
  }

  getSelectedItem() {
    if (this.selectedSlot < 0) return null;
    return this.items[this.selectedSlot] || null;
  }

  addItem(itemId, qty = 1) {
    const existing = this.items.find(i => i.id === itemId);
    if (existing) {
      existing.qty += qty;
      return true;
    }
    if (this.items.length >= MAX_SLOTS) return false;
    this.items.push({ id: itemId, qty });
    return true;
  }

  removeItem(itemId, qty = 1) {
    const idx = this.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    this.items[idx].qty -= qty;
    if (this.items[idx].qty <= 0) this.items.splice(idx, 1);
    return true;
  }

  hasItem(itemId, qty = 1) {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.qty >= qty : false;
  }

  countItem(itemId) {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.qty : 0;
  }

  getItems() {
    return [...this.items];
  }

  toSaveData() {
    return this.items.map(i => ({ ...i }));
  }
}

export const ITEM_DATA = {
  herb:     { name: 'Hierba',    desc: 'Una hierba medicinal', color: '#4CAF50' },
  key:      { name: 'Llave',     desc: 'Llave misteriosa',     color: '#FFD700' },
  fish:     { name: 'Pez',       desc: 'Un pez fresco',        color: '#42A5F5' },
  gem:      { name: 'Gema',      desc: 'Cristal brillante',    color: '#E040FB' },
  mushroom: { name: 'Hongo',     desc: 'Hongo del bosque',     color: '#FF7043' },
  apple:    { name: 'Manzana',   desc: 'Manzana roja',         color: '#EF5350' },
  coin:     { name: 'Moneda',    desc: 'Moneda de oro',        color: '#FFC107' },
  potion:   { name: 'Poción',    desc: 'Poción curativa',      color: '#CE93D8' },
  sword:    { name: 'Espada',    desc: 'Antigua espada',       color: '#B0BEC5' },
  scroll:   { name: 'Pergamino', desc: 'Hechizo místico',      color: '#FFCC80' },
  shield:   { name: 'Escudo',    desc: 'Escudo defensivo',      color: '#4FC3F7' },
  wand:     { name: 'Varita',    desc: 'Varita mágica',         color: '#CE93D8' }
};
