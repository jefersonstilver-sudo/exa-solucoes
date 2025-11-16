import { useEffect } from 'react';
import { useEditorState } from '@/hooks/video-editor/useEditorState';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';

export const PlaybackControls = () => {
  const {
    isPlaying,
    currentTime,
    duration,
    setIsPlaying,
    setCurrentTime,
  } = useEditorState();

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const newTime = currentTime + 0.033; // ~30fps
      if (newTime >= duration) {
        setIsPlaying(false);
        setCurrentTime(duration);
      } else {
        setCurrentTime(newTime);
      }
    }, 33);

    return () => clearInterval(interval);
  }, [isPlaying, duration, setCurrentTime, setIsPlaying]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  return (
    <div className="h-20 border-t bg-background flex items-center gap-4 px-6">
      {/* Play Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        <Button
          variant="default"
          size="icon"
          className="h-10 w-10"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentTime(Math.min(duration, currentTime + 1))}
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Time Display */}
      <div className="text-sm font-mono text-muted-foreground min-w-[100px]">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      {/* Seek Bar */}
      <div className="flex-1 flex items-center gap-3">
        <Slider
          value={[currentTime]}
          onValueChange={handleSeek}
          max={duration}
          step={0.1}
          className="flex-1"
        />
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 min-w-[150px]">
        <Button variant="ghost" size="icon">
          <Volume2 className="h-4 w-4" />
        </Button>
        <Slider
          defaultValue={[80]}
          max={100}
          step={1}
          className="w-24"
        />
      </div>
    </div>
  );
};
