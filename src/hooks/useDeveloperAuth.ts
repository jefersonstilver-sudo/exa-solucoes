import { useState, useEffect } from 'react';

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

  // Debug: Monitorar mudanças no estado de autenticação
  console.log('🔐 useDeveloperAuth - Current isAuthenticated:', isAuthenticated);

  const authenticateUser = (inputPassword: string) => {
    console.log('🔐 Attempting authentication with password:', inputPassword);
    console.log('🔐 Expected password:', DEVELOPER_PASSWORD);
    if (inputPassword === DEVELOPER_PASSWORD) {
      console.log('✅ Password correct, setting auth state...');
      sessionStorage.setItem('indexa_dev_session', 'true');
      setIsAuthenticated(true);
      console.log('✅ State updated, isAuthenticated should now be true');
      return true;
    }
    console.log('❌ Password incorrect');
    return false;
  };

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