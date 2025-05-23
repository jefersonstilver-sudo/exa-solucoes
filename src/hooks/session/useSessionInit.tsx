
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
  const sessionInitialized = useRef<boolean>(false);
  
  // Set up a ref to track component mount status
  useEffect(() => {
    isMounted.current = true;
    
    // Fast initial session check on component mount
    const quickSessionCheck = async () => {
      try {
        if (sessionInitialized.current) return;
        
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log('Quick session check: Valid session found');
        } else {
          console.log('Quick session check: No session found');
        }
        
        sessionInitialized.current = true;
      } catch (err) {
        console.error('Error in quick session check:', err);
      }
    };
    
    quickSessionCheck();
    
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
