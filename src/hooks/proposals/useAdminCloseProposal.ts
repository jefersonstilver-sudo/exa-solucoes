/**
 * useAdminCloseProposal
 * 
 * Hook para gerenciar o fechamento administrativo de propostas
 * 
 * @version 1.0.0
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientData {
  primeiro_nome: string;
  sobrenome: string;
  cpf: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  cnpj?: string;
  razao_social?: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
}

export interface CloseProposalParams {
  proposalId: string;
  clientData: ClientData;
  paymentMethod: 'pix_avista' | 'pix_fidelidade' | 'boleto_fidelidade';
  diaVencimento?: 5 | 10 | 15;
  options: {
    gerarContrato: boolean;
    enviarParaAssinatura: boolean;
    gerarCobranca: boolean;
  };
}

export interface CloseProposalResult {
  success: boolean;
  orderId?: string;
  contractId?: string;
  paymentLink?: string;
  pixQrCode?: string;
  pixCopiaECola?: string;
  boletoUrl?: string;
  invoiceUrl?: string;
  isNewUser?: boolean;
  error?: string;
}

export const useAdminCloseProposal = () => {
  const [isClosing, setIsClosing] = useState(false);
  const [result, setResult] = useState<CloseProposalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const closeProposal = async (params: CloseProposalParams): Promise<CloseProposalResult> => {
    setIsClosing(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-close-proposal', {
        body: params,
      });

      if (fnError) {
        throw fnError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao fechar proposta');
      }

      setResult(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro desconhecido ao fechar proposta';
      setError(errorMessage);
      
      const errorResult: CloseProposalResult = {
        success: false,
        error: errorMessage,
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsClosing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    closeProposal,
    isClosing,
    result,
    error,
    reset,
  };
};

export default useAdminCloseProposal;
