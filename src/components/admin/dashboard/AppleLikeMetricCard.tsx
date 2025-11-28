import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface AppleLikeMetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  hoverContent?: React.ReactNode;
  onClick?: () => void;
}

const AppleLikeMetricCard = ({
  label,
  value,
  icon: Icon,
  description,
  hoverContent,
  onClick
}: AppleLikeMetricCardProps) => {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative group
        bg-background/60 backdrop-blur-sm
        border border-border/40
        rounded-2xl p-3
        transition-all duration-300
        hover:shadow-xl hover:border-[#9C1E1E]/50
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Icon Circle - Red Solid Background */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-full bg-[#9C1E1E] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Value - Large and Bold */}
      <div className="mb-1">
        <p className="text-2xl font-bold text-foreground tracking-tight">
          {value}
        </p>
      </div>

      {/* Label - Small */}
      <div>
        <p className="text-xs text-muted-foreground font-medium">
          {label}
        </p>
      </div>

      {/* Optional Description */}
      {description && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground/80">
            {description}
          </p>
        </div>
      )}
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

export default AppleLikeMetricCard;
