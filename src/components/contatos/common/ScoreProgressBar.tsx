import React from 'react';
import { cn } from '@/lib/utils';
import { Lock, Unlock } from 'lucide-react';

interface ScoreProgressBarProps {
  score: number;
  minScore: number;
  maxScore?: number;
  showLabel?: boolean;
  showStatus?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({
  score,
  minScore,
  maxScore = 140,
  showLabel = true,
  showStatus = true,
  size = 'md',
  className
}) => {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const isUnlocked = score >= minScore;
  
  const getColor = () => {
    if (score >= minScore) return 'bg-green-500';
    if (score >= minScore * 0.7) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">
            {score}/{maxScore} pts
          </span>
          {showStatus && (
            <span className={cn(
              'flex items-center gap-1 font-medium',
              isUnlocked ? 'text-green-600' : 'text-red-600'
            )}>
              {isUnlocked ? (
                <><Unlock className="w-3 h-3" /> Liberado</>
              ) : (
                <><Lock className="w-3 h-3" /> Bloqueado</>
              )}
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full transition-all duration-500 rounded-full', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ScoreProgressBar;
