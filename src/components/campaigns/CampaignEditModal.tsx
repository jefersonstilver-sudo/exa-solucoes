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
      console.log('📝 [UPDATE] Iniciando atualização:', { campaignId: campaign.id, updates });

      // Determinar tabela correta
      const isAdvanced = campaign.is_advanced || !!campaign.pedido_id;
      const tableName = isAdvanced ? 'campaigns_advanced' : 'campanhas';
      
      // Normalizar datas
      const normalizeDate = (date: string) => {
        if (!date) return '';
        return date.trim();
      };

      // Verificar mudanças reais
      const formStart = normalizeDate(updates.start_date || '');
      const formEnd = normalizeDate(updates.end_date || '');
      const campaignStart = normalizeDate(campaign.start_date || campaign.data_inicio || '');
      const campaignEnd = normalizeDate(campaign.end_date || campaign.data_fim || '');

      const hasStartChange = formStart && formStart !== campaignStart;
      const hasEndChange = formEnd && formEnd !== campaignEnd;
      const hasNameChange = updates.name && updates.name !== campaign.name;
      const hasDescChange = updates.description !== undefined && updates.description !== (campaign.description || campaign.obs);

      console.log('🔍 [UPDATE] Análise de mudanças:', {
        dates: { formStart, campaignStart, formEnd, campaignEnd },
        changes: { start: hasStartChange, end: hasEndChange, name: hasNameChange, desc: hasDescChange }
      });

      if (!hasStartChange && !hasEndChange && !hasNameChange && !hasDescChange) {
        toast.success('Nenhuma alteração detectada');
        return true;
      }

      // Preparar dados para update
      const updateData: any = {};
      
      if (hasStartChange || hasEndChange) {
        if (isAdvanced) {
          if (hasStartChange) updateData.start_date = formStart;
          if (hasEndChange) updateData.end_date = formEnd;
        } else {
          if (hasStartChange) updateData.data_inicio = formStart;
          if (hasEndChange) updateData.data_fim = formEnd;
        }
      }
      
      if (hasNameChange) updateData.name = updates.name;
      if (hasDescChange) {
        if (isAdvanced) {
          updateData.description = updates.description;
        } else {
          updateData.obs = updates.description;
        }
      }

      console.log('💾 [UPDATE] Executando:', { table: tableName, data: updateData });

      // Executar update
      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', campaign.id);

      if (error) {
        console.error('❌ [UPDATE] Erro:', error);
        toast.error('Erro ao atualizar: ' + error.message);
        return false;
      }

      console.log('✅ [UPDATE] Sucesso');
      toast.success('Campanha atualizada com sucesso!');
      onSuccess();
      return true;

    } catch (error) {
      console.error('💥 [UPDATE] Erro inesperado:', error);
      toast.error('Erro inesperado');
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