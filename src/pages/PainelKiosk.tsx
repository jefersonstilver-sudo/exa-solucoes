import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Wifi, WifiOff } from 'lucide-react';
import { getOrCreateFingerprint, clearStoredFingerprint } from '@/utils/deviceFingerprint';
import { getPainelContentUrl } from '@/config/painel';

const PainelKiosk = () => {
  const { token } = useParams<{ token: string }>();
  const [vinculado, setVinculado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [painelData, setPainelData] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [codigoInput, setCodigoInput] = useState('');
  const [validandoCodigo, setValidandoCodigo] = useState(false);
  const [erroValidacao, setErroValidacao] = useState('');
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const comandosChannel = useRef<any>(null);
  const reconnectAttempted = useRef(false);

  // Monitorar status online/offline
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

  // Inicializar fingerprint do dispositivo
  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const { fingerprint, deviceInfo: info } = await getOrCreateFingerprint();
        setDeviceFingerprint(fingerprint);
        setDeviceInfo(info);
        console.log('[PAINEL-KIOSK] Fingerprint inicializado:', fingerprint.substring(0, 16) + '...');
      } catch (error) {
        console.error('[PAINEL-KIOSK] Erro ao gerar fingerprint:', error);
      }
    };
    
    initFingerprint();
  }, []);

  // Tentar reconexão automática quando fingerprint estiver pronto
  useEffect(() => {
    if (!deviceFingerprint || reconnectAttempted.current) return;
    
    reconnectAttempted.current = true;
    
    const tryAutoReconnect = async () => {
      
      // Se tem token na URL, tentar carregar painel
      if (token) {
        await carregarPainel(token);
        setLoading(false);
        return;
      }
      
      // Se não tem token na URL, tentar reconectar via localStorage
      const storedToken = localStorage.getItem('painel_token');
      const storedPainelInfo = localStorage.getItem('painel_info');
      
      if (storedToken && storedPainelInfo) {
        console.log('[PAINEL-KIOSK] Tentando reconexão automática...');
        
        try {
          const painelInfo = JSON.parse(storedPainelInfo);
          
          // Verificar se o painel ainda está válido no banco
          const { data: painelDB, error } = await supabase
            .from('painels')
            .select('*, buildings(*)')
            .eq('token_acesso', storedToken)
            .maybeSingle();
          
          if (error || !painelDB) {
            console.log('[PAINEL-KIOSK] Painel não encontrado, limpando localStorage');
            localStorage.removeItem('painel_token');
            localStorage.removeItem('painel_info');
            clearStoredFingerprint();
            setLoading(false);
            return;
          }
          
          // Verificar se o fingerprint bate
          if (painelDB.device_fingerprint === deviceFingerprint) {
            console.log('[PAINEL-KIOSK] ✅ Reconexão automática bem-sucedida!');
            setPainelData(painelInfo);
            setVinculado(true);
            iniciarHeartbeat(storedToken);
            escutarComandos(storedToken);
            
            // Entrar em fullscreen automaticamente
            setTimeout(() => {
              ativarFullscreen();
            }, 500);
          } else {
            console.log('[PAINEL-KIOSK] ❌ Fingerprint não corresponde, limpando dados');
            localStorage.removeItem('painel_token');
            localStorage.removeItem('painel_info');
          }
        } catch (error) {
          console.error('[PAINEL-KIOSK] Erro na reconexão automática:', error);
        }
      }
      
      setLoading(false);
    };
    
    tryAutoReconnect();

    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (comandosChannel.current) supabase.removeChannel(comandosChannel.current);
    };
  }, [deviceFingerprint, token]);

  const carregarPainel = async (painelToken: string) => {
    try {
      const { data: painelDB, error } = await supabase
        .from('painels')
        .select('*, buildings(*)')
        .eq('token_acesso', painelToken)
        .maybeSingle();


      if (error || !painelDB) {
        console.error('[PAINEL-KIOSK] Painel não encontrado:', error);
        toast.error('Painel não encontrado');
        return;
      }

      console.log('[PAINEL-KIOSK] Painel carregado:', painelDB);
      
      // Se o painel já tem fingerprint registrado
      if (painelDB.device_fingerprint) {
        // Verificar se é o mesmo dispositivo
        if (painelDB.device_fingerprint === deviceFingerprint) {
          console.log('[PAINEL-KIOSK] ✅ Dispositivo reconhecido, conectando automaticamente...');
          await conectarPainel(painelDB);
          return;
        } else {
          console.log('[PAINEL-KIOSK] ⚠️ Dispositivo diferente, requer código de validação');
          setErroValidacao('Este painel já está conectado em outro dispositivo. Digite o código para reconectar.');
        }
      }
      
      // Se não tem fingerprint ou é dispositivo diferente, preparar para código
      setPainelData(painelDB);
      setLoading(false);
      
    } catch (error) {
      console.error('[PAINEL-KIOSK] Erro ao carregar painel:', error);
    }
  };

  const validarCodigo = async () => {
    if (!token || codigoInput.length !== 5) {
      setErroValidacao('Digite um código de 5 dígitos');
      return;
    }

    setValidandoCodigo(true);
    setErroValidacao('');

    try {
      console.log('🔍 [PAINEL_KIOSK] Validando código:', codigoInput);
      
      const { data: painelDB, error: painelError } = await supabase
        .from('painels')
        .select('*, buildings(nome, endereco)')
        .eq('token_acesso', token)
        .eq('codigo_vinculacao', codigoInput)
        .maybeSingle();

      if (painelError) {
        console.error('❌ [PAINEL_KIOSK] Erro na query:', painelError);
        setErroValidacao('Erro ao validar código. Tente novamente.');
        return;
      }

      if (!painelDB) {
        console.log('❌ [PAINEL_KIOSK] Código inválido');
        setErroValidacao('Código inválido. Verifique e tente novamente.');
        return;
      }

      // Verificar se já está conectado em OUTRO dispositivo
      if (painelDB.device_fingerprint && painelDB.device_fingerprint !== deviceFingerprint) {
        console.log('⚠️ [PAINEL_KIOSK] Painel já conectado em outro dispositivo');
        setErroValidacao('Este painel já está conectado em outro dispositivo. Desconecte-o primeiro no painel admin.');
        return;
      }

      console.log('✅ [PAINEL_KIOSK] Código válido, conectando painel...');
      await conectarPainel(painelDB);
    } catch (error) {
      console.error('❌ [PAINEL_KIOSK] Erro na validação:', error);
      setErroValidacao('Erro inesperado. Tente novamente.');
    } finally {
      setValidandoCodigo(false);
    }
  };

  const conectarPainel = async (painelDB: any) => {
    try {
      // Atualizar painel com fingerprint do dispositivo
      const { error: updateError } = await supabase
        .from('painels')
        .update({
          status_vinculo: 'conectado',
          status: 'online',
          primeira_conexao_at: painelDB.primeira_conexao_at || new Date().toISOString(),
          data_vinculacao: new Date().toISOString(),
          device_fingerprint: deviceFingerprint,
          device_info: deviceInfo
        })
        .eq('id', painelDB.id);

      if (updateError) throw updateError;

      // Inserir registro inicial no paineis_status
      await supabase
        .from('paineis_status')
        .upsert({
          painel_id: painelDB.id,
          status: 'online',
          ultimo_heartbeat: new Date().toISOString(),
          url_atual: window.location.href,
          ip_address: await getRealIP(),
          user_agent: navigator.userAgent,
          device_info: deviceInfo
        });

      console.log('[PAINEL-KIOSK] ✅ Painel conectado com sucesso! Fingerprint:', deviceFingerprint.substring(0, 16) + '...');
      toast.success('Painel conectado! Redirecionando...');

      // Salvar info para reconexão
      localStorage.setItem('painel_id', painelDB.id);
      localStorage.setItem('painel_token', painelDB.token_acesso);
      localStorage.setItem('device_fingerprint', deviceFingerprint);

      // Aguardar 1 segundo e redirecionar para página de reprodução
      setTimeout(() => {
        if (painelDB.building_id) {
          // Se tem prédio vinculado, vai para o player do prédio
          window.location.href = `/painel/${painelDB.building_id}`;
        } else {
          // Se não tem prédio, mostra tela de aguardo
          window.location.href = '/painel-aguardando-vinculo/' + painelDB.id;
        }
      }, 1000);

    } catch (error: any) {
      console.error('[PAINEL-KIOSK] Erro ao conectar painel:', error);
      toast.error('Erro ao conectar painel: ' + error.message);
      setValidandoCodigo(false);
    }
  };

  // Função auxiliar para obter IP real
  const getRealIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const ativarFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Não foi possível entrar em fullscreen:', err);
      });
    }
  };

  const iniciarHeartbeat = (painelId: string) => {
    // Enviar heartbeat imediatamente
    enviarHeartbeat(painelId);

    // Enviar heartbeat a cada 30 segundos
    heartbeatInterval.current = setInterval(() => {
      enviarHeartbeat(painelId);
    }, 30000);
  };

  const enviarHeartbeat = async (painelId: string) => {
    if (!isOnline) return;

    try {
      const { error } = await supabase.functions.invoke('painel-heartbeat', {
        body: {
          painel_id: painelId,
          url_atual: window.location.href,
          device_fingerprint: deviceFingerprint,
          device_info: deviceInfo
        }
      });

      if (error) {
        console.error('[HEARTBEAT] Erro:', error);
      } else {
        console.log('[HEARTBEAT] ✅ Enviado com sucesso');
      }
    } catch (error) {
      console.error('[HEARTBEAT] Erro ao enviar:', error);
    }
  };

  const escutarComandos = (painelId: string) => {
    comandosChannel.current = supabase
      .channel(`painel_comandos:${painelId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'paineis_comandos',
          filter: `painel_id=eq.${painelId}`
        }, 
        (payload) => {
          console.log('📨 [COMANDO] Recebido:', payload);
          executarComando(payload.new);
        }
      )
      .subscribe();
  };

  const executarComando = async (comando: any) => {
    console.log('⚙️ [COMANDO] Executando:', comando.comando);

    switch (comando.comando) {
      case 'reload':
        window.location.reload();
        break;
      case 'change_url':
        if (comando.parametros?.url) {
          window.location.href = comando.parametros.url;
        }
        break;
      case 'clear_cache':
        localStorage.clear();
        window.location.reload();
        break;
      default:
        console.warn('[COMANDO] Comando desconhecido:', comando.comando);
    }

    // Marcar comando como executado
    await supabase
      .from('paineis_comandos')
      .update({ executado: true, executado_em: new Date().toISOString() })
      .eq('id', comando.id);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="text-white text-2xl">Carregando...</div>
      </div>
    );
  }

  // Tela de vinculação (antes de conectar)
  if (!vinculado) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
        <Helmet>
          <title>Vincular Painel</title>
        </Helmet>

        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#8B1538] mb-2">INDEXA</h1>
            <p className="text-gray-600">Vincular Painel Digital</p>
          </div>

          {painelData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Token do Painel:</p>
              <p className="font-mono text-sm break-all">{token}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Vinculação (5 dígitos)
              </label>
              <input
                type="text"
                maxLength={5}
                value={codigoInput}
                onChange={(e) => setCodigoInput(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 text-2xl text-center font-mono border-2 border-gray-300 rounded-lg focus:border-[#8B1538] focus:outline-none"
                placeholder="00000"
              />
            </div>

            {erroValidacao && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{erroValidacao}</p>
              </div>
            )}

            <button
              onClick={validarCodigo}
              disabled={validandoCodigo || codigoInput.length !== 5}
              className="w-full py-3 bg-[#8B1538] text-white font-semibold rounded-lg hover:bg-[#6d0f2a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {validandoCodigo ? 'Validando...' : 'Conectar Painel'}
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Digite o código de 5 dígitos fornecido pelo administrador
          </div>
        </div>
      </div>
    );
  }

  // Tela principal do painel (após conectar)
  return (
    <div className="h-screen w-screen bg-black relative">
      <Helmet>
        <title>Painel {painelData?.numero_painel || 'Digital'}</title>
      </Helmet>

      {/* Indicador de status de conexão */}
      <div className="absolute top-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
          isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Conteúdo do painel */}
      <iframe
        src={painelData?.url_conteudo}
        className="w-full h-full border-none"
        title="Conteúdo do Painel"
        allow="autoplay; fullscreen"
      />
    </div>
  );
};

export default PainelKiosk;
