import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useClientPageContext } from '@/hooks/useClientPageContext';

// Lista de emails autorizados para fase de testes da Sofia Cliente
const SOFIA_CLIENT_BETA_EMAILS = [
  'jefi92@gmail.com',
];

type SofiaClientState = 'idle' | 'initializing' | 'connecting' | 'connected' | 'error';

interface NavigationAction {
  type: 'navigate';
  page: string;
  path: string;
  label: string;
  description?: string;
  pedido_id?: string;
}

interface QRCodeAction {
  type: 'qrcode';
  pedido_id: string;
  valor: number;
}

type SofiaAction = NavigationAction | QRCodeAction | null;

interface SofiaClientContextValue {
  state: SofiaClientState;
  isSpeaking: boolean;
  transcript: string;
  userTranscript: string;
  error: string | null;
  currentAction: SofiaAction;
  isEnabled: boolean;
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  sendMessage: (text: string) => void;
  clearAction: () => void;
  executeAction: (action: SofiaAction) => void;
}

const SofiaClientContext = createContext<SofiaClientContextValue | null>(null);

export const useSofiaClient = () => {
  const context = useContext(SofiaClientContext);
  if (!context) {
    throw new Error('useSofiaClient must be used within SofiaClientProvider');
  }
  return context;
};

interface SofiaClientProviderProps {
  children: React.ReactNode;
}

