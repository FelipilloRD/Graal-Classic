import React, { useState, useEffect, useCallback } from 'react';
import { EventBus } from '../game/EventBus.js';
import './Notification.css';

export function Notification() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((text, type = 'item') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const onItem = (itemId) => addToast(`✨ ${itemId} obtenido`, 'item');
    const onQuest = (title) => addToast(`🏆 Misión completada: ${title}`, 'quest');
    EventBus.on('notify-item', onItem);
    EventBus.on('notify-quest', onQuest);
    return () => {
      EventBus.off('notify-item', onItem);
      EventBus.off('notify-quest', onQuest);
    };
  }, [addToast]);

  return (
    <div className="notification-container">
      {toasts.map(t => (
        <div key={t.id} className={`notification-toast ${t.type}`}>{t.text}</div>
      ))}
    </div>
  );
}
