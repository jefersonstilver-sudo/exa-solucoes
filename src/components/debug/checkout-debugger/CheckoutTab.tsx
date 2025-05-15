
import React from 'react';
import LogDisplay from './LogDisplay';
import { getIconForLogLevel } from './utils';

interface CheckoutTabProps {
  checkoutLogs: any[];
}

const CheckoutTab: React.FC<CheckoutTabProps> = ({ checkoutLogs }) => {
  return (
    <div className="p-4 mt-2 max-h-[70vh] overflow-y-auto">
      <h3 className="font-medium mb-3">Logs of Checkout</h3>
      <LogDisplay 
        logs={checkoutLogs} 
        getIconForLogLevel={getIconForLogLevel} 
      />
    </div>
  );
};

export default CheckoutTab;
