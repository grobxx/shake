/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useGameStore, Difficulty } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Download, Languages } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: "NEON.SNAKE",
    length: "Length",
    turn: "Turn",
    boost: "Boost",
    export: "Export ZIP",
    leaderboard: "LEADERBOARD",
    youDied: "YOU DIED",
    finalLength: "Final Length",
    singlePlayer: "SINGLE PLAYER",
    controls: "Steer with A/D or Left/Right. Space to boost.",
    difficulty: "Difficulty",
    botCount: "Bot Count",
    respawn: "RESPAWN",
    play: "PLAY",
    easy: "EASY",
    normal: "NORMAL",
    hard: "HARD",
    namePlaceholder: "Enter your name"
  },
  ru: {
    title: "NEON.SNAKE",
    length: "Длина",
    turn: "Поворот",
    boost: "Ускорение",
    export: "Скачать ZIP",
    leaderboard: "РЕКОРДЫ",
    youDied: "ВЫ ПОГИБЛИ",
    finalLength: "Итоговая длина",
    singlePlayer: "ОДИНОЧНАЯ ИГРА",
    controls: "Управление: A/D или стрелками. Пробел - ускорение.",
    difficulty: "Сложность",
    botCount: "Кол-во ботов",
    respawn: "ИГРАТЬ СНОВА",
    play: "ИГРАТЬ",
    easy: "ЛЕГКО",
    normal: "СРЕДНЕ",
    hard: "СЛОЖНО",
    namePlaceholder: "Введите ваше имя"
  }
};

export function UI() {
  const { gameState, playerId, joinGame, botCount, difficulty, setBotCount, setDifficulty, language, setLanguage, playerName, setPlayerName } = useGameStore();

  const player = playerId && gameState ? gameState.players[playerId] : null;
  const isAlive = player?.state === 'alive';
  const isDead = player?.state === 'dead';

  const t = TRANSLATIONS[language];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-start pointer-events-auto relative">
        <div className="flex flex-col gap-2 z-10">
          <h1 className="text-3xl font-black text-white tracking-tighter" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
            {t.title}
          </h1>
          {isAlive && (
            <div className="text-xl font-mono text-white/80 font-bold">
              {t.length}: {Math.floor(player.score)}
            </div>
          )}
        </div>
        
        {/* Controls Hint */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex gap-2 opacity-80 pointer-events-none hidden sm:flex">
          <div className="flex items-center gap-2 text-xs font-mono text-white bg-white/5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded text-white">A</span>
            <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded text-white">D</span>
            <span className="text-white/70 uppercase tracking-wider text-[10px]">{t.turn}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-white bg-white/5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
            <span className="font-bold bg-white/20 px-1.5 py-0.5 rounded text-white">SPACE</span>
            <span className="text-white/70 uppercase tracking-wider text-[10px]">{t.boost}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 z-10">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
            className="flex items-center justify-center w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
            title="Toggle Language"
          >
            <span className="font-bold text-sm uppercase">{language}</span>
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      {gameState && gameState.leaderboard.length > 0 && (
        <div className="absolute top-20 right-4 w-64 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 pointer-events-auto">
          <div className="flex items-center gap-2 mb-4 text-white/80 font-semibold">
            <Trophy size={18} className="text-yellow-400" />
            <h2>{t.leaderboard}</h2>
          </div>
          <div className="flex flex-col gap-2">
            {gameState.leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-white/40 w-4">{i + 1}.</span>
                  <span style={{ color: entry.color }} className="font-medium truncate max-w-[120px]">
                    {entry.name}
                  </span>
                </div>
                <span className="font-mono text-white/80">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menus */}
      <AnimatePresence>
        {(!player || isDead) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/60 backdrop-blur-sm z-50"
          >
            <div className="bg-zinc-900/90 p-8 rounded-3xl border border-white/10 shadow-2xl max-w-md w-full flex flex-col items-center gap-6">
              {isDead && (
                <div className="text-center">
                  <h2 className="text-4xl font-black text-red-500 mb-2">{t.youDied}</h2>
                  <p className="text-white/60">{t.finalLength}: {Math.floor(player.score)}</p>
                </div>
              )}
              
              {!isDead && (
                <div className="text-center">
                  <h2 className="text-3xl font-black text-white mb-2">{t.singlePlayer}</h2>
                  <p className="text-white/60 text-sm">{t.controls}</p>
                </div>
              )}

              <div className="w-full flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/10">
                <input
                  type="text"
                  placeholder={t.namePlaceholder}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-transparent text-white outline-none font-bold text-center placeholder-white/40 p-2"
                  maxLength={15}
                />
              </div>

              <div className="w-full flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <span className="text-white/80 text-sm font-medium">{t.difficulty}</span>
                <div className="flex gap-2">
                  {(['easy', 'normal', 'hard'] as const).map((d: keyof typeof t) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d as Difficulty)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${difficulty === d ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                    >
                      {t[d]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <span className="text-white/80 text-sm font-medium">{t.botCount}</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={botCount}
                  onChange={(e) => setBotCount(parseInt(e.target.value))}
                  className="w-1/2 accent-white"
                />
                <span className="text-white font-mono min-w-[2rem] text-right">{botCount}</span>
              </div>
              
              <button
                onClick={joinGame}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors active:scale-95 text-lg"
              >
                {isDead ? t.respawn : t.play}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


