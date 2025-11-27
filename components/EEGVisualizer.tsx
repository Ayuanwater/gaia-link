import React, { useRef, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { BrainwaveState } from '../types';

interface EEGVisualizerProps {
  state: BrainwaveState;
  height?: number;
  showStatus?: boolean;
  isRealDevice?: boolean;
}

export const EEGVisualizer: React.FC<EEGVisualizerProps> = ({ 
  state, 
  height = 100, 
  showStatus = false, 
  isRealDevice = false 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Configuration based on state
    const getConfig = (s: BrainwaveState) => {
      switch(s) {
        case 'CONNECTING': return { speed: 0.05, amplitude: 5, frequency: 0.05, color: '#d6d3d1' };
        case 'CALM': return { speed: 0.02, amplitude: 20, frequency: 0.01, color: '#4ade80' }; // Green
        case 'FOCUS': return { speed: 0.05, amplitude: 40, frequency: 0.03, color: '#60a5fa' }; // Blue
        case 'STRESSED': return { speed: 0.08, amplitude: 60, frequency: 0.08, color: '#ef4444' }; // Red
        case 'IDLE': default: return { speed: 0.01, amplitude: 5, frequency: 0.005, color: '#78716c' }; // Grey
      }
    };

    const render = () => {
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      
      const config = getConfig(state);
      
      ctx.clearRect(0, 0, width, height);
      
      if (state === 'CONNECTING') {
         // Scanning line effect
         ctx.strokeStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(time * 2))})`;
         ctx.lineWidth = 1;
         ctx.beginPath();
         ctx.moveTo(0, height/2);
         ctx.lineTo(width, height/2);
         ctx.stroke();
      } else {
          ctx.lineWidth = 2;
          ctx.strokeStyle = config.color;
          ctx.beginPath();

          for (let x = 0; x < width; x++) {
            // Superposition of sine waves to look like EEG
            const y1 = Math.sin(x * config.frequency + time) * config.amplitude;
            const y2 = Math.sin(x * (config.frequency * 2.5) + time * 1.5) * (config.amplitude * 0.5);
            // Add "Real" jitter if device is connected to simulate raw data noise
            const noise = (Math.random() - 0.5) * (state === 'STRESSED' ? 10 : 2) * (isRealDevice ? 1.5 : 1);
            
            const y = height / 2 + y1 + y2 + noise;
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          
          ctx.stroke();
          
          // Glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = config.color;
      }
      
      time += config.speed;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [state, isRealDevice]);

  return (
    <div className="relative w-full">
      <canvas 
        ref={canvasRef} 
        className="w-full rounded-lg border border-nature-earth/30 bg-nature-dark/50" 
        style={{ height }} 
      />
      {showStatus && (
        <div className="absolute top-1 right-2 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 text-nature-mist/70">
          {state === 'IDLE' || state === 'CONNECTING' ? <WifiOff size={10}/> : <Wifi size={10} className="text-nature-moss"/>}
          {isRealDevice ? 'BLUETOOTH LINK' : 'SIMULATION'}
        </div>
      )}
    </div>
  );
};