import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type LegalFlowStep = 
  | 'intro'
  | 'parceiro'
  | 'tipo'
  | 'objeto'
  | 'prazos'
  | 'contrapartidas'
  | 'riscos'
  | 'preview';

export interface GatilhoCondicional {
  condicao: string;
  acao: string;
  prazo?: string;
}

export interface RiscoDetectado {
  nivel: 'baixo' | 'medio' | 'alto' | 'critico';
  descricao: string;
  sugestao: string;
  aceito?: boolean;
}

export interface ClausulaGerada {
  titulo: string;
  conteudo: string;
}

export interface LegalFlowData {
  // Dados do parceiro
  parceiro_nome: string;
  parceiro_tipo_pessoa: 'PF' | 'PJ';
  parceiro_documento: string;
  parceiro_email: string;
  parceiro_telefone: string;
  
  // Tipo de contrato
  tipo_contrato: string;
  
  // Prédio (para comodato/termo_aceite)
  predio_id: string | null;
  predio_nome: string;
  
  // Objeto
  objeto: string;
  
  // Prazos
  prazo_meses: number;
  data_inicio: string;
  
  // Valor
  valor_financeiro: number | null;
  
  // Contrapartidas
  obrigacoes_indexa: string[];
  obrigacoes_parceiro: string[];
  
  // Gatilhos condicionais
  gatilhos_condicionais: GatilhoCondicional[];
  
  // Riscos
  riscos_detectados: RiscoDetectado[];
  
  // Cláusulas geradas pela IA
  clausulas_geradas: ClausulaGerada[];
  
  // Campos de parceria CLT/PJ
  parceiro_cargo?: string;
  parceiro_salario?: number;
  parceiro_jornada?: string;
  
  // Contexto IA
  contexto_ia: string;
  modo_entrada: 'manual' | 'voz' | 'arquivo' | 'ia';
  
  // HTML preview
  html_preview: string;
}

export interface HealthBreakdown {
  parceiro: boolean;
  objeto: boolean;
  prazos: boolean;
  contrapartidas: boolean;
  validacao_risco: boolean;
}

const initialData: LegalFlowData = {
  parceiro_nome: '',
  parceiro_tipo_pessoa: 'PJ',
  parceiro_documento: '',
  parceiro_email: '',
  parceiro_telefone: '',
  tipo_contrato: '',
  predio_id: null,
  predio_nome: '',
  objeto: '',
  prazo_meses: 12,
  data_inicio: new Date().toISOString().split('T')[0],
  valor_financeiro: null,
  obrigacoes_indexa: [],
  obrigacoes_parceiro: [],
  gatilhos_condicionais: [],
  riscos_detectados: [],
  clausulas_geradas: [],
  contexto_ia: '',
  modo_entrada: 'manual',
  html_preview: '',
};

