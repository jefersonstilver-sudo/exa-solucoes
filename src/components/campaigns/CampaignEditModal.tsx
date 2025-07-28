import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CampaignEditForm from './CampaignEditForm';

interface CampaignData {
  id: string;
  client_id: string;
  status: string;
  created_at: string;
  data_inicio?: string;
  data_fim?: string;
  obs?: string;
  painel_id?: string;
  video_id?: string;
  start_date?: string;
  end_date?: string;
  name?: string;
  description?: string;
  pedido_id?: string;
  updated_at?: string;
  is_advanced?: boolean;
}

interface CampaignEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignData;
  onSuccess: () => void;
}

const CampaignEditModal: React.FC<CampaignEditModalProps> = ({
  open,
  onOpenChange,
  campaign,
  onSuccess
}) => {
  // 🔧 CORREÇÃO 6: Função de atualização com logs detalhados
  const handleUpdate = async (updates: Partial<CampaignData>) => {
    try {
      console.log('📝 [CAMPAIGN EDIT MODAL] Iniciando atualização:', {
        campaignId: campaign.id,
        isAdvanced: campaign.is_advanced,
        updates
      });

      // Determinar a tabela correta
      const tableName = campaign.is_advanced ? 'campaigns_advanced' : 'campanhas';
      console.log('🎯 [CAMPAIGN EDIT MODAL] Usando tabela:', tableName);

      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', campaign.id)
        .select()
        .single();

      if (error) {
        console.error('❌ [CAMPAIGN EDIT MODAL] Erro na atualização:', error);
        toast.error('Erro ao atualizar campanha: ' + error.message);
        return false;
      }

      console.log('✅ [CAMPAIGN EDIT MODAL] Campanha atualizada com sucesso:', data);
      
      // Aguardar um pouco e forçar refresh da lista
      setTimeout(() => {
        onSuccess();
      }, 300);

      return true;
    } catch (error) {
      console.error('💥 [CAMPAIGN EDIT MODAL] Erro inesperado:', error);
      toast.error('Erro inesperado ao atualizar campanha');
      return false;
    }
  };

  return (
    <CampaignEditForm
      open={open}
      onOpenChange={onOpenChange}
      campaign={campaign}
      onUpdate={handleUpdate}
      isAdvanced={campaign.is_advanced || false}
    />
  );
};

export default CampaignEditModal;