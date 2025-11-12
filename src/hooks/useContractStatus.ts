
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
        console.error('Erro ao buscar vídeos aprovados:', error);
      }
      
      // Usar timezone brasileiro para cálculos corretos
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
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
      const hasActiveStatus = status === 'video_aprovado' || status === 'ativo';
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
      
      newContractData.daysRemaining = Math.max(0, daysRemaining);
      
      // Calcular horas restantes se < 24 horas
      if (daysRemaining === 0 && timeDiff > 0) {
        const hoursRemaining = Math.ceil(timeDiff / (1000 * 3600));
        newContractData.hoursRemaining = hoursRemaining;
      }
      
      // Verificar se expirou
      if (daysRemaining < 0 || status === 'expirado') {
        newContractData.isExpired = true;
        newContractData.isActive = false;
      } else {
        newContractData.isActive = status === 'video_aprovado' || status === 'ativo';
        
        // Verificar se está próximo da expiração (7 dias)
        if (daysRemaining <= 7 && daysRemaining > 0) {
          newContractData.isExpiringSoon = true;
        }
      }
      
      // Calcular progresso e total de dias
      const totalTime = endDateOnly.getTime() - startDateOnly.getTime();
      const elapsedTime = today.getTime() - startDateOnly.getTime();
      newContractData.totalDays = Math.ceil(totalTime / (1000 * 3600 * 24));
      newContractData.progressPercentage = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
      } else {
        // Contrato ainda não iniciou - aguardando aprovação de vídeo
        newContractData.isActive = false;
        newContractData.daysRemaining = 0;
        newContractData.totalDays = orderDetails.plano_meses * 30; // Estimativa
      }

      setContractData(newContractData);
    };

    checkContractStatus();
  }, [orderDetails]);

  return contractData;
};
