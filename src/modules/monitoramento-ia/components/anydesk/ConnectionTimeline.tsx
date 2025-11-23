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
      const { data, error } = await supabase
        .from("connection_history")
        .select("id, event_type, started_at, ended_at, duration_seconds")
        .eq("computer_id", computerId)
        .order("started_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setEvents((data || []) as ConnectionEvent[]);
    } catch (error) {
      console.error("Error fetching connection history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionHistory();

    const channel = supabase
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
    return <div className="text-gray-400">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <p className="text-gray-400">Nenhum histórico de conexão disponível</p>
      ) : (
        events.map((event) => {
          const isOnline = event.event_type === "online";
          const isActive = !event.ended_at;

          return (
            <div
              key={event.id}
              className={cn(
                "relative p-4 rounded-lg",
                "bg-white/5 backdrop-blur-xl border border-white/10",
                "hover:bg-white/10 transition-all"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  isOnline 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-gray-500/20 text-gray-400"
                )}>
                  {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={isOnline ? "default" : "destructive"}
                      className={cn(
                        isOnline 
                          ? "bg-emerald-500/20 text-emerald-400" 
                          : "bg-gray-500/20 text-gray-400"
                      )}
                    >
                      {isOnline ? "Online" : "Offline"}
                    </Badge>
                    {isActive && (
                      <Badge className="bg-[#9C1E1E]/20 text-red-400 animate-pulse">
                        Em andamento
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-white mb-1">
                    {format(new Date(event.started_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </p>
                  
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(event.started_at), { addSuffix: true, locale: ptBR })}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">Duração:</span>
                    <span className="text-white font-medium">
                      {formatDuration(event.duration_seconds)}
                    </span>
                  </div>

                  {event.ended_at && (
                    <p className="text-xs text-gray-400 mt-1">
                      Até {format(new Date(event.ended_at), "HH:mm:ss")}
                    </p>
                  )}
                </div>
              </div>

              {!isOnline && event.duration_seconds && event.duration_seconds > 300 && (
                <div className="mt-3 p-2 rounded bg-[#9C1E1E]/10 border border-[#9C1E1E]/30">
                  <p className="text-xs text-red-400">
                    ⚠️ Tempo offline significativo detectado
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};