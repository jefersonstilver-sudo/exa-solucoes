
import React from 'react';
import { XCircle, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

export const getIconForLogLevel = (level: string) => {
  switch(level) {
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};
