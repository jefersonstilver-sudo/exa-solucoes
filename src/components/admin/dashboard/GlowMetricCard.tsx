import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface GlowMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorScheme: 'blue' | 'amber' | 'emerald' | 'violet' | 'red' | 'pink';
  trend?: string;
  trendPositive?: boolean;
  delay?: number;
  hoverContent?: React.ReactNode;
}

const GlowMetricCard = ({
  title,
  value,
  icon: Icon,
  colorScheme,
  trend,
  trendPositive = true,
  delay = 0,
  hoverContent
}: GlowMetricCardProps) => {
  // Sophisticated neutral palette with subtle accents
  const colorConfig = {
    blue: {
      accent: 'text-blue-600/70',
      iconBg: 'bg-blue-500/5',
    },
    amber: {
      accent: 'text-amber-600/70',
      iconBg: 'bg-amber-500/5',
    },
    emerald: {
      accent: 'text-emerald-600/70',
      iconBg: 'bg-emerald-500/5',
    },
    violet: {
      accent: 'text-violet-600/70',
      iconBg: 'bg-violet-500/5',
    },
    red: {
      accent: 'text-[#9C1E1E]/70',
      iconBg: 'bg-[#9C1E1E]/5',
    },
    pink: {
      accent: 'text-pink-600/70',
      iconBg: 'bg-pink-500/5',
    }
  };

  const colors = colorConfig[colorScheme];

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className="group relative h-full"
    >
      {/* Sophisticated Card - Neutral with Subtle Accent - COMPACT */}
      <div className="relative overflow-hidden rounded-xl backdrop-blur-sm bg-background/60 border border-border/40 transition-all duration-500 shadow-sm hover:shadow-md hover:border-border/60 p-4 h-full flex flex-col">
        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header: Icon + Title */}
          <div className="flex items-start gap-3 mb-3">
            {/* Compact Icon with Subtle Background */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className={`p-2.5 rounded-xl ${colors.iconBg} backdrop-blur-sm transition-all duration-300`}
            >
              <Icon className={`w-5 h-5 ${colors.accent}`} />
            </motion.div>
            
            {/* Title - Compact */}
            <div className="flex-1 pt-0.5">
              <h3 className="text-sm font-semibold text-foreground/90 leading-tight">
                {title}
              </h3>
            </div>
          </div>

          {/* Value - Compact and Bold */}
          <div className="mb-3 flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: delay * 0.1 + 0.2 }}
              className="text-2xl font-black text-foreground tracking-tight"
            >
              {value}
            </motion.div>
          </div>

          {/* Trend - Minimal and Elegant */}
          {trend && (
            <div className="pt-3 border-t border-border/30">
              <span className={`text-sm font-medium ${trendPositive ? 'text-foreground/70' : 'text-foreground/60'}`}>
                {trend}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  // If there's hover content, wrap in HoverCard
  if (hoverContent) {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          {cardContent}
        </HoverCardTrigger>
        <HoverCardContent 
          side="top" 
          align="center"
          className="w-80 p-4"
        >
          {hoverContent}
        </HoverCardContent>
      </HoverCard>
    );
  }

  return cardContent;
};

export default GlowMetricCard;
