import React from 'react';
import { Sparkles, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  title?: string;
  content: string;
  icon?: LucideIcon;
  variant?: 'dark' | 'light';
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title = 'Insight de Agenda',
  content,
  icon: Icon = Sparkles,
  variant = 'dark'
}) => {
  return (
    <div className={cn(
      "rounded-xl p-4",
      variant === 'dark' 
        ? "bg-gradient-to-br from-[#4A1D1D] to-[#2D1515] text-white"
        : "bg-gradient-to-br from-gray-50 to-gray-100 text-foreground border border-gray-200"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn(
          "w-4 h-4",
          variant === 'dark' ? "text-amber-300" : "text-amber-500"
        )} />
        <span className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          variant === 'dark' ? "text-amber-300" : "text-amber-600"
        )}>
          {title}
        </span>
      </div>
      <p className={cn(
        "text-sm leading-relaxed",
        variant === 'dark' ? "text-gray-200" : "text-gray-600"
      )}>
        {content}
      </p>
    </div>
  );
};

export default InsightCard;
