
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BuildingFormData {
  nome: string;
  endereco: string;
  bairro: string;
  numero_unidades: number;
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
      const dataToSave = {
        ...formData,
        amenities: formData.caracteristicas,
        venue_type: (formData.venue_type === 'Residencial' || formData.venue_type === 'Comercial') 
          ? formData.venue_type 
          : 'Residencial',
      };

      if (building) {
        // Atualização - usar Supabase diretamente
        const { error } = await supabase
          .from('buildings')
          .update(dataToSave)
          .eq('id', building.id);

        if (error) throw error;

        await supabase.rpc('log_building_action', {
          p_building_id: building.id,
          p_action_type: 'update',
          p_description: `Prédio "${formData.nome}" atualizado - Tipo: ${dataToSave.venue_type}`,
          p_new_values: dataToSave
        });

        toast.success('Prédio atualizado com sucesso!');
      } else {
        // Criação - usar API para gerar codigo_predio e chamar webhook
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error('Usuário não autenticado');
        }

        console.log('Sending data to API:', dataToSave);
        
        const response = await fetch('/api/admin/buildings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(dataToSave)
        });

        console.log('API Response status:', response.status);
        console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          let errorMessage = 'Erro ao criar prédio';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            console.error('Failed to parse error response as JSON:', jsonError);
            const textResponse = await response.text();
            console.error('Raw error response:', textResponse);
            errorMessage = `Erro HTTP ${response.status}: ${textResponse || 'Resposta vazia'}`;
          }
          throw new Error(errorMessage);
        }

        let data;
        try {
          data = await response.json();
          console.log('Received data from API:', data);
        } catch (jsonError) {
          console.error('Failed to parse success response as JSON:', jsonError);
          const textResponse = await response.text();
          console.error('Raw success response:', textResponse);
          throw new Error('Resposta da API não é um JSON válido');
        }

        await supabase.rpc('log_building_action', {
          p_building_id: data.id,
          p_action_type: 'create',
          p_description: `Novo prédio "${formData.nome}" criado - Tipo: ${dataToSave.venue_type} - Código: ${data.codigo_predio}`,
          p_new_values: { ...dataToSave, codigo_predio: data.codigo_predio }
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
