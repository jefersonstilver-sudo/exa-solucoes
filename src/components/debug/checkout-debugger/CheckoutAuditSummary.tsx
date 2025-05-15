
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getCheckoutAuditSummary } from '@/services/checkoutDebugService';

const CheckoutAuditSummary: React.FC = () => {
  const summary = getCheckoutAuditSummary();
  
  return (
    <div className="bg-gray-50 rounded-md p-3 text-sm">
      <div className="flex justify-between mb-2">
        <span>Total logs:</span>
        <span className="font-medium">{summary.totalLogs}</span>
      </div>
      <div className="flex justify-between mb-4">
        <span>Errors:</span>
        <span className={`font-medium ${summary.errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {summary.errorCount}
        </span>
      </div>
      
      {summary.errorCount > 0 && (
        <div>
          <h4 className="font-medium mb-2 text-red-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Recent errors
          </h4>
          <ul className="space-y-1">
            {summary.recentErrors.map((error: any, idx: number) => (
              <li key={idx} className="text-xs border-l-2 border-red-500 pl-2">
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CheckoutAuditSummary;
