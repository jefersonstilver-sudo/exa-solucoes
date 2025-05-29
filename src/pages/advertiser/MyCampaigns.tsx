import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMyCampaigns from './MobileMyCampaigns';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, Plus, Calendar, Monitor, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  id: string;
  painel_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  obs?: string;
  created_at: string;
  video_id: string;
}

const MyCampaigns = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadCampaigns();
  }, [userProfile]);

  const loadCampaigns = async () => {
    if (!userProfile?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('campanhas')
        .select('*')
        .eq('client_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativa</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'finalizado':
        return <Badge className="bg-blue-100 text-blue-800">Finalizada</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleCreateCampaign = () => {
    // Verificar se o usuário tem pedidos pagos primeiro
    checkPaidOrders();
  };

  const checkPaidOrders = async () => {
    if (!userProfile?.id) return;

    try {
      const { data: pedidos, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('client_id', userProfile.id)
        .in('status', ['pago', 'pago_pendente_video', 'video_aprovado']);

      if (error) throw error;

      if (!pedidos || pedidos.length === 0) {
        toast.error('Você precisa ter pelo menos um pedido pago para criar uma campanha');
        navigate('/paineis-digitais/loja');
        return;
      }

      // Se tem pedidos pagos, pode criar campanha
      toast.info('Funcionalidade de criação de campanha em desenvolvimento');
    } catch (error) {
      console.error('Erro ao verificar pedidos:', error);
      toast.error('Erro ao verificar pedidos');
    }
  };

  const handleEditCampaign = (campaignId: string) => {
    navigate(`/anunciante/campanhas/${campaignId}`);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

    try {
      const { error } = await supabase
        .from('campanhas')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast.success('Campanha excluída com sucesso');
      loadCampaigns();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando campanhas...</p>
      </div>
    );
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

      {/* Campanhas */}
      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Campanha #{campaign.id.substring(0, 8)}
                  </CardTitle>
                  {getStatusBadge(campaign.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(campaign.data_inicio)} - {formatDate(campaign.data_fim)}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Monitor className="h-4 w-4 mr-2" />
                  Painel: {campaign.painel_id.substring(0, 8)}...
                </div>

                {campaign.obs && (
                  <p className="text-sm text-gray-600">{campaign.obs}</p>
                )}

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditCampaign(campaign.id)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <Play className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-gray-500 mb-6">
              Você ainda não criou nenhuma campanha. Comece criando sua primeira campanha para seus painéis.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={handleCreateCampaign} className="bg-indexa-purple hover:bg-indexa-purple/90">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Campanha
              </Button>
              <Button variant="outline" onClick={() => navigate('/paineis-digitais/loja')}>
                Comprar Painéis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyCampaigns;
