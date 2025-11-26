
import React, { useEffect, useState } from 'react';

interface FloatingThoughtsProps {
  thoughts: string[];
}

interface ThoughtItem {
  id: number;
  text: string;
  top: number;
  left: number;
  delay: number;
  duration: number;
}

const FloatingThoughts: React.FC<FloatingThoughtsProps> = ({ thoughts }) => {
  const [items, setItems] = useState<ThoughtItem[]>([]);

  useEffect(() => {
    // Regenerate positions when thoughts change
    if (!thoughts || thoughts.length === 0) return;

    const newItems = thoughts.map((text, i) => ({
      id: Math.random(),
      text,
      // Random positions avoiding the exact center (where main text is)
      top: Math.random() > 0.5 ? Math.random() * 30 : 60 + Math.random() * 30, 
      left: Math.random() * 80 + 10,
      delay: i * 1.5,
      duration: 8 + Math.random() * 4
    }));

    setItems(newItems);
  }, [thoughts]);

  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute cn-font text-slate-500/40 text-sm md:text-lg tracking-[0.2em] italic whitespace-nowrap animate-float-fade"
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
          }}
        >
          {item.text}
        </div>
      ))}
      <style>{`
        @keyframes floatFade {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 0.6; transform: translateY(0); }
          80% { opacity: 0.4; transform: translateY(-10px); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        .animate-float-fade {
          animation-name: floatFade;
          animation-fill-mode: both;
          animation-timing-function: ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default FloatingThoughts;
