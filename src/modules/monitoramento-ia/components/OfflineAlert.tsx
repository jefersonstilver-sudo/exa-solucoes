import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineAlertProps {
  panelName: string;
  onClose: () => void;
}

export const OfflineAlert = ({ panelName, onClose }: OfflineAlertProps) => {
  const [timeOffline, setTimeOffline] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOffline(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50/90 to-white/90 backdrop-blur-xl shadow-2xl"
    >
      {/* Animated background pulse */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-600/5 to-red-500/10 animate-pulse" />
      
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full blur-md opacity-50 animate-ping" />
              <AlertTriangle className="relative w-6 h-6 text-red-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-red-900">
                Painel Offline
              </h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-mono animate-pulse">
                {formatTime(timeOffline)}
              </span>
            </div>
            <p className="text-sm text-red-700 font-medium">
              {panelName}
            </p>
            <p className="text-xs text-red-600 mt-1">
              Conexão perdida • Verificando reconexão...
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-red-100 transition-colors"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />
    </motion.div>
  );
};
