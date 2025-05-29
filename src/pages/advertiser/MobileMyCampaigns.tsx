
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, Search, Filter, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MobilePageHeader from '@/components/mobile/MobilePageHeader';
import MobileCampaignCard from '@/components/mobile/MobileCampaignCard';
import MobileFloatingActionButton from '@/components/mobile/MobileFloatingActionButton';
import PullToRefresh from '@/components/mobile/PullToRefresh';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

const MobileMyCampaigns = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { 
    isMobile, 
    setupSwipeHandlers, 
    isRefreshing, 
    isPulling, 
    pullDistance,
    vibrate 
  } = useMobileOptimization();

  useEffect(() => {
    if (containerRef.current) {
      const cleanup = setupSwipeHandlers(containerRef.current, {
        onPullRefresh: loadCampaigns,
        onSwipeLeft: () => navigate('/anunciante/videos'),
        onSwipeRight: () => navigate('/anunciante/pedidos')
      });
      return cleanup;
    }
  }, [setupSwipeHandlers, navigate]);

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

  const handleCreateCampaign = async () => {
    vibrate([10, 10, 10]);
    
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

      toast.info('Funcionalidade de criação de campanha em desenvolvimento');
    } catch (error) {
      console.error('Erro ao verificar pedidos:', error);
      toast.error('Erro ao verificar pedidos');
    }
  };

  const handleEditCampaign = (campaignId: string) => {
    vibrate();
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
      vibrate([10, 100, 10]);
      loadCampaigns();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatsCards = () => {
    const stats = {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === 'ativo').length,
      pending: campaigns.filter(c => c.status === 'pendente').length
    };

    return (
      <div className="grid grid-cols-3 gap-3 px-4 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-500' },
          { label: 'Ativas', value: stats.active, color: 'bg-green-500' },
          { label: 'Pendentes', value: stats.pending, color: 'bg-yellow-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border"
          >
            <div className={`w-2 h-2 rounded-full ${stat.color} mb-2`} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-indexa-purple mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Carregando campanhas...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      <PullToRefresh
        isRefreshing={isRefreshing}
        isPulling={isPulling}
        pullDistance={pullDistance}
      />

      <MobilePageHeader
        title="Minhas Campanhas"
        subtitle={`${campaigns.length} campanha${campaigns.length !== 1 ? 's' : ''}`}
        onBack={() => navigate('/anunciante')}
        scrollBehavior="elevate"
        actions={
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className="h-10 w-10 rounded-full"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <div className="pb-20">
        {/* Search Bar */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 bg-white border-b"
            >
              <Input
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        {campaigns.length > 0 && getStatsCards()}

        {/* Campaigns List */}
        {filteredCampaigns.length > 0 ? (
          <div className="px-4 space-y-4">
            <AnimatePresence>
              {filteredCampaigns.map((campaign, index) => (
                <MobileCampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={handleEditCampaign}
                  onDelete={handleDeleteCampaign}
                  onView={(id) => navigate(`/anunciante/campanhas/${id}`)}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-4"
          >
            <div className="mx-auto w-24 h-24 bg-indexa-purple/10 rounded-full flex items-center justify-center mb-6">
              <TrendingUp className="h-12 w-12 text-indexa-purple" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Nenhuma campanha encontrada</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              {searchTerm 
                ? 'Nenhuma campanha corresponde à sua busca. Tente outro termo.'
                : 'Você ainda não criou nenhuma campanha. Comece criando sua primeira campanha!'
              }
            </p>
            {!searchTerm && (
              <div className="space-y-3">
                <Button 
                  onClick={handleCreateCampaign}
                  className="bg-indexa-purple hover:bg-indexa-purple/90 w-full max-w-xs"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Campanha
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/paineis-digitais/loja')}
                  className="w-full max-w-xs"
                >
                  Comprar Painéis
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      {campaigns.length > 0 && (
        <MobileFloatingActionButton
          onClick={handleCreateCampaign}
          label="Nova Campanha"
        />
      )}
    </div>
  );
};

export default MobileMyCampaigns;