export function useLegalFlow() {
  const [currentStep, setCurrentStep] = useState<LegalFlowStep>('intro');
  const [data, setData] = useState<LegalFlowData>(initialData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate CNPJ format
  const isValidCNPJ = useCallback((cnpj: string): boolean => {
    const cleaned = cnpj.replace(/\D/g, '');
    return cleaned.length === 14;
  }, []);

  // Calcular health score - Algoritmo exato Indexa 2026
  const calculateHealth = useCallback((): { score: number; breakdown: HealthBreakdown } => {
    let score = 0;
    const breakdown: HealthBreakdown = {
      parceiro: false,
      objeto: false,
      prazos: false,
      contrapartidas: false,
      validacao_risco: false,
    };

    // +15%: Parceiro identificado (CNPJ válido)
    if (data.parceiro_documento && isValidCNPJ(data.parceiro_documento)) {
      score += 15;
      breakdown.parceiro = true;
    }

    // +25%: Objeto >50 caracteres
    if (data.objeto && data.objeto.length > 50) {
      score += 25;
      breakdown.objeto = true;
    }

    // +20%: Contrapartida clara (valor R$ ou obrigação de permuta)
    if (data.valor_financeiro || data.obrigacoes_parceiro.length > 0) {
      score += 20;
      breakdown.contrapartidas = true;
    }

    // +10%: Prazo definido
    if (data.prazo_meses > 0 && data.data_inicio) {
      score += 10;
      breakdown.prazos = true;
    }

    // +30%: Validação de risco (sem cláusulas abusivas críticas não aceitas)
    const hasNoCriticalRisks = !data.riscos_detectados.some(
      r => r.nivel === 'critico' && !r.aceito
    );
    if (hasNoCriticalRisks) {
      score += 30;
      breakdown.validacao_risco = true;
    }

    return { score, breakdown };
  }, [data, isValidCNPJ]);

  // Atualizar dados
  const updateData = useCallback((updates: Partial<LegalFlowData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  // Navegar entre steps
  const goToStep = useCallback((step: LegalFlowStep) => {
    setCurrentStep(step);
  }, []);

  const nextStep = useCallback(() => {
    const steps: LegalFlowStep[] = ['intro', 'parceiro', 'tipo', 'objeto', 'prazos', 'contrapartidas', 'riscos', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    const steps: LegalFlowStep[] = ['intro', 'parceiro', 'tipo', 'objeto', 'prazos', 'contrapartidas', 'riscos', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }, [currentStep]);

  // Processar com IA
  const processWithAI = useCallback(async (input: string, inputType: 'text' | 'audio_url' | 'document_text') => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke('juridico-brain', {
        body: {
          input_type: inputType,
          content: input,
          context: {
            predio_id: data.predio_id,
            predio_nome: data.predio_nome,
            parceiro_nome: data.parceiro_nome,
            tipo_contrato_sugerido: data.tipo_contrato,
          }
        }
      });

      if (fnError) throw fnError;

      if (response?.success) {
        // Atualizar dados com resposta da IA
        updateData({
          tipo_contrato: response.tipo_contrato || data.tipo_contrato,
          parceiro_nome: response.parceiro?.nome || data.parceiro_nome,
          parceiro_tipo_pessoa: response.parceiro?.tipo_pessoa || data.parceiro_tipo_pessoa,
          parceiro_documento: response.parceiro?.documento || data.parceiro_documento,
          objeto: response.objeto || data.objeto,
          obrigacoes_indexa: response.obrigacoes_indexa || data.obrigacoes_indexa,
          obrigacoes_parceiro: response.obrigacoes_parceiro || data.obrigacoes_parceiro,
          gatilhos_condicionais: response.gatilhos_condicionais || data.gatilhos_condicionais,
          riscos_detectados: (response.riscos_detectados || []).map((r: RiscoDetectado) => ({ ...r, aceito: false })),
          valor_financeiro: response.valor_financeiro,
          prazo_meses: response.prazo_meses || data.prazo_meses,
          clausulas_geradas: response.clausulas_geradas || [],
          html_preview: response.html_preview || '',
          contexto_ia: response.contexto_ia || input,
          modo_entrada: inputType === 'audio_url' ? 'voz' : inputType === 'document_text' ? 'arquivo' : 'ia',
        });

        toast.success('IA processou o contexto com sucesso!');
        
        // Se temos riscos críticos, ir para step de riscos
        if (response.riscos_detectados?.some((r: RiscoDetectado) => r.nivel === 'critico')) {
          goToStep('riscos');
        } else if (response.health_score >= 80) {
          goToStep('preview');
        } else {
          // Ir para o primeiro step incompleto
          if (!response.parceiro?.nome) goToStep('parceiro');
          else if (!response.tipo_contrato) goToStep('tipo');
          else if (!response.objeto) goToStep('objeto');
          else goToStep('prazos');
        }

        return response;
      } else {
        throw new Error(response?.error || 'Erro ao processar com IA');
      }
    } catch (err: any) {
      console.error('[useLegalFlow] AI processing error:', err);
      setError(err.message);
      toast.error('Erro ao processar com IA: ' + err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [data, updateData, goToStep]);

  // Aceitar sugestão de risco
  const acceptRiskSuggestion = useCallback((index: number) => {
    setData(prev => ({
      ...prev,
      riscos_detectados: prev.riscos_detectados.map((r, i) => 
        i === index ? { ...r, aceito: true } : r
      )
    }));
  }, []);

  // Criar contrato no banco
  const createContract = useCallback(async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Gerar número do contrato
      const { data: contractNumber, error: rpcError } = await supabase.rpc('generate_contract_number');
      if (rpcError) throw rpcError;

      const { score } = calculateHealth();

      // Inserir contrato
      const { data: contract, error: insertError } = await supabase
        .from('contratos_legais')
        .insert({
          tipo_contrato: data.tipo_contrato,
          status: 'rascunho',
          cliente_nome: data.parceiro_nome,
          cliente_cnpj: data.parceiro_documento,
          cliente_email: data.parceiro_email,
          cliente_telefone: data.parceiro_telefone,
          cliente_endereco: data.predio_nome || '',
          valor_total: data.valor_financeiro,
          prazo_meses: data.prazo_meses,
          data_inicio: data.data_inicio,
          lista_predios: data.predio_id ? [data.predio_id] : [],
        } as any)
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Contrato criado com sucesso!');
      return contract;

    } catch (err: any) {
      console.error('[useLegalFlow] Create contract error:', err);
      setError(err.message);
      toast.error('Erro ao criar contrato: ' + err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [data, calculateHealth]);

  // Reset
  const reset = useCallback(() => {
    setData(initialData);
    setCurrentStep('intro');
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    currentStep,
    data,
    isProcessing,
    error,
    health: calculateHealth(),
    updateData,
    goToStep,
    nextStep,
    prevStep,
    processWithAI,
    acceptRiskSuggestion,
    createContract,
    reset,
  };
}
