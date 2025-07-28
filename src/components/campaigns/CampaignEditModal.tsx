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
      console.log('📝 [UPDATE] === INICIANDO ATUALIZAÇÃO ===');
      console.log('📝 [UPDATE] Campaign ID:', campaign.id);
      console.log('📝 [UPDATE] Updates recebidos:', updates);
      console.log('📝 [UPDATE] Campaign atual:', campaign);

      // Determinar tabela correta
      const isAdvanced = campaign.is_advanced || !!campaign.pedido_id;
      const tableName = isAdvanced ? 'campaigns_advanced' : 'campanhas';
      console.log('🎯 [UPDATE] Tabela alvo:', tableName, '(isAdvanced:', isAdvanced, ')');
      
      // 🔧 CORREÇÃO CRÍTICA: Normalização de datas melhorada
      const normalizeDate = (date: string | undefined) => {
        if (!date) {
          console.log('🔴 [NORMALIZE] Data vazia:', date);
          return '';
        }
        
        const cleaned = date.trim();
        console.log('📅 [NORMALIZE] Processando:', cleaned);
        
        // PRIORIDADE 1: Se já está no formato YYYY-MM-DD, validar e usar
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
          console.log('✅ [NORMALIZE] Formato YYYY-MM-DD detectado:', cleaned);
          return cleaned;
        }
        
        // PRIORIDADE 2: Converter DD/MM/YYYY para YYYY-MM-DD
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
          const [day, month, year] = cleaned.split('/');
          const converted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          console.log('🔄 [NORMALIZE] Convertido DD/MM/YYYY:', cleaned, '->', converted);
          return converted;
        }
        
        // PRIORIDADE 3: Tentar parse direto como última opção
        try {
          const dateObj = new Date(cleaned);
          if (!isNaN(dateObj.getTime())) {
            const isoConverted = dateObj.toISOString().split('T')[0];
            console.log('🔄 [NORMALIZE] Parse ISO:', cleaned, '->', isoConverted);
            return isoConverted;
          }
        } catch (e) {
          console.warn('⚠️ [NORMALIZE] Falha no parse:', cleaned, e);
        }
        
        console.warn('❌ [NORMALIZE] Formato não reconhecido, retornando original:', cleaned);
        return cleaned;
      };

      // Obter e normalizar valores
      const formStart = normalizeDate(updates.start_date);
      const formEnd = normalizeDate(updates.end_date);
      const campaignStart = normalizeDate(campaign.start_date || campaign.data_inicio);
      const campaignEnd = normalizeDate(campaign.end_date || campaign.data_fim);

      console.log('📊 [UPDATE] Comparação de datas:');
      console.log('📊 [UPDATE] Form Start:', formStart, 'vs Campaign Start:', campaignStart);
      console.log('📊 [UPDATE] Form End:', formEnd, 'vs Campaign End:', campaignEnd);

      // 🔧 CORREÇÃO CRÍTICA: Detectar mudanças de forma mais robusta
      const hasStartChange = formStart && formStart !== campaignStart;
      const hasEndChange = formEnd && formEnd !== campaignEnd;
      const hasNameChange = updates.name !== undefined && updates.name !== campaign.name;
      const hasDescChange = updates.description !== undefined && updates.description !== (campaign.description || campaign.obs);

      console.log('🔍 [UPDATE] Análise de mudanças:');
      console.log('🔍 [UPDATE] Start mudou:', hasStartChange, '(', formStart, '!=', campaignStart, ')');
      console.log('🔍 [UPDATE] End mudou:', hasEndChange, '(', formEnd, '!=', campaignEnd, ')');
      console.log('🔍 [UPDATE] Name mudou:', hasNameChange);
      console.log('🔍 [UPDATE] Desc mudou:', hasDescChange);

      // Verificar se há mudanças
      if (!hasStartChange && !hasEndChange && !hasNameChange && !hasDescChange) {
        console.log('⚠️ [UPDATE] Nenhuma mudança detectada');
        toast.info('Nenhuma alteração foi detectada');
        return true;
      }

      // 🔧 CORREÇÃO CRÍTICA: Preparar dados com validação rigorosa
      const updateData: any = {};
      
      if (hasStartChange) {
        if (isAdvanced) {
          updateData.start_date = formStart;
        } else {
          updateData.data_inicio = formStart;
        }
        console.log('📅 [UPDATE] Data início será atualizada:', formStart);
      }
      
      if (hasEndChange) {
        if (isAdvanced) {
          updateData.end_date = formEnd;
        } else {
          updateData.data_fim = formEnd;
        }
        console.log('📅 [UPDATE] Data fim será atualizada:', formEnd);
      }
      
      if (hasNameChange) {
        updateData.name = updates.name;
        console.log('📝 [UPDATE] Nome será atualizado:', updates.name);
      }
      
      if (hasDescChange) {
        if (isAdvanced) {
          updateData.description = updates.description;
        } else {
          updateData.obs = updates.description;
        }
        console.log('📝 [UPDATE] Descrição será atualizada');
      }

      console.log('💾 [UPDATE] === EXECUTANDO UPDATE NO SUPABASE ===');
      console.log('💾 [UPDATE] Tabela:', tableName);
      console.log('💾 [UPDATE] ID:', campaign.id);
      console.log('💾 [UPDATE] Dados:', JSON.stringify(updateData, null, 2));

      // Executar update com logs detalhados
      const { error, data } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', campaign.id)
        .select();

      if (error) {
        console.error('❌ [UPDATE] ERRO NO SUPABASE:', error);
        console.error('❌ [UPDATE] Detalhes do erro:', JSON.stringify(error, null, 2));
        toast.error('Erro ao atualizar: ' + error.message);
        return false;
      }

      console.log('✅ [UPDATE] SUCESSO NO SUPABASE!');
      console.log('✅ [UPDATE] Dados retornados:', JSON.stringify(data, null, 2));
      
      // 🔧 CORREÇÃO CRÍTICA: Verificar se o update foi persistido
      console.log('🔍 [UPDATE] === VERIFICANDO PERSISTÊNCIA ===');
      const { data: verificationData, error: verificationError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', campaign.id)
        .maybeSingle();

      if (verificationError) {
        console.error('❌ [UPDATE] Erro na verificação:', verificationError);
      } else {
        console.log('🔍 [UPDATE] Dados após update:', JSON.stringify(verificationData, null, 2));
        
        // Verificar se as datas foram realmente atualizadas
        if (hasStartChange && verificationData) {
          const persistedStart = isAdvanced ? (verificationData as any).start_date : (verificationData as any).data_inicio;
          console.log('🔍 [UPDATE] Start date verificação:', 'esperado:', formStart, 'persistido:', persistedStart);
        }
        
        if (hasEndChange && verificationData) {
          const persistedEnd = isAdvanced ? (verificationData as any).end_date : (verificationData as any).data_fim;
          console.log('🔍 [UPDATE] End date verificação:', 'esperado:', formEnd, 'persistido:', persistedEnd);
        }
      }

      toast.success('Campanha atualizada com sucesso!');
      
      // 🔧 CORREÇÃO CRÍTICA: Chamar onSuccess para forçar reload
      console.log('✅ [UPDATE] Chamando onSuccess para reload...');
      onSuccess();
      
      return true;

    } catch (error) {
      console.error('💥 [UPDATE] ERRO INESPERADO:', error);
      console.error('💥 [UPDATE] Stack:', error instanceof Error ? error.stack : 'N/A');
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