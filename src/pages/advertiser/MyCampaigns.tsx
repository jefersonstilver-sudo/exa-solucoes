import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMyCampaigns from './MobileMyCampaigns';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useUnifiedCampaigns } from '@/hooks/useUnifiedCampaigns';
import { UnifiedCampaignList } from '@/components/campaign/UnifiedCampaignList';

const MyCampaigns = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { campaigns, loading, refetch } = useUnifiedCampaigns();

  const handleCreateCampaign = async () => {
    if (!userProfile?.id) return;

    try {
      // Buscar pedidos com vídeos aprovados
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select(`
          *,
          pedido_videos!inner(
            id,
            approval_status
          )
        `)
        .eq('client_id', userProfile.id)
        .eq('pedido_videos.approval_status', 'approved');

      if (error) throw error;

      // Filtrar pedidos que realmente têm vídeos aprovados
      const pedidosComVideosAprovados = pedidos?.filter(pedido => 
        pedido.pedido_videos && pedido.pedido_videos.length > 0
      ) || [];

      if (pedidosComVideosAprovados.length === 0) {
        // Verificar se tem pedidos pagos mas sem vídeos aprovados
        const { data: pedidosPagos, error: errorPagos } = await supabase
          .from('pedidos')
          .select('*')
          .eq('client_id', userProfile.id)
          .in('status', ['pago', 'pago_pendente_video', 'video_aprovado']);

        if (errorPagos) throw errorPagos;

        if (!pedidosPagos || pedidosPagos.length === 0) {
          toast.error('Você precisa ter pelo menos um pedido pago para criar uma campanha');
          navigate('/paineis-digitais/loja');
          return;
        } else {
          toast.error('Você precisa ter vídeos aprovados para criar uma campanha. Faça upload dos seus vídeos primeiro.');
          navigate('/anunciante/pedidos');
          return;
        }
      }

      // Se tem apenas um pedido com vídeos aprovados, redireciona diretamente
      if (pedidosComVideosAprovados.length === 1) {
        navigate(`/anunciante/pedido/${pedidosComVideosAprovados[0].id}`);
        return;
      }

      // Se tem múltiplos pedidos, mostra seletor (implementação futura)
      // Por enquanto, redireciona para o primeiro
      navigate(`/anunciante/pedido/${pedidosComVideosAprovados[0].id}`);
      toast.info('Você será redirecionado para criar uma campanha');

    } catch (error) {
      console.error('Erro ao verificar pedidos:', error);
      toast.error('Erro ao verificar pedidos');
    }
  };

  if (isMobile) {
    return <MobileMyCampaigns />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Campanhas</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as suas campanhas de publicidade</p>
        </div>
        <Button onClick={handleCreateCampaign} className="bg-indexa-purple hover:bg-indexa-purple/90">
          <Plus className="h-4 w-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Lista Unificada de Campanhas */}
      <UnifiedCampaignList 
        campaigns={campaigns} 
        loading={loading} 
        onRefetch={refetch} 
      />
    </div>
  );
};

export default MyCampaigns;