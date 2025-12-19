import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageContext, type PageContext } from '@/hooks/usePageContext';

type SofiaState = 'idle' | 'initializing' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface SofiaContextValue {
  state: SofiaState;
  isSpeaking: boolean;
  transcript: string;
  userTranscript: string;
  error: string | null;
  pageContext: PageContext;
  reconnectAttempt: number;
  maxReconnectAttempts: number;
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

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY = 2000; // 2 seconds

export const SofiaProvider: React.FC<SofiaProviderProps> = ({ children }) => {
  const [state, setState] = useState<SofiaState>('idle');
  const [transcript, setTranscript] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  
  const pageContext = usePageContext();
  const lastSentContextRef = useRef<string>('');
  const hasConnectedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);
  const sessionActiveRef = useRef(false);

  // Cleanup reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Sofia] ✅ Connected to ElevenLabs WebRTC');
      setState('connected');
      hasConnectedRef.current = true;
      sessionActiveRef.current = true;
      setReconnectAttempt(0);
      setError(null);
      isReconnectingRef.current = false;
      clearReconnectTimeout();
      toast.success('Sofia conectada!');
    },
    onDisconnect: () => {
      console.log('[Sofia] 🔌 Disconnected from ElevenLabs');
      console.log('[Sofia] Session was active:', sessionActiveRef.current);
      console.log('[Sofia] Was reconnecting:', isReconnectingRef.current);
      
      const wasConnected = sessionActiveRef.current;
      sessionActiveRef.current = false;
      
      // If we were connected and got disconnected unexpectedly, try to reconnect
      if (wasConnected && !isReconnectingRef.current && reconnectAttempt < MAX_RECONNECT_ATTEMPTS) {
        console.log(`[Sofia] Unexpected disconnect, attempting reconnect (attempt ${reconnectAttempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        handleAutoReconnect();
      } else if (!isReconnectingRef.current) {
        setState('idle');
        setTranscript('');
        setUserTranscript('');
        hasConnectedRef.current = false;
      }
    },
    onMessage: (message: any) => {
      try {
        console.log('[Sofia] 📨 Message received:', JSON.stringify(message, null, 2));
        
        // Handle error messages safely
        if (message?.type === 'error' || message?.type === 'tool_error') {
          console.error('[Sofia] ⚠️ Agent error message:', message);
          // Don't throw, just log - let the conversation continue
          return;
        }
        
        if (message?.type === 'user_transcript') {
          const text = message?.user_transcription_event?.user_transcript || '';
          console.log('[Sofia] 🎤 User transcript:', text);
          setUserTranscript(text);
        }
        
        if (message?.type === 'agent_response') {
          const text = message?.agent_response_event?.agent_response || '';
          console.log('[Sofia] 🤖 Agent response:', text);
          setTranscript(text);
        }

        // Log tool calls for debugging
        if (message?.type === 'tool_call' || message?.type === 'client_tool_call') {
          console.log('[Sofia] 🔧 Tool call:', message?.tool_call || message?.client_tool_call);
        }

        if (message?.type === 'tool_result' || message?.type === 'agent_tool_response') {
          console.log('[Sofia] 🔧 Tool result:', message?.tool_result || message?.agent_tool_response);
        }
      } catch (e) {
        console.error('[Sofia] Failed to process message safely:', e, 'Original message:', message);
        // Don't rethrow - let the conversation continue
      }
    },
    onError: (err: any) => {
      // Safe error extraction - handle undefined/null errors
      console.error('[Sofia] ❌ Raw error object:', err);
      
      let errorMessage = 'Erro na conexão';
      let errorCode = 'unknown';
      
      try {
        if (typeof err === 'string') {
          errorMessage = err;
        } else if (err) {
          // Safely access error properties
          errorMessage = err.message || err.toString?.() || 'Erro desconhecido';
          errorCode = err.code || err.reason || err.error_type || 'unknown';
        }
      } catch (e) {
        console.error('[Sofia] Error while extracting error details:', e);
      }
      
      console.error('[Sofia] Processed error - message:', errorMessage, 'code:', errorCode);
      
      // Handle specific WebRTC/WebSocket errors
      const is1006Error = String(errorCode) === '1006' || 
                          String(errorMessage).includes('1006') || 
                          String(errorMessage).toLowerCase().includes('websocket') ||
                          String(errorMessage).toLowerCase().includes('abnormally');
      
      if (is1006Error) {
        console.log('[Sofia] WebSocket error 1006 detected - connection closed abnormally');
        
        if (reconnectAttempt < MAX_RECONNECT_ATTEMPTS && !isReconnectingRef.current) {
          handleAutoReconnect();
          return;
        }
      }

      setError(`${errorMessage} (código: ${errorCode})`);
      setState('error');
      
      if (!isReconnectingRef.current) {
        toast.error('Erro na conexão com Sofia', {
          description: `${errorMessage}. Tente novamente.`,
        });
      }
    },
  });

  const isSpeaking = conversation.isSpeaking;

  // Auto-reconnect with exponential backoff
  const handleAutoReconnect = useCallback(() => {
    if (isReconnectingRef.current || reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      console.log('[Sofia] Skipping auto-reconnect:', { 
        isReconnecting: isReconnectingRef.current, 
        attempt: reconnectAttempt,
        maxAttempts: MAX_RECONNECT_ATTEMPTS 
      });
      return;
    }

    isReconnectingRef.current = true;
    const nextAttempt = reconnectAttempt + 1;
    setReconnectAttempt(nextAttempt);
    setState('reconnecting');
    
    // Exponential backoff: 2s, 4s, 8s
    const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempt);
    console.log(`[Sofia] 🔄 Auto-reconnect scheduled in ${delay}ms (attempt ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})`);
    
    toast.info(`Reconectando Sofia... (tentativa ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS})`);
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        await performConnection();
      } catch (err) {
        console.error('[Sofia] Reconnection failed:', err);
        isReconnectingRef.current = false;
        
        if (nextAttempt >= MAX_RECONNECT_ATTEMPTS) {
          setState('error');
          setError('Falha na reconexão após várias tentativas');
          toast.error('Não foi possível reconectar', {
            description: 'Por favor, tente iniciar uma nova chamada.',
          });
        }
      }
    }, delay);
  }, [reconnectAttempt]);

  // Core connection logic
  const performConnection = useCallback(async () => {
    console.log('[Sofia] 🚀 Starting connection...');
    
    try {
      // Request microphone permission
      console.log('[Sofia] Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Sofia] ✅ Microphone permission granted');
      
      setState('connecting');
      
      // Get token from edge function
      console.log('[Sofia] Fetching conversation token...');
      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-conversation-token');
      
      if (fnError) {
        console.error('[Sofia] Token fetch error:', fnError);
        throw new Error(fnError.message || 'Erro ao obter token');
      }
      
      if (!data?.token) {
        console.error('[Sofia] No token in response:', data);
        throw new Error('Token não recebido do servidor');
      }
      
      console.log('[Sofia] ✅ Token obtained, starting WebRTC session...');
      console.log('[Sofia] Token preview:', data.token.substring(0, 50) + '...');
      
      // Start WebRTC conversation
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
      
      console.log('[Sofia] WebRTC session started, waiting for connection...');
      
    } catch (err: any) {
      console.error('[Sofia] ❌ Connection failed:', err);
      throw err;
    }
  }, [conversation]);

  // Send page context when it changes
  useEffect(() => {
    if (state === 'connected' && pageContext.fullContext !== lastSentContextRef.current) {
      lastSentContextRef.current = pageContext.fullContext;
      console.log('[Sofia] 📍 Page context updated:', pageContext.section);
    }
  }, [state, pageContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
    };
  }, [clearReconnectTimeout]);

  const startCall = useCallback(async () => {
    if (state !== 'idle' && state !== 'error') {
      console.log('[Sofia] Call already in progress, state:', state);
      return;
    }
    
    setState('initializing');
    setError(null);
    setReconnectAttempt(0);
    isReconnectingRef.current = false;
    clearReconnectTimeout();
    
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
  }, [state, performConnection, clearReconnectTimeout]);

  const endCall = useCallback(async () => {
    console.log('[Sofia] 📞 Ending call...');
    clearReconnectTimeout();
    isReconnectingRef.current = false;
    sessionActiveRef.current = false;
    
    try {
      await conversation.endSession();
    } catch (err) {
      console.error('[Sofia] Error ending session:', err);
    }
    
    setState('idle');
    setTranscript('');
    setUserTranscript('');
    setReconnectAttempt(0);
    setError(null);
    toast.info('Chamada encerrada');
  }, [conversation, clearReconnectTimeout]);

  const retryConnection = useCallback(async () => {
    console.log('[Sofia] 🔄 Manual retry requested');
    clearReconnectTimeout();
    isReconnectingRef.current = false;
    setReconnectAttempt(0);
    await startCall();
  }, [startCall, clearReconnectTimeout]);

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
        reconnectAttempt,
        maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
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
