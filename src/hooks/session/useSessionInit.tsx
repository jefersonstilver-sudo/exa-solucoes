
import { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types/userTypes';
import { useSessionEvents } from './useSessionEvents';
import { useSessionRefresh } from './useSessionRefresh';
import { useSessionInitializer } from './useSessionInitializer';
import { supabase } from '@/integrations/supabase/client';

export const useSessionInit = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef<boolean>(true);
  
  // Adicionar verificação de sessão explícita na inicialização do componente
  useEffect(() => {
    const checkInitialSession = async () => {
      try {
        console.log('Verificando sessão inicial via useSessionInit');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão inicial:', error);
          setIsLoading(false);
          return;
        }
        
        if (data.session) {
          console.log('Sessão válida encontrada na inicialização');
        } else {
          console.log('Nenhuma sessão encontrada na inicialização');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Erro crítico ao verificar sessão:', err);
        setIsLoading(false);
      }
    };
    
    checkInitialSession();
  }, []);

  // Set up a ref to track component mount status
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle authentication state changes
  useSessionEvents({ setUser, setSession, isMounted });
  
  // Initialize authentication on component mount
  useSessionInitializer({ setUser, setSession, setIsLoading, isMounted });
  
  // Set up periodic session checking
  useSessionRefresh({ user, setUser, setSession, isMounted });

  return {
    user,
    session,
    isLoading,
    setUser
  };
};
