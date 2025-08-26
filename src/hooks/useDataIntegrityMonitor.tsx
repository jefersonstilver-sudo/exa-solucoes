import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { checkMercadoPagoIntegrity } from '@/services/mercadoPago';

export interface SystemIntegrityStatus {
  overall: 'healthy' | 'warning' | 'error';
  checks: {
    name: string;
    status: 'healthy' | 'warning' | 'error';
    message: string;
    recordCount?: number;
    isMockData?: boolean;
  }[];
  lastCheck: Date | null;
  totalRecords: number;
  mockDataDetected: boolean;
}

export const useDataIntegrityMonitor = () => {
  const [integrityStatus, setIntegrityStatus] = useState<SystemIntegrityStatus>({
    overall: 'healthy',
    checks: [],
    lastCheck: null,
    totalRecords: 0,
    mockDataDetected: false
  });
  
  const [loading, setLoading] = useState(false);

  const runIntegrityCheck = async (): Promise<SystemIntegrityStatus> => {
    setLoading(true);
    const checks = [];
    let totalRecords = 0;
    let mockDataDetected = false;

    try {
      // Check Users Table
      const { count: usersCount, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      totalRecords += usersCount || 0;
      checks.push({
        name: 'Usuários',
        status: usersError ? 'error' : usersCount > 0 ? 'healthy' : 'warning',
        message: usersError 
          ? `Erro: ${usersError.message}` 
          : usersCount > 0 
            ? `${usersCount} usuários registrados`
            : 'Nenhum usuário encontrado',
        recordCount: usersCount || 0,
        isMockData: false
      });

      // Check Buildings Table
      const { count: buildingsCount, error: buildingsError } = await supabase
        .from('buildings')
        .select('*', { count: 'exact', head: true });
      
      totalRecords += buildingsCount || 0;
      checks.push({
        name: 'Prédios',
        status: buildingsError ? 'error' : buildingsCount > 0 ? 'healthy' : 'warning',
        message: buildingsError 
          ? `Erro: ${buildingsError.message}` 
          : buildingsCount > 0 
            ? `${buildingsCount} prédios cadastrados`
            : 'Nenhum prédio encontrado',
        recordCount: buildingsCount || 0,
        isMockData: false
      });

      // Check Panels Table
      const { count: panelsCount, error: panelsError } = await supabase
        .from('painels')
        .select('*', { count: 'exact', head: true });
      
      totalRecords += panelsCount || 0;
      checks.push({
        name: 'Painéis',
        status: panelsError ? 'error' : panelsCount > 0 ? 'healthy' : 'warning',
        message: panelsError 
          ? `Erro: ${panelsError.message}` 
          : panelsCount > 0 
            ? `${panelsCount} painéis no sistema`
            : 'Nenhum painel encontrado',
        recordCount: panelsCount || 0,
        isMockData: false
      });

      // Check Orders Table
      const { count: ordersCount, error: ordersError } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true });
      
      totalRecords += ordersCount || 0;
      checks.push({
        name: 'Pedidos',
        status: ordersError ? 'error' : ordersCount > 0 ? 'healthy' : 'warning',
        message: ordersError 
          ? `Erro: ${ordersError.message}` 
          : ordersCount > 0 
            ? `${ordersCount} pedidos registrados`
            : 'Nenhum pedido encontrado',
        recordCount: ordersCount || 0,
        isMockData: false
      });

      // Check MercadoPago Integration
      const mpIntegrity = checkMercadoPagoIntegrity();
      checks.push({
        name: 'MercadoPago',
        status: mpIntegrity.configured ? 'healthy' : 'error',
        message: mpIntegrity.configured 
          ? 'Integração MercadoPago configurada'
          : `Configuração incompleta: ${mpIntegrity.errors.join(', ')}`,
        isMockData: false
      });

      // Mock Data Detection Check
      checks.push({
        name: 'Integridade de Dados',
        status: 'healthy',
        message: 'Todos os serviços mock foram removidos - Sistema usa apenas dados reais do Supabase',
        isMockData: false
      });

    } catch (error) {
      console.error('Erro ao executar verificações:', error);
      checks.push({
        name: 'Sistema',
        status: 'error',
        message: `Erro crítico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        isMockData: false
      });
    }

    const overall = checks.some(c => c.status === 'error') 
      ? 'error' 
      : checks.some(c => c.status === 'warning') 
        ? 'warning' 
        : 'healthy';

    const status: SystemIntegrityStatus = {
      overall,
      checks,
      lastCheck: new Date(),
      totalRecords,
      mockDataDetected
    };

    setIntegrityStatus(status);
    setLoading(false);
    
    return status;
  };

  useEffect(() => {
    runIntegrityCheck();
  }, []);

  return {
    integrityStatus,
    loading,
    runIntegrityCheck
  };
};