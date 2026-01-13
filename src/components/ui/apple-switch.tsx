import * as React from "react"
import { cn } from "@/lib/utils"

interface AppleSwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Apple-style toggle switch with EXA brand colors
 * Features:
 * - Smooth cubic-bezier transitions
 * - Red gradient when active (EXA brand)
 * - Subtle glow effect
 * - Bounce animation on thumb
 */
const AppleSwitch = React.forwardRef<HTMLButtonElement, AppleSwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className, size = 'md' }, ref) => {
    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    const sizeClasses = {
      sm: {
        track: 'h-5 w-9',
        thumb: 'h-4 w-4',
        translate: 'translate-x-4',
        translateOff: 'translate-x-0.5'
      },
      md: {
        track: 'h-7 w-12',
        thumb: 'h-5.5 w-5.5',
        translate: 'translate-x-5',
        translateOff: 'translate-x-1'
      },
      lg: {
        track: 'h-8 w-14',
        thumb: 'h-6 w-6',
        translate: 'translate-x-6',
        translateOff: 'translate-x-1'
      }
    };

    const sizes = sizeClasses[size];

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          // Base styles
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full",
          "transition-all duration-300",
          // Focus styles
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9C1E1E]/40 focus-visible:ring-offset-2",
          // Disabled styles
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Size
          sizes.track,
          // Active/Inactive background
          checked 
            ? "bg-gradient-to-r from-[#C7141A] to-[#9C1E1E] shadow-[0_2px_10px_rgba(199,20,26,0.35)]" 
            : "bg-gray-200/90 shadow-inner",
          className
        )}
        style={{
          transition: 'all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)'
        }}
      >
        {/* Thumb */}
        <span
          className={cn(
            "pointer-events-none block rounded-full bg-white shadow-lg",
            "ring-0",
            // Size
            size === 'sm' && 'h-4 w-4',
            size === 'md' && 'h-[22px] w-[22px]',
            size === 'lg' && 'h-6 w-6',
            // Position
            checked ? sizes.translate : sizes.translateOff
          )}
          style={{
            transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)'
          }}
        />
      </button>
    );
  }
);

AppleSwitch.displayName = "AppleSwitch";

export { AppleSwitch }
