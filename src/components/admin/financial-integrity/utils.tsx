
import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'OK':
    case 'HEALTHY':
      return 'bg-green-100 text-green-800';
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-800';
    case 'ERROR':
    case 'CRITICAL':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'OK':
    case 'HEALTHY':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'WARNING':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'ERROR':
    case 'CRITICAL':
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-600" />;
  }
};
