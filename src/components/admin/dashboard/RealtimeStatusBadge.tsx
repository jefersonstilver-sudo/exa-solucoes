import React from 'react';

interface RealtimeStatusBadgeProps {
  isConnected?: boolean;
  compact?: boolean;
}

const RealtimeStatusBadge: React.FC<RealtimeStatusBadgeProps> = ({ 
  isConnected = true,
  compact = false 
}) => {
  if (!isConnected) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
        </span>
        {!compact && <span>Desconectado</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      {!compact && <span>Sistema conectado</span>}
    </div>
  );
};

export default RealtimeStatusBadge;
