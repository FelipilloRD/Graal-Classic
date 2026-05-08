export const QUESTS = {
  quest_01: {
    id: 'quest_01', type: 'talk', title: 'Conoce al Guardia',
    desc: 'Habla con el Guardia del pueblo', target: 'guardia', needed: 1,
    reward: 'coin'
  },
  quest_02: {
    id: 'quest_02', type: 'collect', title: 'Hierbas Medicinales',
    desc: 'Recoge 3 hierbas en el bosque', target: 'herb', needed: 3,
    reward: 'potion'
  },
  quest_03: {
    id: 'quest_03', type: 'reach', title: 'Explora el Lago',
    desc: 'Descubre el lago al este', target: 'LagoScene', needed: 1,
    reward: 'fish'
  },
  quest_04: {
    id: 'quest_04', type: 'talk', title: 'El Pescador',
    desc: 'Habla con el Pescador del lago', target: 'pescador', needed: 1,
    reward: 'gem'
  },
  quest_05: {
    id: 'quest_05', type: 'reach', title: 'La Cueva Secreta',
    desc: 'Encuentra la cueva oculta en el bosque', target: 'CuevaScene', needed: 1,
    reward: 'gem'
  },
  quest_06: {
    id: 'quest_06', type: 'talk', title: 'El Secreto del Mago',
    desc: 'Llévale 2 gemas al Mago en la cueva', target: 'mago', needed: 1,
    reward: 'scroll'
  }
};

const QUEST_ORDER = ['quest_01', 'quest_02', 'quest_03', 'quest_04', 'quest_05', 'quest_06'];

export class QuestSystem {
  constructor(saveData = {}) {
    this.completed = saveData.completed || [];
    this.active = saveData.active || 'quest_01';
    this.progress = saveData.progress || {};
  }

  getActiveQuest() {
    if (!this.active) return null;
    return QUESTS[this.active] || null;
  }

  getProgress(questId) {
    return this.progress[questId] || 0;
  }

  addProgress(questId, amount = 1) {
    if (questId !== this.active) return false;
    const quest = QUESTS[questId];
    if (!quest) return false;
    this.progress[questId] = (this.progress[questId] || 0) + amount;
    if (this.progress[questId] >= quest.needed) {
      return this.completeQuest(questId);
    }
    return false;
  }

  completeQuest(questId) {
    if (this.completed.includes(questId)) return false;
    this.completed.push(questId);
    const idx = QUEST_ORDER.indexOf(questId);
    if (idx < QUEST_ORDER.length - 1) {
      this.active = QUEST_ORDER[idx + 1];
    } else {
      this.active = null;
    }
    return true;
  }

  checkTalk(npcId) {
    const quest = this.getActiveQuest();
    if (!quest || quest.type !== 'talk') return false;
    if (quest.target === npcId) {
      return this.addProgress(this.active);
    }
    return false;
  }

  checkCollect(itemId) {
    const quest = this.getActiveQuest();
    if (!quest || quest.type !== 'collect') return false;
    if (quest.target === itemId) {
      return this.addProgress(this.active);
    }
    return false;
  }

  checkReach(sceneKey) {
    const quest = this.getActiveQuest();
    if (!quest || quest.type !== 'reach') return false;
    if (quest.target === sceneKey) {
      return this.addProgress(this.active);
    }
    return false;
  }

  toSaveData() {
    return {
      completed: [...this.completed],
      active: this.active,
      progress: { ...this.progress }
    };
  }
}
