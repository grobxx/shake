/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { create } from 'zustand';
import { GameState, WORLD_SIZE, INITIAL_LENGTH, SEGMENT_SPACING, COLORS } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Language = 'en' | 'ru';

interface GameStore {
  gameState: GameState | null;
  playerId: string | null;
  playerName: string;
  botCount: number;
  difficulty: Difficulty;
  language: Language;
  setPlayerName: (name: string) => void;
  setBotCount: (count: number) => void;
  setDifficulty: (diff: Difficulty) => void;
  setLanguage: (lang: Language) => void;
  initializeLocalGame: () => void;
  joinGame: () => void;
  updateUiState: () => void; // Called occasionally by the game loop to trigger react re-renders
}

export const globalGameState: { current: GameState | null } = { current: null };
let snakeCounter = 1;

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  playerId: null,
  playerName: '',
  botCount: 10,
  difficulty: 'normal',
  language: typeof navigator !== 'undefined' && navigator.language.startsWith('ru') ? 'ru' : 'en',
  
  setPlayerName: (playerName) => set({ playerName }),
  setBotCount: (botCount) => set({ botCount }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setLanguage: (language) => set({ language }),
  
  initializeLocalGame: () => {
    const { playerId } = get();
    if (globalGameState.current && playerId) return;

    const initialOrbs: Record<string, any> = {};
    for (let i = 0; i < 150; i++) {
       const id = uuidv4();
       initialOrbs[id] = {
         id,
         x: (Math.random() - 0.5) * WORLD_SIZE,
         y: (Math.random() - 0.5) * WORLD_SIZE,
         value: 1,
         color: COLORS[Math.floor(Math.random() * COLORS.length)]
       };
    }

    const newPlayerId = uuidv4();
    globalGameState.current = {
      players: {},
      orbs: initialOrbs,
      leaderboard: [],
    };

    set({ playerId: newPlayerId, gameState: globalGameState.current });
  },

  joinGame: () => {
    const { playerId, botCount, language, playerName } = get();
    const gs = globalGameState.current;
    if (!gs || !playerId) return;

    // Clear existing players
    gs.players = {};

    const defaultName = language === 'ru' ? 'Игрок' : 'Player';
    const finalPlayerName = playerName.trim() || defaultName;
    const botPrefix = language === 'ru' ? 'Бот-' : 'Bot-';

    // Spawn player
    gs.players[playerId] = createPlayer(playerId, finalPlayerName, false);

    // Spawn bots
    for (let i = 0; i < botCount; i++) {
        const botId = uuidv4();
        gs.players[botId] = createPlayer(botId, `${botPrefix}${i+1}`, true);
    }
  },

  updateUiState: () => {
    // We clone just the parts needed so react sees a change if we want it to re-render.
    // Zustand's shallow check means we need a new object reference.
    if (globalGameState.current) {
       set({ gameState: { ...globalGameState.current, leaderboard: [...globalGameState.current.leaderboard] } });
    }
  }
}));

function createPlayer(id: string, name: string, isBot: boolean) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const startX = (Math.random() - 0.5) * (WORLD_SIZE - 20);
    const startY = (Math.random() - 0.5) * (WORLD_SIZE - 20);
    const angle = Math.random() * Math.PI * 2;

    const segments = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      segments.push({
        x: startX - Math.cos(angle) * i * SEGMENT_SPACING,
        y: startY - Math.sin(angle) * i * SEGMENT_SPACING,
      });
    }

    return {
      id,
      name,
      color,
      segments,
      score: INITIAL_LENGTH,
      isBoosting: false,
      state: 'alive' as const,
      currentAngle: angle,
      isBot,
    };
}
