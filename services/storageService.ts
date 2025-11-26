
import { GameState, SaveSlot, EndingType } from "../types";

const SAVE_KEY_PREFIX = 'andromeda_save_';
const UNLOCKED_ENDINGS_KEY = 'andromeda_endings';

export const saveGame = (slotId: string, state: GameState): void => {
  const saveData: SaveSlot = {
    id: slotId,
    timestamp: Date.now(),
    excerpt: state.currentScene?.narrative.substring(0, 30) + '...' || 'Unknown',
    gameState: state
  };
  localStorage.setItem(`${SAVE_KEY_PREFIX}${slotId}`, JSON.stringify(saveData));
};

export const loadGame = (slotId: string): GameState | null => {
  const data = localStorage.getItem(`${SAVE_KEY_PREFIX}${slotId}`);
  if (!data) return null;
  try {
    const parsed: SaveSlot = JSON.parse(data);
    return parsed.gameState;
  } catch (e) {
    console.error("Failed to load save", e);
    return null;
  }
};

export const getSaveSlots = (): (SaveSlot | null)[] => {
  const slots = [];
  for (let i = 1; i <= 3; i++) {
    const data = localStorage.getItem(`${SAVE_KEY_PREFIX}slot_${i}`);
    if (data) {
      try {
        slots.push(JSON.parse(data));
      } catch {
        slots.push(null);
      }
    } else {
      slots.push(null);
    }
  }
  return slots;
};

export const getUnlockedEndings = (): EndingType[] => {
  const data = localStorage.getItem(UNLOCKED_ENDINGS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const unlockEnding = (ending: EndingType): EndingType[] => {
  const current = getUnlockedEndings();
  if (!current.includes(ending)) {
    const updated = [...current, ending];
    localStorage.setItem(UNLOCKED_ENDINGS_KEY, JSON.stringify(updated));
    return updated;
  }
  return current;
};

export const resetEndings = () => {
  localStorage.removeItem(UNLOCKED_ENDINGS_KEY);
};

export const wipeAllData = () => {
  localStorage.clear();
};
