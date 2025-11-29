import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricBoxProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  className?: string;
}

export const MetricBox = ({ icon: Icon, value, label, className }: MetricBoxProps) => {
  return (
    <div className={cn(
      'bg-gradient-to-br from-background via-background to-accent/5',
      'backdrop-blur-xl border border-border/40',
      'rounded-xl p-4',
      'shadow-sm hover:shadow-md',
      'transition-all duration-300 ease-out',
      'group',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#9C1E1E]/10 border border-[#9C1E1E]/20 group-hover:bg-[#9C1E1E]/20 transition-colors">
          <Icon className="w-4 h-4 text-[#9C1E1E]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-1 truncate">{label}</p>
          <p className="text-lg font-semibold text-foreground truncate">{value}</p>
        </div>
      </div>
    </div>
  );
};
