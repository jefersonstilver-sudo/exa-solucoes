import React, { useEffect, useState } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllCheckoutLogs, getCheckoutAuditSummary, LogLevel } from '@/services/checkoutDebugService';
import { getAllNavigationLogs, checkNavigationHealth } from '@/services/navigationAuditService';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Info, CheckCircle, XCircle, Clock } from 'lucide-react';

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
  
  const getIconForLogLevel = (level: string) => {
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
  
  const getAuditSummary = () => {
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
  
  return (
    <div className="max-h-[85vh] overflow-hidden flex flex-col">
      <DialogHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <DialogTitle>Checkout Diagnostics</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <DialogDescription>
          Checkout flow analysis tools
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
        
        <TabsContent value="checkout" className="p-4 mt-2 max-h-[70vh] overflow-y-auto">
          <h3 className="font-medium mb-3">Logs of Checkout</h3>
          <div className="space-y-2">
            {checkoutLogs.map((log, idx) => (
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
            
            {checkoutLogs.length === 0 && (
              <div className="text-center text-sm text-gray-500 p-4">
                No checkout logs registered
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="navigation" className="p-4 mt-2 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center mb-3">
            <h3 className="font-medium">Logs of Navigation</h3>
            <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
              healthStatus.status === 'issues' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {healthStatus.status === 'issues' ? 'With issues' : 'Healthy'}
            </span>
          </div>
          
          <div className="space-y-2">
            {navigationLogs.map((log, idx) => (
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
            
            {navigationLogs.length === 0 && (
              <div className="text-center text-sm text-gray-500 p-4">
                No navigation logs registered
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="summary" className="p-4 mt-2">
          <h3 className="font-medium mb-3">System Summary</h3>
          
          <div className="space-y-4">
            {getAuditSummary()}
            
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <h4 className="font-medium mb-2">Navigation</h4>
              <div className="flex justify-between mb-2">
                <span>Status:</span>
                <span className={`font-medium ${
                  healthStatus.status === 'issues' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {healthStatus.status === 'issues' ? 'With issues' : 'Healthy'}
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
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => {
                  localStorage.removeItem('checkout_debug_logs');
                  localStorage.removeItem('navigation_audit_logs');
                  setCheckoutLogs([]);
                  setNavigationLogs([]);
                  setHealthStatus({ status: 'healthy', recentFailures: 0, checkoutAttempts: 0 });
                }}
              >
                Clear all logs
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CheckoutDebugger;
