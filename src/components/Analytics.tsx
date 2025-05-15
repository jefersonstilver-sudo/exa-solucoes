
import React from 'react';

/**
 * Componente de Analytics 
 * Usado para rastrear eventos e interações do usuário
 */
const Analytics: React.FC = () => {
  // No modo de desenvolvimento, apenas registra no console
  React.useEffect(() => {
    console.log('Analytics component mounted');
    
    // Simulação de inicialização de analytics
    if (process.env.NODE_ENV === 'production') {
      console.log('Analytics: Production tracking would initialize here');
    } else {
      console.log('Analytics: Development mode - tracking disabled');
    }
    
    return () => {
      console.log('Analytics component unmounted');
    };
  }, []);

  // Componente não renderiza nada visualmente
  return null;
};

export default Analytics;
