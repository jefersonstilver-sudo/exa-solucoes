import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Secure developer authentication using token-based system
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

  const authenticateUser = useCallback(async (inputToken: string) => {
    console.log('🔐 Attempting secure token authentication...');
    
    try {
      // Validate token using secure database function
      const { data, error } = await supabase.rpc('validate_developer_token', {
        p_token: inputToken
      });
      
      if (error) {
        console.error('❌ Token validation error:', error);
        return false;
      }
      
      if (data === true) {
        console.log('✅ Token valid! Setting authentication...');
        
        // Update sessionStorage
        try {
          sessionStorage.setItem('indexa_dev_session', 'true');
          console.log('✅ SessionStorage updated successfully');
        } catch (error) {
          console.error('❌ Failed to update sessionStorage:', error);
          return false;
        }
        
        // Update React state
        setIsAuthenticated(true);
        console.log('✅ React state updated to authenticated');
        
        return true;
      }
      
      console.log('❌ Token invalid or expired');
      return false;
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return false;
    }
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