
import React from 'react';
import CheckoutAuditSummary from './CheckoutAuditSummary';
import NavigationSummary from './NavigationSummary';
import SystemActions from './SystemActions';

interface SummaryTabProps {
  healthStatus: any;
  onResetNavigation: () => void;
  onClearLogs: () => void;
}

const SummaryTab: React.FC<SummaryTabProps> = ({ 
  healthStatus, 
  onResetNavigation,
  onClearLogs
}) => {
  return (
    <div className="p-4 mt-2">
      <h3 className="font-medium mb-3">System Summary</h3>
      
      <div className="space-y-4">
        <CheckoutAuditSummary />
        
        <NavigationSummary 
          healthStatus={healthStatus} 
          onReset={onResetNavigation} 
        />
        
        <SystemActions 
          onResetNavigation={onResetNavigation}
          onClearLogs={onClearLogs}
        />
      </div>
    </div>
  );
};

export default SummaryTab;
