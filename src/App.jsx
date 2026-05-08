import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config.js';
import { EventBus } from './game/EventBus.js';
import { SaveSystem } from './game/systems/SaveSystem.js';
import { InventorySystem } from './game/systems/InventorySystem.js';
import { QuestSystem, QUESTS } from './game/systems/QuestSystem.js';
import { HUD } from './components/HUD.jsx';
import { InventoryBar } from './components/InventoryBar.jsx';
import { DialogBox } from './components/DialogBox.jsx';
import { Notification } from './components/Notification.jsx';
import { PauseMenu } from './components/PauseMenu.jsx';

function App() {
  const gameRef = useRef(null);
  const inventoryRef = useRef(null);
  const questRef = useRef(null);

  const [inventory, setInventory] = useState([]);
  const [activeQuest, setActiveQuest] = useState(null);
  const [questProgress, setQuestProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inGame, setInGame] = useState(false);
  const [playerState, setPlayerState] = useState({ x: 400, y: 400, scene: 'PuebloScene', direction: 'down', health: 3, maxHealth: 3 });

  // Initialize game systems
  useEffect(() => {
    const save = SaveSystem.load();
    inventoryRef.current = new InventorySystem(save.inventory || []);
    questRef.current = new QuestSystem(save.quests || {});
    setInventory(inventoryRef.current.getItems());
    if (save.player) setPlayerState(prev => ({ ...prev, ...save.player }));
    updateQuestUI();
  }, []);

  // Initialize Phaser
  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
    }
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const updateQuestUI = useCallback(() => {
    if (!questRef.current) return;
    const q = questRef.current.getActiveQuest();
    setActiveQuest(q);
    if (q) setQuestProgress(questRef.current.getProgress(q.id));
  }, []);

  const doSave = useCallback(() => {
    if (!inventoryRef.current || !questRef.current) return;
    SaveSystem.save({
      player: playerState,
      inventory: inventoryRef.current.toSaveData(),
      quests: questRef.current.toSaveData(),
      discoveredZones: []
    });
    EventBus.emit('save-show');
  }, [playerState]);

  // Event listeners
  useEffect(() => {
    const onItemPickup = (itemId) => {
      if (!inventoryRef.current || !questRef.current) return;
      inventoryRef.current.addItem(itemId);
      setInventory(inventoryRef.current.getItems());
      EventBus.emit('notify-item', itemId);

      // Check quest
      const completed = questRef.current.checkCollect(itemId);
      if (completed) {
        const quest = QUESTS[questRef.current.completed[questRef.current.completed.length - 1]];
        if (quest?.reward) {
          inventoryRef.current.addItem(quest.reward);
          setInventory(inventoryRef.current.getItems());
        }
        EventBus.emit('notify-quest', quest?.title || 'Misión');
      }
      updateQuestUI();
    };

    const onTalkCheck = (npcId) => {
      if (!questRef.current || !inventoryRef.current) return;

      // Special logic for Mago quest_06
      const activeQuest = questRef.current.getActiveQuest();
      if (activeQuest && activeQuest.id === 'quest_06' && npcId === 'mago') {
        if (inventoryRef.current.hasItem('gem', 2)) {
          inventoryRef.current.removeItem('gem', 2);
          setInventory(inventoryRef.current.getItems());
        } else {
          EventBus.emit('notify-quest', 'Necesitas 2 Gemas para el Mago.');
          return; // Stop here, don't complete
        }
      }

      const completed = questRef.current.checkTalk(npcId);
      if (completed) {
        const quest = QUESTS[questRef.current.completed[questRef.current.completed.length - 1]];
        if (quest?.reward && inventoryRef.current) {
          inventoryRef.current.addItem(quest.reward);
          setInventory(inventoryRef.current.getItems());
        }
        EventBus.emit('notify-quest', quest?.title || 'Misión');
      }
      updateQuestUI();
    };

    const onReachCheck = (sceneKey) => {
      if (!questRef.current) return;
      const completed = questRef.current.checkReach(sceneKey);
      if (completed) {
        const quest = QUESTS[questRef.current.completed[questRef.current.completed.length - 1]];
        if (quest?.reward && inventoryRef.current) {
          inventoryRef.current.addItem(quest.reward);
          setInventory(inventoryRef.current.getItems());
        }
        EventBus.emit('notify-quest', quest?.title || 'Misión');
      }
      updateQuestUI();
    };

    const onInteractChest = () => {
      if (!inventoryRef.current) return;
      if (inventoryRef.current.hasItem('key', 1)) {
        inventoryRef.current.removeItem('key', 1);
        inventoryRef.current.addItem('sword', 1);
        setInventory(inventoryRef.current.getItems());
        EventBus.emit('notify-item', 'sword');
        EventBus.emit('chest-opened');
      } else {
        EventBus.emit('notify-quest', 'Necesitas una Llave para abrir esto.');
      }
    };

    const onTradeGems = () => {
      if (!inventoryRef.current) return;
      if (inventoryRef.current.hasItem('gem', 1)) {
        inventoryRef.current.removeItem('gem', 1);
        inventoryRef.current.addItem('coin', 10);
        setInventory(inventoryRef.current.getItems());
        EventBus.emit('notify-item', 'coin');
      } else {
        EventBus.emit('notify-quest', 'No tienes Gemas para vender.');
      }
    };

    const onSaveState = (state) => {
      setPlayerState(prev => ({ ...prev, ...state }));
    };

    const onAutoSave = () => doSave();

    const onPlayerMoved = (pos) => {
      setPlayerState(prev => ({ ...prev, x: pos.x, y: pos.y }));
    };

    const onPlayerDamage = (amount) => {
      setPlayerState(prev => {
        // === EXPANSION: Shield reduces damage by 90% ===
        let dmg = amount;
        if (inventoryRef.current && inventoryRef.current.hasItem('shield')) {
          dmg = Math.max(1, Math.floor(amount * 0.1));
        }

        const newHealth = Math.max(0, prev.health - dmg);
        if (newHealth <= 0) {
          // Death logic
          EventBus.emit('notify-quest', '¡Te has desmayado! Regresando al pueblo...');
          setTimeout(() => {
            if (gameRef.current) {
              const activeScene = gameRef.current.scene.getScenes(true)[0];
              if (activeScene) {
                activeScene.cameras.main.fadeOut(500, 0, 0, 0);
                activeScene.cameras.main.once('camerafadeoutcomplete', () => {
                  activeScene.scene.start('PuebloScene', { save: { player: { x: 800, y: 700, scene: 'PuebloScene', direction: 'down', health: prev.maxHealth, maxHealth: prev.maxHealth } } });
                });
              }
            }
          }, 1000);
          return { ...prev, health: prev.maxHealth, scene: 'PuebloScene', x: 800, y: 700 };
        }
        return { ...prev, health: newHealth };
      });
    };

    const onPlayerHeal = (amount) => {
      setPlayerState(prev => ({ ...prev, health: Math.min(prev.maxHealth, prev.health + amount) }));
    };

    // Track when entering a game scene (hide React UI during menu)
    const onZoneEnter = () => {
      setInGame(true);
    };

    // === EXPANSION: Cave door interactions ===
    const onInteractCaveDoor = (doorType) => {
      if (!inventoryRef.current) return;
      if (doorType === 'shield' || doorType === 'wand') {
        // These doors require the chest to have been opened (player got sword from chest)
        if (inventoryRef.current.hasItem('sword')) {
          EventBus.emit('cave-door-opened', doorType);
        } else {
          EventBus.emit('notify-quest', 'Necesitas abrir el cofre primero.');
        }
      } else if (doorType === 'boss') {
        if (inventoryRef.current.hasItem('shield') && inventoryRef.current.hasItem('wand')) {
          EventBus.emit('cave-door-opened', 'boss');
        } else {
          const missing = [];
          if (!inventoryRef.current.hasItem('shield')) missing.push('Escudo');
          if (!inventoryRef.current.hasItem('wand')) missing.push('Varita');
          EventBus.emit('notify-quest', `Necesitas: ${missing.join(' y ')} para enfrentar al Rey Slime.`);
        }
      }
    };

    const onPickupShield = () => {
      if (!inventoryRef.current) return;
      inventoryRef.current.addItem('shield');
      setInventory(inventoryRef.current.getItems());
      EventBus.emit('notify-item', 'shield');
    };

    const onPickupWand = () => {
      if (!inventoryRef.current) return;
      inventoryRef.current.addItem('wand');
      setInventory(inventoryRef.current.getItems());
      EventBus.emit('notify-item', 'wand');
    };

    const onBossDefeated = () => {
      EventBus.emit('notify-quest', '👑 ¡Has derrotado al Rey Slime! ¡Victoria!');
    };

    EventBus.on('item-pickup', onItemPickup);
    EventBus.on('quest-check-talk', onTalkCheck);
    EventBus.on('quest-check-reach', onReachCheck);
    EventBus.on('interact-chest', onInteractChest);
    EventBus.on('trade-gems', onTradeGems);
    EventBus.on('save-state', onSaveState);
    EventBus.on('auto-save', onAutoSave);
    EventBus.on('player-moved', onPlayerMoved);
    EventBus.on('player-damage', onPlayerDamage);
    EventBus.on('player-heal', onPlayerHeal);
    EventBus.on('zone-enter', onZoneEnter);
    EventBus.on('interact-cave-door', onInteractCaveDoor);
    EventBus.on('pickup-shield', onPickupShield);
    EventBus.on('pickup-wand', onPickupWand);
    EventBus.on('boss-defeated', onBossDefeated);

    return () => {
      EventBus.off('item-pickup', onItemPickup);
      EventBus.off('quest-check-talk', onTalkCheck);
      EventBus.off('quest-check-reach', onReachCheck);
      EventBus.off('interact-chest', onInteractChest);
      EventBus.off('trade-gems', onTradeGems);
      EventBus.off('save-state', onSaveState);
      EventBus.off('auto-save', onAutoSave);
      EventBus.off('player-moved', onPlayerMoved);
      EventBus.off('player-damage', onPlayerDamage);
      EventBus.off('player-heal', onPlayerHeal);
      EventBus.off('zone-enter', onZoneEnter);
      EventBus.off('interact-cave-door', onInteractCaveDoor);
      EventBus.off('pickup-shield', onPickupShield);
      EventBus.off('pickup-wand', onPickupWand);
      EventBus.off('boss-defeated', onBossDefeated);
    };
  }, [doSave, updateQuestUI]);

  useEffect(() => {
    window.currentInventory = inventory;
  }, [inventory]);

  // Pause with ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setPaused(p => !p);
        if (gameRef.current) {
          const scene = gameRef.current.scene.getScenes(true)[0];
          if (scene) {
            scene.scene.isPaused() ? scene.scene.resume() : scene.scene.pause();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const handleResume = () => {
    setPaused(false);
    if (gameRef.current) {
      const scene = gameRef.current.scene.getScenes(true)[0];
      if (scene) scene.scene.resume();
    }
  };

  const handleSave = () => {
    doSave();
    handleResume();
  };

  const handleDeleteSave = () => {
    SaveSystem.deleteSave();
    window.location.reload();
  };

  return (
    <div className="app-container">
      <div id="phaser-container" />
      {inGame && (
        <div className="ui-overlay">
          <HUD quest={activeQuest} questProgress={questProgress} health={playerState.health} maxHealth={playerState.maxHealth} />
          <DialogBox />
          <Notification />
          {paused && (
            <PauseMenu
              onResume={handleResume}
              onSave={handleSave}
              onDeleteSave={handleDeleteSave}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
