import React from 'react';
import './PauseMenu.css';

export function PauseMenu({ onResume, onSave, onDeleteSave }) {
  return (
    <div className="pause-overlay" onClick={onResume}>
      <div className="pause-menu" onClick={e => e.stopPropagation()}>
        <div className="pause-title">⏸ PAUSA</div>
        <button className="pause-btn" onClick={onResume}>▶ Continuar</button>
        <button className="pause-btn" onClick={onSave}>💾 Guardar</button>
        <button className="pause-btn danger" onClick={onDeleteSave}>🗑 Borrar Partida</button>
      </div>
    </div>
  );
}
