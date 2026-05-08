import { useEffect } from 'react';
import { EventBus } from '../game/EventBus.js';

export function useGameEvent(eventName, callback) {
  useEffect(() => {
    EventBus.on(eventName, callback);
    return () => EventBus.off(eventName, callback);
  }, [eventName, callback]);
}
