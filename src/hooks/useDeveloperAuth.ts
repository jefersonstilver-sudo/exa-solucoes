import { useState, useEffect } from 'react';

const DEVELOPER_PASSWORD = '573039';
const AUTH_KEY = 'indexa_dev_auth';

export const useDeveloperAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Recuperar estado do sessionStorage no init
    try {
      return sessionStorage.getItem('indexa_dev_session') === 'true';
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);

  const authenticateUser = (inputPassword: string) => {
    console.log('🔐 Attempting authentication...');
    if (inputPassword === DEVELOPER_PASSWORD) {
      console.log('✅ Password correct, setting auth state...');
      setIsAuthenticated(true);
      sessionStorage.setItem('indexa_dev_session', 'true');
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