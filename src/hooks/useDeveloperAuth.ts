import { useState, useEffect, useCallback } from 'react';

const DEVELOPER_PASSWORD = '573039';
const AUTH_KEY = 'indexa_dev_auth';

export const useDeveloperAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Recuperar estado do sessionStorage no init
    try {
      const authState = sessionStorage.getItem('indexa_dev_session') === 'true';
      console.log('🔑 Initial auth state from sessionStorage:', authState);
      return authState;
    } catch {
      console.log('⚠️ Failed to read sessionStorage, defaulting to false');
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);

  // FIXED: Mover logs para useEffect para evitar loop infinito
  useEffect(() => {
    console.log('🔐 Auth state changed:', isAuthenticated);
  }, [isAuthenticated]);

  // Adicionar listener para mudanças no sessionStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = sessionStorage.getItem('indexa_dev_session') === 'true';
      if (stored !== isAuthenticated) {
        console.log('🔄 Storage changed, updating state:', stored);
        setIsAuthenticated(stored);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated]);

  const authenticateUser = useCallback((inputPassword: string) => {
    console.log('🔐 Attempting authentication with password:', inputPassword);
    console.log('🔐 Expected password:', DEVELOPER_PASSWORD);
    if (inputPassword === DEVELOPER_PASSWORD) {
      console.log('✅ Password correct, setting auth state...');
      
      // Atualizar sessionStorage ANTES do setState
      sessionStorage.setItem('indexa_dev_session', 'true');
      setIsAuthenticated(true);
      
      // Verificar após um tick
      setTimeout(() => {
        const verified = sessionStorage.getItem('indexa_dev_session') === 'true';
        console.log('✅ Authentication verified:', verified);
      }, 100);
      
      return true;
    }
    console.log('❌ Password incorrect');
    return false;
  }, []);

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('indexa_dev_session');
  };

  return {
    isAuthenticated,
    password,
    setPassword,
    showPasswordField,
    setShowPasswordField,
    authenticateUser,
    logout,
  };
};