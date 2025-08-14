import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSecureDeveloperAuth = () => {
  const [loading, setLoading] = useState(false);

  const generateDeveloperToken = useCallback(async (): Promise<{ success: boolean; token?: string; error?: string }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_developer_token');
      
      if (error) {
        console.error('❌ Error generating token:', error);
        toast.error('Failed to generate developer token');
        return { success: false, error: error.message };
      }
      
      toast.success('Developer token generated successfully');
      return { success: true, token: data };
      
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      toast.error('Unexpected error generating token');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const validateToken = useCallback(async (token: string): Promise<{ valid: boolean; error?: string }> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_developer_token', {
        p_token: token
      });
      
      if (error) {
        console.error('❌ Error validating token:', error);
        return { valid: false, error: error.message };
      }
      
      return { valid: data === true };
      
    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      return { valid: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    generateDeveloperToken,
    validateToken
  };
};