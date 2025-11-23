import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCard } from "@/modules/monitoramento-ia/components/anydesk/StatsCard";
import { ComputerCard } from "@/modules/monitoramento-ia/components/anydesk/ComputerCard";
import { ComputerDetailModal } from "@/modules/monitoramento-ia/components/anydesk/ComputerDetailModal";
import { Button } from "@/components/ui/button";
import { RefreshCw, TestTube2, Monitor, Wifi, WifiOff, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const ComputadoresPage = () => {
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [selectedComputer, setSelectedComputer] = useState(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const totalComputers = computers.length;
  const onlineCount = computers.filter(c => c.status === 'online').length;
  const offlineCount = computers.filter(c => c.status === 'offline').length;

  const fetchComputers = async () => {
    try {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComputers(data || []);
      setLastSync(new Date());
    } catch (error) {
      console.error("Error fetching computers:", error);
      toast.error("Erro ao carregar computadores");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-anydesk");
      
      if (error) throw error;
      
      toast.success("Sincronização concluída com sucesso!");
      fetchComputers();
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Erro na sincronização");
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-connection");
      
      if (error) throw error;
      
      if (data.hasIssues) {
        toast.warning(data.message);
      } else {
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Test error:", error);
      toast.error("Erro ao testar conexões");
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchComputers();

    const channel = supabase
      .channel("devices-changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "devices",
      }, () => {
        fetchComputers();
      })
      .subscribe();

    const interval = setInterval(fetchComputers, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Exa Monitoramento
            </h1>
            <p className="text-gray-400">
              Monitore e gerencie seus computadores AnyDesk
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
              className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <TestTube2 className="h-4 w-4 mr-2" />
                  Testar Conexão
                </>
              )}
            </Button>

            <Button
              onClick={handleSync}
              disabled={syncing}
              className="bg-[#9C1E1E] hover:bg-[#8A1A1A] text-white"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total de Paineis"
          value={totalComputers}
          icon={Monitor}
          variant="default"
        />
        <StatsCard
          title="Online"
          value={onlineCount}
          icon={Wifi}
          variant="success"
        />
        <StatsCard
          title="Offline"
          value={offlineCount}
          icon={WifiOff}
          variant="danger"
        />
        <StatsCard
          title="Última Sincronização"
          value={lastSync ? format(lastSync, "HH:mm:ss") : "Nunca"}
          icon={Clock}
          variant="default"
          showRefresh
          onRefresh={handleSync}
        />
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">
        Computadores
      </h2>

      {loading ? (
        <div className="text-center text-gray-400">Carregando...</div>
      ) : computers.length === 0 ? (
        <div className="text-center text-gray-400">
          Nenhum computador encontrado. Clique em "Sincronizar" para buscar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {computers.map((computer) => (
            <ComputerCard
              key={computer.id}
              computer={computer}
              onViewDetails={(id) => {
                const selected = computers.find(c => c.id === id);
                setSelectedComputer(selected);
              }}
            />
          ))}
        </div>
      )}

      <ComputerDetailModal
        computer={selectedComputer}
        isOpen={!!selectedComputer}
        onClose={() => setSelectedComputer(null)}
      />
    </div>
  );
};