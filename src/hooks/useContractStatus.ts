
import { useState, useEffect } from 'react';

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
  data_inicio?: string;
  data_fim?: string;
  status: string;
  plano_meses: number;
}, videoData?: { approvedVideos: number }) => {
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
    if (!orderDetails) return;

    const { data_inicio, data_fim, status } = orderDetails;
    const today = new Date();
    
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

    // Verificar se o contrato já iniciou (tem datas definidas E vídeo aprovado)
    const hasStarted = !!(data_inicio && data_fim && videoData?.approvedVideos && videoData.approvedVideos > 0);
    newContractData.hasStarted = hasStarted;

    if (hasStarted) {
      const endDate = new Date(data_fim);
      const startDate = new Date(data_inicio);
      
      const timeDiff = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      newContractData.daysRemaining = Math.max(0, daysRemaining);
      
      // Calcular horas restantes se < 24 horas
      if (daysRemaining === 0 && timeDiff > 0) {
        newContractData.hoursRemaining = Math.ceil(timeDiff / (1000 * 3600));
      }
      
      // Verificar se expirou
      if (daysRemaining < 0 || status === 'expirado') {
        newContractData.isExpired = true;
        newContractData.isActive = false;
      } else {
        newContractData.isActive = ['video_aprovado', 'ativo'].includes(status);
        
        // Verificar se está próximo da expiração (7 dias)
        if (daysRemaining <= 7 && daysRemaining > 0) {
          newContractData.isExpiringSoon = true;
        }
      }
      
      // Calcular progresso e total de dias
      const totalTime = endDate.getTime() - startDate.getTime();
      const elapsedTime = today.getTime() - startDate.getTime();
      newContractData.totalDays = Math.ceil(totalTime / (1000 * 3600 * 24));
      newContractData.progressPercentage = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
    } else {
      // Contrato ainda não iniciou - aguardando aprovação de vídeo
      newContractData.isActive = false;
      newContractData.daysRemaining = 0;
      newContractData.totalDays = orderDetails.plano_meses * 30; // Estimativa
    }

    setContractData(newContractData);
  }, [orderDetails, videoData]);

  return contractData;
};
