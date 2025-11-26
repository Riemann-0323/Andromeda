
export interface Choice {
  text: string;
  impact?: string; // Hidden context for the AI
}

export type EndingType = 
  | 'dissolution' // 消解 (Normal)
  | 'connection'  // 连结 (Normal)
  | 'departure'   // 离去 (Normal)
  | 'stagnation'  // 停滞 (Normal)
  | 'destruction' // 毁灭 (Normal)
  | 'truth'       // 真相 (Meta Crisis)
  | 'reconciliation'; // 和解 (True True Ending)

export interface Scene {
  narrative: string;
  thoughts: string[]; // Floating inner monologues
  choices: Choice[];
  isEnding: boolean;
  backgroundMood?: 'calm' | 'stormy' | 'ethereal' | 'glitch';
  endingType?: EndingType;
}

export interface LogEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type MusicMode = 'piano' | 'drone' | 'lofi' | 'machinery' | 'silence';

export interface GameState {
  history: { user: string; model: string }[]; // For AI Context
  fullLog: LogEntry[]; // For User UI
  currentScene: Scene | null;
  isLoading: boolean;
  isAudioPlaying: boolean;
  musicMode: MusicMode;
  sceneCount: number;
}

export interface SaveSlot {
  id: string;
  timestamp: number;
  excerpt: string;
  gameState: GameState;
}
