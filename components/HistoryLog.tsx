
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface HistoryLogProps {
  logs: LogEntry[];
  isOpen: boolean;
  onClose: () => void;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ logs, isOpen, onClose }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="relative w-full max-w-2xl bg-zinc-900/90 border border-zinc-700/50 shadow-2xl rounded-sm h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="cn-font text-xl text-slate-200 tracking-[0.2em]">记忆碎片 (Records)</h2>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
          {logs.map((log, index) => (
            <div key={index} className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}>
               <span className="text-[10px] text-zinc-600 uppercase mb-1 tracking-widest">
                 {log.role === 'user' ? 'CHOICE' : 'NARRATIVE'}
               </span>
               <div className={`max-w-[90%] md:max-w-[80%] text-sm md:text-base leading-relaxed p-4 rounded-sm border ${
                 log.role === 'user' 
                   ? 'bg-zinc-800/50 border-zinc-700 text-cyan-100/80 cn-font' 
                   : 'bg-transparent border-transparent text-slate-300 cn-font'
               }`}>
                 {log.text}
               </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center text-zinc-600 mt-20 cn-font">记忆是一片空白...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryLog;
