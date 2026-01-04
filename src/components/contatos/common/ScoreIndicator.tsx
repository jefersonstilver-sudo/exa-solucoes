import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ScoreIndicatorProps {
  score: number;
  maxScore?: number;
  minScore?: number;
  blocked?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({
  score,
  maxScore = 100,
  minScore = 70,
  blocked = false,
  size = 'md',
  showLabel = false
}) => {
  const percentage = Math.min((score / maxScore) * 100, 100);
  const isAboveMinimum = score >= minScore;

  const sizeClasses = {
    xs: 'w-6 h-6 text-[8px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm'
  };

  const getColor = () => {
    if (blocked) return 'text-red-500';
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 60) return 'text-yellow-500';
    if (percentage >= 40) return 'text-orange-500';
    return 'text-red-400';
  };

  const getGradient = () => {
    if (blocked) return 'from-red-500 to-red-600';
    if (percentage >= 80) return 'from-green-400 to-green-600';
    if (percentage >= 60) return 'from-yellow-400 to-yellow-600';
    if (percentage >= 40) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-500';
  };

  if (blocked) {
    return (
      <div className={cn(
        'relative flex items-center justify-center rounded-full bg-red-100',
        sizeClasses[size]
      )}>
        <AlertTriangle className={cn(
          'text-red-500',
          size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'
        )} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'relative flex items-center justify-center rounded-full bg-gradient-to-br shadow-sm',
        sizeClasses[size],
        getGradient()
      )}>
        <div className={cn(
          'absolute inset-[2px] rounded-full bg-background flex items-center justify-center font-bold',
          getColor()
        )}>
          {score}
        </div>
      </div>
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn('font-medium', getColor())}>
            {score} pts
          </span>
          {isAboveMinimum ? (
            <span className="text-[10px] text-green-600 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" />
              Liberado
            </span>
          ) : (
            <span className="text-[10px] text-red-500 flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" />
              Bloqueado ({minScore - score} pts faltam)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreIndicator;
