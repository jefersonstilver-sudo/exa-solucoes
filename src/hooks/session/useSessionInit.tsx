
import { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types/userTypes';
import { useSessionEvents } from './useSessionEvents';
import { useSessionRefresh } from './useSessionRefresh';
import { useSessionInitializer } from './useSessionInitializer';

export const useSessionInit = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef<boolean>(true);

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
