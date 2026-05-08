import React from 'react';
import { ITEM_DATA } from '../game/systems/InventorySystem.js';
import './InventoryBar.css';

const ITEM_EMOJI = {
  herb: '🌿', key: '🔑', fish: '🐟', gem: '💎',
  mushroom: '🍄', apple: '🍎', coin: '🪙', potion: '🧪',
  sword: '🗡️', scroll: '📜', shield: '🛡️', wand: '🔮'
};

const MAX_SLOTS = 12;

export function InventoryBar({ items }) {
  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const item = items[i];
    slots.push(
      <div key={i} className={`inv-slot ${item ? 'filled' : ''}`}>
        {item && (
          <>
            <span className="item-icon">{ITEM_EMOJI[item.id] || '❓'}</span>
            {item.qty > 1 && <span className="item-qty">{item.qty}</span>}
          </>
        )}
      </div>
    );
  }
  return <div className="inventory-bar">{slots}</div>;
}
