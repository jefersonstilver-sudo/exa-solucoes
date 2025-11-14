import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Building2, Wifi } from 'lucide-react';

/**
 * Página exibida quando o painel está conectado mas ainda não foi vinculado a um prédio
 * Monitora em tempo real quando o prédio for vinculado e redireciona automaticamente
 */
const PainelAguardandoVinculo = () => {
  const { painelId } = useParams<{ painelId: string }>();
  const navigate = useNavigate();
  const [painelInfo, setPainelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!painelId) return;

    // Buscar informações do painel
    const carregarPainel = async () => {
      const { data, error } = await supabase
        .from('painels')
        .select('*, buildings(*)')
        .eq('id', painelId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar painel:', error);
        return;
      }

      if (data) {
        setPainelInfo(data);
        setLoading(false);

        // Se já tem prédio vinculado, redirecionar imediatamente
        if (data.building_id) {
          console.log('✅ Prédio vinculado detectado, redirecionando...');
          window.location.href = `/painel/${data.building_id}`;
        }
      }
    };

    carregarPainel();

    // Monitorar mudanças em tempo real
    const channel = supabase
      .channel(`painel-${painelId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'painels',
          filter: `id=eq.${painelId}`
        },
        (payload) => {
          console.log('🔄 Painel atualizado:', payload);
          const newData = payload.new as any;
          
          if (newData.building_id) {
            console.log('✅ Prédio vinculado! Redirecionando...');
            window.location.href = `/painel/${newData.building_id}`;
          }
        }
      )
      .subscribe();

    // Enviar heartbeat a cada 30 segundos
    const heartbeatInterval = setInterval(async () => {
      await supabase.functions.invoke('painel-heartbeat', {
        body: {
          painel_id: painelId,
          url_atual: window.location.href,
          device_info: {
            userAgent: navigator.userAgent,
            screen: {
              width: window.screen.width,
              height: window.screen.height
            },
            language: navigator.language
          }
        }
      });
    }, 30000);

    // Entrar em fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn('Não foi possível entrar em fullscreen:', err);
      });
    }

    return () => {
      channel.unsubscribe();
      clearInterval(heartbeatInterval);
    };
  }, [painelId]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
        <div className="text-white text-2xl animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] p-8">
      <Helmet>
        <title>Painel {painelInfo?.numero_painel || ''} - Aguardando Vínculo</title>
      </Helmet>

      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo/Ícone */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-[#8B1538]/20 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-[#8B1538]" />
          </div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">
            Painel {painelInfo?.numero_painel || 'Digital'}
          </h1>
          <p className="text-xl text-gray-400">
            Conectado e Aguardando Vinculação
          </p>
        </div>

        {/* Status */}
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-500/20 rounded-full">
          <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
          <span className="text-green-400 font-medium">Online - Conectado ao Sistema</span>
        </div>

        {/* Informações */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 space-y-4">
          <p className="text-gray-300 text-lg leading-relaxed">
            Este painel está <strong className="text-white">conectado com sucesso</strong> e aguardando ser vinculado a um prédio/localização.
          </p>
          <p className="text-gray-400">
            Acesse o <strong className="text-white">Painel Administrativo</strong> e vincule este dispositivo ao local desejado.
          </p>
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-gray-500">
              Código do Painel: <span className="text-white font-mono">{painelInfo?.code}</span>
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <p className="text-gray-500 text-sm">
          O sistema detectará automaticamente quando o vínculo for realizado e iniciará a reprodução de conteúdo.
        </p>
      </div>
    </div>
  );
};

export default PainelAguardandoVinculo;
