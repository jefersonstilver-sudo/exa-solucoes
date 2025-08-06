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

  // Debug logs para mudanças no estado
  useEffect(() => {
    console.log('🔐 Auth state changed:', isAuthenticated);
  }, [isAuthenticated]);

  const authenticateUser = useCallback((inputPassword: string) => {
    console.log('🔐 Attempting authentication...');
    console.log('🔐 Input password:', inputPassword);
    console.log('🔐 Expected password:', DEVELOPER_PASSWORD);
    console.log('🔐 Password match:', inputPassword === DEVELOPER_PASSWORD);
    
    if (inputPassword === DEVELOPER_PASSWORD) {
      console.log('✅ Password correct! Setting authentication...');
      
      // Primeiro: Atualizar sessionStorage
      try {
        sessionStorage.setItem('indexa_dev_session', 'true');
        console.log('✅ SessionStorage updated successfully');
      } catch (error) {
        console.error('❌ Failed to update sessionStorage:', error);
        return false;
      }
      
      // Segundo: Atualizar estado React
      setIsAuthenticated(true);
      console.log('✅ React state updated to authenticated');
      
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