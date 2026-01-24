import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanySettings {
  id: string;
  // Dados Jurídicos
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
  
  // Endereço
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento: string | null;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado: string;
  endereco_cep: string;
  endereco_completo: string;
  
  // Representante Legal
  representante_nome: string;
  representante_cpf: string;
  representante_rg: string | null;
  representante_cargo: string;
  representante_email: string;
  
  // Contato
  telefone_principal: string | null;
  email_institucional: string | null;
  whatsapp_comercial: string | null;
  website: string | null;
  instagram: string | null;
  
  // Foro
  foro_comarca: string;
  foro_estado: string;
  foro_completo: string;
  
  // Configurações de Contrato
  multa_rescisao_percentual: number;
  prazo_aviso_rescisao_dias: number;
  indice_reajuste: string | null;
}

// Valores padrão caso a tabela esteja vazia (fallback)
const DEFAULT_SETTINGS: CompanySettings = {
  id: '',
  razao_social: 'INDEXA MIDIA LTDA',
  nome_fantasia: 'ExaMídia',
  cnpj: '38.142.638/0001-30',
  inscricao_estadual: null,
  inscricao_municipal: null,
  endereco_logradouro: 'Avenida Paraná',
  endereco_numero: '974',
  endereco_complemento: 'Sala 301',
  endereco_bairro: 'Centro',
  endereco_cidade: 'Foz do Iguaçu',
  endereco_estado: 'PR',
  endereco_cep: '85852-000',
  endereco_completo: 'Avenida Paraná, 974 – Sala 301, Centro, Foz do Iguaçu – PR, CEP 85852-000',
  representante_nome: 'Jeferson Stilver Rodrigues Encina',
  representante_cpf: '055.031.279-00',
  representante_rg: '8.812.269-0',
  representante_cargo: 'Sócio Administrador',
  representante_email: 'jefersonstilver@gmail.com',
  telefone_principal: '(45) 9 9141-5856',
  email_institucional: 'contato@examidia.com.br',
  whatsapp_comercial: '(45) 9 9141-5856',
  website: 'https://www.examidia.com.br',
  instagram: '@exa.publicidade',
  foro_comarca: 'Foz do Iguaçu',
  foro_estado: 'PR',
  foro_completo: 'Foz do Iguaçu/PR',
  multa_rescisao_percentual: 20,
  prazo_aviso_rescisao_dias: 30,
  indice_reajuste: 'IPCA',
};

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('configuracoes_empresa')
          .select('*')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (fetchError) {
          console.error('Erro ao buscar configurações da empresa:', fetchError);
          setError(fetchError.message);
          // Usar valores padrão em caso de erro
          setSettings(DEFAULT_SETTINGS);
        } else if (data) {
          const endereco_completo = [
            data.endereco_logradouro,
            data.endereco_numero,
            data.endereco_complemento ? `– ${data.endereco_complemento}` : '',
            data.endereco_bairro,
            `${data.endereco_cidade} – ${data.endereco_estado}`,
            `CEP ${data.endereco_cep}`
          ].filter(Boolean).join(', ').replace(', ,', ',');

          setSettings({
            ...data,
            endereco_completo,
            foro_completo: `${data.foro_comarca}/${data.foro_estado}`,
          } as CompanySettings);
        } else {
          // Tabela vazia, usar valores padrão
          setSettings(DEFAULT_SETTINGS);
        }
      } catch (err) {
        console.error('Erro inesperado ao buscar configurações:', err);
        setError('Erro inesperado');
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
};

// Função utilitária para buscar configurações de forma síncrona (para Edge Functions)
export const getCompanySettingsSync = async (): Promise<CompanySettings> => {
  try {
    const { data, error } = await supabase
      .from('configuracoes_empresa')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    const endereco_completo = [
      data.endereco_logradouro,
      data.endereco_numero,
      data.endereco_complemento ? `– ${data.endereco_complemento}` : '',
      data.endereco_bairro,
      `${data.endereco_cidade} – ${data.endereco_estado}`,
      `CEP ${data.endereco_cep}`
    ].filter(Boolean).join(', ').replace(', ,', ',');

    return {
      ...data,
      endereco_completo,
      foro_completo: `${data.foro_comarca}/${data.foro_estado}`,
    } as CompanySettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export default useCompanySettings;
