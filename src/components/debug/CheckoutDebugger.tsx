
import React, { useEffect, useState } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllCheckoutLogs } from '@/services/checkoutDebugService';
import { getAllNavigationLogs, checkNavigationHealth } from '@/services/navigationAuditService';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { resetNavigationCooldown } from '@/services/navigationService';

// Import our refactored components
import CheckoutTab from './checkout-debugger/CheckoutTab';
import NavigationTab from './checkout-debugger/NavigationTab';
import SummaryTab from './checkout-debugger/SummaryTab';

interface CheckoutDebuggerProps {
  onClose: () => void;
}

const CheckoutDebugger: React.FC<CheckoutDebuggerProps> = ({ onClose }) => {
  const [checkoutLogs, setCheckoutLogs] = useState<any[]>([]);
  const [navigationLogs, setNavigationLogs] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState('checkout');
  const [healthStatus, setHealthStatus] = useState<any>({});
  
  useEffect(() => {
    // Load logs when component mounts
    setCheckoutLogs(getAllCheckoutLogs());
    setNavigationLogs(getAllNavigationLogs());
    setHealthStatus(checkNavigationHealth());
  }, []);
  
  // Function to reset navigation state
  const handleResetNavigation = () => {
    resetNavigationCooldown();
    setHealthStatus({...healthStatus, status: 'reset'});
  };

  // Function to clear all logs
  const handleClearLogs = () => {
    localStorage.removeItem('checkout_debug_logs');
    localStorage.removeItem('navigation_audit_logs');
    setCheckoutLogs([]);
    setNavigationLogs([]);
    setHealthStatus({ status: 'healthy', recentFailures: 0, checkoutAttempts: 0 });
  };
  
  return (
    <div className="max-h-[85vh] overflow-hidden flex flex-col">
      <DialogHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <DialogTitle>Checkout Flow Analysis</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <DialogDescription>
          Troubleshoot checkout and navigation issues
        </DialogDescription>
      </DialogHeader>

      <Tabs 
        defaultValue="checkout" 
        className="w-full"
        value={selectedTab}
        onValueChange={setSelectedTab}
      >
        <div className="px-4">
          <TabsList className="w-full">
            <TabsTrigger value="checkout" className="flex-1">Checkout</TabsTrigger>
            <TabsTrigger value="navigation" className="flex-1">Navigation</TabsTrigger>
            <TabsTrigger value="summary" className="flex-1">Summary</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="checkout">
          <CheckoutTab checkoutLogs={checkoutLogs} />
        </TabsContent>
        
        <TabsContent value="navigation">
          <NavigationTab 
            navigationLogs={navigationLogs} 
            healthStatus={healthStatus} 
            onResetNavigation={handleResetNavigation} 
          />
        </TabsContent>
        
        <TabsContent value="summary">
          <SummaryTab 
            healthStatus={healthStatus}
            onResetNavigation={handleResetNavigation}
            onClearLogs={handleClearLogs}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CheckoutDebugger;
