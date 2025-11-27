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
          className="relative group cursor-pointer"
        >
          <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-6 border border-border/50 shadow-lg hover:shadow-xl hover:border-border transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {title}
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {value}
                </p>
                {trend && (
                  <p className={`text-sm mt-2 font-medium ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
                    {trend.value}
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/30 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-300">
                <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
            </div>
            
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
