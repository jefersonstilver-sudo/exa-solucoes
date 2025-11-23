import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wifi, WifiOff, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConnectionEvent {
  id: string;
  event_type: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}

interface ConnectionTimelineProps {
  computerId: string;
}

export const ConnectionTimeline = ({ computerId }: ConnectionTimelineProps) => {
  const [events, setEvents] = useState<ConnectionEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnectionHistory = async () => {
    try {
      // @ts-ignore - Table will exist after migration is executed
      const { data, error } = await (supabase as any)
        .from("connection_history")
        .select("id, event_type, started_at, ended_at, duration_seconds")
        .eq("computer_id", computerId)
        .order("started_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents((data || []) as any as ConnectionEvent[]);
    } catch (error) {
      console.error("Error fetching connection history:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionHistory();

    // @ts-ignore - Table will exist after migration is executed
    const channel = (supabase as any)
      .channel(`connection-history-${computerId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "connection_history",
        filter: `computer_id=eq.${computerId}`,
      }, () => {
        fetchConnectionHistory();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [computerId]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "em andamento";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    else if (minutes > 0) return `${minutes}m ${secs}s`;
    else return `${secs}s`;
  };

  if (loading) {
    return <div className="text-module-secondary">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <p className="text-module-secondary text-center py-8">Nenhum histórico de conexão disponível</p>
      ) : (
        <div className="relative">
          {/* Linha vertical conectando eventos */}
          <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-500/30 via-module-border to-red-500/30" />
          
          {events.map((event, index) => {
            const isOnline = event.event_type === "online";
            const isActive = !event.ended_at;

            return (
              <div
                key={event.id}
                className={cn(
                  "relative p-4 rounded-lg mb-4",
                  "glass-card",
                  "hover:bg-module-hover transition-all duration-300"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Ícone com animação */}
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 relative z-10",
                    isOnline 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-red-500/20 text-red-400",
                    isActive && "animate-pulse"
                  )}>
                    {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={isOnline ? "default" : "destructive"}
                        className={cn(
                          isOnline 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        )}
                      >
                        {isOnline ? "Online" : "Offline"}
                      </Badge>
                      {isActive && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 animate-pulse">
                          Em andamento
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm mb-1 text-module-primary">
                      {format(new Date(event.started_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                    
                    <p className="text-xs text-module-secondary">
                      {formatDistanceToNow(new Date(event.started_at), { addSuffix: true, locale: ptBR })}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-module-secondary" />
                      <span className="text-module-secondary">Duração:</span>
                      <span className={cn(
                        "font-semibold text-module-primary",
                        isActive && "text-primary animate-pulse"
                      )}>
                        {formatDuration(event.duration_seconds)}
                      </span>
                    </div>

                    {event.ended_at && (
                      <p className="text-xs text-module-secondary mt-1">
                        Finalizado em {format(new Date(event.ended_at), "HH:mm:ss")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Alerta para tempo offline > 1 minuto */}
                {!isOnline && event.duration_seconds && event.duration_seconds > 60 && (
                  <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/30">
                    <p className="text-xs text-red-400 font-medium">
                      ⚠️ Tempo offline significativo: {formatDuration(event.duration_seconds)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};