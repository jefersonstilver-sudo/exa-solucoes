import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EnhancedContractStatusCard from './EnhancedContractStatusCard';

interface CollapsibleContractStatusProps {
  orderId: string;
  orderDetails: any;
}

export const CollapsibleContractStatus: React.FC<CollapsibleContractStatusProps> = ({
  orderId,
  orderDetails
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Card 
        className="shadow-sm cursor-pointer hover:bg-accent/50 transition-colors" 
        onClick={() => setIsOpen(true)}
      >
        <CardHeader className="p-2 sm:p-3">
          <CardTitle className="flex items-center justify-between text-sm sm:text-base">
            <span>📊 Status do Contrato</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer"
        onClick={() => setIsOpen(false)}
      >
        <span className="text-xs sm:text-sm font-medium">📊 Status do Contrato</span>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </div>
      <EnhancedContractStatusCard
        orderId={orderId}
        orderDetails={orderDetails}
      />
    </div>
  );
};
