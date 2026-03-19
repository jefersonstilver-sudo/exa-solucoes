import React from "react";
import { cn } from "@/lib/utils";

const colors = {
  red: { bg: "bg-[#9C1E1E]", shadow: "rgba(199,20,26,0.35)" },
  green: { bg: "bg-emerald-600", shadow: "rgba(5,150,105,0.35)" },
  blue: { bg: "bg-blue-600", shadow: "rgba(37,99,235,0.35)" },
  amber: { bg: "bg-amber-600", shadow: "rgba(217,119,6,0.35)" },
  gray: { bg: "bg-gray-500", shadow: "rgba(107,114,128,0.35)" },
};

type ToggleColor = keyof typeof colors;

interface ToggleExaProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  color?: ToggleColor;
  label?: string;
  labelPosition?: "left" | "right";
  size?: "sm" | "md";
  className?: string;
}

export const ToggleExa: React.FC<ToggleExaProps> = ({
  checked,
  onChange,
  disabled = false,
  color = "red",
  label,
  labelPosition = "left",
  size = "md",
  className,
}) => {
  const c = colors[color];
  const isSm = size === "sm";
  const trackW = isSm ? "w-8" : "w-11";
  const trackH = isSm ? "h-4" : "h-6";
  const thumbSize = isSm ? "h-3 w-3" : "h-5 w-5";
  const translate = isSm ? "translate-x-4" : "translate-x-5";
  const translateOff = isSm ? "translate-x-0.5" : "translate-x-0.5";

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        trackW,
        trackH,
        checked ? c.bg : "bg-gray-200/90",
      )}
      style={{
        boxShadow: checked ? `0 2px 10px ${c.shadow}` : "inset 0 1px 3px rgba(0,0,0,0.1)",
        transition: "all 300ms cubic-bezier(0.25, 0.1, 0.25, 1)",
      }}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-lg ring-0",
          thumbSize,
          checked ? translate : translateOff,
        )}
        style={{
          transition: "transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)",
        }}
      />
    </button>
  );

  if (!label) return <span className={className}>{toggle}</span>;

  return (
    <label
      className={cn(
        "inline-flex items-center gap-2 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      {labelPosition === "left" && (
        <span className="text-sm text-foreground">{label}</span>
      )}
      {toggle}
      {labelPosition === "right" && (
        <span className="text-sm text-foreground">{label}</span>
      )}
    </label>
  );
};

export default ToggleExa;
