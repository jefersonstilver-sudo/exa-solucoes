import { Monitor, Wifi, WifiOff, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ComputerCardProps {
  computer: {
    id: string;
    hostname: string;
    status: string;
    anydesk_id: string;
    last_online?: string;
    os?: string;
    ip_public?: string;
    comment?: string;
    custom_name?: string;
    has_pending_incident?: boolean;
  };
  onViewDetails: (id: string) => void;
}

export const ComputerCard = ({ computer, onViewDetails }: ComputerCardProps) => {
  const isOnline = computer.status === "online";
  const displayName = computer.custom_name || computer.comment || computer.hostname;

  return (
    <div className={cn(
      "relative group",
      "rounded-xl border backdrop-blur-xl",
      "bg-white/5 border-white/10",
      "p-6 transition-all duration-300",
      "hover:shadow-lg hover:scale-[1.02]",
      "hover:bg-white/10"
    )}>
      {/* Status Badge */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        <Badge
          variant={isOnline ? "default" : "destructive"}
          className={cn(
            "flex items-center gap-1 px-3 py-1",
            isOnline 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
              : "bg-[#9C1E1E]/20 text-red-400 border-[#9C1E1E]/30"
          )}
        >
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? "online" : "offline"}
        </Badge>
        {!isOnline && computer.has_pending_incident && (
          <Badge className="flex items-center gap-1 px-2 py-0.5 text-xs bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
            ⚠ Sem causa
          </Badge>
        )}
        {!isOnline && computer.has_pending_incident === false && (
          <Badge className="flex items-center gap-1 px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
            📋 Causa definida
          </Badge>
        )}
      </div>

      {/* Monitor Icon */}
      <div className={cn(
        "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
        isOnline 
          ? "bg-emerald-500/10" 
          : "bg-gray-500/10"
      )}>
        <Monitor className={cn(
          "h-6 w-6",
          isOnline ? "text-emerald-400" : "text-gray-400"
        )} />
      </div>

      {/* Computer Name */}
      <h3 className="text-xl font-bold text-white mb-1">
        {displayName}
      </h3>

      {/* AnyDesk ID */}
      <p className="text-sm text-gray-400 font-mono mb-4">
        ID: {computer.anydesk_id}
      </p>

      {/* Info */}
      <div className="space-y-2 mb-4">
        {computer.os && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-20">Sistema:</span>
            <span className="text-white">{computer.os}</span>
          </div>
        )}
        {computer.ip_public && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="w-20">IP Público:</span>
            <span className="text-white">{computer.ip_public}</span>
          </div>
        )}
      </div>

      {/* Last Connection */}
      {computer.last_online && (
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Clock className="h-4 w-4" />
          <span>Última Conexão:</span>
        </div>
      )}
      <p className="text-sm text-white mb-4">
        {computer.last_online 
          ? formatDistanceToNow(new Date(computer.last_online), { 
              addSuffix: true, 
              locale: ptBR 
            })
          : "Nunca conectado"
        }
      </p>

      {/* Button */}
      <Button
        variant="outline"
        className={cn(
          "w-full",
          "bg-white/5 hover:bg-[#9C1E1E] hover:text-white",
          "border-white/10 text-white",
          "transition-all duration-200"
        )}
        onClick={() => onViewDetails(computer.id)}
      >
        Ver Detalhes
      </Button>
    </div>
  );
};