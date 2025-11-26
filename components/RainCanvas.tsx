
import React, { useEffect, useRef } from 'react';

interface RainProps {
  mood: 'calm' | 'stormy' | 'ethereal' | 'glitch';
}

const RainCanvas: React.FC<RainProps> = ({ mood }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    // Increased opacity/visibility values
    const config = {
      calm: { count: 600, speedBase: 10, wind: -0.5, color: '190, 210, 230' },
      stormy: { count: 2200, speedBase: 35, wind: -6, color: '180, 200, 220' }, 
      ethereal: { count: 500, speedBase: 4, wind: 0, color: '120, 255, 240' },
      glitch: { count: 400, speedBase: 0, wind: 0, color: '0, 255, 100' },
    };

    const currentConfig = config[mood];

    // Particle System
    interface Drop {
      x: number;
      y: number;
      z: number; // Depth (0.1 to 1)
      l: number; // Length
      ys: number; // Speed
    }

    const drops: Drop[] = [];
    
    const initDrops = () => {
      drops.length = 0;
      for (let i = 0; i < currentConfig.count; i++) {
        const z = Math.random() * 0.8 + 0.2;
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: z,
          l: Math.random() * 25 + 15, // Longer drops
          ys: (Math.random() * 5 + currentConfig.speedBase) * z
        });
      }
    };

    initDrops();

    let frame = 0;

    const draw = () => {
      // Clear with trail effect for glitch, otherwise standard clear
      if (mood === 'glitch' && Math.random() > 0.9) {
          ctx.fillStyle = 'rgba(5, 5, 5, 0.1)';
          ctx.fillRect(0,0,w,h);
      } else {
          ctx.clearRect(0, 0, w, h);
      }
      
      frame++;

      // Draw Drops
      ctx.lineCap = 'round';

      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];

        // Glitch Movement
        if (mood === 'glitch') {
            if (Math.random() > 0.95) d.x += (Math.random() - 0.5) * 50;
            if (frame % 60 < 30) d.y += d.ys * 0.2; // Stutter time
        } else {
            d.y += d.ys;
            d.x += currentConfig.wind * d.z;
        }

        // Reset
        if (d.y > h) {
          d.y = -d.l;
          d.x = Math.random() * w;
        }
        if (d.x > w) d.x = 0;
        if (d.x < 0) d.x = w;

        // Draw - More visible strokes
        const alpha = Math.min(d.z * 0.8, 1); // Higher opacity
        ctx.strokeStyle = `rgba(${currentConfig.color}, ${alpha})`;
        ctx.lineWidth = 1.5 * d.z; // Thicker lines for closer drops

        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + (currentConfig.wind * d.z), d.y + d.l * d.z);
        ctx.stroke();
      }

      // Fog / Atmosphere Gradient
      if (mood !== 'glitch') {
          const gradient = ctx.createLinearGradient(0, h * 0.5, 0, h);
          gradient.addColorStop(0, 'rgba(5, 5, 5, 0)');
          gradient.addColorStop(1, 'rgba(5, 5, 5, 0.8)'); // Slightly less intense fog to show more rain
          ctx.fillStyle = gradient;
          ctx.fillRect(0, h * 0.5, w, h * 0.5);
      }

      // Glitch Artifacts (Visual only, no flash)
      if (mood === 'glitch' && Math.random() > 0.8) {
          const gx = Math.random() * w;
          const gy = Math.random() * h;
          const gw = Math.random() * 100;
          const gh = Math.random() * 5;
          ctx.fillStyle = `rgba(0, 255, 100, ${Math.random() * 0.2})`;
          ctx.fillRect(gx, gy, gw, gh);
      }

      requestAnimationFrame(draw);
    };

    const animId = requestAnimationFrame(draw);

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initDrops();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mood]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 mix-blend-screen opacity-100" // Increased opacity
    />
  );
};

export default RainCanvas;
