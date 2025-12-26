import React from "react";
import { cn } from "@/lib/utils";

const colors = {
  blue: {
    bg: "bg-blue-600",
    bgActive: "bg-blue-100 dark:bg-blue-900",
  },
  red: {
    bg: "bg-red-600",
    bgActive: "bg-red-100 dark:bg-red-900",
  },
  amber: {
    bg: "bg-amber-600",
    bgActive: "bg-amber-100 dark:bg-amber-900",
  },
  orange: {
    bg: "bg-orange-600",
    bgActive: "bg-orange-100 dark:bg-orange-900",
  },
  green: {
    bg: "bg-green-600",
    bgActive: "bg-green-100 dark:bg-green-900",
  },
  teal: {
    bg: "bg-teal-600",
    bgActive: "bg-teal-100 dark:bg-teal-900",
  },
  purple: {
    bg: "bg-purple-600",
    bgActive: "bg-purple-100 dark:bg-purple-900",
  },
  pink: {
    bg: "bg-pink-600",
    bgActive: "bg-pink-100 dark:bg-pink-900",
  },
  gray: {
    bg: "bg-gray-500",
    bgActive: "bg-gray-100 dark:bg-gray-800",
  }
};

type TToggleColor = keyof typeof colors;

interface FancyToggleProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: "small" | "large";
  color?: TToggleColor;
  icon?: React.ReactNode;
  direction?: "switch-first" | "label-first";
  children?: React.ReactNode;
  className?: string;
}

export const FancyToggle: React.FC<FancyToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "small",
  color = "green",
  icon,
  direction = "label-first",
  children,
  className,
}) => {
  const isSmall = size === "small";
  const colorConfig = colors[color];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <label
      className={cn(
        "relative inline-flex items-center gap-2 py-1 text-xs select-none cursor-pointer transition-all duration-200",
        direction === "switch-first" && "flex-row-reverse",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {/* Label content */}
      {children && (
        <span className={cn(
          "flex items-center gap-1.5 font-medium transition-colors duration-200",
          checked ? "text-foreground" : "text-muted-foreground"
        )}>
          {icon && (
            <span className={cn(
              "transition-colors duration-200",
              checked && color === "red" && "text-red-500",
              checked && color === "orange" && "text-orange-500",
              checked && color === "amber" && "text-amber-500",
              checked && color === "green" && "text-green-500",
              checked && color === "blue" && "text-blue-500",
              !checked && "text-muted-foreground"
            )}>
              {icon}
            </span>
          )}
          {children}
        </span>
      )}

      {/* Hidden input */}
      <input
        type="checkbox"
        className="absolute w-0 h-0 appearance-none"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />

      {/* Toggle track */}
      <span
        className={cn(
          "rounded-full inline-block relative duration-200 transition-all",
          isSmall ? "h-4 w-8" : "h-6 w-11",
          checked
            ? cn(colorConfig.bg, "shadow-inner")
            : "bg-muted border border-border",
          disabled && "opacity-50"
        )}
      >
        {/* Toggle thumb */}
        <span
          className={cn(
            "rounded-full absolute top-1/2 -translate-y-1/2 shadow-md duration-200 transition-all flex items-center justify-center",
            isSmall ? "h-3 w-3" : "h-5 w-5",
            checked
              ? isSmall ? "left-4" : "left-5.5"
              : "left-0.5",
            checked
              ? "bg-white"
              : "bg-white dark:bg-gray-300",
          )}
          style={{
            left: checked ? (isSmall ? '17px' : '22px') : '2px',
          }}
        />
      </span>
    </label>
  );
};

export default FancyToggle;
