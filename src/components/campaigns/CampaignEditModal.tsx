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
      
      // Normalizar datas para formato YYYY-MM-DD
      const normalizeDate = (date: string | undefined) => {
        if (!date) return '';
        const cleaned = date.trim();
        
        // Se já está no formato YYYY-MM-DD, retorna como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
          return cleaned;
        }
        
        // Se está no formato DD/MM/YYYY, converte para YYYY-MM-DD
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
          const [day, month, year] = cleaned.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Para outros formatos, tenta criar uma data e extrair no formato correto
        try {
          const dateObj = new Date(cleaned);
          if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString().split('T')[0];
          }
        } catch (e) {
          console.warn('Formato de data não reconhecido:', cleaned);
        }
        
        return cleaned;
      };

      // Obter valores normalizados
      const formStart = normalizeDate(updates.start_date);
      const formEnd = normalizeDate(updates.end_date);
      const campaignStart = normalizeDate(campaign.start_date || campaign.data_inicio);
      const campaignEnd = normalizeDate(campaign.end_date || campaign.data_fim);

      // Detectar mudanças de forma mais robusta
      const hasStartChange = formStart !== campaignStart;
      const hasEndChange = formEnd !== campaignEnd;
      const hasNameChange = updates.name !== undefined && updates.name !== campaign.name;
      const hasDescChange = updates.description !== undefined && updates.description !== (campaign.description || campaign.obs);

      console.log('🔍 [UPDATE] Detecção de mudanças:', {
        dates: { 
          formStart, 
          campaignStart, 
          formEnd, 
          campaignEnd,
          startChanged: hasStartChange,
          endChanged: hasEndChange
        },
        changes: { start: hasStartChange, end: hasEndChange, name: hasNameChange, desc: hasDescChange }
      });

      // Se não há mudanças reais, retornar sucesso
      if (!hasStartChange && !hasEndChange && !hasNameChange && !hasDescChange) {
        toast.success('Nenhuma alteração detectada');
        return true;
      }

      // Preparar dados para update apenas com campos que mudaram
      const updateData: any = {};
      
      if (hasStartChange) {
        if (isAdvanced) {
          updateData.start_date = formStart;
        } else {
          updateData.data_inicio = formStart;
        }
      }
      
      if (hasEndChange) {
        if (isAdvanced) {
          updateData.end_date = formEnd;
        } else {
          updateData.data_fim = formEnd;
        }
      }
      
      if (hasNameChange) {
        updateData.name = updates.name;
      }
      
      if (hasDescChange) {
        if (isAdvanced) {
          updateData.description = updates.description;
        } else {
          updateData.obs = updates.description;
        }
      }

      console.log('💾 [UPDATE] Dados preparados:', { table: tableName, updateData });

      // Executar update
      const { error, data } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', campaign.id)
        .select();

      if (error) {
        console.error('❌ [UPDATE] Erro no Supabase:', error);
        toast.error('Erro ao atualizar: ' + error.message);
        return false;
      }

      console.log('✅ [UPDATE] Sucesso - Dados retornados:', data);
      toast.success('Campanha atualizada com sucesso!');
      onSuccess();
      return true;

    } catch (error) {
      console.error('💥 [UPDATE] Erro inesperado:', error);
      toast.error('Erro inesperado ao atualizar');
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