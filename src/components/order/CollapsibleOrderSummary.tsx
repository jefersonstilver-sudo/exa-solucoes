import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderSummaryCard } from './OrderSummaryCard';

interface CollapsibleOrderSummaryProps {
  orderDetails: any;
  displayPanels: any[];
  isRecovered?: boolean;
  totalScreens: number;
  totalAudience: number;
}

export const CollapsibleOrderSummary: React.FC<CollapsibleOrderSummaryProps> = ({
  orderDetails,
  displayPanels,
  isRecovered,
  totalScreens,
  totalAudience
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
            <span>📦 Resumo do Pedido</span>
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
        <span className="text-xs sm:text-sm font-medium">📦 Resumo do Pedido</span>
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      </div>
      <OrderSummaryCard
        orderDetails={orderDetails}
        displayPanels={displayPanels}
        isRecovered={isRecovered}
        totalScreens={totalScreens}
        totalAudience={totalAudience}
      />
    </div>
  );
};
