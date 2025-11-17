
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BuildingFormData {
  nome: string;
  endereco: string;
  bairro: string;
  numero_unidades: number;
  numero_andares: number;
  numero_elevadores: number;
  numero_blocos: number;
  publico_estimado: number;
  preco_base: number;
  padrao_publico: 'alto' | 'medio' | 'normal';
  status: string;
  venue_type: string;
  location_type: string;
  latitude: number;
  longitude: number;
  caracteristicas: string[];
  monthly_traffic: number;
  nome_sindico: string;
  contato_sindico: string;
  nome_vice_sindico: string;
  contato_vice_sindico: string;
  nome_contato_predio: string;
  numero_contato_predio: string;
}

const initialFormData: BuildingFormData = {
  nome: '',
  endereco: '',
  bairro: '',
  numero_unidades: 0,
  numero_andares: 0,
  numero_elevadores: 0,
  numero_blocos: 1,
  publico_estimado: 0,
  preco_base: 0,
  padrao_publico: 'normal',
  status: 'ativo',
  venue_type: 'Residencial',
  location_type: 'residential',
  latitude: 0,
  longitude: 0,
  caracteristicas: [],
  monthly_traffic: 0,
  nome_sindico: '',
  contato_sindico: '',
  nome_vice_sindico: '',
  contato_vice_sindico: '',
  nome_contato_predio: '',
  numero_contato_predio: ''
};

export const useBuildingFormData = (building: any, open: boolean) => {
  const [formData, setFormData] = useState<BuildingFormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (building) {
      setFormData({
        nome: building.nome || '',
        endereco: building.endereco || '',
        bairro: building.bairro || '',
        numero_unidades: building.numero_unidades || 0,
        numero_andares: building.numero_andares || 0,
        numero_elevadores: building.numero_elevadores || 0,
        numero_blocos: building.numero_blocos || 1,
        publico_estimado: building.publico_estimado || (building.numero_unidades * 3.5) || 0,
        preco_base: building.preco_base || 0,
        padrao_publico: building.padrao_publico || 'normal',
        status: building.status || 'ativo',
        venue_type: (building.venue_type === 'Residencial' || building.venue_type === 'Comercial') 
          ? building.venue_type 
          : 'Residencial',
        location_type: building.location_type || 'residential',
        latitude: building.latitude || 0,
        longitude: building.longitude || 0,
        caracteristicas: building.caracteristicas || building.amenities || [],
        monthly_traffic: building.monthly_traffic || 0,
        nome_sindico: building.nome_sindico || '',
        contato_sindico: building.contato_sindico || '',
        nome_vice_sindico: building.nome_vice_sindico || '',
        contato_vice_sindico: building.contato_vice_sindico || '',
        nome_contato_predio: building.nome_contato_predio || '',
        numero_contato_predio: building.numero_contato_predio || ''
      });
    } else {
      setFormData(initialFormData);
    }
  }, [building, open]);

  const handleFormUpdate = (updates: Partial<BuildingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleCharacteristicToggle = (caracteristica: string) => {
    if (formData.caracteristicas.includes(caracteristica)) {
      setFormData(prev => ({
        ...prev,
        caracteristicas: prev.caracteristicas.filter(a => a !== caracteristica)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        caracteristicas: [...prev.caracteristicas, caracteristica]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent, onSuccess: () => void, onOpenChange: (open: boolean) => void) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Montar payload incluindo publico_estimado (pode ser editado manualmente)
      const { caracteristicas, ...rest } = formData as any;

      const payload = {
        ...rest,
        amenities: caracteristicas,
        venue_type:
          formData.venue_type === 'Residencial' || formData.venue_type === 'Comercial'
            ? formData.venue_type
            : 'Residencial',
      } as any;

      if (building) {
        const { error } = await supabase
          .from('buildings')
          .update(payload)
          .eq('id', building.id);

        if (error) throw error;

        await supabase.rpc('log_building_action', {
          p_building_id: building.id,
          p_action_type: 'update',
          p_description: `Prédio "${formData.nome}" atualizado - Tipo: ${payload.venue_type}`,
          p_new_values: payload,
        });

        toast.success('Prédio atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('buildings')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;

        // Chamar Edge Function (proxy) para criar cliente - COM RETRY LOGIC
        try {
          const clienteId = data.id.replace(/-/g, '').substring(0, 4);
          
          console.log('[CREATE BUILDING] Criando cliente externo:', { clienteId, nome: formData.nome });
          
          let lastError;
          let attempts = 0;
          const MAX_RETRIES = 3;
          const TIMEOUT_MS = 15000; // 15 segundos
          const RETRY_DELAY_MS = 2000; // 2 segundos entre tentativas
          
          while (attempts < MAX_RETRIES) {
            attempts++;
            
            try {
              console.log(`[CREATE BUILDING] Tentativa ${attempts}/${MAX_RETRIES}...`);
              
              // Criar promise com timeout
              const invokePromise = supabase.functions.invoke('create-building-client', {
                body: {
                  cliente_id: clienteId,
                  cliente_name: formData.nome
                }
              });
              
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout: API externa não respondeu em 15s')), TIMEOUT_MS)
              );
              
              const { data: edgeFunctionData, error: edgeFunctionError } = await Promise.race([
                invokePromise,
                timeoutPromise
              ]) as any;

              if (edgeFunctionError) {
                throw new Error(`Edge Function falhou: ${edgeFunctionError.message}`);
              }

              if (!edgeFunctionData?.success) {
                throw new Error(edgeFunctionData?.error || 'Erro desconhecido ao criar cliente');
              }

              console.log('[CREATE BUILDING] ✅ Cliente criado com sucesso na tentativa', attempts);
              break; // Sucesso! Sair do loop
              
            } catch (retryError: any) {
              lastError = retryError;
              console.warn(`[CREATE BUILDING] ❌ Tentativa ${attempts}/${MAX_RETRIES} falhou:`, retryError.message);
              
              if (attempts < MAX_RETRIES) {
                console.log(`[CREATE BUILDING] ⏳ Aguardando ${RETRY_DELAY_MS}ms antes da próxima tentativa...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
              }
            }
          }
          
          // Se todas as tentativas falharam
          if (attempts === MAX_RETRIES && lastError) {
            throw lastError;
          }

        } catch (apiError: any) {
          console.error('[CREATE BUILDING] 🔴 ERRO CRÍTICO após todas tentativas:', apiError);
          
          // ROLLBACK: Deletar o prédio criado
          await supabase
            .from('buildings')
            .delete()
            .eq('id', data.id);
          
          console.error('[ROLLBACK] Prédio deletado devido a falha na API externa');
          
          // Mostrar erro detalhado ao usuário
          throw new Error(`Falha ao criar cliente externo após ${3} tentativas: ${apiError.message}`);
        }

        await supabase.rpc('log_building_action', {
          p_building_id: data.id,
          p_action_type: 'create',
          p_description: `Novo prédio "${formData.nome}" criado - Tipo: ${payload.venue_type}`,
          p_new_values: payload,
        });

        toast.success('Prédio criado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar prédio:', error);
      toast.error(error.message || 'Erro ao salvar prédio');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    handleFormUpdate,
    handleCharacteristicToggle,
    handleSubmit
  };
};
