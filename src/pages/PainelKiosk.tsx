import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';

const PainelKiosk = () => {
  const { token } = useParams<{ token: string }>();
  const [vinculado, setVinculado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [painelData, setPainelData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const comandosChannel = useRef<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const inicializar = async () => {
      if (token) {
        await vincularComToken(token);
      } else {
        const painelToken = localStorage.getItem('painel_token');
        const painelInfo = localStorage.getItem('painel_info');

        if (painelToken && painelInfo) {
          const info = JSON.parse(painelInfo);
          setPainelData(info);
          setVinculado(true);
          iniciarHeartbeat(painelToken);
          escutarComandos(painelToken);
          ativarFullscreen();
        }
      }
      setLoading(false);
    };

    inicializar();

    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (comandosChannel.current) supabase.removeChannel(comandosChannel.current);
    };
  }, [token]);

  const vincularComToken = async (accessToken: string) => {
    try {
      console.log('🔍 [PAINEL_KIOSK] Tentando vincular com token:', accessToken);
      
      const { data: painelDB, error: painelError } = await supabase
        .from('painels')
        .select('*, buildings(nome, endereco)')
        .eq('token_acesso', accessToken)
        .maybeSingle();

      console.log('📊 [PAINEL_KIOSK] Resultado da busca:', { painelDB, painelError });

      if (painelError) {
        console.error('❌ [PAINEL_KIOSK] Erro na query:', painelError);
        throw new Error(`Erro ao buscar painel: ${painelError.message}`);
      }

      if (!painelDB) {
        console.error('❌ [PAINEL_KIOSK] Painel não encontrado para token:', accessToken);
        throw new Error('Token inválido ou painel não encontrado');
      }

      console.log('✅ [PAINEL_KIOSK] Painel encontrado:', painelDB.numero_painel);

      const { error: updateError } = await supabase
        .from('painels')
        .update({
          status_vinculo: 'vinculado',
          status: 'online',
          data_vinculacao: new Date().toISOString(),
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
          }
        })
        .eq('id', painelDB.id);

      if (updateError) throw updateError;

      const painelInfo = {
        painel_id: painelDB.id,
        numero_painel: painelDB.numero_painel,
        building: painelDB.buildings,
        url_painel: 'https://exa.tec.br',
      };

      localStorage.setItem('painel_token', painelDB.id);
      localStorage.setItem('painel_info', JSON.stringify(painelInfo));

      setPainelData(painelInfo);
      setVinculado(true);
      
      iniciarHeartbeat(painelDB.id);
      escutarComandos(painelDB.id);
      ativarFullscreen();
    } catch (error: any) {
      console.error('Erro ao vincular com token:', error);
      toast.error(error.message || 'Erro ao vincular painel');
      setLoading(false);
    }
  };

  const ativarFullscreen = () => {
    setTimeout(() => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log('Erro ao ativar fullscreen:', err);
        });
      }
    }, 1000);
  };

  const iniciarHeartbeat = (painelId: string) => {
    console.log('💓 [PAINEL_KIOSK] Iniciando heartbeat para painel:', painelId);
    enviarHeartbeat(painelId);
    heartbeatInterval.current = setInterval(() => {
      enviarHeartbeat(painelId);
    }, 30000);
  };

  const enviarHeartbeat = async (painelId: string) => {
    try {
      await supabase.functions.invoke('painel-heartbeat', {
        body: {
          painel_id: painelId,
          url_atual: painelData?.url_painel || window.location.href,
          device_info: {
            userAgent: navigator.userAgent,
            online: navigator.onLine,
          },
        },
      });
      console.log('💓 Heartbeat enviado');
    } catch (error) {
      console.error('Erro no heartbeat:', error);
    }
  };

  const escutarComandos = (painelId: string) => {
    comandosChannel.current = supabase
      .channel('comandos-painel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'paineis_comandos',
          filter: `painel_id=eq.${painelId}`,
        },
        (payload) => {
          console.log('📡 Comando recebido:', payload);
          executarComando(payload.new);
        }
      )
      .subscribe();
  };

  const executarComando = async (comando: any) => {
    console.log('Executando comando:', comando.comando);

    try {
      switch (comando.comando) {
        case 'reiniciar_app':
          toast.info('Reiniciando aplicação...');
          setTimeout(() => window.location.reload(), 2000);
          break;

        case 'atualizar_url':
          if (comando.parametros?.url) {
            const newPainelData = { ...painelData, url_painel: comando.parametros.url };
            setPainelData(newPainelData);
            localStorage.setItem('painel_info', JSON.stringify(newPainelData));
            toast.success('Conteúdo atualizado!');
          }
          break;

        case 'desvincular':
          localStorage.removeItem('painel_token');
          localStorage.removeItem('painel_info');
          if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
          if (comandosChannel.current) supabase.removeChannel(comandosChannel.current);
          toast.info('Painel desvinculado');
          setTimeout(() => window.location.reload(), 2000);
          break;
      }

      await supabase
        .from('paineis_comandos')
        .update({
          status: 'executado',
          executado_em: new Date().toISOString(),
        })
        .eq('id', comando.id);
    } catch (error) {
      console.error('Erro ao executar comando:', error);
      await supabase
        .from('paineis_comandos')
        .update({
          status: 'erro',
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
        })
        .eq('id', comando.id);
    }
  };

  // Tela de aguardando conexão - Fullscreen vermelha com logo EXA
  if (loading || !vinculado) {
    return (
      <>
        <Helmet>
          <title>EXA Mídia - Sistema de Painéis Digitais</title>
        </Helmet>
        
        <div className="fixed inset-0 bg-[#8B1538] flex items-center justify-center overflow-hidden">
          {/* Indicador de conexão no canto superior direito */}
          <div className="fixed top-6 right-6 z-50">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5 text-white animate-pulse" />
                  <span className="text-white text-sm font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-white/60" />
                  <span className="text-white/60 text-sm font-medium">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Conteúdo central */}
          <div className="flex flex-col items-center justify-center gap-8 animate-fade-in">
            {/* Logo EXA com animação */}
            <div className="relative">
              {/* Círculo de pulso ao fundo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 bg-white/5 rounded-full animate-[ping_3s_ease-in-out_infinite]"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 bg-white/10 rounded-full animate-[ping_2s_ease-in-out_infinite]"></div>
              </div>
              
              {/* Logo EXA */}
              <div className="relative z-10 animate-[scale-in_0.5s_ease-out]">
                <svg 
                  width="200" 
                  height="200" 
                  viewBox="0 0 200 200" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="drop-shadow-2xl"
                >
                  <text
                    x="50%"
                    y="50%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="white"
                    fontSize="80"
                    fontWeight="700"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    letterSpacing="-2"
                  >
                    exa
                  </text>
                </svg>
              </div>
            </div>

            {/* Texto */}
            <div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h1 className="text-white text-3xl font-bold tracking-wide">
                Sistema de Painéis Digitais
              </h1>
              <div className="flex items-center justify-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite]"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite_0.2s]"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite_0.4s]"></div>
                </div>
                <p className="text-white/90 text-xl">
                  Aguardando conexão
                </p>
              </div>
            </div>

            {/* Barra de progresso animada */}
            <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="h-full bg-white/80 rounded-full animate-[pulse_2s_ease-in-out_infinite]"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Tela do painel vinculado - iframe fullscreen
  return (
    <>
      <Helmet>
        <title>Painel EXA - {painelData?.numero_painel || 'Carregando...'}</title>
      </Helmet>

      <div className="w-screen h-screen overflow-hidden bg-black">
        <iframe
          src={painelData?.url_painel || 'https://exa.tec.br'}
          className="w-full h-full border-0"
          title="Conteúdo do Painel"
          allow="autoplay; fullscreen"
        />
      </div>
    </>
  );
};

export default PainelKiosk;
