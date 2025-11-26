
import React from 'react';
import { EndingType } from '../types';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onLoad: () => void;
  onRestart: () => void;
  onShowRecords: () => void;
  onUnlockAll: () => void;
  unlockedEndings: EndingType[];
}

const Menu: React.FC<MenuProps> = ({ isOpen, onClose, onSave, onLoad, onRestart, onShowRecords, onUnlockAll, unlockedEndings }) => {
  if (!isOpen) return null;

  const normalEndings: EndingType[] = ['dissolution', 'connection', 'departure', 'stagnation', 'destruction'];
  const unlockedCount = normalEndings.filter(e => unlockedEndings.includes(e)).length;
  const progress = (unlockedCount / 5) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-md p-8 flex flex-col space-y-6">
        
        <h2 className="title-font text-3xl text-center tracking-[0.3em] text-slate-100">SYSTEM</h2>
        
        <div className="flex flex-col space-y-3">
          <MenuButton onClick={onClose} label="RESUME (回到雨中)" primary />
          <MenuButton onClick={onSave} label="SAVE (记录此刻)" />
          <MenuButton onClick={onLoad} label="LOAD (读取记忆)" />
          <MenuButton onClick={onShowRecords} label="LOG (回顾)" />
          <MenuButton onClick={onRestart} label="RESTART (重新开始)" warning />
        </div>

        {/* Cheat / Debug Button - NOW DIRECT CLICK */}
        <div className="pt-4 border-t border-slate-900 mt-2">
            <button 
                onClick={onUnlockAll}
                className="w-full py-3 text-center text-[10px] text-zinc-600 hover:text-red-500 hover:bg-red-950/20 tracking-[0.3em] border border-zinc-800 hover:border-red-800 transition-all uppercase"
            >
                [DEBUG: UNLOCK ALL PATHS]
            </button>
        </div>

        {/* Ending Progress */}
        <div className="pt-6 border-t border-slate-800">
           <div className="flex justify-between items-end mb-2">
             <span className="cn-font text-xs text-slate-500 tracking-widest">真相进度</span>
             <span className="title-font text-xs text-cyan-500 tracking-widest">{unlockedCount}/5</span>
           </div>
           <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-600 shadow-[0_0_10px_rgba(8,145,178,0.5)] transition-all duration-1000" 
                style={{ width: `${progress}%` }}
              ></div>
           </div>
           
           <div className="mt-4 grid grid-cols-5 gap-2">
              {normalEndings.map((ending, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-sm transition-colors duration-500 ${unlockedEndings.includes(ending) ? 'bg-cyan-500/80 shadow-[0_0_5px_rgba(34,211,238,0.8)]' : 'bg-slate-800'}`}
                  title={ending}
                ></div>
              ))}
           </div>
           {unlockedEndings.includes('truth') && (
             <div className="mt-4 text-center">
               <span className="text-red-500 text-[10px] tracking-[0.5em] animate-pulse">WORLD_TRUTH_REVEALED</span>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

const MenuButton: React.FC<{ onClick: () => void; label: string; primary?: boolean; warning?: boolean }> = ({ onClick, label, primary, warning }) => (
  <button 
    onClick={onClick}
    className={`
      w-full py-4 px-6 text-left relative overflow-hidden group transition-all duration-300
      border border-transparent
      ${primary ? 'bg-slate-100/5 hover:bg-slate-100/10 border-slate-700' : 'hover:bg-slate-100/5'}
      ${warning ? 'hover:text-red-400' : 'text-slate-400 hover:text-cyan-50'}
    `}
  >
    <span className={`cn-font text-sm tracking-[0.2em] relative z-10 transition-transform group-hover:translate-x-2 block`}>
      {label}
    </span>
    {primary && <div className="absolute inset-0 border border-slate-700/50 opacity-100"></div>}
  </button>
);

export default Menu;
