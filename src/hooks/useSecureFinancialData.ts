import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecureFinancialDataResult {
  success: boolean;
  data?: any;
  error?: string;
  securityLevel?: 'low' | 'medium' | 'high';
}

interface SecurityStatus {
  suspicious_users: number;
  high_risk_access_24h: number;
  failed_access_24h: number;
  security_status: 'NORMAL' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}

/**
 * Hook for secure access to financial data with comprehensive audit logging
 * and field-level encryption support
 */
export const useSecureFinancialData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Securely access order data with automatic audit logging
   */
  const getSecureOrderData = useCallback(async (orderId: string): Promise<SecureFinancialDataResult> => {
    setIsLoading(true);
    
    try {
      // Use edge function for secure access with audit logging
      const { data, error } = await supabase.functions.invoke('financial-security', {
        body: { action: 'get_secure_order', orderId }
      });

      if (error) {
        console.error('Secure order data access error:', error);
        
        // Show user-friendly error message
        toast({
          variant: "destructive",
          title: "Access Error",
          description: "Unable to access order data securely. Please try again."
        });

        return {
          success: false,
          error: error.message,
          securityLevel: 'high'
        };
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Access denied';
        
        if (errorMsg.includes('Authentication required')) {
          toast({
            variant: "destructive",
            title: "Authentication Required",
            description: "Please log in to access order data."
          });
        } else if (errorMsg.includes('Access denied')) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to access this order."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Access Error",
            description: "Unable to access order data. Please try again."
          });
        }

        return {
          success: false,
          error: errorMsg,
          securityLevel: 'high'
        };
      }

      return {
        success: true,
        data: data?.data || null,
        securityLevel: 'low'
      };

    } catch (error) {
      console.error('Unexpected error in secure order access:', error);
      
      toast({
        variant: "destructive",
        title: "System Error",
        description: "An unexpected error occurred. Please contact support."
      });

      return {
        success: false,
        error: 'Unexpected system error',
        securityLevel: 'high'
      };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Monitor suspicious financial access patterns
   */
  const getSecurityStatus = useCallback(async (): Promise<SecurityStatus | null> => {
    try {
      // Use edge function for security monitoring
      const { data, error } = await supabase.functions.invoke('financial-security', {
        body: { action: 'monitor_security' }
      });

      if (error) {
        console.error('Security monitoring error:', error);
        return null;
      }

      return data?.data?.securityStatus as SecurityStatus;

    } catch (error) {
      console.error('Unexpected error in security monitoring:', error);
      return null;
    }
  }, []);

  /**
   * Get financial audit logs (super admin only)
   */
  const getFinancialAuditLogs = useCallback(async (limit: number = 100) => {
    try {
      const { data, error } = await supabase
        .from('financial_data_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Audit logs access error:', error);
        
        if (error.code === 'PGRST116') {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "Only super administrators can access audit logs."
          });
        }

        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Unexpected error accessing audit logs:', error);
      return {
        success: false,
        error: 'Unexpected system error'
      };
    }
  }, [toast]);

  /**
   * Get high-risk access attempts for monitoring dashboard
   */
  const getHighRiskAccess = useCallback(async (hours: number = 24) => {
    try {
      const { data, error } = await supabase
        .from('financial_data_audit_logs')
        .select(`
          *,
          users:user_id (
            email,
            role
          )
        `)
        .eq('risk_level', 'high')
        .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('High-risk access query error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      console.error('Unexpected error querying high-risk access:', error);
      return {
        success: false,
        error: 'System error'
      };
    }
  }, []);

  /**
   * Encrypt sensitive financial field (for future use)
   */
  const encryptFinancialField = useCallback(async (value: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('financial-security', {
        body: { action: 'encrypt_field', value }
      });

      if (error) {
        console.error('Encryption error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: data?.success || false,
        data: data?.data
      };

    } catch (error) {
      console.error('Unexpected encryption error:', error);
      return {
        success: false,
        error: 'Encryption failed'
      };
    }
  }, []);

  /**
   * Decrypt sensitive financial field (admin only)
   */
  const decryptFinancialField = useCallback(async (encryptedValue: string, userRole?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('financial-security', {
        body: { action: 'decrypt_field', encryptedValue, userRole }
      });

      if (error) {
        console.error('Decryption error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: data?.success || false,
        data: data?.data
      };

    } catch (error) {
      console.error('Unexpected decryption error:', error);
      return {
        success: false,
        error: 'Decryption failed'
      };
    }
  }, []);

  return {
    isLoading,
    getSecureOrderData,
    getSecurityStatus,
    getFinancialAuditLogs,
    getHighRiskAccess,
    encryptFinancialField,
    decryptFinancialField
  };
};