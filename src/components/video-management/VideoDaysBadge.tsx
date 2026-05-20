import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { buildDaysResult, VideoDaysInput, DaysSeverity } from '@/utils/videoDisplayDays';
import { cn } from '@/lib/utils';

interface VideoDaysBadgeProps extends VideoDaysInput {
  className?: string;
  size?: 'sm' | 'md';
  /** Quando true, renderiza apenas o pill (sem posicionamento absoluto) */
  inline?: boolean;
}

const severityClass: Record<DaysSeverity, string> = {
  fresh: 'bg-emerald-500 text-white ring-emerald-200',
  aging: 'bg-red-400 text-white ring-red-200',
  stale: 'bg-red-700 text-white ring-red-300 animate-pulse',
};

export const VideoDaysBadge: React.FC<VideoDaysBadgeProps> = ({
  className,
  size = 'sm',
  inline = false,
  ...input
}) => {
  const result = buildDaysResult(input);
  if (!result) return null;

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  const positionClass = inline
    ? ''
    : 'absolute top-2 left-2 z-10 shadow-md';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full font-semibold ring-2 ring-white/70 cursor-help select-none',
              severityClass[result.severity],
              sizeClass,
              positionClass,
              className,
            )}
            aria-label={result.tooltip}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            {result.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {result.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VideoDaysBadge;
