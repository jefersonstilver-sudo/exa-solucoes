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
  const handleUpdate = async (updates: Partial<CampaignData>) => {
    try {
      console.log('📝 [CAMPAIGN EDIT MODAL] Iniciando atualização:', {
        campaignId: campaign.id,
        isAdvanced: campaign.is_advanced,
        updates,
        originalCampaign: campaign
      });

      // Determinar a tabela correta
      const tableName = campaign.is_advanced ? 'campaigns_advanced' : 'campanhas';
      console.log('🎯 [CAMPAIGN EDIT MODAL] Usando tabela:', tableName);

      // Log da query que será executada
      console.log('🔍 [CAMPAIGN EDIT MODAL] Query details:', {
        table: tableName,
        id: campaign.id,
        updateData: updates
      });

      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', campaign.id)
        .select()
        .single();

      if (error) {
        console.error('❌ [CAMPAIGN EDIT MODAL] Erro Supabase:', {
          error: error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        toast.error('Erro ao atualizar campanha: ' + error.message);
        return false;
      }

      console.log('✅ [CAMPAIGN EDIT MODAL] Resposta Supabase:', {
        data: data,
        updateApplied: true,
        originalData: campaign,
        newData: data
      });
      
      // Verificar se os dados foram realmente atualizados
      if (data && updates.start_date) {
        const dataTyped = data as any; // Type assertion para acessar propriedades dinâmicas
        console.log('📅 [CAMPAIGN EDIT MODAL] Verificação de datas:', {
          sent_start_date: updates.start_date,
          received_start_date: dataTyped.start_date || dataTyped.data_inicio,
          sent_end_date: updates.end_date,
          received_end_date: dataTyped.end_date || dataTyped.data_fim,
          datesMatch: (dataTyped.start_date || dataTyped.data_inicio) === updates.start_date
        });
      }
      
      console.log('🔄 [CAMPAIGN EDIT MODAL] Chamando onSuccess para recarregar lista...');
      
      // ✅ CORREÇÃO CRÍTICA: Aguardar um pouco antes de chamar onSuccess
      setTimeout(() => {
        onSuccess();
        console.log('✅ [CAMPAIGN EDIT MODAL] onSuccess executado - lista deve ser recarregada');
      }, 100);

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