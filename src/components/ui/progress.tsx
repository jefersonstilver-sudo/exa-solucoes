
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-gray-100",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-[#9C1E1E] transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

interface CircularProgressProps {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  indicatorClassName?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
  value, 
  size = "md", 
  className, 
  indicatorClassName 
}) => {
  const sizes = {
    sm: 60,
    md: 80,
    lg: 100
  };

  const strokeWidth = {
    sm: 4,
    md: 5,
    lg: 6
  };

  const sizeValue = sizes[size];
  const strokeWidthValue = strokeWidth[size];
  
  const radius = (sizeValue - strokeWidthValue * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative", className)} style={{ width: sizeValue, height: sizeValue }}>
      {/* Background circle */}
      <svg width={sizeValue} height={sizeValue} className="rotate-[-90deg]">
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidthValue}
          className={className}
        />
        {/* Progress indicator */}
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidthValue}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={indicatorClassName}
        />
      </svg>
    </div>
  );
};

export { Progress, CircularProgress };
