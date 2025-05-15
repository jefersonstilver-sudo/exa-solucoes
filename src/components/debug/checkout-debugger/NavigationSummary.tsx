
import React from 'react';
import { Button } from '@/components/ui/button';
import { resetNavigationCooldown } from '@/services/navigationService';

interface NavigationSummaryProps {
  healthStatus: any;
  onReset: () => void;
}

const NavigationSummary: React.FC<NavigationSummaryProps> = ({ healthStatus, onReset }) => {
  return (
    <div className="bg-gray-50 rounded-md p-3 text-sm">
      <h4 className="font-medium mb-2">Navigation</h4>
      <div className="flex justify-between mb-2">
        <span>Status:</span>
        <span className={`font-medium ${
          healthStatus.status === 'issues' ? 'text-red-600' : 
          healthStatus.status === 'reset' ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {healthStatus.status === 'issues' ? 'With issues' : 
           healthStatus.status === 'reset' ? 'Reset' : 'Healthy'}
        </span>
      </div>
      <div className="flex justify-between mb-2">
        <span>Recent failures:</span>
        <span className="font-medium">{healthStatus.recentFailures || 0}</span>
      </div>
      <div className="flex justify-between">
        <span>Checkout attempts:</span>
        <span className="font-medium">{healthStatus.checkoutAttempts || 0}</span>
      </div>
    </div>
  );
};

export default NavigationSummary;
