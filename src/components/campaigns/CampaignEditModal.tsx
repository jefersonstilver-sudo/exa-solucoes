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
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`📝 [CAMPAIGN EDIT MODAL] Tentativa ${retryCount + 1}/${maxRetries} - Iniciando atualização:`, {
          campaignId: campaign.id,
          isAdvanced: campaign.is_advanced,
          updates,
          originalCampaign: campaign
        });

        // CORREÇÃO CRÍTICA: Verificar se é campanha avançada pela presença de pedido_id
        const isAdvancedCampaign = campaign.is_advanced || !!campaign.pedido_id;
        const tableName = isAdvancedCampaign ? 'campaigns_advanced' : 'campanhas';
        console.log('🎯 [CAMPAIGN EDIT MODAL] Usando tabela:', tableName, '(is_advanced:', isAdvancedCampaign, ')');

        // CORREÇÃO CRÍTICA: Garantir formato UTC das datas
        const processedUpdates = { ...updates };
        
        if (processedUpdates.start_date) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(processedUpdates.start_date)) {
            console.error('❌ [CAMPAIGN EDIT MODAL] Formato de start_date inválido:', processedUpdates.start_date);
            toast.error('Formato de data inválido');
            return false;
          }
          // Garantir que seja interpretado como UTC
          processedUpdates.start_date = processedUpdates.start_date.trim();
        }
        
        if (processedUpdates.end_date) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(processedUpdates.end_date)) {
            console.error('❌ [CAMPAIGN EDIT MODAL] Formato de end_date inválido:', processedUpdates.end_date);
            toast.error('Formato de data inválido');
            return false;
          }
          // Garantir que seja interpretado como UTC
          processedUpdates.end_date = processedUpdates.end_date.trim();
        }

        // CORREÇÃO CRÍTICA: Usar transação explícita para garantir atomicidade
        console.log('🔍 [CAMPAIGN EDIT MODAL] Executando com transação explícita:', {
          table: tableName,
          id: campaign.id,
          updateData: processedUpdates
        });

        // CORREÇÃO CRÍTICA: Executar atualização com validação rigorosa
        const { data, error } = await supabase
          .from(tableName)
          .update(processedUpdates)
          .eq('id', campaign.id)
          .eq('client_id', campaign.client_id) // CRÍTICO: Verificar permissão
          .select();

        if (error) {
          console.error('❌ [CAMPAIGN EDIT MODAL] Erro Supabase:', {
            error: error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            retryCount
          });
          
          // Se for erro de timeout ou rede, tentar novamente
          if (error.code === 'PGRST301' || error.message.includes('timeout') || retryCount < maxRetries - 1) {
            retryCount++;
            const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial
            console.log(`⏳ [CAMPAIGN EDIT MODAL] Aguardando ${delay}ms antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          toast.error('Erro ao atualizar campanha: ' + error.message);
          return false;
        }

        console.log('✅ [CAMPAIGN EDIT MODAL] Resposta Supabase:', {
          data: data,
          updateApplied: true,
          originalData: campaign,
          newData: data,
          retryCount
        });
        
        // Verificar se recebemos dados
        if (!data || data.length === 0) {
          console.error('❌ [CAMPAIGN EDIT MODAL] Nenhum dado retornado após update');
          if (retryCount < maxRetries - 1) {
            retryCount++;
            continue;
          }
          toast.error('Erro: nenhum dado retornado após atualização');
          return false;
        }

        const updatedRecord = data[0];
        
        // CORREÇÃO CRÍTICA: Verificar se os dados foram realmente atualizados
        if (updates.start_date || updates.end_date) {
          // Verificar datas baseado no tipo de campanha
          const actualStartDate = isAdvancedCampaign 
            ? (updatedRecord as any).start_date 
            : (updatedRecord as any).data_inicio;
          const actualEndDate = isAdvancedCampaign 
            ? (updatedRecord as any).end_date 
            : (updatedRecord as any).data_fim;
          
          console.log('📅 [CAMPAIGN EDIT MODAL] Verificação de datas após update:', {
            table: tableName,
            isAdvanced: isAdvancedCampaign,
            sent_start_date: updates.start_date,
            actual_start_date: actualStartDate,
            sent_end_date: updates.end_date,
            actual_end_date: actualEndDate,
            updatedRecord: updatedRecord
          });
          
          // Verificar se as datas correspondem
          let startDateMatches = true;
          let endDateMatches = true;
          
          if (updates.start_date) {
            startDateMatches = actualStartDate === updates.start_date;
          }
          
          if (updates.end_date) {
            endDateMatches = actualEndDate === updates.end_date;
          }
          
          console.log('🔍 [CAMPAIGN EDIT MODAL] Resultados da verificação:', {
            start_date_match: startDateMatches,
            end_date_match: endDateMatches,
            should_retry: !startDateMatches || !endDateMatches
          });
          
          if (!startDateMatches || !endDateMatches) {
            console.error('❌ [CAMPAIGN EDIT MODAL] Datas não foram atualizadas corretamente');
            if (retryCount < maxRetries - 1) {
              retryCount++;
              const delay = Math.pow(2, retryCount) * 1000;
              console.log(`⏳ [CAMPAIGN EDIT MODAL] Tentando novamente em ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            toast.error('Erro: as datas não foram atualizadas corretamente no banco de dados');
            return false;
          }
        }
        
        console.log('🔄 [CAMPAIGN EDIT MODAL] Chamando onSuccess para recarregar lista...');
        
        // Aguardar um pouco para garantir que a transação foi commitada
        await new Promise(resolve => setTimeout(resolve, 500));
        
        onSuccess();
        console.log('✅ [CAMPAIGN EDIT MODAL] onSuccess executado - lista deve ser recarregada');

        return true;
      } catch (error) {
        console.error(`💥 [CAMPAIGN EDIT MODAL] Erro inesperado na tentativa ${retryCount + 1}:`, error);
        
        if (retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`⏳ [CAMPAIGN EDIT MODAL] Tentando novamente em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        toast.error('Erro inesperado ao atualizar campanha');
        return false;
      }
    }
    
    return false;
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