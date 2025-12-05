import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CNPJData {
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  segmento: string;
  situacao: string;
  naturezaJuridica: string;
  capitalSocial: number;
  dataAbertura: string;
}

export const useCNPJConsult = () => {
  const [isLoading, setIsLoading] = useState(false);

  const consultCNPJ = async (cnpj: string): Promise<CNPJData | null> => {
    // Limpar e validar CNPJ
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length !== 14) {
      toast.error('CNPJ deve ter 14 dígitos');
      return null;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('consultar-cnpj', {
        body: { cnpj: cleanCnpj }
      });

      if (error) {
        console.error('[useCNPJConsult] Erro:', error);
        toast.error('Não foi possível consultar o CNPJ');
        return null;
      }

      if (data?.error) {
        toast.error(data.error);
        return null;
      }

      toast.success('Dados da empresa carregados!');
      return data as CNPJData;
      
    } catch (err: any) {
      console.error('[useCNPJConsult] Erro:', err);
      toast.error('Erro ao consultar CNPJ');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { consultCNPJ, isLoading };
};
