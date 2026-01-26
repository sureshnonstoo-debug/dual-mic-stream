import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Button } from './ui/button';

interface AudioControlsProps {
  label: string;
  color: 'left' | 'right';
  isPlaying: boolean;
  isMuted: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
}

export function AudioControls({
  label,
  color,
  isPlaying,
  isMuted,
  onTogglePlay,
  onToggleMute,
}: AudioControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="audio-control"
        size="icon"
        onClick={onTogglePlay}
        className={isPlaying ? (color === 'left' ? 'border-mic-left bg-mic-left/20' : 'border-mic-right bg-mic-right/20') : ''}
      >
        {isPlaying ? (
          <Pause className={`w-4 h-4 ${color === 'left' ? 'text-mic-left' : 'text-mic-right'}`} />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>
      
      <Button
        variant="audio-control"
        size="icon"
        onClick={onToggleMute}
        className={isMuted ? 'border-destructive bg-destructive/20' : ''}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 text-destructive" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </Button>
      
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
