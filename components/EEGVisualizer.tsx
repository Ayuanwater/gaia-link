import React, { useRef, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { BrainwaveState } from '../types';

interface EEGVisualizerProps {
  state: BrainwaveState;
  height?: number;
  showStatus?: boolean;
  isRealDevice?: boolean;
  rawData?: number[]; // Array of raw EEG integers
}

export const EEGVisualizer: React.FC<EEGVisualizerProps> = ({ 
  state, 
  height = 100, 
  showStatus = false, 
  isRealDevice = false,
  rawData = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const getColor = (s: BrainwaveState) => {
      switch(s) {
        case 'CONNECTING': return '#d6d3d1';
        case 'CALM': return '#4ade80'; // Green
        case 'FOCUS': return '#60a5fa'; // Blue
        case 'STRESSED': return '#ef4444'; // Red
        case 'IDLE': 
        default: return '#78716c'; // Stone
      }
    };

    const render = () => {
      if (!canvas) return;
      // Handle resizing
      const { width: rectWidth, height: rectHeight } = canvas.getBoundingClientRect();
      if (canvas.width !== rectWidth || canvas.height !== rectHeight) {
          canvas.width = rectWidth;
          canvas.height = rectHeight;
      }
      
      const width = canvas.width;
      const height = canvas.height;
      const color = getColor(state);
      
      ctx.clearRect(0, 0, width, height);
      
      if (state === 'CONNECTING') {
         // Scanning line effect (simulated solely for UI state indication, not data)
         ctx.strokeStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(time * 0.05))})`;
         ctx.lineWidth = 1;
         ctx.beginPath();
         ctx.moveTo(0, height/2);
         ctx.lineTo(width, height/2);
         ctx.stroke();
         time += 1;
      } else {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = color;
          ctx.shadowBlur = 5;
          ctx.shadowColor = color;
          ctx.beginPath();

          // Use provided rawData or default to empty
          // Accessing the mutable array reference directly for performance
          const buffer = rawData; 
          
          if (buffer && buffer.length > 1) {
             // We display the data available.
             // Auto-scaling: We assume a typical EEG range of +/- 1000uV for full height.
             // If the signal is weak, it will look small (which is realistic).
             // Center is height / 2.
             const scale = height / 2000; 

             // We spread the data across the width of the canvas
             // If buffer is 512 long, and width is 300, we downsample or squeeze.
             // Simple approach: linear distribution
             const step = width / (buffer.length - 1);

             for (let i = 0; i < buffer.length; i++) {
                 const x = i * step;
                 // Invert Y axis so positive is up
                 // Clamp values loosely to avoid drawing way off canvas
                 let val = buffer[i];
                 const y = (height / 2) - (val * scale);
                 
                 if (i === 0) ctx.moveTo(x, y);
                 else ctx.lineTo(x, y);
             }
          } else {
             // Flatline
             ctx.moveTo(0, height / 2);
             ctx.lineTo(width, height / 2);
          }
          
          ctx.stroke();
          
          // Reset shadow for next frame or other operations
          ctx.shadowBlur = 0;
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [state, isRealDevice, rawData, height]); // rawData ref dependency is fine

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