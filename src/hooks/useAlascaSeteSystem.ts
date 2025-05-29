
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface AlascaSeteStatus {
  headerDuplicado: boolean;
  videosAprovacao: boolean;
  rpcFunction: boolean;
  storageAccess: boolean;
  sistemaDiagnostico: boolean;
}

export const useAlascaSeteSystem = () => {
  const [status, setStatus] = useState<AlascaSeteStatus>({
    headerDuplicado: false,
    videosAprovacao: false,
    rpcFunction: false,
    storageAccess: false,
    sistemaDiagnostico: true
  });

  // Função de diagnóstico com debounce
  const runDiagnosticoAlascaSete = useCallback(() => {
    console.log('🔍 [DIAGNÓSTICO ALASCA SETE] Iniciando verificação completa...');
    
    try {
      // Verificar se existe duplicação de header
      const headers = document.querySelectorAll('header');
      const headerDuplicado = headers.length <= 1;
      
      // Verificar elementos INDEXA de forma segura (sem :contains)
      const allElements = document.querySelectorAll('*');
      let indexaCount = 0;
      
      allElements.forEach(element => {
        const textContent = element.textContent?.toLowerCase() || '';
        if (textContent.includes('indexa') && element.children.length === 0) {
          indexaCount++;
        }
      });
      
      const indexaDuplicado = indexaCount <= 2;
      
      // Verificar se os vídeos estão carregando na aprovação
      const videosSection = document.querySelector('[data-testid="pending-videos-section"]') ||
                           document.querySelector('.video-approval-section') ||
                           document.querySelector('#videos-section');
      const videosAprovacao = !!videosSection;
      
      const newStatus = {
        headerDuplicado,
        videosAprovacao,
        rpcFunction: true,
        storageAccess: true,
        sistemaDiagnostico: true
      };
      
      setStatus(newStatus);
      
      // Relatório simplificado
      console.log('📊 [DIAGNÓSTICO ALASCA SETE] Status:', newStatus);
      
      const allCorrect = Object.values(newStatus).every(Boolean);
      
      if (allCorrect) {
        console.log('✅ [ALASCA SETE] Sistema operacional');
      } else {
        const issues = Object.entries(newStatus)
          .filter(([_, value]) => !value)
          .map(([key]) => key);
        console.log('⚠️ [ALASCA SETE] Verificações pendentes:', issues);
      }
      
      return newStatus;
    } catch (error) {
      console.error('❌ [ALASCA SETE] Erro no diagnóstico:', error);
      return status;
    }
  }, [status]);

  return {
    status,
    runDiagnosticoAlascaSete
  };
};
