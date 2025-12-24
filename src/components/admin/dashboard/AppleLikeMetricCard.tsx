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
  description?: React.ReactNode;
  hoverContent?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}

const AppleLikeMetricCard = ({
  label,
  value,
  icon: Icon,
  description,
  hoverContent,
  onClick,
  variant = 'default'
}: AppleLikeMetricCardProps) => {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative group
        bg-white
        border border-gray-100
        rounded-xl p-2.5
        shadow-[0_10px_40px_rgba(0,0,0,0.12)]
        transition-all duration-300 ease-out
        hover:shadow-[0_18px_50px_rgba(0,0,0,0.18)] hover:scale-[1.01] hover:-translate-y-0.5
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Icon Circle - Red Solid Background */}
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-full bg-[#9C1E1E] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Value - Responsive Text */}
      <div className="mb-1 overflow-hidden">
        <p className={`font-bold tracking-tight truncate ${
          variant === 'danger' ? 'text-red-600 dark:text-red-500' : 'text-foreground'
        } ${
          String(value).length > 15 ? 'text-sm' : 
          String(value).length > 10 ? 'text-base' : 
          String(value).length > 6 ? 'text-lg' : 'text-xl'
        }`}>
          {value}
        </p>
      </div>

      {/* Label - Small */}
      <div>
        <p className="text-[10px] text-muted-foreground font-medium leading-tight">
          {label}
        </p>
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

export default AppleLikeMetricCard;
