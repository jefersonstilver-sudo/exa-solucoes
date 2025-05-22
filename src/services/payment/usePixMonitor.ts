
import { PixMonitor } from './PixMonitor';
import { PixMonitorHookOptions, PixMonitorControls } from './pixTypes';

/**
 * Hook for using the PIX monitor
 */
export const usePixMonitor = ({
  pedidoId,
  paymentId,
  onStatusChange
}: PixMonitorHookOptions): PixMonitorControls => {
  let monitor: PixMonitor | null = null;
  
  const startMonitoring = () => {
    if (!monitor && pedidoId && paymentId) {
      monitor = new PixMonitor({
        pedidoId,
        paymentId,
        onStatusChange
      });
      monitor.start();
    }
  };
  
  const stopMonitoring = () => {
    if (monitor) {
      monitor.stop();
      monitor = null;
    }
  };
  
  const checkNow = async () => {
    if (monitor) {
      await monitor.manualCheck();
    } else if (pedidoId && paymentId) {
      // If monitor isn't active, create temporary one
      const tempMonitor = new PixMonitor({
        pedidoId,
        paymentId,
        onStatusChange
      });
      await tempMonitor.manualCheck();
    }
  };
  
  return {
    startMonitoring,
    stopMonitoring,
    checkNow
  };
};
