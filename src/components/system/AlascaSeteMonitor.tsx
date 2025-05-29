
import React, { useEffect } from 'react';
import { useAlascaSeteSystem } from '@/hooks/useAlascaSeteSystem';

const AlascaSeteMonitor: React.FC = () => {
  const { runDiagnosticoAlascaSete } = useAlascaSeteSystem();

  useEffect(() => {
    let diagnosticInterval: NodeJS.Timeout;

    // Listener global para comando de diagnóstico (apenas Ctrl + Alt + D)
    const handleGlobalCommand = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === 'd') {
        event.preventDefault();
        runDiagnosticoAlascaSete();
      }
    };

    // Console interceptor mais seguro
    const setupConsoleListener = () => {
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        try {
          const message = args.join(' ').toLowerCase();
          if (message.includes('diagnóstico alasca sete') || message.includes('diagnostico alasca sete')) {
            setTimeout(() => runDiagnosticoAlascaSete(), 100);
          }
        } catch (error) {
          // Silently fail to avoid breaking the app
        }
        originalConsoleLog.apply(console, args);
      };
      return originalConsoleLog;
    };

    const originalConsoleLog = setupConsoleListener();
    document.addEventListener('keydown', handleGlobalCommand);

    // Diagnóstico inicial mais suave (apenas uma vez após 2 segundos)
    const initialTimeout = setTimeout(() => {
      console.log('🔧 [ALASCA SETE] Sistema de monitoramento ativo');
      console.log('📝 [ALASCA SETE] Use Ctrl+Alt+D para diagnóstico manual');
    }, 2000);

    // Diagnóstico periódico reduzido (a cada 5 minutos, apenas se necessário)
    diagnosticInterval = setInterval(() => {
      // Só executa se não houver erros visíveis na página
      const hasErrors = document.querySelector('.error') || document.querySelector('[data-error]');
      if (!hasErrors) {
        runDiagnosticoAlascaSete();
      }
    }, 300000); // 5 minutos

    return () => {
      document.removeEventListener('keydown', handleGlobalCommand);
      console.log = originalConsoleLog;
      clearTimeout(initialTimeout);
      clearInterval(diagnosticInterval);
    };
  }, [runDiagnosticoAlascaSete]);

  return null;
};

export default AlascaSeteMonitor;
