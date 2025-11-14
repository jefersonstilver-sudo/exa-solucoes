import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Monitor, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GerarCodigoDialog } from '@/components/admin/paineis-exa/GerarCodigoDialog';
import { PaineisTable } from '@/components/admin/paineis-exa/PaineisTable';
import { PaineisStats } from '@/components/admin/paineis-exa/PaineisStats';

const PaineisExa = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Buscar painéis com status
  const { data: paineis, isLoading, refetch } = useQuery({
    queryKey: ['paineis-exa'],
    queryFn: async () => {
      const { data: paineisData, error: paineisError } = await supabase
        .from('painels')
        .select(`
          *,
          buildings(id, nome, endereco, bairro)
        `)
        .order('created_at', { ascending: false });

      if (paineisError) throw paineisError;

      // Buscar status de cada painel
      const { data: statusData } = await supabase
        .from('paineis_status')
        .select('*');

      const statusMap = new Map(statusData?.map(s => [s.painel_id, s]) || []);

      return paineisData?.map(painel => ({
        ...painel,
        statusInfo: statusMap.get(painel.id) || { status: 'nunca_vinculado' },
      }));
    },
    refetchInterval: 30000, // Refetch a cada 30s
  });

  // Calcular estatísticas
  const stats = {
    total: paineis?.length || 0,
    online: paineis?.filter(p => p.statusInfo.status === 'online').length || 0,
    offline: paineis?.filter(p => p.statusInfo.status === 'offline').length || 0,
    nunca_vinculado: paineis?.filter(p => {
      const status = p.statusInfo as any;
      return status.status === 'nunca_vinculado' || !status.ultimo_heartbeat;
    }).length || 0,
  };

  const handleGerarCodigo = () => {
    setDialogOpen(true);
  };

  const handleCodigoGerado = () => {
    setDialogOpen(false);
    toast.success('Código de vínculo gerado com sucesso!');
    refetch();
  };

  return (
    <>
      <Helmet>
        <title>Painéis EXA - Indexa Mídia</title>
      </Helmet>

      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Painéis EXA</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie e monitore todos os painéis digitais em tempo real
            </p>
          </div>
          <Button onClick={handleGerarCodigo} className="gap-2">
            <Plus className="h-4 w-4" />
            Gerar Código de Vínculo
          </Button>
        </div>

        {/* Stats Cards */}
        <PaineisStats stats={stats} />

        {/* Tabela de Painéis */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Painéis Cadastrados</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <PaineisTable paineis={paineis || []} onRefetch={refetch} />
          )}
        </Card>
      </div>

      <GerarCodigoDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={handleCodigoGerado}
      />
    </>
  );
};

export default PaineisExa;
