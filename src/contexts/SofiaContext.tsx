import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageContext, type PageContext } from '@/hooks/usePageContext';

type SofiaState = 'idle' | 'initializing' | 'connecting' | 'connected' | 'error';

interface SofiaContextValue {
  state: SofiaState;
  isSpeaking: boolean;
  transcript: string;
  userTranscript: string;
  error: string | null;
  pageContext: PageContext;
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  sendContextualUpdate: (text: string) => void;
  retryConnection: () => Promise<void>;
}

const SofiaContext = createContext<SofiaContextValue | null>(null);

export const useSofia = () => {
  const context = useContext(SofiaContext);
  if (!context) {
    throw new Error('useSofia must be used within SofiaProvider');
  }
  return context;
};

interface SofiaProviderProps {
  children: React.ReactNode;
}

export const SofiaProvider: React.FC<SofiaProviderProps> = ({ children }) => {
  const [state, setState] = useState<SofiaState>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const pageContext = usePageContext();
  const lastSentContextRef = useRef<string>('');
  const sofiaConfigCheckedRef = useRef(false);
  const sofiaConfigInFlightRef = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('\n═══════════════════════════════════════════════════');
      console.log('[Sofia] ✅ CONNECTED to ElevenLabs WebRTC');
      console.log('[Sofia] Session active - Voice ready');
      console.log('═══════════════════════════════════════════════════\n');
      setState('connected');
      setError(null);
      toast.success('Sofia conectada!');
    },
    onDisconnect: () => {
      console.log('\n═══════════════════════════════════════════════════');
      console.log('[Sofia] 🔌 DISCONNECTED from ElevenLabs');
      console.log('═══════════════════════════════════════════════════\n');
      setState('idle');
      setTranscript('');
      setUserTranscript('');
    },
    onMessage: (message: any) => {
      try {
        const msgType = message?.type || 'unknown';
        
        // Log all messages with clear formatting
        console.log(`\n[Sofia] 📨 Message type: ${msgType}`);
        
        // Handle error messages
        if (msgType === 'error' || msgType === 'tool_error') {
          console.error('[Sofia] ⚠️ Agent error:', JSON.stringify(message, null, 2));
          return;
        }
        
        // User transcript
        if (msgType === 'user_transcript') {
          const text = message?.user_transcription_event?.user_transcript || '';
          console.log(`[Sofia] 🎤 USER: "${text}"`);
          setUserTranscript(text);
        }
        
        // Agent response
        if (msgType === 'agent_response') {
          const text = message?.agent_response_event?.agent_response || '';
          console.log(`[Sofia] 🤖 SOFIA: "${text}"`);
          setTranscript(text);
        }

        // Tool calls - CRITICAL for debugging admin_auth and consultar_sistema
        if (msgType === 'tool_call' || msgType === 'client_tool_call') {
          const toolInfo = message?.tool_call || message?.client_tool_call || {};
          console.log('\n═══════════════════════════════════════════════════');
          console.log('[Sofia] 🔧 TOOL CALL');
          console.log(`[Sofia] Tool name: ${toolInfo?.name || toolInfo?.tool_name || 'unknown'}`);
          console.log(`[Sofia] Parameters:`, JSON.stringify(toolInfo?.parameters || toolInfo?.arguments || {}, null, 2));
          console.log('═══════════════════════════════════════════════════\n');
        }

        // Tool results
        if (msgType === 'tool_result' || msgType === 'agent_tool_response') {
          const resultInfo = message?.tool_result || message?.agent_tool_response || {};
          console.log('\n═══════════════════════════════════════════════════');
          console.log('[Sofia] 🔧 TOOL RESULT');
          console.log(`[Sofia] Result:`, JSON.stringify(resultInfo, null, 2));
          console.log('═══════════════════════════════════════════════════\n');
        }

        // Conversation init metadata
        if (msgType === 'conversation_initiation_metadata') {
          console.log('[Sofia] 📋 Conversation initialized:', JSON.stringify(message, null, 2));
        }

      } catch (e) {
        console.error('[Sofia] Failed to process message:', e, 'Original:', message);
      }
    },
    onError: (err: any) => {
      console.error('\n═══════════════════════════════════════════════════');
      console.error('[Sofia] ❌ ERROR RECEIVED');
      console.error('[Sofia] Raw error:', err);
      
      let errorMessage = 'Erro na conexão';
      let errorCode = 'unknown';
      
      try {
        if (typeof err === 'string') {
          errorMessage = err;
        } else if (err) {
          errorMessage = err.message || err.toString?.() || 'Erro desconhecido';
          errorCode = err.code || err.reason || err.error_type || 'unknown';
        }
      } catch (e) {
        console.error('[Sofia] Error extracting details:', e);
      }
      
      console.error(`[Sofia] Processed - message: ${errorMessage}, code: ${errorCode}`);
      console.error('═══════════════════════════════════════════════════\n');

      setError(`${errorMessage} (código: ${errorCode})`);
      setState('error');
      
      toast.error('Erro na conexão com Sofia', {
        description: `${errorMessage}. Tente novamente.`,
      });
    },
  });

  const isSpeaking = conversation.isSpeaking;

  const ensureSofiaAgentConfigured = useCallback(async () => {
    if (sofiaConfigCheckedRef.current || sofiaConfigInFlightRef.current) return;

    sofiaConfigInFlightRef.current = true;
    try {
      // Only works for authenticated users (verify_jwt=true). If not authorized, skip silently.
      const { data: statusData, error: statusError } = await supabase.functions.invoke('configure-sofia-agent', {
        body: { action: 'status' },
      });

      if (statusError) {
        // Most common for non-admin views: 401/403
        console.log('[Sofia] ℹ️ configure-sofia-agent status not available:', statusError.message);
        return;
      }

      const tools: string[] = statusData?.tools || [];
      const hasConsultarSistema = tools.includes('consultar_sistema');
      const hasAdminAuth = tools.includes('admin_auth');

      if (hasConsultarSistema && hasAdminAuth) {
        sofiaConfigCheckedRef.current = true;
        console.log('[Sofia] ✅ ElevenLabs agent already configured');
        return;
      }

      console.log('[Sofia] ⚠️ ElevenLabs agent missing tools, configuring now...');
      toast.info('Preparando a Sofia (configurando ferramentas)...');

      const { data: cfgData, error: cfgError } = await supabase.functions.invoke('configure-sofia-agent', {
        body: { action: 'configure' },
      });

      if (cfgError) {
        console.error('[Sofia] ❌ configure-sofia-agent failed:', cfgError);
        return;
      }

      if (cfgData?.success) {
        sofiaConfigCheckedRef.current = true;
        console.log('[Sofia] ✅ ElevenLabs agent configured:', cfgData?.details);
        toast.success('Sofia preparada. Pode falar!');
      } else {
        console.error('[Sofia] ❌ configure-sofia-agent returned failure:', cfgData);
      }
    } catch (e) {
      console.error('[Sofia] ❌ ensureSofiaAgentConfigured error:', e);
    } finally {
      sofiaConfigInFlightRef.current = false;
    }
  }, []);

  // Core connection logic
  const performConnection = useCallback(async () => {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('[Sofia] 🚀 STARTING CONNECTION');
    console.log('═══════════════════════════════════════════════════\n');
    
    try {
      // Ensure ElevenLabs agent has the correct tools
      console.log('[Sofia] Step 1: Checking agent configuration...');
      await ensureSofiaAgentConfigured();

      console.log('[Sofia] Step 2: Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Sofia] ✅ Microphone permission granted');
      
      setState('connecting');
      
      console.log('[Sofia] Step 3: Fetching conversation token...');
      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-conversation-token');
      
      console.log('[Sofia] Token response:', { success: data?.success, hasToken: !!data?.token, error: fnError?.message });
      
      if (fnError) {
        console.error('[Sofia] ❌ Token fetch error:', fnError);
        throw new Error(fnError.message || 'Erro ao obter token');
      }
      
      if (!data?.token) {
        console.error('[Sofia] ❌ No token in response:', data);
        throw new Error('Token não recebido do servidor');
      }
      
      console.log('[Sofia] ✅ Token obtained');
      console.log('[Sofia] Step 4: Starting WebRTC session...');
      
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
      
      console.log('[Sofia] WebRTC session started, waiting for onConnect callback...');
      
    } catch (err: any) {
      console.error('[Sofia] ❌ Connection failed:', err);
      throw err;
    }
  }, [conversation, ensureSofiaAgentConfigured]);

  // Send page context when it changes
  useEffect(() => {
    if (state === 'connected' && pageContext.fullContext !== lastSentContextRef.current) {
      lastSentContextRef.current = pageContext.fullContext;
      console.log('[Sofia] 📍 Page context updated:', pageContext.section);
    }
  }, [state, pageContext]);

  const startCall = useCallback(async () => {
    if (state !== 'idle' && state !== 'error') {
      console.log('[Sofia] Call already in progress, state:', state);
      return;
    }
    
    setState('initializing');
    setError(null);
    
    try {
      await performConnection();
    } catch (err: any) {
      console.error('[Sofia] Failed to start:', err);
      setState('error');
      setError(err.message || 'Erro ao iniciar chamada');
      
      if (err.name === 'NotAllowedError') {
        toast.error('Permissão de microfone negada');
      } else {
        toast.error(err.message || 'Erro ao conectar com Sofia');
      }
    }
  }, [state, performConnection]);

  const endCall = useCallback(async () => {
    console.log('[Sofia] 📞 Ending call...');
    
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('[Sofia] Error ending session:', err);
    }
    
    setState('idle');
    setTranscript('');
    setUserTranscript('');
    setError(null);
    toast.info('Chamada encerrada');
  }, [conversation]);

  const retryConnection = useCallback(async () => {
    console.log('[Sofia] 🔄 Manual retry requested');
    setState('idle');
    setError(null);
    await startCall();
  }, [startCall]);

  const sendContextualUpdate = useCallback((text: string) => {
    if (conversation.status === 'connected') {
      try {
        console.log('[Sofia] 📤 Sending message:', text);
        conversation.sendUserMessage(text);
      } catch (e) {
        console.error('[Sofia] Failed to send message:', e);
      }
    }
  }, [conversation]);

  return (
    <SofiaContext.Provider
      value={{
        state,
        isSpeaking,
        transcript,
        userTranscript,
        error,
        pageContext,
        startCall,
        endCall,
        sendContextualUpdate,
        retryConnection,
      }}
    >
      {children}
    </SofiaContext.Provider>
  );
};
