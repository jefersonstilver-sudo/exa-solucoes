
import React from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Bug } from 'lucide-react';

const CheckoutDebugger: React.FC = () => {
  // Simple implementation for the debugger component
  // This is a placeholder that can be expanded later
  return (
    <div className="mt-4 flex items-center justify-end">
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-gray-500 flex items-center gap-1"
        onClick={() => console.log('Checkout debug requested')}
      >
        <Bug className="h-3 w-3" />
        <span>Debug</span>
      </Button>
    </div>
  );
};

export default CheckoutDebugger;
