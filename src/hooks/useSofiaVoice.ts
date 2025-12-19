import { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SofiaVoiceState {
  isConnecting: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  transcript: string;
  userTranscript: string;
  error: string | null;
}

export const useSofiaVoice = () => {
  const [state, setState] = useState<SofiaVoiceState>({
    isConnecting: false,
    isConnected: false,
    isSpeaking: false,
    transcript: '',
    userTranscript: '',
    error: null,
  });

  const transcriptRef = useRef('');

  const conversation = useConversation({
    onConnect: () => {
      console.log('[Sofia Voice] Connected to ElevenLabs');
      setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
      toast.success('Sofia conectada! Pode falar...');
    },
    onDisconnect: () => {
      console.log('[Sofia Voice] Disconnected from ElevenLabs');
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isSpeaking: false,
        transcript: '',
        userTranscript: ''
      }));
    },
    onMessage: (message: any) => {
      console.log('[Sofia Voice] Message:', message);
      
      if (message?.type === 'user_transcript') {
        const userText = message?.user_transcription_event?.user_transcript || '';
        setState(prev => ({ ...prev, userTranscript: userText }));
      }
      
      if (message?.type === 'agent_response') {
        const agentText = message?.agent_response_event?.agent_response || '';
        transcriptRef.current = agentText;
        setState(prev => ({ ...prev, transcript: agentText }));
      }
    },
    onError: (error: any) => {
      console.error('[Sofia Voice] Error:', error);
      const errorMessage = typeof error === 'string' ? error : (error?.message || 'Erro na conexão');
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isConnecting: false,
        isConnected: false
      }));
      toast.error('Erro na conexão com Sofia');
    },
  });

  // Update speaking state based on conversation
  const isSpeaking = conversation.isSpeaking;

  const startConversation = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get token from edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-conversation-token');
      
      if (error) {
        throw new Error(error.message || 'Erro ao obter token');
      }
      
      if (!data?.token) {
        throw new Error('Token não recebido do servidor');
      }
      
      console.log('[Sofia Voice] Token obtained, starting session...');
      
      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
      });
      
    } catch (error: any) {
      console.error('[Sofia Voice] Failed to start:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: error.message || 'Erro ao iniciar conversa'
      }));
      
      if (error.name === 'NotAllowedError') {
        toast.error('Permissão de microfone negada');
      } else {
        toast.error(error.message || 'Erro ao conectar com Sofia');
      }
    }
  }, [conversation]);

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        isSpeaking: false,
        transcript: '',
        userTranscript: ''
      }));
      toast.info('Chamada com Sofia encerrada');
    } catch (error) {
      console.error('[Sofia Voice] Error ending session:', error);
    }
  }, [conversation]);

  const sendTextMessage = useCallback((text: string) => {
    if (conversation.status === 'connected') {
      conversation.sendUserMessage(text);
    }
  }, [conversation]);

  return {
    ...state,
    isSpeaking,
    status: conversation.status,
    startConversation,
    endConversation,
    sendTextMessage,
    getInputVolume: conversation.getInputVolume,
    getOutputVolume: conversation.getOutputVolume,
  };
};
