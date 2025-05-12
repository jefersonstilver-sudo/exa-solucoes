
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Panel } from '@/types/panel';

interface ReviewStepProps {
  cartItems: { panel: Panel, duration: number }[];
  unavailablePanels: string[];
}

const ReviewStep: React.FC<ReviewStepProps> = ({ cartItems, unavailablePanels }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Revise seus painéis</h2>
      <div className="space-y-4">
        {cartItems.map((item) => (
          <Card key={item.panel.id} className={unavailablePanels.includes(item.panel.id) ? "border-red-400" : ""}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{item.panel.buildings?.nome}</h3>
                  <p className="text-sm text-muted-foreground">{item.panel.buildings?.endereco}</p>
                  <p className="text-sm mt-1">{item.panel.buildings?.bairro}</p>
                </div>
                {unavailablePanels.includes(item.panel.id) && (
                  <div className="flex items-center text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Indisponível para o período selecionado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReviewStep;
