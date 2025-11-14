import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const PainelKiosk = () => {
  const [vinculado, setVinculado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [vinculando, setVinculando] = useState(false);
  const [painelData, setPainelData] = useState<any>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const comandosChannel = useRef<any>(null);

  useEffect(() => {
    // Verificar se já está vinculado
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
    setLoading(false);
  }, []);

  const ativarFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log('Erro ao ativar fullscreen:', err);
      });
    }
  };

  const vincularPainel = async () => {
    if (!codigo || codigo.length < 7) {
      toast.error('Digite um código válido');
      return;
    }

    setVinculando(true);
    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };

      const { data, error } = await supabase.functions.invoke('vincular-painel', {
        body: {
          codigo: codigo.toUpperCase(),
          device_info: deviceInfo,
        },
      });

      if (error) throw error;

      if (data?.success) {
        const painelInfo = {
          painel_id: data.painel_id,
          building: data.building,
          url_painel: data.url_painel,
        };

        localStorage.setItem('painel_token', data.token);
        localStorage.setItem('painel_info', JSON.stringify(painelInfo));

        setPainelData(painelInfo);
        setVinculado(true);
        toast.success('Painel vinculado com sucesso!');

        iniciarHeartbeat(data.token);
        escutarComandos(data.token);
        ativarFullscreen();
      } else {
        throw new Error(data?.error || 'Erro ao vincular painel');
      }
    } catch (error: any) {
      console.error('Erro ao vincular:', error);
      toast.error(error.message || 'Erro ao vincular painel');
    } finally {
      setVinculando(false);
    }
  };

  const iniciarHeartbeat = (painelId: string) => {
    // Enviar heartbeat imediatamente
    enviarHeartbeat(painelId);

    // Configurar intervalo de 30s
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

      // Marcar comando como executado
      await supabase
        .from('paineis_comandos')
        .update({
          status: 'executado',
          executado_em: new Date().toISOString(),
          resultado: { success: true },
        })
        .eq('id', comando.id);
    } catch (error) {
      console.error('Erro ao executar comando:', error);
    }
  };

  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (comandosChannel.current) supabase.removeChannel(comandosChannel.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vinculado) {
    return (
      <>
        <Helmet>
          <title>Painel EXA - Vínculo</title>
        </Helmet>
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
          <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold text-primary">EXA Mídia</h1>
              <p className="text-muted-foreground">Sistema de Painéis Digitais</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Digite o Código de Vínculo
                </label>
                <Input
                  type="text"
                  placeholder="EXA-XXXX"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="text-center text-2xl font-mono tracking-wider"
                />
              </div>

              <Button
                onClick={vincularPainel}
                disabled={vinculando || codigo.length < 7}
                className="w-full"
                size="lg"
              >
                {vinculando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vinculando...
                  </>
                ) : (
                  'Vincular Painel'
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Solicite o código ao administrador do sistema
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Painel EXA - {painelData?.building?.nome}</title>
      </Helmet>
      <div className="h-screen w-screen overflow-hidden bg-black">
        <iframe
          src={painelData?.url_painel || '/'}
          className="w-full h-full border-0"
          title="Conteúdo do Painel"
          allow="autoplay; fullscreen"
        />
      </div>
    </>
  );
};

export default PainelKiosk;
