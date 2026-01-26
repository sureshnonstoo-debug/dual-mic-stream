import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  data: Int16Array;
  color: 'left' | 'right';
  label: string;
  rms: number;
}

export function WaveformVisualizer({ data, color, label, rms }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'hsla(220, 15%, 25%, 0.5)';
    ctx.lineWidth = 1;
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Draw waveform
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (color === 'left') {
      gradient.addColorStop(0, 'hsla(175, 80%, 50%, 0.8)');
      gradient.addColorStop(0.5, 'hsla(175, 80%, 50%, 1)');
      gradient.addColorStop(1, 'hsla(175, 80%, 50%, 0.8)');
    } else {
      gradient.addColorStop(0, 'hsla(280, 70%, 60%, 0.8)');
      gradient.addColorStop(0.5, 'hsla(280, 70%, 60%, 1)');
      gradient.addColorStop(1, 'hsla(280, 70%, 60%, 0.8)');
    }

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const normalized = data[i] / 32768;
      const y = centerY - (normalized * centerY * 0.9);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();

    // Draw glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = color === 'left' ? 'hsl(175, 80%, 50%)' : 'hsl(280, 70%, 60%)';
    ctx.stroke();
    ctx.shadowBlur = 0;

  }, [data, color]);

  // Calculate level percentage for meter
  const level = Math.min((rms / 10000) * 100, 100);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              color === 'left' ? 'bg-mic-left' : 'bg-mic-right'
            } ${level > 5 ? 'animate-pulse-glow' : ''}`}
          />
          <span className="font-mono text-sm text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          RMS: {rms.toFixed(0)}
        </span>
      </div>
      
      <div className="relative waveform-container rounded-lg overflow-hidden border border-border">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={120}
          className="w-full h-[120px] relative z-10"
        />
      </div>

      {/* Level Meter */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-75 rounded-full"
          style={{ 
            width: `${level}%`,
            background: level > 80 
              ? 'hsl(var(--meter-red))' 
              : level > 60 
                ? 'hsl(var(--meter-yellow))' 
                : 'hsl(var(--meter-green))'
          }}
        />
      </div>
    </div>
  );
}
