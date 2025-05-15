
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface NavigationLogDisplayProps {
  logs: any[];
}

const NavigationLogDisplay: React.FC<NavigationLogDisplayProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="text-center text-sm text-gray-500 p-4">
        No navigation logs registered
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {logs.map((log, idx) => (
        <div 
          key={idx}
          className={`text-xs p-2 rounded border ${
            !log.success ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            {log.success ? 
              <CheckCircle className="h-4 w-4 text-green-500" /> : 
              <XCircle className="h-4 w-4 text-red-500" />
            }
            <span className="ml-1 font-medium">{log.method}</span>
            <span className="ml-auto text-[10px] text-gray-500">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="mt-1 flex items-center">
            <span className="text-gray-600">From:</span>
            <span className="ml-1 font-mono">{log.from || '/'}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600">To:</span>
            <span className="ml-1 font-mono">{log.to}</span>
          </div>
          {log.error && (
            <p className="mt-1 text-red-600">{log.error}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default NavigationLogDisplay;
