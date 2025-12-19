import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageContext, type PageContext } from '@/hooks/usePageContext';

type SofiaState = 'idle' | 'initializing' | 'connecting' | 'connected';

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
  const hasConnectedRef = useRef(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Sofia] Connected to ElevenLabs');
      setState('connected');
      hasConnectedRef.current = true;
      toast.success('Sofia conectada!');
    },
    onDisconnect: () => {
      console.log('[Sofia] Disconnected');
      setState('idle');
      setTranscript('');
      setUserTranscript('');
      hasConnectedRef.current = false;
    },
    onMessage: (message: any) => {
      console.log('[Sofia] Message:', message);
      
      if (message?.type === 'user_transcript') {
        const text = message?.user_transcription_event?.user_transcript || '';
        setUserTranscript(text);
      }
      
      if (message?.type === 'agent_response') {
        const text = message?.agent_response_event?.agent_response || '';
        setTranscript(text);
      }
    },
    onError: (err: any) => {
      console.error('[Sofia] Error:', err);
      const msg = typeof err === 'string' ? err : (err?.message || 'Erro na conexão');
      setError(msg);
      setState('idle');
      toast.error('Erro na conexão com Sofia');
    },
  });

  const isSpeaking = conversation.isSpeaking;

  // Send page context when it changes
  useEffect(() => {
    if (state === 'connected' && pageContext.fullContext !== lastSentContextRef.current) {
      lastSentContextRef.current = pageContext.fullContext;
      // Use sendContextualUpdate for context without triggering response
      try {
        if (conversation.status === 'connected') {
          // Send as contextual update (doesn't require response)
          console.log('[Sofia] Sending page context:', pageContext.fullContext);
        }
      } catch (e) {
        console.error('[Sofia] Failed to send context:', e);
      }
    }
  }, [state, pageContext, conversation]);

  const startCall = useCallback(async () => {
    if (state !== 'idle') return;
    
    setState('initializing');
    setError(null);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setState('connecting');
      
      // Get token from edge function
      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-conversation-token');
      
      if (fnError) {
        throw new Error(fnError.message || 'Erro ao obter token');
      }
      
      if (!data?.token) {
        throw new Error('Token não recebido do servidor');
      }
      
      console.log('[Sofia] Token obtained, starting session...');
      
      // Start WebRTC conversation
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
      
    } catch (err: any) {
      console.error('[Sofia] Failed to start:', err);
      setState('idle');
      setError(err.message || 'Erro ao iniciar chamada');
      
      if (err.name === 'NotAllowedError') {
        toast.error('Permissão de microfone negada');
      } else {
        toast.error(err.message || 'Erro ao conectar com Sofia');
      }
    }
  }, [state, conversation]);

  const endCall = useCallback(async () => {
    try {
      await conversation.endSession();
      setState('idle');
      setTranscript('');
      setUserTranscript('');
      toast.info('Chamada encerrada');
    } catch (err) {
      console.error('[Sofia] Error ending session:', err);
    }
  }, [conversation]);

  const sendContextualUpdate = useCallback((text: string) => {
    if (conversation.status === 'connected') {
      try {
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
      }}
    >
      {children}
    </SofiaContext.Provider>
  );
};
