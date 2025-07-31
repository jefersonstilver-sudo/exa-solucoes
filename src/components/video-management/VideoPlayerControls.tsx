
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Download,
  RotateCcw
} from 'lucide-react';

interface VideoPlayerControlsProps {
  title?: string;
  onDownload?: () => void;
  toggleFullscreen: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
  currentTime: number;
  formatTime: (time: number) => string;
  progress: number;
  handleProgressChange: (value: number[]) => void;
  duration: number;
  restart: () => void;
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  handleVolumeChange: (value: number[]) => void;
  showCenterButton?: boolean;
}

export const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  title,
  onDownload,
  toggleFullscreen,
  isPlaying,
  togglePlay,
  currentTime,
  formatTime,
  progress,
  handleProgressChange,
  duration,
  restart,
  isMuted,
  volume,
  toggleMute,
  handleVolumeChange,
  showCenterButton = true
}) => {
  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 flex flex-col justify-between p-4 transition-opacity duration-300">
      {/* Top Controls */}
      <div className="flex justify-between items-start">
        {title && (
          <h3 className="text-white font-medium text-sm truncate max-w-[70%]">
            {title}
          </h3>
        )}
        <div className="flex space-x-2">
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Center Play Button */}
      {showCenterButton && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlay}
            className="text-white hover:bg-white/20 h-16 w-16 rounded-full p-0 transition-opacity duration-300"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center space-x-3">
          <span className="text-white text-xs font-mono">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[progress]}
            onValueChange={handleProgressChange}
            max={100}
            step={0.1}
            className="flex-1"
          />
          <span className="text-white text-xs font-mono">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={restart}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              
              <div className="w-20">
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
