import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: "default" | "success" | "danger";
  showRefresh?: boolean;
  onRefresh?: () => void;
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  variant = "default",
  showRefresh,
  onRefresh 
}: StatsCardProps) => {
  const variantStyles = {
    default: "bg-white/5 border-white/10 text-white",
    success: "bg-emerald-500/10 border-emerald-500/30 text-white",
    danger: "bg-[#9C1E1E]/20 border-[#9C1E1E]/40 text-white",
  };

  const iconStyles = {
    default: "bg-white/10 text-white",
    success: "bg-emerald-500/20 text-emerald-400",
    danger: "bg-[#9C1E1E]/30 text-red-400",
  };

  return (
    <div className={cn(
      "relative group",
      "rounded-xl border backdrop-blur-xl",
      "transition-all duration-300",
      "hover:shadow-lg hover:scale-[1.02]",
      variantStyles[variant]
    )}>
      {/* Glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl",
        variant === "danger" && "bg-[#9C1E1E]/30",
        variant === "success" && "bg-emerald-500/30",
        variant === "default" && "bg-white/10"
      )} />

      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            iconStyles[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {showRefresh && onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-4 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Atualizar
          </button>
        )}
      </div>
    </div>
  );
};