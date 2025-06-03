
import { useState, useEffect } from 'react';

interface ContractStatusReturn {
  isActive: boolean;
  daysRemaining: number;
  hoursRemaining: number | null;
  totalDays: number | null;
  progressPercentage: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

export const useContractStatus = (orderDetails: {
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
    isExpired: false
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
      isExpired: false
    };

    if (data_fim) {
      const endDate = new Date(data_fim);
      const startDate = data_inicio ? new Date(data_inicio) : null;
      
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
        newContractData.isActive = ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'].includes(status);
        
        // Verificar se está próximo da expiração (7 dias)
        if (daysRemaining <= 7 && daysRemaining > 0) {
          newContractData.isExpiringSoon = true;
        }
      }
      
      // Calcular progresso e total de dias
      if (startDate && newContractData.isActive) {
        const totalTime = endDate.getTime() - startDate.getTime();
        const elapsedTime = today.getTime() - startDate.getTime();
        newContractData.totalDays = Math.ceil(totalTime / (1000 * 3600 * 24));
        newContractData.progressPercentage = Math.min(100, Math.max(0, (elapsedTime / totalTime) * 100));
      }
    } else {
      // Sem data de fim definida
      newContractData.isActive = ['pago', 'pago_pendente_video', 'video_aprovado', 'ativo'].includes(status);
    }

    setContractData(newContractData);
  }, [orderDetails]);

  return contractData;
};
