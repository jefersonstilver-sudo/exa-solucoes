
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PanelFormData {
  code: string;
  building_id: string;
  status: string;
  resolucao: string;
  polegada: string;
  orientacao: string;
  sistema_operacional: string;
  codigo_anydesk: string;
  senha_anydesk: string;
  modelo: string;
  versao_firmware: string;
  ip_interno: string;
  mac_address: string;
  observacoes: string;
  localizacao: string;
}

export const usePanelFormData = (panel?: any, open?: boolean) => {
  const [formData, setFormData] = useState<PanelFormData>({
    code: '',
    building_id: '',
    status: 'offline',
    resolucao: '1080x1920',
    polegada: '22',
    orientacao: 'vertical',
    sistema_operacional: 'linux',
    codigo_anydesk: '',
    senha_anydesk: '',
    modelo: '',
    versao_firmware: '',
    ip_interno: '',
    mac_address: '',
    observacoes: '',
    localizacao: ''
  });

  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBuildings();
      if (panel) {
        setFormData({
          code: panel.code || '',
          building_id: panel.building_id || '',
          status: panel.status || 'offline',
          resolucao: panel.resolucao || '1080x1920',
          polegada: panel.polegada || '22',
          orientacao: panel.orientacao || 'vertical',
          sistema_operacional: panel.sistema_operacional || 'linux',
          codigo_anydesk: panel.codigo_anydesk || '',
          senha_anydesk: panel.senha_anydesk || '',
          modelo: panel.modelo || '',
          versao_firmware: panel.versao_firmware || '',
          ip_interno: panel.ip_interno || '',
          mac_address: panel.mac_address || '',
          observacoes: panel.observacoes || '',
          localizacao: panel.localizacao || ''
        });
      } else {
        setFormData({
          code: '',
          building_id: '',
          status: 'offline',
          resolucao: '1080x1920',
          polegada: '22',
          orientacao: 'vertical',
          sistema_operacional: 'linux',
          codigo_anydesk: '',
          senha_anydesk: '',
          modelo: '',
          versao_firmware: '',
          ip_interno: '',
          mac_address: '',
          observacoes: '',
          localizacao: ''
        });
      }
    }
  }, [panel, open]);

  const fetchBuildings = async () => {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('id, nome, endereco, bairro')
        .eq('status', 'ativo')
        .order('nome');

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      console.error('Erro ao buscar prédios:', error);
      toast.error('Erro ao carregar lista de prédios');
    }
  };

  const handleFormUpdate = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (
    e: React.FormEvent,
    onSuccess: () => void,
    onOpenChange: (open: boolean) => void
  ) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.code.trim()) {
        toast.error('Código do painel é obrigatório');
        return;
      }

      if (!formData.building_id) {
        toast.error('Selecione um prédio');
        return;
      }

      const dataToSave = {
        ...formData,
        codigo_anydesk: formData.codigo_anydesk || null,
        senha_anydesk: formData.senha_anydesk || null,
      };

      if (panel) {
        const { error } = await supabase
          .from('painels')
          .update(dataToSave)
          .eq('id', panel.id);

        if (error) throw error;
        toast.success('Painel atualizado com sucesso!');
      } else {
        // Verificar se o código já existe
        const { data: existingPanel } = await supabase
          .from('painels')
          .select('id')
          .eq('code', formData.code)
          .single();

        if (existingPanel) {
          toast.error('Já existe um painel com este código');
          return;
        }

        const { error } = await supabase
          .from('painels')
          .insert([dataToSave]);

        if (error) throw error;
        toast.success('Painel criado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar painel:', error);
      toast.error(error.message || 'Erro ao salvar painel');
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    buildings,
    loading,
    handleFormUpdate,
    handleSubmit
  };
};
