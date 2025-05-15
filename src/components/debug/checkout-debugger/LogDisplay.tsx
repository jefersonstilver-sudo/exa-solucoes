
import React from 'react';
import { LogLevel } from '@/services/checkoutDebugService';
import { XCircle, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

interface LogDisplayProps {
  logs: any[];
  getIconForLogLevel: (level: string) => JSX.Element;
}

const LogDisplay: React.FC<LogDisplayProps> = ({ logs, getIconForLogLevel }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 p-4">
        No logs registered
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {logs.map((log, idx) => (
        <div 
          key={idx}
          className={`text-xs p-2 rounded border ${
            log.level === LogLevel.ERROR ? 'border-red-200 bg-red-50' : 
            log.level === LogLevel.WARNING ? 'border-amber-200 bg-amber-50' :
            log.level === LogLevel.SUCCESS ? 'border-green-200 bg-green-50' :
            log.level === LogLevel.DEBUG ? 'border-purple-200 bg-purple-50' :
            'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            {getIconForLogLevel(log.level)}
            <span className="ml-1 font-medium">{log.event}</span>
            <span className="ml-auto text-[10px] text-gray-500">{log.timestamp}</span>
          </div>
          <p className="mt-1">{log.message}</p>
          {log.details && (
            <pre className="mt-1 whitespace-pre-wrap overflow-x-auto bg-white/50 p-1 rounded text-[10px]">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
};

export default LogDisplay;
