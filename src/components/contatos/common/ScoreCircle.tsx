import React from 'react';
import { cn } from '@/lib/utils';

interface ScoreCircleProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  maxScore = 140,
  size = 'md',
  showPercentage = true,
  className
}) => {
  const percentage = Math.min(Math.round((score / maxScore) * 100), 100);
  const circumference = 2 * Math.PI * 16; // r=16
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 70) return 'stroke-green-500';
    if (percentage >= 40) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const textSizeClasses = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
    lg: 'text-xs'
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size], className)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
        <circle
          className="stroke-muted"
          cx="20"
          cy="20"
          r="16"
          fill="none"
          strokeWidth="3"
        />
        <circle
          className={cn('transition-all duration-500', getColor())}
          cx="20"
          cy="20"
          r="16"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      {showPercentage && (
        <span className={cn('absolute font-bold text-foreground', textSizeClasses[size])}>
          {percentage}%
        </span>
      )}
    </div>
  );
};

export default ScoreCircle;