export const SofiaClientProvider: React.FC<SofiaClientProviderProps> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const pageContext = useClientPageContext();
  const [state, setState] = useState<SofiaClientState>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<SofiaAction>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  // Verificar se o usuário está na lista beta
  useEffect(() => {
    const email = userProfile?.email || user?.email;
    
    console.log('[Sofia Client] 🔍 Verificando acesso beta:', { 
      userProfileEmail: userProfile?.email, 
      authEmail: user?.email,
      emailUsado: email 
    });
    
    if (email) {
      const isAllowed = SOFIA_CLIENT_BETA_EMAILS.includes(email.toLowerCase());
      setIsEnabled(isAllowed);
      
      if (isAllowed) {
        console.log('[Sofia Client] ✅ Beta access enabled for:', email);
      } else {
        console.log('[Sofia Client] ⛔ User not in beta list:', email);
      }
    } else {
      console.log('[Sofia Client] ⚠️ Nenhum email disponível ainda');
      setIsEnabled(false);
    }
  }, [userProfile?.email, user?.email]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Sofia Client] ✅ Connected');
      setState('connected');
      setError(null);
      toast.success('Sofia conectada! Como posso ajudar?');
    },
    onDisconnect: () => {
      console.log('[Sofia Client] Disconnected');
      setState('idle');
      setTranscript('');
      setUserTranscript('');
    },
    onMessage: (message: any) => {
      try {
        const msgType = message?.type || 'unknown';
        
        // User transcript
        if (msgType === 'user_transcript') {
          const text = message?.user_transcription_event?.user_transcript || '';
          console.log('[Sofia Client] 🎤 User:', text);
          setUserTranscript(text);
        }
        
        // Agent response
        if (msgType === 'agent_response') {
          const text = message?.agent_response_event?.agent_response || '';
          console.log('[Sofia Client] 🤖 Sofia:', text);
          setTranscript(text);
        }

        // Tool results (for navigation, QR codes, etc.)
        if (msgType === 'tool_result' || msgType === 'agent_tool_response') {
          const result = message?.tool_result || message?.agent_tool_response || {};
          console.log('[Sofia Client] 🔧 Tool result:', result);
          
          // Parse action from tool result
          try {
            const data = typeof result === 'string' ? JSON.parse(result) : result;
            if (data?.action) {
              console.log('[Sofia Client] 📍 Action received:', data.action);
              setCurrentAction(data.action);
            }
          } catch (e) {
            console.log('[Sofia Client] Could not parse tool result as JSON');
          }
        }

        // Handle client tool calls (navigation, QR codes)
        if (msgType === 'client_tool_call') {
          const toolCall = message?.client_tool_call || {};
          console.log('[Sofia Client] 🔧 Client tool call:', toolCall);
          
          if (toolCall.tool_name === 'navegar_pagina') {
            const params = toolCall.parameters || {};
            const pathMap: Record<string, { path: string; label: string }> = {
              'meus_pedidos': { path: '/advertiser/meus-pedidos', label: 'Meus Pedidos' },
              'enviar_video': { path: '/advertiser/enviar-video', label: 'Enviar Vídeo' },
              'ver_predios': { path: '/advertiser/predios', label: 'Prédios Disponíveis' },
              'perfil': { path: '/advertiser/profile', label: 'Meu Perfil' },
              'carrinho': { path: '/advertiser/carrinho', label: 'Carrinho' },
              'suporte': { path: '/advertiser/suporte', label: 'Suporte' },
            };
            
            const destination = pathMap[params.destino];
            if (destination) {
              setCurrentAction({
                type: 'navigate',
                page: params.destino,
                path: destination.path,
                label: destination.label,
                pedido_id: params.pedido_id,
              });
            }
          }
          
          if (toolCall.tool_name === 'gerar_qrcode') {
            const params = toolCall.parameters || {};
            setCurrentAction({
              type: 'qrcode',
              pedido_id: params.pedido_id,
              valor: params.valor || 0,
            });
          }
        }

      } catch (e) {
        console.error('[Sofia Client] Error processing message:', e);
      }
    },
    onError: (err: any) => {
      console.error('[Sofia Client] ❌ Error:', err);
      const errorMessage = typeof err === 'string' ? err : (err?.message || 'Erro na conexão');
      setError(errorMessage);
      setState('error');
      toast.error('Erro na conexão com Sofia');
    },
  });

  const isSpeaking = conversation.isSpeaking;

  const startCall = useCallback(async () => {
    if (state !== 'idle' && state !== 'error') {
      console.log('[Sofia Client] Call already in progress');
      return;
    }

    setState('initializing');
    setError(null);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setState('connecting');

      // Build page context to send
      const currentPageContext = {
        currentPath: pageContext.currentPath,
        currentPage: pageContext.currentPage,
        section: pageContext.section,
        timeOnPage: pageContext.timeOnPage,
        lastActions: pageContext.lastActions.slice(0, 5),
      };

      console.log('[Sofia Client] Sending page context:', currentPageContext);

      // Get token from client-specific endpoint with page context
      const { data, error: fnError } = await supabase.functions.invoke('sofia-client-token', {
        body: {
          pageContext: currentPageContext,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao obter token');
      }

      if (!data?.token) {
        throw new Error('Token não recebido');
      }

      console.log('[Sofia Client] Token obtained, starting session...');
      console.log('[Sofia Client] User context:', data.user_context);

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });

    } catch (err: any) {
      console.error('[Sofia Client] Failed to start:', err);
      setState('error');
      setError(err.message || 'Erro ao iniciar');

      if (err.name === 'NotAllowedError') {
        toast.error('Permissão de microfone negada');
      } else {
        toast.error(err.message || 'Erro ao conectar com Sofia');
      }
    }
  }, [state, conversation, pageContext]);

  const endCall = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('[Sofia Client] Error ending session:', err);
    }
    
    setState('idle');
    setTranscript('');
    setUserTranscript('');
    setError(null);
    setCurrentAction(null);
    toast.info('Chamada encerrada');
  }, [conversation]);

  const sendMessage = useCallback((text: string) => {
    if (conversation.status === 'connected') {
      conversation.sendUserMessage(text);
    }
  }, [conversation]);

  const clearAction = useCallback(() => {
    setCurrentAction(null);
  }, []);

  const executeAction = useCallback((action: SofiaAction) => {
    setCurrentAction(action);
  }, []);

  return (
    <SofiaClientContext.Provider
      value={{
        state,
        isSpeaking,
        transcript,
        userTranscript,
        error,
        currentAction,
        isEnabled,
        startCall,
        endCall,
        sendMessage,
        clearAction,
        executeAction,
      }}
    >
      {children}
    </SofiaClientContext.Provider>
  );
};
