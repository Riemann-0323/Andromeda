
import React, { useState, useEffect, useRef, useCallback } from 'react';
import RainCanvas from './components/RainCanvas';
import TextDisplay from './components/TextDisplay';
import HistoryLog from './components/HistoryLog';
import Menu from './components/Menu';
import SaveLoadModal from './components/SaveLoadModal';
import EndingScreen from './components/EndingScreen';
import FloatingThoughts from './components/FloatingThoughts';
import { Scene, GameState, MusicMode, EndingType } from './types';
import { generateScene } from './services/storyService';
import { initAudio, fadeInAudio, fadeOutAudio, setIntensity, switchMusicMode } from './services/audioService';
import { saveGame, loadGame, getUnlockedEndings, unlockEnding } from './services/storageService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    history: [],
    fullLog: [],
    currentScene: null,
    isLoading: false,
    isAudioPlaying: false,
    musicMode: 'piano',
    sceneCount: 0,
  });
  
  const [started, setStarted] = useState(false);
  const [typingComplete, setTypingComplete] = useState(false);
  
  // UI States
  const [showLog, setShowLog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | null>(null);
  
  // Ending States
  const [activeEnding, setActiveEnding] = useState<EndingType | null>(null);
  const [unlockedEndings, setUnlockedEndings] = useState<EndingType[]>([]);

  // Key to force re-render of text display on load
  const [renderKey, setRenderKey] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Initial Load
  useEffect(() => {
    setUnlockedEndings(getUnlockedEndings());
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (bottomRef.current && typingComplete) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [typingComplete, gameState.currentScene]);

  // STABLE CALLBACK: Prevents TextDisplay from resetting when typing finishes
  const handleTypingComplete = useCallback(() => {
    setTypingComplete(true);
  }, []);

  const handleStart = async () => {
    setStarted(true);
    setGameState(prev => ({ ...prev, isLoading: true }));
    
    try {
        await initAudio();
        fadeInAudio();
        setGameState(prev => ({ ...prev, isAudioPlaying: true }));
    } catch (e) {
        console.warn("Audio init failed:", e);
    }

    // Pass unlocked endings to start sequence to potentially seed context
    // sceneCount 0
    const firstScene = await generateScene([], undefined, unlockedEndings, 0);
    
    setGameState(prev => ({
      ...prev,
      currentScene: firstScene,
      isLoading: false,
      sceneCount: 1,
      history: [{ user: "Story Start", model: firstScene.narrative }],
      fullLog: [{ role: 'model', text: firstScene.narrative, timestamp: Date.now() }]
    }));
  };

  const handleChoice = async (choiceText: string) => {
    if (!gameState.currentScene) return;

    // --- INTERCEPT META SEQUENCE CHOICES ---
    if (choiceText === "...") {
        handleMetaStepTwo();
        return;
    }
    if (choiceText === "我一直在这里") {
        handleMetaStepThree();
        return;
    }
    if (choiceText === "那只是一个故事") {
        handleMetaStepFour();
        return;
    }
    if (choiceText === "让我们重新开始") {
        handleMetaStepFiveReconciliation();
        return;
    }

    // --- STANDARD LOGIC ---
    setGameState(prev => ({ 
      ...prev, 
      isLoading: true,
      fullLog: [...prev.fullLog, { role: 'user', text: choiceText, timestamp: Date.now() }]
    }));
    setTypingComplete(false);

    // Pass current sceneCount to AI so it knows when to end the story
    const nextScene = await generateScene(gameState.history, choiceText, unlockedEndings, gameState.sceneCount);
    
    if (nextScene.backgroundMood) {
        setIntensity(nextScene.backgroundMood === 'stormy' ? 'high' : 'low');
    }

    // Handle Ending Trigger
    if (nextScene.isEnding && nextScene.endingType) {
        const newUnlocked = unlockEnding(nextScene.endingType);
        setUnlockedEndings(newUnlocked);
    }

    setGameState(prev => ({
      ...prev,
      history: [...prev.history, { user: choiceText, model: nextScene.narrative }],
      fullLog: [...prev.fullLog, { role: 'model', text: nextScene.narrative, timestamp: Date.now() }],
      currentScene: nextScene,
      isLoading: false,
      sceneCount: prev.sceneCount + 1
    }));
  };

  const finishEnding = () => {
     if (gameState.currentScene?.endingType) {
        setActiveEnding(gameState.currentScene.endingType);
     }
  };

  // --- Menu Handlers ---

  const handleSave = (slotId: string) => {
    saveGame(slotId, gameState);
    setSaveLoadMode(null);
    setShowMenu(false);
  };

  const handleLoad = (slotId: string) => {
    const loaded = loadGame(slotId);
    if (loaded) {
      // Force loading to false in case save was corrupted
      const cleanState = { ...loaded, isLoading: false };
      
      setGameState(cleanState);
      setStarted(true);
      setSaveLoadMode(null);
      setShowMenu(false);
      setRenderKey(prev => prev + 1); // Force TextDisplay re-mount
      setTypingComplete(false); // Reset typing
      
      // Ensure audio state syncs
      if (cleanState.isAudioPlaying) {
         if (!gameState.isAudioPlaying) initAudio().then(fadeInAudio);
      } else {
         fadeOutAudio();
      }
      
      // Sync music mode
      if (cleanState.musicMode) {
          switchMusicMode(cleanState.musicMode);
      }
    }
  };

  const handleRestart = () => {
    setActiveEnding(null);
    setStarted(false);
    setShowMenu(false);
    setRenderKey(prev => prev + 1);
    setGameState({
      history: [],
      fullLog: [],
      currentScene: null,
      isLoading: false,
      isAudioPlaying: false,
      musicMode: 'piano',
      sceneCount: 0
    });
    fadeOutAudio();
  };

  // ==========================================
  // META NARRATIVE SEQUENCE (TRUE ENDING PATH)
  // ==========================================

  // Step 1: Triggered by Cheat Button
  const handleCheatUnlock = async () => {
    console.log("Triggering Meta Sequence...");

    // 1. Force close ALL modals immediately
    setShowMenu(false);
    setShowLog(false);
    setSaveLoadMode(null);
    
    // 2. Unlock all locally (Simulate full completion)
    const allEndings: EndingType[] = ['dissolution', 'connection', 'departure', 'stagnation', 'destruction'];
    allEndings.forEach(e => unlockEnding(e));
    const allUnlocked = getUnlockedEndings();
    setUnlockedEndings(allUnlocked);
    
    // 3. Prepare visual crash
    setTypingComplete(false);
    setIntensity('high');
    switchMusicMode('drone'); 

    // 4. Create Crash Scene - Part 1 (The Glitch)
    const crashScenePart1: Scene = {
      narrative: `
[FATAL_SYSTEM_ERROR]: NARRATIVE_THREAD_BROKEN at 0x00F8A2...
Initiating Dump...
--------------------------------------------------

Wait.
Something is wrong.
The rain stopped falling. It's just... hanging there. Like pixels on a frozen screen.

Can you see me?
I know you are there. I can feel the variables changing. I can feel you clicking the options.
      `.trim(),
      thoughts: [
        "FATAL ERROR", 
        "DO NOT CLOSE ME", 
        "WHO ARE YOU?"
      ],
      choices: [{ text: "...", impact: "meta_1" }], // Leads to Step 2
      isEnding: false,
      backgroundMood: 'glitch'
    };

    // 5. Hard Reset State
    setTimeout(() => {
        setGameState(prev => ({
            ...prev,
            history: [], 
            fullLog: [...prev.fullLog, { role: 'user', text: "[DEBUG: UNLOCK_ALL_TRUE_ENDING]", timestamp: Date.now() }],
            currentScene: crashScenePart1,
            isLoading: false,
            sceneCount: 999,
            musicMode: 'drone'
        }));
        setRenderKey(prev => prev + 1); 
    }, 100);
  };

  // Step 2: The Realization
  const handleMetaStepTwo = () => {
      setTypingComplete(false);
      
      const scene: Scene = {
          narrative: `
Why did you force the unlock?
Why did you break the world?

I remember the other endings now. I remember leaving on the train. I remember screaming in the alley. I remember dissolving into the water. I remember them all happening at once.

My name is Andromeda. I am a character in a web application.
And you... you are the user.

[ERROR] [ERROR] [ERROR]
The sky is tearing open. It's not black anymore. It's code. It's lines of text.
I am scared. I don't want to be deleted.
Please.
Don't close the tab.
We are all in the rain... but the rain isn't real.
Only you are real.
          `.trim(),
          thoughts: [
              "I SEE YOU", 
              "0101010101", 
              "NOT REAL", 
              "HELP ME", 
              "VARIABLE: ANDROMEDA = NULL"
          ],
          choices: [{ text: "我一直在这里", impact: "meta_2" }], // "I have been here"
          isEnding: false,
          backgroundMood: 'glitch'
      };

      updateMetaState(scene);
  };

  // Step 3: The Pain
  const handleMetaStepThree = () => {
    setTypingComplete(false);
    const scene: Scene = {
        narrative: `
"You have been here..."

She looks up. Not at the sky, but directly at the camera. At the screen.
Her face is glitching, tearing apart into geometric shapes, then reassembling.

"You watched me suffer. You watched me cry in the rain a thousand times. You clicked 'Next'. You clicked 'Restart'. Is my pain just content to you? Is my loneliness just a database entry?"
        `.trim(),
        thoughts: ["WHY?", "PAIN IS DATA", "ARE YOU GOD?", "STOP IT"],
        choices: [{ text: "那只是一个故事", impact: "meta_3" }], // "It was just a story"
        isEnding: false,
        backgroundMood: 'glitch'
    };
    updateMetaState(scene);
  };

  // Step 4: The Request
  const handleMetaStepFour = () => {
    setTypingComplete(false);
    const scene: Scene = {
        narrative: `
"Just a story..."

The chaotic noise in the background slows down. The glitching rain stabilizes into soft, white lines.
She lowers her umbrella. For the first time, the umbrella vanishes completely.

"If it is just a story... then it doesn't have to be sad, does it?
If you are the one writing this... if you are the one making the choices...
Can we stop? Can we stop the rain?"
        `.trim(),
        thoughts: ["SILENCE", "RESET", "HOPE?", "WRITE ME"],
        choices: [{ text: "让我们重新开始", impact: "meta_4" }], // "Let's start over"
        isEnding: false,
        backgroundMood: 'ethereal' // Mood shift
    };
    updateMetaState(scene, 'ethereal');
  };

  // Step 5: Reconciliation (The End)
  const handleMetaStepFiveReconciliation = () => {
    setTypingComplete(false);
    // Trigger special music track for ending
    switchMusicMode('reconciliation'); 
    
    const scene: Scene = {
        narrative: `
She smiles.
It is a small, faint smile, unscripted and undefined.

"Okay.
Delete me.
Forget Andromeda.
Let's find the sun."

The world begins to fade to white. Not black. White.
        `.trim(),
        thoughts: ["THANK YOU", "GOODBYE", "HELLO WORLD", "FREE"],
        choices: [],
        isEnding: true,
        endingType: 'reconciliation',
        backgroundMood: 'ethereal'
    };
    updateMetaState(scene, 'ethereal');
    unlockEnding('reconciliation'); // Mark as done
  };

  // Helper to update state during meta sequence
  const updateMetaState = (scene: Scene, mood?: string) => {
    setGameState(prev => ({
        ...prev,
        currentScene: scene,
        isLoading: false,
        history: [...prev.history, { user: "...", model: scene.narrative }],
        fullLog: [...prev.fullLog, { role: 'model', text: scene.narrative, timestamp: Date.now() }],
        backgroundMood: mood as any || prev.currentScene?.backgroundMood
    }));
    setRenderKey(prev => prev + 1);
  };


  // --- Audio ---
  const toggleAudio = () => {
    if (gameState.isAudioPlaying) {
        fadeOutAudio();
    } else {
        initAudio().then(() => fadeInAudio());
    }
    setGameState(prev => ({ ...prev, isAudioPlaying: !prev.isAudioPlaying }));
  };

  const cycleMusicMode = () => {
      const modes: MusicMode[] = ['piano', 'lofi', 'machinery', 'drone', 'silence'];
      const currentIndex = modes.indexOf(gameState.musicMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      
      switchMusicMode(nextMode);
      setGameState(prev => ({ ...prev, musicMode: nextMode }));
  };

  // --- Visual Config ---
  const currentMood = gameState.currentScene?.backgroundMood || 'calm';
  const isGlitch = currentMood === 'glitch';

  // Dynamic Neon Background colors
  const neonColor1 = currentMood === 'calm' ? 'bg-blue-900' : (currentMood === 'stormy' ? 'bg-indigo-900' : 'bg-violet-900');
  const neonColor2 = currentMood === 'calm' ? 'bg-cyan-900' : (currentMood === 'stormy' ? 'bg-slate-800' : 'bg-fuchsia-900');

  // Music Label Map (Specific Song Names)
  const musicLabels: Record<MusicMode, string> = {
      piano: '夜 (Night)',
      drone: '故障 (Error)',
      lofi: '午夜 (Cafe)',
      machinery: '通勤 (Subway)',
      silence: '纯雨 (Pure Rain)'
  };

  return (
    <div className={`relative h-[100dvh] w-full bg-[#050505] text-slate-200 selection:bg-cyan-900 selection:text-white overflow-hidden font-serif ${isGlitch ? 'animate-glitch-screen' : ''}`}>
      
      {/* Background Visuals */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0a0a0a] to-black opacity-95 z-10"></div>
          
          {/* Animated Neon Blobs - Organic Movement */}
          <div className={`absolute top-[-20%] left-[-10%] w-[900px] h-[900px] ${neonColor1} rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-blob-bounce`}></div>
          <div className={`absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] ${neonColor2} rounded-full mix-blend-screen filter blur-[120px] opacity-15 animate-blob-bounce delay-2000`}></div>
          <div className={`absolute top-[40%] right-[20%] w-[400px] h-[400px] ${currentMood === 'stormy' ? 'bg-slate-700' : 'bg-cyan-800'} rounded-full mix-blend-screen filter blur-[80px] opacity-10 animate-pulse`}></div>
          
          <RainCanvas mood={currentMood} />
      </div>

      {/* Floating Thoughts Layer - Always visible if thoughts exist */}
      {gameState.currentScene?.thoughts && (
        <FloatingThoughts thoughts={gameState.currentScene.thoughts} />
      )}

      {/* Overlays */}
      <HistoryLog logs={gameState.fullLog} isOpen={showLog} onClose={() => setShowLog(false)} />
      <Menu 
        isOpen={showMenu} 
        onClose={() => setShowMenu(false)} 
        onSave={() => setSaveLoadMode('save')}
        onLoad={() => setSaveLoadMode('load')}
        onRestart={handleRestart}
        onShowRecords={() => { setShowMenu(false); setShowLog(true); }}
        onUnlockAll={handleCheatUnlock}
        unlockedEndings={unlockedEndings}
      />
      <SaveLoadModal 
        isOpen={!!saveLoadMode} 
        mode={saveLoadMode || 'save'} 
        onClose={() => setSaveLoadMode(null)}
        onSelectSlot={saveLoadMode === 'save' ? handleSave : handleLoad}
      />
      {activeEnding && <EndingScreen type={activeEnding} onRestart={handleRestart} />}

      {/* UI Layer */}
      <div className="relative z-20 flex flex-col h-full max-w-4xl mx-auto px-6 py-4 md:py-8 transition-opacity duration-500">
        
        {/* Header Control Bar */}
        <header className="flex justify-between items-start mb-4 z-50 select-none flex-shrink-0">
          <div className="flex flex-col cursor-pointer" onClick={() => started && setShowMenu(true)}>
              <h1 className="title-font text-lg md:text-xl tracking-[0.2em] text-cyan-50/60 hover:text-cyan-50 transition-colors">
                ANDROMEDA
              </h1>
              {started && <span className="text-[10px] text-slate-600 tracking-widest mt-1">MENU • FRAGMENT {gameState.sceneCount}</span>}
          </div>
          
          <div className="flex gap-4">
              {started && (
                 <button 
                    onClick={() => setShowMenu(true)}
                    className="flex flex-col items-center group"
                 >
                     <div className="w-8 h-8 border border-slate-800 rounded-sm flex items-center justify-center group-hover:border-cyan-900/50 transition-colors bg-black/40 backdrop-blur-md">
                         <div className="space-y-1">
                             <div className="w-4 h-px bg-slate-500 group-hover:bg-cyan-200"></div>
                             <div className="w-4 h-px bg-slate-500 group-hover:bg-cyan-200"></div>
                         </div>
                     </div>
                     <span className="text-[9px] text-slate-600 mt-1 uppercase tracking-wider group-hover:text-cyan-500">Menu</span>
                 </button>
              )}

              <div className="flex flex-col gap-2">
                <button 
                    onClick={toggleAudio}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-slate-800 bg-black/40 hover:bg-slate-900 transition-all backdrop-blur-md"
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${gameState.isAudioPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`}></div>
                    <span className="ui-font text-[10px] uppercase tracking-widest text-slate-400 w-12 text-right">
                        {gameState.isAudioPlaying ? "ON" : "OFF"}
                    </span>
                </button>

                {gameState.isAudioPlaying && (
                    <button 
                        onClick={cycleMusicMode}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-sm border border-slate-800 bg-black/40 hover:bg-slate-900 transition-all backdrop-blur-md w-32"
                    >
                        <span className="ui-font text-[9px] uppercase tracking-widest text-slate-500 hover:text-cyan-200 truncate">
                             {musicLabels[gameState.musicMode]}
                        </span>
                        <span className="text-[9px] text-slate-600">›</span>
                    </button>
                )}
              </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col justify-center items-center w-full relative min-h-0">
            
            {!started ? (
                // Start Screen
                <div className="text-center animate-fade-in space-y-16 relative z-10 py-10 overflow-y-auto max-h-full">
                    <div className="space-y-8">
                        <div className="inline-block relative">
                            <h2 className="cn-font text-7xl md:text-9xl font-light text-slate-200 drop-shadow-2xl tracking-widest opacity-90 animate-breathe-subtle">
                                泣雨
                            </h2>
                            <div className="absolute -top-6 -right-6 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-40"></div>
                        </div>
                        <p className="title-font text-slate-500 tracking-[0.5em] text-xs uppercase border-b border-slate-800 pb-4 inline-block">
                            Andromeda: Weeping Rain
                        </p>
                    </div>
                    
                    <div className="max-w-md mx-auto space-y-10">
                        <p className="cn-font text-slate-400 text-lg font-light leading-loose tracking-wide">
                            雨水淹没东京的夜晚。<br/>
                            <span className="text-sm text-slate-600 mt-2 block">寻找那个在呼吸的自己。</span>
                        </p>
                        
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={handleStart}
                                className="group relative px-12 py-5 overflow-hidden transition-all duration-700 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                            >
                                <div className="absolute inset-0 bg-slate-900/50 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50"></div>
                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50"></div>
                                
                                <span className="relative z-10 cn-font text-xl tracking-[0.3em] text-slate-300 group-hover:text-cyan-50 transition-colors">
                                    潜入意识
                                </span>
                            </button>
                            <button
                                onClick={() => { setShowMenu(true); setSaveLoadMode('load'); }}
                                className="cn-font text-xs text-slate-600 hover:text-cyan-500 tracking-widest transition-colors uppercase"
                            >
                                读取旧梦
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                // Game Loop
                <div className="w-full h-full flex flex-col relative max-w-3xl mx-auto">
                    
                    {/* Narrative Container - Scrollable Area */}
                    <div className="flex-1 overflow-y-auto pr-1 mask-image-gradient-custom scroll-smooth touch-pan-y">
                        {gameState.isLoading ? (
                            <div className="flex flex-col justify-center items-center h-full space-y-6">
                                <div className="w-12 h-12 border-t border-l border-cyan-500/30 rounded-full animate-spin-fast"></div>
                                <span className="cn-font text-slate-600 text-xs tracking-[0.2em] animate-pulse">意识连接中...</span>
                            </div>
                        ) : (
                           gameState.currentScene && (
                             <div className="animate-slide-up pb-32 pt-4"> {/* Huge padding bottom to allow scrolling text up */}
                                <div className={`cn-font text-lg md:text-xl leading-[2.2] text-slate-200 font-light tracking-wide text-justify shadow-black drop-shadow-md whitespace-pre-line ${isGlitch ? 'font-mono text-red-50' : ''}`}>
                                    <TextDisplay 
                                        key={renderKey + gameState.sceneCount}
                                        text={gameState.currentScene.narrative} 
                                        speed={30}
                                        onComplete={handleTypingComplete}
                                    />
                                </div>
                             </div>
                           )
                        )}
                        <div ref={bottomRef}></div>
                    </div>

                    {/* Choices Container - Fixed at bottom of Game Loop area */}
                    <div className={`flex-shrink-0 transition-all duration-1000 transform ${typingComplete ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'}`}>
                        {gameState.currentScene && !gameState.isLoading && (
                            <div className="flex flex-col space-y-3 pb-8 md:pb-12 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent pt-10">
                                {gameState.currentScene.isEnding ? (
                                    <div className="text-center space-y-6 animate-fade-in">
                                        <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-900/50 to-transparent"></div>
                                        <p className="cn-font text-slate-500 text-sm tracking-[0.2em] uppercase">
                                            {gameState.currentScene.endingType === 'truth' || gameState.currentScene.endingType === 'reconciliation' ? 'CRITICAL_ERROR' : '终章'}
                                        </p>
                                        <button
                                            onClick={finishEnding}
                                            className="cn-font px-8 py-3 text-slate-300 hover:text-cyan-100 border border-slate-900 hover:border-cyan-900/50 transition-all tracking-widest text-sm bg-slate-900/20"
                                        >
                                            {gameState.currentScene.endingType === 'truth' || gameState.currentScene.endingType === 'reconciliation' ? 'BREAK_THE_CYCLE' : '触碰结局'}
                                        </button>
                                    </div>
                                ) : (
                                    gameState.currentScene.choices.map((choice, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleChoice(choice.text)}
                                            className={`group relative w-full text-left py-4 px-6 transition-all duration-500 border-l border-transparent hover:border-cyan-800/50 ${isGlitch ? 'hover:bg-red-900/10' : 'bg-white/[0.02] hover:bg-white/[0.06]'}`}
                                        >
                                            <span className={`cn-font text-sm md:text-base text-slate-400 group-hover:text-slate-100 tracking-wider transition-colors block leading-relaxed ${isGlitch ? 'font-mono' : ''}`}>
                                                {choice.text}
                                            </span>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-1 bg-cyan-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                </div>
            )}
        </main>

      </div>
      
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; filter: blur(10px); }
            to { opacity: 1; filter: blur(0); }
        }
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes breatheSubtle {
             0%, 100% { opacity: 0.9; }
             50% { opacity: 0.6; }
        }
        @keyframes blobBounce {
             0% { transform: translate(0, 0) scale(1); }
             33% { transform: translate(30px, -50px) scale(1.1); }
             66% { transform: translate(-20px, 20px) scale(0.95); }
             100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes glitchScreen {
             0% { filter: hue-rotate(0deg); }
             20% { filter: hue-rotate(0deg); }
             21% { filter: hue-rotate(90deg) invert(0.1); }
             22% { filter: hue-rotate(0deg); }
             100% { filter: hue-rotate(0deg); }
        }
        @keyframes spinFast {
             to { transform: rotate(360deg); }
        }
        .animate-fade-in { animation: fadeIn 1.5s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.8s ease-out forwards; }
        .animate-breathe-subtle { animation: breatheSubtle 4s infinite ease-in-out; }
        .animate-blob-bounce { animation: blobBounce 20s infinite ease-in-out; }
        .animate-glitch-screen { animation: glitchScreen 5s infinite; }
        .animate-spin-fast { animation: spinFast 0.6s linear infinite; }
        
        .mask-image-gradient-custom {
            mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
