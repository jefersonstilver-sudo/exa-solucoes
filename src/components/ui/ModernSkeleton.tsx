import React from 'react';
import { cn } from "@/lib/utils";

interface ModernSkeletonProps {
  variant?: 'hero' | 'card' | 'text' | 'button' | 'section';
  className?: string;
}

const ModernSkeleton: React.FC<ModernSkeletonProps> = ({ 
  variant = 'section', 
  className 
}) => {
  const variants = {
    hero: "h-[60vh] w-full rounded-lg",
    card: "h-48 w-full rounded-lg",
    text: "h-4 w-3/4 rounded",
    button: "h-10 w-32 rounded-md",
    section: "h-96 w-full rounded-lg"
  };

  return (
    <div className={cn(
      "animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted",
      "relative overflow-hidden",
      variants[variant],
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                      animate-shimmer transform -skew-x-12" 
           style={{
             animation: 'shimmer 2s infinite',
             background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)'
           }} />
    </div>
  );
};

export default ModernSkeleton;