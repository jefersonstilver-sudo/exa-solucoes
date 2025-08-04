import { supabase } from '@/integrations/supabase/client';
import { logSystemEvent } from '@/utils/auditLogger';

export interface ExternalClientData {
  cliente_id: string;
  cliente_name: string;
}

/**
 * Extrai os primeiros 4 caracteres do UUID para usar como cliente_id
 */
export const extractClientId = (uuid: string): string => {
  return uuid.replace(/-/g, '').substring(0, 4);
};

/**
 * Busca o nome do usuário nos metadados do auth.users
 */
export const getUserName = async (userId: string): Promise<string> => {
  try {
    // Buscar primeiro na tabela users para pegar o email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.warn('Usuário não encontrado na tabela users');
      return 'Cliente';
    }

    // Usar a primeira parte do email como nome do cliente
    const emailName = userData.email?.split('@')[0] || 'Cliente';
    
    // Capitalizar primeira letra de cada palavra
    return emailName
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  } catch (error) {
    console.error('Erro ao buscar nome do usuário:', error);
    return 'Cliente';
  }
};

/**
 * Verifica se é a primeira compra aprovada do usuário
 */
export const checkIfFirstPurchase = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id')
      .eq('client_id', userId)
      .in('status', ['pago'])
      .limit(2); // Buscar 2 para ver se já existe mais de 1

    if (error) {
      console.error('Erro ao verificar primeira compra:', error);
      return false; // Em caso de erro, assumir que não é primeira compra para evitar duplicatas
    }

    return (data?.length || 0) <= 1; // É primeira compra se tem 1 ou 0 pedidos pagos
  } catch (error) {
    console.error('Erro ao verificar primeira compra:', error);
    return false;
  }
};

/**
 * Cria cliente no sistema externo
 */
export const createExternalClient = async (
  userId: string, 
  userName: string,
  retryCount: number = 0
): Promise<{ success: boolean; error?: string }> => {
  const clienteId = extractClientId(userId);
  
  const payload: ExternalClientData = {
    cliente_id: clienteId,
    cliente_name: userName
  };

  logSystemEvent('WEBHOOK_INOOVAWEB_CLIENT_CREATION_ATTEMPT', {
    userId,
    clienteId,
    userName,
    payload,
    retryCount
  });

  try {
    const response = await fetch('https://webhook.inoovaweb.com.br/webhook/criar_usuario_externo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 segundos timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    logSystemEvent('WEBHOOK_INOOVAWEB_CLIENT_CREATION_SUCCESS', {
      userId,
      clienteId,
      userName,
      result,
      retryCount
    });

    return { success: true };
  } catch (error: any) {
    const errorMessage = error.message || 'Erro desconhecido';
    
    logSystemEvent('WEBHOOK_INOOVAWEB_CLIENT_CREATION_ERROR', {
      userId,
      clienteId,
      userName,
      error: errorMessage,
      retryCount
    }, 'ERROR');

    // Retry uma vez em caso de erro de rede
    if (retryCount === 0 && (errorMessage.includes('fetch') || errorMessage.includes('timeout'))) {
      console.log('Tentando novamente criação de cliente externo...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      return createExternalClient(userId, userName, 1);
    }

    return { 
      success: false, 
      error: errorMessage 
    };
  }
};

/**
 * Processa criação de cliente externo na primeira compra aprovada
 */
export const processExternalClientCreation = async (
  userId: string
): Promise<{ attempted: boolean; success: boolean; error?: string }> => {
  try {
    // Verificar se é primeira compra
    const isFirstPurchase = await checkIfFirstPurchase(userId);
    
    if (!isFirstPurchase) {
      logSystemEvent('WEBHOOK_INOOVAWEB_CLIENT_CREATION_SKIPPED', {
        userId,
        reason: 'not_first_purchase'
      });
      
      return { attempted: false, success: true };
    }

    // Buscar nome do usuário
    const userName = await getUserName(userId);
    
    // Criar cliente externo
    const result = await createExternalClient(userId, userName);
    
    return {
      attempted: true,
      success: result.success,
      error: result.error
    };
  } catch (error: any) {
    logSystemEvent('WEBHOOK_INOOVAWEB_CLIENT_PROCESSING_ERROR', {
      userId,
      error: error.message
    }, 'ERROR');
    
    return {
      attempted: true,
      success: false,
      error: error.message
    };
  }
};