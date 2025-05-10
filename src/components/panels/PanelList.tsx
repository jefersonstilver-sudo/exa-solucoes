
import React from 'react';
import { Check, CheckCircle, Building, MapPin, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from '@/types/panel';

interface PanelListProps {
  panels: Panel[];
  isLoading: boolean;
  cartItems: {panel: Panel, duration: number}[];
  onAddToCart: (panel: Panel, duration?: number) => void;
}

const durationOptions = [
  { days: 30, discount: 0 },
  { days: 60, discount: 5 },
  { days: 90, discount: 10 }
];

const PanelList: React.FC<PanelListProps> = ({ 
  panels, 
  isLoading, 
  cartItems, 
  onAddToCart 
}) => {
  // Calculate if a panel is in cart
  const isPanelInCart = (panelId: string) => {
    return cartItems.some(item => item.panel.id === panelId);
  };
  
  // Simulate pricing based on panel info
  const calculatePrice = (panel: Panel, days = 30) => {
    // In a real implementation, this would come from the backend
    // Here we're using a simple formula for demonstration
    const basePrice = 100; // Base daily rate
    const locationFactor = panel.buildings?.bairro === 'Vila Olímpia' ? 1.5 : 
                          panel.buildings?.bairro === 'Moema' ? 1.3 : 1;
    
    return Math.round(basePrice * locationFactor * days);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex items-center mb-2">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="flex items-center mb-4">
                  <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Building className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-semibold mb-1">Nenhum painel encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Tente ajustar seus filtros ou buscar em outra localização.
        </p>
        <p className="text-sm text-muted-foreground">
          Dica: Amplie o raio de busca ou remova alguns filtros para ver mais resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8 animate-fade-in">
      {panels.map(panel => (
        <Card key={panel.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className="p-6">
              <h3 className="font-semibold text-lg mb-1">{panel.buildings?.nome}</h3>
              <div className="flex items-start mb-3">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {panel.buildings?.endereco}, {panel.buildings?.bairro}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="bg-gray-50">
                  {panel.resolucao || '1080p'}
                </Badge>
                <Badge variant="outline" className="bg-gray-50">
                  {panel.buildings?.bairro}
                </Badge>
                {panel.modo && (
                  <Badge variant="outline" className="bg-gray-50">
                    {panel.modo}
                  </Badge>
                )}
                <Badge className={`${panel.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                  {panel.status === 'online' ? 'Ativo' : 'Instalando'}
                </Badge>
              </div>
              
              <div className="flex items-center mb-2">
                <User className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm">
                  <span className="font-medium">1.200</span> visualizações mensais estimadas
                </span>
              </div>
              
              <div className="flex items-center mb-4">
                <Clock className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm">
                  Última sincronização: {panel.ultima_sync ? new Date(panel.ultima_sync).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {durationOptions.map(option => {
                  const price = calculatePrice(panel, option.days);
                  const discountedPrice = price * (1 - (option.discount / 100));
                  
                  return (
                    <div
                      key={option.days}
                      className="border rounded p-2 text-center cursor-pointer hover:border-indexa-purple transition-colors"
                      onClick={() => onAddToCart(panel, option.days)}
                    >
                      <div className="font-medium text-sm mb-1">{option.days} dias</div>
                      <div className="text-sm font-semibold">
                        {formatCurrency(discountedPrice)}
                        {option.discount > 0 && (
                          <span className="block text-xs text-green-600">-{option.discount}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Button 
                className={`w-full ${isPanelInCart(panel.id) ? 'bg-green-600 hover:bg-green-700' : 'bg-indexa-purple hover:bg-indexa-purple-dark'}`}
                onClick={() => onAddToCart(panel)}
                disabled={isPanelInCart(panel.id)}
              >
                {isPanelInCart(panel.id) ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Adicionado ao carrinho
                  </>
                ) : (
                  <>
                    Adicionar ao carrinho
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PanelList;
