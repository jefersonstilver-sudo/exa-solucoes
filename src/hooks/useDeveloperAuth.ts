import { useState, useEffect } from 'react';

const DEVELOPER_PASSWORD = '573039';
const AUTH_KEY = 'indexa_dev_auth';

export const useDeveloperAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);

  // Removed localStorage check - authentication is session-only now

  const authenticateUser = (inputPassword: string) => {
    if (inputPassword === DEVELOPER_PASSWORD) {
      setIsAuthenticated(true);
      // Removed localStorage - session-only authentication
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    // Removed localStorage - session-only authentication
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