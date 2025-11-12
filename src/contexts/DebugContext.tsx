/**
 * Contexto Global de Debug - Controla modo debug e força cleanup
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUserSession } from '@/hooks/useUserSession';

interface DebugContextType {
  isDebugMode: boolean;
  isDebugAuthorized: boolean;
  forceCleanupEnabled: boolean;
  toggleDebugMode: () => void;
  toggleForceCleanup: () => void;
  userEmail: string | null;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

const AUTHORIZED_DEBUG_EMAIL = 'jefersonstilver@gmail.com';

export const DebugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUserSession();
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [forceCleanupEnabled, setForceCleanupEnabled] = useState(false);
  
  const userEmail = user?.email || null;
  const isDebugAuthorized = userEmail === AUTHORIZED_DEBUG_EMAIL;

  // Carregar estado do localStorage
  useEffect(() => {
    if (isDebugAuthorized) {
      const savedDebugMode = localStorage.getItem('debug_mode') === 'true';
      const savedForceCleanup = localStorage.getItem('force_cleanup_enabled') === 'true';
      
      setIsDebugMode(savedDebugMode || import.meta.env.DEV);
      setForceCleanupEnabled(savedForceCleanup);
      
      console.log('🐛 [DEBUG CONTEXT] Estado carregado:', {
        userEmail,
        isDebugAuthorized,
        isDebugMode: savedDebugMode,
        forceCleanupEnabled: savedForceCleanup
      });
    } else {
      // Limpar se não autorizado
      setIsDebugMode(false);
      setForceCleanupEnabled(false);
      localStorage.removeItem('debug_mode');
      localStorage.removeItem('force_cleanup_enabled');
    }
  }, [isDebugAuthorized, userEmail]);

  const toggleDebugMode = () => {
    if (!isDebugAuthorized) {
      console.warn('⚠️ [DEBUG] Acesso negado. Apenas', AUTHORIZED_DEBUG_EMAIL, 'pode ativar debug mode');
      return;
    }
    
    const newValue = !isDebugMode;
    setIsDebugMode(newValue);
    localStorage.setItem('debug_mode', String(newValue));
    console.log('🐛 [DEBUG] Modo debug:', newValue ? 'ATIVADO' : 'DESATIVADO');
  };

  const toggleForceCleanup = () => {
    if (!isDebugAuthorized) {
      console.warn('⚠️ [DEBUG] Acesso negado para Force Cleanup');
      return;
    }
    
    const newValue = !forceCleanupEnabled;
    setForceCleanupEnabled(newValue);
    localStorage.setItem('force_cleanup_enabled', String(newValue));
    console.log('⚠️ [DEBUG] Force Cleanup:', newValue ? 'ATIVADO' : 'DESATIVADO');
  };

  return (
    <DebugContext.Provider value={{
      isDebugMode,
      isDebugAuthorized,
      forceCleanupEnabled,
      toggleDebugMode,
      toggleForceCleanup,
      userEmail
    }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebugContext = () => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebugContext must be used within a DebugProvider');
  }
  return context;
};
