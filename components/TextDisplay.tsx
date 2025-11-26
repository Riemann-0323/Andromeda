
import React, { useEffect, useState, useRef } from 'react';

interface TextDisplayProps {
  text: string;
  onComplete?: () => void;
  speed?: number;
}

const TextDisplay: React.FC<TextDisplayProps> = ({ text, onComplete, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const isSpeedupPressed = useRef(false);

  // Clean the text of markdown asterisks immediately
  const cleanText = React.useMemo(() => text.replace(/\*\*/g, ''), [text]);

  useEffect(() => {
    // Reset state when new text arrives
    setDisplayedText('');
    indexRef.current = 0;
    
    if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
    }

    const typeChar = () => {
      if (indexRef.current < cleanText.length) {
        setDisplayedText(cleanText.slice(0, indexRef.current + 1));
        indexRef.current++;
        
        // If speedup is pressed, delay is 1ms (near instant), else normal speed
        const currentDelay = isSpeedupPressed.current ? 1 : speed;
        timeoutRef.current = window.setTimeout(typeChar, currentDelay);
      } else {
        if (onComplete) onComplete();
      }
    };

    // Start typing
    typeChar();

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [cleanText, speed, onComplete]);

  // Listen for Control or Meta (Command) keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
          isSpeedupPressed.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
          isSpeedupPressed.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="text-lg md:text-xl leading-relaxed text-slate-200 drop-shadow-md whitespace-pre-wrap">
      {displayedText}
      <span className="animate-pulse inline-block w-2 h-4 bg-slate-400 ml-1 align-middle opacity-50"></span>
      
      {/* Visual hint for speedup */}
      <div className="fixed bottom-4 right-4 text-[10px] text-slate-600 uppercase tracking-widest opacity-0 hover:opacity-100 transition-opacity select-none pointer-events-none md:pointer-events-auto">
          Hold CTRL/CMD to Skip
      </div>
    </div>
  );
};

export default TextDisplay;
