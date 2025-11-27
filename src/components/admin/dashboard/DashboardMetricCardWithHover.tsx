import React from 'react';
import { LucideIcon } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion } from 'framer-motion';

interface DashboardMetricCardWithHoverProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  hoverContent: React.ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
}

const DashboardMetricCardWithHover = ({
  title,
  value,
  icon: Icon,
  hoverContent,
  trend
}: DashboardMetricCardWithHoverProps) => {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          transition={{ duration: 0.2 }}
          className="relative group cursor-pointer h-full"
        >
          <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between min-h-[140px]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-2 truncate">
                  {title}
                </p>
                <p className="text-3xl md:text-4xl font-bold text-foreground break-words">
                  {value}
                </p>
              </div>
              <div className="flex-shrink-0 ml-3 p-2.5 rounded-full bg-[#9C1E1E]/10">
                <Icon className="h-5 w-5 text-[#9C1E1E]" />
              </div>
            </div>
            
            {trend && (
              <p className={`text-sm font-medium ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
                {trend.value}
              </p>
            )}
            
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span>Ver detalhes</span>
                <span className="text-[10px]">↗</span>
              </div>
            </div>
          </div>
        </motion.div>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="start" className="w-80 p-4">
        {hoverContent}
      </HoverCardContent>
    </HoverCard>
  );
};

export default DashboardMetricCardWithHover;
