
import React from 'react';
import { motion } from 'framer-motion';
import { Building, AlertTriangle } from 'lucide-react';
import { Panel } from '@/types/panel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, daysToMonths } from '@/utils/priceUtils';

interface ReviewStepProps {
  cartItems: { panel: Panel; duration: number }[];
  unavailablePanels: string[];
}

const ReviewStep: React.FC<ReviewStepProps> = ({ cartItems, unavailablePanels }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="mr-2">📋</span>
          Revisão do Pedido
        </h2>
        <p className="text-sm text-muted-foreground">
          Confira os painéis selecionados para sua campanha
        </p>
      </div>
      
      {unavailablePanels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-orange-50 p-4 border border-orange-200 rounded-md"
        >
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Painéis indisponíveis para o período selecionado
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>
                  {unavailablePanels.length} {unavailablePanels.length === 1 ? 'painel' : 'painéis'} não {unavailablePanels.length === 1 ? 'está' : 'estão'} disponível para o período selecionado.
                  Por favor, ajuste o período ou selecione outros painéis.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="space-y-4">
        {cartItems.map((item, index) => {
          const isPanelUnavailable = unavailablePanels.includes(item.panel.id);
          
          return (
            <motion.div
              key={item.panel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
            >
              <Card className={isPanelUnavailable ? 'border-orange-300' : undefined}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-md bg-gray-100">
                      {item.panel.buildings?.imageUrl ? (
                        <img 
                          src={item.panel.buildings.imageUrl} 
                          alt={item.panel.buildings?.nome || 'Building image'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <Building className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between">
                        <h4 className="font-medium text-gray-900">
                          {item.panel.buildings?.nome || 'Painel Digital'}
                        </h4>
                        
                        <div className="text-right">
                          <span className="text-indexa-purple font-semibold">
                            {formatCurrency(250 * daysToMonths(item.duration))}
                          </span>
                          <p className="text-xs text-gray-500">
                            {daysToMonths(item.duration)} {daysToMonths(item.duration) === 1 ? 'mês' : 'meses'}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-1">
                        {item.panel.buildings?.endereco || 'Endereço não disponível'}
                      </p>
                      
                      <div className="flex gap-2 mt-2">
                        <Badge variant={isPanelUnavailable ? 'destructive' : 'outline'} className="text-xs">
                          {item.panel.buildings?.bairro || 'Localização não disponível'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.panel.modo || 'indoor'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.panel.resolucao || 'HD'}
                        </Badge>
                      </div>
                      
                      {isPanelUnavailable && (
                        <p className="mt-2 text-xs text-orange-600 flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Indisponível para o período selecionado
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewStep;
