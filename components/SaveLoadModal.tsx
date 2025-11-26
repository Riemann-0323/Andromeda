
import React, { useEffect, useState } from 'react';
import { SaveSlot } from '../types';
import { getSaveSlots } from '../services/storageService';

interface SaveLoadModalProps {
  mode: 'save' | 'load';
  isOpen: boolean;
  onClose: () => void;
  onSelectSlot: (slotId: string) => void;
}

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({ mode, isOpen, onClose, onSelectSlot }) => {
  const [slots, setSlots] = useState<(SaveSlot | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSlots(getSaveSlots());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-6">
      <div className="w-full max-w-lg bg-[#0a0a0a] border border-slate-800 p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="title-font text-2xl text-slate-200 tracking-[0.2em]">
            {mode === 'save' ? 'ARCHIVE MEMORY' : 'RECALL MEMORY'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          {slots.map((slot, index) => {
            const slotId = `slot_${index + 1}`;
            return (
              <button
                key={slotId}
                onClick={() => onSelectSlot(slotId)}
                disabled={mode === 'load' && !slot}
                className={`
                  w-full p-4 border text-left transition-all duration-300 group relative overflow-hidden
                  ${slot ? 'border-slate-700 hover:border-cyan-700 bg-slate-900/30' : 'border-slate-900 bg-black/50'}
                  ${mode === 'load' && !slot ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="cn-font text-xs text-slate-500 tracking-widest">SLOT {index + 1}</span>
                    {slot && <span className="text-[10px] text-slate-600 font-mono">{new Date(slot.timestamp).toLocaleString()}</span>}
                  </div>
                  {slot ? (
                    <p className="cn-font text-sm text-slate-300 line-clamp-2 leading-relaxed opacity-80 group-hover:opacity-100 group-hover:text-cyan-50 transition-colors">
                      {slot.excerpt}
                    </p>
                  ) : (
                    <p className="cn-font text-sm text-slate-700 italic">Empty Record</p>
                  )}
                </div>
                {slot && <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/0 via-cyan-900/5 to-cyan-900/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SaveLoadModal;
