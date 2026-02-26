import React from 'react';
import { cn } from '@/lib/utils';

interface TimeDisplayProps {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds?: number;
  isRunning?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  hours,
  minutes,
  seconds,
  milliseconds,
  isRunning = false,
  size = 'lg',
  className,
}) => {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');

  const sizes = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-6xl md:text-7xl',
  };

  return (
    <div
      className={cn(
        'font-mono font-light tracking-wider text-foreground select-none transition-opacity duration-300',
        sizes[size],
        isRunning && 'animate-pulse',
        className
      )}
    >
      <span>{pad(hours)}</span>
      <span className="text-muted-foreground/50">:</span>
      <span>{pad(minutes)}</span>
      <span className="text-muted-foreground/50">:</span>
      <span>{pad(seconds)}</span>
      {milliseconds !== undefined && (
        <>
          <span className="text-muted-foreground/30">.</span>
          <span className="text-muted-foreground/70 text-[0.6em]">{pad(milliseconds)}</span>
        </>
      )}
    </div>
  );
};
