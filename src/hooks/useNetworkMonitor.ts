import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export const useNetworkMonitor = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  });

  const [lastPingTime, setLastPingTime] = useState<number>(Date.now());

  // Ping test para verificar conectividade real
  const pingTest = useCallback(async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-store'
      });
      const endTime = Date.now();
      const pingTime = endTime - startTime;
      
      setLastPingTime(pingTime);
      return true;
    } catch (error) {
      console.error('Ping test failed:', error);
      return false;
    }
  }, []);

  // Atualizar status da rede
  const updateNetworkStatus = useCallback(() => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      setNetworkStatus({
        isOnline: navigator.onLine,
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false
      });
    } else {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }));
    }
  }, []);

  // Monitorar eventos de conexão
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 [Network] Online');
      updateNetworkStatus();
      pingTest();
    };

    const handleOffline = () => {
      console.log('🔴 [Network] Offline');
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      console.log('🔄 [Network] Connection changed');
      updateNetworkStatus();
    };

    // Listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Ping test inicial
    pingTest();

    // Ping test periódico a cada 15 segundos
    const pingInterval = setInterval(async () => {
      const isConnected = await pingTest();
      if (!isConnected && networkStatus.isOnline) {
        // Falso positivo: navigator.onLine diz online mas ping falhou
        setNetworkStatus(prev => ({ ...prev, isOnline: false }));
      } else if (isConnected && !networkStatus.isOnline) {
        // Recuperou conexão
        setNetworkStatus(prev => ({ ...prev, isOnline: true }));
      }
    }, 15000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
      
      clearInterval(pingInterval);
    };
  }, [updateNetworkStatus, pingTest, networkStatus.isOnline]);

  return {
    ...networkStatus,
    lastPingTime
  };
};
