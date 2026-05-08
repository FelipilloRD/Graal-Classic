const SAVE_KEY = 'antigravity_save';

const DEFAULT_SAVE = {
  player: { x: 400, y: 400, scene: 'PuebloScene', direction: 'down', health: 3, maxHealth: 3 },
  inventory: [],
  quests: { completed: [], active: 'quest_01', progress: {} },
  discoveredZones: ['PuebloScene'],
  timestamp: null
};

export const SaveSystem = {
  save(data) {
    const saveData = { ...data, timestamp: Date.now() };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.warn('Save failed:', e);
      return false;
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw);
      
      // Always restore full health upon loading a session (Zelda-style)
      if (parsed.player) {
        parsed.player.health = parsed.player.maxHealth || 3;
      }
      
      return { ...DEFAULT_SAVE, ...parsed };
    } catch (e) {
      console.warn('Load failed:', e);
      return { ...DEFAULT_SAVE };
    }
  },

  hasSave() {
    return localStorage.getItem(SAVE_KEY) !== null;
  },

  deleteSave() {
    localStorage.removeItem(SAVE_KEY);
  },

  getDefault() {
    return { ...DEFAULT_SAVE };
  }
};
