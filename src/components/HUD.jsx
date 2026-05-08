import React, { useState, useEffect, useCallback } from 'react';
import { EventBus } from '../game/EventBus.js';
import './HUD.css';

export function HUD({ quest, questProgress, health = 3, maxHealth = 3 }) {
  const [zoneName, setZoneName] = useState('');
  const [showZone, setShowZone] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleZoneEnter = useCallback((name) => {
    setZoneName(name);
    setShowZone(true);
    setTimeout(() => setShowZone(false), 3000);
  }, []);

  const handleSaveShow = useCallback(() => {
    setSaving(true);
    setTimeout(() => setSaving(false), 2000);
  }, []);

  useEffect(() => {
    EventBus.on('zone-enter', handleZoneEnter);
    EventBus.on('save-show', handleSaveShow);
    return () => {
      EventBus.off('zone-enter', handleZoneEnter);
      EventBus.off('save-show', handleSaveShow);
    };
  }, [handleZoneEnter, handleSaveShow]);

  return (
    <>
      <div className="hud-health">
        {Array.from({ length: maxHealth }).map((_, i) => (
          <span key={i} className="heart">{i < health ? '❤️' : '🖤'}</span>
        ))}
      </div>

      <div className={`hud-zone-name ${showZone ? 'visible' : ''}`}>
        {zoneName}
      </div>

      {quest && (
        <div className="hud-quest-tracker">
          <div className="quest-title">📜 {quest.title}</div>
          <div className="quest-desc">{quest.desc}</div>
          {quest.needed > 1 && (
            <div className="quest-progress">
              Progreso: {questProgress}/{quest.needed}
            </div>
          )}
        </div>
      )}

      <div className={`hud-save-indicator ${saving ? 'visible' : ''}`}>
        💾 Guardando...
      </div>

      <div className="hud-controls">
        WASD/Flechas: Mover<br/>
        Shift: Correr<br/>
        E: Interactuar<br/>
        Espacio: Atacar<br/>
        ESC: Pausa
      </div>
    </>
  );
}
