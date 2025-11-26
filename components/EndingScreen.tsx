
import React, { useEffect, useState } from 'react';
import { EndingType } from '../types';
import { wipeAllData } from '../services/storageService';

interface EndingScreenProps {
  type: EndingType;
  onRestart: () => void;
}

const EndingScreen: React.FC<EndingScreenProps> = ({ type, onRestart }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 500);
  }, []);

  const handleEndingAction = () => {
      if (type === 'reconciliation') {
          // Hard Reset for True True Ending
          wipeAllData();
          window.location.reload();
      } else {
          onRestart();
      }
  };

  const config: Record<EndingType, { title: string; subtitle: string; color: string; bg: string }> = {
    dissolution: { title: "消解", subtitle: "DISSOLUTION", color: "text-blue-200", bg: "bg-blue-950" },
    connection: { title: "连结", subtitle: "CONNECTION", color: "text-amber-100", bg: "bg-amber-950" },
    departure: { title: "离去", subtitle: "DEPARTURE", color: "text-slate-100", bg: "bg-slate-800" },
    stagnation: { title: "停滞", subtitle: "STAGNATION", color: "text-gray-400", bg: "bg-zinc-900" },
    destruction: { title: "毁灭", subtitle: "DESTRUCTION", color: "text-red-500", bg: "bg-red-950" },
    truth: { title: "真相", subtitle: "THE TRUTH", color: "text-white", bg: "bg-black" },
    reconciliation: { title: "和解", subtitle: "RECONCILIATION", color: "text-slate-800", bg: "bg-slate-100" },
  };

  const { title, subtitle, color, bg } = config[type];

  // Specific styles for Reconciliation (White Theme)
  const isReconciliation = type === 'reconciliation';

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-opacity duration-[3000ms] ${visible ? 'opacity-100' : 'opacity-0'} ${bg}`}>
      
      {/* Visual Effects */}
      {type === 'dissolution' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/rain.png')] opacity-20 animate-drift-slow"></div>}
      
      {type === 'truth' && (
        <>
           <div className="absolute inset-0 bg-green-900/10 animate-pulse"></div>
           <div className="absolute top-0 left-0 w-full h-1 bg-white opacity-20 animate-scan"></div>
        </>
      )}

      {isReconciliation && (
          <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-100 to-slate-200 animate-pulse-slow"></div>
      )}
      
      <div className="relative z-10 text-center space-y-8">
         <h3 className={`cn-font text-6xl md:text-8xl font-light tracking-[0.5em] ${color} drop-shadow-lg`}>
            {title}
         </h3>
         <p className={`title-font text-sm md:text-base tracking-[1em] uppercase ${isReconciliation ? 'text-slate-400' : 'text-slate-500'}`}>
            {subtitle}
         </p>
         
         <div className="pt-20 opacity-0 animate-fade-in" style={{ animationDelay: '3s', animationFillMode: 'forwards' }}>
            <button 
                onClick={handleEndingAction}
                className={`cn-font px-8 py-3 transition-all tracking-widest text-sm border
                    ${isReconciliation 
                        ? 'border-slate-800/20 hover:border-slate-800 text-slate-600 hover:text-slate-900 hover:bg-white' 
                        : 'border-white/20 hover:border-white/60 text-white/50 hover:text-white'
                    }
                `}
            >
                {isReconciliation ? "重启世界 (RESET)" : "重新开始"}
            </button>
         </div>
      </div>
      
      {/* Decorative Lines */}
      {!isReconciliation && (
        <>
            <div className={`absolute top-10 left-10 w-20 h-[1px] ${type === 'destruction' ? 'bg-red-500' : 'bg-white/20'}`}></div>
            <div className={`absolute bottom-10 right-10 w-20 h-[1px] ${type === 'destruction' ? 'bg-red-500' : 'bg-white/20'}`}></div>
        </>
      )}

      <style>{`
        @keyframes scan {
            0% { top: -10%; }
            100% { top: 110%; }
        }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default EndingScreen;
