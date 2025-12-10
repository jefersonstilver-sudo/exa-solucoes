import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PaineisStats } from "@/components/admin/paineis-exa/PaineisStats";
import { PaineisTable } from "@/components/admin/paineis-exa/PaineisTable";
import { GerarPainelDialog } from "@/components/admin/paineis-exa/GerarPainelDialog";
import { GerarCodigoDialog } from "@/components/admin/paineis-exa/GerarCodigoDialog";
import { ConfigHorarioDialog } from "@/components/admin/paineis-exa/ConfigHorarioDialog";
import { ScheduledShutdownBadge } from "@/components/admin/uptime/ScheduledShutdownBadge";
import { FullUptimeBadge } from "@/components/admin/uptime/FullUptimeBadge";
import { Plus, Link2, Clock } from "lucide-react";
import { toast } from "sonner";

const PaineisExa = () => {
  const [gerarPainelOpen, setGerarPainelOpen] = useState(false);
  const [gerarCodigoOpen, setGerarCodigoOpen] = useState(false);
  const [configHorarioOpen, setConfigHorarioOpen] = useState(false);

  const { data: paineis = [], isLoading, refetch } = useQuery({
    queryKey: ['paineis-exa'],
    queryFn: async () => {
      console.log('🔵 Buscando painéis EXA...');
      
      const { data, error } = await supabase
        .from('painels')
        .select(`
          *,
          buildings (
            id,
            nome,
            endereco,
            bairro
          ),
          paineis_status (
            status,
            ultimo_heartbeat,
            url_atual,
            ip_address,
            user_agent,
            device_info,
            erro_ultimo
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar painéis:', error);
        toast.error('Erro ao carregar painéis');
        throw error;
      }

      // Adicionar statusInfo a cada painel
      const paineisComStatus = data?.map(painel => ({
        ...painel,
        statusInfo: {
          status: painel.status_vinculo === 'aguardando_codigo' ? 'aguardando_codigo' :
                  painel.status_vinculo === 'conectado' ? 'conectado' :
                  painel.status || 'aguardando_instalacao',
          ultimo_heartbeat: painel.ultima_sync,
          url_atual: null,
          erro_ultimo: null
        }
      })) || [];

      console.log('✅ Painéis carregados:', paineisComStatus.length);
      return paineisComStatus;
    },
    refetchInterval: 30000,
  });

  // Calcular estatísticas reais
  const stats = {
    total: paineis.length,
    aguardando_instalacao: paineis.filter(p => p.status_vinculo === 'aguardando_instalacao').length,
    aguardando_vinculo: paineis.filter(p => p.status_vinculo === 'aguardando_vinculo').length,
    vinculado: paineis.filter(p => p.status_vinculo === 'vinculado').length,
    offline: paineis.filter(p => p.status === 'offline').length,
  };

  const handlePainelGerado = () => {
    setGerarPainelOpen(false);
    toast.success("Painel criado com sucesso!");
    refetch();
  };

  const handleCodigoGerado = () => {
    setGerarCodigoOpen(false);
    toast.success("Código gerado com sucesso!");
    refetch();
  };

  return (
    <>
      <Helmet>
        <title>Painéis EXA - Indexa Mídia</title>
      </Helmet>

      <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold">Painéis EXA</h1>
              <ScheduledShutdownBadge compact />
              <FullUptimeBadge compact />
            </div>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Gerencie e monitore todos os painéis digitais - Sistema Beta
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setConfigHorarioOpen(true)}
                    variant="outline"
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Clock className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Configurar Horário de Funcionamento</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button 
              onClick={() => setGerarCodigoOpen(true)}
              variant="outline"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Gerar Código de Vínculo
            </Button>
            <Button onClick={() => setGerarPainelOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Gerar Novo Painel
            </Button>
          </div>
        </div>

        <PaineisStats stats={stats} />

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Painéis Cadastrados</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <PaineisTable paineis={paineis} onRefetch={refetch} />
          )}
        </Card>
      </div>

      <GerarPainelDialog
        open={gerarPainelOpen}
        onOpenChange={setGerarPainelOpen}
        onPainelGerado={handlePainelGerado}
      />

      <GerarCodigoDialog
        open={gerarCodigoOpen}
        onOpenChange={setGerarCodigoOpen}
        onSuccess={handleCodigoGerado}
      />

      <ConfigHorarioDialog
        open={configHorarioOpen}
        onOpenChange={setConfigHorarioOpen}
        paineis={paineis as any}
        onSuccess={refetch}
      />
    </>
  );
};

export default PaineisExa;
