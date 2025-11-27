import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion, useAnimationControls } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlowMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendPositive?: boolean;
  colorScheme: 'blue' | 'amber' | 'emerald' | 'violet' | 'red' | 'pink';
  onClick?: () => void;
  delay?: number;
}

const colorConfig = {
  blue: {
    gradient: 'from-blue-500/20 via-blue-500/10 to-blue-600/5',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    glowColor: 'shadow-blue-500/20',
    hoverGlow: 'group-hover:shadow-blue-500/40',
    progressBg: 'bg-gradient-to-r from-blue-500 to-blue-600',
  },
  amber: {
    gradient: 'from-amber-500/20 via-amber-500/10 to-amber-600/5',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    glowColor: 'shadow-amber-500/20',
    hoverGlow: 'group-hover:shadow-amber-500/40',
    progressBg: 'bg-gradient-to-r from-amber-500 to-amber-600',
  },
  emerald: {
    gradient: 'from-emerald-500/20 via-emerald-500/10 to-emerald-600/5',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    glowColor: 'shadow-emerald-500/20',
    hoverGlow: 'group-hover:shadow-emerald-500/40',
    progressBg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
  },
  violet: {
    gradient: 'from-violet-500/20 via-violet-500/10 to-violet-600/5',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-500',
    glowColor: 'shadow-violet-500/20',
    hoverGlow: 'group-hover:shadow-violet-500/40',
    progressBg: 'bg-gradient-to-r from-violet-500 to-violet-600',
  },
  red: {
    gradient: 'from-[#9C1E1E]/20 via-[#9C1E1E]/10 to-[#9C1E1E]/5',
    iconBg: 'bg-[#9C1E1E]/10',
    iconColor: 'text-[#9C1E1E]',
    glowColor: 'shadow-[#9C1E1E]/20',
    hoverGlow: 'group-hover:shadow-[#9C1E1E]/40',
    progressBg: 'bg-gradient-to-r from-[#9C1E1E] to-[#7C1818]',
  },
  pink: {
    gradient: 'from-pink-500/20 via-pink-500/10 to-pink-600/5',
    iconBg: 'bg-pink-500/10',
    iconColor: 'text-pink-500',
    glowColor: 'shadow-pink-500/20',
    hoverGlow: 'group-hover:shadow-pink-500/40',
    progressBg: 'bg-gradient-to-r from-pink-500 to-pink-600',
  },
};

const AnimatedCounter: React.FC<{ value: string | number; className?: string }> = ({ value, className }) => {
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) || 0 : value;
  const isNumeric = !isNaN(numericValue);
  
  if (!isNumeric) {
    return <span className={className}>{value}</span>;
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {value}
    </motion.span>
  );
};

const GlowMetricCard: React.FC<GlowMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendPositive,
  colorScheme,
  onClick,
  delay = 0,
}) => {
  const colors = colorConfig[colorScheme];
  const controls = useAnimationControls();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: "easeOut" }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-5",
        "bg-background/60 backdrop-blur-md",
        "border border-border/40",
        "shadow-lg transition-all duration-300",
        colors.glowColor,
        colors.hoverGlow,
        onClick && "cursor-pointer"
      )}
    >
      {/* Background Glow - Animated on hover */}
      <div 
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "bg-gradient-to-br",
          colors.gradient
        )}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header: Title + 3D Icon */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground leading-tight flex-1 pr-2">
            {title}
          </h3>
          
          <motion.div
            whileHover={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: 1.1,
              transition: { duration: 0.5 }
            }}
            className={cn(
              "flex-shrink-0 p-2.5 rounded-xl",
              "shadow-lg transition-all duration-300",
              colors.iconBg,
              "group-hover:shadow-xl"
            )}
          >
            <Icon className={cn("w-5 h-5", colors.iconColor)} />
          </motion.div>
        </div>

        {/* Value - Large and Bold */}
        <div className="mb-4">
          <AnimatedCounter 
            value={value} 
            className="text-3xl font-black text-foreground leading-none"
          />
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div className="mt-auto flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '70%' }}
                transition={{ duration: 1, delay: delay * 0.1 + 0.3, ease: "easeOut" }}
                className={cn("h-full", colors.progressBg)}
              />
            </div>
            <span className={cn(
              "text-xs font-medium whitespace-nowrap",
              trendPositive ? "text-emerald-500" : "text-muted-foreground"
            )}>
              {trend}
            </span>
          </div>
        )}

        {/* "Ver detalhes" indicator on hover */}
        {onClick && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <span className="text-[10px] font-medium text-muted-foreground">
              Detalhes →
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default GlowMetricCard;
