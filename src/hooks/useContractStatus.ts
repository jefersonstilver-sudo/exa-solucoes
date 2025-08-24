
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ContractStatusReturn {
  isActive: boolean;
  daysRemaining: number;
  hoursRemaining: number | null;
  totalDays: number | null;
  progressPercentage: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  hasStarted: boolean;
}

export const useContractStatus = (orderDetails: {
  id?: string;
  data_inicio?: string;
  data_fim?: string;
  status: string;
  plano_meses: number;
}) => {
  const [contractData, setContractData] = useState<ContractStatusReturn>({
    isActive: false,
    daysRemaining: 0,
    hoursRemaining: null,
    totalDays: null,
    progressPercentage: 0,
    isExpiringSoon: false,
    isExpired: false,
    hasStarted: false
  });

  useEffect(() => {
    if (!orderDetails || !orderDetails.id) return;

    const checkContractStatus = async () => {
      const { data_inicio, data_fim, status, id } = orderDetails;
      
      // Consultar vídeos aprovados diretamente do banco
      let approvedVideosCount = 0;
      try {
        const { data: approvedVideos, error } = await supabase
          .from('pedido_videos')
          .select('id')
          .eq('pedido_id', id)
          .eq('approval_status', 'approved');
        
        if (!error && approvedVideos) {
          approvedVideosCount = approvedVideos.length;
        }
      } catch (error) {
        console.error('❌ [CONTRACT STATUS] Erro ao buscar vídeos aprovados:', error);
      }
      
      // Usar timezone brasileiro para cálculos corretos
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      console.log('📅 [CONTRACT STATUS] Debug de datas:', {
        data_inicio,
        data_fim,
        status,
        today: today.toISOString(),
        approvedVideosCount,
        hasApprovedVideos: approvedVideosCount > 0
      });
    
    let newContractData: ContractStatusReturn = {
      isActive: false,
      daysRemaining: 0,
      hoursRemaining: null,
      totalDays: null,
      progressPercentage: 0,
      isExpiringSoon: false,
      isExpired: false,
      hasStarted: false
    };

      // Verificar se o contrato já iniciou (tem datas definidas E vídeo aprovado OU status ativo)
      const hasVideoApproved = approvedVideosCount > 0;
      const hasActiveStatus = status === 'video_aprovado';
      const hasStarted = !!(data_inicio && data_fim && (hasVideoApproved || hasActiveStatus));
      newContractData.hasStarted = hasStarted;

    if (hasStarted) {
      // Criar objetos Date apenas com data (sem hora) para cálculos precisos
      const endDate = new Date(data_fim);
      const startDate = new Date(data_inicio);
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      
      // Calcular diferença em dias - mais preciso
      const timeDiff = endDateOnly.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      console.log('📅 [CONTRACT STATUS] Cálculo de dias:', {
        endDateOnly: endDateOnly.toISOString(),
        startDateOnly: startDateOnly.toISOString(),
        today: today.toISOString(),
        timeDiff,
        daysRemaining
      });
      
      newContractData.daysRemaining = Math.max(0, daysRemaining);
      
      // Calcular horas restantes se < 24 horas
      if (daysRemaining === 0 && timeDiff > 0) {
        const hoursRemaining = Math.ceil(timeDiff / (1000 * 3600));
        newContractData.hoursRemaining = hoursRemaining;
        console.log('⏰ [CONTRACT STATUS] Horas restantes:', hoursRemaining);
      }
      
      // Verificar se expirou
      if (daysRemaining < 0 || status === 'expirado') {
        newContractData.isExpired = true;
        newContractData.isActive = false;
        console.log('❌ [CONTRACT STATUS] Contrato expirado');
      } else {
        newContractData.isActive = status === 'video_aprovado';
        
        // Verificar se está próximo da expiração (7 dias)
        if (daysRemaining <= 7 && daysRemaining > 0) {
          newContractData.isExpiringSoon = true;
          console.log('⚠️ [CONTRACT STATUS] Contrato expirando em breve');
        }
      }
      
      // Calcular progresso e total de dias
      const totalTime = endDateOnly.getTime() - startDateOnly.getTime();
      const elapsedTime = today.getTime() - startDateOnly.getTime();
      newContractData.totalDays = Math.ceil(totalTime / (1000 * 3600 * 24));
      newContractData.progressPercentage = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
      
      console.log('📊 [CONTRACT STATUS] Progresso calculado:', {
        totalDays: newContractData.totalDays,
        progressPercentage: newContractData.progressPercentage
      });
      } else {
        // Contrato ainda não iniciou - aguardando aprovação de vídeo
        newContractData.isActive = false;
        newContractData.daysRemaining = 0;
        newContractData.totalDays = orderDetails.plano_meses * 30; // Estimativa
        console.log('⏳ [CONTRACT STATUS] Contrato aguardando aprovação de vídeo - Videos aprovados:', approvedVideosCount);
      }

      setContractData(newContractData);
    };

    checkContractStatus();
  }, [orderDetails]);

  return contractData;
};
