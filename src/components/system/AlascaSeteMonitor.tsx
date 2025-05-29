
import React, { useEffect } from 'react';
import { useAlascaSeteSystem } from '@/hooks/useAlascaSeteSystem';

const AlascaSeteMonitor: React.FC = () => {
  const { runDiagnosticoAlascaSete } = useAlascaSeteSystem();

  useEffect(() => {
    // Listener global para comando de diagnóstico
    const handleGlobalCommand = (event: KeyboardEvent) => {
      // Ctrl + Alt + D para diagnóstico rápido
      if (event.ctrlKey && event.altKey && event.key === 'd') {
        event.preventDefault();
        runDiagnosticoAlascaSete();
      }
    };

    // Listener para console
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ').toLowerCase();
      if (message.includes('diagnóstico alasca sete') || message.includes('diagnostico alasca sete')) {
        setTimeout(() => runDiagnosticoAlascaSete(), 100);
      }
      originalConsoleLog.apply(console, args);
    };

    document.addEventListener('keydown', handleGlobalCommand);

    // Auto-diagnóstico na inicialização
    setTimeout(() => {
      console.log('🔧 [ALASCA SETE] Sistema de monitoramento ativo');
      console.log('📝 [ALASCA SETE] Use Ctrl+Alt+D ou digite "diagnóstico Alasca sete" no console');
    }, 1000);

    return () => {
      document.removeEventListener('keydown', handleGlobalCommand);
      console.log = originalConsoleLog;
    };
  }, [runDiagnosticoAlascaSete]);

  return null; // Componente invisível
};

export default AlascaSeteMonitor;
