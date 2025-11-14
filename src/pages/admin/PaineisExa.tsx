import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaineisStats } from "@/components/admin/paineis-exa/PaineisStats";
import { PaineisTable } from "@/components/admin/paineis-exa/PaineisTable";
import { GerarPainelDialog } from "@/components/admin/paineis-exa/GerarPainelDialog";
import { GerarCodigoDialog } from "@/components/admin/paineis-exa/GerarCodigoDialog";
import { Plus, Link2 } from "lucide-react";
import { toast } from "sonner";

const PaineisExa = () => {
  const [gerarPainelOpen, setGerarPainelOpen] = useState(false);
  const [gerarCodigoOpen, setGerarCodigoOpen] = useState(false);

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

      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Painéis EXA</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e monitore todos os painéis digitais - Sistema Beta
            </p>
          </div>
          <div className="flex gap-2">
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
    </>
  );
};

export default PaineisExa;
